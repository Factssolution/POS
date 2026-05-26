const bcrypt = require('bcryptjs');
const { Client } = require('pg');
require('dotenv').config();

const DB_NAME = process.env.DB_NAME || 'pos';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 5432;

async function seedDatabase() {
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

    // Hash admin password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    // Insert admin user
    await client.query(
      `INSERT INTO users (name, email, password, phone, role, status) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       ON CONFLICT (email) DO NOTHING`,
      ['Admin User', 'admin@factssolution.com', hashedPassword, '+91 9876543210', 'Admin', 'active']
    );
    console.log('✅ Admin user created: admin@factssolution.com / admin123');

    // Insert sample manager
    const managerPassword = await bcrypt.hash('manager123', salt);
    await client.query(
      `INSERT INTO users (name, email, password, phone, role, status) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       ON CONFLICT (email) DO NOTHING`,
      ['Manager User', 'manager@factssolution.com', managerPassword, '+91 9876543211', 'Manager', 'active']
    );
    console.log('✅ Manager user created: manager@factssolution.com / manager123');

    // Insert sample cashier
    const cashierPassword = await bcrypt.hash('cashier123', salt);
    await client.query(
      `INSERT INTO users (name, email, password, phone, role, status) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       ON CONFLICT (email) DO NOTHING`,
      ['Cashier User', 'cashier@factssolution.com', cashierPassword, '+91 9876543212', 'Cashier', 'active']
    );
    console.log('✅ Cashier user created: cashier@factssolution.com / cashier123');

    // Insert sample products
    const sampleProducts = [
      ['Coffee', 'Premium arabica coffee', 'Beverages', 120.00, 80.00, 50, 10, 'CF001'],
      ['Tea', 'Fresh green tea', 'Beverages', 80.00, 50.00, 100, 15, 'TE002'],
      ['Sandwich', 'Grilled vegetable sandwich', 'Food', 150.00, 90.00, 30, 5, 'SA003'],
      ['Cake', 'Chocolate cake slice', 'Desserts', 200.00, 120.00, 20, 5, 'CA004'],
      ['Juice', 'Fresh orange juice', 'Beverages', 100.00, 60.00, 40, 10, 'JU005']
    ];

    for (const product of sampleProducts) {
      await client.query(
        `INSERT INTO products (name, description, category, price, cost_price, stock, min_stock, barcode, status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active') 
         ON CONFLICT (barcode) DO NOTHING`,
        product
      );
    }
    console.log(`✅ ${sampleProducts.length} sample products inserted`);

    // Insert sample supplier
    await client.query(
      `INSERT INTO suppliers (name, contact, email, address, gst_number, opening_balance, status) 
       VALUES ($1, $2, $3, $4, $5, $6, 'active') 
       ON CONFLICT DO NOTHING`,
      ['ABC Distributors', '+91 9988776655', 'contact@abcdistributors.com', '123 Market Street, City', 'GST123456789', 5000.00]
    );
    console.log('✅ Sample supplier inserted');

    await client.end();
    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('   Admin: admin@factssolution.com / admin123');
    console.log('   Manager: manager@factssolution.com / manager123');
    console.log('   Cashier: cashier@factssolution.com / cashier123');
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

seedDatabase();
