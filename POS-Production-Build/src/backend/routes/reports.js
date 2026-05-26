const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/v1/reports/sales
router.get('/sales', authenticate, authorize('Admin', 'Manager'), reportsController.getSalesReport);

// GET /api/v1/reports/inventory
router.get('/inventory', authenticate, authorize('Admin', 'Manager'), reportsController.getInventoryReport);

// GET /api/v1/reports/transactions
router.get('/transactions', authenticate, authorize('Admin', 'Manager'), reportsController.getTransactionReport);

// GET /api/v1/reports/customers - Complete customer analytics and order history
router.get('/customers', authenticate, reportsController.getCustomerReport);

// GET /api/v1/reports/customers/:phone - Single customer complete history
router.get('/customers/:phone', authenticate, reportsController.getCustomerHistory);

// GET /api/v1/reports/suppliers - Complete supplier report with transaction aggregations
router.get('/suppliers', authenticate, reportsController.getSupplierReport);

// GET /api/v1/reports/employees - Complete employee report with order aggregations
router.get('/employees', authenticate, reportsController.getEmployeeReport);

module.exports = router;
