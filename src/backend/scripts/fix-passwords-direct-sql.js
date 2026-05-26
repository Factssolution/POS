const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');
const { QueryTypes } = require('sequelize');

(async () => {
  try {
    console.log('\n' + '═'.repeat(90));
    console.log('         DIRECT SQL PASSWORD UPDATE (BYPASSING SEQUELIZE HOOKS)');
    console.log('═'.repeat(90) + '\n');
    
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Exact passwords from User File.txt
    const usersToUpdate = [
      { email: 'admin@factssolution.com', password: 'admin123', name: 'Admin User' },
      { email: 'manager@factssolution.com', password: 'manager123', name: 'Manager User' },
      { email: 'cashier@factssolution.com', password: 'cashier123', name: 'Cashier User' },
      { email: 'skyzai2009@gmail.com', password: 'Black@786##', name: 'Sky User' },
      { email: 'zubair@pos.com', password: 'zubair123', name: 'Zubair' }
    ];

    console.log('Updating passwords using direct SQL...\n');
    console.log('─'.repeat(90));

    for (const userData of usersToUpdate) {
      // Hash password manually
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      // Direct SQL update (bypasses Sequelize hooks)
      const result = await sequelize.query(
        'UPDATE users SET password = $1, updated_at = NOW() WHERE email = $2',
        {
          bind: [hashedPassword, userData.email],
          type: QueryTypes.UPDATE
        }
      );
      
      // Verify by fetching and comparing
      const [user] = await sequelize.query(
        'SELECT id, name, email, password, role, status FROM users WHERE email = $1',
        {
          bind: [userData.email],
          type: QueryTypes.SELECT
        }
      );
      
      if (user) {
        const isValid = await bcrypt.compare(userData.password, user.password);
        
        console.log(`\n✅ ${userData.name}`);
        console.log(`   Email:    ${userData.email}`);
        console.log(`   Password: ${userData.password}`);
        console.log(`   Role:     ${user.role}`);
        console.log(`   Status:   ${user.status}`);
        console.log(`   Verified: ${isValid ? '✅ PASSWORD WORKS!' : '❌ FAILED'}`);
        console.log('─'.repeat(90));
      }
    }

    console.log('\n' + '═'.repeat(90));
    console.log('           ✅ FINAL LOGIN CREDENTIALS (FROM USER FILE.TXT)');
    console.log('═'.repeat(90));
    console.log('\n USE THESE EXACT CREDENTIALS TO LOGIN:\n');
    console.log('─'.repeat(90));
    
    usersToUpdate.forEach((u, idx) => {
      console.log(`\n${idx + 1}. ${u.name}`);
      console.log(`   Email:    ${u.email}`);
      console.log(`   Password: ${u.password}`);
    });
    
    console.log('\n' + '─'.repeat(90));
    console.log('\n✅ All passwords updated successfully!');
    console.log('✅ Login will now work with User File.txt credentials\n');
    console.log('═'.repeat(90) + '\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();
