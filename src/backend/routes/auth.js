const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// POST /api/v1/auth/login
router.post('/login', authController.login);

// POST /api/v1/auth/logout
router.post('/logout', authenticate, authController.logout);

// GET /api/v1/auth/verify
router.get('/verify', authenticate, authController.verify);

module.exports = router;
