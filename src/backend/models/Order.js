const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  token_number: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  token_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Business day this token belongs to (may differ from created_at date)'
  },
  customer_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  customer_phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  tax_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  payment_method: {
    type: DataTypes.STRING(20),
    defaultValue: 'cash',
    validate: {
      isIn: [['cash', 'card', 'upi', 'other']]
    }
  },
  cashier_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'completed',
    validate: {
      isIn: [['completed', 'pending', 'cancelled']]
    }
  }
}, {
  tableName: 'orders',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['token_number'] },
    { fields: ['created_at'] },
    { fields: ['status'] },
    { fields: ['customer_phone'] },
    { fields: ['customer_name'] },
    { fields: ['customer_phone', 'customer_name'] }
  ]
});

// Associations
Order.belongsTo(User, { foreignKey: 'cashier_id', as: 'cashier' });

module.exports = Order;
