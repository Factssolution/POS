import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { 
  Users, Download, Search, Calendar, TrendingUp, DollarSign, 
  Eye, Printer, FileText, Phone, MapPin, ShoppingBag,
  ChevronLeft, ChevronRight, X
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../services/api';

export default function CustomerReports() {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [companySettings, setCompanySettings] = useState({
    name: 'POS System',
    logo: ''
  });
  
  // Fetch company settings on mount
  useEffect(() => {
    const fetchCompanySettings = async () => {
      try {
        const settings = await api.getSettings();
        setCompanySettings({
          name: settings.company_name || 'POS System',
          logo: settings.company_logo || ''
        });
        console.log('✅ CustomerReports - Company settings loaded:', settings.company_name);
      } catch (error) {
        console.error(' Failed to load company settings:', error);
      }
    };
    fetchCompanySettings();
  }, []);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [customerHistory, setCustomerHistory] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadCustomerData();
  }, [startDate, endDate]);

  const loadCustomerData = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (search) params.search = search;

      const response = await api.getCustomerReport(params);
      
      console.log('📊 Customer Report Raw Response:', response);
      
      // Handle different response structures
      // Structure 1: {success: true, data: {customers, summary, totalCustomers}}
      // Structure 2: {customers, summary, totalCustomers} (direct)
      let customerData = response;
      
      // Unwrap if wrapped in {success, data}
      if (response && response.data) {
        customerData = response.data;
      }
      
      console.log('📊 Customer Data (unwrapped):', customerData);
      
      if (customerData && customerData.customers) {
        setCustomers(customerData.customers || []);
        setSummary(customerData.summary || null);
        console.log(`✅ Loaded ${customerData.customers.length} customers`);
      } else {
        console.error('Invalid response structure - no customers array:', customerData);
        setCustomers([]);
        setSummary(null);
      }
    } catch (error: any) {
      console.error('Failed to load customer data:', error);
      toast.error('Failed to load customer report');
      setCustomers([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadCustomerData();
  };

  const handleDateFilter = () => {
    setCurrentPage(1);
    loadCustomerData();
  };

  const clearFilters = () => {
    setSearch('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
    loadCustomerData();
  };

  const viewCustomerHistory = async (phone: string) => {
    try {
      setHistoryLoading(true);
      setSelectedCustomer(phone);
      setShowHistory(true);
      
      const response = await api.getCustomerHistory(phone);
      
      console.log('📋 Customer History Raw Response:', response);
      
      // Handle different response structures
      let historyData = response;
      
      // Unwrap if wrapped in {success, data}
      if (response && response.data) {
        historyData = response.data;
      }
      
      console.log('📋 Customer History (unwrapped):', historyData);
      
      if (historyData && historyData.orders) {
        setCustomerHistory(historyData);
        console.log(`✅ Loaded ${historyData.orders.length} orders for ${historyData.name}`);
      } else {
        console.error('Invalid history response - no orders array:', historyData);
        toast.error('Invalid customer history data');
      }
    } catch (error: any) {
      console.error('Failed to load customer history:', error);
      toast.error('Failed to load customer history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const printCustomerPDF = (customer: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print PDF');
      return;
    }

    // Logo HTML
    const logoHTML = companySettings.logo 
      ? `<img src="${companySettings.logo}" alt="Company Logo" style="width: 80px; height: 80px; object-fit: contain; background: white; border-radius: 12px; padding: 10px;" />`
      : `<div style="width: 80px; height: 80px; background: white; border-radius: 12px; padding: 10px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #424242; font-size: 24px;">∞</div>`;

    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const formattedTime = currentDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const periodLabel = 'All Time';

    // Calculate metrics
    const avgOrderValue = customer.totalOrders > 0 ? customer.totalSpent / customer.totalOrders : 0;
    const totalItems = customer.orders ? customer.orders.reduce((sum: number, order: any) => sum + order.items.length, 0) : 0;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Customer Report - ${companySettings.name}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 0; background: white; color: #1a1a1a; line-height: 1.6; }
          .header { background: #424242; color: white; padding: 30px 40px; display: flex; justify-content: space-between; align-items: center; }
          .header-left { display: flex; align-items: center; gap: 20px; }
          .company-name { font-size: 28px; font-weight: bold; margin: 0; }
          .tagline { font-size: 14px; opacity: 0.9; margin-top: 5px; }
          .powered { font-size: 12px; font-style: italic; opacity: 0.8; margin-top: 3px; }
          .header-right { text-align: right; }
          .header-right h2 { font-size: 24px; margin: 0 0 10px 0; }
          .header-right p { font-size: 13px; margin: 3px 0; opacity: 0.9; }
          .content { padding: 40px; }
          .section-heading { font-size: 20px; font-weight: 600; color: #424242; margin: 30px 0 20px 0; padding-bottom: 10px; border-bottom: 2px solid #e0e0e0; }
          .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
          .metric-card { background: #f5f5f5; padding: 20px; border-radius: 8px; border-left: 4px solid #424242; }
          .metric-label { font-size: 12px; color: #757575; text-transform: uppercase; margin-bottom: 8px; }
          .metric-value { font-size: 24px; font-weight: bold; color: #424242; }
          .additional-metrics { margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 8px; font-size: 13px; }
          .additional-metrics div { display: inline-block; margin-right: 30px; }
          .additional-metrics span { color: #757575; }
          .additional-metrics strong { margin-left: 8px; color: #1a1a1a; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #424242; color: white; padding: 12px; text-align: left; font-size: 13px; font-weight: 600; }
          td { padding: 12px; border-bottom: 1px solid #e0e0e0; font-size: 13px; }
          tr:nth-child(even) { background: #f9f9f9; }
          .report-info { background: #fafafa; padding: 20px; border-left: 4px solid #424242; margin: 30px 0; }
          .report-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 14px; }
          .report-info-item label { color: #757575; display: block; margin-bottom: 5px; font-size: 12px; }
          .report-info-item div { font-weight: 600; color: #1a1a1a; }
          .signature-section { margin-top: 50px; padding-top: 20px; border-top: 2px solid #e0e0e0; }
          .signature-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 40px; text-align: center; }
          .signature-box { border-top: 2px solid #424242; padding-top: 10px; margin-top: 60px; }
          .signature-box .title { font-weight: 600; color: #424242; margin-bottom: 5px; }
          .signature-box .role { font-size: 12px; color: #757575; }
          .disclaimer { margin-top: 30px; padding: 15px; background: #fff9c4; border-left: 4px solid #f57f17; border-radius: 4px; }
          .disclaimer p { font-size: 12px; color: #f57f17; margin: 0; }
          .footer { background: #f5f5f5; padding: 20px 40px; text-align: center; margin-top: 40px; border-top: 2px solid #e0e0e0; }
          .footer-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; font-size: 12px; color: #757575; }
          @media print { body { background: white; } .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-left">
            ${logoHTML}
            <div>
              <h1 class="company-name">${companySettings.name}</h1>
              <p class="tagline">Professional POS Business System</p>
              <p class="powered">Powered by Factssolution</p>
            </div>
          </div>
          <div class="header-right">
            <h2>Customer Report</h2>
            <p>Generated: ${formattedDate}</p>
            <p>Time: ${formattedTime}</p>
            <p>Period: ${periodLabel}</p>
          </div>
        </div>
        
        <div class="content">
          <div class="section-heading">Customer Profile</div>
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-label">Customer Name</div>
              <div class="metric-value" style="font-size: 18px;">${customer.name || 'N/A'}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Phone Number</div>
              <div class="metric-value" style="font-size: 18px;">${customer.phone || 'N/A'}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Total Visits</div>
              <div class="metric-value">${customer.totalVisits || 0}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Total Spent</div>
              <div class="metric-value" style="color: #388e3c;">Rs ${(customer.totalSpent || 0).toFixed(2)}</div>
            </div>
          </div>

          <div class="additional-metrics">
            <div><span>Total Orders:</span><strong>${customer.totalOrders || 0}</strong></div>
            <div><span>Avg Order Value:</span><strong>Rs ${avgOrderValue.toFixed(2)}</strong></div>
            <div><span>Total Items:</span><strong>${totalItems}</strong></div>
          </div>

          ${customer.orders && customer.orders.length > 0 ? `
          <div class="section-heading" style="margin-top: 40px;">Order History (${customer.orders.length} orders)</div>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Token #</th>
                  <th>Items</th>
                  <th>Payment</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${customer.orders.map((order: any) => `
                  <tr>
                    <td>${new Date(order.date).toLocaleDateString('en-GB')}</td>
                    <td>#${order.token_number}</td>
                    <td>${order.items.length} item(s)</td>
                    <td style="text-transform: capitalize;">${order.payment_method}</td>
                    <td style="text-align: right; font-weight: bold; color: #424242;">Rs ${(order.total || 0).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : ''}

          ${customer.topProducts && customer.topProducts.length > 0 ? `
          <div class="section-heading" style="margin-top: 40px;">Top Products Purchased</div>
            <table>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th style="text-align: right;">Quantity</th>
                  <th style="text-align: right;">Total Spent</th>
                </tr>
              </thead>
              <tbody>
                ${customer.topProducts.map((product: any) => `
                  <tr>
                    <td><strong>${product.name}</strong></td>
                    <td>${product.category}</td>
                    <td style="text-align: right;">${product.quantity}</td>
                    <td style="text-align: right; font-weight: bold; color: #424242;">Rs ${(product.revenue || 0).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : ''}

          <div class="section-heading" style="margin-top: 40px;">Report Information & Verification</div>
          <div class="report-info">
            <div class="report-info-grid">
              <div class="report-info-item">
                <label>Generated By</label>
                <div>System Administrator</div>
              </div>
              <div class="report-info-item">
                <label>Report Period</label>
                <div>${periodLabel}</div>
              </div>
              <div class="report-info-item">
                <label>Total Orders</label>
                <div>${customer.totalOrders || 0}</div>
              </div>
              <div class="report-info-item">
                <label>Total Visits</label>
                <div>${customer.totalVisits || 0}</div>
              </div>
              <div class="report-info-item">
                <label>Total Revenue</label>
                <div style="color: #388e3c;">Rs ${(customer.totalSpent || 0).toFixed(2)}</div>
              </div>
              <div class="report-info-item">
                <label>Avg Order Value</label>
                <div style="color: #1976d2;">Rs ${avgOrderValue.toFixed(2)}</div>
              </div>
            </div>
          </div>
          
          <div class="signature-section">
            <div class="signature-grid">
              <div>
                <div class="signature-box">
                  <div class="title">Prepared By</div>
                  <div class="role">System Administrator</div>
                </div>
              </div>
              <div>
                <div class="signature-box">
                  <div class="title">Reviewed By</div>
                  <div class="role">Manager</div>
                </div>
              </div>
              <div>
                <div class="signature-box">
                  <div class="title">Approved By</div>
                  <div class="role">Director</div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="disclaimer">
            <p><strong>Note:</strong> This is a system-generated customer report. All data is based on actual transactions recorded in the POS system.</p>
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-grid">
            <div>© 2025-2026 ${companySettings.name}. All Rights Reserved.</div>
            <div>Powered by Factssolution</div>
            <div>Confidential Business Report</div>
          </div>
        </div>
        
        <script>window.print();</script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    toast.success('PDF generated successfully!');
  };

  const printCustomerThermal = async (customer: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print');
      return;
    }

    // Logo HTML for thermal receipt
    const logoHTML = companySettings.logo 
      ? `<div style="text-align: center; margin-bottom: 8px;"><img src="${companySettings.logo}" style="width: 60px; height: 60px; object-fit: contain; display: block; margin: 0 auto;" onerror="this.style.display='none'" /></div>`
      : '';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Customer Receipt</title>
        <style>
          @page { 
            size: 80mm auto;
            margin: 0;
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            width: 80mm;
            min-height: auto;
            font-family: 'Courier New', monospace;
            font-size: 11px;
            padding: 3mm 4mm;
            line-height: 1.3;
            overflow: visible;
          }
          .header { text-align: center; margin-bottom: 8px; }
          .logo { margin-bottom: 3px; }
          .logo img { max-width: 70px; height: auto; }
          .company-name { font-size: 15px; font-weight: bold; margin-bottom: 2px; }
          .tagline { font-size: 9px; margin-bottom: 2px; }
          .divider { border-top: 1px dashed #000; margin: 6px 0; }
          .info { margin-bottom: 4px; }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 2px; font-size: 10px; }
          .order-item { margin-bottom: 6px; }
          .item-header { font-weight: bold; margin-bottom: 2px; font-size: 10px; }
          .item-details { margin-left: 8px; font-size: 9px; line-height: 1.2; }
          .totals { margin-top: 6px; }
          .total-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
          .grand-total { font-weight: bold; font-size: 12px; border-top: 1px dashed #000; padding-top: 4px; margin-top: 4px; }
          .footer { text-align: center; margin-top: 8px; font-size: 9px; line-height: 1.3; }
          @media print { 
            body { padding: 0; }
            img { 
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          ${logoHTML}
          <div class="company-name">${companySettings.name}</div>
          <div class="tagline">Professional POS Business System</div>
          <div style="font-size: 9px; margin-top: 3px;">Customer Purchase Summary</div>
        </div>
        <div class="divider"></div>
        
        <div class="info">
          <div class="info-row"><span>Customer:</span><span>${customer.name}</span></div>
          <div class="info-row"><span>Phone:</span><span>${customer.phone}</span></div>
          <div class="info-row"><span>Total Visits:</span><span>${customer.totalVisits}</span></div>
          <div class="info-row"><span>Total Orders:</span><span>${customer.totalOrders}</span></div>
        </div>
        
        <div class="divider"></div>
        <div style="text-align: center; font-weight: bold; margin: 8px 0;">ORDER HISTORY</div>
        <div class="divider"></div>

        ${customer.orders.slice(0, 5).map((order: any) => {
          // Debug: Log the actual date value
          console.log('📅 Order date raw value:', order.date, 'Type:', typeof order.date);
          
          // Format date safely
          let orderDate = 'N/A';
          if (order.date) {
            try {
              const date = new Date(order.date);
              console.log('📅 Parsed date:', date, 'Valid:', !isNaN(date.getTime()));
              if (!isNaN(date.getTime())) {
                orderDate = date.toLocaleDateString('en-GB');
              }
            } catch (e) {
              console.error('❌ Date parsing error:', e);
              orderDate = 'N/A';
            }
          }
          
          return `
          <div class="order-item">
            <div class="item-header">Token #${order.token_number} - ${orderDate}</div>
            ${order.items.map((item: any) => `
              <div class="item-details">
                ${item.product_name} x${item.quantity} = Rs ${(item.total || 0).toFixed(2)}
              </div>
            `).join('')}
            <div class="item-details" style="font-weight: bold; margin-top: 3px;">
              Total: Rs ${(order.total || 0).toFixed(2)}
            </div>
          </div>
          <div class="divider"></div>
        `;
        }).join('')}

        <div class="totals">
          <div class="total-row grand-total">
            <span>TOTAL SPENT:</span>
            <span>Rs ${(customer.totalSpent || 0).toFixed(2)}</span>
          </div>
        </div>

        <div class="divider"></div>
        <div class="footer">
          <p>Thank you for your business!</p>
          <p>Powered by Factssolution</p>
          <p>© 2025-2026 ${companySettings.name}</p>
        </div>
        
        <script>window.print();</script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    toast.success('Thermal receipt sent to printer!');
  };

  const printAllCustomersPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print PDF');
      return;
    }

    // Logo HTML
    const logoHTML = companySettings.logo 
      ? `<img src="${companySettings.logo}" alt="Company Logo" style="width: 80px; height: 80px; object-fit: contain; background: white; border-radius: 12px; padding: 10px;" />`
      : `<div style="width: 80px; height: 80px; background: white; border-radius: 12px; padding: 10px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #424242; font-size: 24px;">∞</div>`;

    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const formattedTime = currentDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const periodLabel = 'All Time';

    // Calculate metrics
    const totalOrders = customers.reduce((sum: number, c: any) => sum + (c.totalOrders || 0), 0);
    const totalVisits = customers.reduce((sum: number, c: any) => sum + (c.totalVisits || 0), 0);
    const avgOrderValue = totalOrders > 0 ? (summary?.totalRevenue || 0) / totalOrders : 0;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Customer Report - ${companySettings.name}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 0; background: white; color: #1a1a1a; line-height: 1.6; }
          .header { background: #424242; color: white; padding: 30px 40px; display: flex; justify-content: space-between; align-items: center; }
          .header-left { display: flex; align-items: center; gap: 20px; }
          .company-name { font-size: 28px; font-weight: bold; margin: 0; }
          .tagline { font-size: 14px; opacity: 0.9; margin-top: 5px; }
          .powered { font-size: 12px; font-style: italic; opacity: 0.8; margin-top: 3px; }
          .header-right { text-align: right; }
          .header-right h2 { font-size: 24px; margin: 0 0 10px 0; }
          .header-right p { font-size: 13px; margin: 3px 0; opacity: 0.9; }
          .content { padding: 40px; }
          .section-heading { font-size: 20px; font-weight: 600; color: #424242; margin: 30px 0 20px 0; padding-bottom: 10px; border-bottom: 2px solid #e0e0e0; }
          .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
          .metric-card { background: #f5f5f5; padding: 20px; border-radius: 8px; border-left: 4px solid #424242; }
          .metric-label { font-size: 12px; color: #757575; text-transform: uppercase; margin-bottom: 8px; }
          .metric-value { font-size: 24px; font-weight: bold; color: #424242; }
          .additional-metrics { margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 8px; font-size: 13px; }
          .additional-metrics div { display: inline-block; margin-right: 30px; }
          .additional-metrics span { color: #757575; }
          .additional-metrics strong { margin-left: 8px; color: #1a1a1a; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #424242; color: white; padding: 12px; text-align: left; font-size: 13px; font-weight: 600; }
          td { padding: 12px; border-bottom: 1px solid #e0e0e0; font-size: 13px; }
          tr:nth-child(even) { background: #f9f9f9; }
          .report-info { background: #fafafa; padding: 20px; border-left: 4px solid #424242; margin: 30px 0; }
          .report-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 14px; }
          .report-info-item label { color: #757575; display: block; margin-bottom: 5px; font-size: 12px; }
          .report-info-item div { font-weight: 600; color: #1a1a1a; }
          .signature-section { margin-top: 50px; padding-top: 20px; border-top: 2px solid #e0e0e0; }
          .signature-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 40px; text-align: center; }
          .signature-box { border-top: 2px solid #424242; padding-top: 10px; margin-top: 60px; }
          .signature-box .title { font-weight: 600; color: #424242; margin-bottom: 5px; }
          .signature-box .role { font-size: 12px; color: #757575; }
          .disclaimer { margin-top: 30px; padding: 15px; background: #fff9c4; border-left: 4px solid #f57f17; border-radius: 4px; }
          .disclaimer p { font-size: 12px; color: #f57f17; margin: 0; }
          .footer { background: #f5f5f5; padding: 20px 40px; text-align: center; margin-top: 40px; border-top: 2px solid #e0e0e0; }
          .footer-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; font-size: 12px; color: #757575; }
          @media print { body { background: white; } .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-left">
            ${logoHTML}
            <div>
              <h1 class="company-name">${companySettings.name}</h1>
              <p class="tagline">Professional POS Business System</p>
              <p class="powered">Powered by Factssolution</p>
            </div>
          </div>
          <div class="header-right">
            <h2>Customer Report</h2>
            <p>Generated: ${formattedDate}</p>
            <p>Time: ${formattedTime}</p>
            <p>Period: ${periodLabel}</p>
          </div>
        </div>
        
        <div class="content">
          <div class="section-heading">Customer Summary</div>
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-label">Total Customers</div>
              <div class="metric-value">${customers.length}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Total Revenue</div>
              <div class="metric-value" style="color: #388e3c;">Rs ${(summary?.totalRevenue || 0).toFixed(2)}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Avg Customer Value</div>
              <div class="metric-value">Rs ${customers.length > 0 ? ((summary?.totalRevenue || 0) / customers.length).toFixed(2) : '0.00'}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Active Customers</div>
              <div class="metric-value">${customers.filter((c: any) => c.totalOrders > 0).length}</div>
            </div>
          </div>

          <div class="additional-metrics">
            <div><span>Total Orders:</span><strong>${totalOrders}</strong></div>
            <div><span>Total Visits:</span><strong>${totalVisits}</strong></div>
            <div><span>Avg Order Value:</span><strong>Rs ${avgOrderValue.toFixed(2)}</strong></div>
          </div>

          <div class="section-heading" style="margin-top: 40px;">Customer Details (${customers.length} customers)</div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Customer Name</th>
                <th>Phone</th>
                <th style="text-align: right;">Total Visits</th>
                <th style="text-align: right;">Total Orders</th>
                <th style="text-align: right;">Total Spent</th>
                <th style="text-align: right;">Avg Order</th>
                <th>Last Visit</th>
              </tr>
            </thead>
            <tbody>
              ${customers.map((customer: any, index: number) => {
                const lastVisitFormatted = customer.lastVisit ? (() => {
                  try {
                    const date = new Date(customer.lastVisit);
                    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('en-GB');
                  } catch {
                    return 'N/A';
                  }
                })() : 'N/A';
                
                return `
                  <tr>
                    <td>${index + 1}</td>
                    <td style="font-weight: 600;">${customer.name || 'Walk-in Customer'}</td>
                    <td>${customer.phone || 'N/A'}</td>
                    <td style="text-align: right;">${customer.totalVisits || 0}</td>
                    <td style="text-align: right;">${customer.totalOrders || 0}</td>
                    <td style="text-align: right; font-weight: 600; color: #424242;">Rs ${(customer.totalSpent || 0).toFixed(2)}</td>
                    <td style="text-align: right;">Rs ${customer.totalOrders > 0 ? ((customer.totalSpent || 0) / customer.totalOrders).toFixed(2) : '0.00'}</td>
                    <td>${lastVisitFormatted}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div class="section-heading" style="margin-top: 40px;">Report Information & Verification</div>
          <div class="report-info">
            <div class="report-info-grid">
              <div class="report-info-item">
                <label>Generated By</label>
                <div>System Administrator</div>
              </div>
              <div class="report-info-item">
                <label>Report Period</label>
                <div>${periodLabel}</div>
              </div>
              <div class="report-info-item">
                <label>Total Customers</label>
                <div>${customers.length}</div>
              </div>
              <div class="report-info-item">
                <label>Active Customers</label>
                <div>${customers.filter((c: any) => c.totalOrders > 0).length}</div>
              </div>
              <div class="report-info-item">
                <label>Total Revenue</label>
                <div style="color: #388e3c;">Rs ${(summary?.totalRevenue || 0).toFixed(2)}</div>
              </div>
              <div class="report-info-item">
                <label>Avg Customer Value</label>
                <div style="color: #1976d2;">Rs ${customers.length > 0 ? ((summary?.totalRevenue || 0) / customers.length).toFixed(2) : '0.00'}</div>
              </div>
            </div>
          </div>
          
          <div class="signature-section">
            <div class="signature-grid">
              <div>
                <div class="signature-box">
                  <div class="title">Prepared By</div>
                  <div class="role">System Administrator</div>
                </div>
              </div>
              <div>
                <div class="signature-box">
                  <div class="title">Reviewed By</div>
                  <div class="role">Manager</div>
                </div>
              </div>
              <div>
                <div class="signature-box">
                  <div class="title">Approved By</div>
                  <div class="role">Director</div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="disclaimer">
            <p><strong>Note:</strong> This is a system-generated customer report. All data is based on actual transactions recorded in the POS system.</p>
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-grid">
            <div>© 2025-2026 ${companySettings.name}. All Rights Reserved.</div>
            <div>Powered by Factssolution</div>
            <div>Confidential Business Report</div>
          </div>
        </div>
        
        <script>window.print();</script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    toast.success('Complete customer report PDF generated!');
  };

  // Pagination
  const totalPages = Math.ceil(customers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCustomers = customers.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading customer data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Reports</h1>
          <p className="text-gray-600 mt-1">Complete customer analytics and order history</p>
        </div>
        <Button
          onClick={printAllCustomersPDF}
          className="bg-gray-800 hover:bg-gray-900"
          disabled={customers.length === 0}
        >
          <Download className="w-4 h-4 mr-2" />
          Download Full Report
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Customers</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{summary.totalCustomers}</p>
                </div>
                <Users className="w-12 h-12 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">Rs {summary.totalRevenue.toFixed(2)}</p>
                </div>
                <DollarSign className="w-12 h-12 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Customer Value</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">Rs {summary.averageCustomerValue.toFixed(2)}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Visits/Customer</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{summary.averageVisitsPerCustomer.toFixed(1)}</p>
                </div>
                <Calendar className="w-12 h-12 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Start Date"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="End Date"
            />
            <div className="flex gap-2">
              <Button onClick={handleSearch} className="flex-1 bg-gray-800 hover:bg-gray-900">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
              <Button onClick={clearFilters} variant="outline">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customer List ({customers.length} customers)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Customer Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Total Visits</TableHead>
                <TableHead>Total Orders</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead>Avg Order</TableHead>
                <TableHead>Last Visit</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    No customers found
                  </TableCell>
                </TableRow>
              ) : (
                currentCustomers.map((customer: any, index: number) => (
                  <TableRow key={customer.phone}>
                    <TableCell>{startIndex + index + 1}</TableCell>
                    <TableCell className="font-semibold">{customer.name}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{customer.totalVisits}</Badge>
                    </TableCell>
                    <TableCell>{customer.totalOrders}</TableCell>
                    <TableCell className="font-semibold">Rs {customer.totalSpent.toFixed(2)}</TableCell>
                    <TableCell>Rs {customer.averageOrderValue.toFixed(2)}</TableCell>
                    <TableCell>
                      {(() => {
                        try {
                          if (!customer.lastVisit) return 'N/A';
                          
                          const date = new Date(customer.lastVisit);
                          
                          // Check if date is valid
                          if (isNaN(date.getTime())) {
                            console.warn('⚠️ Invalid date for customer:', customer.name, customer.lastVisit);
                            return 'N/A';
                          }
                          
                          // Format as DD/MM/YYYY
                          return new Intl.DateTimeFormat('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          }).format(date);
                        } catch (error) {
                          console.error('❌ Date formatting error:', error, customer.lastVisit);
                          return 'N/A';
                        }
                      })()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewCustomerHistory(customer.phone)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => printCustomerPDF(customer)}
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => printCustomerThermal(customer)}
                        >
                          <Printer className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600">
                Showing {startIndex + 1}-{Math.min(endIndex, customers.length)} of {customers.length} customers
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {customerHistory ? (
                <div>
                  <div className="text-xl">{customerHistory.name}</div>
                  <div className="text-sm text-gray-600 mt-1">{customerHistory.phone}</div>
                </div>
              ) : (
                'Customer History'
              )}
            </DialogTitle>
          </DialogHeader>

          {historyLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
            </div>
          ) : customerHistory ? (
            <div className="space-y-6">
              {/* Customer Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <ShoppingBag className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-2xl font-bold">{customerHistory.totalOrders}</p>
                      <p className="text-sm text-gray-600">Total Orders</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <DollarSign className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-2xl font-bold">Rs {customerHistory.totalSpent.toFixed(2)}</p>
                      <p className="text-sm text-gray-600">Total Spent</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <TrendingUp className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-2xl font-bold">Rs {(customerHistory.totalSpent / customerHistory.totalOrders).toFixed(2)}</p>
                      <p className="text-sm text-gray-600">Avg Order</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Order History */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Complete Order History</h3>
                <div className="space-y-4">
                  {customerHistory.orders.map((order: any) => (
                    <Card key={order.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="font-semibold">Token #{order.token_number}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(order.date).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Cashier: {order.cashier}</p>
                          </div>
                          <Badge>{order.payment_method}</Badge>
                        </div>

                        <div className="space-y-2">
                          {order.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span>{item.product_name} x {item.quantity}</span>
                              <span className="font-semibold">Rs {item.total.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>

                        <div className="border-t mt-4 pt-4 flex justify-between">
                          <div>
                            <p className="text-xs text-gray-600">Subtotal: Rs {order.subtotal.toFixed(2)}</p>
                            <p className="text-xs text-gray-600">Tax: Rs {order.tax.toFixed(2)}</p>
                          </div>
                          <p className="text-lg font-bold">Total: Rs {order.total.toFixed(2)}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
