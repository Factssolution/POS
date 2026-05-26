const sequelize = require('../config/database');

(async () => {
  try {
    console.log('\n' + '═'.repeat(90));
    console.log('                    OPTIMIZING ORDERS TABLE INDEXES');
    console.log('═'.repeat(90) + '\n');
    
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Get current indexes
    const [indexes] = await sequelize.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'orders' AND schemaname = 'public'
      ORDER BY indexname
    `);

    console.log('📊 Current Indexes:');
    indexes.forEach(idx => console.log(`   - ${idx.indexname}`));
    console.log();

    // Remove duplicate indexes
    const duplicatesToRemove = [
      'idx_orders_date',        // Duplicate of orders_created_at
      'idx_orders_status',      // Duplicate of orders_status
      'idx_orders_token'        // Duplicate of orders_token_number
    ];

    console.log('🗑️  Removing duplicate indexes...\n');
    
    for (const indexName of duplicatesToRemove) {
      try {
        await sequelize.query(`DROP INDEX IF EXISTS ${indexName}`);
        console.log(`   ✅ Removed: ${indexName}`);
      } catch (error) {
        console.log(`   ⚠️  Failed to remove ${indexName}: ${error.message}`);
      }
    }

    // Add customer-specific indexes
    console.log('\n📈 Adding customer report optimized indexes...\n');

    const newIndexes = [
      {
        name: 'idx_customer_phone',
        sql: 'CREATE INDEX IF NOT EXISTS idx_customer_phone ON public.orders USING btree (customer_phone)'
      },
      {
        name: 'idx_customer_name',
        sql: 'CREATE INDEX IF NOT EXISTS idx_customer_name ON public.orders USING btree (customer_name)'
      },
      {
        name: 'idx_customer_phone_name',
        sql: 'CREATE INDEX IF NOT EXISTS idx_customer_phone_name ON public.orders USING btree (customer_phone, customer_name)'
      },
      {
        name: 'idx_customer_status_created',
        sql: 'CREATE INDEX IF NOT EXISTS idx_customer_status_created ON public.orders USING btree (status, created_at) WHERE customer_phone IS NOT NULL'
      }
    ];

    for (const index of newIndexes) {
      try {
        await sequelize.query(index.sql);
        console.log(`   ✅ Created: ${index.name}`);
      } catch (error) {
        console.log(`   ⚠️  Failed to create ${index.name}: ${error.message}`);
      }
    }

    // Verify final indexes
    console.log('\n\n📋 Final Indexes:');
    console.log('─'.repeat(90));
    const [finalIndexes] = await sequelize.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'orders' AND schemaname = 'public'
      ORDER BY indexname
    `);
    
    finalIndexes.forEach(idx => {
      console.log(`\n  ${idx.indexname}`);
      console.log(`    ${idx.indexdef}`);
    });

    // Test query performance
    console.log('\n\n🧪 Testing Customer Report Query Performance...\n');
    
    const startTime = Date.now();
    const [testQuery] = await sequelize.query(`
      EXPLAIN ANALYZE
      SELECT 
        customer_phone,
        customer_name,
        COUNT(*) as order_count,
        SUM(total_amount) as total_spent
      FROM orders
      WHERE customer_name IS NOT NULL 
        AND customer_phone IS NOT NULL
        AND status = 'completed'
      GROUP BY customer_phone, customer_name
      ORDER BY total_spent DESC
    `);
    
    const endTime = Date.now();
    console.log(`   Query Time: ${endTime - startTime}ms`);
    console.log('\n   Execution Plan:');
    testQuery.forEach(row => {
      if (row['QUERY PLAN']) {
        console.log(`     ${row['QUERY PLAN']}`);
      }
    });

    console.log('\n' + '═'.repeat(90));
    console.log('✅ Index optimization complete!');
    console.log('═'.repeat(90) + '\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Optimization Error:', error);
    process.exit(1);
  }
})();
