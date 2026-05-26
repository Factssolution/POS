const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Supplier = sequelize.define('Supplier', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  contact: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  gst_number: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  opening_balance: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'active',
    validate: {
      isIn: [['active', 'inactive']]
    }
  }
}, {
  tableName: 'suppliers',
  timestamps: true,
  indexes: [
    { fields: ['status'] }
  ]
});

module.exports = Supplier;
