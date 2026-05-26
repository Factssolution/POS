const sequelize = require('../config/database');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

(async () => {
  try {
    console.log(' Setting standard passwords for all users...\n');
    
    await sequelize.authenticate();
    
    const users = [
      { email: 'admin@factssolution.com', password: 'Admin@123', name: 'Admin User' },
      { email: 'manager@factssolution.com', password: 'Manager@123', name: 'Manager User' },
      { email: 'cashier@factssolution.com', password: 'Cashier@123', name: 'Cashier User' },
      { email: 'skyzai2009@gmail.com', password: 'Sky@123', name: 'Sky User' },
      { email: 'zubair@pos.com', password: 'Zubair@123', name: 'Zubair' }
    ];
    
    for (const userData of users) {
      const user = await User.findOne({ where: { email: userData.email } });
      
      if (user) {
        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);
        
        // Update password
        await user.update({ password: hashedPassword });
        
        console.log(`✅ ${userData.name} (${userData.email})`);
        console.log(`   Password: ${userData.password}\n`);
      } else {
        console.log(`❌ User not found: ${userData.email}\n`);
      }
    }
    
    console.log('✨ All passwords updated successfully!');
    console.log('\n LOGIN CREDENTIALS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    users.forEach(u => {
      console.log(`${u.name.padEnd(15)} | ${u.email.padEnd(30)} | ${u.password}`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();
