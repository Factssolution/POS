# POS SYSTEM - PRODUCTION BUILD

Complete Point of Sale system with licensing, user management, and business analytics.

---

## 📋 SYSTEM REQUIREMENTS

- **Node.js**: v18.0 or higher
- **npm**: v9.0 or higher
- **PostgreSQL**: v17.0 or higher
- **Windows**: Windows 10/11 or Windows Server 2019+

---

## 🚀 QUICK START GUIDE

### Step 1: Install Dependencies
```batch
01-Install-Dependencies.bat
```
This will:
- Check Node.js installation
- Install all backend packages
- Install all frontend packages

### Step 2: Setup Database
```batch
02-Setup-Database.bat
```
This will:
- Create PostgreSQL database 'pos'
- Setup complete schema (12 tables)
- Create indexes and constraints
- Initialize default settings
- Create default users

### Step 3: Start Servers
```batch
03-Start-Servers.bat
```
This will:
- Start backend server (Port 5000)
- Start frontend server (Port 5173)
- Open in browser: http://localhost:5173

---

## 🔐 DEFAULT LOGIN CREDENTIALS

### Super Admin
- **Email**: factsolution@gmail.com
- **Password**: Black@786##
- **Access**: Full system access, license management

### Admin
- **Email**: admin@factssolution.com
- **Password**: Test@123
- **Access**: All features except license management

---

## 📊 DATABASE SCHEMA

### Tables Created:
1. **users** - System users with roles and permissions
2. **products** - Product inventory management
3. **categories** - Product categories
4. **suppliers** - Supplier information
5. **orders** - Customer orders with token system
6. **order_items** - Order line items
7. **transactions** - Financial transactions
8. **expenses** - Business expenses tracking
9. **employees** - Employee management
10. **settings** - System configuration
11. **licenses** - License management
12. **audit_logs** - System activity logging

---

## ⚙️ DEFAULT SYSTEM SETTINGS

| Setting | Value |
|---------|-------|
| Trial Period | 45 days |
| Monthly License | Rs 5,000 |
| Yearly License | Rs 50,000 |
| Lifetime License | Rs 150,000 |
| Currency | PKR |
| Default Tax Rate | 0% |
| Low Stock Threshold | 10 items |

---

## 🔧 CONFIGURATION

### Backend (.env file)
Located in `src/backend/.env`:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pos
DB_USER=postgres
DB_PASSWORD=Black@786##
JWT_SECRET=your-secret-key-here
```

### Frontend
No configuration needed. Automatically connects to backend at localhost:5000.

---

## 📁 FOLDER STRUCTURE

```
POS-Production-Build/
├── 01-Install-Dependencies.bat    # Install all packages
├── 02-Setup-Database.bat          # Database setup
├── 03-Start-Servers.bat           # Start application
├── database-schema.sql            # Complete SQL schema
├── setup-database.js              # Database setup script
├── package.json                   # Setup dependencies
└── README.md                      # This file

src/
├── backend/
│   ├── controllers/               # API controllers
│   ├── models/                    # Database models
│   ├── routes/                    # API routes
│   ├── middleware/                # Auth & validation
│   ├── config/                    # Database config
│   ├── utils/                     # Helper functions
│   └── server.js                  # Backend entry point
│
├── components/                    # React components
├── services/                      # API service layer
├── styles/                        # Global styles
├── utils/                         # Frontend utilities
├── App.tsx                        # Main app component
└── main.tsx                       # Frontend entry point
```

---

## 🎯 FEATURES

### Core Features
- ✅ Point of Sale (POS) system
- ✅ Token-based order management
- ✅ Product inventory management
- ✅ Supplier management
- ✅ Employee management
- ✅ Expense tracking
- ✅ Credit/Debit management
- ✅ Comprehensive reporting

### Licensing System
- ✅ 45-day free trial
- ✅ License key generation (FACTS-XXXX-XXXX-XXXX)
- ✅ License activation and validation
- ✅ Automatic user blocking on expiry
- ✅ Super Admin bypass
- ✅ Device tracking
- ✅ Pricing management

### User Management
- ✅ Role-based access control (RBAC)
- ✅ Super Admin, Admin, Manager, Cashier roles
- ✅ User activation/deactivation
- ✅ Password reset functionality
- ✅ Audit logging

### Security
- ✅ JWT authentication
- ✅ Password hashing (bcrypt)
- ✅ License validation middleware
- ✅ Rate limiting
- ✅ Input validation
- ✅ SQL injection protection

---

## 🐛 TROUBLESHOOTING

### PostgreSQL Connection Error
1. Check if PostgreSQL is running
2. Verify password is correct (Black@786##)
3. Ensure PostgreSQL is in system PATH

### Port Already in Use
1. Run `03-Start-Servers.bat` again (it kills existing processes)
2. Or manually kill Node.js processes in Task Manager

### Dependencies Not Installing
1. Check internet connection
2. Run Command Prompt as Administrator
3. Clear npm cache: `npm cache clean --force`

### Database Setup Fails
1. Ensure PostgreSQL service is running
2. Check if you have admin privileges
3. Verify password matches configuration

---

## 📞 SUPPORT

For issues or questions:
- Check troubleshooting section above
- Review console logs in terminal windows
- Check browser console (F12) for frontend errors

---

## 📄 LICENSE

This system includes a built-in licensing mechanism for commercial deployment.

---

## 🎓 USER GUIDE

### First Login
1. Run all 3 batch files in order
2. Open browser: http://localhost:5173
3. Login with Super Admin credentials
4. Navigate to Settings → License to activate license
5. Start using the system!

### Daily Operations
- **Cashier**: Use POS screen for billing
- **Manager**: View reports and analytics
- **Admin**: Manage users, products, settings
- **Super Admin**: Full system control + license management

---

**Version**: 1.0.0  
**Build Date**: May 2026  
**Status**: Production Ready ✅
