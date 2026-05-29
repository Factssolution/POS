# VERCEL DEPLOYMENT GUIDE - POS Business Dashboard

## 🚀 Full-Stack Deployment on Vercel

This project is now configured for **complete deployment on Vercel** (both frontend and backend).

---

## ✅ Configuration Complete

### Files Updated:
- ✅ `vercel.json` - Configured for frontend + backend deployment
- ✅ `package.json` - Added vercel-build script
- ✅ `src/backend/server.js` - Vercel serverless compatible
- ✅ `api/index.js` - Serverless function entry point
- ✅ `.env.example` - Environment variable template

### Files Removed:
- ❌ Railway configuration files
- ❌ Render deployment files
- ❌ Other platform-specific configs

---

## 📋 Deployment Steps

### 1. Push to GitHub

```bash
git add .
git commit -m "Configure for Vercel full-stack deployment"
git push origin main
```

### 2. Configure Environment Variables in Vercel

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add the following variables for **ALL environments** (Production, Preview, Development):

#### Frontend Variables (VITE_ prefix):
```
VITE_API_URL=https://your-domain.vercel.app/api/v1
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

#### Backend Variables (Server-side only):
```
NODE_ENV=production
DB_HOST=db.your-project.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-database-password
DB_SSL=true
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRE=7d
CORS_ORIGIN=https://your-domain.vercel.app,http://localhost:5173
```

### 3. Redeploy

After adding environment variables, trigger a new deployment:
- Go to **Vercel Dashboard → Your Project → Deployments**
- Click **Redeploy** on the latest deployment
- Or push a new commit to trigger automatic deployment

---

## 🏗️ Architecture

```
Vercel Deployment
├── Frontend (Static Site)
│   ├── Built with Vite
│   ├── Output: dist/
│   └── Served from root (/)
│
└── Backend (Serverless Functions)
    ├── Entry: api/index.js
    ├── Routes: /api/v1/*, /health, /uploads/*
    └── Database: Supabase PostgreSQL
```

---

## 🔧 How It Works

### Frontend:
- Built using `npm run build` (Vite)
- Static files served from `dist/`
- Environment variables prefixed with `VITE_` are embedded at build time

### Backend:
- Runs as Vercel Serverless Functions
- Entry point: `api/index.js` → `src/backend/server.js`
- All `/api/v1/*` routes handled by Express backend
- Database connection established on each serverless invocation
- `app.listen()` is skipped when running on Vercel (`process.env.VERCEL === '1'`)

---

## 🌐 URL Structure

After deployment:
- **Frontend**: `https://your-domain.vercel.app/`
- **Backend API**: `https://your-domain.vercel.app/api/v1/`
- **Health Check**: `https://your-domain.vercel.app/health`

---

## ⚠️ Important Notes

### Serverless Limitations:
- ⚠️ **Execution timeout**: 10 seconds (Hobby), 60 seconds (Pro)
- ⚠️ **No persistent connections**: Database connection created per request
- ⚠️ **No file uploads to disk**: Use Supabase Storage or S3 for file uploads
- ⚠️ **Cold starts**: First request may be slower

### Database:
- ✅ Using Supabase PostgreSQL (connection pooling recommended)
- ✅ SSL enabled for production
- ✅ Connection established on each serverless invocation

### CORS:
- ✅ Configured to allow your Vercel frontend URL
- ✅ No CORS issues since frontend and backend are on same domain

---

## 🔍 Testing Deployment

### 1. Check Health Endpoint
```bash
curl https://your-domain.vercel.app/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "POS System API is running",
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

### 2. Test Frontend
- Open `https://your-domain.vercel.app/` in browser
- Login should work with your credentials
- API calls will go to `/api/v1/*` endpoints

### 3. Check Vercel Logs
- Go to **Vercel Dashboard → Your Project → Deployments**
- Click on latest deployment → **Logs**
- Check for any errors during build or runtime

---

## 🐛 Troubleshooting

### Build Fails
- Check build logs in Vercel Dashboard
- Ensure all dependencies are in `package.json`
- Verify `npm run build` works locally

### API Returns 500 Error
- Check Vercel Function Logs
- Verify database credentials in environment variables
- Check database connection in Supabase dashboard

### Frontend Can't Connect to API
- Verify `VITE_API_URL` is set correctly in Vercel
- Must end with `/api/v1`
- Redeploy after changing environment variables

### CORS Errors
- Should not happen with this setup (same domain)
- If occurs, check `CORS_ORIGIN` includes your Vercel URL

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Supabase PostgreSQL](https://supabase.com/docs/guides/database)

---

## 🎯 Next Steps

1. ✅ Push code to GitHub
2. ✅ Add environment variables to Vercel
3. ✅ Trigger redeployment
4. ✅ Test health endpoint
5. ✅ Test frontend login
6. ✅ Monitor Vercel logs for any issues

---

**Deployment Status**: ✅ Ready for Production
**Platform**: Vercel (Full-Stack)
**Database**: Supabase PostgreSQL
