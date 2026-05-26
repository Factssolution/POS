const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const License = sequelize.define('License', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  license_key: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  client_email: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  client_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  client_phone: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  client_company: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  plan_type: {
    type: DataTypes.STRING(50),
    defaultValue: 'monthly',
    validate: {
      isIn: [['monthly', 'yearly', 'lifetime']]
    }
  },
  plan_duration: {
    type: DataTypes.INTEGER,
    defaultValue: 30,
    comment: 'Duration in days (30 for monthly, 365 for yearly, 9999 for lifetime)'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 5000.00
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'active',
    validate: {
      isIn: [['active', 'expired', 'revoked', 'pending']]
    }
  },
  allowed_devices: {
    type: DataTypes.INTEGER,
    defaultValue: 999,
    comment: 'Number of devices allowed (999 = unlimited)'
  },
  active_devices: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of devices currently activated'
  },
  issued_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  expiry_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  paid_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  payment_method: {
    type: DataTypes.STRING(50),
    allowNull: true,
    validate: {
      isIn: [['cash', 'jazzcash', 'easypaisa', 'bank_transfer', 'other']]
    }
  },
  payment_status: {
    type: DataTypes.STRING(50),
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'paid', 'partial', 'refunded']]
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
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
  tableName: 'licenses',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['license_key'] },
    { fields: ['status'] },
    { fields: ['expiry_date'] },
    { fields: ['client_email'] }
  ]
});

// Associations
License.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

module.exports = License;
