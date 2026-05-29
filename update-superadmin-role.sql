-- Add 'Super Admin' to users role check constraint
-- Run this in Supabase SQL Editor

-- First, drop the existing constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new constraint with Super Admin role
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('Admin', 'Manager', 'Cashier', 'Super Admin'));

-- Update factssolution@gmail.com to Super Admin
UPDATE users SET role = 'Super Admin' WHERE email = 'factssolution@gmail.com';

-- Verify the update
SELECT id, name, email, role FROM users WHERE email = 'factssolution@gmail.com';
