const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadLogo } = require('../middleware/upload');
const { settingsLimiter } = require('../middleware/rateLimiter');

// GET /api/v1/settings - Admin only
router.get('/', authenticate, authorize('Admin'), settingsController.getAllSettings);

// GET /api/v1/settings/shop-hours - Admin only
router.get('/shop-hours', authenticate, authorize('Admin'), settingsController.getShopHours);

// PUT /api/v1/settings/shop-hours
router.put('/shop-hours', authenticate, authorize('Admin'), settingsController.updateShopHours);

// POST /api/v1/settings/logo - Upload company logo
router.post('/logo', authenticate, authorize('Admin', 'Manager'), uploadLogo.single('logo'), settingsController.uploadLogo);

// PUT /api/v1/settings
router.put('/', authenticate, authorize('Admin'), settingsLimiter, settingsController.updateSettings);

// GET /api/v1/settings/:key - Admin only
router.get('/:key', authenticate, authorize('Admin'), settingsController.getSettingByKey);

module.exports = router;
