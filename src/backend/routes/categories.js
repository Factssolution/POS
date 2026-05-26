const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/v1/categories
router.get('/', authenticate, categoryController.getAllCategories);

// GET /api/v1/categories/stats
router.get('/stats', authenticate, categoryController.getCategoryStats);

// GET /api/v1/categories/:id
router.get('/:id', authenticate, categoryController.getCategoryById);

// POST /api/v1/categories
router.post('/', authenticate, authorize('Admin', 'Manager'), categoryController.createCategory);

// PUT /api/v1/categories/:id
router.put('/:id', authenticate, authorize('Admin', 'Manager'), categoryController.updateCategory);

// DELETE /api/v1/categories/:id
router.delete('/:id', authenticate, authorize('Admin', 'Manager'), categoryController.deleteCategory);

module.exports = router;
