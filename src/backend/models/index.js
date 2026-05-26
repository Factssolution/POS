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

// Define associations - centralized to avoid circular dependencies
// Transaction associations
Transaction.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });
Transaction.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Note: Employee has its own user_id field as a string (username), not a FK to User table
// This is intentional - employees have their own authentication system

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
  License
};
