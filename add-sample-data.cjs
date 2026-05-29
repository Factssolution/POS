const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://hfusrtiqjyiotjewzzkt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmdXNydGlxanlpb3RqZXd6emt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MDExODYsImV4cCI6MjA5NTM3NzE4Nn0.Hihh9K0B1WIsZxlIZBEBfIp9ouUL3ZkG3cpnrfxOEdM'
);

async function addSampleData() {
  console.log('Adding sample data...\n');

  // 1. Add products (use stock_quantity not stock)
  const { data: products, error: pError } = await supabase
    .from('products')
    .insert([
      { name: 'Coca Cola 500ml', sku: 'SKU001', price: 100, stock_quantity: 50 },
      { name: 'Pepsi 500ml', sku: 'SKU002', price: 80, stock_quantity: 30 },
      { name: 'Water Bottle 1.5L', sku: 'SKU003', price: 50, stock_quantity: 100 }
    ])
    .select();

  if (pError) {
    console.error('❌ Product error:', pError);
  } else {
    console.log(`✅ Added ${products?.length || 0} products`);
  }

  // 2. Add sample order (payment_method must be lowercase)
  const today = new Date().toISOString();
  const { data: orders, error: oError } = await supabase
    .from('orders')
    .insert([
      {
        order_number: 'ORD-001',
        subtotal: 300,
        total_amount: 300,
        payment_method: 'cash',  // lowercase!
        payment_status: 'paid',
        status: 'completed',
        created_at: today
      }
    ])
    .select();

  if (oError) {
    console.error('❌ Order error:', oError);
  } else {
    console.log(`✅ Added ${orders?.length || 0} order(s)`);
    
    // Add order items (use unit_price and total_price)
    if (orders && orders[0] && products && products.length > 0) {
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert([
          { order_id: orders[0].id, product_id: products[0].id, quantity: 2, unit_price: 100, total_price: 200 },
          { order_id: orders[0].id, product_id: products[1].id, quantity: 1, unit_price: 100, total_price: 100 }
        ]);
      
      if (itemsError) {
        console.error('❌ Order items error:', itemsError);
      } else {
        console.log('✅ Added order items');
      }
    }
  }

  // 3. Verify data
  const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
  const { count: orderCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
  const { count: customerCount } = await supabase.from('customers').select('*', { count: 'exact', head: true });

  console.log('\n📊 Database Summary:');
  console.log(`   Products: ${productCount}`);
  console.log(`   Orders: ${orderCount}`);
  console.log(`   Customers: ${customerCount}`);
}

addSampleData();
