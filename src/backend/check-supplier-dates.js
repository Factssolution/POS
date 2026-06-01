const sequelize = require('./config/database');

async function checkSupplierDates() {
  try {
    console.log('🔍 Checking Supplier Dates in Database...\n');
    
    const [suppliers] = await sequelize.query(`
      SELECT 
        id, 
        name, 
        contact, 
        opening_balance,
        status,
        created_at,
        updated_at,
        CASE 
          WHEN created_at IS NULL THEN 'NULL'
          WHEN created_at = '0001-01-01 00:00:00' THEN 'INVALID'
          ELSE 'VALID'
        END as date_status
      FROM suppliers
      ORDER BY id
    `);

    console.log(`Total Suppliers: ${suppliers.length}\n`);
    console.log('═'.repeat(100));
    
    suppliers.forEach(s => {
      console.log(`\nID: ${s.id}`);
      console.log(`  Name: ${s.name}`);
      console.log(`  Contact: ${s.contact}`);
      console.log(`  Opening Balance: Rs ${parseFloat(s.opening_balance).toLocaleString()}`);
      console.log(`  Status: ${s.status}`);
      console.log(`  created_at: ${s.created_at}`);
      console.log(`  Date Status: ${s.date_status}`);
      
      if (s.created_at) {
        const date = new Date(s.created_at);
        console.log(`  JS Date Valid: ${!isNaN(date.getTime())}`);
        console.log(`  Formatted: ${date.toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })}`);
      }
    });

    console.log('\n' + '═'.repeat(100));
    console.log('\n✅ Date check complete!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkSupplierDates();
