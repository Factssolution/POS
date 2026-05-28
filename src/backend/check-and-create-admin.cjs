const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  host: 'aws-0-ap-southeast-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  username: 'postgres.hfusrtiqjyiotjewzzkt',
  password: 'Black@786##',
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

async function checkAdminUser() {
  try {
    console.log('🔍 Connecting to Supabase PostgreSQL...\n');
    await sequelize.authenticate();
    console.log('✅ Connected!\n');

    // Check if users table exists
    console.log('📋 Checking users table...');
    const [results] = await sequelize.query(`
      SELECT id, email, name, role, status, password_hash 
      FROM users 
      WHERE email IN ('admin@possystem.gt.tc', 'factssolution@gmail.com')
    `);

    if (results.length === 0) {
      console.log('❌ No admin users found in database!\n');
      console.log('📝 Creating admin user...\n');

      // Create admin user
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('Admin@123456', 10);

      const [newUser] = await sequelize.query(`
        INSERT INTO users (email, name, role, status, password_hash, created_at, updated_at)
        VALUES (
          'admin@possystem.gt.tc',
          'System Admin',
          'admin',
          'active',
          '${hashedPassword}',
          NOW(),
          NOW()
        )
        RETURNING id, email, name, role, status
      `);

      console.log('✅ Admin user created!');
      console.log('   Email:', newUser.email);
      console.log('   Name:', newUser.name);
      console.log('   Role:', newUser.role);
      console.log('   Status:', newUser.status);
    } else {
      console.log('✅ Users found:\n');
      results.forEach((user, i) => {
        console.log(`${i+1}. Email: ${user.email}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Status: ${user.status}`);
        console.log(`   Has Password: ${user.password_hash ? '✅ Yes' : '❌ No'}\n`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkAdminUser();
