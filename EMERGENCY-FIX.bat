@echo off
echo ============================================
echo EMERGENCY FIX - Remove Local File URLs
echo ============================================
echo.

cd /d "%~dp0src\backend"

echo This will remove the file:/// URL from your database...
echo.

node -e "const {Settings} = require('./models'); (async () => {{ const r = await Settings.update({{setting_value: ''}}, {{where: {{setting_value: {{[require('sequelize').Op.like]: 'file://%%'}}}}}}); console.log(r[0] + ' setting(s) fixed'); process.exit(0); }})().catch(e => {{console.error(e); process.exit(1);}})"

echo.
echo ============================================
echo FIX COMPLETE!
echo ============================================
echo.
echo NOW DO THIS:
echo 1. Close all browser windows
echo 2. Restart backend server (npm start)
echo 3. Open browser and login
echo 4. Error will be GONE
echo.
pause
