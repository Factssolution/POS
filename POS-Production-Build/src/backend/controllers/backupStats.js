const backupController = require('./backupController');
const diskMonitor = require('./diskMonitor');
const scheduledBackup = require('./scheduledBackup');

/**
 * Get comprehensive backup statistics for dashboard
 */
exports.getBackupStats = async (req, res) => {
  try {
    // Get disk usage
    const diskUsage = await diskMonitor.getDiskUsage();
    
    // Get backup list
    const backupList = await backupController.listBackups();
    
    // Get schedule status
    const scheduleStatus = await scheduledBackup.getBackupScheduleStatus();
    
    // Calculate statistics
    const totalBackups = backupList.backups?.length || 0;
    const totalSize = diskUsage.totalSize || 0;
    
    // Find latest backup
    const latestBackup = backupList.backups?.[0] || null;
    
    // Calculate backups by type
    const encryptedBackups = backupList.backups?.filter(b => b.filename.endsWith('.enc')).length || 0;
    const compressedBackups = backupList.backups?.filter(b => b.filename.endsWith('.gz')).length || 0;
    
    // Calculate average backup size
    const avgSize = totalBackups > 0 
      ? totalSize / totalBackups 
      : 0;

    res.json({
      success: true,
      data: {
        totalBackups,
        totalSize,
        totalSizeFormatted: diskUsage.totalSizeFormatted || '0 Bytes',
        avgSize,
        avgSizeFormatted: formatBytes(avgSize),
        latestBackup: latestBackup ? {
          filename: latestBackup.filename,
          size: latestBackup.size,
          sizeFormatted: formatBytes(latestBackup.size),
          createdAt: latestBackup.createdAt
        } : null,
        encryptedBackups,
        compressedBackups,
        schedule: scheduleStatus,
        diskUsage: {
          totalSize: diskUsage.totalSize,
          totalSizeFormatted: diskUsage.totalSizeFormatted,
          backupCount: diskUsage.backupCount,
          oldestBackup: diskUsage.oldestBackup,
          newestBackup: diskUsage.newestBackup
        }
      }
    });
  } catch (error) {
    console.error('Get backup stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get backup statistics',
      error: error.message
    });
  }
};

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes) {
  if (bytes === 0 || isNaN(bytes)) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
