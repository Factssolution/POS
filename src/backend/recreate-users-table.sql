-- ============================================
-- DROP AND RECREATE USERS TABLE
-- Password: Black@786##
-- ============================================

-- Step 1: Drop existing table (if exists)
DROP TABLE IF EXISTS public.users CASCADE;

-- Step 2: Create users table with correct structure
CREATE TABLE public.users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(50) DEFAULT 'Cashier',
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Disable Row Level Security (RLS)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Step 4: Grant all permissions
GRANT ALL ON TABLE public.users TO authenticated;
GRANT ALL ON TABLE public.users TO anon;
GRANT ALL ON TABLE public.users TO service_role;
GRANT ALL ON SEQUENCE public.users_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.users_id_seq TO anon;
GRANT ALL ON SEQUENCE public.users_id_seq TO service_role;

-- Step 5: Insert admin user
-- Email: factssolution@gmail.com
-- Password: Black@786##
-- Role: Admin
INSERT INTO public.users (name, email, password, phone, role, status)
VALUES (
  'Fact Solution',
  'factssolution@gmail.com',
  '$2a$10$UqqVmFR/anxiQ6hYCr8.8OMp2Hctp/5AsOrtjUpeduNMQTT/HuJl2',
  NULL,
  'Admin',
  'active'
);

-- Step 6: Verify insertion
SELECT 
  id,
  name,
  email,
  role,
  status,
  created_at
FROM public.users
ORDER BY id;

-- ============================================
-- EXPECTED OUTPUT:
-- id | name          | email                   | role  | status | created_at
-- 1  | Fact Solution | factssolution@gmail.com | Admin | active | [timestamp]
-- ============================================
