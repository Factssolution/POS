const { Sequelize } = require('sequelize');
require('dotenv').config();

// Use DB_URL if available (Supabase connection string), otherwise use individual variables
let sequelize;

if (process.env.DB_URL) {
  // Force SSL
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
  sequelize = new Sequelize(
    process.env.DB_NAME || 'pos',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      dialectOptions: {
        ssl: process.env.DB_SSL === 'true' ? {
          require: true,
          rejectUnauthorized: false
        } : false
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
  // Fallback: use default values
  console.log('️  No DB configuration found, using defaults');
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
