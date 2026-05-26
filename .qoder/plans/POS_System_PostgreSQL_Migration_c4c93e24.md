# POS System PostgreSQL Migration & Complete Backend Setup

## Phase 1: Database Migration (MySQL → PostgreSQL)

### 1.1 Update Database Configuration
**File:** `d:\POS Business Dashboard ZAYQA\src\backend\config\database.js`
- Change `dialect: 'mysql'` to `dialect: 'postgres'`
- Update default port from `3306` to `5432`
- Update default database name from `pos_system` to `pos`

### 1.2 Update Backend Dependencies
**File:** `d:\POS Business Dashboard ZAYQA\src\backend\package.json`
- Replace `mysql2` with `pg` and `pg-hstore`
- Run `npm install` in backend directory

### 1.3 Create PostgreSQL Database
Execute SQL command to create the database:
```sql
CREATE DATABASE pos;
```

### 1.4 Create Database Migration Script
**New File:** `d:\POS Business Dashboard ZAYQA\src\backend\scripts\migrate.js`
- Create all 8 tables with PostgreSQL-specific syntax:
  - `users` - Replace ENUM with CHECK constraints, use SERIAL for auto-increment
  - `products` - PostgreSQL DECIMAL and CHECK constraints
  - `employees` - UNIQUE constraints and CHECK for status
  - `suppliers` - Standard PostgreSQL types
  - `transactions` - Foreign keys with ON DELETE CASCADE/SET NULL
  - `orders` - Foreign key to users table
  - `order_items` - Foreign keys to orders and products
  - `settings` - UNIQUE constraint on setting_key
- Create all indexes as defined in API documentation
- Insert default settings data (company_name, tax_rate, currency_symbol, etc.)

Key PostgreSQL differences from MySQL:
- `AUTO_INCREMENT` → `SERIAL` or `GENERATED ALWAYS AS IDENTITY`
- `ENUM` type → `CHECK (column IN ('value1', 'value2'))`
- Timestamps: `CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` → Use triggers or handle in Sequelize
- Boolean logic and string concatenation syntax differences

## Phase 2: Create Missing Backend Files

### 2.1 Environment Configuration
**New File:** `d:\POS Business Dashboard ZAYQA\src\backend\.env`
```
PORT=5000
DB_NAME=pos
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=7d
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### 2.2 JWT Configuration
**New File:** `d:\POS Business Dashboard ZAYQA\src\backend\config\jwt.js`
```javascript
module.exports = {
  secret: process.env.JWT_SECRET || 'default_secret',
  expire: process.env.JWT_EXPIRE || '7d'
};
```

### 2.3 Create All Route Files

**New File:** `d:\POS Business Dashboard ZAYQA\src\backend\routes\auth.js`
- POST `/login` - Authenticate user and return JWT
- POST `/logout` - Invalidate token (client-side)
- GET `/verify` - Verify JWT token validity

**New File:** `d:\POS Business Dashboard ZAYQA\src\backend\routes\products.js`
- GET `/` - List products with pagination, filtering, search
- GET `/:id` - Get single product
- POST `/` - Create product with image upload
- PUT `/:id` - Update product
- DELETE `/:id` - Delete product

**New File:** `d:\POS Business Dashboard ZAYQA\src\backend\routes\employees.js`
- GET `/` - List all employees
- GET `/:id` - Get employee by ID
- POST `/` - Create employee
- PUT `/:id` - Update employee
- DELETE `/:id` - Delete employee

**New File:** `d:\POS Business Dashboard ZAYQA\src\backend\routes\suppliers.js`
- GET `/` - List all suppliers
- GET `/:id` - Get supplier with transactions
- POST `/` - Create supplier
- PUT `/:id` - Update supplier
- DELETE `/:id` - Delete supplier

**New File:** `d:\POS Business Dashboard ZAYQA\src\backend\routes\transactions.js`
- GET `/` - List transactions with filters
- POST `/` - Create transaction
- GET `/supplier/:supplierId/balance` - Get supplier balance
- DELETE `/:id` - Delete transaction

**New File:** `d:\POS Business Dashboard ZAYQA\src\backend\routes\orders.js`
- GET `/` - List orders with pagination
- GET `/:id` - Get order with items
- POST `/create` - Create order with items (atomic transaction)
- PUT `/:id/status` - Update order status
- DELETE `/:id` - Cancel order

**New File:** `d:\POS Business Dashboard ZAYQA\src\backend\routes\dashboard.js`
- GET `/stats` - Get dashboard statistics
- GET `/sales` - Get sales analytics
- GET `/low-stock` - Get low stock products

**New File:** `d:\POS Business Dashboard ZAYQA\src\backend\routes\settings.js`
- GET `/` - Get all settings
- PUT `/` - Update settings
- GET `/:key` - Get specific setting

**New File:** `d:\POS Business Dashboard ZAYQA\src\backend\routes\reports.js`
- GET `/sales` - Sales report
- GET `/inventory` - Inventory report
- GET `/transactions` - Transaction report

### 2.4 Create All Missing Controllers

**New File:** `d:\POS Business Dashboard ZAYQA\src\backend\controllers\employeeController.js`
- Implement CRUD operations using Employee model
- Check for duplicate user_id before create/update

**New File:** `d:\POS Business Dashboard ZAYQA\src\backend\controllers\supplierController.js`
- CRUD operations with transaction balance calculation
- Include recent transactions in get by ID

**New File:** `d:\POS Business Dashboard ZAYQA\src\backend\controllers\transactionController.js`
- Create/list transactions with supplier balance calculation
- Filter by supplier_id, type, date range

**New File:** `d:\POS Business Dashboard ZAYQA\src\backend\controllers\orderController.js`
- Create order with order items (use Sequelize transaction for atomicity)
- Auto-decrement product stock on order creation
- Auto-generate token_number
- Include order items in response

**New File:** `d:\POS Business Dashboard ZAYQA\src\backend\controllers\dashboardController.js`
- Calculate today's sales, total orders, revenue
- Get low stock products (stock <= min_stock)
- Sales analytics with date filtering

**New File:** `d:\POS Business Dashboard ZAYQA\src\backend\controllers\settingsController.js`
- Get/update key-value settings
- Parse numeric values (tax_rate) properly

**New File:** `d:\POS Business Dashboard ZAYQA\src\backend\controllers\reportsController.js`
- Generate sales reports with date range
- Inventory status reports
- Transaction summaries

## Phase 3: Create Database Seeder

**New File:** `d:\POS Business Dashboard ZAYQA\src\backend\scripts\seed.js`
- Create default admin user: `admin@factssolution.com` / `admin123`
- Insert default settings (company info, tax rate, currency)
- Sample products for testing
- Sample supplier for testing

## Phase 4: Model Adjustments for PostgreSQL

### 4.1 Update ENUM Types
PostgreSQL doesn't support ENUM natively in Sequelize the same way as MySQL. Update all models:
- `User.js` - role and status fields
- `Product.js` - status field
- `Employee.js` - status field
- `Supplier.js` - status field
- `Transaction.js` - type field
- `Order.js` - payment_method and status fields

Change from:
```javascript
type: DataTypes.ENUM('Admin', 'Manager', 'Cashier')
```
To:
```javascript
type: DataTypes.STRING,
validate: {
  isIn: [['Admin', 'Manager', 'Cashier']]
}
```

### 4.2 Verify All Model Associations
Ensure all foreign keys and associations work correctly with PostgreSQL:
- `Order` → `User` (cashier_id)
- `OrderItem` → `Order` and `Product`
- `Transaction` → `Supplier` and `User`

## Phase 5: Start Servers

### 5.1 Install Backend Dependencies
```bash
cd "d:\POS Business Dashboard ZAYQA\src\backend"
npm install
```

### 5.2 Run Database Migration
```bash
npm run db:migrate
```

### 5.3 Seed Initial Data
```bash
npm run db:seed
```

### 5.4 Start Backend Server
```bash
npm run dev
```
Expected: Server running on port 5000, database connected successfully

### 5.5 Start Frontend Server
```bash
cd "d:\POS Business Dashboard ZAYQA"
npm install  # if not already installed
npm run dev
```
Expected: Vite dev server running on http://localhost:3000

## Phase 6: Verification

### 6.1 Health Check
Test: `GET http://localhost:5000/health`
Expected: `{"status": "OK", "message": "POS System API is running"}`

### 6.2 Test Authentication
Test: `POST http://localhost:5000/api/v1/auth/login`
```json
{
  "email": "admin@factssolution.com",
  "password": "admin123"
}
```
Expected: JWT token returned

### 6.3 Verify Database
Check PostgreSQL database `pos` contains all 8 tables with correct schema and seed data.

## Execution Order
1. Update database config and dependencies (Steps 1.1-1.2)
2. Create PostgreSQL database (Step 1.3)
3. Create migration script (Step 1.4)
4. Create .env and jwt config (Steps 2.1-2.2)
5. Update models for PostgreSQL compatibility (Phase 4)
6. Create all route files (Step 2.3)
7. Create all controller files (Step 2.4)
8. Create seeder script (Phase 3)
9. Install dependencies (Step 5.1)
10. Run migration (Step 5.2)
11. Seed data (Step 5.3)
12. Start backend (Step 5.4)
13. Start frontend (Step 5.5)
14. Verify setup (Phase 6)

## Risk Mitigation
- **Sequelize sync vs raw SQL**: Use raw SQL migration script for full control over PostgreSQL-specific syntax, then use Sequelize for ORM operations
- **ENUM compatibility**: Use STRING with validation instead of ENUM for better PostgreSQL compatibility
- **Foreign key constraints**: Ensure tables are created in correct dependency order (users → products → orders → order_items)
- **Timestamp handling**: PostgreSQL uses `TIMESTAMP` without auto-update; handle `updated_at` in Sequelize hooks
