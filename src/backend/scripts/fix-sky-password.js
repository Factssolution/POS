const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');
const { QueryTypes } = require('sequelize');

(async () => {
  try {
    console.log('\n DIRECT DATABASE PASSWORD UPDATE\n');
    console.log('═'.repeat(80));
    
    await sequelize.authenticate();
    
    const email = 'skyzai2009@gmail.com';
    const password = 'Black@786##';
    
    // Create new hash
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('New Hash:', hashedPassword);
    console.log();
    
    // Direct SQL update
    const result = await sequelize.query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE email = $2',
      {
        bind: [hashedPassword, email],
        type: QueryTypes.UPDATE
      }
    );
    
    console.log('✅ Database updated:', result);
    console.log();
    
    // Verify by selecting the user
    const user = await sequelize.query(
      'SELECT id, email, name, password FROM users WHERE email = $1',
      {
        bind: [email],
        type: QueryTypes.SELECT
      }
    );
    
    console.log('Verification:');
    console.log('User ID:', user[0].id);
    console.log('Email:', user[0].email);
    console.log('Name:', user[0].name);
    console.log('Password Hash:', user[0].password.substring(0, 30) + '...');
    console.log();
    
    // Test comparison
    const isValid = await bcrypt.compare(password, user[0].password);
    console.log('Password Verification:', isValid ? '✅ SUCCESS' : '❌ FAILED');
    console.log();
    
    console.log('═'.repeat(80));
    if (isValid) {
      console.log('✅ LOGIN WILL NOW WORK!');
      console.log('   Email: skyzai2009@gmail.com');
      console.log('   Password: Black@786##');
    } else {
      console.log('❌ Still failing - need to investigate further');
    }
    console.log('═'.repeat(80) + '\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();
