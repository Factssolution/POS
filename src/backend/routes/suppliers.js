const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/v1/suppliers
router.get('/', authenticate, supplierController.getAllSuppliers);

// GET /api/v1/suppliers/:id
router.get('/:id', authenticate, supplierController.getSupplierById);

// POST /api/v1/suppliers
router.post('/', authenticate, authorize('Admin', 'Manager'), supplierController.createSupplier);

// PUT /api/v1/suppliers/:id
router.put('/:id', authenticate, authorize('Admin', 'Manager'), supplierController.updateSupplier);

// DELETE /api/v1/suppliers/:id
router.delete('/:id', authenticate, authorize('Admin', 'Manager'), supplierController.deleteSupplier);

module.exports = router;
