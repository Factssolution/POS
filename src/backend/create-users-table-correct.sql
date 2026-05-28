-- Drop existing table if exists
DROP TABLE IF EXISTS public.users CASCADE;

-- Create users table with correct structure
CREATE TABLE public.users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(50) DEFAULT 'Cashier' CHECK (role IN ('Admin', 'Manager', 'Cashier')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Disable RLS
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON TABLE public.users TO authenticated;
GRANT ALL ON TABLE public.users TO anon;
GRANT ALL ON TABLE public.users TO service_role;
GRANT ALL ON SEQUENCE public.users_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.users_id_seq TO anon;
GRANT ALL ON SEQUENCE public.users_id_seq TO service_role;

-- Insert super admin user
-- Password: Black@786## (hashed with bcrypt)
INSERT INTO public.users (name, email, password, role, status)
VALUES (
  'Fact Solution',
  'factssolution@gmail.com',
  '$2a$10$UqqVmFR/anxiQ6hYCr8.8OMp2Hctp/5AsOrtjUpeduNMQTT/HuJl2',
  'Admin',
  'active'
);

-- Verify
SELECT id, name, email, role, status, created_at FROM public.users;
