@echo off
setlocal enabledelayedexpansion

echo.
echo ================================================================
echo    POS SYSTEM - DATABASE VERIFICATION
echo ================================================================
echo.

set PGPASSWORD=Black@786##

echo [1/5] Checking database connection...
echo.

psql -U postgres -d pos -c "SELECT current_database(), current_user, version();" 2>nul

if %errorlevel% neq 0 (
    echo ERROR: Cannot connect to 'pos' database!
    echo Please ensure PostgreSQL is running and database exists.
    pause
    exit /b 1
)

echo.
echo ✓ Database connection successful
echo.

echo [2/5] Checking tables...
echo.

psql -U postgres -d pos -c "
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
"

echo.

echo [3/5] Checking record counts...
echo.

psql -U postgres -d pos -c "
SELECT 'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
UNION ALL
SELECT 'suppliers', COUNT(*) FROM suppliers
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'order_items', COUNT(*) FROM order_items
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'expenses', COUNT(*) FROM expenses
UNION ALL
SELECT 'employees', COUNT(*) FROM employees
UNION ALL
SELECT 'settings', COUNT(*) FROM settings
UNION ALL
SELECT 'licenses', COUNT(*) FROM licenses
UNION ALL
SELECT 'audit_logs', COUNT(*) FROM audit_logs
ORDER BY table_name;
"

echo.

echo [4/5] Checking settings...
echo.

psql -U postgres -d pos -c "
SELECT setting_key, setting_value 
FROM settings 
WHERE setting_key IN (
    'trial_period_days',
    'is_trial',
    'license_status',
    'monthly_price',
    'yearly_price',
    'lifetime_price',
    'currency'
)
ORDER BY setting_key;
"

echo.

echo [5/5] Checking users...
echo.

psql -U postgres -d pos -c "
SELECT id, name, email, role, status, created_at 
FROM users 
ORDER BY id;
"

echo.
echo ================================================================
echo    ✓ DATABASE VERIFICATION COMPLETED!
echo ================================================================
echo.
echo Check the output above to verify:
echo   - All 12 tables exist
echo   - Settings are initialized
echo   - Default users are created
echo   - Record counts are correct
echo.
pause
