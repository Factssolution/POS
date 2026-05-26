import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Download, FileText, TrendingUp, Users, Truck, DollarSign, FileDown, ShoppingBag, BarChart3, Wallet } from 'lucide-react';
import { DatePicker } from './ui/date-picker';
import { toast } from 'sonner';
import { api } from '../services/api';

const pieChartColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

// ============================================================
// PROFESSIONAL PDF TEMPLATE SYSTEM
// ============================================================

const generateProfessionalPDFHeader = (reportTitle: string, dateRange: string, companyName: string = 'POS System', companyLogo: string = '') => {
  const periodLabel = dateRange === 'week' ? 'This Week' : 
                      dateRange === 'month' ? 'This Month' : 
                      dateRange === 'quarter' ? 'This Quarter' : 'This Year';
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const formattedTime = currentDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  
  // Logo HTML - use image if available, otherwise fallback to text
  const logoHTML = companyLogo 
    ? `<img src="${companyLogo}" alt="Company Logo" style="width: 80px; height: 80px; object-fit: contain; background: white; border-radius: 12px; padding: 10px;" />`
    : `<div style="width: 80px; height: 80px; background: white; border-radius: 12px; padding: 10px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #424242; font-size: 24px;">∞</div>`;
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${reportTitle} - ${companyName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 0; background: white; color: #1a1a1a; line-height: 1.6; }
    .pdf-header { background: linear-gradient(135deg, #424242 0%, #616161 100%); color: white; padding: 30px 40px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
    .pdf-header-left { display: flex; align-items: center; gap: 20px; }
    .pdf-brand h1 { font-size: 32px; font-weight: 700; margin-bottom: 5px; }
    .pdf-brand .tagline { font-size: 14px; opacity: 0.9; margin-bottom: 3px; }
    .pdf-brand .powered { font-size: 12px; opacity: 0.8; font-style: italic; }
    .pdf-header-right { text-align: right; }
    .pdf-header-right h2 { font-size: 24px; font-weight: 600; margin-bottom: 8px; }
    .pdf-header-right p { font-size: 13px; opacity: 0.9; margin-bottom: 4px; }
    .pdf-content { padding: 0 40px 40px 40px; }
    .section-heading { font-size: 20px; font-weight: 600; color: #424242; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #e0e0e0; }
    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 25px; }
    .metric-card { background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%); border: 2px solid #757575; border-radius: 12px; padding: 20px; position: relative; }
    .metric-card::before { content: ''; position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: #757575; }
    .metric-label { font-size: 13px; color: #666; margin-bottom: 8px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
    .metric-value { font-size: 28px; font-weight: 700; color: #424242; line-height: 1.2; }
    .data-table { width: 100%; border-collapse: separate; border-spacing: 0; margin-top: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden; }
    .data-table thead { background: linear-gradient(135deg, #424242 0%, #616161 100%); color: white; }
    .data-table th { padding: 14px 16px; text-align: left; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; border: none; }
    .data-table tbody tr { background: white; }
    .data-table tbody tr:nth-child(even) { background: #f8f9fa; }
    .data-table td { padding: 12px 16px; font-size: 14px; border-bottom: 1px solid #e0e0e0; }
    .text-success { color: #2e7d32; font-weight: 600; }
    .text-danger { color: #c62828; font-weight: 600; }
    .text-right { text-align: right; }
    .page-break { page-break-before: auto; margin-top: 30px; padding-top: 20px; border-top: 2px solid #E0E0E0; }
    .page-header { display: flex; justify-content: flex-end; margin-bottom: 10px; }
    .page-number { font-size: 12px; color: #666; font-weight: 600; }
    .pdf-footer { margin-top: 50px; padding: 25px 40px; background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%); border-top: 2px solid #424242; display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #666; }
    @media print { 
      .pdf-header, .data-table thead, .metric-card, .pdf-footer { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page-break { page-break-before: auto; page-break-inside: avoid; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; page-break-after: auto; }
      thead { display: table-header-group; }
    }
  </style>
</head>
<body>
  <div class="pdf-header">
    <div class="pdf-header-left">
      ${logoHTML}
      <div class="pdf-brand">
        <h1>${companyName}</h1>
        <div class="tagline">Professional POS Business System</div>
        <div class="powered">Powered by Factssolution</div>
      </div>
    </div>
    <div class="pdf-header-right">
      <h2>${reportTitle}</h2>
      <p>Generated: ${formattedDate}</p>
      <p>Time: ${formattedTime}</p>
      <p>Period: ${periodLabel}</p>
    </div>
  </div>
  <div class="pdf-content">`;
};

const generateProfessionalPDFFooter = (companyName: string = 'POS System') => {
  return `</div>
  <div class="pdf-footer">
    <div class="footer-left">© 2025-2026 ${companyName}. All Rights Reserved.</div>
    <div class="footer-center">Powered by Factssolution</div>
    <div class="footer-right">Confidential Business Report</div>
  </div>
</body>
</html>`;
};

// Helper function to generate paginated table HTML for PDF
const generatePaginatedTable = (data: any[], columns: { header: string; render: (row: any) => string }[], rowsPerPage: number = 50) => {
  const totalPages = Math.ceil(data.length / rowsPerPage);
  let html = '';

  for (let page = 0; page < totalPages; page++) {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    const pageData = data.slice(start, end);

    if (page > 0) {
      html += `<div class="page-break"></div>`;
    }

    html += `
      <div class="page-header">
        <div class="page-number">Page ${page + 1} of ${totalPages}</div>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            ${columns.map(col => `<th>${col.header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${pageData.map(row => `
            <tr>
              ${columns.map(col => `<td>${col.render(row)}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  return html;
};

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function Reports() {
  const [reportType, setReportType] = useState('sales');
  const [dateRange, setDateRange] = useState('month');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('all');
  const [supplierList, setSupplierList] = useState<any[]>([]);
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]); // Empty by default - user must select
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
  
  // Credit/Debit report specific filter
  const [creditDebitSupplierFilter, setCreditDebitSupplierFilter] = useState<string>('all');
  const [showCreditDebitSupplierDropdown, setShowCreditDebitSupplierDropdown] = useState(false);
  const [creditDebitSupplierSearchTerm, setCreditDebitSupplierSearchTerm] = useState('');
  
  // General Ledger report specific filter
  const [ledgerSupplierFilter, setLedgerSupplierFilter] = useState<string>('all');
  const [showLedgerSupplierDropdown, setShowLedgerSupplierDropdown] = useState(false);
  const [ledgerSupplierSearchTerm, setLedgerSupplierSearchTerm] = useState('');
  const [summaryStatsState, setSummaryStatsState] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0
  });
  
  // Company settings state
  const [companySettings, setCompanySettings] = useState({
    name: 'POS System',
    logo: ''
  });

  // Report titles mapping
  const reportTitles: Record<string, string> = {
    sales: 'Sales Report',
    customer: 'Customer Report',
    supplier: 'Supplier Report',
    employee: 'Employee Report',
    creditDebit: 'Credit & Debit Report',
    generalLedger: 'General Ledger Report',
    expense: 'Expense Report',
    profitLoss: 'Profit & Loss Report'
  };

  // Fetch company settings on mount
  useEffect(() => {
    const fetchCompanySettings = async () => {
      try {
        const settings = await api.getSettings();
        setCompanySettings({
          name: settings.company_name || 'POS System',
          logo: settings.company_logo || ''
        });
        console.log('✅ Company settings loaded:', settings.company_name);
      } catch (error) {
        console.error('Failed to load company settings:', error);
        // Keep default values
      }
    };
    fetchCompanySettings();
  }, []);

  // Fetch supplier list when supplier report is selected
  useEffect(() => {
    const fetchSupplierList = async () => {
      if (reportType !== 'supplier' && reportType !== 'creditDebit' && reportType !== 'generalLedger') return;
      
      try {
        console.log('🔄 Fetching supplier list...');
        const response = await api.getSupplierReport({});
        console.log('📦 Supplier API Response:', response);
        
        // API returns { success: true, data: { suppliers: [...] } }
        const suppliers = response?.data?.suppliers || response?.suppliers || [];
        
        if (suppliers.length > 0) {
          setSupplierList(suppliers);
          console.log('✅ Supplier list loaded:', suppliers.length, suppliers.map(s => ({ id: s.id, name: s.name })));
        } else {
          console.warn('️ No suppliers found in response');
        }
      } catch (error) {
        console.error(' Failed to fetch supplier list:', error);
      }
    };
    fetchSupplierList();
  }, [reportType]);

  // Close supplier dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.relative')) {
        setShowSupplierDropdown(false);
        setShowCreditDebitSupplierDropdown(false);
        setShowLedgerSupplierDropdown(false);
      }
    };
    
    if (showSupplierDropdown || showCreditDebitSupplierDropdown || showLedgerSupplierDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSupplierDropdown, showCreditDebitSupplierDropdown, showLedgerSupplierDropdown]);

  // Load report data from API
  const loadReportData = useCallback(async () => {
    setLoading(true);
    try {
      console.log('\n========== LOAD REPORT DATA ==========');
      console.log(' loadReportData - reportType:', reportType);
      console.log(' loadReportData - selectedSupplierIds:', selectedSupplierIds);
      console.log(' loadReportData - selectedSupplierIds.length:', selectedSupplierIds.length);
      console.log('=====================================\n');
      
      const today = new Date();
      let startDate: Date, endDate: Date;

      switch (dateRange) {
        case 'week':
          startDate = new Date(today);
          startDate.setDate(today.getDate() - 7);
          endDate = today;
          break;
        case 'month':
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          endDate = today;
          break;
        case 'quarter':
          const quarter = Math.floor(today.getMonth() / 3);
          startDate = new Date(today.getFullYear(), quarter * 3, 1);
          endDate = today;
          break;
        default:
          startDate = new Date(today.getFullYear(), 0, 1);
          endDate = today;
      }

      const startStr = startDate.toISOString().split('T')[0];
      const endStr = endDate.toISOString().split('T')[0];

      console.log(` Loading ${reportType} report: ${startStr} to ${endStr}`);

      let response;
      switch (reportType) {
        case 'sales':
          response = await api.getSalesReport({ startDate: startStr, endDate: endStr });
          console.log('📈 Sales Report API Response:', response);
          console.log('📈 dailySales:', response?.data?.dailySales || response?.dailySales);
          console.log('📈 dailySales length:', (response?.data?.dailySales || response?.dailySales)?.length);
          // Unwrap the data property if it exists
          setReportData(response?.data || response || {});
          console.log(' reportData after set:', response?.data || response);
          break;
        case 'customer':
          response = await api.getCustomerReport({ startDate: startStr, endDate: endStr });
          console.log('👥 Customer Report API Response:', response);
          console.log('👥 customers:', (response?.data?.customers || response?.customers)?.length);
          // Unwrap the data property if it exists
          setReportData(response?.data || response || {});
          break;
        case 'supplier':
          const supplierParams: any = { startDate: startStr, endDate: endStr };
          // Send selected supplier IDs (empty array = all suppliers)
          if (selectedSupplierIds.length > 0) {
            supplierParams.supplierIds = selectedSupplierIds.join(',');
            console.log('🔍 FRONTEND - Filtering by supplier IDs:', selectedSupplierIds);
            console.log('🔍 FRONTEND - Sending params:', supplierParams);
          } else {
            console.log('📦 FRONTEND - No filter - fetching all suppliers');
          }
          response = await api.getSupplierReport(supplierParams);
          console.log('📦 SUPPLIER API RESPONSE:', response);
          console.log('📦 suppliers count:', (response?.data?.suppliers || response?.suppliers)?.length);
          console.log('📦 suppliers data:', (response?.data?.suppliers || response?.suppliers || []).map(s => ({ id: s.id, name: s.name })));
          // Unwrap the data property if it exists
          setReportData(response?.data || response || {});
          break;
        case 'employee':
          response = await api.getEmployeeReport({ startDate: startStr, endDate: endStr });
          console.log('👨‍💼 Employee Report API Response:', response);
          console.log('👨‍💼 employees:', (response?.data?.employees || response?.employees)?.length);
          // Unwrap the data property if it exists
          setReportData(response?.data || response || {});
          break;
        case 'creditDebit':
          const creditDebitParams: any = { startDate: startStr, endDate: endStr };
          // Add supplier filter if selected
          if (creditDebitSupplierFilter && creditDebitSupplierFilter !== 'all') {
            creditDebitParams.supplier_id = creditDebitSupplierFilter;
            console.log('💳 Credit/Debit - Filtering by supplier ID:', creditDebitSupplierFilter);
          } else {
            console.log('💳 Credit/Debit - No supplier filter - fetching all');
          }
          response = await api.getTransactionReport(creditDebitParams);
          console.log('💳 Credit/Debit API Response:', response);
          console.log(' transactions:', (response?.data?.transactions || response?.transactions)?.length);
          // Unwrap the data property if it exists
          setReportData(response?.data || response || {});
          break;
        case 'generalLedger':
          const ledgerParams: any = { startDate: startStr, endDate: endStr };
          // Add supplier filter if selected
          if (ledgerSupplierFilter && ledgerSupplierFilter !== 'all') {
            ledgerParams.supplier_id = ledgerSupplierFilter;
            console.log('📒 General Ledger - Filtering by supplier ID:', ledgerSupplierFilter);
          } else {
            console.log('📒 General Ledger - No supplier filter - fetching all');
          }
          response = await api.getTransactionReport(ledgerParams);
          console.log('📒 Ledger API Response:', response);
          const ledgerData = response?.data || response;
          console.log('📒 transactions:', ledgerData?.transactions?.length);
          console.log('📒 totalCredit:', ledgerData?.totalCredit);
          console.log('📒 totalDebit:', ledgerData?.totalDebit);
          console.log('📒 openingBalance:', ledgerData?.openingBalance);
          console.log(' closingBalance:', ledgerData?.closingBalance);
          console.log('📒 avgTransactionValue:', ledgerData?.avgTransactionValue);
          setReportData({
            ledger: ledgerData?.transactions || [],
            sales: {},
            summary: {
              totalCredit: ledgerData?.totalCredit || 0,
              totalDebit: ledgerData?.totalDebit || 0,
              netBalance: ledgerData?.netBalance || 0,
              totalTransactions: ledgerData?.totalTransactions || 0,
              openingBalance: ledgerData?.openingBalance || 0,
              closingBalance: ledgerData?.closingBalance || 0,
              avgTransactionValue: ledgerData?.avgTransactionValue || 0,
              largestCredit: ledgerData?.largestCredit || 0,
              largestDebit: ledgerData?.largestDebit || 0,
              creditToDebitRatio: ledgerData?.creditToDebitRatio || 0
            }
          });
          break;
        case 'expense':
          const expenseResponse = await api.getExpenses({
            startDate: startStr,
            endDate: endStr,
            sortBy: 'expense_date',
            sortOrder: 'DESC'
          });
          console.log('💰 Expense Report API Response:', expenseResponse);
          setReportData(expenseResponse || {});
          break;
        case 'profitLoss':
          // Fetch sales data
          const plSalesResponse = await api.getSalesReport({ startDate: startStr, endDate: endStr });
          console.log('💰 Profit/Loss Sales API Response:', plSalesResponse);
          
          // Fetch expense data
          const plExpenseResponse = await api.getExpenses({ startDate: startStr, endDate: endStr });
          console.log('💰 Profit/Loss Expenses API Response:', plExpenseResponse);
          
          const plData = plSalesResponse?.data || plSalesResponse;
          const plExpenseData = plExpenseResponse?.data || plExpenseResponse;
          
          console.log('💰 dailySales:', plData?.dailySales?.length);
          console.log('💰 expenses:', plExpenseData?.expenses?.length);
          
          // Combine sales and expense data
          setReportData({
            ...plData,
            expenses: plExpenseData?.expenses || [],
            expenseSummary: plExpenseData?.summary || {}
          });
          break;
        default:
          setReportData(null);
      }

      console.log('✅ Final reportData state will be:', response);

      toast.success(`${reportTitles[reportType]} loaded successfully`);
    } catch (error: any) {
      console.error('Failed to load report:', error);
      toast.error(error.message || 'Failed to load report');
      setReportData(null);
    } finally {
      setLoading(false);
    }
  }, [reportType, dateRange, selectedSupplierIds, creditDebitSupplierFilter, ledgerSupplierFilter]);

  // Auto-load when report type or date range changes
  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  // Calculate summary statistics
  const calculateSummaryStats = useCallback(() => {
    if (!reportData) return;

    try {
      let totalRevenue = 0;
      let totalOrders = 0;
      let totalCustomers = 0;
      let totalProducts = 0;

      switch (reportType) {
        case 'sales':
          totalRevenue = reportData.dailySales?.reduce((sum: number, day: any) => sum + (day.revenue || 0), 0) || 0;
          totalOrders = reportData.dailySales?.reduce((sum: number, day: any) => sum + (day.orders || 0), 0) || 0;
          // Calculate unique customers from orders if available
          totalCustomers = reportData.orders ? new Set(reportData.orders.map((o: any) => o.customer_phone).filter(Boolean)).size : 0;
          totalProducts = reportData.productSales?.length || 0;
          break;
        case 'customer':
          totalCustomers = reportData.customers?.length || 0;
          totalRevenue = reportData.summary?.totalRevenue || 0;
          // Calculate total orders from all customers
          totalOrders = reportData.customers ? reportData.customers.reduce((sum: number, c: any) => sum + (c.totalOrders || 0), 0) : 0;
          console.log(' Customer Report - Total Orders Calculation:', {
            customersCount: reportData.customers?.length,
            totalOrders: totalOrders,
            sampleCustomer: reportData.customers?.[0] ? {
              name: reportData.customers[0].name,
              totalOrders: reportData.customers[0].totalOrders
            } : null
          });
          totalProducts = 0; // Not applicable for customer report
          break;
        case 'supplier':
          totalRevenue = reportData.summary?.totalPurchases || 0;
          totalCustomers = reportData.suppliers?.length || 0; // Show supplier count
          // Calculate total transactions from all suppliers using transactionCount field
          totalOrders = reportData.suppliers ? reportData.suppliers.reduce((sum: number, s: any) => sum + (s.transactionCount || 0), 0) : 0;
          // Calculate outstanding balance
          totalProducts = reportData.suppliers ? reportData.suppliers.reduce((sum: number, s: any) => sum + (s.outstanding || s.outstandingBalance || 0), 0) : 0;
          console.log(' Supplier Report Calculation:', {
            totalPurchases: totalRevenue,
            totalTransactions: totalOrders,
            outstandingBalance: totalProducts,
            suppliersCount: reportData.suppliers?.length,
            sampleSupplier: reportData.suppliers?.[0] ? {
              name: reportData.suppliers[0].name,
              transactionCount: reportData.suppliers[0].transactionCount,
              outstanding: reportData.suppliers[0].outstanding
            } : null
          });
          break;
        case 'employee':
          totalRevenue = reportData.summary?.totalSales || 0;
          totalOrders = reportData.summary?.totalOrders || 0;
          totalCustomers = reportData.employees?.length || 0; // Show employee count
          totalProducts = 0;
          break;
        case 'creditDebit':
          // For Credit/Debit report, calculate from transactions
          const creditDebitTransactions = reportData?.transactions || [];
          totalRevenue = creditDebitTransactions
            .filter((t: any) => t.type === 'credit')
            .reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0);
          totalOrders = creditDebitTransactions
            .filter((t: any) => t.type === 'debit')
            .reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0);
          totalCustomers = creditDebitTransactions.length; // Show total transaction count
          totalProducts = 0;
          console.log(' Credit/Debit Report Calculation:', {
            totalCredit: totalRevenue,
            totalDebit: totalOrders,
            netBalance: totalRevenue - totalOrders,
            totalTransactions: totalCustomers
          });
          break;
        case 'generalLedger':
          // For General Ledger report, calculate from transactions (same as Credit/Debit)
          const ledgerTransactions = reportData?.ledger || [];
          totalRevenue = ledgerTransactions
            .filter((t: any) => t.type === 'credit')
            .reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0);
          totalOrders = ledgerTransactions
            .filter((t: any) => t.type === 'debit')
            .reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0);
          totalCustomers = ledgerTransactions.length; // Show total transaction count
          totalProducts = 0;
          console.log('📒 General Ledger Report Calculation:', {
            totalCredit: totalRevenue,
            totalDebit: totalOrders,
            netBalance: totalRevenue - totalOrders,
            totalTransactions: totalCustomers
          });
          break;
        case 'expense':
          // For Expense report, calculate from expenses
          const expenseList = reportData?.expenses || [];
          totalRevenue = expenseList
            .reduce((sum: number, exp: any) => sum + parseFloat(exp.amount || 0), 0);
          totalOrders = expenseList.length;
          totalCustomers = 0;
          totalProducts = 0;
          console.log('💰 Expense Report Calculation:', {
            totalExpenses: totalRevenue,
            totalTransactions: totalOrders
          });
          break;
        case 'profitLoss':
          // Calculate revenue from sales
          totalRevenue = reportData.dailySales?.reduce((sum: number, day: any) => sum + (day.revenue || 0), 0) || 0;
          totalOrders = reportData.dailySales?.reduce((sum: number, day: any) => sum + (day.orders || 0), 0) || 0;
          
          // Calculate expenses for summary
          const plExpenses = reportData.expenses || [];
          const totalExpenses = plExpenses.reduce((sum: number, exp: any) => sum + parseFloat(exp.amount || 0), 0);
          const netProfit = totalRevenue - totalExpenses;
          
          // Store in summary stats (using totalCustomers for netProfit, totalProducts for expense count)
          totalCustomers = netProfit;
          totalProducts = plExpenses.length;
          
          console.log('💰 Profit/Loss Summary Stats:', {
            totalRevenue,
            totalOrders,
            totalExpenses,
            netProfit,
            expenseCount: plExpenses.length
          });
          break;
      }

      setSummaryStatsState({ totalRevenue, totalOrders, totalCustomers, totalProducts });
      console.log('✅ Summary stats calculated:', { totalRevenue, totalOrders, totalCustomers });
    } catch (error) {
      console.error('Error calculating summary stats:', error);
    }
  }, [reportData, reportType]);

  useEffect(() => {
    if (reportData) {
      calculateSummaryStats();
    }
  }, [reportData, calculateSummaryStats]);

  // ============================================================
  // PDF EXPORT - PROFESSIONAL TEMPLATE
  // ============================================================
  const downloadPDF = () => {
    if (loading || !reportData) {
      toast.error('Please wait for report data to load before exporting PDF');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Pop-up blocked! Please allow pop-ups for this site.');
      return;
    }

    const reportTitle = reportTitles[reportType] || 'Report';
    let htmlContent = generateProfessionalPDFHeader(reportTitle, dateRange, companySettings.name, companySettings.logo);

    // Report-specific content generation
    if (!reportData) {
      htmlContent += `<p style="text-align: center; padding: 40px; color: #666;">No data available for this report.</p>`;
    } else {
      switch (reportType) {
        case 'sales': {
          const totalRevenue = reportData.dailySales?.reduce((sum: number, day: any) => sum + (day.revenue || 0), 0) || 0;
          const totalOrders = reportData.dailySales?.reduce((sum: number, day: any) => sum + (day.orders || 0), 0) || 0;
          const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
          const uniqueCustomers = reportData.orders ? new Set(reportData.orders.map((o: any) => o.customer_phone).filter(Boolean)).size : 0;
          const productSales = reportData.productSales || [];

          htmlContent += `
            <div class="section-heading">Sales Summary</div>
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-label">Total Revenue</div>
                <div class="metric-value">Rs ${Math.round(totalRevenue).toLocaleString()}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Total Orders</div>
                <div class="metric-value">${totalOrders}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Unique Customers</div>
                <div class="metric-value">${uniqueCustomers}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Active Days</div>
                <div class="metric-value">${reportData.dailySales?.length || 0}</div>
              </div>
            </div>`;

          // Daily Sales Breakdown
          if (reportData.dailySales && reportData.dailySales.length > 0) {
            htmlContent += `
              <div class="section-heading" style="margin-top: 30px;">Daily Sales Breakdown</div>
              <table class="data-table">
                <thead>
                  <tr>
                    <th style="text-align: left;">Date</th>
                    <th style="text-align: right;">Orders</th>
                    <th style="text-align: right;">Revenue</th>
                    <th style="text-align: right;">Avg Order Value</th>
                  </tr>
                </thead>
                <tbody>
                  ${reportData.dailySales.map((day: any) => `
                    <tr>
                      <td style="text-align: left; font-weight: 600;">${new Date(day.date).toLocaleDateString('en-GB')}</td>
                      <td style="text-align: right;">${day.orders}</td>
                      <td style="text-align: right; font-weight: 600; color: #424242;">Rs ${day.revenue.toLocaleString()}</td>
                      <td style="text-align: right;">Rs ${day.orders > 0 ? Math.round(day.revenue / day.orders).toLocaleString() : 0}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>`;
          }

          // Top Products
          if (productSales.length > 0) {
            console.log(' Product Sales Data:', productSales.slice(0, 3));
            htmlContent += `
              <div class="page-break"></div>
              <div class="section-heading">Top Selling Products</div>
              <table class="data-table">
                <thead>
                  <tr>
                    <th style="text-align: left;">#</th>
                    <th style="text-align: left;">Product Name</th>
                    <th style="text-align: right;">Quantity Sold</th>
                    <th style="text-align: right;">Total Revenue</th>
                    <th style="text-align: right;">Avg Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${productSales.slice(0, 20).map((product: any, idx: number) => `
                    <tr>
                      <td style="text-align: left;">${idx + 1}</td>
                      <td style="text-align: left; font-weight: 600;">${product.product_name || product.name || 'Unknown Product'}</td>
                      <td style="text-align: right;">${product.quantity || 0}</td>
                      <td style="text-align: right; font-weight: 600; color: #424242;">Rs ${Math.round(product.revenue || 0).toLocaleString()}</td>
                      <td style="text-align: right;">Rs ${product.quantity > 0 ? Math.round((product.revenue || 0) / product.quantity).toLocaleString() : 0}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>`;
          }

          // Payment Method Summary
          if (reportData.orders && reportData.orders.length > 0) {
            const paymentMethods: any = {};
            reportData.orders.forEach((order: any) => {
              const method = order.payment_method || 'unknown';
              paymentMethods[method] = (paymentMethods[method] || 0) + 1;
            });

            htmlContent += `
              <div class="page-break"></div>
              <div class="section-heading">Payment Method Summary</div>
              <div class="metrics-grid">
                ${Object.entries(paymentMethods).map(([method, count]) => `
                  <div class="metric-card">
                    <div class="metric-label">${method.charAt(0).toUpperCase() + method.slice(1)}</div>
                    <div class="metric-value">${count} orders</div>
                  </div>
                `).join('')}
              </div>`;
          }

          // Recent Orders Detail
          if (reportData.orders && reportData.orders.length > 0) {
            console.log(' Orders Data (first 3):', reportData.orders.slice(0, 3).map(o => ({
              token: o.token_number,
              cashier: o.cashier?.name,
              customer: o.customer_name
            })));
            const recentOrders = reportData.orders.slice(0, 50);
            htmlContent += `
              <div class="page-break"></div>
              <div class="section-heading">Recent Orders Detail (${reportData.orders.length} total orders)</div>`;
            
            const totalPages = Math.ceil(recentOrders.length / 50);
            for (let page = 0; page < totalPages; page++) {
              const start = page * 50;
              const end = start + 50;
              const pageOrders = recentOrders.slice(start, end);

              if (page > 0) {
                htmlContent += `<div class="page-break"></div>`;
              }

              htmlContent += `
                <div class="page-header">
                  <div class="page-number">Page ${page + 1} of ${totalPages}</div>
                </div>
                <table class="data-table">
                  <thead>
                    <tr>
                      <th style="text-align: left;">#</th>
                      <th style="text-align: left;">Token</th>
                      <th style="text-align: left;">Customer</th>
                      <th style="text-align: left;">Phone</th>
                      <th style="text-align: right;">Items</th>
                      <th style="text-align: right;">Total</th>
                      <th style="text-align: left;">Payment</th>
                      <th style="text-align: left;">Cashier</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${pageOrders.map((order: any, idx: number) => `
                      <tr>
                        <td style="text-align: left;">${start + idx + 1}</td>
                        <td style="text-align: left; font-weight: 600;">#${order.token_number || order.id}</td>
                        <td style="text-align: left;">${order.customer_name || 'Walk-in'}</td>
                        <td style="text-align: left;">${order.customer_phone || 'N/A'}</td>
                        <td style="text-align: right;">${order.items?.length || 0}</td>
                        <td style="text-align: right; font-weight: 600; color: #424242;">Rs ${Math.round(order.total_amount || 0).toLocaleString()}</td>
                        <td style="text-align: left;">${(order.payment_method || 'cash').charAt(0).toUpperCase() + (order.payment_method || 'cash').slice(1)}</td>
                        <td style="text-align: left;">${order.cashier?.name || 'N/A'}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>`;
            }
          }
          break;
        }

        case 'customer': {
          const customers = reportData.customers || [];
          const summary = reportData.summary || {};

          // Summary Metrics
          htmlContent += `
            <div class="section-heading">Customer Summary</div>
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-label">Total Customers</div>
                <div class="metric-value">${customers.length}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Total Revenue</div>
                <div class="metric-value">Rs ${(summary.totalRevenue || 0).toFixed(2)}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Avg Customer Value</div>
                <div class="metric-value">Rs ${customers.length > 0 ? ((summary.totalRevenue || 0) / customers.length).toFixed(2) : '0.00'}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Active Customers</div>
                <div class="metric-value">${customers.filter((c: any) => c.totalOrders > 0).length}</div>
              </div>
            </div>`;

          // Additional Metrics
          const totalOrders = customers.reduce((sum: number, c: any) => sum + (c.totalOrders || 0), 0);
          const totalVisits = customers.reduce((sum: number, c: any) => sum + (c.totalVisits || 0), 0);
          const avgOrderValue = totalOrders > 0 ? (summary.totalRevenue || 0) / totalOrders : 0;

          htmlContent += `
            <div style="margin-top: 20px; padding: 15px; background: #F5F5F5; border-radius: 8px; font-size: 13px;">
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
                <div>
                  <span style="color: #757575;">Total Orders:</span>
                  <strong style="margin-left: 8px;">${totalOrders}</strong>
                </div>
                <div>
                  <span style="color: #757575;">Total Visits:</span>
                  <strong style="margin-left: 8px;">${totalVisits}</strong>
                </div>
                <div>
                  <span style="color: #757575;">Avg Order Value:</span>
                  <strong style="margin-left: 8px;">Rs ${avgOrderValue.toFixed(2)}</strong>
                </div>
              </div>
            </div>
          `;

          // Add complete customer details with pagination
          if (customers.length > 0) {
            htmlContent += `
              <div class="page-break">
                <div class="section-heading">Customer Details (${customers.length} customers)</div>`;
            
            const totalPages = Math.ceil(customers.length / 50);
            
            for (let page = 0; page < totalPages; page++) {
              const start = page * 50;
              const end = start + 50;
              const pageCustomers = customers.slice(start, end);

              if (page > 0) {
                htmlContent += `<div class="page-break"></div>`;
              }

              htmlContent += `
                <table class="data-table">
                  <thead>
                    <tr>
                      <th style="text-align: left;">#</th>
                      <th style="text-align: left;">Customer Name</th>
                      <th style="text-align: left;">Phone</th>
                      <th style="text-align: right;">Total Visits</th>
                      <th style="text-align: right;">Total Orders</th>
                      <th style="text-align: right;">Total Spent</th>
                      <th style="text-align: right;">Avg Order</th>
                      <th style="text-align: left;">Last Visit</th>
                    </tr>
                  </thead>
                  <tbody>`;

              pageCustomers.forEach((customer: any, idx: number) => {
                // Format last visit date
                let lastVisitFormatted = 'N/A';
                if (customer.lastVisit) {
                  try {
                    const date = new Date(customer.lastVisit);
                    if (!isNaN(date.getTime())) {
                      lastVisitFormatted = date.toLocaleDateString('en-GB');
                    }
                  } catch (e) {
                    lastVisitFormatted = 'N/A';
                  }
                }
                
                htmlContent += `
                    <tr>
                      <td style="text-align: left;">${start + idx + 1}</td>
                      <td style="text-align: left; font-weight: 600;">${customer.name || 'Walk-in Customer'}</td>
                      <td style="text-align: left;">${customer.phone || 'N/A'}</td>
                      <td style="text-align: right;">${customer.totalVisits || 0}</td>
                      <td style="text-align: right;">${customer.totalOrders || 0}</td>
                      <td style="text-align: right; font-weight: 600; color: #424242;">Rs ${(customer.totalSpent || 0).toFixed(2)}</td>
                      <td style="text-align: right;">Rs ${customer.totalOrders > 0 ? ((customer.totalSpent || 0) / customer.totalOrders).toFixed(2) : '0.00'}</td>
                      <td style="text-align: left;">${lastVisitFormatted}</td>
                    </tr>`;
              });

              htmlContent += `
                  </tbody>
                </table>`;
            }
            htmlContent += `</div>`;
          }

          // Report Information & Signature Section
          const generatedBy = 'System Administrator';
          const periodLabel = dateRange === 'week' ? 'This Week' : 
                              dateRange === 'month' ? 'This Month' : 
                              dateRange === 'quarter' ? 'This Quarter' : 'This Year';
          
          htmlContent += `
            <div class="page-break">
              <div class="section-heading">Report Information & Verification</div>
              <div style="background: #FAFAFA; padding: 20px; border-left: 4px solid #424242; margin-bottom: 30px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 14px;">
                  <div>
                    <div style="color: #757575; margin-bottom: 5px;">Generated By</div>
                    <div style="font-weight: 600;">${generatedBy}</div>
                  </div>
                  <div>
                    <div style="color: #757575; margin-bottom: 5px;">Report Period</div>
                    <div style="font-weight: 600;">${periodLabel}</div>
                  </div>
                  <div>
                    <div style="color: #757575; margin-bottom: 5px;">Total Customers</div>
                    <div style="font-weight: 600;">${customers.length}</div>
                  </div>
                  <div>
                    <div style="color: #757575; margin-bottom: 5px;">Active Customers</div>
                    <div style="font-weight: 600;">${customers.filter((c: any) => c.totalOrders > 0).length}</div>
                  </div>
                  <div>
                    <div style="color: #757575; margin-bottom: 5px;">Total Revenue</div>
                    <div style="font-weight: 600; color: #388E3C;">Rs ${(summary.totalRevenue || 0).toFixed(2)}</div>
                  </div>
                  <div>
                    <div style="color: #757575; margin-bottom: 5px;">Avg Customer Value</div>
                    <div style="font-weight: 600; color: #1976D2;">Rs ${customers.length > 0 ? ((summary.totalRevenue || 0) / customers.length).toFixed(2) : '0.00'}</div>
                  </div>
                </div>
              </div>
              
              <div style="margin-top: 50px; padding-top: 20px; border-top: 2px solid #E0E0E0;">
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 40px; text-align: center;">
                  <div>
                    <div style="border-top: 2px solid #424242; padding-top: 10px; margin-top: 60px;">
                      <div style="font-weight: 600; color: #424242; margin-bottom: 5px;">Prepared By</div>
                      <div style="font-size: 12px; color: #757575;">System Administrator</div>
                    </div>
                  </div>
                  <div>
                    <div style="border-top: 2px solid #424242; padding-top: 10px; margin-top: 60px;">
                      <div style="font-weight: 600; color: #424242; margin-bottom: 5px;">Reviewed By</div>
                      <div style="font-size: 12px; color: #757575;">Manager</div>
                    </div>
                  </div>
                  <div>
                    <div style="border-top: 2px solid #424242; padding-top: 10px; margin-top: 60px;">
                      <div style="font-weight: 600; color: #424242; margin-bottom: 5px;">Approved By</div>
                      <div style="font-size: 12px; color: #757575;">Director</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div style="margin-top: 30px; padding: 15px; background: #FFF9C4; border-left: 4px solid #F57F17; border-radius: 4px;">
                <p style="font-size: 12px; color: #F57F17; margin: 0;">
                  <strong>Note:</strong> This is a system-generated report. All customer data is based on actual transactions recorded in the POS system.
                </p>
              </div>
            </div>
          `;

          break;
        }

        case 'employee': {
          const employees = reportData.employees || [];
          const summary = reportData.summary || {};

          htmlContent += `
            <div class="section-heading">Employee Performance Summary</div>
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-label">Total Employees</div>
                <div class="metric-value">${employees.length}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Total Sales</div>
                <div class="metric-value">Rs ${Math.round(summary.totalSales || 0).toLocaleString()}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Total Orders</div>
                <div class="metric-value">${summary.totalOrders || 0}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Avg Sales/Employee</div>
                <div class="metric-value">Rs ${employees.length > 0 ? Math.round((summary.totalSales || 0) / employees.length).toLocaleString() : 0}</div>
              </div>
            </div>`;

          // Add complete employee details with pagination
          if (employees.length > 0) {
            htmlContent += `
              <div class="section-heading" style="margin-top: 30px;">Employee Details (${employees.length} employees)</div>`;
            
            const totalPages = Math.ceil(employees.length / 50);
            
            for (let page = 0; page < totalPages; page++) {
              const start = page * 50;
              const end = start + 50;
              const pageEmployees = employees.slice(start, end);

              if (page > 0) {
                htmlContent += `<div class="page-break"></div>`;
              }

              htmlContent += `
                <div class="page-header">
                  <div class="page-number">Page ${page + 1} of ${totalPages}</div>
                </div>
                <table class="data-table">
                  <thead>
                    <tr>
                      <th style="text-align: left;">#</th>
                      <th style="text-align: left;">Employee Name</th>
                      <th style="text-align: left;">Role</th>
                      <th style="text-align: right;">Total Orders</th>
                      <th style="text-align: right;">Total Sales</th>
                      <th style="text-align: right;">Avg Order Value</th>
                    </tr>
                  </thead>
                  <tbody>`;

              pageEmployees.forEach((emp: any, idx: number) => {
                htmlContent += `
                    <tr>
                      <td style="text-align: left;">${start + idx + 1}</td>
                      <td style="text-align: left; font-weight: 600;">${emp.name || 'Unknown Employee'}</td>
                      <td style="text-align: left;">${(emp.role || 'Cashier').charAt(0).toUpperCase() + (emp.role || 'Cashier').slice(1)}</td>
                      <td style="text-align: right;">${emp.totalOrders || 0}</td>
                      <td style="text-align: right; font-weight: 600; color: #424242;">Rs ${Math.round(emp.totalSales || 0).toLocaleString()}</td>
                      <td style="text-align: right;">Rs ${emp.totalOrders > 0 ? Math.round((emp.totalSales || 0) / emp.totalOrders).toLocaleString() : 0}</td>
                    </tr>`;
              });

              htmlContent += `
                  </tbody>
                </table>`;
            }
          }
          break;
        }

        case 'supplier': {
          const suppliers = reportData.suppliers || [];
          const summary = reportData.summary || {};
          const totalPurchases = summary.totalPurchases || 0;
          const totalOutstanding = summary.totalOutstanding || suppliers.reduce((sum: number, s: any) => sum + (s.outstanding || 0), 0);
          // Calculate total paid (debit) from all suppliers
          const totalPaid = suppliers.reduce((sum: number, s: any) => sum + (s.totalDebit || 0), 0);
          // Payment Ratio = (Total Paid / Total Purchases) * 100
          const paymentRatio = totalPurchases > 0 ? ((totalPaid / totalPurchases) * 100).toFixed(1) : 0;
          
          // Determine if filtered by specific suppliers
          const isFiltered = selectedSupplierIds.length > 0;
          const filteredSupplierNames = isFiltered 
            ? suppliers.map(s => s.name).join(', ')
            : null;
          
          console.log(' PDF Supplier Data:', {
            isFiltered,
            selectedSupplierIds,
            suppliersCount: suppliers.length,
            supplierNames: suppliers.map(s => s.name)
          });

          htmlContent += `
            <div class="section-heading">Supplier Summary${isFiltered ? `<br/><span style="font-size: 14px; color: #666;">Filtered: ${filteredSupplierNames}</span>` : ''}</div>
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-label">Total Suppliers</div>
                <div class="metric-value">${suppliers.length}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Total Purchases</div>
                <div class="metric-value">Rs ${Math.round(totalPurchases).toLocaleString()}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Total Outstanding</div>
                <div class="metric-value">Rs ${Math.round(totalOutstanding).toLocaleString()}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Payment Ratio</div>
                <div class="metric-value">${paymentRatio}%</div>
              </div>
            </div>`;

          // Supplier Details Table
          if (suppliers.length > 0) {
            console.log(' Supplier PDF Data:', suppliers.slice(0, 2).map(s => ({
              name: s.name,
              totalCredit: s.totalCredit,
              totalDebit: s.totalDebit,
              outstanding: s.outstanding,
              transactionCount: s.transactionCount
            })));

            htmlContent += `
              <div class="page-break"></div>
              <div class="section-heading" style="margin-top: 30px;">Supplier Details (${suppliers.length} suppliers)</div>
              <table class="data-table">
                <thead>
                  <tr>
                    <th style="text-align: left;">#</th>
                    <th style="text-align: left;">Supplier Name</th>
                    <th style="text-align: left;">Contact</th>
                    <th style="text-align: right;">Total Purchases</th>
                    <th style="text-align: right;">Total Paid</th>
                    <th style="text-align: right;">Outstanding</th>
                    <th style="text-align: right;">Transactions</th>
                  </tr>
                </thead>
                <tbody>
                  ${suppliers.map((supplier: any, idx: number) => {
                    const totalPurchases = (supplier.totalCredit || 0) + (supplier.opening_balance || 0);
                    const totalPaid = supplier.totalDebit || 0;
                    const outstanding = supplier.outstanding || 0;
                    return `
                    <tr>
                      <td style="text-align: left;">${idx + 1}</td>
                      <td style="text-align: left; font-weight: 600;">${supplier.name || 'Unknown Supplier'}</td>
                      <td style="text-align: left;">${supplier.contact || 'N/A'}</td>
                      <td style="text-align: right; font-weight: 600; color: #424242;">Rs ${Math.round(totalPurchases).toLocaleString()}</td>
                      <td style="text-align: right;">Rs ${Math.round(totalPaid).toLocaleString()}</td>
                      <td style="text-align: right; font-weight: 600; color: ${outstanding > 0 ? '#D32F2F' : '#388E3C'};">Rs ${Math.round(outstanding).toLocaleString()}</td>
                      <td style="text-align: right;">${supplier.transactionCount || 0}</td>
                    </tr>`;
                  }).join('')}
                </tbody>
              </table>`;

            // Supplier Breakdown Section
            htmlContent += `
              <div class="page-break"></div>
              <div class="section-heading">Supplier Financial Breakdown</div>`;

            suppliers.forEach((supplier: any, idx: number) => {
              const totalPurchases = (supplier.totalCredit || 0) + (supplier.opening_balance || 0);
              const totalPaid = supplier.totalDebit || 0;
              const outstanding = supplier.outstanding || 0;
              const paymentRatio = totalPurchases > 0 ? ((totalPaid / totalPurchases) * 100).toFixed(1) : 0;

              htmlContent += `
                <div style="margin-top: 20px; padding: 15px; border: 1px solid #E0E0E0; border-radius: 8px;">
                  <div style="font-size: 16px; font-weight: bold; color: #424242; margin-bottom: 10px;">
                    ${idx + 1}. ${supplier.name || 'Unknown Supplier'}
                  </div>
                  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; font-size: 13px;">
                    <div>
                      <div style="color: #757575; margin-bottom: 4px;">Contact</div>
                      <div style="font-weight: 600;">${supplier.contact || 'N/A'}</div>
                    </div>
                    <div>
                      <div style="color: #757575; margin-bottom: 4px;">Email</div>
                      <div style="font-weight: 600;">${supplier.email || 'N/A'}</div>
                    </div>
                    <div>
                      <div style="color: #757575; margin-bottom: 4px;">Status</div>
                      <div style="font-weight: 600; color: ${supplier.status === 'active' ? '#388E3C' : '#D32F2F'};">${(supplier.status || 'active').charAt(0).toUpperCase() + (supplier.status || 'active').slice(1)}</div>
                    </div>
                  </div>
                  <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-top: 12px; padding-top: 12px; border-top: 1px solid #E0E0E0; font-size: 13px;">
                    <div>
                      <div style="color: #757575; margin-bottom: 4px;">Opening Balance</div>
                      <div style="font-weight: 600;">Rs ${Math.round(supplier.opening_balance || 0).toLocaleString()}</div>
                    </div>
                    <div>
                      <div style="color: #757575; margin-bottom: 4px;">Total Credit</div>
                      <div style="font-weight: 600; color: #D32F2F;">Rs ${Math.round(supplier.totalCredit || 0).toLocaleString()}</div>
                    </div>
                    <div>
                      <div style="color: #757575; margin-bottom: 4px;">Total Debit (Paid)</div>
                      <div style="font-weight: 600; color: #388E3C;">Rs ${Math.round(supplier.totalDebit || 0).toLocaleString()}</div>
                    </div>
                    <div>
                      <div style="color: #757575; margin-bottom: 4px;">Current Balance</div>
                      <div style="font-weight: 600; color: ${outstanding > 0 ? '#D32F2F' : '#388E3C'};">Rs ${Math.round(outstanding).toLocaleString()}</div>
                    </div>
                  </div>
                  <div style="margin-top: 10px; font-size: 12px; color: #757575;">
                    <span>Payment Ratio: <strong style="color: #424242;">${paymentRatio}%</strong></span>
                    <span style="margin-left: 20px;">Transactions: <strong style="color: #424242;">${supplier.transactionCount || 0}</strong></span>
                  </div>
                </div>`;
            });
          }
          break;
        }

        case 'creditDebit': {
          const transactions = reportData.transactions || [];
          const totalCredit = reportData.totalCredit || 0;
          const totalDebit = reportData.totalDebit || 0;
          const netBalance = reportData.netBalance || 0;
          const totalTransactions = reportData.totalTransactions || 0;
          
          // Get filtered supplier name if applicable
          const filteredSupplier = creditDebitSupplierFilter !== 'all' 
            ? supplierList.find(s => String(s.id) === creditDebitSupplierFilter)
            : null;
          const filterLabel = filteredSupplier ? ` - ${filteredSupplier.name}` : ' - All Suppliers';
          
          console.log(' Credit/Debit PDF Data:', {
            totalCredit,
            totalDebit,
            netBalance,
            totalTransactions,
            transactionsCount: transactions.length,
            filteredSupplier: filteredSupplier?.name || 'All'
          });

          // Calculate running balance per supplier for PDF
          const supplierBalances = {};
          transactions.forEach(t => {
            const supplierId = t.supplier_id;
            if (!supplierBalances[supplierId]) {
              supplierBalances[supplierId] = parseFloat(t.supplier?.opening_balance || 0);
            }
          });
          
          const transactionsWithBalance = transactions.map(t => {
            const supplierId = t.supplier_id;
            const amount = parseFloat(t.amount || 0);
            if (t.type === 'credit') {
              supplierBalances[supplierId] += amount;
            } else {
              supplierBalances[supplierId] -= amount;
            }
            return {
              ...t,
              running_balance: supplierBalances[supplierId]
            };
          });

          // Summary Metrics
          htmlContent += `
            <div class="section-heading">Credit & Debit Summary${filterLabel}</div>
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-label">Total Credit</div>
                <div class="metric-value" style="color: #388E3C;">Rs ${Math.round(totalCredit).toLocaleString()}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Total Debit</div>
                <div class="metric-value" style="color: #D32F2F;">Rs ${Math.round(totalDebit).toLocaleString()}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Net Balance</div>
                <div class="metric-value" style="color: ${netBalance >= 0 ? '#388E3C' : '#D32F2F'};">Rs ${Math.round(netBalance).toLocaleString()}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Total Transactions</div>
                <div class="metric-value">${totalTransactions}</div>
              </div>
            </div>`;

          // Complete Transaction Details Table with Running Balance and Pagination
          if (transactionsWithBalance.length > 0) {
            const totalPages = Math.ceil(transactionsWithBalance.length / 50);
            
            htmlContent += `
              <div class="page-break"></div>
              <div class="section-heading" style="margin-top: 30px;">Complete Transaction Ledger (${transactionsWithBalance.length} transactions)</div>`;
            
            for (let page = 0; page < totalPages; page++) {
              const start = page * 50;
              const end = start + 50;
              const pageTransactions = transactionsWithBalance.slice(start, end);

              if (page > 0) {
                htmlContent += `<div class="page-break"></div>`;
              }

              htmlContent += `
                <div class="page-header">
                  <div class="page-number">Page ${page + 1} of ${totalPages}</div>
                </div>
                <table class="data-table">
                  <thead>
                    <tr>
                      <th style="text-align: left;">#</th>
                      <th style="text-align: left;">Date</th>
                      <th style="text-align: left;">Time</th>
                      <th style="text-align: left;">Supplier</th>
                      <th style="text-align: left;">Type</th>
                      <th style="text-align: right;">Amount</th>
                      <th style="text-align: right;">Running Balance</th>
                      <th style="text-align: left;">Description</th>
                      <th style="text-align: left;">Recorded By</th>
                    </tr>
                  </thead>
                  <tbody>`;

              pageTransactions.forEach((t: any, idx: number) => {
                const amount = parseFloat(t.amount || 0);
                const isCredit = t.type === 'credit';
                const runningBal = t.running_balance || 0;
                const transactionDate = new Date(t.transaction_date);
                
                // Format time
                let formattedTime = 'N/A';
                if (t.transaction_time) {
                  try {
                    const timeStr = t.transaction_time.toString();
                    const timeParts = timeStr.split(':');
                    if (timeParts.length >= 2) {
                      const hours = parseInt(timeParts[0]);
                      const minutes = parseInt(timeParts[1]);
                      const period = hours >= 12 ? 'PM' : 'AM';
                      const displayHours = hours % 12 || 12;
                      const displayMinutes = minutes.toString().padStart(2, '0');
                      formattedTime = `${displayHours}:${displayMinutes} ${period}`;
                    }
                  } catch (error) {
                    formattedTime = 'N/A';
                  }
                }
                
                htmlContent += `
                    <tr>
                      <td style="text-align: left;">${start + idx + 1}</td>
                      <td style="text-align: left;">${transactionDate.toLocaleDateString('en-GB')}</td>
                      <td style="text-align: left; font-size: 12px; color: #666;">${formattedTime}</td>
                      <td style="text-align: left; font-weight: 600;">${t.supplier?.name || 'N/A'}</td>
                      <td style="text-align: left;">
                        <span style="background: ${isCredit ? '#E8F5E9' : '#FFEBEE'}; color: ${isCredit ? '#388E3C' : '#D32F2F'}; padding: 4px 12px; border-radius: 4px; font-weight: 600; font-size: 12px;">
                          ${isCredit ? '↑ CREDIT' : '↓ DEBIT'}
                        </span>
                      </td>
                      <td style="text-align: right; font-weight: 600; color: ${isCredit ? '#388E3C' : '#D32F2F'};">Rs ${Math.round(amount).toLocaleString()}</td>
                      <td style="text-align: right; font-weight: 700; color: ${runningBal >= 0 ? '#388E3C' : '#D32F2F'};">Rs ${Math.round(runningBal).toLocaleString()}</td>
                      <td style="text-align: left; color: #666;">${t.description || '-'}</td>
                      <td style="text-align: left; font-size: 12px; color: #757575;">${t.creator?.name || 'System'}</td>
                    </tr>`;
              });

              htmlContent += `
                  </tbody>
                </table>`;
            }

            // Summary by Supplier
            htmlContent += `
              <div class="page-break"></div>
              <div class="section-heading">Supplier-wise Breakdown</div>`;

            // Group transactions by supplier
            const supplierGroups: any = {};
            transactions.forEach((t: any) => {
              const supplierName = t.supplier?.name || 'Unknown';
              if (!supplierGroups[supplierName]) {
                supplierGroups[supplierName] = {
                  name: supplierName,
                  contact: t.supplier?.contact || 'N/A',
                  credit: 0,
                  debit: 0,
                  count: 0
                };
              }
              if (t.type === 'credit') {
                supplierGroups[supplierName].credit += parseFloat(t.amount || 0);
              } else {
                supplierGroups[supplierName].debit += parseFloat(t.amount || 0);
              }
              supplierGroups[supplierName].count++;
            });

            Object.values(supplierGroups).forEach((supplier: any, idx: number) => {
              const netBalance = supplier.credit - supplier.debit;
              htmlContent += `
                <div style="margin-top: 20px; padding: 15px; border: 1px solid #E0E0E0; border-radius: 8px; page-break-inside: avoid;">
                  <div style="font-size: 16px; font-weight: bold; color: #424242; margin-bottom: 10px;">
                    ${idx + 1}. ${supplier.name}
                  </div>
                  <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; font-size: 13px; margin-bottom: 12px;">
                    <div>
                      <div style="color: #757575; margin-bottom: 4px;">Contact</div>
                      <div style="font-weight: 600;">${supplier.contact}</div>
                    </div>
                    <div>
                      <div style="color: #757575; margin-bottom: 4px;">Total Transactions</div>
                      <div style="font-weight: 600;">${supplier.count}</div>
                    </div>
                  </div>
                  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; padding-top: 12px; border-top: 1px solid #E0E0E0; font-size: 13px;">
                    <div>
                      <div style="color: #757575; margin-bottom: 4px;">Total Credit</div>
                      <div style="font-weight: 600; color: #388E3C;">Rs ${Math.round(supplier.credit).toLocaleString()}</div>
                    </div>
                    <div>
                      <div style="color: #757575; margin-bottom: 4px;">Total Debit</div>
                      <div style="font-weight: 600; color: #D32F2F;">Rs ${Math.round(supplier.debit).toLocaleString()}</div>
                    </div>
                    <div>
                      <div style="color: #757575; margin-bottom: 4px;">Net Balance</div>
                      <div style="font-weight: 600; color: ${netBalance >= 0 ? '#388E3C' : '#D32F2F'};">Rs ${Math.round(netBalance).toLocaleString()}</div>
                    </div>
                  </div>
                </div>`;
            });
          }
          break;
        }

        case 'generalLedger': {
          const transactions = reportData.ledger || [];
          const totalCredit = reportData.summary?.totalCredit || 0;
          const totalDebit = reportData.summary?.totalDebit || 0;
          const openingBalance = reportData.summary?.openingBalance || 0;
          const closingBalance = reportData.summary?.closingBalance || 0;
          const avgTransactionValue = reportData.summary?.avgTransactionValue || 0;
          const largestCredit = reportData.summary?.largestCredit || 0;
          const largestDebit = reportData.summary?.largestDebit || 0;
          const creditToDebitRatio = reportData.summary?.creditToDebitRatio || 0;
          const netBalance = totalCredit - totalDebit;
          const totalTransactions = transactions.length;
          
          // Get filtered supplier name if applicable
          const filteredSupplier = ledgerSupplierFilter !== 'all' 
            ? supplierList.find(s => String(s.id) === ledgerSupplierFilter)
            : null;
          const filterLabel = filteredSupplier ? ` - ${filteredSupplier.name}` : ' - All Suppliers';
          
          console.log('📒 General Ledger PDF Data:', {
            totalCredit,
            totalDebit,
            openingBalance,
            closingBalance,
            netBalance,
            totalTransactions,
            transactionsCount: transactions.length,
            filteredSupplier: filteredSupplier?.name || 'All'
          });

          // Calculate running balance
          let runningBal = openingBalance;
          const transactionsWithBalance = transactions.map((t: any) => {
            if (t.type === 'credit') {
              runningBal += parseFloat(t.amount || 0);
            } else {
              runningBal -= parseFloat(t.amount || 0);
            }
            return {
              ...t,
              running_balance: runningBal
            };
          });

          // Enhanced Summary Metrics
          htmlContent += `
            <div class="section-heading">General Ledger${filterLabel}</div>
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-label">Opening Balance</div>
                <div class="metric-value" style="color: ${openingBalance >= 0 ? '#388E3C' : '#D32F2F'};">Rs ${Math.round(openingBalance).toLocaleString()}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Closing Balance</div>
                <div class="metric-value" style="color: ${closingBalance >= 0 ? '#388E3C' : '#D32F2F'};">Rs ${Math.round(closingBalance).toLocaleString()}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Total Credit</div>
                <div class="metric-value" style="color: #388E3C;">Rs ${Math.round(totalCredit).toLocaleString()}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Total Debit</div>
                <div class="metric-value" style="color: #D32F2F;">Rs ${Math.round(totalDebit).toLocaleString()}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Net Balance</div>
                <div class="metric-value" style="color: ${netBalance >= 0 ? '#388E3C' : '#D32F2F'};">Rs ${Math.round(netBalance).toLocaleString()}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Total Transactions</div>
                <div class="metric-value">${totalTransactions}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Avg Transaction</div>
                <div class="metric-value" style="color: #1976D2;">Rs ${Math.round(avgTransactionValue).toLocaleString()}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Credit/Debit Ratio</div>
                <div class="metric-value" style="color: #7B1FA2;">${creditToDebitRatio.toFixed(2)}</div>
              </div>
            </div>`;

          // Additional Metrics Row
          htmlContent += `
            <div style="margin-top: 20px; padding: 15px; background: #F5F5F5; border-radius: 8px; font-size: 13px;">
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                <div>
                  <span style="color: #757575;">Largest Credit:</span>
                  <strong style="color: #388E3C; margin-left: 8px;">Rs ${Math.round(largestCredit).toLocaleString()}</strong>
                </div>
                <div>
                  <span style="color: #757575;">Largest Debit:</span>
                  <strong style="color: #D32F2F; margin-left: 8px;">Rs ${Math.round(largestDebit).toLocaleString()}</strong>
                </div>
              </div>
            </div>`;

          // Group transactions by supplier (moved outside if block for scope)
          const supplierGroups: any = {};
          transactions.forEach((t: any) => {
            const supplierName = t.supplier?.name || 'Unknown';
            if (!supplierGroups[supplierName]) {
              supplierGroups[supplierName] = {
                name: supplierName,
                contact: t.supplier?.contact || 'N/A',
                email: t.supplier?.email || 'N/A',
                status: t.supplier?.status || 'active',
                credit: 0,
                debit: 0,
                count: 0
              };
            }
            if (t.type === 'credit') {
              supplierGroups[supplierName].credit += parseFloat(t.amount || 0);
            } else {
              supplierGroups[supplierName].debit += parseFloat(t.amount || 0);
            }
            supplierGroups[supplierName].count++;
          });

          // Complete Transaction Details Table with Running Balance
          if (transactions.length > 0) {
            const totalPages = Math.ceil(transactions.length / 40);
            
            htmlContent += `
              <div class="page-break"></div>
              <div class="section-heading" style="margin-top: 30px;">Complete Transaction Ledger (${transactions.length} transactions)</div>`;
            
            for (let page = 0; page < totalPages; page++) {
              const start = page * 40;
              const end = start + 40;
              const pageTransactions = transactionsWithBalance.slice(start, end);

              if (page > 0) {
                htmlContent += `<div class="page-break"></div>`;
              }

              htmlContent += `
                <div class="page-header">
                  <div class="page-number">Page ${page + 1} of ${totalPages}</div>
                </div>
                <table class="data-table" style="font-size: 11px;">
                  <thead>
                    <tr>
                      <th style="text-align: left;">#</th>
                      <th style="text-align: left;">Date</th>
                      <th style="text-align: left;">Time</th>
                      <th style="text-align: left;">Supplier</th>
                      <th style="text-align: left;">Contact</th>
                      <th style="text-align: left;">Type</th>
                      <th style="text-align: right;">Amount</th>
                      <th style="text-align: right;">Running Bal.</th>
                      <th style="text-align: left;">Days</th>
                      <th style="text-align: left;">Description</th>
                      <th style="text-align: left;">By</th>
                    </tr>
                  </thead>
                  <tbody>`;

              pageTransactions.forEach((t: any, idx: number) => {
                const amount = parseFloat(t.amount || 0);
                const isCredit = t.type === 'credit';
                const daysAgo = t.days_ago || 0;
                htmlContent += `
                    <tr>
                      <td style="text-align: left;">${start + idx + 1}</td>
                      <td style="text-align: left;">${t.formatted_date || new Date(t.transaction_date).toLocaleDateString('en-GB')}</td>
                      <td style="text-align: left; font-size: 10px; color: #757575;">${t.formatted_time || 'N/A'}</td>
                      <td style="text-align: left; font-weight: 600;">${t.supplier?.name || 'N/A'}</td>
                      <td style="text-align: left; font-size: 10px;">${t.supplier?.contact || '-'}</td>
                      <td style="text-align: left;">
                        <span style="background: ${isCredit ? '#E8F5E9' : '#FFEBEE'}; color: ${isCredit ? '#388E3C' : '#D32F2F'}; padding: 3px 8px; border-radius: 3px; font-weight: 600; font-size: 10px;">
                          ${isCredit ? '↑ CR' : '↓ DR'}
                        </span>
                      </td>
                      <td style="text-align: right; font-weight: 600; color: ${isCredit ? '#388E3C' : '#D32F2F'};">Rs ${Math.round(amount).toLocaleString()}</td>
                      <td style="text-align: right; font-weight: 700; color: ${t.running_balance >= 0 ? '#388E3C' : '#D32F2F'};">Rs ${Math.round(t.running_balance).toLocaleString()}</td>
                      <td style="text-align: left; font-size: 10px;">
                        <span style="background: ${daysAgo <= 7 ? '#E8F5E9' : daysAgo <= 30 ? '#FFF3E0' : '#FFEBEE'}; color: ${daysAgo <= 7 ? '#388E3C' : daysAgo <= 30 ? '#F57C00' : '#D32F2F'}; padding: 2px 6px; border-radius: 3px;">
                          ${daysAgo}d
                        </span>
                      </td>
                      <td style="text-align: left; font-size: 10px; color: #666;">${t.description || '-'}</td>
                      <td style="text-align: left; font-size: 10px; color: #757575;">${t.creator?.name || 'System'}</td>
                    </tr>`;
              });

              htmlContent += `
                  </tbody>
                </table>`;
            }

            // Summary by Supplier
            htmlContent += `
              <div class="page-break"></div>
              <div class="section-heading">Supplier-wise Breakdown</div>`;

            Object.values(supplierGroups).forEach((supplier: any, idx: number) => {
              const netBalance = supplier.credit - supplier.debit;
              htmlContent += `
                <div style="margin-top: 20px; padding: 15px; border: 1px solid #E0E0E0; border-radius: 8px; page-break-inside: avoid;">
                  <div style="font-size: 16px; font-weight: bold; color: #424242; margin-bottom: 10px;">
                    ${idx + 1}. ${supplier.name} 
                    <span style="font-size: 12px; color: ${supplier.status === 'active' ? '#388E3C' : '#D32F2F'}; margin-left: 10px;">
                      (${supplier.status.charAt(0).toUpperCase() + supplier.status.slice(1)})
                    </span>
                  </div>
                  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; font-size: 13px; margin-bottom: 12px;">
                    <div>
                      <div style="color: #757575; margin-bottom: 4px;">Contact</div>
                      <div style="font-weight: 600;">${supplier.contact}</div>
                    </div>
                    <div>
                      <div style="color: #757575; margin-bottom: 4px;">Email</div>
                      <div style="font-weight: 600; font-size: 12px;">${supplier.email}</div>
                    </div>
                    <div>
                      <div style="color: #757575; margin-bottom: 4px;">Total Transactions</div>
                      <div style="font-weight: 600;">${supplier.count}</div>
                    </div>
                  </div>
                  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; padding-top: 12px; border-top: 1px solid #E0E0E0; font-size: 13px;">
                    <div>
                      <div style="color: #757575; margin-bottom: 4px;">Total Credit</div>
                      <div style="font-weight: 600; color: #388E3C;">Rs ${Math.round(supplier.credit).toLocaleString()}</div>
                    </div>
                    <div>
                      <div style="color: #757575; margin-bottom: 4px;">Total Debit</div>
                      <div style="font-weight: 600; color: #D32F2F;">Rs ${Math.round(supplier.debit).toLocaleString()}</div>
                    </div>
                    <div>
                      <div style="color: #757575; margin-bottom: 4px;">Net Balance</div>
                      <div style="font-weight: 600; color: ${netBalance >= 0 ? '#388E3C' : '#D32F2F'};">Rs ${Math.round(netBalance).toLocaleString()}</div>
                    </div>
                  </div>
                </div>`;
            });
          }

          // Payment Type Analysis (NEW)
          const creditTransactions = transactions.filter((t: any) => t.type === 'credit');
          const debitTransactions = transactions.filter((t: any) => t.type === 'debit');
          const creditCount = creditTransactions.length;
          const debitCount = debitTransactions.length;
          const creditPercentage = totalTransactions > 0 ? ((creditCount / totalTransactions) * 100).toFixed(1) : '0.0';
          const debitPercentage = totalTransactions > 0 ? ((debitCount / totalTransactions) * 100).toFixed(1) : '0.0';
          const avgCreditValue = creditCount > 0 ? totalCredit / creditCount : 0;
          const avgDebitValue = debitCount > 0 ? totalDebit / debitCount : 0;

          htmlContent += `
            <div class="page-break">
              <div class="section-heading">Payment Type Analysis</div>
              <div class="metrics-grid" style="grid-template-columns: repeat(2, 1fr);">
                <div class="metric-card" style="border-left: 4px solid #388E3C;">
                  <div class="metric-label">Credit Transactions</div>
                  <div class="metric-value" style="color: #388E3C;">${creditCount}</div>
                  <div style="font-size: 12px; color: #666; margin-top: 5px;">
                    ${creditPercentage}% of total | Avg: Rs ${Math.round(avgCreditValue).toLocaleString()}
                  </div>
                </div>
                <div class="metric-card" style="border-left: 4px solid #D32F2F;">
                  <div class="metric-label">Debit Transactions</div>
                  <div class="metric-value" style="color: #D32F2F;">${debitCount}</div>
                  <div style="font-size: 12px; color: #666; margin-top: 5px;">
                    ${debitPercentage}% of total | Avg: Rs ${Math.round(avgDebitValue).toLocaleString()}
                  </div>
                </div>
              </div>
              
              <table class="data-table" style="margin-top: 20px;">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th style="text-align: right;">Count</th>
                    <th style="text-align: right;">Total Amount</th>
                    <th style="text-align: right;">Average</th>
                    <th style="text-align: right;">Largest</th>
                    <th style="text-align: right;">% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong style="color: #388E3C;">↑ Credit</strong></td>
                    <td style="text-align: right;">${creditCount}</td>
                    <td style="text-align: right; font-weight: 600; color: #388E3C;">Rs ${Math.round(totalCredit).toLocaleString()}</td>
                    <td style="text-align: right;">Rs ${Math.round(avgCreditValue).toLocaleString()}</td>
                    <td style="text-align: right; color: #388E3C;">Rs ${Math.round(largestCredit).toLocaleString()}</td>
                    <td style="text-align: right;">${creditPercentage}%</td>
                  </tr>
                  <tr>
                    <td><strong style="color: #D32F2F;">↓ Debit</strong></td>
                    <td style="text-align: right;">${debitCount}</td>
                    <td style="text-align: right; font-weight: 600; color: #D32F2F;">Rs ${Math.round(totalDebit).toLocaleString()}</td>
                    <td style="text-align: right;">Rs ${Math.round(avgDebitValue).toLocaleString()}</td>
                    <td style="text-align: right; color: #D32F2F;">Rs ${Math.round(largestDebit).toLocaleString()}</td>
                    <td style="text-align: right;">${debitPercentage}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          `;

          // Daily Activity Summary (NEW)
          const dailyActivity = {};
          transactions.forEach((t: any) => {
            const date = t.transaction_date ? t.transaction_date.split('T')[0] : 'Unknown';
            if (!dailyActivity[date]) {
              dailyActivity[date] = { date, credit: 0, debit: 0, count: 0 };
            }
            if (t.type === 'credit') {
              dailyActivity[date].credit += parseFloat(t.amount || 0);
            } else {
              dailyActivity[date].debit += parseFloat(t.amount || 0);
            }
            dailyActivity[date].count++;
          });

          const dailyEntries = Object.values(dailyActivity).sort((a: any, b: any) => b.date.localeCompare(a.date));
          
          if (dailyEntries.length > 0) {
            htmlContent += `
              <div class="page-break">
                <div class="section-heading">Daily Activity Summary</div>
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th style="text-align: right;">Transactions</th>
                      <th style="text-align: right;">Total Credit</th>
                      <th style="text-align: right;">Total Debit</th>
                      <th style="text-align: right;">Net Flow</th>
                      <th style="text-align: right;">Activity Level</th>
                    </tr>
                  </thead>
                  <tbody>
            `;
            dailyEntries.forEach((day: any) => {
              const netFlow = day.credit - day.debit;
              const activityLevel = day.count <= 2 ? 'Low' : day.count <= 5 ? 'Medium' : 'High';
              const activityColor = activityLevel === 'Low' ? '#388E3C' : activityLevel === 'Medium' ? '#F57F17' : '#D32F2F';
              
              htmlContent += `
                    <tr>
                      <td><strong>${new Date(day.date).toLocaleDateString('en-GB')}</strong></td>
                      <td style="text-align: right;">${day.count}</td>
                      <td style="text-align: right; color: #388E3C; font-weight: 600;">Rs ${Math.round(day.credit).toLocaleString()}</td>
                      <td style="text-align: right; color: #D32F2F; font-weight: 600;">Rs ${Math.round(day.debit).toLocaleString()}</td>
                      <td style="text-align: right; font-weight: 700; color: ${netFlow >= 0 ? '#388E3C' : '#D32F2F'};">Rs ${Math.round(netFlow).toLocaleString()}</td>
                      <td style="text-align: right;">
                        <span style="background: ${activityColor}20; color: ${activityColor}; padding: 3px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">
                          ${activityLevel}
                        </span>
                      </td>
                    </tr>
              `;
            });
            htmlContent += `
                  </tbody>
                </table>
              </div>
            `;
          }

          // Top 5 Suppliers by Volume (NEW)
          const topSuppliers = Object.values(supplierGroups)
            .sort((a: any, b: any) => (b.credit + b.debit) - (a.credit + a.debit))
            .slice(0, 5);

          if (topSuppliers.length > 0) {
            htmlContent += `
              <div class="page-break">
                <div class="section-heading">Top 5 Suppliers by Transaction Volume</div>
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Supplier Name</th>
                      <th style="text-align: right;">Transactions</th>
                      <th style="text-align: right;">Total Credit</th>
                      <th style="text-align: right;">Total Debit</th>
                      <th style="text-align: right;">Total Volume</th>
                    </tr>
                  </thead>
                  <tbody>
            `;
            topSuppliers.forEach((supplier: any, idx: number) => {
              const totalVolume = supplier.credit + supplier.debit;
              const rankEmoji = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`;
              htmlContent += `
                    <tr>
                      <td style="font-size: 18px;">${rankEmoji}</td>
                      <td><strong>${supplier.name}</strong></td>
                      <td style="text-align: right;">${supplier.count}</td>
                      <td style="text-align: right; color: #388E3C; font-weight: 600;">Rs ${Math.round(supplier.credit).toLocaleString()}</td>
                      <td style="text-align: right; color: #D32F2F; font-weight: 600;">Rs ${Math.round(supplier.debit).toLocaleString()}</td>
                      <td style="text-align: right; font-weight: 700; color: #1976D2;">Rs ${Math.round(totalVolume).toLocaleString()}</td>
                    </tr>
              `;
            });
            htmlContent += `
                  </tbody>
                </table>
              </div>
            `;
          }

          // Report Information & Signature Section (NEW)
          const generatedBy = 'System Administrator';
          const periodLabel = 'This Month';
          
          htmlContent += `
            <div class="page-break">
              <div class="section-heading">Report Information & Verification</div>
              <div style="background: #FAFAFA; padding: 20px; border-left: 4px solid #424242; margin-bottom: 30px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 14px;">
                  <div>
                    <div style="color: #757575; margin-bottom: 5px;">Generated By</div>
                    <div style="font-weight: 600;">${generatedBy}</div>
                  </div>
                  <div>
                    <div style="color: #757575; margin-bottom: 5px;">Report Period</div>
                    <div style="font-weight: 600;">${periodLabel}</div>
                  </div>
                  <div>
                    <div style="color: #757575; margin-bottom: 5px;">Total Suppliers</div>
                    <div style="font-weight: 600;">${Object.keys(supplierGroups).length}</div>
                  </div>
                  <div>
                    <div style="color: #757575; margin-bottom: 5px;">Credit/Debit Ratio</div>
                    <div style="font-weight: 600; color: #7B1FA2;">${creditToDebitRatio.toFixed(2)}</div>
                  </div>
                  <div>
                    <div style="color: #757575; margin-bottom: 5px;">Net Position</div>
                    <div style="font-weight: 600; color: ${netBalance >= 0 ? '#388E3C' : '#D32F2F'};">Rs ${Math.round(netBalance).toLocaleString()} ${netBalance >= 0 ? '(Favorable)' : '(Unfavorable)'}</div>
                  </div>
                  <div>
                    <div style="color: #757575; margin-bottom: 5px;">Balance Change</div>
                    <div style="font-weight: 600; color: #1976D2;">Rs ${Math.round(closingBalance - openingBalance).toLocaleString()}</div>
                  </div>
                </div>
              </div>
              
              <div style="margin-top: 50px; padding-top: 20px; border-top: 2px solid #E0E0E0;">
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 40px; text-align: center;">
                  <div>
                    <div style="border-top: 2px solid #424242; padding-top: 10px; margin-top: 60px;">
                      <div style="font-weight: 600; margin-bottom: 5px;">Prepared By</div>
                      <div style="font-size: 12px; color: #757575;">Accountant</div>
                    </div>
                  </div>
                  <div>
                    <div style="border-top: 2px solid #424242; padding-top: 10px; margin-top: 60px;">
                      <div style="font-weight: 600; margin-bottom: 5px;">Reviewed By</div>
                      <div style="font-size: 12px; color: #757575;">Finance Manager</div>
                    </div>
                  </div>
                  <div>
                    <div style="border-top: 2px solid #424242; padding-top: 10px; margin-top: 60px;">
                      <div style="font-weight: 600; margin-bottom: 5px;">Approved By</div>
                      <div style="font-size: 12px; color: #757575;">Director</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div style="margin-top: 30px; padding: 15px; background: #E3F2FD; border-left: 4px solid #1976D2; font-size: 13px; color: #0D47A1;">
                <strong>Note:</strong> This is a computer-generated General Ledger report. All amounts are in Pakistani Rupees (PKR). This report shows all credit and debit transactions with running balances. For any discrepancies, please contact the finance department immediately.
              </div>
            </div>
          `;

          break;
        }
        case 'profitLoss': {
          const dailySales = reportData.dailySales || [];
          const expenses = reportData.expenses || [];
          
          const totalRevenue = dailySales.reduce((sum: number, day: any) => sum + (day.revenue || 0), 0);
          const totalOrders = dailySales.reduce((sum: number, day: any) => sum + (day.orders || 0), 0);
          const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + parseFloat(exp.amount || 0), 0);
          const netProfit = totalRevenue - totalExpenses;
          const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
          
          // Group expenses by category
          const expensesByCategory: any = {};
          expenses.forEach((exp: any) => {
            const category = exp.category || 'other';
            if (!expensesByCategory[category]) {
              expensesByCategory[category] = 0;
            }
            expensesByCategory[category] += parseFloat(exp.amount || 0);
          });

          console.log('💰 Profit/Loss PDF Data:', {
            totalRevenue,
            totalExpenses,
            netProfit,
            profitMargin,
            expensesCount: expenses.length
          });

          // Summary Metrics
          htmlContent += `
            <div class="section-heading">Profit & Loss Statement</div>
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-label">Total Revenue</div>
                <div class="metric-value" style="color: #388E3C;">Rs ${Math.round(totalRevenue).toLocaleString()}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Total Expenses</div>
                <div class="metric-value" style="color: #D32F2F;">Rs ${Math.round(totalExpenses).toLocaleString()}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Net ${netProfit >= 0 ? 'Profit' : 'Loss'}</div>
                <div class="metric-value" style="color: ${netProfit >= 0 ? '#388E3C' : '#D32F2F'};">Rs ${Math.round(netProfit).toLocaleString()}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Profit Margin</div>
                <div class="metric-value" style="color: ${profitMargin >= 0 ? '#388E3C' : '#D32F2F'};">${profitMargin.toFixed(1)}%</div>
              </div>
            </div>
          `;

          // Additional Metrics
          htmlContent += `
            <div style="margin-top: 20px; padding: 15px; background: #F5F5F5; border-radius: 8px; font-size: 13px;">
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
                <div>
                  <span style="color: #757575;">Total Orders:</span>
                  <strong style="margin-left: 8px;">${totalOrders}</strong>
                </div>
                <div>
                  <span style="color: #757575;">Expense Transactions:</span>
                  <strong style="margin-left: 8px;">${expenses.length}</strong>
                </div>
                <div>
                  <span style="color: #757575;">Expense Categories:</span>
                  <strong style="margin-left: 8px;">${Object.keys(expensesByCategory).length}</strong>
                </div>
              </div>
            </div>
          `;

          // Profit & Loss Statement Table
          htmlContent += `
            <div class="page-break">
              <div class="section-heading">Financial Breakdown</div>
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th style="text-align: right;">Amount</th>
                    <th style="text-align: right;">% of Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style="background: #E8F5E9;">
                    <td><strong>Revenue</strong></td>
                    <td style="text-align: right; font-weight: 700; color: #388E3C;">Rs ${Math.round(totalRevenue).toLocaleString()}</td>
                    <td style="text-align: right;">100%</td>
                  </tr>
          `;

          // Expenses by category
          Object.entries(expensesByCategory)
            .sort((a, b) => (b[1] as number) - (a[1] as number))
            .forEach(([category, amount]) => {
              const categoryLabel = category.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
              const percentage = totalRevenue > 0 ? ((amount as number / totalRevenue) * 100).toFixed(1) : '0.0';
              htmlContent += `
                  <tr>
                    <td style="padding-left: 30px;">${categoryLabel}</td>
                    <td style="text-align: right; color: #D32F2F; font-weight: 600;">- Rs ${Math.round(amount as number).toLocaleString()}</td>
                    <td style="text-align: right;">${percentage}%</td>
                  </tr>
              `;
            });

          htmlContent += `
                  <tr style="background: #FFEBEE;">
                    <td><strong>Total Expenses</strong></td>
                    <td style="text-align: right; font-weight: 700; color: #D32F2F;">- Rs ${Math.round(totalExpenses).toLocaleString()}</td>
                    <td style="text-align: right;">${totalRevenue > 0 ? ((totalExpenses / totalRevenue) * 100).toFixed(1) : '0.0'}%</td>
                  </tr>
                  <tr style="background: ${netProfit >= 0 ? '#C8E6C9' : '#FFCDD2'}; font-weight: bold;">
                    <td>Net ${netProfit >= 0 ? 'Profit' : 'Loss'}</td>
                    <td style="text-align: right; color: ${netProfit >= 0 ? '#388E3C' : '#D32F2F'};">Rs ${Math.round(netProfit).toLocaleString()}</td>
                    <td style="text-align: right;">${profitMargin.toFixed(1)}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          `;

          // Expense Breakdown Table
          if (expenses.length > 0) {
            htmlContent += `
              <div class="page-break">
                <div class="section-heading">Expense Transactions</div>
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Vendor</th>
                      <th>Payment</th>
                      <th style="text-align: right;">Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
            `;
            expenses.slice(0, 50).forEach((exp: any) => {
              const categoryLabel = exp.category ? exp.category.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : '-';
              const paymentLabel = exp.payment_method ? exp.payment_method.replace('_', ' ') : '-';
              const statusColor = exp.status === 'approved' ? '#388E3C' : exp.status === 'pending' ? '#F57F17' : '#D32F2F';
              
              htmlContent += `
                    <tr>
                      <td>${new Date(exp.expense_date).toLocaleDateString('en-GB')}</td>
                      <td><strong>${exp.title}</strong></td>
                      <td><span style="background: #F5F5F5; padding: 3px 8px; border-radius: 4px; font-size: 12px;">${categoryLabel}</span></td>
                      <td>${exp.vendor_name || '-'}</td>
                      <td>${paymentLabel}</td>
                      <td style="text-align: right; font-weight: 700; color: #D32F2F;">Rs ${Math.round(parseFloat(exp.amount)).toLocaleString()}</td>
                      <td><span style="color: ${statusColor}; font-weight: 600; text-transform: capitalize;">${exp.status}</span></td>
                    </tr>
              `;
            });
            htmlContent += `
                  </tbody>
                </table>
                ${expenses.length > 50 ? `<p style="text-align: center; color: #757575; font-size: 12px; margin-top: 10px;">Showing first 50 of ${expenses.length} expenses</p>` : ''}
              </div>
            `;
          }

          // Report Information
          htmlContent += `
            <div class="page-break">
              <div class="section-heading">Report Information</div>
              <div style="background: #FAFAFA; padding: 20px; border-left: 4px solid #424242; margin-bottom: 30px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 14px;">
                  <div>
                    <div style="color: #757575; margin-bottom: 5px;">Generated By</div>
                    <div style="font-weight: 600;">System Administrator</div>
                  </div>
                  <div>
                    <div style="color: #757575; margin-bottom: 5px;">Report Period</div>
                    <div style="font-weight: 600;">This Month</div>
                  </div>
                  <div>
                    <div style="color: #757575; margin-bottom: 5px;">Financial Status</div>
                    <div style="font-weight: 600; color: ${netProfit >= 0 ? '#388E3C' : '#D32F2F'};">${netProfit >= 0 ? 'Profitable' : 'Loss'}</div>
                  </div>
                  <div>
                    <div style="color: #757575; margin-bottom: 5px;">Profit Margin</div>
                    <div style="font-weight: 600; color: ${profitMargin >= 0 ? '#388E3C' : '#D32F2F'};">${profitMargin.toFixed(1)}%</div>
                  </div>
                </div>
              </div>
              
              <div style="margin-top: 50px; padding-top: 20px; border-top: 2px solid #E0E0E0;">
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 40px; text-align: center;">
                  <div>
                    <div style="border-top: 2px solid #424242; padding-top: 10px; margin-top: 60px;">
                      <div style="font-weight: 600; margin-bottom: 5px;">Prepared By</div>
                      <div style="font-size: 12px; color: #757575;">Accountant</div>
                    </div>
                  </div>
                  <div>
                    <div style="border-top: 2px solid #424242; padding-top: 10px; margin-top: 60px;">
                      <div style="font-weight: 600; margin-bottom: 5px;">Reviewed By</div>
                      <div style="font-size: 12px; color: #757575;">Finance Manager</div>
                    </div>
                  </div>
                  <div>
                    <div style="border-top: 2px solid #424242; padding-top: 10px; margin-top: 60px;">
                      <div style="font-weight: 600; margin-bottom: 5px;">Approved By</div>
                      <div style="font-size: 12px; color: #757575;">Director</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div style="margin-top: 30px; padding: 15px; background: #FFF3E0; border-left: 4px solid #F57F17; font-size: 13px; color: #E65100;">
                <strong>Note:</strong> This is a computer-generated Profit & Loss report. All amounts are in Pakistani Rupees (PKR). Revenue data is from sales transactions. Expense data is from recorded expense entries. For any discrepancies, please contact the finance department.
              </div>
            </div>
          `;
          
          break;
        }
        case 'expense': {
          const expenses = reportData.expenses || [];
          const summary = reportData.summary || {};
          const totalExpenses = summary.totalExpenses || 0;
          const totalTransactions = expenses.length;
          const averageExpense = summary.averageExpense || 0;
          const expensesByCategory = summary.expensesByCategory || [];
          const expensesByStatus = summary.expensesByStatus || {};
          const expensesByPayment = {};
          
          // Calculate payment method breakdown
          expenses.forEach((exp: any) => {
            const method = exp.payment_method || 'other';
            if (!expensesByPayment[method]) {
              expensesByPayment[method] = { count: 0, total: 0 };
            }
            expensesByPayment[method].count++;
            expensesByPayment[method].total += parseFloat(exp.amount || 0);
          });
          
          console.log(' Expense Report PDF Data:', {
            totalExpenses,
            totalTransactions,
            averageExpense,
            expensesCount: expenses.length,
            categoriesCount: expensesByCategory.length
          });

          // Report metadata
          const generatedBy = 'System Administrator';
          const approvalStatus = expenses.filter((e: any) => e.status === 'approved').length;
          const pendingStatus = expenses.filter((e: any) => e.status === 'pending').length;
          const rejectedStatus = expenses.filter((e: any) => e.status === 'rejected').length;

          // Summary Metrics
          htmlContent += `
            <div class="section-heading">Expense Summary</div>
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-label">Total Expenses</div>
                <div class="metric-value" style="color: #D32F2F;">Rs ${Math.round(totalExpenses).toLocaleString()}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Total Transactions</div>
                <div class="metric-value">${totalTransactions}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Average Expense</div>
                <div class="metric-value">Rs ${Math.round(averageExpense).toLocaleString()}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Categories</div>
                <div class="metric-value">${expensesByCategory.length}</div>
              </div>
            </div>
          `;

          // Approval Status
          htmlContent += `
            <div class="page-break">
              <div class="section-heading">Approval Status</div>
              <div class="metrics-grid" style="grid-template-columns: repeat(3, 1fr);">
                <div class="metric-card">
                  <div class="metric-label">Approved</div>
                  <div class="metric-value" style="color: #388E3C;">${approvalStatus}</div>
                  <div style="font-size: 12px; color: #666; margin-top: 5px;">
                    Rs ${Math.round(expensesByStatus.approved || 0).toLocaleString()}
                  </div>
                </div>
                <div class="metric-card">
                  <div class="metric-label">Pending</div>
                  <div class="metric-value" style="color: #F57F17;">${pendingStatus}</div>
                  <div style="font-size: 12px; color: #666; margin-top: 5px;">
                    Rs ${Math.round(expensesByStatus.pending || 0).toLocaleString()}
                  </div>
                </div>
                <div class="metric-card">
                  <div class="metric-label">Rejected</div>
                  <div class="metric-value" style="color: #D32F2F;">${rejectedStatus}</div>
                  <div style="font-size: 12px; color: #666; margin-top: 5px;">
                    Rs ${Math.round(expensesByStatus.rejected || 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          `;

          // Payment Method Breakdown
          const paymentMethods = Object.entries(expensesByPayment);
          if (paymentMethods.length > 0) {
            htmlContent += `
              <div class="page-break">
                <div class="section-heading">Payment Method Breakdown</div>
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Payment Method</th>
                      <th style="text-align: right;">Transactions</th>
                      <th style="text-align: right;">Total Amount</th>
                      <th style="text-align: right;">% of Total</th>
                    </tr>
                  </thead>
                  <tbody>
            `;
            paymentMethods.forEach(([method, data]: [string, any]) => {
              const methodLabel = method.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
              const percentage = totalExpenses > 0 ? ((data.total / totalExpenses) * 100).toFixed(1) : '0.0';
              htmlContent += `
                    <tr>
                      <td><strong>${methodLabel}</strong></td>
                      <td style="text-align: right;">${data.count}</td>
                      <td style="text-align: right; font-weight: 600;">Rs ${Math.round(data.total).toLocaleString()}</td>
                      <td style="text-align: right;">${percentage}%</td>
                    </tr>
              `;
            });
            htmlContent += `
                  </tbody>
                </table>
              </div>
            `;
          }

          // Expenses by Category
          if (expensesByCategory.length > 0) {
            htmlContent += `
              <div class="page-break">
                <div class="section-heading">Expenses by Category</div>
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th style="text-align: right;">Count</th>
                      <th style="text-align: right;">Total Amount</th>
                      <th style="text-align: right;">% of Total</th>
                    </tr>
                  </thead>
                  <tbody>
            `;
            expensesByCategory.forEach((cat: any) => {
              const percentage = totalExpenses > 0 ? ((cat.total / totalExpenses) * 100).toFixed(1) : '0.0';
              htmlContent += `
                    <tr>
                      <td><strong>${cat.label}</strong></td>
                      <td style="text-align: right;">${cat.count}</td>
                      <td style="text-align: right; font-weight: 600;">Rs ${Math.round(cat.total).toLocaleString()}</td>
                      <td style="text-align: right;">${percentage}%</td>
                    </tr>
              `;
            });
            htmlContent += `
                  </tbody>
                </table>
              </div>
            `;
          }

          // Daily Expense Breakdown
          const expensesByDate = {};
          expenses.forEach((exp: any) => {
            const date = exp.expense_date;
            if (!expensesByDate[date]) {
              expensesByDate[date] = { count: 0, total: 0 };
            }
            expensesByDate[date].count++;
            expensesByDate[date].total += parseFloat(exp.amount || 0);
          });
          
          const dateEntries = Object.entries(expensesByDate);
          if (dateEntries.length > 1) {
            htmlContent += `
              <div class="page-break">
                <div class="section-heading">Daily Expense Breakdown</div>
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th style="text-align: right;">Transactions</th>
                      <th style="text-align: right;">Daily Total</th>
                      <th style="text-align: right;">% of Period</th>
                    </tr>
                  </thead>
                  <tbody>
            `;
            dateEntries.sort((a, b) => b[0].localeCompare(a[0])).forEach(([date, data]: [string, any]) => {
              const percentage = totalExpenses > 0 ? ((data.total / totalExpenses) * 100).toFixed(1) : '0.0';
              htmlContent += `
                    <tr>
                      <td><strong>${new Date(date).toLocaleDateString('en-GB')}</strong></td>
                      <td style="text-align: right;">${data.count}</td>
                      <td style="text-align: right; font-weight: 600; color: #D32F2F;">Rs ${Math.round(data.total).toLocaleString()}</td>
                      <td style="text-align: right;">${percentage}%</td>
                    </tr>
              `;
            });
            htmlContent += `
                  </tbody>
                </table>
              </div>
            `;
          }

          // Expense Details Table
          if (expenses.length > 0) {
            htmlContent += `
              <div class="page-break">
                <div class="section-heading">Detailed Expense Transactions</div>
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Vendor</th>
                      <th>Payment</th>
                      <th>Receipt#</th>
                      <th style="text-align: right;">Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
            `;
            expenses.forEach((exp: any) => {
              const categoryLabel = exp.category ? exp.category.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : '-';
              const paymentLabel = exp.payment_method ? exp.payment_method.replace('_', ' ') : '-';
              const statusColor = exp.status === 'approved' ? '#388E3C' : exp.status === 'pending' ? '#F57F17' : '#D32F2F';
              
              htmlContent += `
                    <tr>
                      <td>${new Date(exp.expense_date).toLocaleDateString('en-GB')}</td>
                      <td><strong>${exp.title}</strong></td>
                      <td><span style="background: #F5F5F5; padding: 3px 8px; border-radius: 4px; font-size: 12px;">${categoryLabel}</span></td>
                      <td>${exp.vendor_name || '-'}</td>
                      <td>${paymentLabel}</td>
                      <td style="font-family: monospace; font-size: 12px;">${exp.receipt_number || '-'}</td>
                      <td style="text-align: right; font-weight: 700; color: #D32F2F;">Rs ${Math.round(exp.amount).toLocaleString()}</td>
                      <td><span style="color: ${statusColor}; font-weight: 600; text-transform: capitalize;">${exp.status}</span></td>
                    </tr>
              `;
            });
            htmlContent += `
                  </tbody>
                </table>
              </div>
            `;
          }

          // Report Notes & Signature Section
          htmlContent += `
            <div class="page-break">
              <div class="section-heading">Report Information</div>
              <div style="background: #FAFAFA; padding: 20px; border-left: 4px solid #424242; margin-bottom: 30px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 14px;">
                  <div>
                    <div style="color: #757575; margin-bottom: 5px;">Generated By</div>
                    <div style="font-weight: 600;">${generatedBy}</div>
                  </div>
                  <div>
                    <div style="color: #757575; margin-bottom: 5px;">Report Period</div>
                    <div style="font-weight: 600;">This Month</div>
                  </div>
                  <div>
                    <div style="color: #757575; margin-bottom: 5px;">Total Expenses</div>
                    <div style="font-weight: 600; color: #D32F2F;">Rs ${Math.round(totalExpenses).toLocaleString()}</div>
                  </div>
                  <div>
                    <div style="color: #757575; margin-bottom: 5px;">Approval Rate</div>
                    <div style="font-weight: 600; color: #388E3C;">${totalTransactions > 0 ? ((approvalStatus / totalTransactions) * 100).toFixed(1) : 0}%</div>
                  </div>
                </div>
              </div>
              
              <div style="margin-top: 50px; padding-top: 20px; border-top: 2px solid #E0E0E0;">
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 40px; text-align: center;">
                  <div>
                    <div style="border-top: 2px solid #424242; padding-top: 10px; margin-top: 60px;">
                      <div style="font-weight: 600; margin-bottom: 5px;">Prepared By</div>
                      <div style="font-size: 12px; color: #757575;">Accountant</div>
                    </div>
                  </div>
                  <div>
                    <div style="border-top: 2px solid #424242; padding-top: 10px; margin-top: 60px;">
                      <div style="font-weight: 600; margin-bottom: 5px;">Reviewed By</div>
                      <div style="font-size: 12px; color: #757575;">Manager</div>
                    </div>
                  </div>
                  <div>
                    <div style="border-top: 2px solid #424242; padding-top: 10px; margin-top: 60px;">
                      <div style="font-weight: 600; margin-bottom: 5px;">Approved By</div>
                      <div style="font-size: 12px; color: #757575;">Director</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div style="margin-top: 30px; padding: 15px; background: #FFF3E0; border-left: 4px solid #F57F17; font-size: 13px; color: #E65100;">
                <strong>Note:</strong> This is a computer-generated report. All expense amounts are in Pakistani Rupees (PKR). For any discrepancies, please contact the finance department.
              </div>
            </div>
          `;
          
          break;
        }

        default:
          htmlContent += `<p style="text-align: center; padding: 40px; color: #666;">Report content for ${reportType} is being generated...</p>`;
      }
    }

    htmlContent += generateProfessionalPDFFooter(companySettings.name);

    console.log(' PDF HTML Content Length:', htmlContent.length);
    console.log(' PDF Contains Supplier Details:', htmlContent.includes('Supplier Details'));
    console.log(' PDF Contains Financial Breakdown:', htmlContent.includes('Financial Breakdown'));

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        toast.success('PDF generated! Use Print dialog to save as PDF');
      }, 250);
    };
  };

  // ============================================================
  // REPORT RENDER FUNCTIONS - PROPER DATA DISPLAY
  // ============================================================

  const renderSalesReport = useCallback(() => {
    console.log('🎨 renderSalesReport called');
    console.log('🎨 reportData:', reportData);
    console.log(' dailySales:', reportData?.dailySales);
    
    if (!reportData?.dailySales || reportData.dailySales.length === 0) {
      console.warn('⚠️ No dailySales data found!');
      return <div className="p-8 text-center text-muted-foreground">No sales data available for this period.</div>;
    }

    console.log('✅ Rendering sales table with', reportData.dailySales.length, 'days');

    const totalRevenue = reportData.dailySales.reduce((sum: number, day: any) => sum + (day.revenue || 0), 0);
    const totalOrders = reportData.dailySales.reduce((sum: number, day: any) => sum + (day.orders || 0), 0);

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold">Rs {Math.round(totalRevenue).toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold">{totalOrders}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Average Order Value</p>
              <p className="text-2xl font-bold">Rs {totalOrders > 0 ? Math.round(totalRevenue / totalOrders).toLocaleString() : 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Active Days</p>
              <p className="text-2xl font-bold">{reportData.dailySales.length}</p>
            </CardContent>
          </Card>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Orders</TableHead>
              <TableHead className="text-right">Token Range</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Avg Order Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reportData.dailySales.map((day: any, index: number) => (
              <TableRow key={index}>
                <TableCell>{new Date(day.date).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">{day.orders}</TableCell>
                <TableCell className="text-right">
                  {day.orders > 0 ? (
                    <span className="font-semibold text-primary">
                      TOKEN #{String(day.firstToken || 1).padStart(4, '0')} → #{String(day.lastToken || day.orders).padStart(4, '0')}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">Rs {day.revenue.toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  Rs {day.orders > 0 ? Math.round(day.revenue / day.orders).toLocaleString() : 0}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }, [reportData]);

  const renderCustomerReport = useCallback(() => {
    console.log('👥 renderCustomerReport called');
    console.log('👥 reportData:', reportData);
    console.log('👥 customers:', reportData?.customers);
    console.log('👥 customers length:', reportData?.customers?.length);
    console.log('👥 summary:', reportData?.summary);
    
    const customers = reportData?.customers || [];
    const summary = reportData?.summary || {};

    if (customers.length === 0) {
      console.warn('⚠️ No customer data found!');
      return <div className="p-8 text-center text-muted-foreground">No customer data available for this period.</div>;
    }

    console.log('✅ Rendering customer report with', customers.length, 'customers');

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Customers</p>
              <p className="text-2xl font-bold">{customers.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold">Rs {Math.round(summary.totalRevenue || 0).toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Avg Customer Value</p>
              <p className="text-2xl font-bold">
                Rs {customers.length > 0 ? Math.round((summary.totalRevenue || 0) / customers.length).toLocaleString() : 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Active Customers</p>
              <p className="text-2xl font-bold">{customers.filter((c: any) => c.totalOrders > 0).length}</p>
            </CardContent>
          </Card>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Customer Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="text-right">Total Orders</TableHead>
              <TableHead className="text-right">Total Spent</TableHead>
              <TableHead className="text-right">Avg Order</TableHead>
              <TableHead>Last Visit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer: any, index: number) => {
              // Format last visit date
              let lastVisitFormatted = 'N/A';
              if (customer.lastVisit) {
                try {
                  const date = new Date(customer.lastVisit);
                  if (!isNaN(date.getTime())) {
                    lastVisitFormatted = date.toLocaleDateString('en-GB');
                  }
                } catch (e) {
                  lastVisitFormatted = 'N/A';
                }
              }
              
              return (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-semibold">{customer.name || 'Walk-in Customer'}</TableCell>
                  <TableCell>{customer.phone || 'N/A'}</TableCell>
                  <TableCell className="text-right">{customer.totalOrders || 0}</TableCell>
                  <TableCell className="text-right font-semibold">Rs {(customer.totalSpent || 0).toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    Rs {customer.totalOrders > 0 ? ((customer.totalSpent || 0) / customer.totalOrders).toFixed(2) : '0.00'}
                  </TableCell>
                  <TableCell>{lastVisitFormatted}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  }, [reportData]);

  const renderEmployeeReport = useCallback(() => {
    const employees = reportData?.employees || [];
    const summary = reportData?.summary || {};

    if (employees.length === 0) {
      return <div className="p-8 text-center text-muted-foreground">No employee data available for this period.</div>;
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Employees</p>
              <p className="text-2xl font-bold">{employees.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Sales</p>
              <p className="text-2xl font-bold">Rs {Math.round(summary.totalSales || 0).toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold">{summary.totalOrders || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Avg Sales/Employee</p>
              <p className="text-2xl font-bold">
                Rs {employees.length > 0 ? Math.round((summary.totalSales || 0) / employees.length).toLocaleString() : 0}
              </p>
            </CardContent>
          </Card>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Total Orders</TableHead>
              <TableHead className="text-right">Total Sales</TableHead>
              <TableHead className="text-right">Avg Order Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((emp: any, index: number) => (
              <TableRow key={index}>
                <TableCell>{emp.name || 'N/A'}</TableCell>
                <TableCell>{emp.role || 'N/A'}</TableCell>
                <TableCell className="text-right">{emp.totalOrders || 0}</TableCell>
                <TableCell className="text-right">Rs {Math.round(emp.totalSales || 0).toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  Rs {emp.totalOrders > 0 ? Math.round((emp.totalSales || 0) / emp.totalOrders).toLocaleString() : 0}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }, [reportData]);

  const renderCreditDebitReport = useCallback(() => {
    const transactions = reportData?.transactions || [];
    // Backend returns summary at root level, not nested under 'summary'
    const summary = {
      totalCredit: reportData?.totalCredit || 0,
      totalDebit: reportData?.totalDebit || 0,
      netBalance: reportData?.netBalance || 0,
      totalTransactions: reportData?.totalTransactions || 0
    };

    if (transactions.length === 0) {
      return <div className="p-8 text-center text-muted-foreground">No transaction data available for this period.</div>;
    }

    // Use backend-calculated running balance (already includes supplier opening balance)
    const transactionsWithBalance = transactions.map((t: any) => {
      // Frontend fallback for time formatting if backend didn't format it
      let displayTime = t.formatted_time || 'N/A';
      if (!t.formatted_time && t.transaction_time) {
        try {
          const timeStr = t.transaction_time.toString();
          const timeParts = timeStr.split(':');
          if (timeParts.length >= 2) {
            const hours = parseInt(timeParts[0]);
            const minutes = parseInt(timeParts[1]);
            const period = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours % 12 || 12;
            const displayMinutes = minutes.toString().padStart(2, '0');
            displayTime = `${displayHours}:${displayMinutes} ${period}`;
          }
        } catch (error) {
          displayTime = 'N/A';
        }
      }
      
      return {
        ...t,
        running_balance: t.running_balance || 0, // Use backend-calculated value
        display_time: displayTime,
        display_days_ago: t.days_ago || 0
      };
    });

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Credit</p>
              <p className="text-2xl font-bold text-green-600">Rs {Math.round(summary.totalCredit || 0).toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Debit</p>
              <p className="text-2xl font-bold text-red-600">Rs {Math.round(summary.totalDebit || 0).toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Net Balance</p>
              <p className="text-2xl font-bold">Rs {Math.round(summary.netBalance || 0).toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Transactions</p>
              <p className="text-2xl font-bold">{transactions.length}</p>
            </CardContent>
          </Card>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Running Balance</TableHead>
              <TableHead>Days Ago</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Recorded By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactionsWithBalance.map((t: any, index: number) => {
              const isCredit = t.type === 'credit';
              return (
                <TableRow key={index} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>{t.formatted_date || new Date(t.transaction_date).toLocaleDateString('en-GB')}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{t.display_time || 'N/A'}</TableCell>
                  <TableCell className="font-semibold">{t.supplier?.name || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={isCredit ? 'default' : 'destructive'}
                      className={isCredit ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-red-100 text-red-800 hover:bg-red-100'}
                    >
                      {isCredit ? '↑ Credit' : '↓ Debit'}
                    </Badge>
                  </TableCell>
                  <TableCell className={`text-right font-semibold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                    Rs {Math.round(parseFloat(t.amount)).toLocaleString()}
                  </TableCell>
                  <TableCell className={`text-right font-bold ${t.running_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Rs {Math.round(t.running_balance).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-1 rounded ${
                      (t.display_days_ago || 0) <= 7 ? 'bg-green-100 text-green-800' :
                      (t.display_days_ago || 0) <= 30 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {t.display_days_ago || 0}d ago
                    </span>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{t.description || '-'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{t.creator?.name || 'System'}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  }, [reportData]);

  const renderGeneralLedgerReport = useCallback(() => {
    const transactions = reportData?.ledger || [];
    const summary = reportData?.summary || {};

    if (transactions.length === 0) {
      return <div className="p-8 text-center text-muted-foreground">No ledger data available for this period.</div>;
    }

    const totalCredit = transactions.filter((t: any) => t.type === 'credit').reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0);
    const totalDebit = transactions.filter((t: any) => t.type === 'debit').reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0);
    const netBalance = totalCredit - totalDebit;

    // Use backend-calculated running balance (already includes supplier opening balance)
    const transactionsWithBalance = transactions.map((t: any) => {
      // Frontend fallback for time formatting if backend didn't format it
      let displayTime = t.formatted_time || 'N/A';
      if (!t.formatted_time && t.transaction_time) {
        try {
          const timeStr = t.transaction_time.toString();
          const timeParts = timeStr.split(':');
          if (timeParts.length >= 2) {
            const hours = parseInt(timeParts[0]);
            const minutes = parseInt(timeParts[1]);
            const period = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours % 12 || 12;
            const displayMinutes = minutes.toString().padStart(2, '0');
            displayTime = `${displayHours}:${displayMinutes} ${period}`;
          }
        } catch (error) {
          displayTime = 'N/A';
        }
      }
      
      return {
        ...t,
        running_balance: t.running_balance || 0, // Use backend-calculated value
        display_time: displayTime,
        display_days_ago: t.days_ago || 0
      };
    });

    return (
      <div className="space-y-6">
        {/* Enhanced Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Opening Balance</p>
              <p className={`text-2xl font-bold ${summary.openingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                Rs {Math.round(summary.openingBalance || 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Closing Balance</p>
              <p className={`text-2xl font-bold ${summary.closingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                Rs {Math.round(summary.closingBalance || 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Avg Transaction</p>
              <p className="text-2xl font-bold text-blue-600">
                Rs {Math.round(summary.avgTransactionValue || 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Credit/Debit Ratio</p>
              <p className="text-2xl font-bold text-purple-600">
                {(summary.creditToDebitRatio || 0).toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Credit</p>
              <p className="text-2xl font-bold text-green-600">Rs {Math.round(totalCredit).toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Debit</p>
              <p className="text-2xl font-bold text-red-600">Rs {Math.round(totalDebit).toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Largest Credit</p>
              <p className="text-2xl font-bold text-green-600">
                Rs {Math.round(summary.largestCredit || 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Largest Debit</p>
              <p className="text-2xl font-bold text-red-600">
                Rs {Math.round(summary.largestDebit || 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Transaction Table */}
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-bold">#</TableHead>
                  <TableHead className="font-bold">Date</TableHead>
                  <TableHead className="font-bold">Time</TableHead>
                  <TableHead className="font-bold">Supplier</TableHead>
                  <TableHead className="font-bold">Contact</TableHead>
                  <TableHead className="font-bold">Type</TableHead>
                  <TableHead className="font-bold text-right">Amount</TableHead>
                  <TableHead className="font-bold text-right">Running Balance</TableHead>
                  <TableHead className="font-bold">Days Ago</TableHead>
                  <TableHead className="font-bold">Description</TableHead>
                  <TableHead className="font-bold">Recorded By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactionsWithBalance.map((t: any, index: number) => {
                  const isCredit = t.type === 'credit';
                  return (
                    <TableRow key={index} className="hover:bg-muted/30">
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{t.formatted_date || new Date(t.transaction_date).toLocaleDateString('en-GB')}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{t.display_time || 'N/A'}</TableCell>
                      <TableCell className="font-semibold">{t.supplier?.name || 'N/A'}</TableCell>
                      <TableCell className="text-sm">{t.supplier?.contact || '-'}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={isCredit ? 'default' : 'destructive'}
                          className={isCredit ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-red-100 text-red-800 hover:bg-red-100'}
                        >
                          {isCredit ? '↑ Credit' : '↓ Debit'}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                        Rs {Math.round(parseFloat(t.amount)).toLocaleString()}
                      </TableCell>
                      <TableCell className={`text-right font-bold ${t.running_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        Rs {Math.round(t.running_balance).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 rounded ${
                          (t.display_days_ago || 0) <= 7 ? 'bg-green-100 text-green-800' :
                          (t.display_days_ago || 0) <= 30 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {t.display_days_ago || 0}d ago
                        </span>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{t.description || '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{t.creator?.name || 'System'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Footer Summary */}
        <div className="bg-muted/30 p-4 rounded-lg border">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Net Balance</p>
              <p className={`text-xl font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                Rs {Math.round(netBalance).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Transactions</p>
              <p className="text-xl font-bold">{transactions.length}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Credit Transactions</p>
              <p className="text-xl font-bold text-green-600">
                {transactions.filter((t: any) => t.type === 'credit').length}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Debit Transactions</p>
              <p className="text-xl font-bold text-red-600">
                {transactions.filter((t: any) => t.type === 'debit').length}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }, [reportData]);

  const renderProfitLossReport = useCallback(() => {
    const dailySales = reportData?.dailySales || [];
    const expenses = reportData?.expenses || [];
    const expenseSummary = reportData?.expenseSummary || {};
    const productSales = reportData?.productSales || [];

    // Calculate total revenue from sales
    const totalRevenue = dailySales.reduce((sum: number, day: any) => sum + (day.revenue || 0), 0);
    const totalOrders = dailySales.reduce((sum: number, day: any) => sum + (day.orders || 0), 0);

    // Calculate COGS (Cost of Goods Sold) from product sales
    const totalCOGS = productSales.reduce((sum: number, product: any) => {
      return sum + parseFloat(product.cost || 0);
    }, 0);

    // Calculate Gross Profit
    const grossProfit = totalRevenue - totalCOGS;
    const grossProfitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    // Calculate real expenses from API data
    const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + parseFloat(exp.amount || 0), 0);
    
    // Group expenses by category
    const expensesByCategory: any = {};
    expenses.forEach((exp: any) => {
      const category = exp.category || 'other';
      if (!expensesByCategory[category]) {
        expensesByCategory[category] = 0;
      }
      expensesByCategory[category] += parseFloat(exp.amount || 0);
    });

    // Calculate Net Profit (Gross Profit - Operating Expenses)
    const netProfit = grossProfit - totalExpenses;
    const netProfitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    if (dailySales.length === 0 && expenses.length === 0) {
      return <div className="p-8 text-center text-muted-foreground">No data available for profit/loss calculation.</div>;
    }

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">Rs {Math.round(totalRevenue).toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Cost of Goods Sold</p>
              <p className="text-2xl font-bold text-orange-600">Rs {Math.round(totalCOGS).toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Gross Profit</p>
              <p className={`text-2xl font-bold ${grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                Rs {Math.round(grossProfit).toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Net Profit</p>
              <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                Rs {Math.round(netProfit).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Gross Margin</p>
              <p className={`text-2xl font-bold ${grossProfitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {grossProfitMargin.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Net Margin</p>
              <p className={`text-2xl font-bold ${netProfitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {netProfitMargin.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold">{totalOrders}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Expense Transactions</p>
              <p className="text-2xl font-bold">{expenses.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Profit & Loss Statement Table */}
        <Card>
          <CardHeader>
            <CardTitle>Profit & Loss Statement</CardTitle>
            <CardDescription>Detailed financial breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">% of Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Revenue */}
                <TableRow className="bg-green-50">
                  <TableCell className="font-bold">Revenue</TableCell>
                  <TableCell className="text-right font-bold text-green-600">Rs {Math.round(totalRevenue).toLocaleString()}</TableCell>
                  <TableCell className="text-right">100%</TableCell>
                </TableRow>

                {/* Cost of Goods Sold */}
                <TableRow className="bg-orange-50">
                  <TableCell className="font-bold pl-8">Cost of Goods Sold (COGS)</TableCell>
                  <TableCell className="text-right font-bold text-orange-600">- Rs {Math.round(totalCOGS).toLocaleString()}</TableCell>
                  <TableCell className="text-right">{totalRevenue > 0 ? ((totalCOGS / totalRevenue) * 100).toFixed(1) : 0}%</TableCell>
                </TableRow>

                {/* Gross Profit */}
                <TableRow className="bg-blue-50 font-bold">
                  <TableCell>Gross Profit</TableCell>
                  <TableCell className={`text-right ${grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Rs {Math.round(grossProfit).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">{grossProfitMargin.toFixed(1)}%</TableCell>
                </TableRow>

                {/* Operating Expenses by Category */}
                {Object.entries(expensesByCategory)
                  .sort((a, b) => (b[1] as number) - (a[1] as number))
                  .map(([category, amount]) => {
                    const categoryLabel = category.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
                    const percentage = totalRevenue > 0 ? ((amount as number / totalRevenue) * 100) : 0;
                    return (
                      <TableRow key={category}>
                        <TableCell className="pl-8">{categoryLabel}</TableCell>
                        <TableCell className="text-right text-red-600">- Rs {Math.round(amount as number).toLocaleString()}</TableCell>
                        <TableCell className="text-right">{percentage.toFixed(1)}%</TableCell>
                      </TableRow>
                    );
                  })}

                {/* Total Operating Expenses */}
                <TableRow className="bg-red-50">
                  <TableCell className="font-bold">Total Operating Expenses</TableCell>
                  <TableCell className="text-right font-bold text-red-600">- Rs {Math.round(totalExpenses).toLocaleString()}</TableCell>
                  <TableCell className="text-right">{totalRevenue > 0 ? ((totalExpenses / totalRevenue) * 100).toFixed(1) : 0}%</TableCell>
                </TableRow>

                {/* Net Profit/Loss */}
                <TableRow className={`font-bold text-lg ${netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  <TableCell>Net {netProfit >= 0 ? 'Profit' : 'Loss'}</TableCell>
                  <TableCell className={`text-right ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Rs {Math.round(netProfit).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">{netProfitMargin.toFixed(1)}%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Expense Breakdown */}
        {expenses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Expense Breakdown</CardTitle>
              <CardDescription>Detailed expense transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.slice(0, 20).map((exp: any, idx: number) => {
                    const categoryLabel = exp.category ? exp.category.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : '-';
                    const paymentLabel = exp.payment_method ? exp.payment_method.replace('_', ' ') : '-';
                    const statusColor = exp.status === 'approved' ? 'text-green-600' : exp.status === 'pending' ? 'text-yellow-600' : 'text-red-600';
                    
                    return (
                      <TableRow key={idx}>
                        <TableCell>{new Date(exp.expense_date).toLocaleDateString('en-GB')}</TableCell>
                        <TableCell className="font-medium">{exp.title}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-gray-100 rounded text-xs">{categoryLabel}</span>
                        </TableCell>
                        <TableCell>{exp.vendor_name || '-'}</TableCell>
                        <TableCell>{paymentLabel}</TableCell>
                        <TableCell className="text-right font-semibold text-red-600">
                          Rs {Math.round(parseFloat(exp.amount)).toLocaleString()}
                        </TableCell>
                        <TableCell className={`font-semibold capitalize ${statusColor}`}>
                          {exp.status}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {expenses.length > 20 && (
                <div className="text-center text-sm text-muted-foreground mt-2">
                  Showing first 20 of {expenses.length} expenses
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }, [reportData]);

  const renderExpenseReport = useCallback(() => {
    const expenses = reportData?.expenses || [];
    const summary = reportData?.summary || {};

    if (expenses.length === 0) {
      return <div className="p-8 text-center text-muted-foreground">No expense data available for this period.</div>;
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">Rs {Math.round(summary.totalExpenses || 0).toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Transactions</p>
              <p className="text-2xl font-bold">{expenses.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Average Expense</p>
              <p className="text-2xl font-bold">Rs {Math.round(summary.averageExpense || 0).toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Top Category</p>
              <p className="text-xl font-bold">{summary.expensesByCategory?.[0]?.label || 'N/A'}</p>
            </CardContent>
          </Card>
        </div>

        {/* Category Breakdown */}
        {summary.expensesByCategory && summary.expensesByCategory.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Expenses by Category</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead className="text-right">% of Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.expensesByCategory.map((cat: any) => (
                  <TableRow key={cat.category}>
                    <TableCell className="font-medium">{cat.label}</TableCell>
                    <TableCell className="text-right">{cat.count}</TableCell>
                    <TableCell className="text-right">Rs {Math.round(cat.total).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      {((cat.total / summary.totalExpenses) * 100).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Expense Details */}
        <div>
          <h3 className="font-semibold mb-2">Expense Details</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Receipt#</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((exp: any) => (
                <TableRow key={exp.id}>
                  <TableCell>{new Date(exp.expense_date).toLocaleDateString('en-GB')}</TableCell>
                  <TableCell className="font-medium">{exp.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {exp.category?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  </TableCell>
                  <TableCell>{exp.vendor_name || '-'}</TableCell>
                  <TableCell className="capitalize">{exp.payment_method?.replace('_', ' ')}</TableCell>
                  <TableCell className="font-mono text-sm">{exp.receipt_number || '-'}</TableCell>
                  <TableCell className="text-right font-bold text-red-600">
                    Rs {Math.round(exp.amount).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge className={
                      exp.status === 'approved' ? 'bg-green-100 text-green-800' :
                      exp.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }>
                      {exp.status.charAt(0).toUpperCase() + exp.status.slice(1)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }, [reportData]);

  const renderSupplierReport = useCallback(() => {
    const suppliers = reportData?.suppliers || [];
    const summary = reportData?.summary || {};

    if (suppliers.length === 0) {
      return <div className="p-8 text-center text-muted-foreground">No supplier data available for this period.</div>;
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Suppliers</p>
              <p className="text-2xl font-bold">{suppliers.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Purchases</p>
              <p className="text-2xl font-bold">Rs {Math.round(summary.totalPurchases || 0).toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Outstanding Balance</p>
              <p className="text-2xl font-bold">Rs {Math.round(summary.outstandingBalance || 0).toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Avg Payment Ratio</p>
              <p className="text-2xl font-bold">
                {summary.totalPurchases > 0 ? ((summary.totalPaid || 0) / summary.totalPurchases * 100).toFixed(1) : 0}%
              </p>
            </CardContent>
          </Card>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Supplier Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="text-right">Total Purchases</TableHead>
              <TableHead className="text-right">Total Paid</TableHead>
              <TableHead className="text-right">Outstanding</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.map((supplier: any, index: number) => (
              <TableRow key={index}>
                <TableCell>{supplier.name || 'N/A'}</TableCell>
                <TableCell>{supplier.contact || 'N/A'}</TableCell>
                <TableCell className="text-right">Rs {Math.round(supplier.totalPurchases || 0).toLocaleString()}</TableCell>
                <TableCell className="text-right">Rs {Math.round(supplier.totalPaid || 0).toLocaleString()}</TableCell>
                <TableCell className={`text-right ${supplier.outstanding > 0 ? 'text-red-600 font-bold' : 'text-green-600'}`}>
                  Rs {Math.round(supplier.outstanding || 0).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }, [reportData]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reports & Analytics</h2>
          <p className="text-muted-foreground">Generate and export comprehensive business reports</p>
        </div>
        <Button onClick={downloadPDF} disabled={loading || !reportData} className="gap-2">
          <FileDown className="w-4 h-4" />
          Export PDF
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
          <CardDescription>Select report type and date range to generate reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Sales Report</SelectItem>
                  <SelectItem value="customer">Customer Report</SelectItem>
                  <SelectItem value="supplier">Supplier Report</SelectItem>
                  <SelectItem value="employee">Employee Report</SelectItem>
                  <SelectItem value="creditDebit">Credit & Debit Report</SelectItem>
                  <SelectItem value="generalLedger">General Ledger Report</SelectItem>
                  <SelectItem value="expense">Expense Report</SelectItem>
                  <SelectItem value="profitLoss">Profit & Loss Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {reportType === 'supplier' && (
              <div className="relative">
                <label className="text-sm font-medium mb-2 block">Filter by Supplier</label>
                <button
                  type="button"
                  onClick={() => setShowSupplierDropdown(!showSupplierDropdown)}
                  className="w-full px-3 py-2 border rounded-md bg-background text-left flex items-center justify-between hover:border-primary transition-colors"
                >
                  <span className="text-sm">
                    {selectedSupplierIds.length === 0 
                      ? 'Select Suppliers' 
                      : `${selectedSupplierIds.length} supplier(s) selected`}
                  </span>
                  <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showSupplierDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg">
                    {/* Search Input */}
                    <div className="p-2 border-b">
                      <input
                        type="text"
                        placeholder="Search suppliers..."
                        value={supplierSearchTerm}
                        onChange={(e) => setSupplierSearchTerm(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    
                    {/* All Suppliers Option */}
                    <div className="p-2 border-b hover:bg-muted cursor-pointer" onClick={() => {
                      // Toggle all suppliers
                      if (selectedSupplierIds.length === supplierList.length) {
                        // If all selected, deselect all
                        setSelectedSupplierIds([]);
                      } else {
                        // Select all suppliers
                        setSelectedSupplierIds(supplierList.map(s => String(s.id)));
                      }
                      setShowSupplierDropdown(false);
                    }}>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedSupplierIds.length === supplierList.length && supplierList.length > 0}
                          readOnly
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-medium">All Suppliers</span>
                      </div>
                    </div>
                    
                    {/* Supplier List */}
                    <div className="max-h-48 overflow-y-auto">
                      {supplierList
                        .filter(s => s.name.toLowerCase().includes(supplierSearchTerm.toLowerCase()))
                        .map((supplier: any) => (
                          <div
                            key={supplier.id}
                            className="p-2 hover:bg-muted cursor-pointer flex items-center gap-2"
                            onClick={() => {
                              const id = String(supplier.id);
                              console.log('👆 SUPPLIER CLICK - Supplier:', supplier.name, 'ID:', id);
                              console.log('👆 SUPPLIER CLICK - Current selectedSupplierIds:', selectedSupplierIds);
                              
                              if (selectedSupplierIds.includes(id)) {
                                console.log(' SUPPLIER CLICK - Removing supplier ID:', id);
                                setSelectedSupplierIds(prev => {
                                  const newState = prev.filter(i => i !== id);
                                  console.log('👆 SUPPLIER CLICK - New state after remove:', newState);
                                  return newState;
                                });
                              } else {
                                console.log('👆 SUPPLIER CLICK - Adding supplier ID:', id);
                                setSelectedSupplierIds(prev => {
                                  const newState = [...prev, id];
                                  console.log('👆 SUPPLIER CLICK - New state after add:', newState);
                                  return newState;
                                });
                              }
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedSupplierIds.includes(String(supplier.id))}
                              readOnly
                              className="w-4 h-4"
                            />
                            <span className="text-sm flex-1">{supplier.name}</span>
                          </div>
                        ))}
                      {supplierList.filter(s => s.name.toLowerCase().includes(supplierSearchTerm.toLowerCase())).length === 0 && (
                        <div className="p-3 text-sm text-muted-foreground text-center">No suppliers found</div>
                      )}
                    </div>
                    
                    {/* Selected Count */}
                    {selectedSupplierIds.length > 0 && (
                      <div className="p-2 border-t bg-muted/50 text-xs text-center text-muted-foreground">
                        {selectedSupplierIds.length} supplier(s) selected
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Credit/Debit Report - Single Supplier Filter */}
            {reportType === 'creditDebit' && (
              <div className="relative">
                <label className="text-sm font-medium mb-2 block">Filter by Supplier</label>
                <button
                  type="button"
                  onClick={() => setShowCreditDebitSupplierDropdown(!showCreditDebitSupplierDropdown)}
                  className="w-full px-3 py-2 border rounded-md bg-background text-left flex items-center justify-between hover:border-primary transition-colors"
                >
                  <span className="text-sm">
                    {creditDebitSupplierFilter === 'all' 
                      ? 'All Suppliers' 
                      : supplierList.find(s => String(s.id) === creditDebitSupplierFilter)?.name || 'Select Supplier'}
                  </span>
                  <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showCreditDebitSupplierDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg">
                    {/* Search Input */}
                    <div className="p-2 border-b">
                      <input
                        type="text"
                        placeholder="Search suppliers..."
                        value={creditDebitSupplierSearchTerm}
                        onChange={(e) => setCreditDebitSupplierSearchTerm(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    
                    {/* All Suppliers Option */}
                    <div 
                      className="p-2 border-b hover:bg-muted cursor-pointer" 
                      onClick={() => {
                        setCreditDebitSupplierFilter('all');
                        setShowCreditDebitSupplierDropdown(false);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={creditDebitSupplierFilter === 'all'}
                          readOnly
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-medium">All Suppliers</span>
                      </div>
                    </div>
                    
                    {/* Supplier List */}
                    <div className="max-h-48 overflow-y-auto">
                      {supplierList
                        .filter(s => s.name.toLowerCase().includes(creditDebitSupplierSearchTerm.toLowerCase()))
                        .map((supplier: any) => (
                          <div
                            key={supplier.id}
                            className="p-2 hover:bg-muted cursor-pointer flex items-center gap-2"
                            onClick={() => {
                              setCreditDebitSupplierFilter(String(supplier.id));
                              setShowCreditDebitSupplierDropdown(false);
                            }}
                          >
                            <input
                              type="radio"
                              checked={creditDebitSupplierFilter === String(supplier.id)}
                              readOnly
                              className="w-4 h-4"
                            />
                            <span className="text-sm flex-1">{supplier.name}</span>
                          </div>
                        ))}
                      {supplierList.filter(s => s.name.toLowerCase().includes(creditDebitSupplierSearchTerm.toLowerCase())).length === 0 && (
                        <div className="p-3 text-sm text-muted-foreground text-center">No suppliers found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* General Ledger Report - Single Supplier Filter */}
            {reportType === 'generalLedger' && (
              <div className="relative ledger-supplier-dropdown-container">
                <label className="text-sm font-medium mb-2 block">Filter by Supplier</label>
                <button
                  type="button"
                  onClick={() => setShowLedgerSupplierDropdown(!showLedgerSupplierDropdown)}
                  className="w-full px-3 py-2 border rounded-md bg-background text-left flex items-center justify-between hover:border-primary transition-colors"
                >
                  <span className="text-sm">
                    {ledgerSupplierFilter === 'all' 
                      ? 'All Suppliers' 
                      : supplierList.find(s => String(s.id) === ledgerSupplierFilter)?.name || 'Select Supplier'}
                  </span>
                  <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showLedgerSupplierDropdown && (
                  <div className="absolute z-50 mt-1 w-full bg-background border rounded-md shadow-lg max-h-60 overflow-hidden">
                    <div className="p-2 border-b">
                      <input
                        type="text"
                        placeholder="Search suppliers..."
                        value={ledgerSupplierSearchTerm}
                        onChange={(e) => setLedgerSupplierSearchTerm(e.target.value)}
                        className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="overflow-y-auto max-h-48">
                      <button
                        type="button"
                        onClick={() => {
                          setLedgerSupplierFilter('all');
                          setShowLedgerSupplierDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex items-center gap-2"
                      >
                        <input
                          type="radio"
                          name="ledgerSupplier"
                          checked={ledgerSupplierFilter === 'all'}
                          onChange={() => {}}
                          className="w-3 h-3"
                        />
                        <span>All Suppliers</span>
                      </button>
                      {supplierList
                        .filter(s => s.name.toLowerCase().includes(ledgerSupplierSearchTerm.toLowerCase()))
                        .map(supplier => (
                          <button
                            key={supplier.id}
                            type="button"
                            onClick={() => {
                              setLedgerSupplierFilter(String(supplier.id));
                              setShowLedgerSupplierDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex items-center gap-2"
                          >
                            <input
                              type="radio"
                              name="ledgerSupplier"
                              checked={ledgerSupplierFilter === String(supplier.id)}
                              onChange={() => {}}
                              className="w-3 h-3"
                            />
                            <span>{supplier.name}</span>
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="flex items-end">
              <Button onClick={loadReportData} disabled={loading} className="w-full gap-2">
                {loading ? 'Loading...' : 'Generate Report'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-muted-foreground">Loading report data...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && reportData && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Summary Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {reportType === 'creditDebit' ? 'Total Credit' : 
                     reportType === 'generalLedger' ? 'Total Credit' : 
                     reportType === 'expense' ? 'Total Expenses' : 
                     reportType === 'profitLoss' ? 'Total Revenue' : 'Total Revenue'}
                  </p>
                  <p className="text-2xl font-bold">Rs {Math.round(summaryStatsState.totalRevenue).toLocaleString()}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {reportType === 'creditDebit' ? 'Total Debit' : 
                     reportType === 'generalLedger' ? 'Total Debit' : 
                     reportType === 'expense' ? 'Transactions' : 
                     reportType === 'profitLoss' ? 'Total Orders' : 'Total Orders'}
                  </p>
                  <p className="text-2xl font-bold">
                    {reportType === 'creditDebit' || reportType === 'generalLedger'
                      ? `Rs ${Math.round(summaryStatsState.totalOrders).toLocaleString()}`
                      : summaryStatsState.totalOrders}
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {reportType === 'sales' ? 'Unique Customers' : 
                     reportType === 'customer' ? 'Total Customers' :
                     reportType === 'supplier' ? 'Total Suppliers' :
                     reportType === 'employee' ? 'Total Employees' :
                     reportType === 'creditDebit' ? 'Total Transactions' :
                     reportType === 'generalLedger' ? 'Total Transactions' :
                     reportType === 'expense' ? 'Categories' :
                     reportType === 'profitLoss' ? 'Net Profit/Loss' :
                     'Total Records'}
                  </p>
                  <p className="text-2xl font-bold">
                    {reportType === 'expense' 
                      ? (reportData?.summary?.expensesByCategory?.length || 0)
                      : reportType === 'profitLoss'
                        ? `Rs ${Math.round(summaryStatsState.totalCustomers).toLocaleString()}`
                        : summaryStatsState.totalCustomers}
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {reportType === 'sales' ? 'Products Sold' :
                     reportType === 'customer' ? 'Total Visits' :
                     reportType === 'supplier' ? 'Outstanding Balance' :
                     reportType === 'employee' ? 'Avg Sales/Employee' :
                     reportType === 'creditDebit' ? 'Net Balance' :
                     reportType === 'generalLedger' ? 'Net Balance' :
                     reportType === 'expense' ? 'Average Expense' :
                     reportType === 'profitLoss' ? 'Expense Transactions' :
                     'Total Items'}
                  </p>
                  <p className="text-2xl font-bold">
                    {reportType === 'supplier' ? 
                      `Rs ${Math.round(summaryStatsState.totalProducts).toLocaleString()}` :
                      reportType === 'customer' ? 
                        (reportData.customers ? reportData.customers.reduce((sum: number, c: any) => sum + (c.totalVisits || 0), 0) : 0) :
                        reportType === 'creditDebit' || reportType === 'generalLedger' ?
                          `Rs ${Math.round((summaryStatsState.totalRevenue - summaryStatsState.totalOrders)).toLocaleString()}` :
                          reportType === 'expense' ?
                            `Rs ${Math.round(reportData?.summary?.averageExpense || 0).toLocaleString()}` :
                            reportType === 'profitLoss' ?
                              summaryStatsState.totalProducts :
                              summaryStatsState.totalProducts}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{reportTitles[reportType]}</CardTitle>
              <CardDescription>Detailed report data</CardDescription>
            </CardHeader>
            <CardContent>
              {reportType === 'sales' && renderSalesReport()}
              {reportType === 'customer' && renderCustomerReport()}
              {reportType === 'supplier' && renderSupplierReport()}
              {reportType === 'employee' && renderEmployeeReport()}
              {reportType === 'creditDebit' && renderCreditDebitReport()}
              {reportType === 'generalLedger' && renderGeneralLedgerReport()}
              {reportType === 'expense' && renderExpenseReport()}
              {reportType === 'profitLoss' && renderProfitLossReport()}
            </CardContent>
          </Card>
        </>
      )}

      {!loading && !reportData && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Select a report type and date range, then click "Generate Report"</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
