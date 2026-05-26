const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  console.log('\n' + '═'.repeat(70));
  console.log('   POS SYSTEM - DATABASE SETUP');
  console.log('═'.repeat(70) + '\n');

  // Database Configuration
  const DB_NAME = 'pos';
  const DB_PASSWORD = 'Black@786##';
  
  // Step 1: Connect to PostgreSQL default database to create 'pos' database
  console.log('[1/5] Creating database...');
  const adminClient = new Client({
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: DB_PASSWORD
  });

  try {
    await adminClient.connect();
    console.log('✓ Connected to PostgreSQL');

    // Check if database exists
    const dbExists = await adminClient.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [DB_NAME]
    );

    if (dbExists.rows.length === 0) {
      await adminClient.query(`CREATE DATABASE ${DB_NAME}`);
      console.log(`✓ Database "${DB_NAME}" created successfully`);
    } else {
      console.log(`✓ Database "${DB_NAME}" already exists`);
    }

    await adminClient.end();
  } catch (error) {
    console.error('❌ Error creating database:', error.message);
    process.exit(1);
  }

  // Step 2: Connect to 'pos' database and run schema
  console.log('\n[2/5] Setting up database schema...');
  const posClient = new Client({
    host: 'localhost',
    port: 5432,
    database: DB_NAME,
    user: 'postgres',
    password: DB_PASSWORD
  });

  try {
    await posClient.connect();
    console.log(`✓ Connected to "${DB_NAME}" database`);

    // Read SQL schema file
    const schemaPath = path.join(__dirname, 'database-schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute schema (without INSERT statements for users - we'll do that separately)
    const schemaWithoutInserts = schemaSQL
      .split('-- =====================================================')[0] + 
      schemaSQL.split('-- INSERT DEFAULT SETTINGS')[1]
        .split('-- INSERT DEFAULT USERS')[0];

    await posClient.query(schemaWithoutInserts);
    console.log('✓ Database schema created successfully');

    // Step 3: Hash passwords
    console.log('\n[3/5] Creating default users...');
    const superAdminPassword = 'Black@786##';
    const adminPassword = 'Test@123';

    const superAdminHash = await bcrypt.hash(superAdminPassword, 10);
    const adminHash = await bcrypt.hash(adminPassword, 10);

    console.log('✓ Passwords hashed successfully');

    // Step 4: Insert users with hashed passwords
    await posClient.query('DELETE FROM users WHERE email IN ($1, $2)', 
      ['factsolution@gmail.com', 'admin@factssolution.com']);

    await posClient.query(
      `INSERT INTO users (name, email, password_hash, role, status) VALUES
       ('Super Admin', $1, $2, 'Super Admin', 'active'),
       ('Admin User', $3, $4, 'Admin', 'active')`,
      ['factsolution@gmail.com', superAdminHash, 'admin@factssolution.com', adminHash]
    );

    console.log('✓ Super Admin created: factsolution@gmail.com');
    console.log('✓ Admin User created: admin@factssolution.com');

    // Step 5: Verify setup
    console.log('\n[4/5] Verifying setup...');
    
    const tables = await posClient.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log(`✓ ${tables.rows.length} tables created:`);
    tables.rows.forEach(row => console.log(`  - ${row.table_name}`));

    const settingsCount = await posClient.query('SELECT COUNT(*) FROM settings');
    console.log(`✓ ${settingsCount.rows[0].count} settings initialized`);

    const usersCount = await posClient.query('SELECT COUNT(*) FROM users');
    console.log(`✓ ${usersCount.rows[0].count} users created`);

    await posClient.end();

    // Step 6: Create backups directory
    console.log('\n[5/5] Creating backups directory...');
    const backupsDir = path.join(__dirname, '..', 'src', 'backend', 'backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
      console.log('✓ Backups directory created');
    } else {
      console.log('✓ Backups directory already exists');
    }

  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    console.error(error.stack);
    process.exit(1);
  }

  // Success message
  console.log('\n' + '═'.repeat(70));
  console.log('   ✓ DATABASE SETUP COMPLETED SUCCESSFULLY!');
  console.log('═'.repeat(70));
  console.log('\n📋 Default Login Credentials:');
  console.log('   Super Admin:');
  console.log('     Email: factsolution@gmail.com');
  console.log('     Password: Black@786##');
  console.log('\n   Admin:');
  console.log('     Email: admin@factssolution.com');
  console.log('     Password: Test@123');
  console.log('\n📊 System Configuration:');
  console.log('   Trial Period: 45 days');
  console.log('   Monthly Price: Rs 5,000');
  console.log('   Yearly Price: Rs 50,000');
  console.log('   Lifetime Price: Rs 150,000');
  console.log('\n🚀 Next Step:');
  console.log('   Run "03-Start-Servers.bat" to start the application');
  console.log('\n' + '═'.repeat(70) + '\n');
}

setupDatabase();
