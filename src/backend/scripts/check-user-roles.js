const { User } = require('../models');

async function checkAndFixUserRole() {
  try {
    console.log('🔍 Checking user roles in database...\n');
    
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'status']
    });
    
    console.log('📊 Current Users:');
    console.log('─────────────────────────────────────────────');
    users.forEach(user => {
      console.log(`ID: ${user.id}`);
      console.log(`Name: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      console.log(`Status: ${user.status}`);
      console.log('─────────────────────────────────────────────');
    });
    
    // Find admin user
    const adminUser = await User.findOne({
      where: { email: 'admin@factssolution.com' }
    });
    
    if (adminUser) {
      console.log('\n✅ Found admin user:');
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Current Role: ${adminUser.role}`);
      
      if (adminUser.role !== 'Admin') {
        console.log('\n🔧 Upgrading role to Admin...');
        await adminUser.update({ role: 'Admin' });
        console.log('✅ Role updated to Admin!');
      } else {
        console.log('✅ User already has Admin role');
      }
    } else {
      console.log('\n❌ Admin user not found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkAndFixUserRole();
