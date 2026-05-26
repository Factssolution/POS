const sequelize = require('../config/database');
const User = require('../models/User');

(async () => {
  try {
    console.log('\n TESTING LOGIN FOR: skyzai2009@gmail.com\n');
    console.log('═'.repeat(80));
    
    await sequelize.authenticate();
    
    const email = 'skyzai2009@gmail.com';
    const password = 'Black@786##';
    
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      console.log('❌ User not found!');
      process.exit(1);
    }
    
    console.log('✅ User Found:');
    console.log(`   Name:  ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role:  ${user.role}`);
    console.log(`   Status: ${user.status}\n`);
    
    const isValid = await user.comparePassword(password);
    
    if (isValid) {
      console.log('✅ PASSWORD VERIFICATION: SUCCESSFUL!');
      console.log('✅ Login will work with these credentials\n');
    } else {
      console.log('❌ PASSWORD VERIFICATION: FAILED!');
      console.log('❌ Password is incorrect\n');
    }
    
    console.log('═'.repeat(80));
    console.log('FINAL CREDENTIALS:');
    console.log('═'.repeat(80));
    console.log(`Email:    ${email}`);
    console.log(`Password: ${password}`);
    console.log('═'.repeat(80) + '\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();
