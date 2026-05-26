const sequelize = require('../config/database');
const User = require('../models/User');

(async () => {
  try {
    await sequelize.authenticate();
    
    const users = await User.findAll({ 
      attributes: ['id', 'email', 'name', 'role', 'status', 'created_at'] 
    });
    
    console.log('\n' + '═'.repeat(90));
    console.log('                    POS SYSTEM - DATABASE USERS VERIFICATION');
    console.log('═'.repeat(90) + '\n');
    
    console.log(`Total Users Found: ${users.length}\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   Email:    ${user.email}`);
      console.log(`   Role:     ${user.role}`);
      console.log(`   Status:   ${user.status}`);
      console.log(`   User ID:  ${user.id}`);
      console.log(`   Created:  ${user.created_at}`);
      console.log('─'.repeat(90));
    });
    
    console.log('\n' + '═'.repeat(90));
    console.log('✅ Database verification complete!');
    console.log('═'.repeat(90) + '\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();
