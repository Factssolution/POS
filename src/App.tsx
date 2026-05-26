import React, { useState, useEffect } from 'react';
import { Sidebar, SidebarContent, SidebarProvider, SidebarTrigger } from './components/ui/sidebar';
import { Button } from './components/ui/button';
import { 
  BarChart3, 
  ShoppingCart, 
  Users, 
  Truck, 
  CreditCard, 
  FileText, 
  Settings,
  Menu,
  Package,
  LogOut,
  FolderTree,
  Wallet,
  Shield
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import POSSystem from './components/POSSystem';
import EmployeeManagement from './components/EmployeeManagement';
import SupplierManagement from './components/SupplierManagement';
import CreditDebit from './components/CreditDebit';
import Reports from './components/Reports';
import CustomerReports from './components/CustomerReports';
import SettingsPage from './components/SettingsPage';
import ProductManagement from './components/ProductManagement';
import CategoryManagement from './components/CategoryManagement';
import ExpenseManagement from './components/ExpenseManagement';
import LoginScreen from './components/LoginScreen';
import ReportPreview from './components/ReportPreview';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import { toast, Toaster } from 'sonner';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3, component: Dashboard, roles: ['Admin', 'Manager', 'Cashier'] },
  { id: 'super-admin', label: 'Super Admin', icon: Shield, component: SuperAdminDashboard, roles: ['Super Admin'] },
  { id: 'pos', label: 'POS System', icon: ShoppingCart, component: POSSystem, roles: ['Admin', 'Manager', 'Cashier'] },
  { id: 'products', label: 'Add Items', icon: Package, component: ProductManagement, roles: ['Admin', 'Manager'] },
  { id: 'categories', label: 'Categories', icon: FolderTree, component: CategoryManagement, roles: ['Admin', 'Manager'] },
  { id: 'employees', label: 'Employees', icon: Users, component: EmployeeManagement, roles: ['Admin', 'Manager'] },
  { id: 'suppliers', label: 'Suppliers', icon: Truck, component: SupplierManagement, roles: ['Admin', 'Manager'] },
  { id: 'expenses', label: 'Expenses', icon: Wallet, component: ExpenseManagement, roles: ['Admin', 'Manager'] },
  { id: 'credit-debit', label: 'Credit & Debit', icon: CreditCard, component: CreditDebit, roles: ['Admin', 'Manager'] },
  { id: 'reports', label: 'Reports', icon: FileText, component: Reports, roles: ['Admin', 'Manager'] },
  { id: 'customer-reports', label: 'Customer Reports', icon: Users, component: CustomerReports, roles: ['Admin', 'Manager'] },
  { id: 'settings', label: 'Settings', icon: Settings, component: SettingsPage, roles: ['Admin'] },
];

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if this is report preview page
  useEffect(() => {
    // Simple routing check based on URL hash
    if (window.location.pathname === '/report-preview' || window.location.hash === '#/report-preview') {
      // This page should just show the preview
      return;
    }
  }, []);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('pos_auth_token');
      const userData = localStorage.getItem('pos_user_data');
      
      if (token && userData) {
        try {
          const user = JSON.parse(userData);
          setCurrentUser(user);
          setIsAuthenticated(true);
        } catch (error) {
          localStorage.removeItem('pos_auth_token');
          localStorage.removeItem('pos_user_data');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogin = (user: User, token: string) => {
    localStorage.setItem('pos_auth_token', token);
    localStorage.setItem('pos_user_data', JSON.stringify(user));
    setCurrentUser(user);
    setIsAuthenticated(true);
    toast.success(`Welcome back, ${user.name}!`);
  };

  const handleLogout = () => {
    localStorage.removeItem('pos_auth_token');
    localStorage.removeItem('pos_user_data');
    setCurrentUser(null);
    setIsAuthenticated(false);
    setActiveTab('dashboard');
    toast.success('Logged out successfully');
  };

  // Check if this is the report preview route
  if (window.location.pathname === '/report-preview' || window.location.hash === '#/report-preview') {
    return <ReportPreview />;
  }

  // Show loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // Filter menu items based on user role
  const availableMenuItems = menuItems.filter(item => 
    currentUser && item.roles.includes(currentUser.role)
  );

  // Ensure active tab is accessible, otherwise redirect to first available
  const isCurrentTabAccessible = availableMenuItems.some(item => item.id === activeTab);
  const displayActiveTab = isCurrentTabAccessible ? activeTab : availableMenuItems[0]?.id || 'dashboard';

  const ActiveComponent = availableMenuItems.find(item => item.id === displayActiveTab)?.component || Dashboard;

  return (
    <>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <Sidebar className="border-r lg:block">
            <SidebarContent>
              <div className="p-4 border-b">
                <h2 className="font-semibold">POS System</h2>
                <p className="text-sm text-muted-foreground">Powered by Factssolution</p>
                {currentUser && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {currentUser.name} ({currentUser.role})
                  </div>
                )}
              </div>
              <nav className="p-4 space-y-2 flex-1">
                {availableMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.id}
                      variant={displayActiveTab === item.id ? 'default' : 'ghost'}
                      className="w-full justify-start text-left"
                      onClick={() => setActiveTab(item.id)}
                    >
                      <Icon className="w-4 h-4 mr-3 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Button>
                  );
                })}
              </nav>
              <div className="p-4 border-t">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-3 flex-shrink-0" />
                  <span className="truncate">Logout</span>
                </Button>
              </div>
            </SidebarContent>
          </Sidebar>
          
          <div className="flex-1 flex flex-col min-w-0">
            <header className="border-b p-3 lg:p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 lg:gap-4 min-w-0">
                <SidebarTrigger className="lg:hidden">
                  <Menu className="w-5 h-5" />
                </SidebarTrigger>
                <h1 className="font-semibold truncate">
                  {availableMenuItems.find(item => item.id === displayActiveTab)?.label}
                </h1>
              </div>
              {currentUser && (
                <div className="text-sm text-muted-foreground hidden sm:block">
                  Welcome, {currentUser.name}
                </div>
              )}
            </header>
            
            <main className="flex-1 p-3 lg:p-6 overflow-auto">
              <ActiveComponent />
            </main>
          </div>
        </div>
      </SidebarProvider>
      <Toaster position="top-right" richColors closeButton />
    </>
  );
}