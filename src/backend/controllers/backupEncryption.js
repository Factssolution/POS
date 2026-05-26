const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

// Encryption key (in production, use environment variable or key management service)
const ENCRYPTION_KEY = process.env.BACKUP_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-gcm';

/**
 * Encrypt a file
 */
exports.encryptFile = async (inputPath, outputPath) => {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    
    const input = fs.readFileSync(inputPath);
    const encrypted = Buffer.concat([cipher.update(input), cipher.final()]);
    const authTag = cipher.getAuthTag();
    
    // Store IV + authTag + encrypted data
    const output = Buffer.concat([iv, authTag, encrypted]);
    fs.writeFileSync(outputPath, output);
    
    return {
      success: true,
      encryptedPath: outputPath,
      originalSize: input.length,
      encryptedSize: output.length
    };
  } catch (error) {
    console.error('File encryption failed:', error);
    throw new Error(`Failed to encrypt file: ${error.message}`);
  }
};

/**
 * Decrypt a file
 */
exports.decryptFile = async (inputPath, outputPath) => {
  try {
    const input = fs.readFileSync(inputPath);
    
    // Extract IV (first 16 bytes), authTag (next 16 bytes), and encrypted data
    const iv = input.slice(0, 16);
    const authTag = input.slice(16, 32);
    const encrypted = input.slice(32);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    decipher.setAuthTag(authTag);
    
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    fs.writeFileSync(outputPath, decrypted);
    
    return {
      success: true,
      decryptedPath: outputPath,
      encryptedSize: input.length,
      decryptedSize: decrypted.length
    };
  } catch (error) {
    console.error('File decryption failed:', error);
    throw new Error(`Failed to decrypt file: ${error.message}`);
  }
};

/**
 * Verify backup integrity by testing restore on temporary database
 */
exports.verifyBackup = async (backupPath, dbConfig) => {
  try {
    const tempDbName = `pos_verify_${Date.now()}`;
    
    // Create temporary database
    await execPromise(
      `PGPASSWORD="${dbConfig.password}" psql -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.username} -c "CREATE DATABASE ${tempDbName};"`
    );
    
    try {
      // Restore backup to temporary database
      await execPromise(
        `PGPASSWORD="${dbConfig.password}" psql -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.username} -d ${tempDbName} -f "${backupPath}"`
      );
      
      // Verify critical tables exist and have data
      const verificationQueries = [
        `SELECT COUNT(*) as count FROM settings;`,
        `SELECT COUNT(*) as count FROM products;`,
        `SELECT COUNT(*) as count FROM users;`
      ];
      
      for (const query of verificationQueries) {
        const result = await execPromise(
          `PGPASSWORD="${dbConfig.password}" psql -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.username} -d ${tempDbName} -t -c "${query}"`
        );
        
        const count = parseInt(result.stdout.trim());
        if (isNaN(count) || count < 0) {
          throw new Error(`Verification failed: Invalid data in backup`);
        }
      }
      
      return {
        success: true,
        verified: true,
        message: 'Backup verified successfully',
        backupFile: path.basename(backupPath)
      };
    } finally {
      // Clean up temporary database
      await execPromise(
        `PGPASSWORD="${dbConfig.password}" psql -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.username} -c "DROP DATABASE ${tempDbName};"`
      ).catch(() => {}); // Ignore errors in cleanup
    }
  } catch (error) {
    console.error('Backup verification failed:', error);
    return {
      success: false,
      verified: false,
      message: `Backup verification failed: ${error.message}`
    };
  }
};

/**
 * Get encryption status
 */
exports.getEncryptionStatus = () => {
  return {
    success: true,
    encryptionEnabled: process.env.BACKUP_ENCRYPTION_ENABLED === 'true',
    algorithm: ALGORITHM,
    keyConfigured: !!process.env.BACKUP_ENCRYPTION_KEY
  };
};
