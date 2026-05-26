const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

// GET /api/v1/dashboard/stats
router.get('/stats', authenticate, dashboardController.getStats);

// GET /api/v1/dashboard/sales
router.get('/sales', authenticate, dashboardController.getSalesAnalytics);

// GET /api/v1/dashboard/low-stock
router.get('/low-stock', authenticate, dashboardController.getLowStock);

module.exports = router;
