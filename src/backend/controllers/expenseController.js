const { Op } = require('sequelize');
const Expense = require('../models/Expense');
const User = require('../models/User');
const Supplier = require('../models/Supplier');

// Category labels for display
const CATEGORY_LABELS = {
  utilities: 'Utilities',
  rent: 'Rent',
  salary: 'Salary',
  maintenance: 'Maintenance',
  transportation: 'Transportation',
  office_supplies: 'Office Supplies',
  marketing: 'Marketing',
  food_beverages: 'Food & Beverages',
  insurance: 'Insurance',
  taxes: 'Taxes',
  equipment: 'Equipment',
  travel: 'Travel',
  communication: 'Communication',
  miscellaneous: 'Miscellaneous'
};

// Get all expenses with filtering and pagination
exports.getExpenses = async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      category, 
      status, 
      paymentMethod,
      search,
      page = 1,
      limit = 50,
      sortBy = 'expense_date',
      sortOrder = 'DESC'
    } = req.query;

    const where = {};

    // Date range filter
    if (startDate && endDate) {
      const endDateObj = new Date(endDate);
      endDateObj.setDate(endDateObj.getDate() + 1);
      where.expense_date = {
        [Op.between]: [startDate, endDateObj.toISOString().split('T')[0]]
      };
    }

    // Category filter
    if (category && category !== 'all') {
      where.category = category;
    }

    // Status filter
    if (status && status !== 'all') {
      where.status = status;
    }

    // Payment method filter
    if (paymentMethod && paymentMethod !== 'all') {
      where.payment_method = paymentMethod;
    }

    // Search filter
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { vendor_name: { [Op.iLike]: `%${search}%` } },
        { receipt_number: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: expenses } = await Expense.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'name', 'contact']
        }
      ],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset
    });

    // Calculate summary statistics
    const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    
    const expensesByCategory = {};
    expenses.forEach(exp => {
      if (!expensesByCategory[exp.category]) {
        expensesByCategory[exp.category] = {
          category: exp.category,
          label: CATEGORY_LABELS[exp.category] || exp.category,
          count: 0,
          total: 0
        };
      }
      expensesByCategory[exp.category].count++;
      expensesByCategory[exp.category].total += parseFloat(exp.amount);
    });

    const expensesByStatus = {
      pending: 0,
      approved: 0,
      rejected: 0
    };
    expenses.forEach(exp => {
      if (expensesByStatus[exp.status] !== undefined) {
        expensesByStatus[exp.status] += parseFloat(exp.amount);
      }
    });

    res.json({
      success: true,
      data: {
        expenses: expenses.map(exp => ({
          ...exp.toJSON(),
          amount: parseFloat(exp.amount)
        })),
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
        summary: {
          totalExpenses: parseFloat(totalExpenses.toFixed(2)),
          expensesByCategory: Object.values(expensesByCategory),
          expensesByStatus: expensesByStatus,
          averageExpense: expenses.length > 0 ? parseFloat((totalExpenses / expenses.length).toFixed(2)) : 0
        }
      }
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expenses',
      error: error.message
    });
  }
};

// Get expense statistics
exports.getExpenseStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const where = {};

    if (startDate && endDate) {
      const endDateObj = new Date(endDate);
      endDateObj.setDate(endDateObj.getDate() + 1);
      where.expense_date = {
        [Op.between]: [startDate, endDateObj.toISOString().split('T')[0]]
      };
    }

    const expenses = await Expense.findAll({ where });

    const totalAmount = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    
    const byCategory = {};
    expenses.forEach(exp => {
      if (!byCategory[exp.category]) {
        byCategory[exp.category] = {
          category: exp.category,
          label: CATEGORY_LABELS[exp.category] || exp.category,
          count: 0,
          total: 0
        };
      }
      byCategory[exp.category].count++;
      byCategory[exp.category].total += parseFloat(exp.amount);
    });

    const byMonth = {};
    expenses.forEach(exp => {
      const month = exp.expense_date.substring(0, 7); // YYYY-MM
      if (!byMonth[month]) {
        byMonth[month] = 0;
      }
      byMonth[month] += parseFloat(exp.amount);
    });

    const byPaymentMethod = {};
    expenses.forEach(exp => {
      if (!byPaymentMethod[exp.payment_method]) {
        byPaymentMethod[exp.payment_method] = 0;
      }
      byPaymentMethod[exp.payment_method] += parseFloat(exp.amount);
    });

    res.json({
      success: true,
      data: {
        totalExpenses: parseFloat(totalAmount.toFixed(2)),
        totalTransactions: expenses.length,
        averageExpense: expenses.length > 0 ? parseFloat((totalAmount / expenses.length).toFixed(2)) : 0,
        byCategory: Object.values(byCategory),
        byMonth: byMonth,
        byPaymentMethod: byPaymentMethod
      }
    });
  } catch (error) {
    console.error('Get expense stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expense statistics',
      error: error.message
    });
  }
};

// Get single expense
exports.getExpenseById = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'name', 'contact']
        }
      ]
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    res.json({
      success: true,
      data: {
        ...expense.toJSON(),
        amount: parseFloat(expense.amount)
      }
    });
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expense',
      error: error.message
    });
  }
};

// Create new expense
exports.createExpense = async (req, res) => {
  try {
    const {
      title,
      description,
      amount,
      category,
      expense_date,
      expense_time,
      payment_method,
      receipt_number,
      vendor_name,
      supplier_id,
      status
    } = req.body;

    // Validation
    if (!title || !amount || !category || !expense_date || !expense_time || !payment_method) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, amount, category, expense_date, expense_time, payment_method'
      });
    }

    // Auto-fetch vendor name from supplier if supplier_id provided
    let finalVendorName = vendor_name || null;
    if (supplier_id && !vendor_name) {
      const supplier = await Supplier.findByPk(supplier_id, {
        attributes: ['id', 'name']
      });
      if (supplier) {
        finalVendorName = supplier.name;
      }
    }

    // Auto-generate receipt number if not provided
    let finalReceiptNumber = receipt_number || null;
    if (!receipt_number) {
      // Format: EXP-YYYYMMDD-XXX (XXX = sequential number for the day)
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
      
      // Count expenses created today to generate sequential number
      const todayStart = today.toISOString().split('T')[0];
      const todayEnd = new Date(today);
      todayEnd.setDate(todayEnd.getDate() + 1);
      
      const todayCount = await Expense.count({
        where: {
          expense_date: {
            [Op.between]: [todayStart, todayEnd.toISOString().split('T')[0]]
          }
        }
      });
      
      const seqNumber = String(todayCount + 1).padStart(3, '0');
      finalReceiptNumber = `EXP-${dateStr}-${seqNumber}`;
    }

    const expense = await Expense.create({
      title,
      description: description || null,
      amount: parseFloat(amount),
      category,
      expense_date,
      expense_time,
      payment_method,
      receipt_number: finalReceiptNumber,
      vendor_name: finalVendorName,
      supplier_id: supplier_id || null,
      status: status || 'approved',
      created_by: req.user?.id || null
    });

    const expenseWithRelations = await Expense.findByPk(expense.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'name', 'contact']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      data: {
        ...expenseWithRelations.toJSON(),
        amount: parseFloat(expenseWithRelations.amount)
      }
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create expense',
      error: error.message
    });
  }
};

// Update expense
exports.updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const expense = await Expense.findByPk(id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Convert amount to float if provided
    if (updateData.amount) {
      updateData.amount = parseFloat(updateData.amount);
    }

    await expense.update(updateData);

    const updatedExpense = await Expense.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'name', 'contact']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Expense updated successfully',
      data: {
        ...updatedExpense.toJSON(),
        amount: parseFloat(updatedExpense.amount)
      }
    });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update expense',
      error: error.message
    });
  }
};

// Delete expense
exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findByPk(id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    await expense.destroy();

    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete expense',
      error: error.message
    });
  }
};

// Get expense categories
exports.getCategories = async (req, res) => {
  try {
    const categories = Object.entries(CATEGORY_LABELS).map(([key, label]) => ({
      value: key,
      label: label
    }));

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
};
