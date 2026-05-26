const express = require('express');
const router = express.Router();
const path = require('path');
const backupController = require('../controllers/backupController');
const { authenticate, authorize } = require('../middleware/auth');
const { backupLimiter, backupReadLimiter, backupWriteLimiter } = require('../middleware/rateLimiter');
const auditController = require('../controllers/auditController');
const diskMonitor = require('../controllers/diskMonitor');
const backupEncryption = require('../controllers/backupEncryption');
const scheduledBackup = require('../controllers/scheduledBackup');
const emailService = require('../controllers/emailService');
const backupStats = require('../controllers/backupStats');

// GET /api/v1/settings/backups - List all backups (READ operation)
router.get('/backups', authenticate, authorize('Admin'), backupReadLimiter, async (req, res) => {
  try {
    const result = await backupController.listBackups(req.query.backupPath);
    res.json(result);
  } catch (error) {
    console.error('List backups error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/v1/settings/backups/create - Create new backup (WRITE operation)
router.post('/backups/create', authenticate, authorize('Admin'), backupWriteLimiter, async (req, res) => {
  try {
    const { 
      includeData, 
      includeStructure, 
      includeSettings,
      includeProducts,
      includeOrders,
      includeEmployees,
      includeSuppliers,
      includeTransactions,
      backupPath 
    } = req.body;

    // Validate boolean fields
    const validBooleans = [includeData, includeStructure, includeSettings, includeProducts, 
                          includeOrders, includeEmployees, includeSuppliers, includeTransactions];
    for (const val of validBooleans) {
      if (val !== undefined && typeof val !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'Invalid option: All include flags must be boolean values'
        });
      }
    }

    // Validate backupPath if provided
    if (backupPath && typeof backupPath !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid backupPath: Must be a string'
      });
    }

    const result = await backupController.createBackup(req.body);
    
    // Log backup creation
    await auditController.logBackupAction(
      req.user.id,
      req.user.email,
      'CREATE',
      result.filename,
      { options: req.body, size: result.size },
      req
    );
    
    res.json(result);
  } catch (error) {
    console.error('Create backup error:', error);
    
    // Log failed backup creation
    await auditController.logBackupAction(
      req.user.id,
      req.user.email,
      'CREATE_FAILED',
      null,
      { error: error.message },
      req
    );
    
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/v1/settings/backups/restore - Restore from backup (WRITE operation)
router.post('/backups/restore', authenticate, authorize('Admin'), backupWriteLimiter, async (req, res) => {
  try {
    const { filename, backupPath } = req.body;
    
    if (!filename) {
      return res.status(400).json({
        success: false,
        message: 'Filename is required'
      });
    }

    const result = await backupController.restoreBackup(filename, backupPath);
    
    // Log backup restoration
    await auditController.logBackupAction(
      req.user.id,
      req.user.email,
      'RESTORE',
      filename,
      { backupPath },
      req
    );
    
    res.json(result);
  } catch (error) {
    console.error('Restore backup error:', error);
    
    // Log failed restoration
    await auditController.logBackupAction(
      req.user.id,
      req.user.email,
      'RESTORE_FAILED',
      filename,
      { error: error.message },
      req
    );
    
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// DELETE /api/v1/settings/backups/:filename - Delete backup (WRITE operation)
router.delete('/backups/:filename', authenticate, authorize('Admin'), backupWriteLimiter, async (req, res) => {
  try {
    const { filename } = req.params;
    const { backupPath } = req.query;

    // Validate filename
    if (!filename || typeof filename !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid filename'
      });
    }

    // Validate backupPath if provided
    if (backupPath && typeof backupPath !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid backupPath: Must be a string'
      });
    }
    
    const result = await backupController.deleteBackup(filename, backupPath);
    
    // Log backup deletion
    await auditController.logBackupAction(
      req.user.id,
      req.user.email,
      'DELETE',
      filename,
      { backupPath },
      req
    );
    
    res.json(result);
  } catch (error) {
    console.error('Delete backup error:', error);
    
    // Log failed deletion
    await auditController.logBackupAction(
      req.user.id,
      req.user.email,
      'DELETE_FAILED',
      filename,
      { error: error.message },
      req
    );
    
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/v1/settings/backups/config - Get backup configuration
router.get('/backups/config', authenticate, authorize('Admin'), (req, res) => {
  try {
    const result = backupController.getBackupConfig();
    res.json(result);
  } catch (error) {
    console.error('Get backup config error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/v1/settings/backups/disk-usage - Get disk usage statistics (READ operation)
router.get('/backups/disk-usage', authenticate, authorize('Admin'), backupReadLimiter, async (req, res) => {
  try {
    const result = await diskMonitor.getDiskUsage(req.query.backupPath);
    res.json(result);
  } catch (error) {
    console.error('Get disk usage error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/v1/settings/backups/apply-retention - Apply retention policy (WRITE operation)
router.post('/backups/apply-retention', authenticate, authorize('Admin'), backupWriteLimiter, async (req, res) => {
  try {
    const result = await diskMonitor.applyRetentionPolicy(req.body, req.body.backupPath);
    
    // Log retention action
    await auditController.logBackupAction(
      req.user.id,
      req.user.email,
      'RETENTION_APPLIED',
      null,
      { deleted: result.deleted },
      req
    );
    
    res.json(result);
  } catch (error) {
    console.error('Apply retention policy error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/v1/settings/backups/retention-policy - Get retention policy config
router.get('/backups/retention-policy', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const result = await diskMonitor.getRetentionPolicy();
    res.json(result);
  } catch (error) {
    console.error('Get retention policy error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/v1/settings/backups/encryption-status - Get encryption status
router.get('/backups/encryption-status', authenticate, authorize('Admin'), (req, res) => {
  try {
    const result = backupEncryption.getEncryptionStatus();
    res.json(result);
  } catch (error) {
    console.error('Get encryption status error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/v1/settings/backups/verify - Verify backup integrity (WRITE operation)
router.post('/backups/verify', authenticate, authorize('Admin'), backupWriteLimiter, async (req, res) => {
  try {
    const { filename, backupPath } = req.body;
    
    if (!filename) {
      return res.status(400).json({
        success: false,
        message: 'Filename is required'
      });
    }

    const backupDir = backupPath || backupController.getBackupDir();
    const filepath = path.join(backupDir, filename);
    
    const result = await backupEncryption.verifyBackup(filepath, {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || '5432',
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres'
    });
    
    // Log verification action
    await auditController.logBackupAction(
      req.user.id,
      req.user.email,
      'VERIFY',
      filename,
      { result: result.success },
      req
    );
    
    res.json(result);
  } catch (error) {
    console.error('Verify backup error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/v1/settings/audit-logs - Get audit logs (READ operation)
router.get('/audit-logs', authenticate, authorize('Admin'), backupReadLimiter, async (req, res) => {
  try {
    const result = await auditController.getAuditLogs(req.query);
    res.json(result);
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/v1/settings/backups/stats - Get backup statistics for dashboard (READ operation)
router.get('/backups/stats', authenticate, authorize('Admin'), backupReadLimiter, backupStats.getBackupStats);

// POST /api/v1/settings/backups/schedule/start - Start scheduled backup
router.post('/backups/schedule/start', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const result = await scheduledBackup.startScheduledBackup();
    res.json(result);
  } catch (error) {
    console.error('Start schedule error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/v1/settings/backups/schedule/stop - Stop scheduled backup
router.post('/backups/schedule/stop', authenticate, authorize('Admin'), (req, res) => {
  try {
    const result = scheduledBackup.stopScheduledBackup();
    res.json(result);
  } catch (error) {
    console.error('Stop schedule error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/v1/settings/backups/schedule/status - Get schedule status
router.get('/backups/schedule/status', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const result = await scheduledBackup.getBackupScheduleStatus();
    res.json(result);
  } catch (error) {
    console.error('Get schedule status error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/v1/settings/backups/schedule/test - Test scheduled backup (WRITE operation)
router.post('/backups/schedule/test', authenticate, authorize('Admin'), backupWriteLimiter, async (req, res) => {
  try {
    const result = await scheduledBackup.testScheduledBackup();
    res.json(result);
  } catch (error) {
    console.error('Test backup error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/v1/settings/email/test - Test email configuration
router.post('/email/test', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const result = await emailService.testEmailConfig();
    res.json(result);
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
