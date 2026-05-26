const { Employee, User } = require('../models');

exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.findAll({
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        employees: employees.map(e => ({
          id: e.id,
          name: e.name,
          phone: e.phone,
          email: e.email,
          user_id: e.user_id,
          role: e.role,
          status: e.status,
          created_at: e.created_at,
          updated_at: e.updated_at
        })),
        count: employees.length
      }
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employees',
      error: error.message
    });
  }
};

exports.getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findByPk(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      data: employee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee',
      error: error.message
    });
  }
};

exports.createEmployee = async (req, res) => {
  try {
    // Check if user_id already exists
    const existing = await Employee.findOne({
      where: { user_id: req.body.user_id }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Employee with this user ID already exists'
      });
    }

    const employee = await Employee.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: employee
    });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create employee',
      error: error.message
    });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findByPk(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Check if user_id is being changed and if it already exists
    if (req.body.user_id && req.body.user_id !== employee.user_id) {
      const existing = await Employee.findOne({
        where: { user_id: req.body.user_id }
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Employee with this user ID already exists'
        });
      }
    }

    await employee.update(req.body);

    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: employee
    });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update employee',
      error: error.message
    });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findByPk(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    await employee.destroy();

    res.json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete employee',
      error: error.message
    });
  }
};
