const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/v1/orders
router.get('/', authenticate, orderController.getAllOrders);

// GET /api/v1/orders/:id/receipt (must come before /:id)
router.get('/:id/receipt', authenticate, orderController.getOrderReceipt);

// GET /api/v1/orders/next-token
router.get('/next-token', authenticate, orderController.getNextToken);

// GET /api/v1/orders/:id
router.get('/:id', authenticate, orderController.getOrderById);

// POST /api/v1/orders/create
router.post('/create', authenticate, orderController.createOrder);

// PUT /api/v1/orders/:id/status
router.put('/:id/status', authenticate, authorize('Admin', 'Manager'), orderController.updateOrderStatus);

// DELETE /api/v1/orders/:id
router.delete('/:id', authenticate, authorize('Admin', 'Manager'), orderController.deleteOrder);

module.exports = router;
