-- =====================================================
-- POS System - Supabase Database Schema
-- =====================================================
-- Run this in Supabase SQL Editor
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USERS TABLE (Authentication)
-- =====================================================
-- Note: Supabase Auth handles this automatically
-- This table stores additional user profile data

CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'cashier' CHECK (role IN ('super_admin', 'admin', 'manager', 'cashier')),
  phone VARCHAR(50),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. PRODUCTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) UNIQUE,
  category_id UUID,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  cost_price DECIMAL(10, 2) DEFAULT 0 CHECK (cost_price >= 0),
  stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
  description TEXT,
  image_url TEXT,
  barcode VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. CATEGORIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  parent_id UUID REFERENCES categories(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. CUSTOMERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  credit_balance DECIMAL(10, 2) DEFAULT 0,
  debit_balance DECIMAL(10, 2) DEFAULT 0,
  total_purchases DECIMAL(10, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. EMPLOYEES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS employees (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  position VARCHAR(100),
  department VARCHAR(100),
  salary DECIMAL(10, 2) DEFAULT 0,
  hire_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. SUPPLIERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  balance DECIMAL(10, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. ORDERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  user_id UUID REFERENCES auth.users(id),
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  payment_method VARCHAR(50) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'credit', 'other')),
  payment_status VARCHAR(50) DEFAULT 'paid' CHECK (payment_status IN ('paid', 'pending', 'partial', 'refunded')),
  status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')),
  notes TEXT,
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 8. ORDER ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 9. EXPENSES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category VARCHAR(100) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  description TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_url TEXT,
  approved_by UUID REFERENCES auth.users(id),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 10. CREDIT/DEBIT TRANSACTIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  type VARCHAR(50) NOT NULL CHECK (type IN ('credit', 'debit', 'payment')),
  amount DECIMAL(10, 2) NOT NULL,
  balance_after DECIMAL(10, 2) NOT NULL,
  description TEXT,
  reference_id UUID,
  reference_type VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_transactions_customer ON transactions(customer_id);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX idx_expenses_date ON expenses(expense_date DESC);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DASHBOARD STATS FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION get_dashboard_stats(
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
  total_sales DECIMAL,
  total_orders BIGINT,
  total_customers BIGINT,
  total_products BIGINT,
  total_expenses DECIMAL,
  net_profit DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(o.total_amount), 0) as total_sales,
    COUNT(DISTINCT o.id) as total_orders,
    (SELECT COUNT(*) FROM customers WHERE is_active = true) as total_customers,
    (SELECT COUNT(*) FROM products WHERE is_active = true) as total_products,
    COALESCE((SELECT SUM(amount) FROM expenses WHERE expense_date BETWEEN start_date AND end_date), 0) as total_expenses,
    COALESCE(SUM(o.total_amount), 0) - COALESCE((SELECT SUM(amount) FROM expenses WHERE expense_date BETWEEN start_date AND end_date), 0) as net_profit
  FROM orders o
  WHERE o.created_at BETWEEN start_date AND end_date
    AND o.status = 'completed';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read data
CREATE POLICY "Allow authenticated read access" ON products
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read access" ON categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read access" ON customers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read access" ON orders
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read access" ON order_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read access" ON employees
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read access" ON suppliers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read access" ON expenses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read access" ON transactions
  FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to insert/update/delete
CREATE POLICY "Allow authenticated insert" ON products
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON products
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete" ON products
  FOR DELETE TO authenticated USING (true);

-- Repeat for other tables as needed
CREATE POLICY "Allow authenticated insert" ON orders
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated insert" ON order_items
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated insert" ON customers
  FOR INSERT TO authenticated WITH CHECK (true);

-- =====================================================
-- STORAGE BUCKETS (for receipts & images)
-- =====================================================
-- Note: Create these manually in Supabase Dashboard > Storage
-- Bucket name: pos-files
-- Public: false
-- Allowed file types: image/*, application/pdf

-- =====================================================
-- SEED DATA (Optional)
-- =====================================================

-- Insert default categories
INSERT INTO categories (name, description) VALUES
  ('General', 'General products'),
  ('Food & Beverages', 'Food and drink items'),
  ('Electronics', 'Electronic devices and accessories'),
  ('Clothing', 'Apparel and fashion items'),
  ('Health & Beauty', 'Health and beauty products')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- NOTES:
-- =====================================================
-- 1. Run this SQL in Supabase Dashboard > SQL Editor
-- 2. Create storage bucket 'pos-files' manually
-- 3. Create admin user via Supabase Dashboard > Authentication
-- 4. Set up RLS policies based on your business logic
-- 5. Test all CRUD operations before going live
-- =====================================================
