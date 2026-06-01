const { Transaction, Supplier, User } = require('../models');
const { Op } = require('sequelize');
const supabase = require('../config/supabase');

exports.getAllTransactions = async (req, res) => {
  try {
    const { supplier_id, type, startDate, endDate } = req.query;
    
    // Use Supabase for Vercel deployment
    let query = supabase
      .from('transactions')
      .select(`
        *,
        supplier:supplier_id (id, name, contact, email, opening_balance, status),
        creator:user_id (id, name)
      `)
      .order('transaction_date', { ascending: true })
      .order('transaction_time', { ascending: true })
      .order('created_at', { ascending: true });
    
    if (supplier_id) {
      query = query.eq('supplier_id', supplier_id);
    }
    
    if (type) {
      query = query.eq('type', type);
    }
    
    if (startDate) {
      query = query.gte('transaction_date', startDate);
    }
    
    if (endDate) {
      query = query.lte('transaction_date', endDate);
    }

    const { data: transactions, error } = await query;
    
    if (error) {
      console.error('Supabase transactions query error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch transactions',
        error: error.message
      });
    }

    res.json({
      success: true,
      data: {
        transactions: transactions || [],
        count: (transactions || []).length
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message
    });
  }
};

exports.createTransaction = async (req, res) => {
  try {
    const { supplier_id, type, amount, description } = req.body;

    // Check if supplier exists
    const supplier = await Supplier.findByPk(supplier_id);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    const now = new Date();
    const transaction = await Transaction.create({
      supplier_id,
      type,
      amount,
      description,
      transaction_date: now.toISOString().split('T')[0],
      transaction_time: now.toTimeString().split(' ')[0],
      created_by: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Transaction added successfully',
      data: {
        ...transaction.toJSON(),
        amount: parseFloat(transaction.amount)
      }
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create transaction',
      error: error.message
    });
  }
};

exports.getSupplierBalance = async (req, res) => {
  try {
    const { supplierId } = req.params;

    const supplier = await Supplier.findByPk(supplierId);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    const transactions = await Transaction.findAll({
      where: { supplier_id: supplierId }
    });

    const totalCredit = transactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const totalDebit = transactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const netBalance = totalCredit - totalDebit;
    const currentBalance = parseFloat(supplier.opening_balance) + netBalance;

    res.json({
      success: true,
      data: {
        supplier_id: supplier.id,
        supplier_name: supplier.name,
        opening_balance: parseFloat(supplier.opening_balance),
        total_credit: parseFloat(totalCredit.toFixed(2)),
        total_debit: parseFloat(totalDebit.toFixed(2)),
        net_balance: parseFloat(netBalance.toFixed(2)),
        current_balance: parseFloat(currentBalance.toFixed(2))
      }
    });
  } catch (error) {
    console.error('Get supplier balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch supplier balance',
      error: error.message
    });
  }
};

exports.deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findByPk(id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    await transaction.destroy();

    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete transaction',
      error: error.message
    });
  }
};
