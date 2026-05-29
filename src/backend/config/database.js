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

// Use Supabase pooler for Vercel (IPv4 guaranteed) and direct connection for local
const isVercel = process.env.VERCEL === '1';

if (process.env.DB_HOST && process.env.DB_USER) {
  // For Vercel: Use Supabase Transaction Pooler (IPv4 support)
  // Pooler host: aws-0-ap-southeast-1.pooler.supabase.com:6543
  // Direct host: db.hfusrtiqjyiotjewzzkt.supabase.co:5432
  
  const dbHost = isVercel 
    ? 'aws-0-ap-southeast-1.pooler.supabase.com'
    : process.env.DB_HOST;
    
  const dbPort = isVercel 
    ? 6543 
    : parseInt(process.env.DB_PORT) || 5432;
    
  const dbUser = isVercel
    ? 'postgres.hfusrtiqjyiotjewzzkt'
    : process.env.DB_USER;
  
  console.log(`✅ Database: ${dbHost}:${dbPort} (${isVercel ? 'Vercel/Pooler' : 'Direct'})`);
  
  sequelize = new Sequelize(
    process.env.DB_NAME || 'postgres',
    dbUser,
    process.env.DB_PASSWORD || '',
    {
      host: dbHost,
      port: dbPort,
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        },
        servername: isVercel ? 'aws-0-ap-southeast-1.pooler.supabase.com' : process.env.DB_HOST
      },
      pool: isVercel
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
