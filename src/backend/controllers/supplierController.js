const { Supplier, Transaction } = require('../models');
const { Op } = require('sequelize');
const supabase = require('../config/supabase');

exports.getAllSuppliers = async (req, res) => {
  try {
    // Use Supabase for Vercel deployment
    const { data: suppliers, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Supabase suppliers query error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch suppliers',
        error: error.message
      });
    }

    // Calculate current balance for each supplier
    const suppliersWithBalance = await Promise.all((suppliers || []).map(async (s) => {
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('supplier_id', s.id);

      const totalCredit = (transactions || [])
        .filter(t => t.type === 'credit')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const totalDebit = (transactions || [])
        .filter(t => t.type === 'debit')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const currentBalance = parseFloat(s.opening_balance || 0) + totalCredit - totalDebit;
      
      return {
        id: s.id,
        name: s.name,
        contact: s.contact,
        email: s.email || null,
        address: s.address || null,
        gst_number: s.gst_number || null,
        opening_balance: parseFloat(s.opening_balance || 0),
        status: s.status,
        created_at: s.created_at,
        updated_at: s.updated_at,
        current_balance: currentBalance
      };
    }));

    res.json({
      success: true,
      data: {
        suppliers: suppliersWithBalance,
        count: suppliersWithBalance.length
      }
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
    const supplierData = supplier.toJSON();
    
    // Explicitly convert dates to ISO strings
    const createdAt = supplierData.created_at || supplier.created_at;
    const updatedAt = supplierData.updated_at || supplier.updated_at;

    res.json({
      success: true,
      data: {
        id: supplierData.id,
        name: supplierData.name,
        contact: supplierData.contact,
        email: supplierData.email || null,
        address: supplierData.address || null,
        gst_number: supplierData.gst_number || null,
        opening_balance: parseFloat(supplierData.opening_balance),
        status: supplierData.status,
        created_at: createdAt ? (createdAt instanceof Date ? createdAt.toISOString() : createdAt) : null,
        updated_at: updatedAt ? (updatedAt instanceof Date ? updatedAt.toISOString() : updatedAt) : null,
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
    const supplierData = supplier.toJSON();
    
    // Explicitly convert dates to ISO strings
    const createdAt = supplierData.created_at || supplier.created_at;
    const updatedAt = supplierData.updated_at || supplier.updated_at;

    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      data: {
        id: supplierData.id,
        name: supplierData.name,
        contact: supplierData.contact,
        email: supplierData.email || null,
        address: supplierData.address || null,
        gst_number: supplierData.gst_number || null,
        opening_balance: parseFloat(supplierData.opening_balance),
        status: supplierData.status,
        created_at: createdAt ? (createdAt instanceof Date ? createdAt.toISOString() : createdAt) : null,
        updated_at: updatedAt ? (updatedAt instanceof Date ? updatedAt.toISOString() : updatedAt) : null
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
    const supplierData = supplier.toJSON();
    
    // Explicitly convert dates to ISO strings
    const createdAt = supplierData.created_at || supplier.created_at;
    const updatedAt = supplierData.updated_at || supplier.updated_at;

    res.json({
      success: true,
      message: 'Supplier updated successfully',
      data: {
        id: supplierData.id,
        name: supplierData.name,
        contact: supplierData.contact,
        email: supplierData.email || null,
        address: supplierData.address || null,
        gst_number: supplierData.gst_number || null,
        opening_balance: parseFloat(supplierData.opening_balance),
        status: supplierData.status,
        created_at: createdAt ? (createdAt instanceof Date ? createdAt.toISOString() : createdAt) : null,
        updated_at: updatedAt ? (updatedAt instanceof Date ? updatedAt.toISOString() : updatedAt) : null
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
