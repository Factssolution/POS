const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Supplier = require('./Supplier');

const Expense = sequelize.define('Expense', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      isIn: [[
        'utilities',
        'rent',
        'salary',
        'maintenance',
        'transportation',
        'office_supplies',
        'marketing',
        'food_beverages',
        'insurance',
        'taxes',
        'equipment',
        'travel',
        'communication',
        'miscellaneous'
      ]]
    }
  },
  expense_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  expense_time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  payment_method: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isIn: [['cash', 'bank_transfer', 'check', 'credit_card', 'upi', 'other']]
    }
  },
  receipt_number: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  vendor_name: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  supplier_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'suppliers',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'approved',
    validate: {
      isIn: [['pending', 'approved', 'rejected']]
    }
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'expenses',
  timestamps: true,
  indexes: [
    { fields: ['category'] },
    { fields: ['expense_date'] },
    { fields: ['status'] },
    { fields: ['supplier_id'] },
    { fields: ['created_by'] }
  ]
});

// Associations
Expense.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Expense.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier', onDelete: 'SET NULL' });

module.exports = Expense;
