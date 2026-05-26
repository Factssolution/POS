const { Order, OrderItem, Product, User } = require('../models');
const { Op, fn, col } = require('sequelize');
const Sequelize = require('sequelize');
const { getBusinessDay, getDateRangeForTimeFrame, getShopHoursForDay } = require('../utils/tokenHelper');

/**
 * Get Dashboard Statistics
 * Role-based data access:
 * - Admin/Manager: See ALL orders and revenue
 * - Cashier: See ONLY their own processed orders
 */
exports.getStats = async (req, res) => {
  try {
    const { timeFrame = 'today', customStartDate, customEndDate } = req.query;
    
    const today = new Date();
    const todayShopHours = await getShopHoursForDay(today);
    const currentBusinessDay = getBusinessDay(today, todayShopHours);
    
    // Get date range based on time frame
    const dateRange = await getDateRangeForTimeFrame(timeFrame, customStartDate, customEndDate);

    const userId = req.user.id;
    const userRole = req.user.role;

    const baseWhere = { status: 'completed' };
    
    if (userRole === 'Cashier') {
      baseWhere.cashier_id = userId;
    }

    // Period stats (based on timeFrame)
    const periodWhere = {
      ...baseWhere,
      created_at: {
        [Op.gte]: new Date(dateRange.startDate),
        [Op.lte]: new Date(dateRange.endDate)
      }
    };
    
    const periodStats = await Order.findAndCountAll({
      where: periodWhere
    });

    const periodRevenue = await Order.sum('total_amount', {
      where: periodWhere
    });
    
    // Current business day token count
    const currentTokenCount = await Order.count({
      where: {
        status: 'completed',
        token_date: currentBusinessDay,
        ...(userRole === 'Cashier' ? { cashier_id: userId } : {})
      }
    });
    
    const currentTokenInfo = await Order.findOne({
      where: {
        status: 'completed',
        token_date: currentBusinessDay,
        ...(userRole === 'Cashier' ? { cashier_id: userId } : {})
      },
      order: [['token_number', 'DESC']]
    });

    // Total stats (all time)
    const totalOrders = await Order.count({
      where: baseWhere
    });

    const totalRevenue = await Order.sum('total_amount', {
      where: baseWhere
    });

    // Products count (Admin/Manager only)
    let totalProducts = 0;
    if (userRole === 'Admin' || userRole === 'Manager') {
      totalProducts = await Product.count({
        where: { status: 'active' }
      });
    }

    res.json({
      success: true,
      data: {
        // New shop-hours-aware fields
        period_orders: periodStats.count,
        period_revenue: parseFloat(periodRevenue || 0),
        current_token: currentTokenCount,
        current_token_formatted: currentTokenInfo 
          ? `TOKEN #${currentTokenInfo.token_number.toString().padStart(4, '0')}` 
          : 'TOKEN #0000',
        business_day: currentBusinessDay,
        date_range: dateRange,
        time_frame: timeFrame,
        
        // Legacy fields for backward compatibility
        today_orders: periodStats.count,
        today_revenue: parseFloat(periodRevenue || 0),
        total_orders: totalOrders,
        total_revenue: parseFloat(totalRevenue || 0),
        total_products: totalProducts
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats',
      error: error.message
    });
  }
};

/**
 * Get Sales Analytics with role-based filtering
 */
exports.getSalesAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Get current user from JWT token
    const userId = req.user.id;
    const userRole = req.user.role;

    // Build where clause based on user role
    const where = { status: 'completed' };

    // Cashiers can only see their own orders
    if (userRole === 'Cashier') {
      where.cashier_id = userId;
    }

    if (startDate && endDate) {
      // Convert dates to proper PostgreSQL timestamp comparison
      // Include the full day by adding time to end date
      const startDateTime = new Date(startDate);
      startDateTime.setHours(0, 0, 0, 0);
      
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      
      where.created_at = {
        [Op.between]: [startDateTime, endDateTime]
      };
      console.log(' Date filter applied:', { 
        startDate: startDateTime.toISOString(), 
        endDate: endDateTime.toISOString(),
        whereClause: where.created_at
      });
    } else {
      console.log(' No date filter - returning all data');
    }

    // Daily sales
    let dailySales;
    
    if (startDate && endDate) {
      // Use PostgreSQL DATE() function for accurate date comparison
      dailySales = await Order.findAll({
        where: {
          ...where,
          [Op.and]: [
            Sequelize.literal(`DATE(created_at) >= DATE('${startDate}')`),
            Sequelize.literal(`DATE(created_at) <= DATE('${endDate}')`)
          ]
        },
        attributes: [
          [fn('DATE', col('created_at')), 'date'],
          [fn('COUNT', col('id')), 'orders'],
          [fn('SUM', col('total_amount')), 'revenue'],
          [fn('MIN', col('token_number')), 'firstToken'],
          [fn('MAX', col('token_number')), 'lastToken']
        ],
        group: [fn('DATE', col('created_at'))],
        order: [[fn('DATE', col('created_at')), 'ASC']]
      });
      console.log(' Using PostgreSQL DATE() filter');
    } else {
      dailySales = await Order.findAll({
        where,
        attributes: [
          [fn('DATE', col('created_at')), 'date'],
          [fn('COUNT', col('id')), 'orders'],
          [fn('SUM', col('total_amount')), 'revenue'],
          [fn('MIN', col('token_number')), 'firstToken'],
          [fn('MAX', col('token_number')), 'lastToken']
        ],
        group: [fn('DATE', col('created_at'))],
        order: [[fn('DATE', col('created_at')), 'ASC']]
      });
      console.log(' No date filter - all data');
    }

    // Payment method breakdown
    const paymentBreakdown = await Order.findAll({
      where,
      attributes: [
        'payment_method',
        [fn('COUNT', col('id')), 'count'],
        [fn('SUM', col('total_amount')), 'total']
      ],
      group: ['payment_method']
    });

    res.json({
      success: true,
      data: {
        dailySales: dailySales.map(s => ({
          date: s.dataValues.date,
          orders: parseInt(s.dataValues.orders),
          revenue: parseFloat(s.dataValues.revenue)
        })),
        paymentBreakdown: paymentBreakdown.map(p => ({
          method: p.payment_method,
          count: parseInt(p.dataValues.count),
          amount: parseFloat(p.dataValues.total)
        }))
      }
    });
  } catch (error) {
    console.error('Get sales analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales analytics',
      error: error.message
    });
  }
};

/**
 * Get Low Stock Products
 * Only accessible by Admin and Manager roles
 */
exports.getLowStock = async (req, res) => {
  try {
    const userRole = req.user.role;

    // Only Admin and Manager can view low stock
    if (userRole === 'Cashier') {
      return res.json({
        success: true,
        data: {
          products: [],
          count: 0
        }
      });
    }

    const products = await Product.findAll({
      where: {
        stock: {
          [Op.lte]: Sequelize.col('min_stock')
        },
        status: 'active'
      },
      order: [['stock', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        products: products.map(p => ({
          id: p.id,
          name: p.name,
          category: p.category,
          stock: p.stock,
          min_stock: p.min_stock,
          price: parseFloat(p.price),
          cost_price: parseFloat(p.cost_price)
        })),
        count: products.length
      }
    });
  } catch (error) {
    console.error('Get low stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch low stock products',
      error: error.message
    });
  }
};
