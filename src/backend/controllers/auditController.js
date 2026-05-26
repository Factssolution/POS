const { AuditLog } = require('../models');

/**
 * Log an audit event
 */
exports.logAction = async (options) => {
  try {
    const {
      userId,
      userEmail,
      action,
      entityType,
      entityId,
      settingKey,
      oldValue,
      newValue,
      ipAddress,
      userAgent,
      metadata,
      status = 'success',
      errorMessage
    } = options;

    await AuditLog.create({
      user_id: userId,
      user_email: userEmail,
      action,
      entity_type: entityType,
      entity_id: entityId,
      setting_key: settingKey,
      old_value: oldValue !== undefined ? String(oldValue) : null,
      new_value: newValue !== undefined ? String(newValue) : null,
      ip_address: ipAddress,
      user_agent: userAgent,
      metadata: metadata || null,
      status,
      error_message: errorMessage
    });

    return true;
  } catch (error) {
    console.error('Audit log creation failed:', error);
    // Don't throw - audit logging failure shouldn't break the main operation
    return false;
  }
};

/**
 * Get audit logs with filtering
 */
exports.getAuditLogs = async (filters = {}) => {
  try {
    const {
      userId,
      action,
      entityType,
      settingKey,
      startDate,
      endDate,
      limit = 100,
      offset = 0
    } = filters;

    const where = {};
    
    if (userId) where.user_id = userId;
    if (action) where.action = action;
    if (entityType) where.entity_type = entityType;
    if (settingKey) where.setting_key = settingKey;
    
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at.$gte = new Date(startDate);
      if (endDate) where.created_at.$lte = new Date(endDate);
    }

    const logs = await AuditLog.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    return {
      success: true,
      logs,
      total: await AuditLog.count({ where })
    };
  } catch (error) {
    console.error('Get audit logs error:', error);
    throw error;
  }
};

/**
 * Log settings change
 */
exports.logSettingsChange = async (userId, userEmail, settingKey, oldValue, newValue, req) => {
  return exports.logAction({
    userId,
    userEmail,
    action: 'UPDATE',
    entityType: 'settings',
    settingKey,
    oldValue,
    newValue,
    ipAddress: req?.ip,
    userAgent: req?.headers?.['user-agent'],
    metadata: {
      endpoint: req?.originalUrl,
      method: req?.method
    }
  });
};

/**
 * Log backup action
 */
exports.logBackupAction = async (userId, userEmail, action, filename, metadata, req) => {
  return exports.logAction({
    userId,
    userEmail,
    action: `BACKUP_${action.toUpperCase()}`,
    entityType: 'backup',
    settingKey: filename,
    metadata: {
      ...metadata,
      ip_address: req?.ip,
      user_agent: req?.headers?.['user-agent']
    }
  });
};
