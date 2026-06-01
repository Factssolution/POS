# 🚀 QUICK DEPLOYMENT REFERENCE CARD
## Vercel + Supabase - Multi-Tenant POS System

---

## 📦 WHAT'S READY FOR DEPLOYMENT

✅ **Multi-Tenant Database Schema** - Complete with tenant isolation  
✅ **Backend API** - Vercel serverless ready  
✅ **Frontend** - React + Vite optimized for production  
✅ **Deployment Scripts** - Automated with verification  
✅ **Environment Configuration** - Supabase connection configured  

---

## 🎯 3-STEP DEPLOYMENT

### **STEP 1: DATABASE (Supabase)**

```
1. Go to: https://supabase.com/dashboard
2. Select project: hfusrtiqjyiotjewzzkt
3. Open: SQL Editor
4. Run: supabase-multi-tenant-schema.sql
5. Click: RUN
```

**Verify:**
```sql
SELECT COUNT(*) FROM tenants;  -- Should return 1
SELECT COUNT(*) FROM users;    -- Should return 2
```

---

### **STEP 2: BACKEND API (Vercel)**

```bash
cd "src/backend"
vercel --prod
```

**Environment Variables (add in Vercel Dashboard):**

| Key | Value |
|-----|-------|
| `DB_HOST` | `aws-0-ap-southeast-1.pooler.supabase.com` |
| `DB_PORT` | `6543` |
| `DB_NAME` | `postgres` |
| `DB_USER` | `postgres.hfusrtiqjyiotjewzzkt` |
| `DB_PASSWORD` | `Black@786##` |
| `JWT_SECRET` | `pos-production-secret-2026` |
| `CORS_ORIGIN` | `https://your-frontend.vercel.app` |

**Test:**
```bash
curl https://your-backend.vercel.app/health
```

---

### **STEP 3: FRONTEND (Vercel)**

```bash
cd "d:\POS Business Dashboard ZAYQA"
vercel --prod
```

**Update API URL in `src/services/api.ts`:**
```typescript
const API_BASE_URL = 'https://your-backend.vercel.app/api/v1';
```

**Test:**
```
Open: https://your-frontend.vercel.app
Login: factssolution@gmail.com / Black@786##
```

---

## 🔧 AUTOMATED DEPLOYMENT

```bash
# Run complete deployment wizard
Deploy-to-Vercel.bat
```

This script will:
- ✅ Verify all files
- ✅ Deploy backend
- ✅ Deploy frontend
- ✅ Guide you through setup

---

## 📊 CONNECTION STRINGS

### **Supabase Database**

**Hosted (Production):**
```
postgresql://postgres.hfusrtiqjyiotjewzzkt:Black@786##@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

**Direct (if needed):**
```
postgresql://postgres.hfusrtiqjyiotjewzzkt:Black@786##@db.hfusrtiqjyiotjewzzkt.supabase.co:5432/postgres
```

### **Test Connection**

```bash
cd "src/backend"
node test-supabase-connection.js
```

---

## 🔑 DEFAULT CREDENTIALS

### **Super Admin**
- Email: `factssolution@gmail.com`
- Password: `Black@786##`
- Access: All tenants, full system control

### **Admin**
- Email: `admin@factssolution.com`
- Password: `Test@123`
- Access: Single tenant (default)

---

## 🏗️ ARCHITECTURE

```
┌─────────────────────────────────────────┐
│         USERS (Browser)                 │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  Frontend (Vercel)                      │
│  https://your-frontend.vercel.app       │
│  React + TypeScript + Vite              │
└─────────────┬───────────────────────────┘
              │ HTTPS
              ▼
┌─────────────────────────────────────────┐
│  Backend API (Vercel Serverless)        │
│  https://your-backend.vercel.app        │
│  Node.js + Express + JWT                │
│  ✓ Multi-tenant middleware              │
│  ✓ Tenant isolation                     │
│  ✓ License management                   │
└─────────────┬───────────────────────────┘
              │ SSL (Port 6543)
              ▼
┌─────────────────────────────────────────┐
│  Database (Supabase)                    │
│  PostgreSQL 17                          │
│  ✓ Row-level security                   │
│  ✓ 14 tables with tenant_id             │
│  ✓ Connection pooling                   │
└─────────────────────────────────────────┘
```

---

## ✅ VERIFICATION CHECKLIST

### **Database**
- [ ] 14 tables created
- [ ] Default tenant exists
- [ ] Super Admin user created
- [ ] Settings loaded
- [ ] tenant_id columns present

### **Backend**
- [ ] Deployed to Vercel
- [ ] Environment variables set
- [ ] `/health` returns 200
- [ ] Database connected
- [ ] CORS configured

### **Frontend**
- [ ] Deployed to Vercel
- [ ] API URL updated
- [ ] Login page loads
- [ ] Authentication works
- [ ] Data displays

---

## 🐛 TROUBLESHOOTING

### **Database Connection Failed**

```bash
# Test connection
cd "src/backend"
node test-supabase-connection.js

# Common fixes:
# 1. Check credentials in Supabase Dashboard
# 2. Verify port 6543 is accessible
# 3. Ensure SSL is enabled
```

### **CORS Error**

1. Go to Vercel Dashboard → Backend Project
2. Settings → Environment Variables
3. Update `CORS_ORIGIN` to your frontend URL
4. Redeploy backend

### **401 Unauthorized**

- Verify `JWT_SECRET` matches in backend env vars
- Check token is in `Authorization: Bearer <token>` header
- Clear browser cache and login again

### **500 Server Error**

- Check Vercel Function Logs
- Verify all environment variables are set
- Test database connection

---

## 📁 KEY FILES

| File | Purpose |
|------|---------|
| `supabase-multi-tenant-schema.sql` | Database migration |
| `src/backend/.env.production` | Backend env vars (reference) |
| `src/backend/vercel.json` | Backend Vercel config |
| `vercel.json` | Frontend Vercel config |
| `Deploy-to-Vercel.bat` | Automated deployment |
| `test-supabase-connection.js` | Database test script |
| `VERCEL-SUPABASE-DEPLOYMENT.md` | Full documentation |

---

## 🚀 QUICK COMMANDS

```bash
# Deploy backend
cd src/backend && vercel --prod

# Deploy frontend
vercel --prod

# Test database
cd src/backend && node test-supabase-connection.js

# View logs
vercel logs --follow

# Redeploy
vercel --prod --force

# Rollback
vercel rollback
```

---

## 🔐 SECURITY NOTES

- ✅ Never commit `.env` files
- ✅ Use strong JWT_SECRET
- ✅ SSL enabled for database
- ✅ Row-level security active
- ✅ CORS restricted
- ✅ JWT authentication required

---

## 📞 SUPPORT

**Dashboards:**
- Vercel: https://vercel.com/dashboard
- Supabase: https://supabase.com/dashboard

**Documentation:**
- Full Guide: `VERCEL-SUPABASE-DEPLOYMENT.md`
- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs

---

**🎉 READY TO DEPLOY! Just run `Deploy-to-Vercel.bat`**
