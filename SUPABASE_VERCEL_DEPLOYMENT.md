# 🚀 POS System - Supabase + Vercel Deployment Guide

## ✅ Why This Architecture?

| Feature | Benefit |
|---------|---------|
| **Supabase** | PostgreSQL + Auth + Storage + Real-time (All FREE) |
| **Vercel** | Frontend hosting with global CDN (FREE, unlimited) |
| **Database** | Permanent, auto-backup, 500MB storage |
| **Files** | 1GB storage for receipts & product images |
| **Bandwidth** | Unlimited on both platforms |
| **SSL** | Automatic HTTPS certificates |

---

## 📋 Complete Deployment Steps

### Phase 1: Setup Supabase (10 minutes)

#### Step 1: Create Supabase Account

1. Go to: **https://supabase.com**
2. Click **"Start your project"** → **"Sign Up"**
3. Sign up with **GitHub** (recommended)
4. Complete registration

#### Step 2: Create New Project

1. Click **"New Project"**
2. Configure:
   - **Name:** `pos-system`
   - **Database Password:** Create a strong password (SAVE THIS!)
   - **Region:** Choose closest to your location
   - **Pricing Plan:** **Free**
3. Click **"Create new project"**
4. Wait 2-3 minutes for provisioning

#### Step 3: Get API Credentials

1. Go to **Project Dashboard** → **Settings** (gear icon) → **API**
2. Copy these values:
   - **Project URL:** `https://xxxxx.supabase.co`
   - **anon/public key:** `eyJhbG...` (long string)

**⚠️ IMPORTANT:** 
- Use `anon` key, NOT `service_role` key
- `service_role` bypasses security - never expose it!

#### Step 4: Run Database Schema

1. Go to **SQL Editor** (database icon)
2. Click **"New Query"**
3. Open file: `supabase-schema.sql` from your project
4. Copy entire content
5. Paste into SQL Editor
6. Click **"Run"** (or Ctrl+Enter)
7. Wait for success message

**Verify:**
- Check **Table Editor** - you should see all tables created
- Tables: `products`, `orders`, `customers`, `employees`, etc.

#### Step 5: Create Storage Bucket

1. Go to **Storage** (folder icon)
2. Click **"New Bucket"**
3. Configure:
   - **Name:** `pos-files`
   - **Public bucket:** ❌ **Unchecked** (private)
   - **File size limit:** `10 MB`
   - **Allowed MIME types:** 
     ```
     image/jpeg, image/png, image/gif, image/webp, application/pdf
     ```
4. Click **"Create bucket"**

#### Step 6: Create Admin User

1. Go to **Authentication** (user icon) → **Users**
2. Click **"Add user"** → **"Create new user"**
3. Enter:
   - **Email:** `admin@yourcompany.com`
   - **Password:** `Admin@123456` (change later!)
   - **Email verified:** ✅ **Checked**
4. Click **"Create user"**

#### Step 7: Create Admin Profile

1. Go to **SQL Editor**
2. Run this query:

```sql
INSERT INTO profiles (id, email, full_name, role)
SELECT 
  id, 
  email, 
  'System Administrator', 
  'super_admin'
FROM auth.users 
WHERE email = 'admin@yourcompany.com'
ON CONFLICT (id) DO NOTHING;
```

3. Verify in **Table Editor** → `profiles` table

---

### Phase 2: Configure Frontend (5 minutes)

#### Step 8: Create .env.local File

1. In your project root, create file: `.env.local`
2. Add:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. Save file

#### Step 9: Test Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

4. Open: `http://localhost:3000`
5. Try logging in with admin credentials
6. Test creating products, orders, etc.

---

### Phase 3: Deploy to Vercel (5 minutes)

#### Step 10: Create Vercel Account

1. Go to: **https://vercel.com**
2. Click **"Sign Up"** → Use **GitHub** account
3. Complete registration

#### Step 11: Import Repository

1. Dashboard → **"Add New..."** → **"Project"**
2. Import your GitHub repository: `Factssolution/POS`
3. Vercel auto-detects Vite framework

#### Step 12: Configure Build Settings

Vercel will auto-configure:
- **Framework Preset:** Vite ✅
- **Build Command:** `npm run build` ✅
- **Output Directory:** `dist` ✅
- **Install Command:** `npm install` ✅

#### Step 13: Add Environment Variables

In Vercel project settings → **Environment Variables**:

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Click **"Add"** for each variable.

#### Step 14: Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for build
3. Vercel will provide URL: `https://pos-system-xxxx.vercel.app`

#### Step 15: Add Custom Domain (Optional)

1. Go to **Project Settings** → **Domains**
2. Add: `possystem.gt.tc`
3. Update DNS at your registrar:
   ```
   Type: CNAME
   Name: @ or www
   Value: cname.vercel-dns.com
   ```

---

## 🎉 Your POS is LIVE!

### Access Points:

| Service | URL |
|---------|-----|
| **Frontend** | `https://pos-system-xxxx.vercel.app` |
| **Supabase Dashboard** | `https://app.supabase.com` |
| **Database** | Managed by Supabase |
| **Storage** | Managed by Supabase |

### Login Credentials:
- **Email:** `admin@yourcompany.com`
- **Password:** `Admin@123456` (change immediately!)

---

## 🔄 Auto-Deploy Workflow

### Every Time You Push to GitHub:

```
git add .
git commit -m "Update feature"
git push
```

**Vercel automatically:**
1. Detects new commit
2. Builds project
3. Deploys to production
4. Zero downtime!

---

## 📊 Supabase Dashboard Features

### What You Get:

| Feature | Location | Purpose |
|---------|----------|---------|
| **Table Editor** | Database | View/edit data visually |
| **SQL Editor** | Database | Run custom queries |
| **Authentication** | Auth | Manage users |
| **Storage** | Storage | Manage files |
| **Logs** | Logs | Monitor activity |
| **API Docs** | API | Auto-generated docs |

---

## 🛡️ Security Best Practices

### ✅ DO:
- Use `anon` key in frontend (NOT `service_role`)
- Enable Row Level Security (RLS)
- Use strong passwords
- Enable email verification
- Regular database backups (automatic)

### ❌ DON'T:
- Commit `.env.local` to Git
- Share `service_role` key
- Disable RLS policies
- Use weak passwords
- Store sensitive data in localStorage

---

## 💰 Cost Breakdown

### FREE Tier Includes:

| Resource | Supabase | Vercel |
|----------|----------|--------|
| **Database** | 500 MB | N/A |
| **Storage** | 1 GB | N/A |
| **Bandwidth** | 5 GB/month | 100 GB/month |
| **Users** | Unlimited | Unlimited |
| **API Requests** | Unlimited | Unlimited |
| **Build Minutes** | N/A | 6,000 min/month |

**Total Cost: $0/month** 🎉

---

## 🔧 Troubleshooting

### Frontend can't connect to Supabase:
```
1. Check VITE_SUPABASE_URL is correct
2. Verify VITE_SUPABASE_ANON_KEY (not service_role!)
3. Check browser console for errors
4. Ensure .env.local exists locally
5. Ensure env vars set in Vercel dashboard
```

### Database queries failing:
```
1. Check RLS policies in Supabase
2. Verify user is authenticated
3. Check SQL Editor for table structure
4. Test query manually in SQL Editor
```

### File upload not working:
```
1. Verify 'pos-files' bucket exists
2. Check bucket is private (not public)
3. Verify file type is allowed
4. Check file size < 10MB
5. Review Storage policies
```

### Login not working:
```
1. Check user exists in Auth > Users
2. Verify email is confirmed
3. Check password is correct
4. Review browser console for errors
5. Check auth policies in Supabase
```

---

## 📦 Backup & Restore

### Automatic Backups:
- Supabase creates daily backups (7 days retention on free tier)
- Go to **Settings** → **Database** → **Backups**

### Manual Backup:
```bash
# Using pg_dump (install PostgreSQL locally)
pg_dump -h db.xxxxx.supabase.co \
  -U postgres \
  -d postgres \
  -F c \
  -f backup.backup
```

### Restore from Backup:
```bash
pg_restore -h db.xxxxx.supabase.co \
  -U postgres \
  -d postgres \
  backup.backup
```

---

## 📈 Monitoring & Analytics

### Vercel Analytics:
1. Dashboard → **Analytics** tab
2. View page views, performance, errors

### Supabase Logs:
1. Dashboard → **Logs**
2. Filter by: API, Database, Auth, Storage

### Database Performance:
1. **SQL Editor** → Run:
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 🎯 Next Steps

### After Deployment:

1. **Change default password** immediately
2. **Add real users** via Authentication
3. **Import your data** from old system
4. **Test all features** thoroughly
5. **Set up custom domain**
6. **Configure email templates** (Supabase > Auth > Templates)
7. **Enable 2FA** for admin accounts
8. **Set up monitoring alerts**

---

## 📞 Support

- **Supabase Docs:** https://supabase.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **Supabase Discord:** https://discord.supabase.com
- **Email:** factssolution@gmail.com

---

## 📋 Quick Reference

### Important URLs:
- **Supabase Dashboard:** https://app.supabase.com
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Your Frontend:** https://pos-system-xxxx.vercel.app

### Important Files:
- `supabase-schema.sql` - Database schema
- `.env.example` - Environment template
- `src/services/supabase.ts` - Supabase client
- `vercel.json` - Vercel config

### Commands:
```bash
# Local development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

**🎉 Congratulations! Your POS system is now production-ready on Supabase + Vercel!**
