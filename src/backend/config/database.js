const { Sequelize } = require('sequelize');

// Explicitly load pg driver for PostgreSQL
const pg = require('pg');

// Load Supabase SSL Certificate
const fs = require('fs');
const path = require('path');

// Configure pg to use IPv4 by resolving DNS ourselves
const dns = require('dns').promises;

// Only load dotenv if not on Vercel (Vercel injects env vars automatically)
if (process.env.VERCEL !== '1') {
  require('dotenv').config();
}

if (process.env.VERCEL === '1') {
  console.log('🔧 Database initialization on Vercel serverless');
} else {
  console.log('🔧 Database initialization started');
}

// Helper to resolve IPv4 address
const resolveIPv4 = async (hostname) => {
  try {
    const addresses = await dns.resolve(hostname);
    const ipv4 = addresses.find(addr => !addr.includes(':'));
    return ipv4 || hostname;
  } catch {
    return hostname;
  }
};

// Load Supabase CA certificate for SSL verification
let supabaseCA = null;
try {
  // Try multiple possible paths for the certificate
  const possiblePaths = [
    path.join(__dirname, '..', '..', '..', 'prod-ca-2021.crt'),
    path.join(process.cwd(), 'prod-ca-2021.crt'),
    path.join(__dirname, 'prod-ca-2021.crt')
  ];
  
  for (const certPath of possiblePaths) {
    if (fs.existsSync(certPath)) {
      supabaseCA = fs.readFileSync(certPath, 'utf8');
      console.log('✅ Loaded Supabase CA certificate from:', certPath);
      break;
    }
  }
  
  if (!supabaseCA && process.env.SUPABASE_CA_CERT) {
    supabaseCA = process.env.SUPABASE_CA_CERT;
    console.log('✅ Loaded Supabase CA from environment variable');
  }
} catch (err) {
  console.warn('⚠️  Could not load Supabase CA certificate:', err.message);
}

let sequelize = null;

// On Vercel, export a mock Sequelize that doesn't connect
if (process.env.VERCEL === '1') {
  console.log('⏭️  Skipping database initialization on Vercel (using Supabase REST API)');
  
  // Create mock Sequelize instance that models can use
  const { Sequelize } = require('sequelize');
  const mockSequelize = new Sequelize('postgres://mock:mock@mock:5432/mock', {
    dialect: 'postgres',
    logging: false,
    // Don't actually connect - this is just for model definitions
  });
  
  module.exports = mockSequelize;
} else {

// Function to initialize database connection (lazy loading)
const initializeDatabase = () => {
  if (sequelize) return sequelize; // Already initialized

  // Priority 1: Use DATABASE_URL if available (complete connection string)
  if (process.env.DATABASE_URL) {
  console.log('✅ Using DATABASE_URL connection string');
  console.log('🔍 DATABASE_URL:', process.env.DATABASE_URL.substring(0, 50) + '...');
  
  const isPooler = process.env.DATABASE_URL.includes('pooler.supabase.com');
  console.log(isPooler ? '🔗 Using Connection Pooler' : '🔗 Using Direct Connection');
  
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: console.log, // Enable logging to see errors
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // CRITICAL: Accept self-signed certs from Supabase pooler
        ca: supabaseCA || undefined
      }
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    retry: {
      max: 3,
      timeout: 10000
    }
  });
  
  // Test connection on startup
  sequelize.authenticate()
    .then(() => console.log('✅ Database connected successfully via DATABASE_URL'))
    .catch(err => console.error('❌ Database connection failed:', err.message));
}
// Priority 2: Use individual DB_* variables
else if (process.env.DB_HOST && process.env.DB_USER) {
  console.log(`✅ Database: ${process.env.DB_HOST}:${process.env.DB_PORT || 5432}`);
  
  // Disable SSL for local development, enable for Supabase/production
  const isLocalhost = process.env.DB_HOST === 'localhost' || process.env.DB_HOST === '127.0.0.1';
  
  sequelize = new Sequelize(
    process.env.DB_NAME || 'postgres',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'db.hfusrtiqjyiotjewzzkt.supabase.co',
      port: parseInt(process.env.DB_PORT) || 5432,
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      dialectOptions: isLocalhost ? {} : {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
      pool: process.env.VERCEL === '1'
        ? {
            max: 1,
            min: 0,
            acquire: 10000,
            idle: 5000,
            evict: 2000
          }
        : {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
          },
      define: {
        timestamps: true,
        underscored: true,
        freezeTableName: true
      }
    }
  );
} else {
  console.log('⚠️  No DB configuration found, using defaults');
  sequelize = new Sequelize('pos', 'postgres', '', {
    host: 'localhost',
    port: 5432,
    dialect: 'postgres',
    logging: false
  });
  }

  if (!sequelize) {
    throw new Error('Failed to initialize Sequelize');
  }

  return sequelize;
};

// Export getter function instead of direct instance
module.exports = {
  getSequelize: initializeDatabase,
  // For backward compatibility - will trigger lazy init
  authenticate: async () => {
    const sequelize = initializeDatabase();
    return sequelize.authenticate();
  }
};

} // End else block for non-Vercel
