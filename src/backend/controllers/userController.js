const User = require('../models/User');
const bcrypt = require('bcryptjs');

// GET /api/v1/users - Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] }, // Don't send password hashes
      order: [['id', 'ASC']]
    });

    res.json({
      success: true,
      users,
      count: users.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// GET /api/v1/users/:id - Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};

// POST /api/v1/users - Create new user
exports.createUser = async (req, res) => {
  try {
    const { name, email, phone, password, role, status } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Validate role
    const validRoles = ['Admin', 'Manager', 'Cashier'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be Admin, Manager, or Cashier'
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email: email.trim() } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Create user (password will be hashed by Sequelize hook)
    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : null,
      password,
      role: role || 'Cashier',
      status: status || 'active'
    });

    // Don't send password in response
    const userData = user.toJSON();
    delete userData.password;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: userData
    });
  } catch (error) {
    console.error('Create user error:', error);
    
    // Handle duplicate email error specifically
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
};

// PUT /api/v1/users/:id - Update user
exports.updateUser = async (req, res) => {
  try {
    const { name, email, phone, role, status } = req.body;

    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    // Update user
    await user.update({
      name: name || user.name,
      email: email || user.email,
      phone: phone !== undefined ? phone : user.phone,
      role: role || user.role,
      status: status || user.status
    });

    // Don't send password in response
    const userData = user.toJSON();
    delete userData.password;

    res.json({
      success: true,
      message: 'User updated successfully',
      user: userData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
};

// DELETE /api/v1/users/:id - Delete user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.destroy();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
};

// POST /api/v1/users/:id/reset-password - Reset user password
exports.resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    // Validate password
    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password is required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Prevent common weak passwords
    const weakPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
    if (weakPasswords.includes(newPassword.toLowerCase().trim())) {
      return res.status(400).json({
        success: false,
        message: 'Password is too weak. Please choose a stronger password'
      });
    }

    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update password (will be hashed by Sequelize hook)
    await user.update({ password: newPassword });

    // Log password reset for audit trail
    console.log(`Password reset for user ID: ${user.id}, Email: ${user.email}`);

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: error.message
    });
  }
};

// PATCH /api/v1/users/:id/toggle-status - Toggle user status (active/inactive)
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    await user.update({ status: newStatus });

    res.json({
      success: true,
      message: `User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
      status: newStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling user status',
      error: error.message
    });
  }
};
