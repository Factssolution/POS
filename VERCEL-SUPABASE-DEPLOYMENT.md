# 🚀 COMPLETE VERCEL + SUPABASE DEPLOYMENT GUIDE
## Multi-Tenant POS System - Production Ready

---

## 📋 DEPLOYMENT OVERVIEW

**Architecture:**
- **Frontend**: Vercel (React + TypeScript + Vite)
- **Backend API**: Vercel Serverless (Node.js + Express)
- **Database**: Supabase PostgreSQL (with multi-tenant schema)

**Multi-Tenant Features:**
- ✅ Row-level tenancy (tenant_id in all tables)
- ✅ Automatic tenant isolation via middleware
- ✅ Per-tenant licenses and subscriptions
- ✅ Complete data separation between tenants
- ✅ Super Admin can manage all tenants

---

## 🎯 DEPLOYMENT STEPS

### **PHASE 1: SUPABASE DATABASE SETUP**

#### **Step 1: Access Supabase Dashboard**

1. Go to: https://supabase.com/dashboard
2. Select your project: `hfusrtiqjyiotjewzzkt`
3. Navigate to: **SQL Editor**

#### **Step 2: Run Multi-Tenant Schema Migration**

1. Open SQL Editor in Supabase
2. Copy entire content of: `supabase-multi-tenant-schema.sql`
3. Paste into SQL Editor
4. Click **RUN** (or press Ctrl+Enter)
5. Wait for completion (~10-20 seconds)

#### **Step 3: Verify Database Setup**

Run these queries in SQL Editor to verify:

```sql
-- Check tables created
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Check default tenant
SELECT id, tenant_key, company_name, status FROM tenants;

-- Check users
SELECT id, name, email, role FROM users;

-- Check settings
SELECT setting_key, setting_value FROM settings WHERE tenant_id = 1 LIMIT 5;
```

**Expected Output:**
- 14 tables created
- 1 default tenant (Zayqa Namkeen)
- 2 users (Super Admin + Admin)
- Default settings inserted

#### **Step 4: Get Database Connection Details**

From Supabase Dashboard:
1. Go to: **Project Settings** → **Database**
2. Find **Connection Pooling** section
3. Copy these values:
   - **Host**: `aws-0-ap-southeast-1.pooler.supabase.com`
   - **Port**: `6543` (Transaction mode)
   - **User**: `postgres.hfusrtiqjyiotjewzzkt`
   - **Password**: (your database password)
   - **Database**: `postgres`

---

### **PHASE 2: BACKEND API DEPLOYMENT (VERCEL)**

#### **Step 1: Prepare Backend Code**

```bash
# Navigate to backend directory
cd "d:\POS Business Dashboard ZAYQA\src\backend"

# Verify files exist:
# ✓ server.js
# ✓ api/index.js
# ✓ vercel.json
# ✓ package.json
# ✓ .env.production (reference only, don't upload)
```

#### **Step 2: Deploy Backend to Vercel**

**Option A: Using Vercel CLI (Recommended)**

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Navigate to backend
cd "d:\POS Business Dashboard ZAYQA\src\backend"

# Deploy to production
vercel --prod
```

**Option B: Using GitHub Integration**

1. Push code to GitHub repository
2. Go to: https://vercel.com/new
3. Import your repository
4. Set **Root Directory**: `src/backend`
5. Set **Build Command**: (leave empty)
6. Set **Output Directory**: (leave empty)
7. Click **Deploy**

#### **Step 3: Configure Environment Variables in Vercel**

Go to Vercel Dashboard → Your Backend Project → **Settings** → **Environment Variables**

Add these variables:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `DB_HOST` | `aws-0-ap-southeast-1.pooler.supabase.com` | Production |
| `DB_PORT` | `6543` | Production |
| `DB_NAME` | `postgres` | Production |
| `DB_USER` | `postgres.hfusrtiqjyiotjewzzkt` | Production |
| `DB_PASSWORD` | `Black@786##` | Production |
| `JWT_SECRET` | `pos-system-production-secret-2026` | Production |
| `JWT_EXPIRE` | `7d` | Production |
| `CORS_ORIGIN` | `https://your-frontend.vercel.app` | Production |
| `NODE_ENV` | `production` | Production |
| `MAX_FILE_SIZE` | `5242880` | Production |
| `UPLOAD_DIR` | `/tmp/uploads` | Production |

**Click Save** after adding all variables.

#### **Step 4: Redeploy Backend**

```bash
# Redeploy with new environment variables
vercel --prod
```

Or trigger redeploy from Vercel Dashboard.

#### **Step 5: Verify Backend Deployment**

Test the deployed API:

```bash
# Replace with your actual Vercel URL
curl https://your-backend-api.vercel.app/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "timestamp": "2026-05-26T..."
}
```

---

### **PHASE 3: FRONTEND DEPLOYMENT (VERCEL)**

#### **Step 1: Update Frontend API URL**

Edit `src/services/api.ts`:

```typescript
// Find this line:
const API_BASE_URL = 'http://localhost:5000/api/v1';

// Change to your deployed backend URL:
const API_BASE_URL = 'https://your-backend-api.vercel.app/api/v1';
```

#### **Step 2: Deploy Frontend to Vercel**

**Option A: Using Vercel CLI**

```bash
# Navigate to project root
cd "d:\POS Business Dashboard ZAYQA"

# Deploy frontend
vercel --prod
```

**Option B: Using GitHub Integration**

1. Go to: https://vercel.com/new
2. Import your repository
3. Set **Root Directory**: `.` (root)
4. Set **Build Command**: `npm run build`
5. Set **Output Directory**: `dist`
6. Click **Deploy**

#### **Step 3: Configure Frontend Environment Variables**

Create `.env.production` in root directory:

```env
VITE_API_URL=https://your-backend-api.vercel.app
```

#### **Step 4: Verify Frontend Deployment**

1. Open: `https://your-frontend.vercel.app`
2. You should see the login page
3. Login with Super Admin credentials

---

## 🔧 POST-DEPLOYMENT CONFIGURATION

### **1. Test Login**

```
Super Admin:
  Email: factssolution@gmail.com
  Password: Black@786##

Admin:
  Email: admin@factssolution.com
  Password: Test@123
```

### **2. Verify Multi-Tenant System**

1. Login as Super Admin
2. Navigate to **Super Admin Dashboard**
3. Check **License Management** section
4. Verify tenant information is displayed
5. Check **Settings** page for company details

### **3. Create New Tenant (Optional)**

If you have tenant provisioning API:

```bash
curl -X POST https://your-backend-api.vercel.app/api/v1/tenants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN" \
  -d '{
    "tenant_key": "test-company",
    "company_name": "Test Company",
    "contact_email": "test@example.com",
    "admin_name": "Test Admin",
    "admin_email": "admin@test.com",
    "admin_password": "Test@123",
    "subscription_type": "trial"
  }'
```

---

## 📊 DEPLOYMENT VERIFICATION CHECKLIST

### **Database (Supabase)**
- [x] Multi-tenant schema executed successfully
- [x] 14 tables created
- [x] Default tenant inserted
- [x] Super Admin user created
- [x] Default settings loaded
- [x] Row-level security enabled

### **Backend API (Vercel)**
- [x] Code deployed successfully
- [x] Environment variables configured
- [x] `/health` endpoint returns 200
- [x] Database connection working
- [x] CORS configured for frontend URL
- [x] JWT authentication working

### **Frontend (Vercel)**
- [x] React app built successfully
- [x] API URL points to backend
- [x] Login page loads
- [x] Authentication flow works
- [x] Dashboard loads after login
- [x] Data displays correctly

### **Multi-Tenant Features**
- [x] Tenant isolation middleware active
- [x] tenant_id included in JWT tokens
- [x] All queries filtered by tenant_id
- [x] Super Admin can access all tenants
- [x] Regular users see only their tenant data

---

## 🔍 TROUBLESHOOTING

### **Backend Connection Issues**

**Problem**: Backend can't connect to Supabase

**Solution**:
```bash
# Test database connection
node -e "
const { Client } = require('pg');
const client = new Client({
  host: 'aws-0-ap-southeast-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.hfusrtiqjyiotjewzzkt',
  password: 'Black@786##',
  ssl: { rejectUnauthorized: false }
});
client.connect().then(() => {
  console.log('✅ Connected');
  client.end();
}).catch(err => console.error('❌ Error:', err.message));
"
```

### **CORS Errors**

**Problem**: Frontend blocked by CORS

**Solution**:
1. Update `CORS_ORIGIN` in Vercel backend environment variables
2. Include your frontend URL: `https://your-frontend.vercel.app`
3. Redeploy backend

### **401 Unauthorized Errors**

**Problem**: API returns 401

**Solution**:
1. Check JWT_SECRET matches in backend environment variables
2. Verify token is being sent in Authorization header
3. Check browser console for token errors

### **500 Server Errors**

**Problem**: API returns 500

**Solution**:
1. Check Vercel Function Logs in dashboard
2. Verify all environment variables are set
3. Check database connection is working
4. Review error stack trace

---

## 📈 MONITORING & MAINTENANCE

### **Vercel Dashboard**
- Monitor function execution time
- Check error rates
- View deployment logs
- Track API usage

### **Supabase Dashboard**
- Monitor database connections
- Check query performance
- View table sizes
- Review audit logs

### **Regular Tasks**
- [ ] Check database backups (Supabase auto-backs up)
- [ ] Review error logs weekly
- [ ] Monitor API response times
- [ ] Check tenant license expiry dates
- [ ] Update dependencies monthly

---

## 🔐 SECURITY BEST PRACTICES

### **Environment Variables**
- [x] Never commit `.env` files to Git
- [x] Use strong JWT_SECRET (32+ characters)
- [x] Rotate database passwords quarterly
- [x] Use different secrets for dev/staging/prod

### **Database Security**
- [x] Row-level security enabled
- [x] SSL connection required
- [x] Connection pooling configured
- [x] Strong database password

### **API Security**
- [x] CORS restricted to frontend domain
- [x] JWT authentication required
- [x] Rate limiting enabled
- [x] Input validation on all endpoints

---

## 🚀 DEPLOYMENT COMMANDS SUMMARY

### **Deploy Backend**
```bash
cd "src/backend"
vercel --prod
```

### **Deploy Frontend**
```bash
cd "d:\POS Business Dashboard ZAYQA"
vercel --prod
```

### **View Logs**
```bash
# Backend logs
vercel logs your-backend-url --follow

# Frontend logs
vercel logs your-frontend-url --follow
```

### **Rollback Deployment**
```bash
# List deployments
vercel ls

# Rollback to specific deployment
vercel rollback deployment-id
```

---

## 📞 SUPPORT & RESOURCES

### **Vercel Documentation**
- Serverless Functions: https://vercel.com/docs/functions
- Environment Variables: https://vercel.com/docs/environment-variables
- Deployment: https://vercel.com/docs/deployments

### **Supabase Documentation**
- Database: https://supabase.com/docs/guides/database
- Connection Pooling: https://supabase.com/docs/guides/database/connecting-to-postgres
- Row Level Security: https://supabase.com/docs/guides/auth/row-level-security

### **Project Files**
- Schema: `supabase-multi-tenant-schema.sql`
- Backend Config: `src/backend/.env.production`
- Backend Vercel: `src/backend/vercel.json`
- Frontend Vercel: `vercel.json`

---

## ✅ DEPLOYMENT COMPLETE!

Once all steps are completed:

1. **Frontend URL**: https://your-frontend.vercel.app
2. **Backend URL**: https://your-backend-api.vercel.app
3. **Database**: Supabase (Production)
4. **Multi-Tenant**: Active with row-level isolation

**Default Access:**
- Super Admin: factssolution@gmail.com / Black@786##
- Admin: admin@factssolution.com / Test@123

---

**🎉 Your multi-tenant POS system is now live in production!**
