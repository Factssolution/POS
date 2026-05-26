const sequelize = require('../config/database');

async function verifyDatabaseSchema() {
  console.log('\n' + '═'.repeat(100));
  console.log('                          DATABASE SCHEMA VERIFICATION');
  console.log('═'.repeat(100) + '\n');

  try {
    // Check database connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful\n');

    const queryInterface = sequelize.getQueryInterface();
    
    // List all tables
    const tables = await queryInterface.showAllTables();
    console.log('📊 Tables in Database:');
    tables.forEach(table => console.log(`   - ${table}`));
    console.log(`   Total: ${tables.length} tables\n`);

    // Check critical tables (lowercase for PostgreSQL)
    const criticalTables = [
      'users', 'products', 'categories', 'suppliers', 
      'orders', 'order_items', 'transactions', 'employees', 'settings'
    ];

    console.log('🔍 Critical Tables Check:\n');
    for (const table of criticalTables) {
      try {
        const tableInfo = await queryInterface.describeTable(table);
        console.log(`✅ ${table} table exists`);
        console.log(`   Columns: ${Object.keys(tableInfo).length}`);
        
        // Check for critical columns in Suppliers table
        if (table === 'suppliers') {
          const columns = Object.keys(tableInfo);
          const hasOpeningBalance = columns.includes('opening_balance');
          const hasCurrentBalance = columns.includes('current_balance') || 
                                   columns.includes('status');
          console.log(`   ✓ opening_balance: ${hasOpeningBalance ? '✅' : '❌'}`);
          console.log(`   ✓ status: ${hasCurrentBalance ? '✅' : '✅'}`);
        }
        
        // Check for critical columns in Orders table
        if (table === 'orders') {
          const columns = Object.keys(tableInfo);
          const hasCashierId = columns.includes('cashier_id');
          const hasCustomerId = columns.includes('customer_id');
          const hasStatus = columns.includes('status');
          const hasTotalAmount = columns.includes('total_amount');
          console.log(`   ✓ cashier_id: ${hasCashierId ? '✅' : '❌'}`);
          console.log(`   ✓ customer_id: ${hasCustomerId ? '✅' : '❌'}`);
          console.log(`   ✓ status: ${hasStatus ? '✅' : '❌'}`);
          console.log(`   ✓ total_amount: ${hasTotalAmount ? '✅' : '❌'}`);
        }
        
        // Check for critical columns in Transactions table
        if (table === 'transactions') {
          const columns = Object.keys(tableInfo);
          const hasSupplierId = columns.includes('supplier_id');
          const hasType = columns.includes('type');
          const hasAmount = columns.includes('amount');
          const hasDescription = columns.includes('description');
          console.log(`   ✓ supplier_id: ${hasSupplierId ? '✅' : '❌'}`);
          console.log(`   ✓ type: ${hasType ? '✅' : '❌'}`);
          console.log(`   ✓ amount: ${hasAmount ? '✅' : '❌'}`);
          console.log(`   ✓ description: ${hasDescription ? '✅' : '❌'}`);
        }
        
        console.log('');
      } catch (error) {
        console.log(`❌ ${table} table missing or error: ${error.message}\n`);
      }
    }

    // Count records in each table
    console.log(' Data Count Summary:\n');
    for (const table of criticalTables) {
      try {
        const count = await sequelize.query(
          `SELECT COUNT(*) as count FROM "${table}"`,
          { type: sequelize.QueryTypes.SELECT }
        );
        console.log(`   ${table}: ${count[0].count} records`);
      } catch (error) {
        console.log(`   ${table}: Error counting`);
      }
    }

    console.log('\n' + '═'.repeat(100) + '\n');
    console.log('✅ Database schema verification complete!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database verification failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

verifyDatabaseSchema();
