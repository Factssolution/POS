-- =====================================================
-- POS SYSTEM - COMPLETE DATABASE SCHEMA
-- =====================================================
-- Database: pos
-- PostgreSQL Version: 17+
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'Cashier' CHECK (role IN ('Super Admin', 'Admin', 'Manager', 'Cashier')),
    phone VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- =====================================================
-- 2. PRODUCTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(100) UNIQUE,
    category_id INTEGER,
    supplier_id INTEGER,
    cost_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    selling_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    reorder_level INTEGER NOT NULL DEFAULT 10,
    image_url VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for products
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_supplier ON products(supplier_id);
CREATE INDEX idx_products_active ON products(is_active);

-- =====================================================
-- 3. CATEGORIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_categories_active ON categories(is_active);

-- =====================================================
-- 4. SUPPLIERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_suppliers_active ON suppliers(is_active);

-- =====================================================
-- 5. ORDERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    token_number INTEGER NOT NULL,
    token_date DATE NOT NULL DEFAULT CURRENT_DATE,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(20) NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'upi', 'other')),
    cashier_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for orders
CREATE INDEX idx_orders_token ON orders(token_number);
CREATE INDEX idx_orders_created ON orders(created_at);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX idx_orders_customer_name ON orders(customer_name);

-- =====================================================
-- 6. ORDER ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- =====================================================
-- 7. TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('sale', 'expense', 'refund', 'credit', 'debit')),
    amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
    payment_method VARCHAR(20) NOT NULL DEFAULT 'cash',
    description TEXT,
    reference_number VARCHAR(100),
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_order ON transactions(order_id);
CREATE INDEX idx_transactions_date ON transactions(created_at);

-- =====================================================
-- 8. EXPENSES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
    description TEXT,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    receipt_url VARCHAR(500),
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_date ON expenses(expense_date);

-- =====================================================
-- 9. EMPLOYEES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    department VARCHAR(100),
    designation VARCHAR(100),
    hire_date DATE NOT NULL,
    salary DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    phone VARCHAR(20),
    address TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_employees_code ON employees(employee_code);
CREATE INDEX idx_employees_status ON employees(status);

-- =====================================================
-- 10. SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_settings_key ON settings(setting_key);

-- =====================================================
-- 11. LICENSES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS licenses (
    id SERIAL PRIMARY KEY,
    license_key VARCHAR(100) UNIQUE NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    client_phone VARCHAR(20),
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    license_type VARCHAR(50) NOT NULL DEFAULT 'monthly' CHECK (license_type IN ('monthly', 'yearly', 'lifetime')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
    activated_at TIMESTAMP,
    expiry_date TIMESTAMP,
    device_fingerprint VARCHAR(255),
    allowed_devices INTEGER NOT NULL DEFAULT 999,
    active_devices INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_licenses_key ON licenses(license_key);
CREATE INDEX idx_licenses_status ON licenses(status);
CREATE INDEX idx_licenses_client ON licenses(client_email);

-- =====================================================
-- 12. AUDIT LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_date ON audit_logs(created_at);

-- =====================================================
-- INSERT DEFAULT SETTINGS
-- =====================================================
INSERT INTO settings (setting_key, setting_value, description) VALUES
('business_name', 'POS System', 'Business name for receipts and reports'),
('currency', 'PKR', 'Currency code'),
('tax_rate', '0', 'Default tax rate percentage'),
('low_stock_threshold', '10', 'Low stock alert threshold'),
('receipt_header', 'Thank you for your purchase!', 'Receipt header message'),
('receipt_footer', 'Visit again!', 'Receipt footer message'),
('trial_period_days', '45', 'Trial period in days'),
('is_trial', 'true', 'Whether system is in trial mode'),
('trial_start_date', NOW()::text, 'Trial start date'),
('trial_end_date', (NOW() + INTERVAL ''45 days'')::text, 'Trial end date'),
('license_status', 'trial', 'Current license status'),
('license_key', '', 'Active license key'),
('license_expiry', '', 'License expiry date'),
('monthly_price', '5000', 'Monthly license price (PKR)'),
('yearly_price', '50000', 'Yearly license price (PKR)'),
('lifetime_price', '150000', 'Lifetime license price (PKR)')
ON CONFLICT (setting_key) DO NOTHING;

-- =====================================================
-- INSERT DEFAULT USERS
-- =====================================================

-- Super Admin User
INSERT INTO users (name, email, password_hash, role, status) VALUES
('Super Admin', 'factsolution@gmail.com', '$2a$10$X7qZ8xYzJ4vKqKxqGqYgMOuBxLqEqJ4vKqKxqGqYgMOuBxLqEqJ4', 'Super Admin', 'active')
ON CONFLICT (email) DO NOTHING;

-- Admin User
INSERT INTO users (name, email, password_hash, role, status) VALUES
('Admin User', 'admin@factssolution.com', '$2a$10$X7qZ8xYzJ4vKqKxqGqYgMOuBxLqEqJ4vKqKxqGqYgMOuBxLqEqJ4', 'Admin', 'active')
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- CREATE BACKUPS DIRECTORY
-- =====================================================
-- Note: This will be created by the application
-- Directory: src/backend/backups

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
-- All permissions are managed at application level

-- =====================================================
-- SCHEMA CREATION COMPLETE
-- =====================================================
