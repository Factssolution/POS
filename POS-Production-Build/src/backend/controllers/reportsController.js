const { Order, OrderItem, Product, Supplier, Transaction, User, Employee } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

// Supplier Report - Complete with transaction aggregations
exports.getSupplierReport = async (req, res) => {
  try {
    const { startDate, endDate, supplierIds } = req.query;

    console.log('\n========== SUPPLIER REPORT REQUEST ==========');
    console.log('🔍 BACKEND - Full req.query object:', JSON.stringify(req.query, null, 2));
    console.log('🔍 BACKEND - startDate:', startDate);
    console.log(' BACKEND - endDate:', endDate);
    console.log('🔍 BACKEND - supplierIds (raw):', supplierIds);
    console.log(' BACKEND - supplierIds type:', typeof supplierIds);
    console.log('=============================================\n');

    // Get suppliers - filter by specific suppliers if provided
    const supplierWhere = {};
    if (supplierIds && supplierIds !== 'all') {
      // Parse comma-separated IDs: "1,3,4" -> [1, 3, 4]
      const idsArray = supplierIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      
      console.log(' BACKEND - Parsed IDs array:', idsArray);
      console.log('🔍 BACKEND - IDs array length:', idsArray.length);
      
      if (idsArray.length > 0) {
        supplierWhere.id = { [Op.in]: idsArray };
        console.log('✅ BACKEND - WHERE clause:', JSON.stringify(supplierWhere));
        console.log('✅ BACKEND - Filtering supplier report by IDs:', idsArray);
      } else {
        console.log('⚠️ BACKEND - Invalid supplier IDs (empty array after parse), fetching all');
      }
    } else {
      console.log('📦 BACKEND - No filter - fetching all suppliers');
      console.log('📦 BACKEND - Reason:', !supplierIds ? 'supplierIds is undefined/null' : 'supplierIds equals "all"');
    }

    const suppliers = await Supplier.findAll({
      where: supplierWhere,
      order: [['name', 'ASC']]
    });

    // Calculate transaction-based metrics for each supplier
    const supplierReport = await Promise.all(suppliers.map(async (supplier) => {
      // Get all transactions for this supplier
      const transactionWhere = { supplier_id: supplier.id };
      
      if (startDate && endDate) {
        // Add one day to endDate to handle timezone differences
        const endDateObj = new Date(endDate);
        endDateObj.setDate(endDateObj.getDate() + 1);
        const adjustedEndDate = endDateObj.toISOString().split('T')[0];
        
        transactionWhere.transaction_date = {
          [Op.between]: [startDate, adjustedEndDate]
        };
      }

      const transactions = await Transaction.findAll({
        where: transactionWhere
      });

      // Calculate totals
      const totalCredit = transactions
        .filter(t => t.type === 'credit')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const totalDebit = transactions
        .filter(t => t.type === 'debit')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const openingBalance = parseFloat(supplier.opening_balance || 0);
      const currentBalance = openingBalance + totalCredit - totalDebit;
      // Total Purchases = Opening Balance + All Credits (purchases)
      const totalPurchases = openingBalance + totalCredit;
      const outstanding = currentBalance > 0 ? currentBalance : 0; // Positive balance = outstanding

      return {
        id: supplier.id,
        name: supplier.name,
        contact: supplier.contact,
        email: supplier.email,
        status: supplier.status,
        opening_balance: openingBalance,
        totalPurchases: Math.round(totalPurchases),
        totalCredit: Math.round(totalCredit),
        totalDebit: Math.round(totalDebit),
        current_balance: Math.round(currentBalance),
        outstanding: Math.round(outstanding),
        transactionCount: transactions.length,
        created_at: supplier.created_at
      };
    }));

    res.json({
      success: true,
      data: {
        suppliers: supplierReport,
        summary: {
          totalSuppliers: supplierReport.length,
          activeSuppliers: supplierReport.filter(s => s.status === 'active').length,
          totalPurchases: supplierReport.reduce((sum, s) => sum + s.totalPurchases, 0),
          totalOutstanding: supplierReport.reduce((sum, s) => sum + s.outstanding, 0)
        }
      }
    });
    
    console.log('\n========== SUPPLIER REPORT RESPONSE ==========');
    console.log('✅ BACKEND - Response supplier count:', supplierReport.length);
    console.log('✅ BACKEND - Response supplier IDs:', supplierReport.map(s => s.id));
    console.log('✅ BACKEND - Response supplier names:', supplierReport.map(s => s.name));
    console.log('=============================================\n');
  } catch (error) {
    console.error('Get supplier report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch supplier report',
      error: error.message
    });
  }
};

// Employee Report - Complete with order aggregations
exports.getEmployeeReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Get all users (employees/cashiers) - exclude deleted users
    const users = await User.findAll({
      where: { status: 'active' },
      order: [['name', 'ASC']]
    });

    // Calculate order-based metrics for each user
    const employeeReport = await Promise.all(users.map(async (user) => {
      // Get all orders for this user (cashier_id = user.id)
      const orderWhere = { cashier_id: user.id };
      
      if (startDate && endDate) {
        // Add one day to endDate to handle timezone differences (UTC vs local time)
        const endDateObj = new Date(endDate);
        endDateObj.setDate(endDateObj.getDate() + 1);
        const adjustedEndDate = endDateObj.toISOString().split('T')[0];
            
        orderWhere.created_at = {
          [Op.between]: [startDate, adjustedEndDate]
        };
      }

      const orders = await Order.findAll({
        where: orderWhere,
        include: [
          {
            model: OrderItem,
            as: 'items',
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'cost_price']
              }
            ]
          }
        ]
      });

      // Calculate totals
      const totalOrders = orders.length;
      const totalSales = orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
      const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
      
      // Calculate profit
      let totalCost = 0;
      orders.forEach(order => {
        order.items.forEach(item => {
          const costPrice = item.product?.cost_price || 0;
          totalCost += parseFloat(costPrice) * parseInt(item.quantity || 0);
        });
      });
      
      const totalProfit = totalSales - totalCost;
      const profitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        totalOrders,
        totalSales: Math.round(totalSales),
        avgOrderValue: Math.round(avgOrderValue),
        totalProfit: Math.round(totalProfit),
        profitMargin: Math.round(profitMargin),
        created_at: user.created_at
      };
    }));

    // Calculate summary
    const summary = {
      totalEmployees: employeeReport.length,
      totalSales: employeeReport.reduce((sum, e) => sum + e.totalSales, 0),
      totalOrders: employeeReport.reduce((sum, e) => sum + e.totalOrders, 0),
      avgPerformance: employeeReport.length > 0 
        ? Math.round(employeeReport.reduce((sum, e) => sum + e.totalSales, 0) / employeeReport.length) 
        : 0
    };

    res.json({
      success: true,
      data: {
        employees: employeeReport,
        summary
      }
    });
  } catch (error) {
    console.error('Get employee report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee report',
      error: error.message
    });
  }
};

exports.getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = { status: 'completed' };

    if (startDate && endDate) {
      // Add one day to endDate to handle timezone differences (UTC vs local time)
      const endDateObj = new Date(endDate);
      endDateObj.setDate(endDateObj.getDate() + 1);
      const adjustedEndDate = endDateObj.toISOString().split('T')[0];
      
      where.created_at = {
        [Op.between]: [startDate, adjustedEndDate]
      };
    }

    const orders = await Order.findAll({
      where,
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'category', 'cost_price']
            }
          ]
        },
        {
          model: User,
          as: 'cashier',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // Calculate report metrics
    let totalRevenue = 0;
    let totalCost = 0;
    let totalTax = 0;
    const productSales = {};

    orders.forEach(order => {
      totalRevenue += parseFloat(order.total_amount);
      totalTax += parseFloat(order.tax_amount);

      order.items.forEach(item => {
        const productId = item.product_id;
        if (!productSales[productId]) {
          productSales[productId] = {
            product_id: productId,
            product_name: item.product?.name || item.product_name || 'Unknown Product',
            quantity: 0,
            revenue: 0,
            cost: 0
          };
        }
        productSales[productId].quantity += item.quantity;
        productSales[productId].revenue += parseFloat(item.total);
        productSales[productId].cost += parseFloat(item.price) * item.quantity * 0.7; // Approximate cost
      });
    });

    totalCost = Object.values(productSales).reduce((sum, p) => sum + p.cost, 0);
    const profit = totalRevenue - totalCost;

    // Calculate daily sales breakdown
    const dailySalesMap = {};
    orders.forEach(order => {
      // Use createdAt (Sequelize field name) instead of created_at
      const orderDate = new Date(order.createdAt || order.created_at);
      if (isNaN(orderDate.getTime())) {
        console.warn('Invalid date for order:', order.id, order.createdAt || order.created_at);
        return; // Skip invalid dates
      }
      const date = orderDate.toISOString().split('T')[0];
      if (!dailySalesMap[date]) {
        dailySalesMap[date] = {
          date: date,
          orders: 0,
          revenue: 0
        };
      }
      dailySalesMap[date].orders += 1;
      dailySalesMap[date].revenue += parseFloat(order.total_amount);
    });

    const dailySales = Object.values(dailySalesMap)
      .map(day => ({
        ...day,
        revenue: parseFloat(day.revenue.toFixed(2))
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      success: true,
      data: {
        totalSales: parseFloat(totalRevenue.toFixed(2)),
        totalOrders: orders.length,
        totalCost: parseFloat(totalCost.toFixed(2)),
        totalTax: parseFloat(totalTax.toFixed(2)),
        profit: parseFloat(profit.toFixed(2)),
        dailySales: dailySales,
        productSales: Object.values(productSales).map(p => ({
          ...p,
          quantity: parseInt(p.quantity),
          revenue: parseFloat(p.revenue.toFixed(2)),
          cost: parseFloat(p.cost.toFixed(2))
        })),
        orders: orders.map(order => ({
          ...order.toJSON(),
          subtotal: parseFloat(order.subtotal),
          tax_amount: parseFloat(order.tax_amount),
          total_amount: parseFloat(order.total_amount),
          items: order.items.map(item => ({
            ...item.toJSON(),
            price: parseFloat(item.price),
            total: parseFloat(item.total)
          }))
        }))
      }
    });
  } catch (error) {
    console.error('Get sales report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate sales report',
      error: error.message
    });
  }
};

exports.getInventoryReport = async (req, res) => {
  try {
    const { category, status } = req.query;

    const where = {};

    if (category) {
      where.category = category;
    }

    if (status) {
      where.status = status;
    }

    const products = await Product.findAll({
      where,
      order: [['stock', 'ASC']]
    });

    // Calculate inventory value
    const totalValue = products.reduce((sum, product) => {
      return sum + (parseFloat(product.cost_price) * product.stock);
    }, 0);

    const lowStockProducts = products.filter(p => p.stock <= p.min_stock);

    res.json({
      success: true,
      data: {
        totalProducts: products.length,
        totalValue: parseFloat(totalValue.toFixed(2)),
        lowStockCount: lowStockProducts.length,
        products: products.map(p => ({
          ...p.toJSON(),
          price: parseFloat(p.price),
          cost_price: parseFloat(p.cost_price),
          stock: p.stock,
          min_stock: p.min_stock,
          value: parseFloat((parseFloat(p.cost_price) * p.stock).toFixed(2))
        })),
        lowStockProducts: lowStockProducts.map(p => ({
          ...p.toJSON(),
          price: parseFloat(p.price),
          cost_price: parseFloat(p.cost_price)
        }))
      }
    });
  } catch (error) {
    console.error('Get inventory report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate inventory report',
      error: error.message
    });
  }
};

exports.getTransactionReport = async (req, res) => {
  try {
    const { supplier_id, startDate, endDate } = req.query;

    const where = {};

    if (supplier_id) {
      where.supplier_id = supplier_id;
    }

    if (startDate && endDate) {
      // Add one day to endDate to handle timezone differences
      const endDateObj = new Date(endDate);
      endDateObj.setDate(endDateObj.getDate() + 1);
      const adjustedEndDate = endDateObj.toISOString().split('T')[0];
      
      where.transaction_date = {
        [Op.between]: [startDate, adjustedEndDate]
      };
    }

    // Fetch transactions with supplier details
    const transactions = await Transaction.findAll({
      where,
      include: [
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'name', 'contact', 'email', 'address', 'status', 'opening_balance']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['transaction_date', 'ASC'], ['transaction_time', 'ASC']]
    });

    const totalCredit = transactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalDebit = transactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    // Calculate opening balance (before period start)
    let openingBalance = 0;
    if (startDate && endDate) {
      const openingTransactions = await Transaction.findAll({
        where: {
          supplier_id: supplier_id || { [Op.ne]: null },
          transaction_date: { [Op.lt]: startDate }
        }
      });
      
      const openingCredit = openingTransactions
        .filter(t => t.type === 'credit')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const openingDebit = openingTransactions
        .filter(t => t.type === 'debit')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      openingBalance = openingCredit - openingDebit;
    }

    const closingBalance = openingBalance + totalCredit - totalDebit;
    const avgTransactionValue = transactions.length > 0 
      ? (totalCredit + totalDebit) / transactions.length 
      : 0;

    // Find largest transactions
    const creditTransactions = transactions.filter(t => t.type === 'credit');
    const debitTransactions = transactions.filter(t => t.type === 'debit');
    const largestCredit = creditTransactions.length > 0 
      ? Math.max(...creditTransactions.map(t => parseFloat(t.amount)))
      : 0;
    const largestDebit = debitTransactions.length > 0 
      ? Math.max(...debitTransactions.map(t => parseFloat(t.amount)))
      : 0;

    const creditToDebitRatio = totalDebit > 0 ? (totalCredit / totalDebit) : 0;

    // Calculate running balance PER SUPPLIER (same logic as transactionController)
    console.log(`📊 Calculating running balances for ${transactions.length} transactions...`);
    
    const supplierBalances = {};
    
    // Initialize all suppliers with their opening balances
    transactions.forEach(t => {
      const supplierId = t.supplier_id;
      if (!supplierBalances[supplierId]) {
        const openingBalance = parseFloat(t.supplier?.opening_balance || 0);
        supplierBalances[supplierId] = openingBalance;
        console.log(`   Supplier ${t.supplier?.name} (ID: ${supplierId}): Opening Balance = Rs ${openingBalance}`);
      }
    });
    
    // Calculate running balance in chronological order (ASC)
    const transactionsWithRunningBalance = transactions.map(t => {
      const supplierId = t.supplier_id;
      const amount = parseFloat(t.amount);
      
      // Update THIS SUPPLIER'S running balance
      if (t.type === 'credit') {
        supplierBalances[supplierId] += amount;
      } else if (t.type === 'debit') {
        supplierBalances[supplierId] -= amount;
      }
      
      const runningBalance = supplierBalances[supplierId];
      
      console.log(`   Transaction ${t.id}: ${t.supplier?.name} | ${t.type} Rs ${amount} | Running: Rs ${runningBalance}`);
      
      return {
        ...t.toJSON(),
        amount: amount,
        running_balance: parseFloat(runningBalance.toFixed(2)),
        supplier_opening_balance: parseFloat(t.supplier?.opening_balance || 0)
      };
    });

    res.json({
      success: true,
      data: {
        totalTransactions: transactions.length,
        totalCredit: parseFloat(totalCredit.toFixed(2)),
        totalDebit: parseFloat(totalDebit.toFixed(2)),
        netBalance: parseFloat((totalCredit - totalDebit).toFixed(2)),
        openingBalance: parseFloat(openingBalance.toFixed(2)),
        closingBalance: parseFloat(closingBalance.toFixed(2)),
        avgTransactionValue: parseFloat(avgTransactionValue.toFixed(2)),
        largestCredit: parseFloat(largestCredit.toFixed(2)),
        largestDebit: parseFloat(largestDebit.toFixed(2)),
        creditToDebitRatio: parseFloat(creditToDebitRatio.toFixed(2)),
        transactions: transactionsWithRunningBalance.map(t => {
          const transactionDate = new Date(t.transaction_date);
          const daysAgo = Math.floor((Date.now() - transactionDate.getTime()) / (1000 * 60 * 60 * 24));
          
          // Format time robustly
          let formattedTime = 'N/A';
          if (t.transaction_time) {
            try {
              const timeStr = t.transaction_time.toString();
              const timeParts = timeStr.split(':');
              if (timeParts.length >= 2) {
                const hours = parseInt(timeParts[0]);
                const minutes = parseInt(timeParts[1]);
                const period = hours >= 12 ? 'PM' : 'AM';
                const displayHours = hours % 12 || 12;
                const displayMinutes = minutes.toString().padStart(2, '0');
                formattedTime = `${displayHours}:${displayMinutes} ${period}`;
              }
            } catch (error) {
              console.warn('⚠️ Time formatting error:', error);
              formattedTime = t.transaction_time || 'N/A';
            }
          }
          
          return {
            ...t,
            amount: parseFloat(t.amount),
            running_balance: parseFloat(t.running_balance.toFixed(2)),
            days_ago: daysAgo,
            formatted_date: transactionDate.toLocaleDateString('en-GB'),
            formatted_time: formattedTime
          };
        })
      }
    });
  } catch (error) {
    console.error('Get transaction report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate transaction report',
      error: error.message
    });
  }
};

// Get comprehensive Customer Report with complete order history
exports.getCustomerReport = async (req, res) => {
  try {
    const { startDate, endDate, search } = req.query;

    // Base where clause for orders with customer information
    const where = {
      customer_name: { [Op.ne]: null },
      customer_phone: { [Op.ne]: null },
      status: 'completed'
    };

    if (startDate && endDate) {
      // Add one day to endDate to handle timezone differences
      const endDateObj = new Date(endDate);
      endDateObj.setDate(endDateObj.getDate() + 1);
      const adjustedEndDate = endDateObj.toISOString().split('T')[0];
      
      where.created_at = {
        [Op.between]: [startDate, adjustedEndDate]
      };
    }

    // Fetch all orders with customer information
    const orders = await Order.findAll({
      where,
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'category']
            }
          ]
        },
        {
          model: User,
          as: 'cashier',
          attributes: ['id', 'name']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // Aggregate customer data
    const customerMap = {};

    orders.forEach(order => {
      const phone = order.customer_phone;
      const name = order.customer_name;
      
      if (!customerMap[phone]) {
        customerMap[phone] = {
          phone: phone,
          name: name,
          totalVisits: 0,
          totalOrders: 0,
          totalSpent: 0,
          averageOrderValue: 0,
          firstVisit: order.created_at,
          lastVisit: order.created_at,
          orders: [],
          favoriteProducts: {},
          paymentMethods: {}
        };
      }

      // Update customer data
      const customer = customerMap[phone];
      customer.totalVisits++;
      customer.totalOrders++;
      customer.totalSpent += parseFloat(order.total_amount);
      
      // Update first and last visit
      const orderDate = new Date(order.created_at);
      if (new Date(customer.firstVisit) > orderDate) {
        customer.firstVisit = order.created_at;
      }
      if (new Date(customer.lastVisit) < orderDate) {
        customer.lastVisit = order.created_at;
      }

      // Track payment methods
      customer.paymentMethods[order.payment_method] = (customer.paymentMethods[order.payment_method] || 0) + 1;

      // Track favorite products
      order.items.forEach(item => {
        const productName = item.product_name;
        if (!customer.favoriteProducts[productName]) {
          customer.favoriteProducts[productName] = {
            name: productName,
            category: item.product?.category || 'Unknown',
            quantity: 0,
            revenue: 0
          };
        }
        customer.favoriteProducts[productName].quantity += item.quantity;
        customer.favoriteProducts[productName].revenue += parseFloat(item.total);
      });

      // Add order to history
      customer.orders.push({
        id: order.id,
        token_number: order.token_number,
        date: order.created_at ? new Date(order.created_at).toISOString() : null,
        items: order.items.map(item => ({
          product_name: item.product_name,
          quantity: item.quantity,
          price: parseFloat(item.price),
          total: parseFloat(item.total)
        })),
        subtotal: parseFloat(order.subtotal),
        tax: parseFloat(order.tax_amount),
        total: parseFloat(order.total_amount),
        payment_method: order.payment_method,
        cashier: order.cashier?.name || 'Unknown'
      });
    });

    // Calculate averages and convert to array
    let customers = Object.values(customerMap).map(customer => {
      customer.averageOrderValue = customer.totalSpent / customer.totalOrders;
      customer.totalSpent = parseFloat(customer.totalSpent.toFixed(2));
      customer.averageOrderValue = parseFloat(customer.averageOrderValue.toFixed(2));
      
      // Ensure dates are properly formatted as ISO strings
      if (customer.firstVisit) {
        customer.firstVisit = new Date(customer.firstVisit).toISOString();
      }
      if (customer.lastVisit) {
        customer.lastVisit = new Date(customer.lastVisit).toISOString();
      }
      
      console.log('📊 Customer Date Check:', {
        name: customer.name,
        phone: customer.phone,
        firstVisit: customer.firstVisit,
        lastVisit: customer.lastVisit,
        lastVisitType: typeof customer.lastVisit
      });
      
      // Get top 5 favorite products
      customer.topProducts = Object.values(customer.favoriteProducts)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5)
        .map(p => ({
          ...p,
          revenue: parseFloat(p.revenue.toFixed(2))
        }));
      
      // Get most used payment method
      customer.preferredPayment = Object.entries(customer.paymentMethods)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'cash';
      
      delete customer.favoriteProducts;
      delete customer.paymentMethods;

      return customer;
    });

    // Filter by search if provided
    if (search) {
      const searchLower = search.toLowerCase();
      customers = customers.filter(c => 
        c.name.toLowerCase().includes(searchLower) || 
        c.phone.includes(searchLower)
      );
    }

    // Sort by total spent (descending)
    customers.sort((a, b) => b.totalSpent - a.totalSpent);

    // Calculate summary statistics
    const summary = {
      totalCustomers: customers.length,
      totalRevenue: parseFloat(customers.reduce((sum, c) => sum + c.totalSpent, 0).toFixed(2)),
      averageCustomerValue: parseFloat((customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length).toFixed(2)),
      averageVisitsPerCustomer: parseFloat((customers.reduce((sum, c) => sum + c.totalVisits, 0) / customers.length).toFixed(2)),
      topCustomer: customers.length > 0 ? {
        name: customers[0].name,
        phone: customers[0].phone,
        totalSpent: customers[0].totalSpent
      } : null
    };

    res.json({
      success: true,
      data: {
        summary,
        customers,
        totalCustomers: customers.length
      }
    });
  } catch (error) {
    console.error('Get customer report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate customer report',
      error: error.message
    });
  }
};

// Get single customer complete history
exports.getCustomerHistory = async (req, res) => {
  try {
    const { phone } = req.params;

    const orders = await Order.findAll({
      where: {
        customer_phone: phone,
        status: 'completed'
      },
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'category']
            }
          ]
        },
        {
          model: User,
          as: 'cashier',
          attributes: ['id', 'name']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No orders found for this customer'
      });
    }

    const customer = {
      name: orders[0].customer_name,
      phone: orders[0].customer_phone,
      totalOrders: orders.length,
      totalSpent: parseFloat(orders.reduce((sum, o) => sum + parseFloat(o.total_amount), 0).toFixed(2)),
      orders: orders.map(order => ({
        id: order.id,
        token_number: order.token_number,
        date: order.created_at,
        items: order.items.map(item => ({
          product_name: item.product_name,
          category: item.product?.category || 'Unknown',
          quantity: item.quantity,
          price: parseFloat(item.price),
          total: parseFloat(item.total)
        })),
        subtotal: parseFloat(order.subtotal),
        tax: parseFloat(order.tax_amount),
        total: parseFloat(order.total_amount),
        payment_method: order.payment_method,
        cashier: order.cashier?.name || 'Unknown'
      }))
    };

    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Get customer history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer history',
      error: error.message
    });
  }
};
