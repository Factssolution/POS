import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, Users, ShoppingBag, TrendingUp, Truck, Printer } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { api, Supplier } from '../services/api';
import { supabase } from '../services/supabase';
import { toast } from 'sonner';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [timeFrame, setTimeFrame] = useState('today');
  const [stats, setStats] = useState<any>(null);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [printingOrderId, setPrintingOrderId] = useState<number | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [timeFrame]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading dashboard data for timeframe:', timeFrame);
        
      // Get time range based on selected filter
      const { startDate, endDate } = getTimeRange();
      console.log('⏰ Time Range:', { startDate, endDate, timeFrame });
        
      // Fetch orders directly from Supabase (without customer join to avoid FK issues)
      let ordersQuery = supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });
        
      // Apply date filter
      if (timeFrame !== 'all') {
        ordersQuery = ordersQuery.gte('created_at', startDate);
      }
        
      const { data: orders, error: ordersError } = await ordersQuery;
        
      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        throw ordersError;
      }
        
      console.log('✅ Orders loaded:', orders?.length || 0);
        
      // Calculate stats from orders
      const todayOrders = orders || [];
      const totalRevenue = todayOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const totalOrders = todayOrders.length;
        
      // Fetch products count
      const { count: totalProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });
        
      // Fetch customers count
      const { count: totalCustomers } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });
        
      // Prepare stats object
      const statsData = {
        today_revenue: totalRevenue,
        today_orders: totalOrders,
        total_revenue: totalRevenue,
        total_orders: totalOrders,
        total_products: totalProducts || 0,
        total_customers: totalCustomers || 0
      };
        
      console.log('📊 Dashboard Stats:', statsData);
      setStats(statsData);
        
      // Prepare sales data for charts
      const salesByDay = todayOrders.reduce((acc: any, order) => {
        const date = new Date(order.created_at).toLocaleDateString();
        if (!acc[date]) {
          acc[date] = { date, revenue: 0, orders: 0 };
        }
        acc[date].revenue += order.total_amount || 0;
        acc[date].orders += 1;
        return acc;
      }, {});
        
      const mappedSalesData = Object.values(salesByDay).map((item: any) => ({
        day: item.date,
        sales: item.revenue,
        orders: item.orders
      }));
        
      setSalesData(mappedSalesData);
      setRecentOrders(todayOrders.slice(0, 5));
            
      // Remove suppliers and settings calls - not needed for dashboard stats
      setSuppliers([]);
      setSettings({});
        
    } catch (error: any) {
      console.error('❌ Dashboard load error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `Rs ${amount.toLocaleString('en-PK')}`;
  };

  const formatOrderTime = (createdAt: string) => {
    if (!createdAt) {
      return 'N/A';
    }
    const date = new Date(createdAt);
    const isValid = !isNaN(date.getTime());
    if (!isValid) {
      return 'N/A';
    }
    const formatted = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    console.log('  ✅ Formatted time:', formatted);
    return formatted;
  };

  const handleReprintReceipt = async (orderId: number) => {
    try {
      setPrintingOrderId(orderId);
      console.log('🖨️ Reprinting receipt for order:', orderId);
      
      // Fetch order receipt data
      const receiptData = await api.getOrderReceipt(orderId);
      
      if (!receiptData || !receiptData.order) {
        toast.error('Failed to load receipt data');
        return;
      }
      
      const order = receiptData.order;
      
      // Parse date safely
      const orderDate = order.created_at ? new Date(order.created_at) : new Date();
      const isValidDate = !isNaN(orderDate.getTime());
      const formattedDate = isValidDate ? orderDate.toLocaleDateString('en-GB') : 'N/A';
      const formattedTime = isValidDate ? orderDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A';
      
      // Create receipt HTML with DUPLICATE watermark
      const receiptHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Duplicate Receipt - Token #${order.token_number}</title>
          <style>
            @media print {
              @page { margin: 0; size: 80mm auto; }
              body { margin: 0; }
            }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Courier New', monospace; 
              width: 80mm; 
              padding: 5mm;
              font-size: 12px;
              position: relative;
            }
            .watermark {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 48px;
              font-weight: bold;
              color: rgba(255, 0, 0, 0.15);
              pointer-events: none;
              z-index: 0;
              white-space: nowrap;
            }
            .receipt-content { position: relative; z-index: 1; }
            .header { text-align: center; margin-bottom: 10px; border-bottom: 2px dashed #000; padding-bottom: 10px; }
            .logo { max-width: 60px; max-height: 60px; margin: 0 auto 5px; display: block; }
            .company-name { font-size: 18px; font-weight: bold; margin: 5px 0; }
            .company-info { font-size: 10px; margin: 2px 0; }
            .receipt-title { font-size: 16px; font-weight: bold; margin: 10px 0; text-decoration: underline; }
            .order-info { margin: 10px 0; }
            .order-info-row { display: flex; justify-content: space-between; margin: 3px 0; font-size: 11px; }
            .items-header { border-top: 2px dashed #000; border-bottom: 1px dashed #000; padding: 5px 0; margin: 10px 0 5px; font-weight: bold; }
            .item { display: flex; justify-content: space-between; padding: 3px 0; font-size: 11px; }
            .totals { border-top: 2px dashed #000; margin-top: 10px; padding-top: 5px; }
            .total-row { display: flex; justify-content: space-between; margin: 3px 0; font-size: 11px; }
            .total-row.grand-total { font-size: 14px; font-weight: bold; border-top: 1px dashed #000; padding-top: 5px; margin-top: 5px; }
            .footer { text-align: center; margin-top: 15px; border-top: 2px dashed #000; padding-top: 10px; }
            .footer-text { font-size: 10px; margin: 2px 0; }
            .footer-bold { font-size: 11px; font-weight: bold; margin-top: 5px; }
            .branding { margin-top: 10px; padding-top: 5px; border-top: 1px dashed #000; text-align: center; }
            .branding-text { font-size: 9px; margin: 1px 0; }
          </style>
        </head>
        <body>
          <div class="watermark">DUPLICATE RECEIPT</div>
          <div class="receipt-content">
            <div class="header">
              ${settings.company_logo ? `<img src="${settings.company_logo}" class="logo" alt="Logo">` : ''}
              <div class="company-name">${settings.company_name || 'POS Store'}</div>
              ${settings.company_address ? `<div class="company-info">${settings.company_address}</div>` : ''}
              ${settings.company_phone ? `<div class="company-info">Phone: ${settings.company_phone}</div>` : ''}
              <div class="receipt-title">DUPLICATE RECEIPT</div>
            </div>
            
            <div class="order-info">
              <div class="order-info-row">
                <span>Token #:</span>
                <span><strong>${order.token_number}</strong></span>
              </div>
              <div class="order-info-row">
                <span>Date:</span>
                <span>${formattedDate}</span>
              </div>
              <div class="order-info-row">
                <span>Time:</span>
                <span>${formattedTime}</span>
              </div>
              ${order.customer_name ? `<div class="order-info-row"><span>Customer:</span><span>${order.customer_name}</span></div>` : ''}
              <div class="order-info-row">
                <span>Payment:</span>
                <span>${(order.payment_method || 'cash').toUpperCase()}</span>
              </div>
            </div>
            
            <div class="items-header">
              <span>Item</span>
              <span>Qty × Price</span>
              <span>Total</span>
            </div>
            
            ${order.items ? order.items.map((item: any, index: number) => `
              <div class="item">
                <span style="flex: 2">${index + 1}. ${item.product_name}</span>
                <span style="flex: 1; text-align: center">${item.quantity} × ${parseFloat(item.price).toLocaleString()}</span>
                <span style="flex: 1; text-align: right">${parseFloat(item.total).toLocaleString()}</span>
              </div>
            `).join('') : ''}
            
            <div class="totals">
              <div class="total-row">
                <span>Subtotal:</span>
                <span>Rs ${(order.subtotal || 0).toLocaleString()}</span>
              </div>
              ${(order.tax_amount || 0) > 0 ? `
              <div class="total-row">
                <span>Tax:</span>
                <span>Rs ${(order.tax_amount || 0).toLocaleString()}</span>
              </div>
              ` : ''}
              <div class="total-row grand-total">
                <span>TOTAL:</span>
                <span>Rs ${(order.total_amount || 0).toLocaleString()}</span>
              </div>
            </div>
            
            <div class="footer">
              <p class="footer-text">Thank you for your business!</p>
              ${settings.receipt_footer ? `<p class="footer-text">${settings.receipt_footer}</p>` : ''}
            </div>
            
            <div class="branding">
              <p class="branding-text"><strong>Powered by Facts Solution</strong></p>
              <p class="branding-text">📞 +923102479203 & 03357740121</p>
            </div>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              window.onfocus = function() { setTimeout(function() { window.close(); }, 500); }
            };
          </script>
        </body>
        </html>
      `;
      
      // Open receipt in new window
      const printWindow = window.open('', '_blank', 'width=400,height=600');
      if (printWindow) {
        printWindow.document.write(receiptHTML);
        printWindow.document.close();
        toast.success('Receipt opened for printing');
      } else {
        toast.error('Please allow popups to print receipts');
      }
    } catch (error: any) {
      console.error('❌ Reprint error:', error);
      toast.error('Failed to print receipt');
    } finally {
      setPrintingOrderId(null);
    }
  };

  const getTimeRange = () => {
    const now = new Date();
    const startDate = new Date();
    
    switch (timeFrame) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default: // today
        // For today, set start time to beginning of day (00:00:00)
        startDate.setHours(0, 0, 0, 0);
        break;
    }
    
    return {
      startDate: startDate.toISOString(),
      endDate: now.toISOString()
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Business Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Select value={timeFrame} onValueChange={setTimeFrame}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select time frame" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards - REAL DATA FROM API */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Today's Token Summary - Admin View */}
        {stats?.current_token > 0 && (
          <Card className="border-2 border-green-500 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-green-900 dark:text-green-100">Today's Tokens</CardTitle>
              <ShoppingBag className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700 dark:text-green-300">{stats.current_token}</div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                Total Bills Generated Today
              </p>
              <p className="text-xs font-semibold text-green-800 dark:text-green-200 mt-2">
                {stats.current_token_formatted}
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Today's Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.today_revenue || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.today_revenue ? `From ${stats?.today_orders || 0} orders today` : 'No sales today'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">{timeFrame === 'today' ? "Today's Orders" : 'Period Orders'}</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.period_orders || stats?.today_orders || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.current_token_formatted && (
                <span className="font-semibold text-primary">{stats.current_token_formatted}</span>
              )}
              {!stats?.current_token_formatted && stats?.period_orders ? 'Current token' : 'No data'}
            </p>
            {stats?.current_token > 0 && (
              <p className="text-xs font-medium text-green-600 mt-1">
                ✅ Total Tokens Generated: {stats.current_token}
              </p>
            )}
            {stats?.business_day && (
              <p className="text-xs text-muted-foreground mt-1">
                Business Day: {new Date(stats.business_day).toLocaleDateString('en-GB')}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Products</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_products || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.total_products ? 'Active products' : 'All stocked'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Lifetime Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.total_revenue || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.total_orders || 0} total orders (all time)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Business Insights */}
      {stats?.today_revenue > 0 && (
        <Card className="border-2 border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Today's Business Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                <p className="text-xs text-muted-foreground mb-1">Average Order Value</p>
                <p className="text-xl font-bold text-blue-600">
                  {formatCurrency(stats.today_revenue / (stats.today_orders || 1))}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Per bill average</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                <p className="text-xs text-muted-foreground mb-1">Peak Activity</p>
                <p className="text-xl font-bold text-indigo-600">
                  {stats.current_token} bills
                </p>
                <p className="text-xs text-muted-foreground mt-1">Generated today</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                <p className="text-xs text-muted-foreground mb-1">Revenue Rate</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(stats.today_revenue / Math.max(1, new Date().getHours()))}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Per hour average</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                <p className="text-xs text-muted-foreground mb-1">Business Day</p>
                <p className="text-xl font-bold text-purple-600">
                  {stats.business_day ? new Date(stats.business_day).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'N/A'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Token cycle</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Professional Business Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Methods Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Methods</CardTitle>
            <p className="text-xs text-muted-foreground">Today's payment distribution</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { method: 'Cash', label: 'Cash', color: 'bg-green-500', icon: '💵' },
                { method: 'easypaisa', label: 'Easypaisa/JazzCash', color: 'bg-emerald-500', icon: '📱' },
                { method: 'bank', label: 'Bank Transfer', color: 'bg-blue-500', icon: '🏦' },
                { method: 'other', label: 'Other', color: 'bg-gray-500', icon: '📝' }
              ].map((payment) => {
                const count = recentOrders.filter(o => {
                  const pm = o.payment_method?.toLowerCase();
                  if (payment.method === 'easypaisa') {
                    return pm === 'easypaisa' || pm === 'jazzcash' || pm === 'upi';
                  }
                  if (payment.method === 'bank') {
                    return pm === 'bank' || pm === 'card';
                  }
                  return pm === payment.method;
                }).length;
                const percentage = recentOrders.length > 0 ? Math.round((count / recentOrders.length) * 100) : 0;
                
                return (
                  <div key={payment.method} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{payment.icon}</span>
                        <span className="text-sm font-medium">{payment.label}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold">{count}</span>
                        <span className="text-xs text-muted-foreground ml-1">({percentage}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`${payment.color} h-2 rounded-full transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Sales Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sales Performance</CardTitle>
            <p className="text-xs text-muted-foreground">Key metrics comparison</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Today vs Lifetime */}
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div>
                    <p className="text-xs text-muted-foreground">Today's Revenue</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(stats?.today_revenue || 0)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Orders</p>
                    <p className="text-lg font-bold text-green-600">{stats?.today_orders || 0}</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div>
                    <p className="text-xs text-muted-foreground">Lifetime Revenue</p>
                    <p className="text-xl font-bold text-blue-600">{formatCurrency(stats?.total_revenue || 0)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Total Orders</p>
                    <p className="text-lg font-bold text-blue-600">{stats?.total_orders || 0}</p>
                  </div>
                </div>
              </div>
              
              {/* Growth Indicator */}
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Today's Contribution</span>
                  <span className="text-sm font-bold">
                    {stats?.total_revenue > 0 ? Math.round((stats.today_revenue / stats.total_revenue) * 100) : 0}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">of total lifetime revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Products / Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Stats</CardTitle>
            <p className="text-xs text-muted-foreground">Business at a glance</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Inventory Status */}
              <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Active Products</span>
                  <span className="text-2xl">📦</span>
                </div>
                <p className="text-3xl font-bold text-orange-600">{stats?.total_products || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Items in inventory</p>
              </div>
              
              {/* Supplier Summary */}
              <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Active Suppliers</span>
                  <span className="text-2xl">🚚</span>
                </div>
                <p className="text-3xl font-bold text-indigo-600">{suppliers.filter(s => s.status === 'active').length}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Total payable: {formatCurrency(suppliers.reduce((sum, s) => sum + (s.currentBalance || 0), 0))}
                </p>
              </div>
              
              {/* Business Health */}
              <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Business Health</span>
                  <span className="text-2xl">{stats?.today_orders > 0 ? '🟢' : '🟡'}</span>
                </div>
                <p className="text-lg font-bold text-emerald-600">
                  {stats?.today_orders > 0 ? 'Active Today' : 'Waiting for Orders'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.current_token || 0} tokens generated
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders - REAL DATA FROM API */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Recent Orders</CardTitle>
            {recentOrders.length > 0 && (
              <span className="text-sm text-muted-foreground">
                Last {recentOrders.length} orders
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.slice(0, 5).map((order: any) => (
                <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <ShoppingBag className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">Token #{order.token_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.customer_name || 'Walk-in Customer'} • {order.payment_method?.toUpperCase() || 'CASH'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-bold text-lg">{formatCurrency(order.total_amount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatOrderTime(order.created_at)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleReprintReceipt(order.id)}
                      disabled={printingOrderId === order.id}
                      className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                      title="Reprint Receipt"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No orders yet</p>
          )}
        </CardContent>
      </Card>

      {/* Supplier Balances - REAL DATA FROM API */}
      {suppliers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Supplier Balances
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suppliers.slice(0, 6).map((supplier: any) => {
                const openingBalance = supplier.opening_balance || 0;
                const totalCredit = supplier.totalCredit || 0;
                const totalDebit = supplier.totalDebit || 0;
                const currentBalance = supplier.currentBalance || openingBalance;
                
                return (
                  <div key={supplier.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-base">{supplier.name}</p>
                        <p className="text-xs text-muted-foreground">{supplier.contact}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        supplier.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {supplier.status}
                      </span>
                    </div>
                    
                    {/* Balance Breakdown */}
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Opening Balance:</span>
                        <span className="font-medium">{formatCurrency(openingBalance)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">+ Credit:</span>
                        <span className="font-medium text-green-600">{formatCurrency(totalCredit)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">- Debit:</span>
                        <span className="font-medium text-red-600">{formatCurrency(totalDebit)}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-3 pt-3 border-t">
                      <span className="text-sm font-semibold">Current Balance:</span>
                      <span className={`text-lg font-bold ${
                        currentBalance > 0 ? 'text-green-600' : currentBalance < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {formatCurrency(currentBalance)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}