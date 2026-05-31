const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');
const { authenticate, authorize } = require('../middleware/auth');
const { attachTenant } = require('../middleware/tenant');

// All routes require authentication and Super Admin role
router.use(authenticate);
router.use(attachTenant);

// GET /api/v1/tenants/stats - Tenant statistics
router.get('/stats', authorize('Super Admin'), tenantController.getTenantStats);

// GET /api/v1/tenants - List all tenants
router.get('/', authorize('Super Admin'), tenantController.getAllTenants);

// GET /api/v1/tenants/:id - Get tenant details
router.get('/:id', authorize('Super Admin'), tenantController.getTenantById);

// POST /api/v1/tenants - Create new tenant
router.post('/', authorize('Super Admin'), tenantController.createTenant);

// PUT /api/v1/tenants/:id - Update tenant
router.put('/:id', authorize('Super Admin'), tenantController.updateTenant);

module.exports = router;
