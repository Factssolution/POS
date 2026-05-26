import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Printer, Download, X } from 'lucide-react';
import { api } from '../services/api';
import { toast } from 'sonner';

const pieChartColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

export default function ReportPreview() {
  const [reportType, setReportType] = useState('sales');
  const [dateRange, setDateRange] = useState('month');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get report type and date range from sessionStorage
    const storedReportType = sessionStorage.getItem('previewReportType');
    const storedDateRange = sessionStorage.getItem('previewDateRange');
    
    if (storedReportType) setReportType(storedReportType);
    if (storedDateRange) setDateRange(storedDateRange);
    
    // Load real report data with the stored date range
    loadReportData(storedReportType || 'sales', storedDateRange || 'week');
  }, []);

  const loadReportData = async (type: string, dateRangeParam?: string) => {
    try {
      setLoading(true);
      // Use the passed dateRange parameter, fallback to state
      const effectiveDateRange = dateRangeParam || dateRange;
      console.log(' ReportPreview - Loading', type, 'report for', effectiveDateRange);
      
      // Calculate date range based on the effective date range
      const now = new Date();
      const startDate = new Date();
      
      switch (effectiveDateRange) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate.setDate(now.getDate() - 7);
      }
      
      // Set end date to end of day (23:59:59) to include all orders from that day
      const endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      console.log(' ReportPreview - Date Range:', startDateStr, 'to', endDateStr);
      
      let data;
      
      switch (type) {
        case 'sales':
          data = await api.getSalesAnalytics({ startDate: startDateStr, endDate: endDateStr });
          console.log(' ReportPreview - Sales data loaded:', data);
          break;
        case 'customer':
          data = await api.getCustomerReport({ startDate: startDateStr, endDate: endDateStr });
          console.log(' ReportPreview - Customer data loaded:', data);
          break;
        case 'supplier':
          data = await api.getSupplierReport({ startDate: startDateStr, endDate: endDateStr });
          break;
        case 'employee':
          data = await api.getEmployeeReport({ startDate: startDateStr, endDate: endDateStr });
          break;
        case 'creditDebit':
          data = await api.getTransactions();
          break;
        case 'generalLedger':
          const [transactions, salesData] = await Promise.all([
            api.getTransactions(),
            api.getSalesAnalytics()
          ]);
          data = { 
            ledger: transactions.transactions || [],
            sales: salesData,
            summary: transactions.summary
          };
          break;
        case 'profitLoss':
          data = await api.getSalesAnalytics();
          break;
        default:
          data = null;
      }
      
      setReportData(data);
      console.log(' ReportPreview - Data set to state:', data);
    } catch (error: any) {
      console.error(' ReportPreview - Failed to load report data:', error);
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
      console.log(' ReportPreview - Loading complete');
    }
  };

  const handlePrint = () => {
    if (loading || !reportData) {
      toast.error('Please wait for data to load before printing');
      return;
    }
    window.print();
  };

  const getReportTitle = () => {
    const titles: { [key: string]: string } = {
      sales: 'Sales Report',
      customer: 'Customer Report',
      supplier: 'Supplier Report',
      employee: 'Employee Report',
      creditDebit: 'Credit/Debit Report',
      generalLedger: 'General Ledger Report',
      profitLoss: 'Profit & Loss Report'
    };
    return titles[reportType] || 'Report';
  };

  const renderSalesReport = () => {
    if (!reportData || loading) {
      return <div className="text-center py-8 text-muted-foreground">Loading sales data...</div>;
    }
    
    // Transform dailySales data for charts and table (same as Reports.tsx)
    const dailySales = reportData?.dailySales || [];
    
    // Transform data for charts
    const salesData = dailySales.map(day => ({
      period: new Date(day.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      date: day.date,
      sales: day.revenue,
      orders: day.orders,
      customers: Math.round(day.revenue / 500) // Estimated customers
    }));
    
    console.log(' ReportPreview - Rendering with:', {
      dailySalesCount: dailySales.length,
      salesDataCount: salesData.length,
      totalRevenue: salesData.reduce((sum: number, item: any) => sum + item.sales, 0)
    });
    
    return (
      <div className="space-y-6 print:space-y-4">
        {salesData.length > 0 ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:hidden">
              <Card>
                <CardHeader>
                  <CardTitle>Sales Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="sales" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Orders & Customers</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="orders" fill="#82ca9d" />
                      <Bar dataKey="customers" fill="#ffc658" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Sales Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead>Total Sales</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Customers</TableHead>
                      <TableHead>Avg Order Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesData.map((item: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{item.period}</TableCell>
                        <TableCell>Rs {(item.sales || 0).toLocaleString()}</TableCell>
                        <TableCell>{item.orders || 0}</TableCell>
                        <TableCell>{item.customers || 0}</TableCell>
                        <TableCell>Rs {item.orders ? Math.round((item.sales || 0) / item.orders).toLocaleString() : '0'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No sales data available for this period.
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderCustomerReport = () => {
    if (!reportData || loading) {
      return <div className="text-center py-8 text-muted-foreground">Loading customer data...</div>;
    }
    
    const customers = reportData?.customers || [];
    const summary = reportData?.summary || {};
    
    // Calculate customer segments
    const segments = {
      VIP: { count: 0, value: 0 },
      Regular: { count: 0, value: 0 },
      New: { count: 0, value: 0 }
    };
    
    customers.forEach(customer => {
      if (customer.totalSpent >= 5000) {
        segments.VIP.count++;
        segments.VIP.value += customer.totalSpent;
      } else if (customer.totalSpent >= 1000) {
        segments.Regular.count++;
        segments.Regular.value += customer.totalSpent;
      } else {
        segments.New.count++;
        segments.New.value += customer.totalSpent;
      }
    });
    
    const customerSegments = [
      {
        segment: 'VIP',
        count: segments.VIP.count,
        percentage: customers.length > 0 ? Math.round((segments.VIP.count / customers.length) * 100) : 0,
        value: segments.VIP.value
      },
      {
        segment: 'Regular',
        count: segments.Regular.count,
        percentage: customers.length > 0 ? Math.round((segments.Regular.count / customers.length) * 100) : 0,
        value: segments.Regular.value
      },
      {
        segment: 'New',
        count: segments.New.count,
        percentage: customers.length > 0 ? Math.round((segments.New.count / customers.length) * 100) : 0,
        value: segments.New.value
      }
    ];
    
    console.log(' ReportPreview - Rendering customer report with:', {
      totalCustomers: customers.length,
      totalRevenue: summary.totalRevenue || 0
    });
    
    return (
      <div className="space-y-6 print:space-y-4">
        {customers.length > 0 ? (
          <>
            {/* Customer Segments Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:hidden">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Segments</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={customerSegments}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ segment, percentage }) => `${segment} ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {customerSegments.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={pieChartColors[index % pieChartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Customer Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={customerSegments}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="segment" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => [`Rs ${value.toLocaleString()}`, 'Total Value']} />
                      <Bar dataKey="value" fill="#8884d8" name="Total Value" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Customer Analytics Table */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Segment</TableHead>
                      <TableHead>Count</TableHead>
                      <TableHead>Percentage</TableHead>
                      <TableHead>Total Value</TableHead>
                      <TableHead>Avg Value per Customer</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerSegments.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Badge variant={item.segment === 'VIP' ? 'default' : 'secondary'}>
                            {item.segment}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.count}</TableCell>
                        <TableCell>{item.percentage}%</TableCell>
                        <TableCell>Rs {item.value.toLocaleString()}</TableCell>
                        <TableCell>Rs {item.count > 0 ? Math.round(item.value / item.count).toLocaleString() : 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Top Customers Table */}
            <Card>
              <CardHeader>
                <CardTitle>Top 10 Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Total Orders</TableHead>
                      <TableHead>Total Spent</TableHead>
                      <TableHead>Avg Order Value</TableHead>
                      <TableHead>Last Visit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.slice(0, 10).map((customer, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{customer.name || 'Walk-in Customer'}</TableCell>
                        <TableCell>{customer.phone || 'N/A'}</TableCell>
                        <TableCell>{customer.totalOrders}</TableCell>
                        <TableCell className="text-green-600 font-semibold">
                          Rs {customer.totalSpent.toLocaleString()}
                        </TableCell>
                        <TableCell>Rs {Math.round(customer.averageOrderValue || 0).toLocaleString()}</TableCell>
                        <TableCell>{new Date(customer.lastVisit).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Summary Cards for Print */}
            <div className="hidden print:grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Total Customers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.totalCustomers || customers.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Rs {(summary.totalRevenue || 0).toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Avg Customer Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Rs {(summary.averageCustomerValue || 0).toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Avg Visits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.averageVisitsPerCustomer?.toFixed(1) || '0'}</div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No customer data available for this period.
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderSupplierReport = () => {
    if (!reportData || loading) {
      return <div className="text-center py-8 text-muted-foreground">Loading supplier data...</div>;
    }
    
    const suppliers = reportData?.data?.suppliers || reportData?.suppliers || [];
    
    // Calculate summary statistics
    const totalSuppliers = suppliers.length;
    const totalPurchases = suppliers.reduce((sum: number, s: any) => sum + (s.totalPurchases || 0), 0);
    const totalOutstanding = suppliers.reduce((sum: number, s: any) => sum + (s.outstanding || 0), 0);
    const activeSuppliers = suppliers.filter((s: any) => s.status === 'active' || s.status === 'Active').length;
    const avgPaymentRatio = totalPurchases > 0 ? Math.round(((totalPurchases - totalOutstanding) / totalPurchases) * 100) : 0;
    
    return (
      <div className="space-y-6 print:space-y-4">
        {suppliers.length > 0 ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm">Total Suppliers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalSuppliers}</div>
                  <p className="text-xs text-muted-foreground">{activeSuppliers} active</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm">Total Purchases</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Rs {totalPurchases.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">All time</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm">Outstanding Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${totalOutstanding > 30000 ? 'text-red-600' : 'text-green-600'}`}>
                    Rs {totalOutstanding.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">Pending payments</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm">Avg Payment Ratio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{avgPaymentRatio}%</div>
                  <p className="text-xs text-muted-foreground">Paid vs Total</p>
                </CardContent>
              </Card>
            </div>

            {/* Supplier Table */}
            <Card>
              <CardHeader>
                <CardTitle>Supplier Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Supplier Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Total Purchases</TableHead>
                      <TableHead>Outstanding Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment Ratio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suppliers.map((supplier: any) => {
                      const supplierPurchases = supplier.totalPurchases || 0;
                      const supplierOutstanding = supplier.outstanding || 0;
                      const paymentRatio = supplierPurchases > 0 
                        ? Math.round(((supplierPurchases - supplierOutstanding) / supplierPurchases) * 100) 
                        : 0;
                      
                      return (
                        <TableRow key={supplier.id}>
                          <TableCell className="font-medium">{supplier.name}</TableCell>
                          <TableCell>{supplier.contact || 'N/A'}</TableCell>
                          <TableCell>Rs {supplierPurchases.toLocaleString()}</TableCell>
                          <TableCell className={supplierOutstanding > 30000 ? 'text-red-600 font-semibold' : 'text-green-600'}>
                            Rs {supplierOutstanding.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={supplier.status === 'active' || supplier.status === 'Active' ? 'default' : 'secondary'}>
                              {supplier.status || 'Active'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={paymentRatio >= 80 ? 'default' : 'secondary'}>
                              {paymentRatio}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No suppliers found for this period.
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderEmployeeReport = () => {
    if (!reportData || loading) {
      return <div className="text-center py-8 text-muted-foreground">Loading employee data...</div>;
    }
    
    const allEmployees = reportData?.data?.employees || reportData?.employees || [];
    const summary = reportData?.data?.summary || reportData?.summary || {};
    
    const totalEmployees = allEmployees.length;
    const totalSales = allEmployees.reduce((sum: number, e: any) => sum + (e.totalSales || 0), 0);
    const totalOrders = allEmployees.reduce((sum: number, e: any) => sum + (e.totalOrders || 0), 0);
    const avgPerformance = totalEmployees > 0 ? Math.round(totalSales / totalEmployees) : 0;
    
    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Total Employees</p>
                <p className="text-2xl font-bold">{totalEmployees}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Total Sales</p>
                <p className="text-2xl font-bold">Rs {totalSales.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Total Orders</p>
                <p className="text-2xl font-bold">{totalOrders}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Avg Performance</p>
                <p className="text-2xl font-bold">Rs {avgPerformance.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Employee Table */}
        <Card>
          <CardHeader>
            <CardTitle>Employee Performance Details</CardTitle>
          </CardHeader>
          <CardContent>
            {allEmployees.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Total Orders</TableHead>
                      <TableHead className="text-right">Total Sales</TableHead>
                      <TableHead className="text-right">Avg Order Value</TableHead>
                      <TableHead className="text-right">Profit</TableHead>
                      <TableHead className="text-right">Margin</TableHead>
                      <TableHead className="text-center">Performance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allEmployees.map((employee: any) => {
                      const performanceLevel = employee.profitMargin >= 40 ? 'Excellent' :
                                            employee.profitMargin >= 25 ? 'Good' :
                                            employee.profitMargin >= 15 ? 'Average' : 'Needs Improvement';
                      const performanceColor = employee.profitMargin >= 40 ? 'default' :
                                            employee.profitMargin >= 25 ? 'secondary' :
                                            employee.profitMargin >= 15 ? 'outline' : 'destructive';
                      
                      return (
                        <TableRow key={employee.id}>
                          <TableCell className="font-medium">{employee.name}</TableCell>
                          <TableCell>{employee.email || 'N/A'}</TableCell>
                          <TableCell>{employee.phone}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{employee.role}</Badge>
                          </TableCell>
                          <TableCell className="text-right">{employee.totalOrders}</TableCell>
                          <TableCell className="text-right font-semibold">Rs {employee.totalSales.toLocaleString()}</TableCell>
                          <TableCell className="text-right">Rs {employee.avgOrderValue.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-semibold text-green-600">Rs {employee.totalProfit.toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={employee.profitMargin >= 30 ? 'default' : 'secondary'}>
                              {employee.profitMargin}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={performanceColor}>{performanceLevel}</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No employee performance data available.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderCreditDebitReport = () => {
    if (!reportData || loading) {
      return <div className="text-center py-8 text-muted-foreground">Loading transaction data...</div>;
    }
    
    const transactions = reportData?.transactions || [];
    
    return (
      <Card>
        <CardHeader>
          <CardTitle>Credit/Debit Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction: any) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{new Date(transaction.transaction_date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{transaction.supplier?.name || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={transaction.type === 'credit' ? 'default' : 'destructive'}>
                        {transaction.type}
                      </Badge>
                    </TableCell>
                    <TableCell className={transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                      Rs {parseFloat(transaction.amount).toLocaleString()}
                    </TableCell>
                    <TableCell>{transaction.description || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No transactions found.
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderGeneralLedgerReport = () => {
    if (!reportData || loading) {
      return <div className="text-center py-8 text-muted-foreground">Loading ledger data...</div>;
    }
    
    const ledger = reportData?.ledger || [];
    
    return (
      <Card>
        <CardHeader>
          <CardTitle>General Ledger</CardTitle>
        </CardHeader>
        <CardContent>
          {ledger.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledger.map((entry: any) => (
                  <TableRow key={entry.id}>
                    <TableCell>{new Date(entry.transaction_date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{entry.supplier?.name || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={entry.type === 'credit' ? 'default' : 'destructive'}>
                        {entry.type}
                      </Badge>
                    </TableCell>
                    <TableCell className={entry.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                      Rs {parseFloat(entry.amount).toLocaleString()}
                    </TableCell>
                    <TableCell>{entry.description || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No ledger entries found.
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderProfitLossReport = () => {
    if (!reportData || loading) {
      return <div className="text-center py-8 text-muted-foreground">Loading profit & loss data...</div>;
    }
    
    const summary = reportData?.summary || {};
    const totalSales = summary.totalSales || 0;
    const totalOrders = summary.totalOrders || 0;
    
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profit & Loss Statement</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead className="text-right">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Total Sales</TableCell>
                <TableCell className="text-right">{parseFloat(totalSales).toLocaleString()}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Total Orders</TableCell>
                <TableCell className="text-right">{totalOrders}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Average Order Value</TableCell>
                <TableCell className="text-right">
                  Rs {totalOrders > 0 ? Math.round(parseFloat(totalSales) / totalOrders).toLocaleString() : '0'}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground py-4">
                  Detailed expense tracking requires expense management module
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  const reportComponents: { [key: string]: () => React.ReactElement } = {
    sales: renderSalesReport,
    customer: renderCustomerReport,
    supplier: renderSupplierReport,
    employee: renderEmployeeReport,
    creditDebit: renderCreditDebitReport,
    generalLedger: renderGeneralLedgerReport,
    profitLoss: renderProfitLossReport,
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      {/* Header - Hidden on print */}
      <div className="flex justify-between items-center mb-6" style={{ display: 'flex' }}>
        <style>{"@media print { .screen-only { display: none !important; } }"}</style>
        <div className="screen-only">
        <div>
          <h1 className="text-3xl font-bold">{getReportTitle()}</h1>
          <p className="text-muted-foreground">Period: {dateRange}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handlePrint} variant="outline" disabled={loading || !reportData}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button onClick={() => window.close()} variant="outline">
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
        </div>
        </div>
      </div>

      {/* Print Header - Visible only on print */}
      <div className="print-header" style={{ display: 'none' }}>
        <style>{"@media print { .print-header { display: block !important; margin-bottom: 24px; } }"}</style>
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold">POS System</h1>
          <h2 className="text-xl">{getReportTitle()}</h2>
          <p className="text-sm text-muted-foreground">Period: {dateRange}</p>
          <p className="text-sm text-muted-foreground">Generated on: {new Date().toLocaleDateString()}</p>
        </div>
        <hr className="my-4" />
      </div>

      {/* Report Content */}
      <div className="max-w-7xl mx-auto">
        {reportComponents[reportType] ? reportComponents[reportType]() : <div>No report available</div>}
      </div>

      {/* Footer - Visible only on print */}
      <div className="print-footer" style={{ display: 'none' }}>
        <style>{"@media print { .print-footer { display: block !important; margin-top: 32px; padding-top: 16px; border-top: 1px solid #ddd; text-align: center; font-size: 12px; color: #888; } }"}</style>
        <p>Powered by Factssolution, All Rights Reserved 2025-2026</p>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            visibility: visible !important;
            background: white !important;
          }
          /* Hide screen-only elements */
          .screen-only {
            display: none !important;
          }
          /* Show print-specific elements */
          .print-header,
          .print-footer {
            display: block !important;
          }
          /* CRITICAL: Ensure all content is visible when printing */
          .min-h-screen {
            min-height: auto !important;
            height: auto !important;
          }
          .bg-background {
            background: white !important;
          }
          .max-w-7xl {
            max-width: 100% !important;
            width: 100% !important;
          }
          /* Force visibility of all content elements */
          div, section, article, main {
            visibility: visible !important;
          }
          table {
            display: table !important;
            width: 100% !important;
            border-collapse: collapse !important;
          }
          tr {
            display: table-row !important;
          }
          thead {
            display: table-header-group !important;
          }
          tbody {
            display: table-row-group !important;
          }
          td, th {
            display: table-cell !important;
            border: 1px solid #ddd !important;
            padding: 8px !important;
          }
          /* Hide only buttons */
          button, .no-print {
            display: none !important;
          }
          /* Ensure cards and content blocks are visible */
          [class*="card"], [class*="Card"] {
            display: block !important;
            page-break-inside: avoid !important;
          }
          @page {
            margin: 1.5cm;
            size: auto;
          }
        }
      `}</style>
    </div>
  );
}
