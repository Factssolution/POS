const { sequelize } = require('../config/database');
const { Order, OrderItem, Product, User, Employee, Supplier, Transaction, Settings, Category, AuditLog } = require('../models');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const zlib = require('zlib');
const util = require('util');
const backupEncryption = require('./backupEncryption');

const execPromise = util.promisify(exec);

// Detect if running on Vercel (serverless)
const isVercel = process.env.VERCEL === '1';

// Get database connection details from environment
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || '5432',
  database: process.env.DB_NAME || 'pos_system',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
};

// Backup folder configuration
const BACKUP_DIR = path.join(__dirname, '../../backups');

/**
 * Find pg_dump and psql executables
 * Tries common PostgreSQL installation paths on Windows
 */
const findPostgresBinaries = () => {
  const possiblePaths = [
    // Windows common paths (check newest first)
    'C:\\Program Files\\PostgreSQL\\17\\bin',
    'C:\\Program Files\\PostgreSQL\\16\\bin',
    'C:\\Program Files\\PostgreSQL\\15\\bin',
    'C:\\Program Files\\PostgreSQL\\14\\bin',
    'C:\\Program Files\\PostgreSQL\\13\\bin',
    'C:\\Program Files\\PostgreSQL\\12\\bin',
    'C:\\Program Files (x86)\\PostgreSQL\\17\\bin',
    'C:\\Program Files (x86)\\PostgreSQL\\16\\bin',
    'C:\\Program Files (x86)\\PostgreSQL\\15\\bin',
    // Try PATH (Linux/Mac or Windows with PG in PATH)
    ''
  ];

  for (const pgPath of possiblePaths) {
    const pgDumpPath = pgPath ? path.join(pgPath, 'pg_dump.exe') : 'pg_dump';
    const psqlPath = pgPath ? path.join(pgPath, 'psql.exe') : 'psql';
    
    try {
      // Check if executable exists and is accessible
      const testCmd = process.platform === 'win32' 
        ? `"${pgDumpPath}" --version`
        : `${pgDumpPath} --version`;
      
      require('child_process').execSync(testCmd, { stdio: 'pipe' });
      
      console.log(`✅ Found PostgreSQL binaries at: ${pgPath || 'PATH'}`);
      return {
        pg_dump: pgDumpPath,
        psql: psqlPath,
        available: true
      };
    } catch (err) {
      // Try next path
    }
  }

  console.warn('⚠️  PostgreSQL CLI tools (pg_dump/psql) not found. Using JSON backup fallback.');
  return {
    pg_dump: 'pg_dump',
    psql: 'psql',
    available: false
  };
};

const PG_BINARIES = findPostgresBinaries();

/**
 * Validate and sanitize backup path to prevent path traversal attacks
 */
const validateBackupPath = (customPath) => {
  if (!customPath || customPath === BACKUP_DIR) {
    return BACKUP_DIR;
  }

  // Resolve to absolute path
  const resolvedPath = path.resolve(customPath);
  
  // Ensure path is within allowed directories (project root or backups)
  const projectRoot = path.resolve(__dirname, '../..');
  if (!resolvedPath.startsWith(projectRoot)) {
    throw new Error('Invalid backup path: Path must be within project directory');
  }

  // Block dangerous characters
  if (/[<>:"|?*]/.test(customPath)) {
    throw new Error('Invalid backup path: Contains invalid characters');
  }

  return resolvedPath;
};

/**
 * Ensure backup directory exists
 */
const ensureBackupDir = (customPath) => {
  const backupDir = validateBackupPath(customPath);
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    console.log(`Created backup directory: ${backupDir}`);
  }
  return backupDir;
};

/**
 * Create a complete database backup
 * Uses Windows Batch file for 100% reliable pg_dump execution
 * Falls back to JSON export for development environments
 */
exports.createBackup = async (options = {}) => {
  try {
    // Check if running on Vercel (serverless doesn't support pg_dump or file system writes)
    if (isVercel) {
      throw new Error(
        'Database backups are not available in serverless mode. ' +
        'Please use the Supabase dashboard (https://hfusrtiqjyiotjewzzkt.supabase.co) to create database backups, ' +
        'or deploy the backend on a traditional server with file system access.'
      );
    }

    const backupDir = ensureBackupDir(options.backupPath);

    const {
      includeData = true,
      includeStructure = true,
      includeSettings = true,
      includeProducts = true,
      includeOrders = true,
      includeEmployees = true,
      includeSuppliers = true,
      includeTransactions = true,
      encrypt = process.env.BACKUP_ENCRYPTION_ENABLED === 'true',
      compress = true,
      useNativeFormat = true // Use PostgreSQL native format if available
    } = options;

    // Try native PostgreSQL backup using batch file (Windows)
    if (useNativeFormat && process.platform === 'win32') {
      return await createBackupViaBatchFile({
        backupDir,
        encrypt,
        compress,
        options: { includeData, includeStructure, includeSettings, includeProducts, includeOrders, includeEmployees, includeSuppliers, includeTransactions }
      });
    }
    
    // Fallback to JSON backup
    console.log('📦 Using JSON backup format (development mode)');
    return await createJsonBackup({
      backupDir,
      baseFilename: `pos_backup_${new Date().toISOString().replace(/[:.]/g, '-')}`,
      timestamp: new Date().toISOString(),
      encrypt,
      compress,
      options: { includeData, includeStructure, includeSettings, includeProducts, includeOrders, includeEmployees, includeSuppliers, includeTransactions }
    });

  } catch (error) {
    console.error('Backup creation failed:', error);
    throw new Error(`Failed to create backup: ${error.message}`);
  }
};

/**
 * Create backup using Windows Batch file (100% RELIABLE)
 */
async function createBackupViaBatchFile({ backupDir, encrypt, compress, options }) {
  console.log('🔵 Creating backup via Windows Batch file...');
  
  const batchFilePath = path.join(__dirname, '../scripts/create-backup.bat');
  
  // Verify batch file exists
  if (!fs.existsSync(batchFilePath)) {
    console.warn('⚠️  Batch file not found, falling back to native method');
    return await createNativeBackup({
      backupDir,
      baseFilename: `pos_backup_${new Date().toISOString().replace(/[:.]/g, '-')}`,
      timestamp: new Date().toISOString(),
      encrypt,
      compress,
      options
    });
  }

  // Execute batch file
  const { stdout, stderr } = await execPromise(`"${batchFilePath}"`, {
    cwd: path.dirname(batchFilePath),
    timeout: 300000 // 5 minutes timeout
  });

  console.log('Batch output:', stdout);
  
  if (stderr) {
    console.error('Batch stderr:', stderr);
  }

  // Parse JSON response from batch file
  const lines = stdout.trim().split('\n');
  const lastLine = lines[lines.length - 1];
  
  try {
    const result = JSON.parse(lastLine);
    
    if (result.success) {
      // Use filepath from batch output or find the latest backup file
      let filepath = result.filepath;
      
      if (!filepath || !fs.existsSync(filepath)) {
        // Find the actual backup file
        const files = fs.readdirSync(backupDir)
          .filter(f => f.includes('pos_backup') && f.endsWith('.backup'))
          .sort() 
          .reverse();
        
        if (files.length === 0) {
          throw new Error('Backup file not found after batch execution');
        }
        
        filepath = path.join(backupDir, files[0]);
      }
      
      const stats = fs.statSync(filepath);
      const filename = path.basename(filepath);
      
      console.log(`✅ Batch backup completed: ${filename} (${stats.size} bytes)`);
      
      return {
        success: true,
        filename,
        filepath,
        size: stats.size,
        originalSize: stats.size,
        timestamp: new Date().toISOString(),
        encrypted: false,
        compressed: false,
        format: 'postgresql_native',
        compressionRatio: 0,
        options,
        method: 'batch_file'
      };
    } else {
      throw new Error(result.error || 'Batch file reported failure');
    }
  } catch (parseError) {
    console.error('Failed to parse batch output:', parseError);
    throw new Error('Batch file execution failed');
  }
}

/**
 * Create native PostgreSQL backup (PROFESSIONAL FORMAT)
 */
async function createNativeBackup({ backupDir, baseFilename, timestamp, encrypt, compress, options }) {
  let filename = `${baseFilename}.backup`;
  let filepath = path.join(backupDir, filename);

  console.log('🔵 Creating PostgreSQL native backup:', filepath);

  // Build pg_dump command with custom format (compressed, parallel-capable)
  const dumpOptions = [
    '-h', DB_CONFIG.host,
    '-p', DB_CONFIG.port,
    '-U', DB_CONFIG.username,
    '-d', DB_CONFIG.database,
    '-F', 'c', // Custom format (compressed, supports parallel restore)
    '-f', `"${filepath}"`,
    '-v' // Verbose
  ];

  // Add table exclusions if needed
  if (!options.includeSettings || !options.includeProducts || !options.includeOrders) {
    if (!options.includeSettings) dumpOptions.push('--exclude-table=public.settings');
    if (!options.includeProducts) dumpOptions.push('--exclude-table=public.products');
    if (!options.includeOrders) {
      dumpOptions.push('--exclude-table=public.orders');
      dumpOptions.push('--exclude-table=public.order_items');
    }
    if (!options.includeEmployees) dumpOptions.push('--exclude-table=public.employees');
    if (!options.includeSuppliers) dumpOptions.push('--exclude-table=public.suppliers');
    if (!options.includeTransactions) dumpOptions.push('--exclude-table=public.transactions');
  }

  console.log('Executing pg_dump...');
  console.log('Database:', DB_CONFIG.database);
  console.log('Output:', filepath);

  // Execute pg_dump with environment variable for password
  const { stdout, stderr } = await execPromise(`"${PG_BINARIES.pg_dump}" ${dumpOptions.join(' ')}`, {
    env: {
      ...process.env,
      PGPASSWORD: DB_CONFIG.password
    }
  });

  if (stderr && !stderr.includes('WARNING')) {
    console.error('pg_dump warnings:', stderr);
  }

  // Verify backup file was created
  if (!fs.existsSync(filepath)) {
    throw new Error('Backup file was not created');
  }

  let originalSize = fs.statSync(filepath).size;
  let finalSize = originalSize;
  let encrypted = false;
  let compressed = true; // Custom format is already compressed

  console.log(`✅ Native backup created: ${originalSize} bytes`);

  // Optional: Additional gzip compression (usually not needed for custom format)
  if (compress) {
    const compressedPath = `${filepath}.gz`;
    const input = fs.readFileSync(filepath);
    const compressedData = zlib.gzipSync(input, { level: 9 });
    fs.writeFileSync(compressedPath, compressedData);
    
    fs.unlinkSync(filepath);
    
    filepath = compressedPath;
    filename = `${baseFilename}.backup.gz`;
    finalSize = fs.statSync(filepath).size;
    
    console.log(`📦 Compressed: ${originalSize} -> ${finalSize} bytes (${Math.round((1 - finalSize/originalSize) * 100)}% reduction)`);
  }

  // Optional: Encryption
  if (encrypt) {
    const encryptedPath = `${filepath}.enc`;
    await backupEncryption.encryptFile(filepath, encryptedPath);
    
    fs.unlinkSync(filepath);
    
    filepath = encryptedPath;
    filename = `${baseFilename}.backup.gz.enc`;
    finalSize = fs.statSync(filepath).size;
    encrypted = true;
    
    console.log(`🔒 Encrypted backup: ${filepath}`);
  }

  console.log(`✅ Native backup completed: ${filepath} (${finalSize} bytes)`);

  return {
    success: true,
    filename,
    filepath,
    size: finalSize,
    originalSize,
    timestamp: new Date().toISOString(),
    encrypted,
    compressed,
    format: 'postgresql_native',
    compressionRatio: Math.round((1 - finalSize/originalSize) * 100),
    options
  };
}

/**
 * Create JSON backup (DEVELOPMENT FALLBACK)
 */
async function createJsonBackup({ backupDir, baseFilename, timestamp, encrypt, compress, options }) {
  try {
    let filename = `${baseFilename}.json`;
    let filepath = path.join(backupDir, filename);

    console.log('Creating JSON backup:', filepath);

    // Build backup data object
    const backupData = {
      metadata: {
        version: '1.0',
        timestamp: new Date().toISOString(),
        database: DB_CONFIG.database,
        options: {
          includeData,
          includeStructure,
          includeSettings,
          includeProducts,
          includeOrders,
          includeEmployees,
          includeSuppliers,
          includeTransactions
        }
      },
      data: {}
    };

    // Export Settings
    if (options.includeSettings) {
      console.log('Exporting settings...');
      backupData.data.settings = await Settings.findAll({ raw: true });
    }

    // Export Products
    if (options.includeProducts) {
      console.log('Exporting products...');
      backupData.data.products = await Product.findAll({ raw: true });
    }

    // Export Categories
    console.log('Exporting categories...');
    backupData.data.categories = await Category.findAll({ raw: true });

    // Export Orders and Order Items
    if (options.includeOrders) {
      console.log('Exporting orders...');
      backupData.data.orders = await Order.findAll({ raw: true });
      backupData.data.order_items = await OrderItem.findAll({ raw: true });
    }

    // Export Employees
    if (options.includeEmployees) {
      console.log('Exporting employees...');
      backupData.data.employees = await Employee.findAll({ raw: true });
    }

    // Export Suppliers
    if (options.includeSuppliers) {
      console.log('Exporting suppliers...');
      backupData.data.suppliers = await Supplier.findAll({ raw: true });
    }

    // Export Transactions
    if (options.includeTransactions) {
      console.log('Exporting transactions...');
      backupData.data.transactions = await Transaction.findAll({ raw: true });
    }

    // Export Users
    console.log('Exporting users...');
    backupData.data.users = await User.findAll({ 
      raw: true,
      attributes: { exclude: ['password'] } // Don't export passwords
    });

    // Write backup file
    const jsonData = JSON.stringify(backupData, null, 2);
    fs.writeFileSync(filepath, jsonData);

    let originalSize = fs.statSync(filepath).size;
    let finalSize = originalSize;
    let encrypted = false;
    let compressed = false;

    console.log(`Backup created: ${originalSize} bytes, ${Object.keys(backupData.data).length} tables`);

    // Step 1: Compress with gzip (if enabled)
    if (compress) {
      const compressedPath = `${filepath}.gz`;
      const input = fs.readFileSync(filepath);
      const compressedData = zlib.gzipSync(input, { level: 9 });
      fs.writeFileSync(compressedPath, compressedData);
      
      // Remove uncompressed file
      fs.unlinkSync(filepath);
      
      filepath = compressedPath;
      filename = `${baseFilename}.json.gz`;
      finalSize = fs.statSync(filepath).size;
      compressed = true;
      
      console.log(`Compressed: ${originalSize} -> ${finalSize} bytes (${Math.round((1 - finalSize/originalSize) * 100)}% reduction)`);
    }

    // Step 2: Encrypt (if enabled)
    if (encrypt) {
      const encryptedPath = `${filepath}.enc`;
      await backupEncryption.encryptFile(filepath, encryptedPath);
      
      // Remove unencrypted file
      fs.unlinkSync(filepath);
      
      filepath = encryptedPath;
      filename = `${baseFilename}.json.gz.enc`;
      finalSize = fs.statSync(filepath).size;
      encrypted = true;
      
      console.log(`Encrypted backup: ${filepath}`);
    }

    console.log(`Backup completed successfully: ${filepath} (${finalSize} bytes)`);

    return {
      success: true,
      filename,
      filepath,
      size: finalSize,
      originalSize,
      timestamp: new Date().toISOString(),
      encrypted,
      compressed,
      compressionRatio: compressed ? Math.round((1 - finalSize/originalSize) * 100) : 0,
      options: backupData.metadata.options
    };

  } catch (error) {
    console.error('Backup creation failed:', error);
    throw new Error(`Failed to create backup: ${error.message}`);
  }
};

/**
 * List all backups in the backup directory
 */
exports.listBackups = async (backupPath) => {
  try {
    const backupDir = validateBackupPath(backupPath);
    
    if (!fs.existsSync(backupDir)) {
      return { backups: [] };
    }

    const files = fs.readdirSync(backupDir)
      .filter(file => file.endsWith('.json') || file.endsWith('.json.gz') || file.endsWith('.json.gz.enc') || 
                      file.endsWith('.sql') || file.endsWith('.sql.gz') || file.endsWith('.sql.gz.enc') ||
                      file.endsWith('.backup') || file.endsWith('.backup.gz') || file.endsWith('.backup.gz.enc'))
      .map(file => {
        const filepath = path.join(backupDir, file);
        const stats = fs.statSync(filepath);
        return {
          filename: file,
          filepath,
          size: stats.size,
          createdAt: stats.birthtime.toISOString(),
          modifiedAt: stats.mtime.toISOString()
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return {
      success: true,
      backups: files,
      totalBackups: files.length,
      backupDirectory: backupDir
    };

  } catch (error) {
    console.error('List backups failed:', error);
    throw new Error(`Failed to list backups: ${error.message}`);
  }
};

/**
 * Restore database from backup file
 */
exports.restoreBackup = async (filename, backupPath) => {
  try {
    // Validate filename to prevent path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      throw new Error('Invalid filename: Path traversal detected');
    }

    const backupDir = validateBackupPath(backupPath);
    const filepath = path.join(backupDir, filename);
    const isWindows = process.platform === 'win32';

    if (!fs.existsSync(filepath)) {
      throw new Error(`Backup file not found: ${filepath}`);
    }

    let restorePath = filepath;
    let needsCleanup = [];

    // Step 1: Decrypt if encrypted
    if (filename.endsWith('.enc')) {
      console.log('Decrypting backup file...');
      const decryptedPath = filepath.replace('.enc', '');
      await backupEncryption.decryptFile(filepath, decryptedPath);
      restorePath = decryptedPath;
      needsCleanup.push(decryptedPath);
      console.log('Decryption successful');
    }

    // Step 2: Decompress if gzipped
    if (restorePath.endsWith('.gz')) {
      console.log('Decompressing backup file...');
      const decompressedPath = restorePath.replace('.gz', '');
      const compressed = fs.readFileSync(restorePath);
      const decompressed = zlib.gunzipSync(compressed);
      fs.writeFileSync(decompressedPath, decompressed);
      restorePath = decompressedPath;
      needsCleanup.push(decompressedPath);
      console.log('Decompression successful');
    }

    // PostgreSQL restore command (Windows-compatible)
    const pgPassword = DB_CONFIG.password;
    let restoreCommand;
    
    if (isWindows) {
      restoreCommand = `set PGPASSWORD=${pgPassword} && psql -h ${DB_CONFIG.host} -p ${DB_CONFIG.port} -U ${DB_CONFIG.username} -d ${DB_CONFIG.database} -f "${restorePath}"`;
    } else {
      restoreCommand = `PGPASSWORD="${pgPassword}" psql -h ${DB_CONFIG.host} -p ${DB_CONFIG.port} -U ${DB_CONFIG.username} -d ${DB_CONFIG.database} -f "${restorePath}"`;
    }

    console.log('Restoring backup:', restorePath);

    // Execute restore
    const { stdout, stderr } = await execPromise(restoreCommand);

    if (stderr && !stderr.includes('NOTICE')) {
      console.error('Restore warnings:', stderr);
    }

    // Clean up temporary decrypted/decompressed files
    needsCleanup.forEach(file => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });

    console.log('Backup restored successfully');

    return {
      success: true,
      message: 'Database restored successfully',
      filename,
      restoredAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('Backup restore failed:', error);
    throw new Error(`Failed to restore backup: ${error.message}`);
  }
};

/**
 * Delete a backup file
 */
exports.deleteBackup = async (filename, backupPath) => {
  try {
    // Validate filename to prevent path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      throw new Error('Invalid filename: Path traversal detected');
    }

    const backupDir = validateBackupPath(backupPath);
    const filepath = path.join(backupDir, filename);

    if (!fs.existsSync(filepath)) {
      throw new Error(`Backup file not found: ${filepath}`);
    }

    fs.unlinkSync(filepath);

    return {
      success: true,
      message: 'Backup deleted successfully',
      filename
    };

  } catch (error) {
    console.error('Backup deletion failed:', error);
    throw new Error(`Failed to delete backup: ${error.message}`);
  }
};

/**
 * Get backup directory configuration
 */
exports.getBackupConfig = () => {
  return {
    success: true,
    backupDirectory: BACKUP_DIR,
    exists: fs.existsSync(BACKUP_DIR)
  };
};

/**
 * Get backup directory path
 */
exports.getBackupDir = () => {
  return BACKUP_DIR;
};
