const express = require('express');
const router = express.Router();
const licenseController = require('../controllers/licenseController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Public license routes (accessible by all authenticated users)
router.get('/status', licenseController.getLicenseStatus);
router.post('/activate', licenseController.activateLicense);

// Super Admin only routes
router.post('/generate', authorize('Super Admin'), licenseController.generateLicense);
router.get('/all', authorize('Super Admin'), licenseController.getAllLicenses);
router.post('/revoke/:id', authorize('Super Admin'), licenseController.revokeLicense);
router.put('/pricing', authorize('Super Admin'), licenseController.updatePricing);

module.exports = router;
