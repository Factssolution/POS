@echo off
title Fix ALL Supabase Permissions
color 0A
mode con: cols=80 lines=40

echo.
echo ================================================================================
echo                    FIX SUPABASE DATABASE PERMISSIONS
echo ================================================================================
echo.
echo  Problem: Database cannot fetch products, categories, licenses, suppliers, etc
echo  Solution: Grant SELECT permissions to anon and authenticated roles
echo.
echo ================================================================================
echo.
echo  STEP 1: Opening Supabase Dashboard...
echo.

start https://supabase.com/dashboard/project/hfusrtiqjyiotjewzzkt/sql/new

timeout /t 3 /nobreak >nul

echo.
echo  STEP 2: Copy this SQL (press any key to copy to clipboard):
echo.
echo  ------------------------------------------------------------------------
echo  GRANT SELECT ON public.licenses TO anon;
echo  GRANT SELECT ON public.licenses TO authenticated;
echo  GRANT SELECT ON public.settings TO anon;
echo  GRANT SELECT ON public.settings TO authenticated;
echo  GRANT SELECT ON public.products TO anon;
echo  GRANT SELECT ON public.products TO authenticated;
echo  GRANT SELECT ON public.categories TO anon;
echo  GRANT SELECT ON public.categories TO authenticated;
echo  GRANT SELECT ON public.suppliers TO anon;
echo  GRANT SELECT ON public.suppliers TO authenticated;
echo  GRANT SELECT ON public.orders TO anon;
echo  GRANT SELECT ON public.orders TO authenticated;
echo  GRANT SELECT ON public.customers TO anon;
echo  GRANT SELECT ON public.customers TO authenticated;
echo  GRANT SELECT ON public.employees TO anon;
echo  GRANT SELECT ON public.employees TO authenticated;
echo  GRANT SELECT ON public.users TO anon;
echo  GRANT SELECT ON public.users TO authenticated;
echo  GRANT SELECT ON public.transactions TO anon;
echo  GRANT SELECT ON public.transactions TO authenticated;
echo  GRANT SELECT ON public.expenses TO anon;
echo  GRANT SELECT ON public.expenses TO authenticated;
echo  ------------------------------------------------------------------------
echo.
pause >nul

echo.
echo  Copying SQL to clipboard...
echo GRANT SELECT ON public.licenses TO anon; GRANT SELECT ON public.licenses TO authenticated; GRANT SELECT ON public.settings TO anon; GRANT SELECT ON public.settings TO authenticated; GRANT SELECT ON public.products TO anon; GRANT SELECT ON public.products TO authenticated; GRANT SELECT ON public.categories TO anon; GRANT SELECT ON public.categories TO authenticated; GRANT SELECT ON public.suppliers TO anon; GRANT SELECT ON public.suppliers TO authenticated; GRANT SELECT ON public.orders TO anon; GRANT SELECT ON public.orders TO authenticated; GRANT SELECT ON public.customers TO anon; GRANT SELECT ON public.customers TO authenticated; GRANT SELECT ON public.employees TO anon; GRANT SELECT ON public.employees TO authenticated; GRANT SELECT ON public.users TO anon; GRANT SELECT ON public.users TO authenticated; GRANT SELECT ON public.transactions TO anon; GRANT SELECT ON public.transactions TO authenticated; GRANT SELECT ON public.expenses TO anon; GRANT SELECT ON public.expenses TO authenticated; | clip

echo  SQL copied! Paste it in Supabase SQL Editor (Ctrl+V)
echo.
echo  STEP 3: Click "Run" in Supabase Dashboard
echo.
echo ================================================================================
echo.
echo  After running the SQL:
echo    - Refresh your POS application
echo    - Products, categories, licenses, suppliers should load
echo    - No more 401/400 errors in console
echo.
echo ================================================================================
echo.
pause
