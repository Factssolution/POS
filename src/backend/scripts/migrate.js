const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const DB_NAME = process.env.DB_NAME || 'pos';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 5432;

console.log('Environment loaded:');
console.log('  DB_PASSWORD exists:', !!DB_PASSWORD);
console.log('  DB_PASSWORD length:', DB_PASSWORD ? DB_PASSWORD.length : 0);

async function createDatabase() {
  console.log('Attempting connection with:');
  console.log('  Host:', DB_HOST);
  console.log('  Port:', DB_PORT);
  console.log('  User:', DB_USER);
  console.log('  Database:', 'postgres');
  console.log('  Password:', DB_PASSWORD ? '*** (set)' : '(empty - trust auth)');
  
  // Connect to default postgres database to create our database
  const clientConfig = {
    host: DB_HOST,
    port: parseInt(DB_PORT),
    user: DB_USER,
    database: 'postgres'
  };
  
  // Only add password if it's set and not empty
  if (DB_PASSWORD && DB_PASSWORD !== '""') {
    clientConfig.password = DB_PASSWORD;
  } else {
    // For trust authentication, pass empty string
    clientConfig.password = '';
  }
  
  const client = new Client(clientConfig);

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL server');

    // Check if database exists
    const res = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [DB_NAME]
    );

    if (res.rows.length === 0) {
      await client.query(`CREATE DATABASE ${DB_NAME}`);
      console.log(`✅ Database '${DB_NAME}' created successfully`);
    } else {
      console.log(`ℹ️  Database '${DB_NAME}' already exists`);
    }

    await client.end();
  } catch (error) {
    console.error('❌ Error creating database:', error.message);
    process.exit(1);
  }
}

async function runMigrations() {
  // Connect to our database
  const clientConfig = {
    host: DB_HOST,
    port: parseInt(DB_PORT),
    user: DB_USER,
    database: DB_NAME
  };
  
  if (DB_PASSWORD && DB_PASSWORD !== '""') {
    clientConfig.password = DB_PASSWORD;
  } else {
    clientConfig.password = '';
  }
  
  const client = new Client(clientConfig);

  try {
    await client.connect();
    console.log('✅ Connected to database:', DB_NAME);

    // Create tables in dependency order
    const queries = [
      // 1. Users table
      `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        role VARCHAR(50) DEFAULT 'Cashier' CHECK (role IN ('Admin', 'Manager', 'Cashier')),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // 2. Products table
      `CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100) NOT NULL,
        price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
        cost_price DECIMAL(10, 2) NOT NULL CHECK (cost_price >= 0),
        stock INTEGER DEFAULT 0 CHECK (stock >= 0),
        min_stock INTEGER DEFAULT 5 CHECK (min_stock >= 0),
        barcode VARCHAR(100) UNIQUE NOT NULL,
        image_url VARCHAR(500),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // 3. Employees table
      `CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(255),
        user_id VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // 4. Suppliers table
      `CREATE TABLE IF NOT EXISTS suppliers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        contact VARCHAR(20) NOT NULL,
        email VARCHAR(255),
        address TEXT,
        gst_number VARCHAR(50),
        opening_balance DECIMAL(12, 2) DEFAULT 0 CHECK (opening_balance >= 0),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // 5. Transactions table
      `CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
        type VARCHAR(20) NOT NULL CHECK (type IN ('credit', 'debit')),
        amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
        description TEXT,
        transaction_date DATE NOT NULL,
        transaction_time TIME NOT NULL,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // 6. Orders table
      `CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        token_number INTEGER NOT NULL,
        customer_name VARCHAR(255),
        customer_phone VARCHAR(20),
        subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
        tax_amount DECIMAL(10, 2) DEFAULT 0 CHECK (tax_amount >= 0),
        total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
        payment_method VARCHAR(20) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'upi', 'other')),
        cashier_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'cancelled')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // 7. Order Items table
      `CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
        product_name VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL CHECK (quantity >= 1),
        price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
        total DECIMAL(10, 2) NOT NULL CHECK (total >= 0)
      )`,

      // 8. Settings table
      `CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    // Execute table creation queries
    for (const query of queries) {
      await client.query(query);
    }
    console.log('✅ All tables created successfully');

    // Create indexes
    const indexQueries = [
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)',
      'CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)',
      'CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)',
      'CREATE INDEX IF NOT EXISTS idx_products_status ON products(status)',
      'CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status)',
      'CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status)',
      'CREATE INDEX IF NOT EXISTS idx_transactions_supplier ON transactions(supplier_id)',
      'CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date)',
      'CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type)',
      'CREATE INDEX IF NOT EXISTS idx_orders_token ON orders(token_number)',
      'CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)',
      'CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id)',
      'CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id)'
    ];

    for (const query of indexQueries) {
      await client.query(query);
    }
    console.log('✅ All indexes created successfully');

    // Insert default settings
    const defaultSettings = [
      ['company_name', 'Facts Solution Store'],
      ['company_phone', '+91 9876543210'],
      ['company_email', 'contact@factssolution.com'],
      ['company_address', '123 Business Street, City, State'],
      ['tax_rate', '18'],
      ['currency_symbol', 'Rs'],
      ['receipt_footer', 'Thank you for your business!'],
      ['receipt_static_footer', 'Powered by Factssolution, All Rights Reserved 2025-2026']
    ];

    for (const [key, value] of defaultSettings) {
      await client.query(
        `INSERT INTO settings (setting_key, setting_value) 
         VALUES ($1, $2) 
         ON CONFLICT (setting_key) DO NOTHING`,
        [key, value]
      );
    }
    console.log('✅ Default settings inserted successfully');

    await client.end();
    console.log('✅ Migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run migration
async function main() {
  console.log('🚀 Starting database migration...\n');
  await createDatabase();
  await runMigrations();
}

main();
