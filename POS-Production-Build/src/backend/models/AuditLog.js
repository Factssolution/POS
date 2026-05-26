const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'User who performed the action'
  },
  user_email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'User email for reference'
  },
  action: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Action performed (CREATE, UPDATE, DELETE, BACKUP_CREATE, BACKUP_RESTORE, etc.)'
  },
  entity_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Type of entity affected (settings, product, backup, order, etc.)'
  },
  entity_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID of the entity affected'
  },
  setting_key: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Settings key if action is on settings'
  },
  old_value: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Previous value before change'
  },
  new_value: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'New value after change'
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: 'IP address of the request'
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'User agent string'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional context as JSON'
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'success',
    comment: 'Action status (success, failed, error)'
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Error message if action failed'
  }
}, {
  tableName: 'audit_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      fields: ['user_id'],
      name: 'idx_audit_user_id'
    },
    {
      fields: ['action'],
      name: 'idx_audit_action'
    },
    {
      fields: ['entity_type'],
      name: 'idx_audit_entity_type'
    },
    {
      fields: ['created_at'],
      name: 'idx_audit_created_at'
    }
  ]
});

module.exports = AuditLog;
