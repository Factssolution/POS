const cron = require('node-cron');
const backupController = require('./backupController');
const diskMonitor = require('./diskMonitor');
const emailService = require('./emailService');
const { Settings } = require('../models');

// Store scheduled jobs
const scheduledJobs = new Map();

/**
 * Get backup schedule from settings
 */
const getBackupSchedule = async () => {
  try {
    const enabled = await Settings.findOne({ where: { setting_key: 'auto_backup_enabled' } });
    const frequency = await Settings.findOne({ where: { setting_key: 'backup_frequency' } });
    const time = await Settings.findOne({ where: { setting_key: 'backup_time' } });
    
    return {
      enabled: enabled?.setting_value === 'true',
      frequency: frequency?.setting_value || 'daily',
      time: time?.setting_value || '02:00' // Default 2 AM
    };
  } catch (error) {
    console.error('Failed to get backup schedule:', error);
    return { enabled: false, frequency: 'daily', time: '02:00' };
  }
};

/**
 * Convert frequency and time to cron expression
 */
const frequencyToCron = (frequency, time) => {
  const [hours, minutes] = time.split(':').map(Number);
  
  switch (frequency) {
    case 'hourly':
      return '0 * * * *'; // Every hour
    case 'daily':
      return `${minutes} ${hours} * * *`; // Daily at specific time
    case 'weekly':
      return `${minutes} ${hours} * * 0`; // Sunday at specific time
    case 'monthly':
      return `${minutes} ${hours} 1 * *`; // 1st of month at specific time
    default:
      return `${minutes} ${hours} * * *`; // Daily
  }
};

/**
 * Execute scheduled backup
 */
const executeScheduledBackup = async () => {
  try {
    console.log('🔄 Starting scheduled backup...');
    
    const result = await backupController.createBackup({
      includeData: true,
      includeStructure: true,
      includeSettings: true,
      includeProducts: true,
      includeOrders: true,
      includeEmployees: true,
      includeSuppliers: true,
      includeTransactions: true,
      encrypt: process.env.BACKUP_ENCRYPTION_ENABLED === 'true',
      compress: true
    });

    console.log('✅ Scheduled backup successful:', result.filename);

    // Send success email notification
    await emailService.sendBackupNotification({
      type: 'success',
      filename: result.filename,
      size: result.size,
      timestamp: result.timestamp
    });

    return result;
  } catch (error) {
    console.error('❌ Scheduled backup failed:', error);

    // Send failure email notification
    await emailService.sendBackupNotification({
      type: 'failure',
      error: error.message,
      timestamp: new Date().toISOString()
    });

    throw error;
  }
};

/**
 * Start scheduled backup job
 */
exports.startScheduledBackup = async () => {
  try {
    // Stop existing job if any
    if (scheduledJobs.has('auto_backup')) {
      scheduledJobs.get('auto_backup').stop();
      scheduledJobs.delete('auto_backup');
      console.log('Stopped existing backup schedule');
    }

    const schedule = await getBackupSchedule();
    
    if (!schedule.enabled) {
      console.log('⏸️  Automatic backups are disabled');
      return { success: true, message: 'Automatic backups disabled' };
    }

    const cronExpression = frequencyToCron(schedule.frequency, schedule.time);
    console.log(`📅 Scheduling backup with cron: ${cronExpression} (${schedule.frequency} at ${schedule.time})`);

    const job = cron.schedule(cronExpression, async () => {
      await executeScheduledBackup();
    }, {
      scheduled: true,
      timezone: process.env.TZ || 'Asia/Karachi'
    });

    scheduledJobs.set('auto_backup', job);
    
    console.log('✅ Scheduled backup job started successfully');
    
    return {
      success: true,
      message: `Backup scheduled: ${schedule.frequency} at ${schedule.time}`,
      cronExpression,
      nextRun: job.nextDates().toDate()
    };
  } catch (error) {
    console.error('Failed to start scheduled backup:', error);
    throw error;
  }
};

/**
 * Stop scheduled backup job
 */
exports.stopScheduledBackup = () => {
  if (scheduledJobs.has('auto_backup')) {
    scheduledJobs.get('auto_backup').stop();
    scheduledJobs.delete('auto_backup');
    console.log('⏸️  Scheduled backup job stopped');
    return { success: true, message: 'Backup schedule stopped' };
  }
  
  return { success: false, message: 'No backup schedule found' };
};

/**
 * Get scheduled backup status
 */
exports.getBackupScheduleStatus = async () => {
  const schedule = await getBackupSchedule();
  const isActive = scheduledJobs.has('auto_backup');
  
  let nextRun = null;
  if (isActive) {
    const job = scheduledJobs.get('auto_backup');
    nextRun = job.nextDates().toDate();
  }

  return {
    success: true,
    enabled: schedule.enabled,
    frequency: schedule.frequency,
    time: schedule.time,
    isActive,
    cronExpression: frequencyToCron(schedule.frequency, schedule.time),
    nextRun: nextRun?.toISOString() || null
  };
};

/**
 * Test scheduled backup (run immediately)
 */
exports.testScheduledBackup = async () => {
  console.log('🧪 Testing scheduled backup...');
  return await executeScheduledBackup();
};

/**
 * Initialize scheduled backups on server start
 */
exports.initializeScheduledBackups = async () => {
  try {
    await exports.startScheduledBackup();
  } catch (error) {
    console.error('Failed to initialize scheduled backups:', error);
  }
};
