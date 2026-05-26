const fs = require('fs');
const path = require('path');

const BACKUP_DIR = path.join(__dirname, '../../backups');

/**
 * Get disk space usage for backup directory
 */
exports.getDiskUsage = async (backupPath = BACKUP_DIR) => {
  try {
    if (!fs.existsSync(backupPath)) {
      return {
        success: true,
        backupDirectory: backupPath,
        exists: false,
        totalSize: 0,
        backupCount: 0,
        oldestBackup: null,
        newestBackup: null,
        backups: []
      };
    }

    const files = fs.readdirSync(backupPath)
      .filter(file => file.endsWith('.sql'))
      .map(file => {
        const filepath = path.join(backupPath, file);
        const stats = fs.statSync(filepath);
        return {
          filename: file,
          filepath,
          size: stats.size,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime
        };
      });

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const sortedByDate = [...files].sort((a, b) => a.createdAt - b.createdAt);

    return {
      success: true,
      backupDirectory: backupPath,
      exists: true,
      totalSize,
      totalSizeFormatted: formatBytes(totalSize),
      backupCount: files.length,
      oldestBackup: sortedByDate.length > 0 ? {
        filename: sortedByDate[0].filename,
        date: sortedByDate[0].createdAt.toISOString()
      } : null,
      newestBackup: sortedByDate.length > 0 ? {
        filename: sortedByDate[sortedByDate.length - 1].filename,
        date: sortedByDate[sortedByDate.length - 1].createdAt.toISOString()
      } : null,
      backups: files.map(f => ({
        filename: f.filename,
        size: f.size,
        sizeFormatted: formatBytes(f.size),
        createdAt: f.createdAt.toISOString()
      }))
    };
  } catch (error) {
    console.error('Get disk usage error:', error);
    throw error;
  }
};

/**
 * Auto-delete old backups based on retention policy
 */
exports.applyRetentionPolicy = async (options = {}, backupPath = BACKUP_DIR) => {
  try {
    const {
      maxBackups = 10,          // Keep only last N backups
      maxAgeDays = 30,          // Delete backups older than N days
      maxSizeMB = 500           // Delete oldest if total size exceeds N MB
    } = options;

    if (!fs.existsSync(backupPath)) {
      return {
        success: true,
        message: 'Backup directory does not exist',
        deleted: []
      };
    }

    const files = fs.readdirSync(backupPath)
      .filter(file => file.endsWith('.sql'))
      .map(file => {
        const filepath = path.join(backupPath, file);
        const stats = fs.statSync(filepath);
        return {
          filename: file,
          filepath,
          size: stats.size,
          createdAt: stats.birthtime
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt); // Newest first

    const deleted = [];
    const now = new Date();
    let totalSize = files.reduce((sum, f) => sum + f.size, 0);

    // 1. Delete backups older than maxAgeDays
    const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
    for (const file of files) {
      const ageMs = now - file.createdAt;
      if (ageMs > maxAgeMs) {
        fs.unlinkSync(file.filepath);
        totalSize -= file.size;
        deleted.push({
          filename: file.filename,
          reason: 'age_exceeded',
          ageDays: Math.round(ageMs / (1000 * 60 * 60 * 24))
        });
      }
    }

    // 2. Delete excess backups beyond maxBackups
    const remaining = files.filter(f => !deleted.some(d => d.filename === f.filename));
    if (remaining.length > maxBackups) {
      const toDelete = remaining.slice(maxBackups);
      for (const file of toDelete) {
        fs.unlinkSync(file.filepath);
        totalSize -= file.size;
        deleted.push({
          filename: file.filename,
          reason: 'count_exceeded'
        });
      }
    }

    // 3. Delete oldest backups if total size exceeds maxSizeMB
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (totalSize > maxSizeBytes) {
      const stillRemaining = remaining.filter(f => !deleted.some(d => d.filename === f.filename));
      // Already sorted newest first, so delete from the end (oldest)
      while (totalSize > maxSizeBytes && stillRemaining.length > 0) {
        const oldest = stillRemaining.pop();
        fs.unlinkSync(oldest.filepath);
        totalSize -= oldest.size;
        deleted.push({
          filename: oldest.filename,
          reason: 'size_exceeded'
        });
      }
    }

    return {
      success: true,
      message: `Retention policy applied. Deleted ${deleted.length} backup(s).`,
      deleted,
      remainingBackups: files.length - deleted.length,
      totalSize,
      totalSizeFormatted: formatBytes(totalSize)
    };
  } catch (error) {
    console.error('Apply retention policy error:', error);
    throw error;
  }
};

/**
 * Get retention policy configuration
 */
exports.getRetentionPolicy = async () => {
  // These could be loaded from settings in production
  return {
    success: true,
    policy: {
      maxBackups: 10,
      maxAgeDays: 30,
      maxSizeMB: 500
    }
  };
};

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
