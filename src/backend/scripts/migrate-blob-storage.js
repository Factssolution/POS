/**
 * BLOB Storage System Migration
 * Creates tables and updates schema for database image storage
 */

const sequelize = require('../config/database');

async function runMigration() {
  console.log('🚀 Starting BLOB Storage Migration...\n');

  try {
    // 1. Create blobs table
    console.log('📦 Creating blobs table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS blobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        blob_type VARCHAR(50) NOT NULL,
        blob_name VARCHAR(255) NOT NULL,
        blob_data BYTEA NOT NULL,
        blob_size INTEGER NOT NULL,
        mime_type VARCHAR(100),
        width INTEGER,
        height INTEGER,
        uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        uploaded_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Blobs table created\n');

    // 2. Create indexes for performance
    console.log('📊 Creating indexes...');
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_blobs_type ON blobs(blob_type);
      CREATE INDEX IF NOT EXISTS idx_blobs_uploaded_by ON blobs(uploaded_by);
    `);
    console.log('✅ Indexes created\n');

    // 3. Add blob references to company_settings
    console.log('🔗 Adding blob references to company_settings...');
    
    // Check if company_settings table exists
    const tableCheck = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'company_settings'
      );
    `);
    
    if (tableCheck[0][0].exists) {
      // Check if columns exist
      const columns = await sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'company_settings';
      `);
      
      const columnNames = columns[0].map(c => c.column_name);
      
      if (!columnNames.includes('logo_blob_id')) {
        await sequelize.query(`
          ALTER TABLE company_settings 
          ADD COLUMN logo_blob_id UUID REFERENCES blobs(id) ON DELETE SET NULL;
        `);
        console.log('  ✅ Added logo_blob_id');
      }
      
      if (!columnNames.includes('receipt_header_blob_id')) {
        await sequelize.query(`
          ALTER TABLE company_settings 
          ADD COLUMN receipt_header_blob_id UUID REFERENCES blobs(id) ON DELETE SET NULL;
        `);
        console.log('  ✅ Added receipt_header_blob_id');
      }
      
      if (!columnNames.includes('receipt_footer_blob_id')) {
        await sequelize.query(`
          ALTER TABLE company_settings 
          ADD COLUMN receipt_footer_blob_id UUID REFERENCES blobs(id) ON DELETE SET NULL;
        `);
        console.log('  ✅ Added receipt_footer_blob_id');
      }
      
      if (!columnNames.includes('signature_blob_id')) {
        await sequelize.query(`
          ALTER TABLE company_settings 
          ADD COLUMN signature_blob_id UUID REFERENCES blobs(id) ON DELETE SET NULL;
        `);
        console.log('  ✅ Added signature_blob_id');
      }
      console.log('');
    } else {
      console.log('⚠️  company_settings table does not exist (will be created later)\n');
    }

    // 4. Add max_storage_mb to subscriptions
    console.log('💾 Adding storage quota to subscriptions...');
    
    // Check if subscriptions table exists
    const subTableCheck = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'subscriptions'
      );
    `);
    
    if (subTableCheck[0][0].exists) {
      const subscriptionColumns = await sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'subscriptions';
      `);
      
      const subColumnNames = subscriptionColumns[0].map(c => c.column_name);
      
      if (!subColumnNames.includes('max_storage_mb')) {
        await sequelize.query(`
          ALTER TABLE subscriptions 
          ADD COLUMN max_storage_mb INTEGER NOT NULL DEFAULT 100;
        `);
        
        // Update existing plans
        await sequelize.query(`
          UPDATE subscriptions SET max_storage_mb = 100 WHERE plan_type = 'Basic';
          UPDATE subscriptions SET max_storage_mb = 500 WHERE plan_type = 'Standard';
          UPDATE subscriptions SET max_storage_mb = 2048 WHERE plan_type = 'Premium';
        `);
        console.log('✅ Storage quota added and plans updated\n');
      } else {
        console.log('✅ Storage quota column already exists\n');
      }
    } else {
      console.log('⚠️  subscriptions table does not exist (will be created later)\n');
    }

    // 5. Verify tables
    console.log('🔍 Verifying migration...');
    const blobsCheck = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'blobs' 
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Blobs table structure:');
    blobsCheck[0].forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type}`);
    });

    console.log('\n✅ Migration completed successfully!\n');
    console.log('📊 Summary:');
    console.log('   ✓ blobs table created');
    console.log('   ✓ Indexes created for performance');
    console.log('   ✓ company_settings updated with blob references');
    console.log('   ✓ subscriptions table updated with storage quota');
    console.log('');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run migration
runMigration();
