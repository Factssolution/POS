// Force IPv4 DNS resolution
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const { Sequelize } = require('sequelize');

// Explicitly load pg driver for PostgreSQL
const pg = require('pg');

// Only load dotenv if not on Vercel (Vercel injects env vars automatically)
if (process.env.VERCEL !== '1') {
  require('dotenv').config();
}

if (process.env.VERCEL === '1') {
  console.log('🔧 Database initialization on Vercel serverless');
} else {
  console.log('🔧 Database initialization started');
}

let sequelize;

// ALWAYS use individual variables - DB_URL causes SNI issues with Supabase pooler
if (process.env.DB_HOST && process.env.DB_USER) {
  console.log(`✅ Using individual DB variables: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
  
  const sslConfig = process.env.DB_SSL === 'false' 
    ? false 
    : { 
        require: true, 
        rejectUnauthorized: false
      };
  
  sequelize = new Sequelize(
    process.env.DB_NAME || 'pos',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        },
        servername: process.env.DB_HOST // Required for Supabase pooler SNI
      },
      pool: process.env.VERCEL === '1'
        ? {
            // Vercel serverless: minimal pool (1 connection per invocation)
            max: 1,
            min: 0,
            acquire: 10000,
            idle: 5000,
            evict: 2000
          }
        : {
            // Local/traditional server: standard pool
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
