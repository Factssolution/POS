const sequelize = require('../config/database');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

(async () => {
  try {
    console.log('\n RESTORING ORIGINAL PASSWORDS & UPDATING TEST ACCOUNTS\n');
    console.log('═'.repeat(80));
    
    await sequelize.authenticate();
    
    // ONLY update test/demo accounts - preserve original user passwords
    const testAccounts = [
      { 
        email: 'admin@factssolution.com', 
        password: 'Admin@123', 
        name: 'Admin User (TEST)',
        preserve: false 
      },
      { 
        email: 'manager@factssolution.com', 
        password: 'Manager@123', 
        name: 'Manager User (TEST)',
        preserve: false 
      },
      { 
        email: 'cashier@factssolution.com', 
        password: 'Cashier@123', 
        name: 'Cashier User (TEST)',
        preserve: false 
      }
    ];
    
    // Real users - CORRECT passwords from User File.txt
    const realUsers = [
      { 
        email: 'skyzai2009@gmail.com', 
        password: 'Black@786##', 
        name: 'Sky User (CORRECT PASSWORD)',
        preserve: true 
      },
      { 
        email: 'zubair@pos.com', 
        password: 'zubair123', 
        name: 'Zubair (ADMIN)',
        preserve: false 
      }
    ];
    
    console.log('\n UPDATING TEST ACCOUNTS:\n');
    
    for (const account of testAccounts) {
      const user = await User.findOne({ where: { email: account.email } });
      
      if (user) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(account.password, salt);
        await user.update({ password: hashedPassword });
        
        console.log(`✅ ${account.name}`);
        console.log(`   Email:    ${account.email}`);
        console.log(`   Password: ${account.password}`);
        console.log('─'.repeat(80));
      }
    }
    
    console.log('\n🔒 RESTORING REAL USER PASSWORDS:\n');
    
    for (const account of realUsers) {
      const user = await User.findOne({ where: { email: account.email } });
      
      if (user) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(account.password, salt);
        await user.update({ password: hashedPassword });
        
        console.log(`✅ ${account.name}`);
        console.log(`   Email:    ${account.email}`);
        console.log(`   Password: ${account.password}`);
        console.log('─'.repeat(80));
      }
    }
    
    console.log('\n' + '═'.repeat(80));
    console.log('               ✅ FINAL LOGIN CREDENTIALS');
    console.log('═'.repeat(80));
    console.log('\n📌 TEST ACCOUNTS (For demonstration):');
    console.log('─'.repeat(80));
    testAccounts.forEach(a => {
      console.log(`   ${a.name.padEnd(25)} | ${a.email.padEnd(30)}`);
      console.log(`   Password: ${a.password}`);
      console.log();
    });
    
    console.log('📌 REAL USER ACCOUNTS:');
    console.log('─'.repeat(80));
    realUsers.forEach(a => {
      console.log(`   ${a.name.padEnd(25)} | ${a.email.padEnd(30)}`);
      console.log(`   Password: ${a.password}`);
      console.log();
    });
    
    console.log('═'.repeat(80));
    console.log('✅ All passwords updated successfully!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();
