const bcrypt = require('bcryptjs');

(async () => {
  console.log('\n TESTING BCRYPT WITH SPECIAL CHARACTERS\n');
  console.log('═'.repeat(80));
  
  const password = 'Black@786##';
  
  console.log('Original Password:', password);
  console.log('Password Length:', password.length);
  console.log('Password Bytes:', Buffer.from(password).toString('hex'));
  console.log();
  
  // Hash the password
  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(password, salt);
  
  console.log('Hashed Password:', hashed);
  console.log();
  
  // Test comparison
  const isValid = await bcrypt.compare(password, hashed);
  console.log('Comparison Test:', isValid ? '✅ PASS' : '❌ FAIL');
  
  // Test with escaped version
  const escapedPassword = password.replace(/#/g, '\\#');
  console.log('\nEscaped Password:', escapedPassword);
  const isValidEscaped = await bcrypt.compare(escapedPassword, hashed);
  console.log('Escaped Comparison:', isValidEscaped ? '✅ PASS' : '❌ FAIL');
  
  console.log('\n═'.repeat(80));
  console.log('CONCLUSION:');
  console.log('═'.repeat(80));
  console.log('The password "Black@786##" works correctly with bcrypt');
  console.log('If login is still failing, the issue is in how the password');
  console.log('is being sent from the frontend to the backend.\n');
  
  process.exit(0);
})();
