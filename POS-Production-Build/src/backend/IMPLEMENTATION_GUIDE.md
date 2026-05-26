# Backend Implementation Guide - POS System

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Setup Database
```sql
CREATE DATABASE pos_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env with your database credentials
```

### 4. Run Database Migrations
```bash
npm run db:migrate
```

### 5. Seed Initial Data
```bash
npm run db:seed
```

### 6. Start Server
```bash
# Development
npm run dev

# Production
npm start
```

## 📁 Complete File Structure

```
backend/
├── server.js                    ✅ Created
├── package.json                 ✅ Created
├── .env.example                 ✅ Created
├── .env                         ⚠️ Create manually
│
├── config/
│   ├── database.js             ✅ Created
│   └── jwt.js                  ✅ Created
│
├── models/
│   ├── index.js                ✅ Created
│   ├── User.js                 ✅ Created
│   ├── Product.js              ✅ Created
│   ├── Employee.js             ✅ Created
│   ├── Supplier.js             ✅ Created
│   ├── Transaction.js          ✅ Created
│   ├── Order.js                ✅ Created
│   ├── OrderItem.js            ✅ Created
│   └── Settings.js             ✅ Created
│
├── middleware/
│   ├── auth.js                 ✅ Created
│   ├── validation.js           ✅ Created
│   └── upload.js               ✅ Created
│
├── controllers/
│   ├── authController.js       ✅ Created
│   ├── productController.js    ✅ Created
│   ├── employeeController.js   📝 Code below
│   ├── supplierController.js   📝 Code below
│   ├── transactionController.js 📝 Code below
│   ├── orderController.js      📝 Code below
│   ├── dashboardController.js  📝 Code below
│   ├── settingsController.js   📝 Code below
│   └── reportsController.js    📝 Code below
│
├── routes/
│   ├── auth.js                 📝 Code below
│   ├── products.js             📝 Code below
│   ├── employees.js            📝 Code below
│   ├── suppliers.js            📝 Code below
│   ├── transactions.js         📝 Code below
│   ├── orders.js               📝 Code below
│   ├── dashboard.js            📝 Code below
│   ├── settings.js             📝 Code below
│   └── reports.js              📝 Code below
│
├── scripts/
│   ├── migrate.js              📝 Code below
│   └── seed.js                 📝 Code below
│
└── uploads/
    └── products/               (Auto-created)
```

---

## 🔧 Remaining Controllers Code

### employeeController.js
```javascript
const { Employee } = require('../models');

exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.findAll({
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: employees
    });
  } catch (error) {
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
```

### supplierController.js
```javascript
const { Supplier, Transaction } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

exports.getAllSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.findAll({
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: suppliers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch suppliers',
      error: error.message
    });
  }
};

exports.getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const supplier = await Supplier.findByPk(id, {
      include: [{
        model: Transaction,
        as: 'transactions',
        limit: 10,
        order: [['transaction_date', 'DESC']]
      }]
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Calculate current balance
    const transactions = await Transaction.findAll({
      where: { supplier_id: id }
    });

    const totalCredit = transactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const totalDebit = transactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const currentBalance = parseFloat(supplier.opening_balance) + (totalCredit - totalDebit);

    res.json({
      success: true,
      data: {
        ...supplier.toJSON(),
        currentBalance
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch supplier',
      error: error.message
    });
  }
};

exports.createSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      data: supplier
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create supplier',
      error: error.message
    });
  }
};

exports.updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await Supplier.findByPk(id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    await supplier.update(req.body);

    res.json({
      success: true,
      message: 'Supplier updated successfully',
      data: supplier
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update supplier',
      error: error.message
    });
  }
};

exports.deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await Supplier.findByPk(id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    await supplier.destroy();

    res.json({
      success: true,
      message: 'Supplier deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete supplier',
      error: error.message
    });
  }
};
```

### transactionController.js
```javascript
const { Transaction, Supplier, User } = require('../models');
const { Op } = require('sequelize');

exports.getAllTransactions = async (req, res) => {
  try {
    const { supplier_id, type, startDate, endDate } = req.query;
    
    const where = {};
    
    if (supplier_id) {
      where.supplier_id = supplier_id;
    }
    
    if (type) {
      where.type = type;
    }
    
    if (startDate && endDate) {
      where.transaction_date = {
        [Op.between]: [startDate, endDate]
      };
    }

    const transactions = await Transaction.findAll({
      where,
      include: [
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name']
        }
      ],
      order: [['transaction_date', 'DESC'], ['transaction_time', 'DESC']]
    });

    // Calculate summary
    const totalCredit = transactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const totalDebit = transactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    res.json({
      success: true,
      data: {
        transactions,
        summary: {
          totalCredit,
          totalDebit,
          netBalance: totalCredit - totalDebit
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message
    });
  }
};

exports.createTransaction = async (req, res) => {
  try {
    const { supplier_id, type, amount, description } = req.body;

    // Check if supplier exists
    const supplier = await Supplier.findByPk(supplier_id);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    const now = new Date();
    const transaction = await Transaction.create({
      supplier_id,
      type,
      amount,
      description,
      transaction_date: now.toISOString().split('T')[0],
      transaction_time: now.toTimeString().split(' ')[0],
      created_by: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Transaction added successfully',
      data: transaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create transaction',
      error: error.message
    });
  }
};

exports.getSupplierBalance = async (req, res) => {
  try {
    const { supplierId } = req.params;

    const supplier = await Supplier.findByPk(supplierId);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    const transactions = await Transaction.findAll({
      where: { supplier_id: supplierId }
    });

    const totalCredit = transactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const totalDebit = transactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const netBalance = totalCredit - totalDebit;
    const currentBalance = parseFloat(supplier.opening_balance) + netBalance;

    res.json({
      success: true,
      data: {
        supplierId: supplier.id,
        supplierName: supplier.name,
        openingBalance: parseFloat(supplier.opening_balance),
        totalCredit,
        totalDebit,
        netBalance,
        currentBalance
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch supplier balance',
      error: error.message
    });
  }
};

exports.deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findByPk(id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    await transaction.destroy();

    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete transaction',
      error: error.message
    });
  }
};
```

---

## 📄 Due to character limit, the remaining controllers (Order, Dashboard, Settings, Reports) and all routes will be provided in separate response...

Would you like me to continue with the remaining implementation files?
