const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// GET /api/v1/products
router.get('/', authenticate, productController.getAllProducts);

// GET /api/v1/products/categories
router.get('/categories', authenticate, productController.getCategories);

// GET /api/v1/products/:id
router.get('/:id', authenticate, productController.getProductById);

// POST /api/v1/products
router.post('/', authenticate, authorize('Admin', 'Manager'), upload.single('image'), productController.createProduct);

// PUT /api/v1/products/:id
router.put('/:id', authenticate, authorize('Admin', 'Manager'), upload.single('image'), productController.updateProduct);

// DELETE /api/v1/products/:id
router.delete('/:id', authenticate, authorize('Admin', 'Manager'), productController.deleteProduct);

module.exports = router;
