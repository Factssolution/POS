@echo off
echo ============================================
echo  Uploading Environment Variables to Vercel
echo ============================================
echo.

echo Adding VITE_SUPABASE_URL...
echo https://hfusrtiqjyiotjewzzkt.supabase.co | vercel env add VITE_SUPABASE_URL production

echo.
echo Adding VITE_SUPABASE_ANON_KEY...
echo eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmdXNydGlxanlpb3RqZXd6emt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MDExODYsImV4cCI6MjA5NTM3NzE4Nn0.Hihh9K0B1WIsZxlIZBEBfIp9ouUL3ZkG3cpnrfxOEdM | vercel env add VITE_SUPABASE_ANON_KEY production

echo.
echo Adding VITE_API_URL...
echo https://pos-backend-production-ef0d.up.railway.app | vercel env add VITE_API_URL production

echo.
echo ============================================
echo  All Variables Uploaded!
echo ============================================
echo.
echo Now redeploy on Vercel dashboard!
echo.
pause
