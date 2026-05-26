/**
 * FRONTEND INTEGRATION TEST SUITE
 * Tests real API integration with frontend components
 * Validates TypeScript interfaces, data types, and business logic
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api/v1';
let token = '';
let adminId = null;

// Test results
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

function getAuthHeaders() {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

async function runTests() {
  console.log('🧪 FRONTEND INTEGRATION TEST SUITE');
  console.log('Testing real API integration with frontend components\n');
  console.log('═══════════════════════════════════════════\n');

  try {
    // Login
    console.log('🔐 AUTHENTICATION');
    console.log('───────────────────────────────────────────');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@factssolution.com',
      password: 'admin123'
    });
    token = loginResponse.data.data.token;
    adminId = loginResponse.data.data.user.id;
    console.log('✅ Logged in as Admin\n');

    // 1. DASHBOARD COMPONENT INTEGRATION
    console.log('📊 1. DASHBOARD COMPONENT');
    console.log('───────────────────────────────────────────');

    await test('Dashboard stats match frontend interface', async () => {
      const response = await axios.get(`${API_BASE}/dashboard/stats`, {
        headers: getAuthHeaders()
      });
      
      const data = response.data.data;
      
      // Frontend interface expects these exact fields
      assert(typeof data.total_revenue === 'number', 'total_revenue must be number (frontend interface)');
      assert(typeof data.total_orders === 'number', 'total_orders must be number');
      assert(typeof data.today_revenue === 'number', 'today_revenue must be number');
      assert(typeof data.today_orders === 'number', 'today_orders must be number');
      assert(typeof data.total_products === 'number', 'total_products must be number');
      
      console.log(`   Revenue: Rs ${data.total_revenue}, Orders: ${data.total_orders}`);
    });

    await test('Sales analytics match frontend interface', async () => {
      const response = await axios.get(`${API_BASE}/dashboard/sales`, {
        headers: getAuthHeaders()
      });
      
      const data = response.data.data;
      
      // Frontend expects dailySales and paymentBreakdown arrays
      assert(Array.isArray(data.dailySales), 'dailySales must be array');
      assert(Array.isArray(data.paymentBreakdown), 'paymentBreakdown must be array');
      
      if (data.dailySales.length > 0) {
        const day = data.dailySales[0];
        assert(typeof day.revenue === 'number', 'dailySales[].revenue must be number');
        assert(typeof day.orders === 'number', 'dailySales[].orders must be number');
        assert(typeof day.date === 'string', 'dailySales[].date must be string');
      }
      
      if (data.paymentBreakdown.length > 0) {
        const payment = data.paymentBreakdown[0];
        assert(typeof payment.method === 'string', 'paymentBreakdown[].method must be string');
        assert(typeof payment.amount === 'number', 'paymentBreakdown[].amount must be number');
        assert(typeof payment.count === 'number', 'paymentBreakdown[].count must be number');
      }
      
      console.log(`   Daily sales periods: ${data.dailySales.length}`);
      console.log(`   Payment methods: ${data.paymentBreakdown.length}`);
    });

    await test('Low stock products for dashboard', async () => {
      const response = await axios.get(`${API_BASE}/dashboard/low-stock`, {
        headers: getAuthHeaders()
      });
      
      const data = response.data.data;
      assert(Array.isArray(data.products), 'products must be array');
      
      if (data.products.length > 0) {
        const product = data.products[0];
        assert(typeof product.name === 'string', 'Product name must be string');
        assert(typeof product.quantity === 'number', 'Product quantity must be number');
        assert(typeof product.reorder_level === 'number', 'reorder_level must be number');
      }
      
      console.log(`   Low stock products: ${data.products.length}`);
    });

    // 2. POS SYSTEM INTEGRATION
    console.log('\n💰 2. POS SYSTEM COMPONENT');
    console.log('───────────────────────────────────────────');

    let testProductId = null;
    let testCartOrderId = null;

    await test('Load products for POS (numeric prices required)', async () => {
      const response = await axios.get(`${API_BASE}/products?limit=10`, {
        headers: getAuthHeaders()
      });
      
      const products = response.data.data.products;
      assert(Array.isArray(products), 'products must be array');
      
      // Critical: POS requires numeric prices for calculations
      products.forEach(product => {
        assert(typeof product.price === 'number', `Product "${product.name}" price must be number (got ${typeof product.price})`);
        assert(typeof product.quantity === 'number', `Product "${product.name}" quantity must be number`);
        
        // Verify no NaN or Infinity
        assert(!isNaN(product.price), `Product "${product.name}" price is NaN`);
        assert(!isNaN(product.quantity), `Product "${product.name}" quantity is NaN`);
      });
      
      testProductId = products[0].id;
      console.log(`   Loaded ${products.length} products for POS`);
      console.log(`   Sample: ${products[0].name} @ Rs ${products[0].price}`);
    });

    await test('Create order through POS (complete flow)', async () => {
      // Get product first
      const productsResponse = await axios.get(`${API_BASE}/products?limit=1`, {
        headers: getAuthHeaders()
      });
      const product = productsResponse.data.data.products[0];
      
      const quantity = 2;
      const subtotal = parseFloat((product.price * quantity).toFixed(2));
      const tax = parseFloat((subtotal * 0.18).toFixed(2));
      const total = parseFloat((subtotal + tax).toFixed(2));
      
      const response = await axios.post(`${API_BASE}/orders/create`, {
        items: [{
          product_id: product.id,
          quantity: quantity,
          price: product.price,
          discount: 0
        }],
        customer_name: 'Integration Test Customer',
        customer_phone: '9999999999',
        payment_method: 'cash',
        cashier_id: adminId
      }, {
        headers: getAuthHeaders()
      });
      
      const order = response.data.data;
      
      // Verify order structure matches frontend interface
      assert(typeof order.id === 'number', 'Order ID must be number');
      assert(typeof order.token_number === 'number', 'Token number must be number');
      assert(typeof order.subtotal === 'number', 'Subtotal must be number (for POS calculations)');
      assert(typeof order.tax_amount === 'number', 'Tax must be number');
      assert(typeof order.total_amount === 'number', 'Total must be number');
      assert(typeof order.payment_method === 'string', 'Payment method must be string');
      assert(order.items, 'Order must have items array');
      assert(Array.isArray(order.items), 'Items must be array');
      
      testCartOrderId = order.id;
      console.log(`   Order created: #${order.token_number}`);
      console.log(`   Total: Rs ${order.total_amount}, Items: ${order.items.length}`);
    });

    await test('Verify order items have correct numeric types', async () => {
      const response = await axios.get(`${API_BASE}/orders/${testCartOrderId}`, {
        headers: getAuthHeaders()
      });
      
      const order = response.data.data;
      assert(order.items.length > 0, 'Order should have items');
      
      order.items.forEach(item => {
        assert(typeof item.quantity === 'number', 'Item quantity must be number');
        assert(typeof item.price === 'number', 'Item price must be number');
        assert(typeof item.total === 'number', 'Item total must be number');
        
        // Verify mathematical correctness
        const expectedTotal = parseFloat((item.quantity * item.price).toFixed(2));
        assert(Math.abs(item.total - expectedTotal) < 0.01, 
          `Item total (${item.total}) should match qty*price (${expectedTotal})`);
      });
      
      console.log(`   Verified ${order.items.length} item(s) with correct numeric types`);
    });

    // 3. PRODUCT MANAGEMENT INTEGRATION
    console.log('\n📦 3. PRODUCT MANAGEMENT COMPONENT');
    console.log('───────────────────────────────────────────');

    await test('Product CRUD with pagination', async () => {
      // Create
      const createResponse = await axios.post(`${API_BASE}/products`, {
        name: 'Integration Test Product',
        category: 'Test',
        price: 299.99,
        cost_price: 199.99,
        quantity: 50,
        reorder_level: 10
      }, {
        headers: getAuthHeaders()
      });
      const newProduct = createResponse.data.data;
      
      assert(typeof newProduct.id === 'number', 'Product ID must be number');
      assert(typeof newProduct.price === 'number', 'Price must be number (not string)');
      assert(typeof newProduct.cost_price === 'number', 'Cost price must be number');
      assert(newProduct.price === 299.99, 'Price should match');
      assert(newProduct.cost_price === 199.99, 'Cost price should match');
      
      console.log(`   Created product ID: ${newProduct.id}`);
      console.log(`   Price: Rs ${newProduct.price}, Cost: Rs ${newProduct.cost_price}`);
      
      // Read
      const getResponse = await axios.get(`${API_BASE}/products/${newProduct.id}`, {
        headers: getAuthHeaders()
      });
      assert(getResponse.data.data.id === newProduct.id, 'Should get correct product');
      console.log(`   ✅ Read verified`);
      
      // Update
      const updateResponse = await axios.put(`${API_BASE}/products/${newProduct.id}`, {
        price: 349.99,
        quantity: 75
      }, {
        headers: getAuthHeaders()
      });
      assert(updateResponse.data.data.price === 349.99, 'Price should update');
      assert(updateResponse.data.data.quantity === 75, 'Quantity should update');
      console.log(`   ✅ Update verified - New price: Rs ${updateResponse.data.data.price}`);
      
      // Delete
      const deleteResponse = await axios.delete(`${API_BASE}/products/${newProduct.id}`, {
        headers: getAuthHeaders()
      });
      assert(deleteResponse.data.success === true, 'Delete should succeed');
      console.log(`   ✅ Delete verified`);
    });

    await test('Product search and filter', async () => {
      const response = await axios.get(`${API_BASE}/products?search=juice&limit=5`, {
        headers: getAuthHeaders()
      });
      
      const products = response.data.data.products;
      assert(Array.isArray(products), 'Should return array');
      
      products.forEach(p => {
        assert(typeof p.name === 'string', 'Name must be string');
        assert(typeof p.price === 'number', 'Price must be number');
      });
      
      console.log(`   Found ${products.length} product(s) matching "juice"`);
    });

    // 4. SUPPLIER & TRANSACTION INTEGRATION
    console.log('\n🚚 4. SUPPLIER & TRANSACTION COMPONENT');
    console.log('───────────────────────────────────────────');

    let testSupplierId = null;

    await test('Supplier management with balances', async () => {
      // Create
      const createResponse = await axios.post(`${API_BASE}/suppliers`, {
        name: 'Integration Test Supplier',
        contact_person: 'Test Person',
        phone: '9999999999',
        email: 'test@integration.com',
        address: 'Test Address',
        opening_balance: 5000.00
      }, {
        headers: getAuthHeaders()
      });
      const supplier = createResponse.data.data;
      
      assert(typeof supplier.id === 'number', 'Supplier ID must be number');
      assert(typeof supplier.opening_balance === 'number', 'Opening balance must be number');
      assert(supplier.opening_balance === 5000.00, 'Opening balance should match');
      
      testSupplierId = supplier.id;
      console.log(`   Created supplier ID: ${supplier.id}`);
      console.log(`   Opening balance: Rs ${supplier.opening_balance}`);
      
      // Get with balance
      const getResponse = await axios.get(`${API_BASE}/suppliers/${supplier.id}`, {
        headers: getAuthHeaders()
      });
      assert(getResponse.data.data.id === supplier.id, 'Should get correct supplier');
      console.log(`   ✅ Read with balance verified`);
      
      // Cleanup
      await axios.delete(`${API_BASE}/suppliers/${supplier.id}`, {
        headers: getAuthHeaders()
      });
      console.log(`   ✅ Cleanup verified`);
    });

    await test('Transaction CRUD with balance calculation', async () => {
      // Create supplier first
      const supplierResponse = await axios.post(`${API_BASE}/suppliers`, {
        name: 'Transaction Test Supplier',
        contact_person: 'Test',
        phone: '9999999998',
        email: 'trans@test.com',
        opening_balance: 1000.00
      }, {
        headers: getAuthHeaders()
      });
      const supplier = supplierResponse.data.data;
      
      // Create credit transaction
      const creditResponse = await axios.post(`${API_BASE}/transactions`, {
        supplier_id: supplier.id,
        type: 'credit',
        amount: 2000.00,
        description: 'Credit transaction test',
        transaction_date: new Date().toISOString().split('T')[0]
      }, {
        headers: getAuthHeaders()
      });
      
      assert(typeof creditResponse.data.data.amount === 'number', 'Transaction amount must be number');
      console.log(`   Credit transaction: Rs ${creditResponse.data.data.amount}`);
      
      // Check balance
      const balanceResponse = await axios.get(`${API_BASE}/transactions/supplier/${supplier.id}/balance`, {
        headers: getAuthHeaders()
      });
      const balance = balanceResponse.data.data;
      
      assert(typeof balance.current_balance === 'number', 'Current balance must be number');
      assert(typeof balance.total_credit === 'number', 'Total credit must be number');
      assert(typeof balance.total_debit === 'number', 'Total debit must be number');
      assert(balance.total_credit === 2000.00, 'Total credit should be 2000');
      
      console.log(`   Balance - Credit: Rs ${balance.total_credit}, Debit: Rs ${balance.total_debit}`);
      console.log(`   Current balance: Rs ${balance.current_balance}`);
      
      // Cleanup
      await axios.delete(`${API_BASE}/suppliers/${supplier.id}`, {
        headers: getAuthHeaders()
      });
    });

    // 5. EMPLOYEE MANAGEMENT
    console.log('\n👥 5. EMPLOYEE MANAGEMENT COMPONENT');
    console.log('───────────────────────────────────────────');

    await test('Employee list with user data', async () => {
      const response = await axios.get(`${API_BASE}/employees`, {
        headers: getAuthHeaders()
      });
      
      const employees = response.data.data.employees;
      assert(Array.isArray(employees), 'Should return employees array');
      
      if (employees.length > 0) {
        const emp = employees[0];
        assert(typeof emp.id === 'number', 'Employee ID must be number');
        assert(typeof emp.name === 'string', 'Employee name must be string');
        assert(emp.user !== null, 'Employee should have user data (or null)');
        
        if (emp.user) {
          assert(typeof emp.user.email === 'string', 'User email must be string');
          assert(typeof emp.user.role === 'string', 'User role must be string');
          assert(['Admin', 'Manager', 'Cashier'].includes(emp.user.role), 'Role must be valid');
        }
      }
      
      console.log(`   Total employees: ${employees.length}`);
    });

    // 6. SETTINGS INTEGRATION
    console.log('\n⚙️  6. SETTINGS COMPONENT');
    console.log('───────────────────────────────────────────');

    await test('Settings CRUD for store configuration', async () => {
      // Get all settings
      const getResponse = await axios.get(`${API_BASE}/settings`, {
        headers: getAuthHeaders()
      });
      const settings = getResponse.data.data;
      assert(settings !== null, 'Settings should not be null');
      
      console.log(`   Settings keys available: ${Object.keys(settings).length}`);
      
      // Update tax rate
      const updateResponse = await axios.put(`${API_BASE}/settings`, {
        tax_rate: 20.00
      }, {
        headers: getAuthHeaders()
      });
      assert(updateResponse.data.success === true, 'Update should succeed');
      console.log(`   ✅ Tax rate updated to 20%`);
      
      // Verify
      const verifyResponse = await axios.get(`${API_BASE}/settings/tax_rate`, {
        headers: getAuthHeaders()
      });
      assert(verifyResponse.data.data.tax_rate === 20.00, 'Tax rate should be 20');
      console.log(`   ✅ Verification passed - Tax rate: ${verifyResponse.data.data.tax_rate}%`);
      
      // Reset to default
      await axios.put(`${API_BASE}/settings`, {
        tax_rate: 18.00
      }, {
        headers: getAuthHeaders()
      });
    });

    // 7. REPORTS INTEGRATION
    console.log('\n📈 7. REPORTS COMPONENT');
    console.log('───────────────────────────────────────────');

    await test('Sales report with date filtering', async () => {
      const response = await axios.get(`${API_BASE}/reports/sales`, {
        headers: getAuthHeaders(),
        params: {
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date().toISOString().split('T')[0]
        }
      });
      
      const report = response.data.data;
      assert(typeof report.totalSales === 'number', 'Total sales must be number');
      assert(typeof report.totalOrders === 'number', 'Total orders must be number');
      assert(Array.isArray(report.orders), 'Orders must be array');
      
      console.log(`   Total sales: Rs ${report.totalSales}`);
      console.log(`   Total orders: ${report.totalOrders}`);
    });

    await test('Inventory report with low stock detection', async () => {
      const response = await axios.get(`${API_BASE}/reports/inventory`, {
        headers: getAuthHeaders()
      });
      
      const report = response.data.data;
      assert(typeof report.totalProducts === 'number', 'Total products must be number');
      assert(typeof report.totalValue === 'number', 'Total value must be number');
      assert(typeof report.lowStockCount === 'number', 'Low stock count must be number');
      assert(Array.isArray(report.products), 'Products must be array');
      
      if (report.products.length > 0) {
        const product = report.products[0];
        assert(typeof product.quantity === 'number', 'Product quantity must be number');
        assert(typeof product.value === 'number', 'Product value must be number');
      }
      
      console.log(`   Products: ${report.totalProducts}, Low stock: ${report.lowStockCount}`);
      console.log(`   Total inventory value: Rs ${report.totalValue}`);
    });

    await test('Transaction report with filters', async () => {
      const response = await axios.get(`${API_BASE}/reports/transactions`, {
        headers: getAuthHeaders(),
        params: {
          start_date: '2026-01-01',
          end_date: '2026-12-31'
        }
      });
      
      const report = response.data.data;
      assert(typeof report.totalCredit === 'number', 'Total credit must be number');
      assert(typeof report.totalDebit === 'number', 'Total debit must be number');
      assert(typeof report.netBalance === 'number', 'Net balance must be number');
      
      console.log(`   Credit: Rs ${report.totalCredit}, Debit: Rs ${report.totalDebit}`);
      console.log(`   Net balance: Rs ${report.netBalance}`);
    });

    // SUMMARY
    console.log('\n═══════════════════════════════════════════');
    console.log('📊 FRONTEND INTEGRATION TEST SUMMARY');
    console.log('═══════════════════════════════════════════');
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📈 Total:  ${results.passed + results.failed}`);
    console.log(`🎯 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
    console.log('═══════════════════════════════════════════\n');

    if (results.failed > 0) {
      console.log('❌ Failed Tests:');
      results.tests
        .filter(t => t.status === 'FAIL')
        .forEach(t => console.log(`   - ${t.name}: ${t.error}`));
      console.log();
    }

  } catch (error) {
    console.error('\n💥 Fatal error:', error.message);
    process.exit(1);
  }
}

runTests();
