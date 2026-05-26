const axios = require('axios');

(async () => {
  try {
    const login = await axios.post('http://localhost:5000/api/v1/auth/login', {
      email: 'admin@factssolution.com',
      password: 'admin123'
    });
    
    const token = login.data.token || login.data.data.token;
    const report = await axios.get('http://localhost:5000/api/v1/reports/suppliers?startDate=2026-05-01&endDate=2026-05-24', {
      headers: { Authorization: 'Bearer ' + token }
    });
    
    console.log('=== BACKEND SUPPLIER DATA ===');
    const suppliers = report.data.data.suppliers;
    
    let totalPurchasesCalc = 0;
    let totalOutstandingCalc = 0;
    let totalTransactionsCalc = 0;
    
    suppliers.forEach(s => {
      const purchases = (s.totalCredit || 0) + (s.opening_balance || 0);
      totalPurchasesCalc += purchases;
      totalOutstandingCalc += (s.outstanding || 0);
      totalTransactionsCalc += (s.transactionCount || 0);
      
      console.log(`\n${s.name}:`);
      console.log(`  Opening: Rs ${s.opening_balance}`);
      console.log(`  Credit: Rs ${s.totalCredit}`);
      console.log(`  Debit: Rs ${s.totalDebit}`);
      console.log(`  Outstanding: Rs ${s.outstanding}`);
      console.log(`  Transactions: ${s.transactionCount}`);
      console.log(`  Calculated Purchases: Rs ${purchases}`);
    });
    
    console.log('\n=== CALCULATED TOTALS (from supplier data) ===');
    console.log('Total Purchases:', totalPurchasesCalc);
    console.log('Total Outstanding:', totalOutstandingCalc);
    console.log('Total Transactions:', totalTransactionsCalc);
    
    console.log('\n=== BACKEND SUMMARY (from API) ===');
    console.log('Summary Total Purchases:', report.data.data.summary.totalPurchases);
    console.log('Summary Total Outstanding:', report.data.data.summary.totalOutstanding);
    
    console.log('\n=== DISCREPANCY CHECK ===');
    console.log('Purchases Match:', totalPurchasesCalc === report.data.data.summary.totalPurchases ? 'YES ✅' : 'NO ❌');
    console.log('Outstanding Match:', totalOutstandingCalc === report.data.data.summary.totalOutstanding ? 'YES ✅' : 'NO ❌');
    
    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
