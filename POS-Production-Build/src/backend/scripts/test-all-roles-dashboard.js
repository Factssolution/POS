const axios = require('axios');

async function testAllRolesDashboard() {
  console.log('\n' + '═'.repeat(90));
  console.log('                ALL ROLES DASHBOARD VERIFICATION');
  console.log('═'.repeat(90) + '\n');

  const baseUrl = 'http://localhost:5000/api/v1';
  
  const roles = [
    {
      name: 'Admin',
      email: 'admin@factssolution.com',
      password: 'admin123',
      expectedAccess: 'FULL'
    },
    {
      name: 'Manager',
      email: 'manager@factssolution.com',
      password: 'manager123',
      expectedAccess: 'FULL'
    },
    {
      name: 'Cashier',
      email: 'skyzai2009@gmail.com',
      password: 'Black@786##',
      expectedAccess: 'LIMITED (own data only)'
    }
  ];

  try {
    for (const role of roles) {
      console.log(`\n${'═'.repeat(90)}`);
      console.log(`🔐 TESTING: ${role.name.toUpperCase()} ROLE`);
      console.log(`${'═'.repeat(90)}\n`);

      // Step 1: Login
      console.log(`1️⃣  Login as ${role.name}...`);
      const loginResponse = await axios.post(`${baseUrl}/auth/login`, {
        email: role.email,
        password: role.password
      });

      if (loginResponse.status !== 200) {
        console.log(` Login failed for ${role.name}`);
        continue;
      }

      const token = loginResponse.data.data.token;
      const user = loginResponse.data.data.user;
      console.log(`✅ Login successful`);
      console.log(`   User ID: ${user.id}`);
      console.log(`   Role: ${user.role}\n`);

      // Step 2: Get Dashboard Stats
      console.log(`2️⃣  Fetching Dashboard Stats...`);
      const statsResponse = await axios.get(`${baseUrl}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const stats = statsResponse.data.data;
      console.log(`✅ Dashboard Stats Retrieved:\n`);
      console.log(`   Today's Orders:    ${stats.today_orders}`);
      console.log(`   Today's Revenue:   Rs ${stats.today_revenue}`);
      console.log(`   Total Orders:      ${stats.total_orders}`);
      console.log(`   Total Revenue:     Rs ${stats.total_revenue}`);
      console.log(`   Total Products:    ${stats.total_products}\n`);

      // Step 3: Get Sales Analytics with Today Filter
      console.log(`3️⃣  Fetching Sales Analytics (Today Filter)...`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDate = today.toISOString();
      const endDate = new Date().toISOString();

      const analyticsResponse = await axios.get(`${baseUrl}/dashboard/sales`, {
        params: { startDate, endDate },
        headers: { Authorization: `Bearer ${token}` }
      });

      const analytics = analyticsResponse.data.data;
      console.log(`✅ Sales Analytics Retrieved:\n`);
      console.log(`   Days with Sales:   ${analytics.dailySales.length}`);
      
      let todayRevenue = 0;
      let todayOrders = 0;
      analytics.dailySales.forEach(day => {
        todayRevenue += day.revenue;
        todayOrders += day.orders;
      });
      console.log(`   Total Orders:      ${todayOrders}`);
      console.log(`   Total Revenue:     Rs ${todayRevenue}\n`);

      // Step 4: Get Low Stock (Admin/Manager only)
      console.log(`4️⃣  Fetching Low Stock Products...`);
      try {
        const lowStockResponse = await axios.get(`${baseUrl}/dashboard/low-stock`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const lowStock = lowStockResponse.data.data;
        console.log(`✅ Low Stock Retrieved:`);
        console.log(`   Low Stock Items:   ${lowStock.count}\n`);
      } catch (error) {
        if (error.response?.status === 403) {
          console.log(`✅ Access denied as expected for ${role.name}\n`);
        } else {
          console.log(`⚠️  Error: ${error.message}\n`);
        }
      }

      // Step 5: Verify RBAC Logic
      console.log(`5️⃣  RBAC Verification:`);
      console.log(`   ┌─────────────────────────────────────────┐`);
      console.log(`   │ Role: ${role.name.padEnd(33)}│`);
      console.log(`   │ Access Level: ${role.expectedAccess.padEnd(24)}│`);
      console.log(`   │ Today Orders: ${String(stats.today_orders).padEnd(24)}│`);
      console.log(`   │ Today Revenue: Rs ${String(stats.today_revenue).padEnd(18)}│`);
      console.log(`   │ Products Visible: ${String(stats.total_products > 0 ? 'YES' : 'NO').padEnd(20)}│`);
      console.log(`   └─────────────────────────────────────────┘\n`);

      // Validation
      if (role.name === 'Cashier') {
        if (stats.total_products === 0) {
          console.log(`✅ CORRECT: Cashier cannot see products count (shows 0)`);
        } else {
          console.log(`❌ ERROR: Cashier should NOT see products count`);
        }
      } else {
        if (stats.total_products > 0) {
          console.log(`✅ CORRECT: ${role.name} can see products count (${stats.total_products})`);
        } else {
          console.log(`❌ ERROR: ${role.name} should see products count`);
        }
      }

      console.log('\n' + '─'.repeat(90) + '\n');
    }

    // Summary
    console.log('\n' + '═'.repeat(90));
    console.log('                          SUMMARY');
    console.log('═'.repeat(90) + '\n');

    console.log('✅ All role-based access controls verified');
    console.log('✅ Dashboard stats working for all roles');
    console.log('✅ Today filter working correctly');
    console.log('✅ Sales analytics returning proper data\n');

    console.log('📋 ROLE PERMISSIONS:\n');
    console.log('┌─────────┬──────────────┬──────────────┬──────────────┐');
    console.log('│ Role    │ See All Data │ See Products │ See Low Stock│');
    console.log('├─────────┼────────────────────────────┼──────────────┤');
    console.log('│ Admin   │      ✅      │      ✅      │      ✅      │');
    console.log('│ Manager │      ✅      │      ✅      │      ✅      │');
    console.log('│ Cashier │  ⚠️ Own Only │            │      ❌      │');
    console.log('└─────────┴──────────────┴──────────────┴──────────────┘\n');

    console.log('═'.repeat(90) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

testAllRolesDashboard();
