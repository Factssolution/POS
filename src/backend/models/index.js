// On Vercel, use Supabase REST API models directly
if (process.env.VERCEL === '1') {
  module.exports = require('../config/supabaseModels');
} else {
  const User = require('./User');
  const Product = require('./Product');
  const Employee = require('./Employee');
  const Supplier = require('./Supplier');
  const Transaction = require('./Transaction');
  const Order = require('./Order');
  const OrderItem = require('./OrderItem');
  const Settings = require('./Settings');
  const Category = require('./Category');
  const AuditLog = require('./AuditLog');
  const Expense = require('./Expense');
  const License = require('./License');
  const Tenant = require('./Tenant');

  // Blob model is a factory function, need to initialize it
  const sequelize = require('../config/database');
  const BlobFactory = require('./Blob');
  const Blob = BlobFactory(sequelize);

  // Define associations AFTER all models are loaded
  function setupAssociations() {
  // Tenant associations
  Tenant.hasMany(User, { foreignKey: 'tenant_id', as: 'users' });
  Tenant.hasMany(Product, { foreignKey: 'tenant_id', as: 'products' });
  Tenant.hasMany(Category, { foreignKey: 'tenant_id', as: 'categories' });
  Tenant.hasMany(Supplier, { foreignKey: 'tenant_id', as: 'suppliers' });
  Tenant.hasMany(Order, { foreignKey: 'tenant_id', as: 'orders' });
  Tenant.hasMany(Transaction, { foreignKey: 'tenant_id', as: 'transactions' });
  Tenant.hasMany(Expense, { foreignKey: 'tenant_id', as: 'expenses' });
  Tenant.hasMany(Employee, { foreignKey: 'tenant_id', as: 'employees' });
  Tenant.hasMany(Settings, { foreignKey: 'tenant_id', as: 'tenantSettings' });
  Tenant.hasMany(License, { foreignKey: 'tenant_id', as: 'licenses' });
  Tenant.hasMany(AuditLog, { foreignKey: 'tenant_id', as: 'auditLogs' });
  Tenant.hasMany(Blob, { foreignKey: 'tenant_id', as: 'blobs' });

  // User belongs to Tenant
  User.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

  // Transaction associations
  Transaction.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });
  Transaction.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
}

// Call association setup
setupAssociations();

// Export all models
  module.exports = {
    User,
    Product,
    Employee,
    Supplier,
    Transaction,
    Order,
    OrderItem,
    Settings,
    Category,
    AuditLog,
    Expense,
    License,
    Tenant,
    Blob
  };
}
