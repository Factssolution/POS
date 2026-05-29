// Force IPv4 DNS resolution
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const { Sequelize } = require('sequelize');
require('dotenv').config();

console.log('🔧 Database initialization started');

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
