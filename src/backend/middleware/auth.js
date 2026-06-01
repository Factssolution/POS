const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const supabase = require('../config/supabase');

// Middleware to verify JWT token
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please provide a valid token.'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify token
    const decoded = jwt.verify(token, jwtConfig.secret);
    
    // Find user via Supabase REST API
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.id)
      .single();
    
    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Token is invalid.'
      });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact administrator.'
      });
    }

    // Attach user to request object
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please login again.',
      error: error.message
    });
  }
};

// Middleware to check if user has required role
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      console.error('Authorization failed: No user in request');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Normalize role for comparison (trim whitespace and match case)
    const userRole = req.user.role ? req.user.role.trim() : '';
    const normalizedUserRole = userRole.charAt(0).toUpperCase() + userRole.slice(1).toLowerCase();
    const normalizedAllowedRoles = allowedRoles.map(role => 
      role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
    );

    console.log('Authorization check:', {
      userRole: userRole,
      normalizedUserRole: normalizedUserRole,
      allowedRoles: normalizedAllowedRoles,
      userId: req.user.id,
      userEmail: req.user.email
    });

    if (!normalizedAllowedRoles.includes(normalizedUserRole)) {
      console.error('Authorization denied:', {
        userRole: normalizedUserRole,
        requiredRoles: normalizedAllowedRoles,
        userId: req.user.id
      });
      
      return res.status(403).json({
        success: false,
        message: `Access denied. Only ${allowedRoles.join(', ')}(s) can access this resource. Your role: ${userRole}`
      });
    }

    next();
  };
};

module.exports = { authenticate, authorize };
