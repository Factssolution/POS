# RENDER.COM DEPLOYMENT - 5 MINUTES

## STEP 1: Create Render Account (if you don't have)
1. Go to: https://render.com
2. Click "Get Started for Free"
3. Sign up with GitHub account
4. Authorize Render to access your GitHub repos

## STEP 2: Deploy Backend
1. Go to: https://dashboard.render.com
2. Click **"New +"** button
3. Select **"Web Service"**
4. Connect to your GitHub repo: **Factssolution/POS**
5. Configure:
   - **Name**: pos-backend
   - **Region**: Singapore (closest to Supabase)
   - **Branch**: main
   - **Root Directory**: src/backend
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

6. **Environment Variables** (click "Advanced" and add):
   ```
   NODE_ENV = production
   PORT = 10000
   DB_HOST = db.hfusrtiqjyiotjewzzkt.supabase.co
   DB_PORT = 5432
   DB_NAME = postgres
   DB_USER = postgres
   DB_PASSWORD = 0aKLhR4vaNjOP5uZ
   DB_SSL = true
   JWT_SECRET = pos-system-secret-key-2026-render
   JWT_EXPIRE = 7d
   CORS_ORIGIN = https://pos-iota-sage.vercel.app,http://localhost:5173
   ```

7. Click **"Create Web Service"**

## STEP 3: Wait for Deployment (2-3 minutes)
- Render will automatically build and deploy
- You'll see logs in the dashboard
- Wait for "Your service is live" message

## STEP 4: Get Backend URL
- Your backend URL will be: `https://pos-backend-XXXX.onrender.com`
- Copy this URL

## STEP 5: Update Vercel Frontend
1. Go to: https://vercel.com
2. Click on your project: pos-iota-sage
3. Go to **Settings** → **Environment Variables**
4. Update `VITE_API_URL` to: `https://pos-backend-XXXX.onrender.com/api/v1`
5. Go to **Deployments** tab
6. Click **Redeploy** on latest deployment

## STEP 6: Test Login
- Go to: https://pos-iota-sage.vercel.app
- Login with:
  - Email: factssolution@gmail.com
  - Password: Black@786##

---

## WHY RENDER IS BETTER:
✅ No build cache issues
✅ Direct GitHub integration
✅ Singapore region (close to Supabase Asia)
✅ Free tier available
✅ Automatic HTTPS
✅ Reliable deployments

## ESTIMATED TIME: 5-7 minutes total
