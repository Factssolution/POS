const sequelize = require('../config/database');
const User = require('../models/User');

(async () => {
  try {
    console.log('\n' + '═'.repeat(100));
    console.log('                         DATABASE - ALL USERS DETAILS');
    console.log('═'.repeat(100) + '\n');
    
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Fetch all users with complete details
    const users = await User.findAll({
      order: [['id', 'ASC']]
    });

    console.log(`📊 Total Users: ${users.length}\n`);
    console.log('─'.repeat(100));

    users.forEach((user, index) => {
      console.log(`\n👤 USER #${user.id}`);
      console.log('─'.repeat(100));
      console.log(`   Name:          ${user.name}`);
      console.log(`   Email:         ${user.email}`);
      console.log(`   Phone:         ${user.phone || 'Not provided'}`);
      console.log(`   Role:          ${user.role}`);
      console.log(`   Status:        ${user.status.toUpperCase()}`);
      console.log(`   User ID:       ${user.id}`);
      console.log(`   Created:       ${user.created_at ? new Date(user.created_at).toLocaleString() : 'N/A'}`);
      console.log(`   Last Updated:  ${user.updated_at ? new Date(user.updated_at).toLocaleString() : 'N/A'}`);
      
      // Role description
      let roleDescription = '';
      switch(user.role) {
        case 'Admin':
          roleDescription = 'Full system access - All features';
          break;
        case 'Manager':
          roleDescription = 'Management access - Most features';
          break;
        case 'Cashier':
          roleDescription = 'Limited access - POS, Dashboard, Settings only';
          break;
        default:
          roleDescription = 'Unknown role';
      }
      console.log(`   Permissions:   ${roleDescription}`);
      
      // Status description
      const statusDesc = user.status === 'active' ? '✅ Can login and access system' : '❌ Account deactivated';
      console.log(`   Access:        ${statusDesc}`);
      
      if (index < users.length - 1) {
        console.log('\n' + '─'.repeat(100));
      }
    });

    // Summary by role
    console.log('\n\n' + '═'.repeat(100));
    console.log('                         USERS BY ROLE SUMMARY');
    console.log('═'.repeat(100));
    
    const roleCount = {};
    users.forEach(user => {
      roleCount[user.role] = (roleCount[user.role] || 0) + 1;
    });

    console.log('\n📋 Role Distribution:');
    console.log('─'.repeat(100));
    Object.entries(roleCount).forEach(([role, count]) => {
      const percentage = ((count / users.length) * 100).toFixed(1);
      console.log(`   ${role.padEnd(15)} : ${count} user(s) (${percentage}%)`);
    });

    // Summary by status
    console.log('\n\n📊 Status Distribution:');
    console.log('─'.repeat(100));
    const statusCount = {};
    users.forEach(user => {
      statusCount[user.status] = (statusCount[user.status] || 0) + 1;
    });
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`   ${status.toUpperCase().padEnd(15)} : ${count} user(s)`);
    });

    // Login credentials summary (for testing)
    console.log('\n\n' + '═'.repeat(100));
    console.log('                    LOGIN CREDENTIALS (FOR TESTING)');
    console.log('═'.repeat(100));
    console.log('\n⚠️  Note: These are the known passwords for testing purposes\n');
    
    const testCredentials = [
      { email: 'admin@factssolution.com', password: 'Admin@123', name: 'Admin User' },
      { email: 'manager@factssolution.com', password: 'Manager@123', name: 'Manager User' },
      { email: 'cashier@factssolution.com', password: 'Cashier@123', name: 'Cashier User' },
      { email: 'skyzai2009@gmail.com', password: 'Black@786##', name: 'Sky User' },
      { email: 'zubair@pos.com', password: 'zubair123', name: 'Zubair' }
    ];

    console.log('─'.repeat(100));
    testCredentials.forEach((cred, idx) => {
      console.log(`\n${idx + 1}. ${cred.name}`);
      console.log(`   Email:    ${cred.email}`);
      console.log(`   Password: ${cred.password}`);
      console.log(`   Role:     ${users.find(u => u.email === cred.email)?.role || 'N/A'}`);
    });
    console.log('\n' + '─'.repeat(100));

    console.log('\n' + '═'.repeat(100));
    console.log('✅ User details retrieved successfully!');
    console.log('═'.repeat(100) + '\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();
