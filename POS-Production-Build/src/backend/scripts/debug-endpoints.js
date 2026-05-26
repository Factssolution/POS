const axios = require('axios');

async function debug() {
  const API_BASE = 'http://localhost:5000/api/v1';
  
  // Login
  const login = await axios.post(`${API_BASE}/auth/login`, {
    email: 'admin@factssolution.com',
    password: 'admin123'
  });
  const token = login.data.data.token;
  const headers = { Authorization: `Bearer ${token}` };
  
  console.log('=== DASHBOARD SALES ===');
  const sales = await axios.get(`${API_BASE}/dashboard/sales`, { headers });
  console.log(JSON.stringify(sales.data, null, 2));
  
  console.log('\n=== DASHBOARD LOW STOCK ===');
  const lowStock = await axios.get(`${API_BASE}/dashboard/low-stock`, { headers });
  console.log(JSON.stringify(lowStock.data, null, 2));
  
  console.log('\n=== EMPLOYEES ===');
  const employees = await axios.get(`${API_BASE}/employees`, { headers });
  console.log(JSON.stringify(employees.data, null, 2));
  
  console.log('\n=== PRODUCTS (first item) ===');
  const products = await axios.get(`${API_BASE}/products?limit=1`, { headers });
  const prod = products.data.data.products[0];
  console.log('Quantity type:', typeof prod.quantity);
  console.log('Quantity value:', prod.quantity);
  console.log(JSON.stringify(prod, null, 2));
}

debug().catch(console.error);
