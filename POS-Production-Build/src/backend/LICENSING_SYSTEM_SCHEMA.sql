-- ═══════════════════════════════════════════════════════════
-- LICENSING SYSTEM - COMPLETE DATABASE SCHEMA
-- ═══════════════════════════════════════════════════════════

-- 1. LICENSES TABLE
CREATE TABLE IF NOT EXISTS licenses (
  id SERIAL PRIMARY KEY,
  license_key VARCHAR(255) NOT NULL UNIQUE,
  client_email VARCHAR(255) NOT NULL,
  client_name VARCHAR(255),
  client_phone VARCHAR(50),
  client_company VARCHAR(255),
  plan_type VARCHAR(50) DEFAULT 'monthly' CHECK (plan_type IN ('monthly', 'yearly', 'lifetime')),
  plan_duration INTEGER DEFAULT 30,
  price DECIMAL(10,2) DEFAULT 5000.00,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'pending')),
  allowed_devices INTEGER DEFAULT 999,
  active_devices INTEGER DEFAULT 0,
  issued_date TIMESTAMP DEFAULT NOW(),
  expiry_date TIMESTAMP,
  total_amount DECIMAL(10,2),
  paid_amount DECIMAL(10,2) DEFAULT 0,
  payment_method VARCHAR(50) CHECK (payment_method IN ('cash', 'jazzcash', 'easypaisa', 'bank_transfer', 'other')),
  payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'refunded')),
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_license_key ON licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_license_status ON licenses(status);
CREATE INDEX IF NOT EXISTS idx_license_expiry ON licenses(expiry_date);
CREATE INDEX IF NOT EXISTS idx_license_client ON licenses(client_email);

-- 2. SETTINGS TABLE - LICENSE FIELDS
INSERT INTO settings (setting_key, setting_value, created_at, updated_at) VALUES
  ('license_key', '', NOW(), NOW()),
  ('license_status', 'trial', NOW(), NOW()),
  ('license_expiry', '', NOW(), NOW()),
  ('is_trial', 'true', NOW(), NOW()),
  ('trial_start_date', '', NOW(), NOW()),
  ('trial_end_date', '', NOW(), NOW()),
  ('monthly_price', '5000.00', NOW(), NOW()),
  ('yearly_price', '50000.00', NOW(), NOW()),
  ('lifetime_price', '150000.00', NOW(), NOW()),
  ('trial_period_days', '45', NOW(), NOW())
ON CONFLICT (setting_key) DO NOTHING;

-- 3. SUPER ADMIN USER
INSERT INTO users (name, email, password, role, status, created_at, updated_at) VALUES
  ('Super Admin', 'factssolution@gmail.com', '$2a$10$YourHashedPasswordHere', 'Super Admin', 'active', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET role = 'Super Admin';

-- ═══════════════════════════════════════════════════════════
-- LICENSE LIFECYCLE FLOW
-- ═══════════════════════════════════════════════════════════

-- STEP 1: Installation → Auto Trial
-- System checks if license exists, if not, initializes 45-day trial
-- Settings: is_trial='true', license_status='trial', trial_end_date=NOW()+45 days

-- STEP 2: Trial Period (45 days)
-- Full access to all features
-- Warnings start at 7 days before expiry (HTTP headers + UI)

-- STEP 3: Trial Expiry
-- Settings: license_status='expired'
-- System locks for all users EXCEPT Super Admin
-- All API calls blocked by licenseValidator middleware

-- STEP 4: Super Admin Generates License
-- POST /api/v1/settings/license/generate
-- Creates: FACTS-XXXX-XXXX-XXXX format
-- Database: INSERT INTO licenses (...)
-- Returns: license_key, expiry_date, plan_type, price

-- STEP 5: Client Activates License
-- POST /api/v1/settings/license/activate
-- Body: { license_key: 'FACTS-...', client_email: 'user@example.com' }
-- Updates: settings (license_key, license_status, license_expiry, is_trial)
-- Reactivates: User if status='inactive'
-- Tracks: Device fingerprint (SHA256 hash)
-- Increments: active_devices counter

-- STEP 6: License Active
-- Settings: license_status='active', is_trial='false'
-- Full access granted
-- Warnings start at 5 days before expiry

-- STEP 7: License Expiry
-- System checks expiry_date < NOW()
-- Blocks all users EXCEPT Super Admin
-- Requires renewal (new license from Super Admin)

-- STEP 8: Renewal
-- Contact Super Admin
-- Generate new license
-- Activate new license (replaces old one)

-- STEP 9: Revocation (Super Admin only)
-- POST /api/v1/settings/license/revoke/:id
-- Sets: license.status='revoked'
-- Immediate lockout for all users

-- ═══════════════════════════════════════════════════════════
-- API ENDPOINTS
-- ═══════════════════════════════════════════════════════════

-- 1. Generate License (Super Admin only)
-- POST /api/v1/settings/license/generate
-- Body: { client_email, client_name?, plan_type?, price? }
-- Response: { success, data: { license_key, expiry_date, ... } }

-- 2. Activate License (All authenticated users)
-- POST /api/v1/settings/license/activate
-- Body: { license_key, client_email? }
-- Response: { success, data: { license_key, expiry_date, devices, user_activated } }

-- 3. Check License Status (All authenticated users)
-- GET /api/v1/settings/license/status
-- Response: { success, data: { status, expiry_date, days_remaining, is_trial, ... } }

-- 4. List All Licenses (Super Admin only)
-- GET /api/v1/settings/license/all?page=1&limit=20&status=active&search=email
-- Response: { success, data: { licenses, total, page, limit } }

-- 5. Revoke License (Super Admin only)
-- POST /api/v1/settings/license/revoke/:id
-- Response: { success, message }

-- 6. Update Pricing (Super Admin only)
-- PUT /api/v1/settings/license/pricing
-- Body: { monthly_price?, yearly_price?, lifetime_price? }
-- Response: { success, data: { monthly_price, yearly_price, lifetime_price } }

-- ═══════════════════════════════════════════════════════════
-- MIDDLEWARE FLOW
-- ═══════════════════════════════════════════════════════════

-- Request Flow:
-- 1. Client Request
-- 2. Auth Middleware (authenticate JWT, set req.user)
-- 3. License Validator Middleware
--    - Skip if public route (login, register, license status/activate)
--    - Skip if req.user.role === 'Super Admin'
--    - Check settings (is_trial, license_status, license_expiry)
--    - If trial: Check trial_end_date, warn if < 7 days
--    - If licensed: Check expiry_date, warn if < 5 days
--    - If expired: Return 403 (block access)
--    - Add headers: X-License-Status, X-Expiry-Date, X-Days-Remaining
-- 4. Protected Route Handler
-- 5. Response

-- ═══════════════════════════════════════════════════════════
-- SECURITY FEATURES
-- ═══════════════════════════════════════════════════════════

-- ✅ JWT Authentication (bcrypt passwords)
-- ✅ Role-Based Access Control (Super Admin, Admin, Manager, Cashier)
-- ✅ License Validation on ALL protected routes
-- ✅ Super Admin Bypass (always has access)
-- ✅ Fail-Secure Error Handling (503 on validation error)
-- ✅ Device Tracking (SHA256 fingerprint + device count)
-- ✅ License Key Uniqueness Constraint
-- ✅ SQL Injection Prevention (Sequelize ORM)
-- ✅ XSS Protection (Helmet middleware)
-- ✅ Rate Limiting (express-rate-limit on auth routes)

-- ═══════════════════════════════════════════════════════════
-- PRICING (Editable from Super Admin Dashboard)
-- ═══════════════════════════════════════════════════════════

-- Monthly:   Rs 5,000  (30 days)
-- Yearly:    Rs 50,000 (365 days) - Save Rs 10,000
-- Lifetime:  Rs 150,000 (unlimited)

-- ═══════════════════════════════════════════════════════════
-- DEVICE TRACKING
-- ═══════════════════════════════════════════════════════════

-- Each license supports multiple devices:
-- - allowed_devices: Maximum devices (default 999 = unlimited)
-- - active_devices: Currently activated devices
-- - Device fingerprint: SHA256 hash of (user-agent + IP)
-- - On activation: active_devices++
-- - If active_devices >= allowed_devices: Block activation

-- ═══════════════════════════════════════════════════════════
-- USER REACTIVATION
-- ═══════════════════════════════════════════════════════════

-- When license is activated with client_email:
-- 1. Check if user exists with that email
-- 2. If user.status === 'inactive', set to 'active'
-- 3. User can now login
-- 4. Full system access granted

-- ═══════════════════════════════════════════════════════════
-- VERIFICATION COMMANDS
-- ═══════════════════════════════════════════════════════════

-- Check license settings:
SELECT setting_key, setting_value FROM settings WHERE setting_key LIKE '%license%' OR setting_key = 'is_trial';

-- Check all licenses:
SELECT license_key, client_email, status, active_devices, allowed_devices, expiry_date FROM licenses ORDER BY created_at DESC;

-- Check licensed users:
SELECT email, role, status FROM users WHERE email LIKE '%factssolution%' OR email LIKE '%admin%';

-- Verify schema:
SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'licenses' ORDER BY ordinal_position;
