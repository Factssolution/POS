# RBAC (Role-Based Access Control) System

## User Roles & Permissions

### 🔴 Admin (Full Access)
- ✅ View/Create/Edit/Delete Products
- ✅ View/Create/Edit/Delete Suppliers
- ✅ View/Create/Edit/Delete Employees
- ✅ View/Create/Edit/Delete Transactions
- ✅ View/Create/Edit/Delete Orders
- ✅ View All Reports
- ✅ Manage Settings
- ✅ View Dashboard

### 🟡 Manager (Management Access)
- ✅ View/Create/Edit/Delete Products
- ✅ View/Create/Edit/Delete Suppliers
- ✅ View/Create/Edit Employees
- ✅ View/Create/Edit/Delete Transactions
- ✅ View/Create/Edit Orders
- ✅ View All Reports
- ✅ View Settings (read-only)
- ✅ View Dashboard

### 🔵 Cashier (POS Operations Only)
- ✅ View Products (read-only)
- ✅ Create Orders (POS transactions)
- ✅ View Own Orders
- ✅ View Dashboard (limited)
- ❌ Cannot delete products
- ❌ Cannot delete suppliers
- ❌ Cannot manage employees
- ❌ Cannot access settings

---

## 403 Forbidden Error Fix

### Problem
Getting `403 Forbidden` when trying to delete products:
```
DELETE http://localhost:5000/api/v1/products/11 403 (Forbidden)
```

### Root Cause
Your logged-in user has the **Cashier** role, which doesn't have permission to delete products.

### Solution

#### Step 1: Check Your Current User Role
Run this script:
```bash
cd "d:\POS Business Dashboard ZAYQA\src\backend"
node scripts/check-user-roles.js
```

#### Step 2: Upgrade User to Admin (if needed)
```bash
node scripts/upgrade-user-to-admin.js your-email@example.com
```

Example:
```bash
node scripts/upgrade-user-to-admin.js admin@factssolution.com
```

#### Step 3: Re-login (CRITICAL!)
After upgrading the role:
1. **Logout** from the frontend application
2. **Clear browser localStorage** (optional but recommended)
3. **Login again** with the same credentials
4. The new JWT token will include the updated Admin role

---

## API Endpoint Permissions

| Endpoint | Admin | Manager | Cashier |
|----------|-------|---------|---------|
| **Products** |
| GET /products | ✅ | ✅ | ✅ |
| POST /products | ✅ | ✅ | ❌ |
| PUT /products/:id | ✅ | ✅ | ❌ |
| DELETE /products/:id | ✅ | ✅ | ❌ |
| **Suppliers** |
| GET /suppliers | ✅ | ✅ | ✅ |
| POST /suppliers | ✅ | ✅ | ❌ |
| PUT /suppliers/:id | ✅ | ✅ | ❌ |
| DELETE /suppliers/:id | ✅ | ✅ | ❌ |
| **Employees** |
| GET /employees | ✅ | ✅ | ❌ |
| POST /employees | ✅ | ✅ | ❌ |
| PUT /employees/:id | ✅ | ✅ | ❌ |
| DELETE /employees/:id | ✅ | ✅ | ❌ |
| **Transactions** |
| GET /transactions | ✅ | ✅ | ✅ |
| POST /transactions | ✅ | ✅ | ❌ |
| DELETE /transactions/:id | ✅ | ✅ | ❌ |
| **Orders** |
| GET /orders | ✅ | ✅ | ✅ |
| POST /orders/create | ✅ | ✅ | ✅ |
| PUT /orders/:id/status | ✅ | ✅ | ❌ |
| DELETE /orders/:id | ✅ | ✅ | ❌ |
| **Reports** |
| GET /reports/* | ✅ | ✅ | ✅ |
| **Settings** |
| GET /settings | ✅ | ✅ | ❌ |
| PUT /settings | ✅ | ❌ | ❌ |
| **Dashboard** |
| GET /dashboard/* | ✅ | ✅ | ✅ |

---

## Debugging 403 Errors

### Backend Logs
After the fix, backend will log detailed authorization checks:
```javascript
Authorization check: {
  userRole: 'admin',
  normalizedUserRole: 'Admin',
  allowedRoles: [ 'Admin', 'Manager' ],
  userId: 1,
  userEmail: 'admin@factssolution.com'
}
```

### Frontend Console
Frontend will log API errors with details:
```javascript
API Error: {
  status: 403,
  message: 'Access denied. Only Admin, Manager(s) can access this resource. Your role: Cashier',
  endpoint: '/products/11',
  method: 'DELETE',
  hasToken: true
}
```

---

## Common Issues

### Issue 1: "I upgraded to Admin but still getting 403"
**Solution**: You MUST logout and login again! JWT tokens are generated at login time and contain the role. Old tokens still have the old role.

### Issue 2: "I don't have any Admin users"
**Solution**: Run the upgrade script on any user to make them Admin:
```bash
node scripts/upgrade-user-to-admin.js your-email@example.com
```

### Issue 3: "Token is invalid or expired"
**Solution**: 
1. Logout
2. Clear localStorage: `localStorage.clear()`
3. Login again

---

## Security Notes

- All passwords are hashed with bcrypt (10 rounds)
- JWT tokens expire after 24 hours
- Role validation is case-insensitive and trims whitespace
- Inactive users are blocked from all access (403)
- All protected routes require valid JWT token
