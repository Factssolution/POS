const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/v1/transactions
router.get('/', authenticate, transactionController.getAllTransactions);

// POST /api/v1/transactions
router.post('/', authenticate, authorize('Admin', 'Manager'), transactionController.createTransaction);

// GET /api/v1/transactions/supplier/:supplierId/balance
router.get('/supplier/:supplierId/balance', authenticate, transactionController.getSupplierBalance);

// DELETE /api/v1/transactions/:id
router.delete('/:id', authenticate, authorize('Admin', 'Manager'), transactionController.deleteTransaction);

module.exports = router;
