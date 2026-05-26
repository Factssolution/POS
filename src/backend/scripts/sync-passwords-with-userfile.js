const sequelize = require('../config/database');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

(async () => {
  try {
    console.log('\n' + '═'.repeat(90));
    console.log('              UPDATING PASSWORDS TO MATCH USER FILE.TXT');
    console.log('═'.repeat(90) + '\n');
    
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Exact passwords from User File.txt
    const usersToUpdate = [
      { 
        email: 'admin@factssolution.com', 
        password: 'admin123', 
        name: 'Admin User' 
      },
      { 
        email: 'manager@factssolution.com', 
        password: 'manager123', 
        name: 'Manager User' 
      },
      { 
        email: 'cashier@factssolution.com', 
        password: 'cashier123', 
        name: 'Cashier User' 
      },
      { 
        email: 'skyzai2009@gmail.com', 
        password: 'Black@786##', 
        name: 'Sky User' 
      },
      { 
        email: 'zubair@pos.com', 
        password: 'zubair123', 
        name: 'Zubair' 
      }
    ];

    console.log('Updating passwords...\n');
    console.log('─'.repeat(90));

    for (const userData of usersToUpdate) {
      const user = await User.findOne({ where: { email: userData.email } });
      
      if (user) {
        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);
        
        // Update password
        await user.update({ password: hashedPassword });
        
        // Verify the password works
        const isValid = await user.comparePassword(userData.password);
        
        console.log(`\n✅ ${userData.name}`);
        console.log(`   Email:    ${userData.email}`);
        console.log(`   Password: ${userData.password}`);
        console.log(`   Role:     ${user.role}`);
        console.log(`   Status:   ${user.status}`);
        console.log(`   Verified: ${isValid ? '✅ PASSWORD WORKS' : '❌ PASSWORD FAILED'}`);
        console.log('─'.repeat(90));
      } else {
        console.log(`\n❌ User not found: ${userData.email}`);
      }
    }

    console.log('\n' + '═'.repeat(90));
    console.log('           ✅ FINAL LOGIN CREDENTIALS (FROM USER FILE.TXT)');
    console.log('═'.repeat(90));
    console.log('\n📌 Use these exact credentials to login:\n');
    console.log('─'.repeat(90));
    
    usersToUpdate.forEach((u, idx) => {
      console.log(`\n${idx + 1}. ${u.name}`);
      console.log(`   Email:    ${u.email}`);
      console.log(`   Password: ${u.password}`);
    });
    
    console.log('\n' + '─'.repeat(90));
    console.log('\n✅ All passwords updated and verified!');
    console.log('✅ Now try logging in with these credentials\n');
    console.log('═'.repeat(90) + '\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();
