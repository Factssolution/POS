const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// GET /api/v1/expenses/categories - Get expense categories
router.get('/categories', expenseController.getCategories);

// GET /api/v1/expenses/stats - Get expense statistics
router.get('/stats', expenseController.getExpenseStats);

// GET /api/v1/expenses - Get all expenses with filtering
router.get('/', expenseController.getExpenses);

// GET /api/v1/expenses/:id - Get single expense
router.get('/:id', expenseController.getExpenseById);

// POST /api/v1/expenses - Create new expense
router.post('/', expenseController.createExpense);

// PUT /api/v1/expenses/:id - Update expense
router.put('/:id', expenseController.updateExpense);

// DELETE /api/v1/expenses/:id - Delete expense
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;
