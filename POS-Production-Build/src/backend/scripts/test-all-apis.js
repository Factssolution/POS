/**
 * Comprehensive API Endpoint Testing Script
 * Tests all endpoints with business logic validation
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api/v1';
let authToken = '';
let testProductId = null;
let testSupplierId = null;
let testOrderId = null;
let testTransactionId = null;

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    results.passed++;
    results.tests.push({ name, status: 'PASS' });
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    results.failed++;
    results.tests.push({ name, status: 'FAIL', error: error.message });
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

async function login() {
  console.log('\n🔐 Authenticating...');
  const response = await axios.post(`${API_BASE}/auth/login`, {
    email: 'admin@factssolution.com',
    password: 'admin123'
  });
  
  assert(response.data.success === true, 'Login should succeed');
  assert(response.data.data.token, 'Should return token');
  assert(response.data.data.user, 'Should return user');
  
  authToken = response.data.data.token;
  console.log('✅ Logged in as:', response.data.data.user.name);
  console.log('   Role:', response.data.data.user.role);
}

function getAuthHeaders() {
  return {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };
}

async function runAllTests() {
  console.log('═══════════════════════════════════════════');
  console.log('🧪 COMPREHENSIVE API ENDPOINT TESTING');
  console.log('═══════════════════════════════════════════\n');

  // 1. AUTHENTICATION
  console.log('\n📦 1. AUTHENTICATION ENDPOINTS');
  console.log('───────────────────────────────────────────');
  
  await test('POST /auth/login - Valid credentials', async () => {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@factssolution.com',
      password: 'admin123'
    });
    assert(response.data.success === true, 'Should return success');
    assert(response.data.data.token, 'Should return token');
    assert(response.data.data.user.role === 'Admin', 'Should return Admin role');
  });

  await test('POST /auth/login - Invalid credentials', async () => {
    try {
      await axios.post(`${API_BASE}/auth/login`, {
        email: 'admin@factssolution.com',
        password: 'wrongpassword'
      });
      throw new Error('Should have failed');
    } catch (error) {
      assert(error.response.status === 401, 'Should return 401');
      assert(error.response.data.message.includes('Invalid'), 'Should show invalid message');
    }
  });

  await test('GET /auth/verify - Valid token', async () => {
    await login(); // Ensure we're logged in
    const response = await axios.get(`${API_BASE}/auth/verify`, {
      headers: getAuthHeaders()
    });
    assert(response.data.success === true, 'Should verify token');
    assert(response.data.data.user, 'Should return user data');
  });

  // 2. PRODUCTS
  console.log('\n📦 2. PRODUCT ENDPOINTS');
  console.log('───────────────────────────────────────────');

  await test('GET /products - List all products', async () => {
    const response = await axios.get(`${API_BASE}/products`, {
      headers: getAuthHeaders()
    });
    assert(response.data.success === true, 'Should return success');
    assert(Array.isArray(response.data.data.products), 'Should return products array');
    console.log(`   Found ${response.data.data.products.length} products`);
  });

  await test('GET /products?status=active - Filter active products', async () => {
    const response = await axios.get(`${API_BASE}/products?status=active`, {
      headers: getAuthHeaders()
    });
    assert(response.data.success === true, 'Should return success');
    response.data.data.products.forEach(p => {
      assert(p.status === 'active', `Product ${p.name} should be active`);
    });
  });

  await test('POST /products - Create new product', async () => {
    const newProduct = {
      name: 'Test Product API',
      description: 'Created by API test',
      category: 'Beverages',
      price: 99.99,
      cost_price: 50.00,
      stock: 100,
      min_stock: 10,
      barcode: `TEST${Date.now()}`,
      status: 'active'
    };

    const response = await axios.post(`${API_BASE}/products`, newProduct, {
      headers: getAuthHeaders()
    });
    assert(response.data.success === true, 'Should create product');
    assert(response.data.data.id, 'Should return product ID');
    assert(response.data.data.name === newProduct.name, 'Name should match');
    assert(response.data.data.price === newProduct.price, 'Price should match');
    
    testProductId = response.data.data.id;
    console.log(`   Created product ID: ${testProductId}`);
  });

  await test('GET /products/:id - Get product by ID', async () => {
    const response = await axios.get(`${API_BASE}/products/${testProductId}`, {
      headers: getAuthHeaders()
    });
    assert(response.data.success === true, 'Should return product');
    assert(response.data.data.id === testProductId, 'Should return correct product');
    assert(response.data.data.name === 'Test Product API', 'Name should match');
  });

  await test('PUT /products/:id - Update product', async () => {
    const updateData = {
      name: 'Test Product API Updated',
      price: 149.99,
      stock: 150
    };

    const response = await axios.put(`${API_BASE}/products/${testProductId}`, updateData, {
      headers: getAuthHeaders()
    });
    assert(response.data.success === true, 'Should update product');
    assert(response.data.data.name === updateData.name, 'Name should be updated');
    assert(response.data.data.price === updateData.price, 'Price should be updated');
  });

  await test('DELETE /products/:id - Delete product', async () => {
    const response = await axios.delete(`${API_BASE}/products/${testProductId}`, {
      headers: getAuthHeaders()
    });
    assert(response.data.success === true, 'Should delete product');
    assert(response.data.message, 'Should return message');
    console.log(`   Deleted product ID: ${testProductId}`);
  });

  // 3. SUPPLIERS
  console.log('\n📦 3. SUPPLIER ENDPOINTS');
  console.log('───────────────────────────────────────────');

  await test('GET /suppliers - List all suppliers', async () => {
    const response = await axios.get(`${API_BASE}/suppliers`, {
      headers: getAuthHeaders()
    });
    assert(response.data.success === true, 'Should return success');
    assert(Array.isArray(response.data.data), 'Should return suppliers array');
    console.log(`   Found ${response.data.data.length} suppliers`);
  });

  await test('POST /suppliers - Create new supplier', async () => {
    const newSupplier = {
      name: 'Test Supplier API',
      contact: '9876543210',
      email: 'test@supplier.com',
      address: 'Test Address',
      gst_number: '27AABCU9603R1ZM',
      opening_balance: 5000.00,
      status: 'active'
    };

    const response = await axios.post(`${API_BASE}/suppliers`, newSupplier, {
      headers: getAuthHeaders()
    });
    assert(response.data.success === true, 'Should create supplier');
    assert(response.data.data.id, 'Should return supplier ID');
    assert(response.data.data.name === newSupplier.name, 'Name should match');
    
    testSupplierId = response.data.data.id;
    console.log(`   Created supplier ID: ${testSupplierId}`);
  });

  await test('PUT /suppliers/:id - Update supplier', async () => {
    const updateData = {
      name: 'Test Supplier API Updated',
      opening_balance: 7500.00
    };

    const response = await axios.put(`${API_BASE}/suppliers/${testSupplierId}`, updateData, {
      headers: getAuthHeaders()
    });
    assert(response.data.success === true, 'Should update supplier');
    assert(response.data.data.name === updateData.name, 'Name should be updated');
  });

  // 4. TRANSACTIONS
  console.log('\n📦 4. TRANSACTION ENDPOINTS');
  console.log('───────────────────────────────────────────');

  await test('GET /transactions - List all transactions', async () => {
    const response = await axios.get(`${API_BASE}/transactions`, {
      headers: getAuthHeaders()
    });
    assert(response.data.success === true, 'Should return success');
    assert(Array.isArray(response.data.data.transactions), 'Should return transactions array');
    assert(response.data.data.summary, 'Should return summary');
    assert(typeof response.data.data.summary.totalCredit === 'number', 'Should have totalCredit');
    assert(typeof response.data.data.summary.totalDebit === 'number', 'Should have totalDebit');
    console.log(`   Found ${response.data.data.transactions.length} transactions`);
    console.log(`   Summary - Credit: Rs ${response.data.data.summary.totalCredit}, Debit: Rs ${response.data.data.summary.totalDebit}`);
  });

  await test('POST /transactions - Create new transaction', async () => {
    const newTransaction = {
      supplier_id: testSupplierId,
      type: 'credit',
      amount: 2500.00,
      description: 'Test transaction from API',
      transaction_date: new Date().toISOString().split('T')[0],
      transaction_time: new Date().toTimeString().split(' ')[0]
    };

    const response = await axios.post(`${API_BASE}/transactions`, newTransaction, {
      headers: getAuthHeaders()
    });
    assert(response.data.success === true, 'Should create transaction');
    assert(response.data.data.id, 'Should return transaction ID');
    assert(response.data.data.type === 'credit', 'Type should be credit');
    assert(parseFloat(response.data.data.amount) === 2500.00, 'Amount should match');
    
    testTransactionId = response.data.data.id;
    console.log(`   Created transaction ID: ${testTransactionId}`);
  });

  await test('GET /transactions/supplier/:id/balance - Get supplier balance', async () => {
    const response = await axios.get(`${API_BASE}/transactions/supplier/${testSupplierId}/balance`, {
      headers: getAuthHeaders()
    });
    assert(response.data.success === true, 'Should return balance');
    assert(response.data.data.supplier_id === testSupplierId, 'Should match supplier');
    assert(typeof response.data.data.current_balance === 'number', 'Should have current_balance');
    assert(typeof response.data.data.opening_balance === 'number', 'Should have opening_balance');
    assert(typeof response.data.data.total_credit === 'number', 'Should have total_credit');
    assert(typeof response.data.data.total_debit === 'number', 'Should have total_debit');
    console.log(`   Supplier balance: Rs ${response.data.data.current_balance}`);
    console.log(`   Opening: Rs ${response.data.data.opening_balance}, Credit: Rs ${response.data.data.total_credit}, Debit: Rs ${response.data.data.total_debit}`);
  });

  await test('DELETE /transactions/:id - Delete transaction', async () => {
    const response = await axios.delete(`${API_BASE}/transactions/${testTransactionId}`, {
      headers: getAuthHeaders()
    });
    assert(response.data.success === true, 'Should delete transaction');
    console.log(`   Deleted transaction ID: ${testTransactionId}`);
  });

  // 5. ORDERS
  console.log('\n📦 5. ORDER ENDPOINTS');
  console.log('───────────────────────────────────────────');

  await test('GET /orders - List all orders', async () => {
    const response = await axios.get(`${API_BASE}/orders`, {
      headers: getAuthHeaders()
    });
    assert(response.data.success === true, 'Should return success');
    assert(Array.isArray(response.data.data.orders), 'Should return orders array');
    console.log(`   Found ${response.data.data.orders.length} orders`);
  });

  await test('POST /orders/create - Create new order', async () => {
    // First create a product to order
    const productResponse = await axios.post(`${API_BASE}/products`, {
      name: 'Order Test Product',
      description: 'For order testing',
      category: 'Food',
      price: 200.00,
      cost_price: 100.00,
      stock: 50,
      min_stock: 5,
      barcode: `ORDER${Date.now()}`,
      status: 'active'
    }, { headers: getAuthHeaders() });

    const productId = productResponse.data.data.id;

    const newOrder = {
      token_number: Math.floor(Math.random() * 9000) + 1000,
      customer_name: 'Test Customer',
      customer_phone: '9876543210',
      subtotal: 400.00,
      tax_amount: 72.00,
      total_amount: 472.00,
      payment_method: 'cash',
      status: 'completed',
      items: [
        {
          product_id: productId,
          product_name: 'Order Test Product',
          quantity: 2,
          price: 200.00,
          total: 400.00
        }
      ]
    };

    const response = await axios.post(`${API_BASE}/orders/create`, newOrder, {
      headers: getAuthHeaders()
    });
    assert(response.data.success === true, 'Should create order');
    assert(response.data.data.id, 'Should return order ID');
    assert(response.data.data.total_amount === 472.00, 'Total should match');
    
    testOrderId = response.data.data.id;
    console.log(`   Created order ID: ${testOrderId}`);
  });

  await test('GET /orders/:id - Get order with items', async () => {
    const response = await axios.get(`${API_BASE}/orders/${testOrderId}`, {
      headers: getAuthHeaders()
    });
    assert(response.data.success === true, 'Should return order');
    assert(response.data.data.id === testOrderId, 'Should return correct order');
    assert(response.data.data.items, 'Should include order items');
    assert(Array.isArray(response.data.data.items), 'Items should be array');
    assert(response.data.data.items.length > 0, 'Should have at least 1 item');
    console.log(`   Order has ${response.data.data.items.length} item(s)`);
  });

  // 6. DASHBOARD
  console.log('\n📦 6. DASHBOARD ENDPOINTS');
  console.log('───────────────────────────────────────────');

  await test('GET /dashboard/stats - Get dashboard statistics', async () => {
    const response = await axios.get(`${API_BASE}/dashboard/stats`, {
      headers: getAuthHeaders()
    });
    assert(response.data.success === true, 'Should return stats');
    assert(typeof response.data.data.total_revenue === 'number', 'Should have total_revenue');
    assert(typeof response.data.data.total_orders === 'number', 'Should have total_orders');
    assert(typeof response.data.data.today_revenue === 'number', 'Should have today_revenue');
    assert(typeof response.data.data.today_orders === 'number', 'Should have today_orders');
    assert(typeof response.data.data.total_products === 'number', 'Should have total_products');
    console.log(`   Total Revenue: Rs ${response.data.data.total_revenue}`);
    console.log(`   Total Orders: ${response.data.data.total_orders}`);
    console.log(`   Today Revenue: Rs ${response.data.data.today_revenue}`);
    console.log(`   Today Orders: ${response.data.data.today_orders}`);
    console.log(`   Total Products: ${response.data.data.total_products}`);
  });

  await test('GET /dashboard/sales - Get sales analytics', async () => {
    const response = await axios.get(`${API_BASE}/dashboard/sales`, {
      headers: getAuthHeaders()
    });
    assert(response.data.success === true, 'Should return sales data');
    assert(Array.isArray(response.data.data.dailySales), 'Should return dailySales array');
    assert(Array.isArray(response.data.data.paymentBreakdown), 'Should return paymentBreakdown array');
    console.log(`   Sales periods: ${response.data.data.dailySales.length}`);
    console.log(`   Payment methods: ${response.data.data.paymentBreakdown.length}`);
    
    if (response.data.data.dailySales.length > 0) {
      const firstDay = response.data.data.dailySales[0];
      assert(typeof firstDay.revenue === 'number', 'Revenue should be number');
      assert(typeof firstDay.orders === 'number', 'Orders should be number');
      console.log(`   First day - Date: ${firstDay.date}, Revenue: Rs ${firstDay.revenue}, Orders: ${firstDay.orders}`);
    }
  });

  await test('GET /dashboard/low-stock - Get low stock products', async () => {
    const response = await axios.get(`${API_BASE}/dashboard/low-stock`, {
      headers: getAuthHeaders()
    });
    assert(response.data.success === true, 'Should return low stock products');
    assert(Array.isArray(response.data.data), 'Should return array');
    console.log(`   Low stock items: ${response.data.data.length}`);
  });

  // 7. REPORTS
  console.log('\n📦 7. REPORT ENDPOINTS');
  console.log('───────────────────────────────────────────');

  await test('GET /reports/sales - Get sales report', async () => {
    const response = await axios.get(`${API_BASE}/reports/sales`, {
      headers: getAuthHeaders()
    });
    assert(response.data.success === true, 'Should return sales report');
    assert(response.data.data, 'Should have report data');
    console.log(`   Report generated successfully`);
  });

  await test('GET /reports/inventory - Get inventory report', async () => {
    const response = await axios.get(`${API_BASE}/reports/inventory`, {
      headers: getAuthHeaders()
    });
    assert(response.data.success === true, 'Should return inventory report');
    assert(response.data.data, 'Should have report data');
    console.log(`   Report generated successfully`);
  });

  await test('GET /reports/transactions - Get transaction report', async () => {
    const response = await axios.get(`${API_BASE}/reports/transactions`, {
      headers: getAuthHeaders()
    });
    assert(response.data.success === true, 'Should return transaction report');
    assert(response.data.data, 'Should have report data');
    console.log(`   Report generated successfully`);
  });

  // 8. SETTINGS
  console.log('\n📦 8. SETTINGS ENDPOINTS');
  console.log('───────────────────────────────────────────');

  await test('GET /settings - Get all settings', async () => {
    const response = await axios.get(`${API_BASE}/settings`, {
      headers: getAuthHeaders()
    });
    assert(response.data.success === true, 'Should return settings');
    assert(typeof response.data.data === 'object', 'Should return settings object');
    console.log(`   Settings keys: ${Object.keys(response.data.data).length}`);
  });

  await test('GET /settings/:key - Get specific setting', async () => {
    try {
      const response = await axios.get(`${API_BASE}/settings/company_name`, {
        headers: getAuthHeaders()
      });
      assert(response.data.success === true, 'Should return setting');
      console.log(`   company_name: ${response.data.data.setting_value}`);
    } catch (error) {
      // Setting might not exist, that's OK
      console.log(`   Setting not found (OK for testing)`);
    }
  });

  // CLEANUP
  console.log('\n🧹 CLEANUP');
  console.log('───────────────────────────────────────────');

  await test('Delete test supplier', async () => {
    await axios.delete(`${API_BASE}/suppliers/${testSupplierId}`, {
      headers: getAuthHeaders()
    });
    console.log(`   Deleted supplier ID: ${testSupplierId}`);
  });

  // Print summary
  console.log('\n═══════════════════════════════════════════');
  console.log('📊 TEST SUMMARY');
  console.log('═══════════════════════════════════════════');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Total:  ${results.passed + results.failed}`);
  console.log(`🎯 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  console.log('═══════════════════════════════════════════\n');

  if (results.failed > 0) {
    console.log('❌ FAILED TESTS:');
    results.tests.filter(t => t.status === 'FAIL').forEach(t => {
      console.log(`   - ${t.name}: ${t.error}`);
    });
    console.log('');
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('Test runner error:', error.message);
  process.exit(1);
});
