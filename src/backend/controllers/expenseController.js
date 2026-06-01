const { Op } = require('sequelize');
const Expense = require('../models/Expense');
const User = require('../models/User');
const Supplier = require('../models/Supplier');
const supabase = require('../config/supabase');

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

    const offset = (page - 1) * limit;

    // Use Supabase for Vercel deployment
    let query = supabase
      .from('expenses')
      .select('*, creator:created_by (id, name)', { count: 'exact' })
      .order(sortBy || 'expense_date', { ascending: sortOrder === 'ASC' })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
    
    if (startDate) {
      query = query.gte('expense_date', startDate);
    }
    
    if (endDate) {
      query = query.lte('expense_date', endDate);
    }
    
    if (category) {
      query = query.eq('category', category);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (paymentMethod) {
      query = query.eq('payment_method', paymentMethod);
    }
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,vendor_name.ilike.%${search}%`);
    }

    const { data: expenses, error, count } = await query;
    
    if (error) {
      console.error('Supabase expenses query error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch expenses',
        error: error.message
      });
    }

    res.json({
      success: true,
      data: {
        expenses: expenses || [],
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil((count || 0) / limit),
          totalItems: count || 0,
          itemsPerPage: parseInt(limit)
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
