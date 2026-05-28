// Force IPv4 DNS resolution
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const { Sequelize } = require('sequelize');
require('dotenv').config();

console.log('🔧 Database initialization started');

let sequelize;

// Always prefer individual variables over DB_URL when DB_HOST is set
const useIndividualVars = process.env.DB_HOST && process.env.DB_USER;

if (process.env.DB_URL && !useIndividualVars) {
  console.log('✅ Using DB_URL connection string');
  sequelize = new Sequelize(process.env.DB_URL, {
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
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  });
} else if (process.env.DB_HOST) {
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
        ssl: sslConfig,
        servername: process.env.DB_HOST // SNI for Supabase pooler
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
