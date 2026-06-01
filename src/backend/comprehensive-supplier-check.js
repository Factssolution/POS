const axios = require('axios');
const sequelize = require('./config/database');

async function comprehensiveSupplierCheck() {
  try {
    console.log('🔍 COMPREHENSIVE SUPPLIER DATA FLOW CHECK\n');
    console.log('═'.repeat(100));

    // STEP 1: Check Database directly
    console.log('\n📊 STEP 1: Database Check');
    console.log('─'.repeat(100));
    
    const [dbSuppliers] = await sequelize.query(`
      SELECT id, name, contact, opening_balance, status, created_at, updated_at 
      FROM suppliers 
      ORDER BY id DESC
    `);

    console.log(`Total suppliers in DB: ${dbSuppliers.length}\n`);
    
    dbSuppliers.forEach(s => {
      console.log(`ID: ${s.id} | Name: ${s.name}`);
      console.log(`  created_at (raw): ${s.created_at}`);
      console.log(`  created_at (type): ${typeof s.created_at}`);
      console.log(`  created_at (is null): ${s.created_at === null}`);
      
      if (s.created_at) {
        const jsDate = new Date(s.created_at);
        console.log(`  JS Date valid: ${!isNaN(jsDate.getTime())}`);
        console.log(`  Formatted: ${jsDate.toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })}`);
      }
      console.log('');
    });

    // STEP 2: Login and get token
    console.log('\n🔐 STEP 2: Authentication');
    console.log('─'.repeat(100));
    
    const loginRes = await axios.post('http://localhost:5000/api/v1/auth/login', {
      email: 'factssolution@gmail.com',
      password: 'Black@786##'
    });

    const token = loginRes.data.token;
    console.log(`✅ Login successful: ${loginRes.data.user?.email}\n`);

    // STEP 3: Check API Response
    console.log('\n🌐 STEP 3: API Response Check');
    console.log('─'.repeat(100));
    
    const apiRes = await axios.get('http://localhost:5000/api/v1/suppliers', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log(`API Success: ${apiRes.data.success}`);
    console.log(`Total suppliers from API: ${apiRes.data.data.length}\n`);

    apiRes.data.data.forEach((s, i) => {
      console.log(`Supplier ${i + 1} (ID: ${s.id}): ${s.name}`);
      console.log(`  created_at: ${s.created_at}`);
      console.log(`  created_at (type): ${typeof s.created_at}`);
      console.log(`  created_at (is undefined): ${s.created_at === undefined}`);
      console.log(`  created_at (is null): ${s.created_at === null}`);
      console.log(`  updated_at: ${s.updated_at}`);
      
      if (s.created_at) {
        const jsDate = new Date(s.created_at);
        console.log(`  JS Date valid: ${!isNaN(jsDate.getTime())}`);
      }
      
      console.log(`  All keys: ${Object.keys(s).join(', ')}`);
      console.log('');
    });

    // STEP 4: Check Sequelize Model
    console.log('\n🗂️  STEP 4: Sequelize Model Check');
    console.log('─'.repeat(100));
    
    const { Supplier } = require('./models');
    const sequelizeSuppliers = await Supplier.findAll({ limit: 3, order: [['id', 'DESC']] });
    
    sequelizeSuppliers.forEach((s, i) => {
      console.log(`\nSequelize Supplier ${i + 1} (ID: ${s.id}): ${s.name}`);
      console.log(`  s.created_at: ${s.created_at}`);
      console.log(`  s.created_at (type): ${typeof s.created_at}`);
      console.log(`  s.toJSON().created_at: ${s.toJSON().created_at}`);
      console.log(`  s.dataValues.created_at: ${s.dataValues.created_at}`);
    });

    console.log('\n' + '═'.repeat(100));
    console.log('\n✅ Comprehensive check complete!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

comprehensiveSupplierCheck();
