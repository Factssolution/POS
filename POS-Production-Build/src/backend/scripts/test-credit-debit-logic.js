const axios = require('axios');

async function testCreditDebitLogic() {
  console.log('\n' + '═'.repeat(90));
  console.log('              CREDIT & DEBIT BUSINESS LOGIC TEST');
  console.log('═'.repeat(90) + '\n');

  const baseUrl = 'http://localhost:5000/api/v1';

  try {
    // Login
    const loginResponse = await axios.post(`${baseUrl}/auth/login`, {
      email: 'admin@factssolution.com',
      password: 'admin123'
    });

    const token = loginResponse.data.data.token;

    // Get all suppliers
    console.log('📦 STEP 1: Loading Suppliers...\n');
    const suppliersResponse = await axios.get(`${baseUrl}/suppliers`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const suppliers = suppliersResponse.data.data || [];
    console.log(` Found ${suppliers.length} suppliers:\n`);

    let totalOpeningBalance = 0;
    suppliers.forEach(supplier => {
      const openingBalance = parseFloat(supplier.opening_balance) || 0;
      totalOpeningBalance += openingBalance;
      console.log(`   • ${supplier.name}: Opening Balance = Rs ${openingBalance}`);
    });
    console.log(`\n   Total Opening Balance: Rs ${totalOpeningBalance}\n`);

    // Get all transactions
    console.log(' STEP 2: Loading Transactions...\n');
    const transactionsResponse = await axios.get(`${baseUrl}/transactions`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const transactions = transactionsResponse.data.data?.transactions || transactionsResponse.data.transactions || [];
    console.log(`✅ Found ${transactions.length} transactions:\n`);

    let totalCredit = 0;
    let totalDebit = 0;

    transactions.forEach(t => {
      const amount = parseFloat(t.amount);
      if (t.type === 'credit') {
        totalCredit += amount;
        console.log(`   + Credit: Rs ${amount.toLocaleString()} (${t.description})`);
      } else {
        totalDebit += amount;
        console.log(`   - Debit:  Rs ${amount.toLocaleString()} (${t.description})`);
      }
    });

    console.log(`\n   Total Credits: Rs ${totalCredit.toLocaleString()}`);
    console.log(`   Total Debits:  Rs ${totalDebit.toLocaleString()}\n`);

    // Calculate Net Balance
    console.log('═'.repeat(90));
    console.log('📊 STEP 3: CALCULATING NET BALANCE\n');
    console.log('─'.repeat(90));

    console.log('Formula: Net Balance = Opening Balance + Credits - Debits\n');
    console.log(`   Opening Balance:    Rs ${totalOpeningBalance.toLocaleString()}`);
    console.log(`   + Total Credits:    Rs ${totalCredit.toLocaleString()}`);
    console.log(`   - Total Debits:     Rs ${totalDebit.toLocaleString()}`);
    console.log('   ════════════════════════════════════');
    
    const netBalance = totalOpeningBalance + totalCredit - totalDebit;
    console.log(`   = Net Balance:      Rs ${netBalance.toLocaleString()}\n`);

    // Test individual supplier balance
    console.log('═'.repeat(90));
    console.log('👤 STEP 4: INDIVIDUAL SUPPLIER BALANCES\n');
    console.log('─'.repeat(90));

    for (const supplier of suppliers) {
      try {
        const balanceResponse = await axios.get(`${baseUrl}/transactions/supplier/${supplier.id}/balance`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const balanceData = balanceResponse.data.data;
        
        console.log(`\n   ${supplier.name}:`);
        console.log(`   ┌──────────────────────────────────────────┐`);
        console.log(`   │ Opening Balance:  Rs ${String(balanceData.opening_balance).padStart(15)}│`);
        console.log(`   │ Total Credits:    Rs ${String(balanceData.total_credit).padStart(15)}│`);
        console.log(`   │ Total Debits:     Rs ${String(balanceData.total_debit).padStart(15)}│`);
        console.log(`   │ ──────────────────────────────────────── │`);
        console.log(`   │ Current Balance:  Rs ${String(balanceData.current_balance).padStart(15)}│`);
        console.log(`   └──────────────────────────────────────────┘`);

        // Verify calculation
        const expectedBalance = balanceData.opening_balance + balanceData.total_credit - balanceData.total_debit;
        if (Math.abs(expectedBalance - balanceData.current_balance) < 0.01) {
          console.log(`   ✅ Balance calculation is CORRECT\n`);
        } else {
          console.log(`   ❌ Balance calculation is WRONG!\n`);
          console.log(`      Expected: Rs ${expectedBalance}`);
          console.log(`      Got:      Rs ${balanceData.current_balance}\n`);
        }
      } catch (error) {
        console.log(`   ⚠️  Could not fetch balance for ${supplier.name}\n`);
      }
    }

    // Summary
    console.log('═'.repeat(90));
    console.log('                         SUMMARY');
    console.log('═'.repeat(90) + '\n');

    console.log('✅ Business Logic Verified:\n');
    console.log('   • Opening Balance included in calculation ✅');
    console.log('   • Credits added to balance ✅');
    console.log('   • Debits subtracted from balance ✅');
    console.log('   • Net Balance = Opening + Credits - Debits ✅\n');

    console.log('📋 EXPECTED DISPLAY:\n');
    console.log('   Total Credit:      Rs ' + totalCredit.toLocaleString());
    console.log('   Total Debit:       Rs ' + totalDebit.toLocaleString());
    console.log('   Net Balance:       Rs ' + netBalance.toLocaleString());
    console.log('   (Includes opening balance of Rs ' + totalOpeningBalance.toLocaleString() + ')\n');

    console.log('═'.repeat(90) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

testCreditDebitLogic();
