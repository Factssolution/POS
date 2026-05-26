const { User } = require('../models');

async function upgradeUserToAdmin() {
  try {
    const email = process.argv[2];
    
    if (!email) {
      console.log('❌ Usage: node scripts/upgrade-user-to-admin.js <email>');
      console.log('');
      console.log('Example:');
      console.log('  node scripts/upgrade-user-to-admin.js admin@factssolution.com');
      process.exit(1);
    }
    
    console.log('🔍 Looking for user:', email);
    
    const user = await User.findOne({
      where: { email: email }
    });
    
    if (!user) {
      console.log('❌ User not found with email:', email);
      process.exit(1);
    }
    
    console.log('');
    console.log('📊 Current User Details:');
    console.log('─────────────────────────────────────────────');
    console.log(`ID: ${user.id}`);
    console.log(`Name: ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`Current Role: ${user.role}`);
    console.log(`Status: ${user.status}`);
    console.log('─────────────────────────────────────────────');
    console.log('');
    
    if (user.role === 'Admin') {
      console.log('✅ User already has Admin role!');
      console.log('');
      console.log('If you\'re still getting 403 errors:');
      console.log('1. Logout from the frontend');
      console.log('2. Clear browser cache/localStorage');
      console.log('3. Login again');
      console.log('4. Check browser console for detailed error logs');
      process.exit(0);
    }
    
    console.log('🔧 Upgrading role to Admin...');
    await user.update({ role: 'Admin' });
    
    console.log('✅ Role successfully upgraded to Admin!');
    console.log('');
    console.log('⚠️  IMPORTANT: You must now:');
    console.log('1. Logout from the frontend application');
    console.log('2. Login again with this account');
    console.log('3. The new role will be included in your JWT token');
    console.log('');
    console.log('After re-login, you will have full Admin privileges!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

upgradeUserToAdmin();
