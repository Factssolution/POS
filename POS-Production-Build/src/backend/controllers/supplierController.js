const { Supplier, Transaction } = require('../models');
const { Op } = require('sequelize');

exports.getAllSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.findAll({
      order: [['created_at', 'DESC']]
    });

    // Calculate current balance for each supplier
    const suppliersWithBalance = await Promise.all(suppliers.map(async (s) => {
      const transactions = await Transaction.findAll({
        where: { supplier_id: s.id }
      });

      const totalCredit = transactions
        .filter(t => t.type === 'credit')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const totalDebit = transactions
        .filter(t => t.type === 'debit')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const currentBalance = parseFloat(s.opening_balance) + totalCredit - totalDebit;

      return {
        ...s.toJSON(),
        opening_balance: parseFloat(s.opening_balance),
        totalCredit: parseFloat(totalCredit),
        totalDebit: parseFloat(totalDebit),
        currentBalance: parseFloat(currentBalance)
      };
    }));

    res.json({
      success: true,
      data: suppliersWithBalance
    });
  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch suppliers',
      error: error.message
    });
  }
};

exports.getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const supplier = await Supplier.findByPk(id, {
      include: [{
        model: Transaction,
        as: 'transactions',
        limit: 10,
        order: [['transaction_date', 'DESC']]
      }]
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Calculate current balance
    const transactions = await Transaction.findAll({
      where: { supplier_id: id }
    });

    const totalCredit = transactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const totalDebit = transactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const currentBalance = parseFloat(supplier.opening_balance) + (totalCredit - totalDebit);

    res.json({
      success: true,
      data: {
        ...supplier.toJSON(),
        opening_balance: parseFloat(supplier.opening_balance),
        currentBalance: parseFloat(currentBalance)
      }
    });
  } catch (error) {
    console.error('Get supplier error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch supplier',
      error: error.message
    });
  }
};

exports.createSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      data: {
        ...supplier.toJSON(),
        opening_balance: parseFloat(supplier.opening_balance)
      }
    });
  } catch (error) {
    console.error('Create supplier error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create supplier',
      error: error.message
    });
  }
};

exports.updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await Supplier.findByPk(id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    await supplier.update(req.body);

    res.json({
      success: true,
      message: 'Supplier updated successfully',
      data: {
        ...supplier.toJSON(),
        opening_balance: parseFloat(supplier.opening_balance)
      }
    });
  } catch (error) {
    console.error('Update supplier error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update supplier',
      error: error.message
    });
  }
};

exports.deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await Supplier.findByPk(id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    await supplier.destroy();

    res.json({
      success: true,
      message: 'Supplier deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete supplier',
      error: error.message
    });
  }
};
