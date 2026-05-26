# POS System - Complete Backend API Documentation

## 📋 Table of Contents
1. [System Architecture](#system-architecture)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
4. [Data Models](#data-models)
5. [Workflow Diagrams](#workflow-diagrams)
6. [Implementation Guide](#implementation-guide)

---

## 🏗️ System Architecture

### Technology Stack
**Backend:**
- **Framework:** Node.js with Express.js
- **Database:** MySQL / PostgreSQL
- **ORM:** Sequelize / Prisma
- **Authentication:** JWT (JSON Web Tokens)
- **Validation:** Joi / Express-Validator
- **File Upload:** Multer (for product images)

**Additional Tools:**
- **CORS:** For cross-origin requests
- **Bcrypt:** Password hashing
- **Dotenv:** Environment variables
- **Morgan:** HTTP request logger

### Server Structure
```
backend/
├── server.js                 # Main entry point
├── config/
│   ├── database.js          # Database configuration
│   └── jwt.js               # JWT configuration
├── middleware/
│   ├── auth.js              # Authentication middleware
│   ├── validation.js        # Request validation
│   └── errorHandler.js      # Error handling
├── models/
│   ├── User.js
│   ├── Product.js
│   ├── Employee.js
│   ├── Supplier.js
│   ├── Transaction.js
│   ├── Order.js
│   └── Settings.js
├── controllers/
│   ├── authController.js
│   ├── productController.js
│   ├── employeeController.js
│   ├── supplierController.js
│   ├── transactionController.js
│   ├── orderController.js
│   ├── dashboardController.js
│   └── settingsController.js
├── routes/
│   ├── auth.js
│   ├── products.js
│   ├── employees.js
│   ├── suppliers.js
│   ├── transactions.js
│   ├── orders.js
│   ├── dashboard.js
│   └── settings.js
└── utils/
    ├── tokenGenerator.js
    ├── barcodeGenerator.js
    └── helpers.js
```

---

## 🗄️ Database Schema

### 1. Users Table
```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role ENUM('Admin', 'Manager', 'Cashier') DEFAULT 'Cashier',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
```

### 2. Products Table
```sql
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    cost_price DECIMAL(10, 2) NOT NULL,
    stock INT DEFAULT 0,
    min_stock INT DEFAULT 5,
    barcode VARCHAR(100) UNIQUE NOT NULL,
    image_url VARCHAR(500),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_status ON products(status);
```

### 3. Employees Table
```sql
CREATE TABLE employees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    user_id VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_employees_user_id ON employees(user_id);
CREATE INDEX idx_employees_status ON employees(status);
```

### 4. Suppliers Table
```sql
CREATE TABLE suppliers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    contact VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    gst_number VARCHAR(50),
    opening_balance DECIMAL(12, 2) DEFAULT 0,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_suppliers_status ON suppliers(status);
```

### 5. Transactions Table (Credit/Debit)
```sql
CREATE TABLE transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    supplier_id INT NOT NULL,
    type ENUM('credit', 'debit') NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    description TEXT,
    transaction_date DATE NOT NULL,
    transaction_time TIME NOT NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_transactions_supplier ON transactions(supplier_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_type ON transactions(type);
```

### 6. Orders Table
```sql
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    token_number INT NOT NULL,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    subtotal DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('cash', 'card', 'upi', 'other') DEFAULT 'cash',
    cashier_id INT,
    status ENUM('completed', 'pending', 'cancelled') DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cashier_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_orders_token ON orders(token_number);
CREATE INDEX idx_orders_date ON orders(created_at);
CREATE INDEX idx_orders_status ON orders(status);
```

### 7. Order Items Table
```sql
CREATE TABLE order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
```

### 8. Settings Table
```sql
CREATE TABLE settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Default Settings
INSERT INTO settings (setting_key, setting_value) VALUES
('company_name', 'Facts Solution Store'),
('company_phone', '+91 9876543210'),
('company_email', 'contact@factssolution.com'),
('company_address', '123 Business Street, City, State'),
('tax_rate', '18'),
('currency_symbol', 'Rs'),
('receipt_footer', 'Thank you for your business!'),
('receipt_static_footer', 'Powered by Factssolution, All Rights Reserved 2025-2026');
```

---

## 🔌 API Endpoints

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication Headers
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

---

## 📝 Authentication APIs

### 1. Login
**Endpoint:** `POST /auth/login`

**Request:**
```json
{
  "email": "admin@factssolution.com",
  "password": "admin123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "name": "Admin User",
      "email": "admin@factssolution.com",
      "role": "Admin",
      "phone": "+91 9876543210",
      "status": "active"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### 2. Logout
**Endpoint:** `POST /auth/logout`

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### 3. Verify Token
**Endpoint:** `GET /auth/verify`

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "Admin User",
      "email": "admin@factssolution.com",
      "role": "Admin"
    }
  }
}
```

---

## 📦 Product APIs

### 1. Get All Products
**Endpoint:** `GET /products`

**Query Parameters:**
- `status` (optional): "active" | "inactive"
- `category` (optional): Filter by category
- `search` (optional): Search by name or barcode
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": 1,
        "name": "Coffee",
        "description": "Premium arabica coffee",
        "category": "Beverages",
        "price": 120.00,
        "costPrice": 80.00,
        "stock": 50,
        "minStock": 10,
        "barcode": "CF001",
        "imageUrl": "https://cdn.example.com/products/coffee.jpg",
        "status": "active",
        "createdAt": "2025-01-15T10:00:00Z",
        "updatedAt": "2025-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 250,
      "itemsPerPage": 50
    }
  }
}
```

### 2. Get Product by ID
**Endpoint:** `GET /products/:id`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Coffee",
    "description": "Premium arabica coffee",
    "category": "Beverages",
    "price": 120.00,
    "costPrice": 80.00,
    "stock": 50,
    "minStock": 10,
    "barcode": "CF001",
    "imageUrl": "https://cdn.example.com/products/coffee.jpg",
    "status": "active"
  }
}
```

### 3. Create Product
**Endpoint:** `POST /products`

**Request (multipart/form-data):**
```json
{
  "name": "Coffee",
  "description": "Premium arabica coffee",
  "category": "Beverages",
  "price": 120.00,
  "costPrice": 80.00,
  "stock": 50,
  "minStock": 10,
  "barcode": "CF001",
  "status": "active",
  "image": <File>
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "id": 1,
    "name": "Coffee",
    "barcode": "CF001",
    "imageUrl": "https://cdn.example.com/products/coffee.jpg"
  }
}
```

### 4. Update Product
**Endpoint:** `PUT /products/:id`

**Request:**
```json
{
  "name": "Premium Coffee",
  "price": 150.00,
  "stock": 75
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    "id": 1,
    "name": "Premium Coffee",
    "price": 150.00,
    "stock": 75
  }
}
```

### 5. Delete Product
**Endpoint:** `DELETE /products/:id`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

### 6. Get Low Stock Products
**Endpoint:** `GET /products/low-stock`

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "name": "Burger",
      "stock": 3,
      "minStock": 5,
      "status": "active"
    }
  ]
}
```

---

## 👥 Employee APIs

### 1. Get All Employees
**Endpoint:** `GET /employees`

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "phone": "+91 9876543210",
      "email": "john@example.com",
      "userId": "john.doe",
      "role": "Cashier",
      "status": "active",
      "createdAt": "2025-01-15T10:00:00Z"
    }
  ]
}
```

### 2. Create Employee
**Endpoint:** `POST /employees`

**Request:**
```json
{
  "name": "John Doe",
  "phone": "+91 9876543210",
  "email": "john@example.com",
  "userId": "john.doe",
  "password": "password123",
  "role": "Cashier",
  "status": "active"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Employee created successfully",
  "data": {
    "id": 1,
    "name": "John Doe",
    "userId": "john.doe"
  }
}
```

### 3. Update Employee
**Endpoint:** `PUT /employees/:id`

**Request:**
```json
{
  "name": "John Smith",
  "status": "inactive"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Employee updated successfully"
}
```

### 4. Delete Employee
**Endpoint:** `DELETE /employees/:id`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Employee deleted successfully"
}
```

---

## 🚚 Supplier APIs

### 1. Get All Suppliers
**Endpoint:** `GET /suppliers`

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "ABC Food Supplies",
      "contact": "+91 9876543210",
      "email": "abc@example.com",
      "address": "123 Supply Street",
      "gstNumber": "29ABCDE1234F1Z5",
      "openingBalance": 50000.00,
      "currentBalance": 45000.00,
      "status": "active",
      "createdAt": "2025-01-15T10:00:00Z"
    }
  ]
}
```

### 2. Get Supplier by ID
**Endpoint:** `GET /suppliers/:id`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "ABC Food Supplies",
    "contact": "+91 9876543210",
    "email": "abc@example.com",
    "address": "123 Supply Street",
    "gstNumber": "29ABCDE1234F1Z5",
    "openingBalance": 50000.00,
    "currentBalance": 45000.00,
    "transactions": [
      {
        "id": 1,
        "type": "credit",
        "amount": 15000.00,
        "description": "Payment received",
        "date": "2025-01-20"
      }
    ],
    "status": "active"
  }
}
```

### 3. Create Supplier
**Endpoint:** `POST /suppliers`

**Request:**
```json
{
  "name": "ABC Food Supplies",
  "contact": "+91 9876543210",
  "email": "abc@example.com",
  "address": "123 Supply Street",
  "gstNumber": "29ABCDE1234F1Z5",
  "openingBalance": 50000.00,
  "status": "active"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Supplier created successfully",
  "data": {
    "id": 1,
    "name": "ABC Food Supplies"
  }
}
```

### 4. Update Supplier
**Endpoint:** `PUT /suppliers/:id`

**Request:**
```json
{
  "contact": "+91 9876543211",
  "address": "456 New Street"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Supplier updated successfully"
}
```

### 5. Delete Supplier
**Endpoint:** `DELETE /suppliers/:id`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Supplier deleted successfully"
}
```

---

## 💳 Transaction APIs (Credit/Debit)

### 1. Get All Transactions
**Endpoint:** `GET /transactions`

**Query Parameters:**
- `supplierId` (optional): Filter by supplier
- `type` (optional): "credit" | "debit"
- `startDate` (optional): Start date (YYYY-MM-DD)
- `endDate` (optional): End date (YYYY-MM-DD)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": 1,
        "supplierId": 1,
        "supplierName": "ABC Food Supplies",
        "type": "credit",
        "amount": 15000.00,
        "description": "Payment received for monthly supplies",
        "transactionDate": "2025-01-20",
        "transactionTime": "10:30 AM",
        "createdBy": {
          "id": 1,
          "name": "Admin User"
        },
        "createdAt": "2025-01-20T10:30:00Z"
      }
    ],
    "summary": {
      "totalCredit": 25000.00,
      "totalDebit": 10000.00,
      "netBalance": 15000.00
    }
  }
}
```

### 2. Create Transaction
**Endpoint:** `POST /transactions`

**Request:**
```json
{
  "supplierId": 1,
  "type": "credit",
  "amount": 15000.00,
  "description": "Payment received for monthly supplies"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Transaction added successfully",
  "data": {
    "id": 1,
    "supplierId": 1,
    "type": "credit",
    "amount": 15000.00,
    "transactionDate": "2025-01-20",
    "transactionTime": "10:30:00"
  }
}
```

### 3. Get Supplier Balance
**Endpoint:** `GET /transactions/supplier/:supplierId/balance`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "supplierId": 1,
    "supplierName": "ABC Food Supplies",
    "openingBalance": 50000.00,
    "totalCredit": 25000.00,
    "totalDebit": 10000.00,
    "netBalance": 15000.00,
    "currentBalance": 65000.00
  }
}
```

### 4. Delete Transaction
**Endpoint:** `DELETE /transactions/:id`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Transaction deleted successfully"
}
```

---

## 🛒 Order APIs (POS)

### 1. Get All Orders
**Endpoint:** `GET /orders`

**Query Parameters:**
- `status` (optional): "completed" | "pending" | "cancelled"
- `startDate` (optional): Start date
- `endDate` (optional): End date
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": 1,
        "tokenNumber": 1001,
        "customerName": "John Doe",
        "customerPhone": "+91 9876543210",
        "items": [
          {
            "id": 1,
            "productId": 1,
            "productName": "Coffee",
            "quantity": 2,
            "price": 120.00,
            "total": 240.00
          }
        ],
        "subtotal": 240.00,
        "taxAmount": 43.20,
        "totalAmount": 283.20,
        "paymentMethod": "cash",
        "cashier": {
          "id": 1,
          "name": "Admin User"
        },
        "status": "completed",
        "createdAt": "2025-01-20T14:30:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalItems": 500
    }
  }
}
```

### 2. Get Order by ID
**Endpoint:** `GET /orders/:id`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "tokenNumber": 1001,
    "customerName": "John Doe",
    "customerPhone": "+91 9876543210",
    "items": [
      {
        "productId": 1,
        "productName": "Coffee",
        "quantity": 2,
        "price": 120.00,
        "total": 240.00
      }
    ],
    "subtotal": 240.00,
    "taxAmount": 43.20,
    "totalAmount": 283.20,
    "paymentMethod": "cash",
    "status": "completed",
    "createdAt": "2025-01-20T14:30:00Z"
  }
}
```

### 3. Create Order (Checkout)
**Endpoint:** `POST /orders`

**Request:**
```json
{
  "items": [
    {
      "productId": 1,
      "quantity": 2
    },
    {
      "productId": 2,
      "quantity": 1
    }
  ],
  "customerName": "John Doe",
  "customerPhone": "+91 9876543210",
  "paymentMethod": "cash"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "orderId": 1,
    "tokenNumber": 1001,
    "totalAmount": 283.20,
    "items": [
      {
        "productName": "Coffee",
        "quantity": 2,
        "price": 120.00,
        "total": 240.00
      }
    ],
    "receipt": {
      "url": "https://api.example.com/receipts/1001.pdf"
    }
  }
}
```

### 4. Get Next Token Number
**Endpoint:** `GET /orders/next-token`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "nextToken": 1002
  }
}
```

### 5. Cancel Order
**Endpoint:** `PUT /orders/:id/cancel`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Order cancelled successfully"
}
```

---

## 📊 Dashboard APIs

### 1. Get Dashboard Stats
**Endpoint:** `GET /dashboard/stats`

**Query Parameters:**
- `period` (optional): "today" | "week" | "month" | "year"

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "sales": {
      "totalSales": 145231.50,
      "todaySales": 45231.00,
      "growth": 20.1
    },
    "orders": {
      "totalOrders": 1250,
      "todayOrders": 85,
      "growth": 15.3
    },
    "customers": {
      "totalCustomers": 2350,
      "newToday": 180,
      "growth": 8.3
    },
    "products": {
      "totalProducts": 250,
      "activeProducts": 235,
      "lowStockProducts": 12
    },
    "topProducts": [
      {
        "id": 1,
        "name": "Coffee",
        "totalSold": 450,
        "revenue": 54000.00
      }
    ],
    "recentOrders": [
      {
        "id": 1,
        "tokenNumber": 1001,
        "customerName": "John Doe",
        "total": 283.20,
        "time": "2 minutes ago"
      }
    ]
  }
}
```

### 2. Get Sales Chart Data
**Endpoint:** `GET /dashboard/sales-chart`

**Query Parameters:**
- `type`: "daily" | "hourly" | "monthly"
- `period` (optional): "week" | "month" | "year"

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "chartData": [
      {
        "label": "Mon",
        "sales": 2400.00,
        "orders": 35
      },
      {
        "label": "Tue",
        "sales": 1398.00,
        "orders": 28
      }
    ]
  }
}
```

### 3. Get Supplier Balances
**Endpoint:** `GET /dashboard/supplier-balances`

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "ABC Food Supplies",
      "contact": "+91 9876543210",
      "balance": 45000.00,
      "status": "active"
    }
  ]
}
```

---

## ⚙️ Settings APIs

### 1. Get All Settings
**Endpoint:** `GET /settings`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "company": {
      "name": "Facts Solution Store",
      "phone": "+91 9876543210",
      "email": "contact@factssolution.com",
      "address": "123 Business Street, City, State",
      "gst": "29ABCDE1234F1Z5"
    },
    "pos": {
      "taxRate": 18,
      "currencySymbol": "Rs",
      "receiptFooter": "Thank you for your business!",
      "receiptStaticFooter": "Powered by Factssolution, All Rights Reserved 2025-2026"
    }
  }
}
```

### 2. Update Settings
**Endpoint:** `PUT /settings`

**Request:**
```json
{
  "company": {
    "name": "Facts Solution Store",
    "phone": "+91 9876543210"
  },
  "pos": {
    "taxRate": 18,
    "currencySymbol": "Rs"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Settings updated successfully"
}
```

---

## 📈 Reports APIs

### 1. Get Sales Report
**Endpoint:** `GET /reports/sales`

**Query Parameters:**
- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)
- `groupBy` (optional): "day" | "week" | "month"

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalSales": 125000.00,
      "totalOrders": 450,
      "averageOrderValue": 277.78
    },
    "breakdown": [
      {
        "date": "2025-01-20",
        "sales": 15000.00,
        "orders": 65,
        "avgOrderValue": 230.77
      }
    ]
  }
}
```

### 2. Get Product Report
**Endpoint:** `GET /reports/products`

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Coffee",
      "category": "Beverages",
      "stock": 50,
      "totalSold": 450,
      "revenue": 54000.00,
      "profit": 18000.00
    }
  ]
}
```

### 3. Get Supplier Report
**Endpoint:** `GET /reports/suppliers`

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "ABC Food Supplies",
      "openingBalance": 50000.00,
      "totalCredit": 25000.00,
      "totalDebit": 10000.00,
      "currentBalance": 65000.00,
      "transactionCount": 15
    }
  ]
}
```

### 4. Get Employee Report
**Endpoint:** `GET /reports/employees`

**Query Parameters:**
- `startDate`: Start date
- `endDate`: End date

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "role": "Cashier",
      "totalOrders": 125,
      "totalSales": 35000.00,
      "averageOrderValue": 280.00
    }
  ]
}
```

---

## 🔄 Workflow Diagrams

### Complete Order Flow
```
1. Customer comes to counter
   ↓
2. Cashier adds products to cart (GET /products)
   ↓
3. Customer provides details (optional)
   ↓
4. Cashier selects payment method
   ↓
5. Checkout (POST /orders)
   ↓
6. System:
   - Creates order record
   - Updates product stock
   - Generates token number
   - Creates receipt
   ↓
7. Receipt printed
   ↓
8. Transaction complete
```

### Credit/Debit Flow
```
1. Select Supplier (GET /suppliers)
   ↓
2. Choose transaction type (Credit/Debit)
   ↓
3. Enter amount and description
   ↓
4. Submit transaction (POST /transactions)
   ↓
5. System:
   - Creates transaction record
   - Updates supplier balance
   - Updates dashboard stats
   ↓
6. Confirmation displayed
```

### Product Management Flow
```
1. Add New Product (POST /products)
   ↓
2. Upload product image
   ↓
3. Set price, stock, barcode
   ↓
4. System validates barcode uniqueness
   ↓
5. Product saved to database
   ↓
6. Available in POS system
```

---

## 🚀 Implementation Guide

### Step 1: Setup Node.js Backend

```bash
# Initialize project
mkdir pos-backend
cd pos-backend
npm init -y

# Install dependencies
npm install express mysql2 sequelize bcryptjs jsonwebtoken cors dotenv morgan multer joi express-validator

# Install dev dependencies
npm install --save-dev nodemon
```

### Step 2: Create .env File
```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=pos_system
DB_USER=root
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_secret_key_here_change_in_production
JWT_EXPIRE=7d

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads/products

# CORS
CORS_ORIGIN=http://localhost:3000
```

### Step 3: Database Connection (config/database.js)
```javascript
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

module.exports = sequelize;
```

### Step 4: Authentication Middleware (middleware/auth.js)
```javascript
const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

const roleAuth = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    next();
  };
};

module.exports = { auth, roleAuth };
```

### Step 5: Main Server File (server.js)
```javascript
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const sequelize = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const employeeRoutes = require('./routes/employees');
const supplierRoutes = require('./routes/suppliers');
const transactionRoutes = require('./routes/transactions');
const orderRoutes = require('./routes/orders');
const dashboardRoutes = require('./routes/dashboard');
const settingsRoutes = require('./routes/settings');

const app = express();

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Static files
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/suppliers', supplierRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/settings', settingsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// Database connection and server start
const PORT = process.env.PORT || 5000;

sequelize.authenticate()
  .then(() => {
    console.log('✅ Database connected');
    return sequelize.sync();
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err);
  });
```

### Step 6: Package.json Scripts
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "db:migrate": "node scripts/migrate.js",
    "db:seed": "node scripts/seed.js"
  }
}
```

---

## 🔐 Security Best Practices

1. **Password Hashing:** Always use bcrypt for password hashing
2. **JWT Tokens:** Set appropriate expiration times
3. **Input Validation:** Validate all inputs using Joi/Express-Validator
4. **SQL Injection:** Use parameterized queries (Sequelize ORM handles this)
5. **CORS:** Configure CORS properly for production
6. **Rate Limiting:** Implement rate limiting for API endpoints
7. **HTTPS:** Always use HTTPS in production
8. **Environment Variables:** Never commit .env files

---

## 📝 Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Access denied |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate entry |
| 500 | Internal Server Error | Server error |

---

## 🎯 Next Steps

1. Create all model files (User.js, Product.js, etc.)
2. Implement all controllers
3. Set up routes
4. Add validation middleware
5. Implement file upload for product images
6. Create database migration scripts
7. Add seed data for testing
8. Implement comprehensive error handling
9. Add unit tests
10. Deploy to production server

---

**End of Documentation**

© 2025-2026 Factssolution - All Rights Reserved
