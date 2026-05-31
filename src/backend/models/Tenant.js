const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Tenant = sequelize.define('Tenant', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tenant_key: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  company_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  contact_email: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  contact_phone: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'active',
    validate: {
      isIn: [['active', 'suspended', 'inactive']]
    }
  },
  subscription_type: {
    type: DataTypes.STRING(50),
    defaultValue: 'trial',
    validate: {
      isIn: [['trial', 'monthly', 'yearly', 'lifetime']]
    }
  },
  subscription_start: {
    type: DataTypes.DATE,
    allowNull: true
  },
  subscription_end: {
    type: DataTypes.DATE,
    allowNull: true
  },
  max_users: {
    type: DataTypes.INTEGER,
    defaultValue: 10
  },
  current_users: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  settings: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'tenants',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['tenant_key'] },
    { fields: ['status'] },
    { fields: ['subscription_type'] }
  ]
});

module.exports = Tenant;
