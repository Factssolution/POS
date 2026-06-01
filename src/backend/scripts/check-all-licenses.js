/**
 * Check All Licenses
 * Verify all licenses are properly managed (active/expired/suspended)
 */

const sequelize = require('../config/database');

async function checkAllLicenses() {
  console.log('🔍 Checking All Licenses...\n');

  try {
    const [licenses] = await sequelize.query(`
      SELECT 
        id,
        license_key,
        client_name,
        client_email,
        plan_type,
        price,
        status,
        issued_date,
        expiry_date
      FROM licenses 
      ORDER BY created_at DESC
    `);

    if (licenses.length === 0) {
      console.log('❌ No licenses found!');
      process.exit(1);
    }

    console.log(`📊 Total Licenses: ${licenses.length}\n`);
    console.log('='.repeat(80));

    let activeCount = 0;
    let expiredCount = 0;
    let issuesFound = 0;

    for (const lic of licenses) {
      const now = new Date();
      const expiryDate = new Date(lic.expiry_date);
      const daysRemaining = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
      
      const isActuallyExpired = daysRemaining <= 0;
      const isStatusCorrect = 
        (isActuallyExpired && lic.status === 'expired') ||
        (!isActuallyExpired && lic.status === 'active');

      console.log(`\n📋 License #${lic.id}: ${lic.license_key}`);
      console.log(`   Client: ${lic.client_name} (${lic.client_email})`);
      console.log(`   Plan: ${lic.plan_type} | Price: Rs ${lic.price.toLocaleString()}`);
      console.log(`   Issued: ${new Date(lic.issued_date).toLocaleDateString('en-PK')}`);
      console.log(`   Expires: ${new Date(lic.expiry_date).toLocaleDateString('en-PK')}`);
      console.log(`   Days Remaining: ${daysRemaining}`);
      console.log(`   DB Status: ${lic.status}`);
      console.log(`   Actual Status: ${isActuallyExpired ? '❌ EXPIRED' : '✅ ACTIVE'}`);

      if (!isStatusCorrect) {
        console.log(`   ⚠️  ISSUE: Status mismatch! Should be "${isActuallyExpired ? 'expired' : 'active'}"`);
        issuesFound++;
      } else {
        console.log(`   ✅ Status is correct`);
      }

      if (isActuallyExpired) {
        expiredCount++;
      } else {
        activeCount++;
      }

      console.log('─'.repeat(80));
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n📊 SUMMARY:');
    console.log(`   Total Licenses: ${licenses.length}`);
    console.log(`   Active: ${activeCount} ✅`);
    console.log(`   Expired: ${expiredCount} ❌`);
    console.log(`   Issues Found: ${issuesFound} ${issuesFound === 0 ? '✅' : '⚠️ '}`);

    if (issuesFound > 0) {
      console.log('\n⚠️  WARNING: Some licenses have incorrect status!');
      console.log('\n🔧 Running auto-fix...\n');
      
      // Fix mismatched licenses
      let fixedCount = 0;
      for (const lic of licenses) {
        const now = new Date();
        const expiryDate = new Date(lic.expiry_date);
        const daysRemaining = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
        
        const isActuallyExpired = daysRemaining <= 0;
        const correctStatus = isActuallyExpired ? 'expired' : 'active';
        
        if (lic.status !== correctStatus) {
          await sequelize.query(`
            UPDATE licenses 
            SET status = '${correctStatus}'
            WHERE id = ${lic.id}
          `);
          
          console.log(`   ✅ Fixed License #${lic.id} (${lic.license_key}): ${lic.status} → ${correctStatus}`);
          fixedCount++;
        }
      }
      
      console.log(`\n🎉 Fixed ${fixedCount} license(s)!`);
    } else {
      console.log('\n✅ All licenses are properly managed!');
    }

    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

checkAllLicenses();
