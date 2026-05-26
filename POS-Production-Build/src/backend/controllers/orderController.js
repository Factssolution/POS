const { Order, OrderItem, Product, User } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { getNextTokenNumber, getBusinessDay, checkShopStatus, getShopHoursForDay } = require('../utils/tokenHelper');

exports.getAllOrders = async (req, res) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 50 } = req.query;
    
    const where = {};
    
    if (status) {
      where.status = status;
    }
    
    if (startDate && endDate) {
      where.created_at = {
        [Op.between]: [startDate, endDate]
      };
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'cashier',
          attributes: ['id', 'name']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      attributes: ['id', 'token_number', 'token_date', 'customer_name', 'customer_phone', 
                   'subtotal', 'tax_amount', 'total_amount', 'payment_method', 'status',
                   'cashier_id', 'created_at', 'updated_at']
    });

    res.json({
      success: true,
      data: {
        orders: rows.map(o => ({
          ...o.toJSON(),
          subtotal: parseFloat(o.subtotal),
          tax_amount: parseFloat(o.tax_amount),
          total_amount: parseFloat(o.total_amount),
          items: o.items ? o.items.map(item => ({
            ...item.toJSON(),
            price: parseFloat(item.price),
            total: parseFloat(item.total)
          })) : []
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'barcode']
            }
          ]
        },
        {
          model: User,
          as: 'cashier',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: {
        ...order.toJSON(),
        subtotal: parseFloat(order.subtotal),
        tax_amount: parseFloat(order.tax_amount),
        total_amount: parseFloat(order.total_amount),
        items: order.items.map(item => ({
          ...item.toJSON(),
          price: parseFloat(item.price),
          total: parseFloat(item.total)
        }))
      }
    });
  } catch (error) {
    console.error('Get order by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message
    });
  }
};

exports.createOrder = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { customer_name, customer_phone, payment_method, items } = req.body;

    if (!items || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item'
      });
    }

    // Get current time and determine business day
    const orderTime = new Date();
    const dayShopHours = await getShopHoursForDay(orderTime);
    const businessDay = getBusinessDay(orderTime, dayShopHours);
    
    // Get next token number for this business day
    const { token_number, formatted_token } = await getNextTokenNumber(businessDay, transaction);

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findByPk(item.product_id, { transaction });

      if (!product) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.product_id}`
        });
      }

      if (product.stock < item.quantity) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}`
        });
      }

      const itemTotal = parseFloat(product.price) * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product_id: product.id,
        product_name: product.name,
        quantity: item.quantity,
        price: product.price,
        total: itemTotal
      });

      // Decrement stock
      await product.decrement('stock', { by: item.quantity, transaction });
    }

    // Get tax rate from settings
    const { Settings } = require('../models');
    const taxSetting = await Settings.findOne({
      where: { setting_key: 'tax_rate' },
      transaction
    });

    const taxRate = taxSetting ? parseFloat(taxSetting.setting_value) : 0;
    const tax_amount = (subtotal * taxRate) / 100;
    const total_amount = subtotal + tax_amount;

    // Create order
    const order = await Order.create({
      token_number,
      token_date: businessDay,  // NEW: Track business day
      customer_name,
      customer_phone,
      subtotal,
      tax_amount,
      total_amount,
      payment_method: payment_method || 'cash',
      cashier_id: req.user.id,
      status: 'completed'
    }, { transaction });

    // Create order items
    await OrderItem.bulkCreate(
      orderItems.map(item => ({ ...item, order_id: order.id })),
      { transaction }
    );

    await transaction.commit();

    // Fetch complete order with items
    const completeOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: OrderItem,
          as: 'items'
        },
        {
          model: User,
          as: 'cashier',
          attributes: ['id', 'name']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        ...completeOrder.toJSON(),
        formatted_token: formatted_token,
        business_day: businessDay,
        subtotal: parseFloat(completeOrder.subtotal),
        tax_amount: parseFloat(completeOrder.tax_amount),
        total_amount: parseFloat(completeOrder.total_amount),
        items: completeOrder.items.map(item => ({
          ...item.toJSON(),
          price: parseFloat(item.price),
          total: parseFloat(item.total)
        }))
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findByPk(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    await order.update({ status });

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    await order.destroy();

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete order',
      error: error.message
    });
  }
};

exports.getOrderReceipt = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id, {
      include: [
        {
          model: OrderItem,
          as: 'items'
        },
        {
          model: User,
          as: 'cashier',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Fetch settings for receipt customization
    const { Settings } = require('../models');
    const settings = await Settings.findAll();
    const settingsObject = {};
    settings.forEach(setting => {
      settingsObject[setting.setting_key] = setting.setting_value;
    });

    // Map old keys to new keys for compatibility
    const mappedSettings = {
      ...settingsObject,
      logo: settingsObject.company_logo || settingsObject.logo,
      name: settingsObject.company_name || settingsObject.name,
      address: settingsObject.company_address || settingsObject.address,
      phone: settingsObject.company_phone || settingsObject.phone,
    };

    res.json({
      success: true,
      data: {
        order: {
          ...order.toJSON(),
          subtotal: parseFloat(order.subtotal),
          tax_amount: parseFloat(order.tax_amount),
          total_amount: parseFloat(order.total_amount),
          items: order.items.map((item, index) => ({
            ...item.toJSON(),
            index: index + 1,
            price: parseFloat(item.price),
            total: parseFloat(item.total)
          }))
        },
        settings: mappedSettings
      }
    });
  } catch (error) {
    console.error('Get order receipt error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order receipt',
      error: error.message
    });
  }
};

exports.getNextToken = async (req, res) => {
  try {
    const currentTime = new Date();
    const dayShopHours = await getShopHoursForDay(currentTime);
    const businessDay = getBusinessDay(currentTime, dayShopHours);
    const shopStatus = await checkShopStatus(currentTime);
    
    const { token_number, formatted_token } = await getNextTokenNumber(businessDay);
    
    res.json({
      success: true,
      data: {
        next_token: token_number,
        formatted_token: formatted_token,
        business_day: businessDay,
        shop_status: shopStatus,
        current_time: currentTime.toISOString()
      }
    });
  } catch (error) {
    console.error('Get next token error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get next token',
      error: error.message
    });
  }
};
