const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/v1/employees
router.get('/', authenticate, authorize('Admin', 'Manager'), employeeController.getAllEmployees);

// GET /api/v1/employees/:id
router.get('/:id', authenticate, authorize('Admin', 'Manager'), employeeController.getEmployeeById);

// POST /api/v1/employees
router.post('/', authenticate, authorize('Admin', 'Manager'), employeeController.createEmployee);

// PUT /api/v1/employees/:id
router.put('/:id', authenticate, authorize('Admin', 'Manager'), employeeController.updateEmployee);

// DELETE /api/v1/employees/:id
router.delete('/:id', authenticate, authorize('Admin', 'Manager'), employeeController.deleteEmployee);

module.exports = router;
