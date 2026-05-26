const axios = require('axios');

async function testSalesAnalyticsWithDateFilter() {
  console.log('\n Testing Sales Analytics with Date Filter...\n');
  
  const baseUrl = 'http://localhost:5000/api/v1';
  
  try {
    // Login as admin
    const loginResponse = await axios.post(`${baseUrl}/auth/login`, {
      email: 'admin@factssolution.com',
      password: 'admin123'
    });
    
    const adminToken = loginResponse.data.data.token;
    console.log('✅ Admin logged in\n');
    
    // Test 1: Without date filter (should return all data)
    console.log('Test 1: Without Date Filter');
    console.log('─'.repeat(60));
    const allTimeResponse = await axios.get(`${baseUrl}/dashboard/sales`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const allTimeData = allTimeResponse.data.data;
    console.log(`Daily Sales Count: ${allTimeData.dailySales?.length || 0}`);
    console.log(`Payment Breakdown: ${allTimeData.paymentBreakdown?.length || 0}`);
    
    if (allTimeData.dailySales?.length > 0) {
      const totalRevenue = allTimeData.dailySales.reduce((sum, day) => sum + day.revenue, 0);
      const totalOrders = allTimeData.dailySales.reduce((sum, day) => sum + day.orders, 0);
      console.log(`Total Revenue: Rs ${totalRevenue}`);
      console.log(`Total Orders: ${totalOrders}`);
      console.log('✅ PASS: Data returned without filter\n');
    } else {
      console.log('️  No data found\n');
    }
    
    // Test 2: With date filter (last 7 days)
    console.log('Test 2: With Date Filter (Last 7 Days)');
    console.log('─'.repeat(60));
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    const params = {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
    
    console.log(`Date Range: ${params.startDate} to ${params.endDate}`);
    
    const filteredResponse = await axios.get(`${baseUrl}/dashboard/sales`, {
      params,
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const filteredData = filteredResponse.data.data;
    console.log(`Daily Sales Count: ${filteredData.dailySales?.length || 0}`);
    console.log(`Payment Breakdown: ${filteredData.paymentBreakdown?.length || 0}`);
    
    if (filteredData.dailySales?.length > 0) {
      const totalRevenue = filteredData.dailySales.reduce((sum, day) => sum + day.revenue, 0);
      const totalOrders = filteredData.dailySales.reduce((sum, day) => sum + day.orders, 0);
      console.log(`Total Revenue: Rs ${totalRevenue}`);
      console.log(`Total Orders: ${totalOrders}`);
      console.log('✅ PASS: Date filter working!\n');
    } else {
      console.log('❌ FAIL: No data returned with date filter\n');
      console.log('This means orders are outside this date range');
    }
    
    // Test 3: Check actual order dates in database
    console.log('Test 3: Checking Order Dates in Database');
    console.log('─'.repeat(60));
    const ordersResponse = await axios.get(`${baseUrl}/orders`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const orders = ordersResponse.data.orders || [];
    console.log(`Total Orders: ${orders.length}`);
    
    if (orders.length > 0) {
      const orderDates = orders.map(o => new Date(o.created_at).toISOString().split('T')[0]);
      const uniqueDates = [...new Set(orderDates)];
      console.log(`Order Dates: ${uniqueDates.join(', ')}`);
      
      // Check if any orders fall within last 7 days
      const ordersInRange = orders.filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate >= startDate && orderDate <= endDate;
      });
      
      console.log(`Orders in Last 7 Days: ${ordersInRange.length}`);
      
      if (ordersInRange.length > 0) {
        console.log('✅ Orders exist in date range');
      } else {
        console.log('⚠️  No orders in last 7 days - this is expected if orders are older');
      }
    }
    
  } catch (error) {
    console.error(' Error:', error.response?.data || error.message);
  }
}

testSalesAnalyticsWithDateFilter();
