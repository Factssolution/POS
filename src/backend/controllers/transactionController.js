const { Transaction, Supplier, User } = require('../models');
const { Op } = require('sequelize');

exports.getAllTransactions = async (req, res) => {
  try {
    const { supplier_id, type, startDate, endDate } = req.query;
    
    const where = {};
    
    if (supplier_id) {
      where.supplier_id = supplier_id;
    }
    
    if (type) {
      where.type = type;
    }
    
    if (startDate && endDate) {
      where.transaction_date = {
        [Op.between]: [startDate, endDate]
      };
    }

    const transactions = await Transaction.findAll({
      where,
      include: [
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'name', 'contact', 'email', 'opening_balance', 'status']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name']
        }
      ],
      order: [['transaction_date', 'ASC'], ['transaction_time', 'ASC'], ['created_at', 'ASC']]  // ASC for correct running balance calculation
    });

    console.log(`📊 Processing ${transactions.length} transactions for running balance...`);

    // Calculate running balance for EACH SUPPLIER individually
    const supplierBalances = {};
    
    // Initialize all suppliers with their opening balances FIRST
    const allSuppliers = new Set(transactions.map(t => t.supplier_id));
    transactions.forEach(t => {
      const supplierId = t.supplier_id;
      if (!supplierBalances[supplierId]) {
        const openingBalance = parseFloat(t.supplier?.opening_balance || 0);
        supplierBalances[supplierId] = openingBalance;
        console.log(`   Supplier ${t.supplier?.name} (ID: ${supplierId}): Opening Balance = Rs ${openingBalance}`);
      }
    });
    
    // Now calculate running balance in chronological order
    const transactionsWithBalance = transactions.map(t => {
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

    // Reverse to show newest first (DESC for display)
    transactionsWithBalance.reverse();

    // Calculate summary
    const totalCredit = transactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const totalDebit = transactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    res.json({
      success: true,
      data: {
        transactions: transactionsWithBalance,
        summary: {
          totalCredit: parseFloat(totalCredit.toFixed(2)),
          totalDebit: parseFloat(totalDebit.toFixed(2)),
          netBalance: parseFloat((totalCredit - totalDebit).toFixed(2))
        }
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
