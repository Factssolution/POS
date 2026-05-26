// Real API service for POS system - Connected to Backend
const API_BASE_URL = 'http://localhost:5000/api/v1';

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('pos_auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

// Generic API call handler
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Check if body is FormData to handle headers correctly
  const isFormData = options.body instanceof FormData;
  
  // Get auth headers and remove Content-Type for FormData
  const { 'Content-Type': _, ...authHeadersWithoutContentType } = getAuthHeaders();
  const authHeaders = isFormData ? authHeadersWithoutContentType : getAuthHeaders();
  
  const config: RequestInit = {
    ...options,
    headers: {
      ...authHeaders,
      ...options.headers
    }
  };

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    const errorMessage = data.message || `API request failed with status ${response.status}`;
    console.error(`API Error [${response.status}]:`, errorMessage);
    throw new Error(errorMessage);
  }

  return data;
};

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Cashier' | 'Super Admin';
  phone?: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  category: string;
  price: number;
  cost_price: number;
  stock: number;
  min_stock: number;
  barcode: string;
  image_url: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  status: 'active' | 'inactive';
  sort_order: number;
  product_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ProductResponse {
  products: Product[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface Supplier {
  id: number;
  name: string;
  contact: string;
  email: string | null;
  address: string | null;
  gst_number: string | null;
  opening_balance: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  currentBalance?: number;
}

export interface SupplierBalance {
  supplier_id: number;
  supplier_name: string;
  opening_balance: number;
  total_credit: number;
  total_debit: number;
  net_balance: number;
  current_balance: number;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
  product?: {
    id: number;
    name: string;
    barcode: string;
  };
}

export interface Order {
  id: number;
  token_number: number;
  customer_name: string | null;
  customer_phone: string | null;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  payment_method: 'cash' | 'card' | 'upi' | 'other';
  cashier_id: number | null;
  status: 'completed' | 'pending' | 'cancelled';
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  cashier?: {
    id: number;
    name: string;
  };
}

export interface OrderResponse {
  orders: Order[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface Transaction {
  id: number;
  supplier_id: number;
  type: 'credit' | 'debit';
  amount: number;
  description: string | null;
  transaction_date: string;
  transaction_time: string;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  supplier?: {
    id: number;
    name: string;
  };
  creator?: {
    id: number;
    name: string;
  };
}

export interface TransactionResponse {
  transactions: Transaction[];
  summary: {
    totalCredit: number;
    totalDebit: number;
    netBalance: number;
  };
}

export interface DashboardStats {
  today_orders: number;
  today_revenue: number;
  total_orders: number;
  total_revenue: number;
  total_products: number;
}

export interface SalesAnalytics {
  dailySales: {
    date: string;
    orders: number;
    revenue: number;
  }[];
  paymentBreakdown: {
    method: string;
    count: number;
    amount: number;
  }[];
}

export interface Employee {
  id: number;
  name: string;
  phone: string;
  email?: string;
  user_id: string;
  role: string;
  status: 'active' | 'inactive';
  created_at: string;
}

class APIService {
  // Authentication
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    console.log('🔐 API Login - Email:', email);
    console.log('🔐 API Login - Password length:', password.length);
    console.log('🔐 API Login - Sending to:', `${API_BASE_URL}/auth/login`);
    
    const response = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    console.log('✅ API Login Response:', response);
    
    const { user, token } = response.data;
    
    // Save with consistent keys that match App.tsx
    localStorage.setItem('pos_auth_token', token);
    localStorage.setItem('pos_user_data', JSON.stringify(user));
    
    return { user, token };
  }

  async logout(): Promise<void> {
    try {
      await apiCall('/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('pos_auth_token');
      localStorage.removeItem('pos_user_data');
    }
  }

  async verifyToken(): Promise<User> {
    const response = await apiCall('/auth/verify');
    return response.data.user;
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('pos_user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Products
  async getProducts(params?: { status?: string; category?: string; search?: string; page?: number; limit?: number }): Promise<ProductResponse> {
    const queryString = new URLSearchParams(params as any).toString();
    const response = await apiCall(`/products${queryString ? '?' + queryString : ''}`);
    return response.data;
  }

  async getCategories(): Promise<{ categories: Array<{id: number; name: string; description: string | null; color: string; icon: string}>; count: number }> {
    const response = await apiCall('/products/categories');
    return response.data;
  }

  // Category Management APIs
  async getCategoryList(params?: { status?: string; search?: string }): Promise<{ categories: Category[]; count: number }> {
    const queryString = new URLSearchParams(params as any).toString();
    const response = await apiCall(`/categories${queryString ? '?' + queryString : ''}`);
    return response.data;
  }

  async getCategoryById(id: number): Promise<Category> {
    const response = await apiCall(`/categories/${id}`);
    return response.data;
  }

  async createCategory(category: Omit<Category, 'id' | 'created_at' | 'updated_at' | 'product_count'>): Promise<Category> {
    const response = await apiCall('/categories', {
      method: 'POST',
      body: JSON.stringify(category)
    });
    return response.data;
  }

  async updateCategory(id: number, category: Partial<Category>): Promise<Category> {
    const response = await apiCall(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(category)
    });
    return response.data;
  }

  async deleteCategory(id: number): Promise<void> {
    await apiCall(`/categories/${id}`, { method: 'DELETE' });
  }

  async getCategoryStats(): Promise<{ stats: any[]; total_categories: number; active_categories: number }> {
    const response = await apiCall('/categories/stats');
    return response.data;
  }

  async getProductById(id: number): Promise<Product> {
    const response = await apiCall(`/products/${id}`);
    return response.data;
  }

  async createProduct(product: FormData | any): Promise<Product> {
    const isFormData = product instanceof FormData;
    const response = await apiCall('/products', {
      method: 'POST',
      body: isFormData ? product : JSON.stringify(product),
      headers: isFormData ? {} : undefined
    });
    return response.data;
  }

  async updateProduct(id: number, product: FormData | any): Promise<Product> {
    const isFormData = product instanceof FormData;
    const response = await apiCall(`/products/${id}`, {
      method: 'PUT',
      body: isFormData ? product : JSON.stringify(product),
      headers: isFormData ? {} : undefined
    });
    return response.data;
  }

  async deleteProduct(id: number): Promise<void> {
    await apiCall(`/products/${id}`, { method: 'DELETE' });
  }

  // Employees - Now using Users API
  async getEmployees(): Promise<{ employees: Employee[]; count: number }> {
    const response = await apiCall('/users');
    // Map users to employees format for compatibility
    const users = response.users || [];
    return {
      employees: users.map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone || '',
        role: u.role,
        status: u.status,
        created_at: u.createdAt || u.created_at
      })),
      count: response.count || users.length
    };
  }

  async getUserById(id: number): Promise<Employee> {
    const response = await apiCall(`/users/${id}`);
    return response.user;
  }

  async createEmployee(employee: Omit<Employee, 'id' | 'created_at'>): Promise<Employee> {
    const response = await apiCall('/users', {
      method: 'POST',
      body: JSON.stringify({
        name: employee.name,
        email: employee.email || `user${Date.now()}@example.com`,
        phone: employee.phone || '',
        password: 'Temp@123456',  // Default password
        role: employee.role || 'Cashier',
        status: employee.status || 'active'
      })
    });
    return response.user;
  }

  async updateEmployee(id: number, updates: Partial<Employee>): Promise<Employee> {
    const response = await apiCall(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    return response.user;
  }

  async deleteEmployee(id: number): Promise<void> {
    await apiCall(`/users/${id}`, { method: 'DELETE' });
  }

  async resetPassword(id: number, newPassword: string): Promise<void> {
    await apiCall(`/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword })
    });
  }

  async toggleUserStatus(id: number): Promise<{ status: string }> {
    const response = await apiCall(`/users/${id}/toggle-status`, {
      method: 'PATCH'
    });
    return response;
  }

  // Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    const response = await apiCall('/suppliers');
    return response.data;
  }

  async getSupplierById(id: number): Promise<Supplier> {
    const response = await apiCall(`/suppliers/${id}`);
    return response.data;
  }

  async createSupplier(supplier: Omit<Supplier, 'id' | 'created_at'>): Promise<Supplier> {
    const response = await apiCall('/suppliers', {
      method: 'POST',
      body: JSON.stringify(supplier)
    });
    return response.data;
  }

  async updateSupplier(id: number, updates: Partial<Supplier>): Promise<Supplier> {
    const response = await apiCall(`/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    return response.data;
  }

  async deleteSupplier(id: number): Promise<void> {
    await apiCall(`/suppliers/${id}`, { method: 'DELETE' });
  }

  // Transactions
  async getTransactions(params?: { supplier_id?: string; type?: string; startDate?: string; endDate?: string }): Promise<TransactionResponse> {
    const queryString = new URLSearchParams(params as any).toString();
    const response = await apiCall(`/transactions${queryString ? '?' + queryString : ''}`);
    return response.data;
  }

  async createTransaction(transaction: Partial<Transaction> & { supplier_id: number; type: 'credit' | 'debit'; amount: number; transaction_date: string; transaction_time: string }): Promise<Transaction> {
    const response = await apiCall('/transactions', {
      method: 'POST',
      body: JSON.stringify(transaction)
    });
    return response.data;
  }

  async getSupplierBalance(supplierId: number): Promise<SupplierBalance> {
    const response = await apiCall(`/transactions/supplier/${supplierId}/balance`);
    return response.data;
  }

  async deleteTransaction(id: number): Promise<void> {
    await apiCall(`/transactions/${id}`, { method: 'DELETE' });
  }

  // Orders
  async getOrders(params?: { status?: string; startDate?: string; endDate?: string; page?: number; limit?: number }): Promise<OrderResponse> {
    const queryString = new URLSearchParams(params as any).toString();
    const response = await apiCall(`/orders${queryString ? '?' + queryString : ''}`);
    return response.data;
  }

  async getOrderById(id: number): Promise<Order> {
    const response = await apiCall(`/orders/${id}`);
    return response.data;
  }

  async createOrder(order: { customer_name?: string; customer_phone?: string; payment_method: string; items: Array<{ product_id: number; quantity: number }> }): Promise<Order> {
    const response = await apiCall('/orders/create', {
      method: 'POST',
      body: JSON.stringify(order)
    });
    return response.data;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const response = await apiCall(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    return response.data;
  }

  async deleteOrder(id: number): Promise<void> {
    await apiCall(`/orders/${id}`, { method: 'DELETE' });
  }

  async getOrderReceipt(id: number): Promise<{ order: Order; settings: Record<string, any> }> {
    const response = await apiCall(`/orders/${id}/receipt`);
    return response.data;
  }

  // Dashboard (methods with query param support are at line 779+)
  async getLowStock(): Promise<{ products: Product[]; count: number }> {
    const response = await apiCall('/dashboard/low-stock');
    return response.data;
  }

  // Settings
  async getSettings(): Promise<Record<string, any>> {
    const response = await apiCall('/settings');
    return response.data;
  }

  async updateSettings(settings: Record<string, any>): Promise<void> {
    await apiCall('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  }

  async uploadCompanyLogo(file: File): Promise<{ logo_url: string }> {
    const formData = new FormData();
    formData.append('logo', file);
    
    const response = await apiCall('/settings/logo', {
      method: 'POST',
      body: formData
    });
    return response.data;
  }

  async getSettingByKey(key: string): Promise<{ key: string; value: any }> {
    const response = await apiCall(`/settings/${key}`);
    return response.data;
  }

  // Notification Settings
  async getNotificationSettings(): Promise<Record<string, any>> {
    const response = await apiCall('/settings');
    return response.data;
  }

  async updateNotificationSettings(settings: Record<string, any>): Promise<void> {
    await apiCall('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  }

  // Security Settings
  async getSecuritySettings(): Promise<Record<string, any>> {
    const response = await apiCall('/settings');
    return response.data;
  }

  async updateSecuritySettings(settings: Record<string, any>): Promise<void> {
    await apiCall('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  }

  // Backup Management
  async createBackup(options: {
    includeData?: boolean;
    includeStructure?: boolean;
    includeSettings?: boolean;
    includeProducts?: boolean;
    includeOrders?: boolean;
    includeEmployees?: boolean;
    includeSuppliers?: boolean;
    includeTransactions?: boolean;
    backupPath?: string;
  }): Promise<any> {
    const response = await apiCall('/settings/backups/create', {
      method: 'POST',
      body: JSON.stringify(options)
    });
    return response;
  }

  async listBackups(backupPath?: string): Promise<any> {
    const url = backupPath ? `/settings/backups?backupPath=${encodeURIComponent(backupPath)}` : '/settings/backups';
    const response = await apiCall(url);
    return response;
  }

  async restoreBackup(filename: string, backupPath?: string): Promise<any> {
    const response = await apiCall('/settings/backups/restore', {
      method: 'POST',
      body: JSON.stringify({ filename, backupPath })
    });
    return response;
  }

  async deleteBackup(filename: string, backupPath?: string): Promise<any> {
    const url = backupPath 
      ? `/settings/backups/${encodeURIComponent(filename)}?backupPath=${encodeURIComponent(backupPath)}`
      : `/settings/backups/${encodeURIComponent(filename)}`;
    const response = await apiCall(url, {
      method: 'DELETE'
    });
    return response;
  }

  async getBackupConfig(): Promise<any> {
    const response = await apiCall('/settings/backups/config');
    return response;
  }

  // Reports
  async getSalesReport(params?: { startDate?: string; endDate?: string }): Promise<any> {
    const queryString = new URLSearchParams(params as any).toString();
    const response = await apiCall(`/reports/sales${queryString ? '?' + queryString : ''}`);
    return response.data;
  }

  async getInventoryReport(params?: { category?: string; status?: string }): Promise<any> {
    const queryString = new URLSearchParams(params as any).toString();
    const response = await apiCall(`/reports/inventory${queryString ? '?' + queryString : ''}`);
    return response.data;
  }

  async getTransactionReport(params?: { supplier_id?: string; startDate?: string; endDate?: string }): Promise<any> {
    const queryString = new URLSearchParams(params as any).toString();
    const response = await apiCall(`/reports/transactions${queryString ? '?' + queryString : ''}`);
    return response.data;
  }

  // Customer Reports
  async getCustomerReport(params?: { startDate?: string; endDate?: string; search?: string }): Promise<any> {
    const queryString = new URLSearchParams(params as any).toString();
    const response = await apiCall(`/reports/customers${queryString ? '?' + queryString : ''}`);
    return response.data;
  }

  async getCustomerHistory(phone: string): Promise<any> {
    const response = await apiCall(`/reports/customers/${encodeURIComponent(phone)}`);
    return response.data;
  }

  // Supplier Reports
  async getSupplierReport(params?: { startDate?: string; endDate?: string; supplierIds?: string }): Promise<any> {
    const queryString = new URLSearchParams(params as any).toString();
    const url = `/reports/suppliers${queryString ? '?' + queryString : ''}`;
    
    console.log('🌐 API SERVICE - getSupplierReport called');
    console.log('🌐 API SERVICE - Input params:', params);
    console.log('🌐 API SERVICE - Query string:', queryString);
    console.log('🌐 API SERVICE - Full URL:', url);
    console.log(' API SERVICE - supplierIds in params:', params?.supplierIds);
    
    const response = await apiCall(url);
    
    console.log('🌐 API SERVICE - Response received');
    console.log('🌐 API SERVICE - Response suppliers count:', (response?.data?.suppliers || response?.suppliers || []).length);
    console.log('🌐 API SERVICE - Response suppliers:', (response?.data?.suppliers || response?.suppliers || []).map((s: any) => ({ id: s.id, name: s.name })));
    
    return response.data;
  }

  // Employee Reports
  async getEmployeeReport(params?: { startDate?: string; endDate?: string }): Promise<any> {
    const queryString = new URLSearchParams(params as any).toString();
    const response = await apiCall(`/reports/employees${queryString ? '?' + queryString : ''}`);
    return response.data;
  }

  // Expense Management
  async getExpenses(params?: {
    startDate?: string;
    endDate?: string;
    category?: string;
    status?: string;
    paymentMethod?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<any> {
    const queryString = new URLSearchParams(params as any).toString();
    const response = await apiCall(`/expenses${queryString ? '?' + queryString : ''}`);
    return response.data;
  }

  async getExpenseStats(params?: { startDate?: string; endDate?: string }): Promise<any> {
    const queryString = new URLSearchParams(params as any).toString();
    const response = await apiCall(`/expenses/stats${queryString ? '?' + queryString : ''}`);
    return response.data;
  }

  async getExpenseCategories(): Promise<any> {
    const response = await apiCall('/expenses/categories');
    return response.data;
  }

  async getExpenseById(id: number): Promise<any> {
    const response = await apiCall(`/expenses/${id}`);
    return response.data;
  }

  async createExpense(expense: {
    title: string;
    description?: string;
    amount: number;
    category: string;
    expense_date: string;
    expense_time: string;
    payment_method: string;
    receipt_number?: string;
    vendor_name?: string;
    supplier_id?: number;
    status?: string;
  }): Promise<any> {
    const response = await apiCall('/expenses', {
      method: 'POST',
      body: JSON.stringify(expense)
    });
    return response.data;
  }

  async updateExpense(id: number, expense: Partial<{
    title: string;
    description: string;
    amount: number;
    category: string;
    expense_date: string;
    expense_time: string;
    payment_method: string;
    receipt_number: string;
    vendor_name: string;
    supplier_id: number;
    status: string;
  }>): Promise<any> {
    const response = await apiCall(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(expense)
    });
    return response.data;
  }

  async deleteExpense(id: number): Promise<any> {
    const response = await apiCall(`/expenses/${id}`, {
      method: 'DELETE'
    });
    return response;
  }

  // Shop Hours & Token APIs
  async getShopHours(): Promise<any> {
    const response = await apiCall('/settings/shop-hours');
    return response.data;
  }

  async updateShopHours(shopHours: any): Promise<any> {
    const response = await apiCall('/settings/shop-hours', {
      method: 'PUT',
      body: JSON.stringify({ shop_hours: typeof shopHours === 'string' ? shopHours : JSON.stringify(shopHours) })
    });
    return response;
  }

  async getNextToken(): Promise<any> {
    const response = await apiCall('/orders/next-token');
    return response.data;
  }

  async getDashboardStats(queryParams: string = ''): Promise<any> {
    const endpoint = queryParams ? `/dashboard/stats?${queryParams}` : '/dashboard/stats';
    const response = await apiCall(endpoint);
    return response.data;
  }

  async getSalesAnalytics(params?: { startDate?: string; endDate?: string }): Promise<any> {
    const queryString = params ? new URLSearchParams(params as any).toString() : '';
    const endpoint = queryString ? `/dashboard/sales?${queryString}` : '/dashboard/sales';
    const response = await apiCall(endpoint);
    return response.data;
  }

  // License Management APIs (Super Admin only)
  async generateLicense(data: {
    client_email: string;
    client_name?: string;
    client_phone?: string;
    client_company?: string;
    plan_type?: 'monthly' | 'yearly' | 'lifetime';
    price?: number;
    payment_method?: string;
    notes?: string;
  }): Promise<any> {
    const response = await apiCall('/settings/license/generate', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response.data;
  }

  async activateLicense(license_key: string, client_email?: string): Promise<any> {
    const body: any = { license_key };
    if (client_email) {
      body.client_email = client_email;
    }
    
    const response = await apiCall('/settings/license/activate', {
      method: 'POST',
      body: JSON.stringify(body)
    });
    return response.data;
  }

  async getLicenseStatus(): Promise<any> {
    const response = await apiCall('/settings/license/status');
    return response.data; // This is correct - returns the data object
  }

  async getAllLicenses(params?: { page?: number; limit?: number; status?: string; search?: string }): Promise<any> {
    const queryString = params ? new URLSearchParams(params as any).toString() : '';
    const endpoint = queryString ? `/settings/license/all?${queryString}` : '/settings/license/all';
    const response = await apiCall(endpoint);
    return response; // Return full response {success, data, pagination}
  }

  async revokeLicense(licenseId: number): Promise<any> {
    const response = await apiCall(`/settings/license/revoke/${licenseId}`, {
      method: 'POST'
    });
    return response.data;
  }

  async updatePricing(prices: { monthly_price?: number; yearly_price?: number; lifetime_price?: number }): Promise<any> {
    const response = await apiCall('/settings/license/pricing', {
      method: 'PUT',
      body: JSON.stringify(prices)
    });
    return response.data;
  }
}

export const api = new APIService();
