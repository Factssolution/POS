-- =====================================================
-- Fix Orders-Customers Foreign Key Relationship
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Check if customer_id column exists in orders table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'customer_id';

-- 2. If customer_id doesn't exist, add it:
-- ALTER TABLE orders ADD COLUMN customer_id UUID REFERENCES customers(id);

-- 3. Check existing foreign key constraints
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'orders';

-- 4. Drop and recreate the foreign key if needed
-- ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_customer_id_fkey;
-- ALTER TABLE orders ADD CONSTRAINT orders_customer_id_fkey 
--   FOREIGN KEY (customer_id) REFERENCES customers(id);

-- 5. Reload PostgREST schema cache (run this last!)
NOTIFY pgrst, 'reload schema';

-- 6. Verify the relationship works
SELECT o.id, o.order_number, o.total_amount, c.name as customer_name
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id
LIMIT 5;
