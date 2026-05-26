const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/v1/users - Get all users
router.get('/', authenticate, authorize('Admin', 'Manager'), userController.getAllUsers);

// GET /api/v1/users/:id - Get user by ID
router.get('/:id', authenticate, authorize('Admin', 'Manager'), userController.getUserById);

// POST /api/v1/users - Create new user
router.post('/', authenticate, authorize('Admin', 'Manager'), userController.createUser);

// PUT /api/v1/users/:id - Update user
router.put('/:id', authenticate, authorize('Admin', 'Manager'), userController.updateUser);

// DELETE /api/v1/users/:id - Delete user
router.delete('/:id', authenticate, authorize('Admin', 'Manager'), userController.deleteUser);

// POST /api/v1/users/:id/reset-password - Reset password
router.post('/:id/reset-password', authenticate, authorize('Admin', 'Manager'), userController.resetPassword);

// PATCH /api/v1/users/:id/toggle-status - Toggle user status
router.patch('/:id/toggle-status', authenticate, authorize('Admin', 'Manager'), userController.toggleUserStatus);

module.exports = router;
