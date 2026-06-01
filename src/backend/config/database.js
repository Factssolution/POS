const { Sequelize } = require('sequelize');

// Explicitly load pg driver for PostgreSQL
const pg = require('pg');

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

let sequelize;

// Priority 1: Use DATABASE_URL if available (complete connection string)
if (process.env.DATABASE_URL) {
  console.log('✅ Using DATABASE_URL connection string');
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
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

module.exports = sequelize;
