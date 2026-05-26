import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { api } from '../services/api';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  TrendingDown,
  Receipt,
  X
} from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  utilities: 'Utilities',
  rent: 'Rent',
  salary: 'Salary',
  maintenance: 'Maintenance',
  transportation: 'Transportation',
  office_supplies: 'Office Supplies',
  marketing: 'Marketing',
  food_beverages: 'Food & Beverages',
  insurance: 'Insurance',
  taxes: 'Taxes',
  equipment: 'Equipment',
  travel: 'Travel',
  communication: 'Communication',
  miscellaneous: 'Miscellaneous'
};

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'check', label: 'Check' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'upi', label: 'UPI' },
  { value: 'other', label: 'Other' }
];

interface Expense {
  id: number;
  title: string;
  description: string | null;
  amount: number;
  category: string;
  expense_date: string;
  expense_time: string;
  payment_method: string;
  receipt_number: string | null;
  vendor_name: string | null;
  supplier_id: number | null;
  status: 'pending' | 'approved' | 'rejected';
  created_by: number | null;
  creator?: {
    id: number;
    name: string;
    email: string;
  };
  supplier?: {
    id: number;
    name: string;
    contact: string;
  };
  created_at: string;
  updated_at: string;
}

export default function ExpenseManagement() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    category: 'utilities',
    expense_date: new Date().toISOString().split('T')[0],
    expense_time: new Date().toTimeString().split(' ')[0].substring(0, 5),
    payment_method: 'cash',
    receipt_number: '',
    vendor_name: '',
    supplier_id: '' as string | number,
    status: 'approved' as 'pending' | 'approved' | 'rejected'
  });

  // Suppliers list for dropdown
  const [suppliers, setSuppliers] = useState<any[]>([]);

  // Statistics
  const [stats, setStats] = useState({
    totalExpenses: 0,
    totalTransactions: 0,
    averageExpense: 0,
    byCategory: [] as any[],
    byMonth: {} as Record<string, number>,
    byPaymentMethod: {} as Record<string, number>
  });

  // Load expenses on mount and when filters change
  useEffect(() => {
    loadExpenses();
    loadStats();
    loadSuppliers();
  }, [dateRange, categoryFilter, statusFilter]);

  const loadSuppliers = async () => {
    try {
      const response = await api.getSuppliers();
      setSuppliers(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Load suppliers error:', error);
      setSuppliers([]);
    }
  };

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const params: any = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        sortBy: 'expense_date',
        sortOrder: 'DESC'
      };

      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;

      const response = await api.getExpenses(params);
      setExpenses(response.expenses || []);
    } catch (error: any) {
      console.error('Load expenses error:', error);
      toast.error(error.message || 'Failed to load expenses');
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.getExpenseStats({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      setStats(response);
    } catch (error: any) {
      console.error('Load stats error:', error);
    }
  };

  const handleCreateExpense = async () => {
    try {
      if (!formData.title || !formData.amount || !formData.category) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (editingExpense) {
        await api.updateExpense(editingExpense.id, {
          title: formData.title,
          description: formData.description || undefined,
          amount: parseFloat(formData.amount),
          category: formData.category,
          expense_date: formData.expense_date,
          expense_time: formData.expense_time,
          payment_method: formData.payment_method,
          receipt_number: formData.receipt_number || undefined,
          vendor_name: formData.vendor_name || undefined,
          supplier_id: formData.supplier_id ? parseInt(formData.supplier_id.toString()) : undefined,
          status: formData.status
        });
        toast.success('Expense updated successfully');
      } else {
        await api.createExpense({
          title: formData.title,
          description: formData.description || undefined,
          amount: parseFloat(formData.amount),
          category: formData.category,
          expense_date: formData.expense_date,
          expense_time: formData.expense_time,
          payment_method: formData.payment_method,
          receipt_number: formData.receipt_number || undefined,
          vendor_name: formData.vendor_name || undefined,
          supplier_id: formData.supplier_id ? parseInt(formData.supplier_id.toString()) : undefined,
          status: formData.status
        });
        toast.success('Expense created successfully');
      }

      setShowDialog(false);
      resetForm();
      loadExpenses();
      loadStats();
    } catch (error: any) {
      console.error('Save expense error:', error);
      toast.error(error.message || 'Failed to save expense');
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      title: expense.title,
      description: expense.description || '',
      amount: expense.amount.toString(),
      category: expense.category,
      expense_date: expense.expense_date,
      expense_time: expense.expense_time,
      payment_method: expense.payment_method,
      receipt_number: expense.receipt_number || '',
      vendor_name: expense.vendor_name || '',
      supplier_id: expense.supplier_id || '',
      status: expense.status
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
      await api.deleteExpense(id);
      toast.success('Expense deleted successfully');
      loadExpenses();
      loadStats();
    } catch (error: any) {
      console.error('Delete expense error:', error);
      toast.error(error.message || 'Failed to delete expense');
    }
  };

  const resetForm = () => {
    setEditingExpense(null);
    setFormData({
      title: '',
      description: '',
      amount: '',
      category: 'utilities',
      expense_date: new Date().toISOString().split('T')[0],
      expense_time: new Date().toTimeString().split(' ')[0].substring(0, 5),
      payment_method: 'cash',
      receipt_number: '',
      vendor_name: '',
      supplier_id: '',
      status: 'approved'
    });
  };

  const handleSearch = useCallback(() => {
    loadExpenses();
  }, [searchTerm, dateRange, categoryFilter, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (time: string) => {
    if (!time) return 'N/A';
    try {
      const [hours, minutes] = time.split(':');
      const h = parseInt(hours);
      const period = h >= 12 ? 'PM' : 'AM';
      const displayHours = h % 12 || 12;
      return `${displayHours}:${minutes} ${period}`;
    } catch {
      return time;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Expense Management</h2>
          <p className="text-muted-foreground">Track and manage business expenses</p>
        </div>
        <Button onClick={() => { resetForm(); setShowDialog(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Expense
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">
                  Rs {Math.round(stats.totalExpenses).toLocaleString()}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Transactions</p>
                <p className="text-2xl font-bold">{stats.totalTransactions}</p>
              </div>
              <Receipt className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Expense</p>
                <p className="text-2xl font-bold text-purple-600">
                  Rs {Math.round(stats.averageExpense).toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Top Category</p>
                <p className="text-lg font-bold text-orange-600">
                  {stats.byCategory[0]?.label || 'N/A'}
                </p>
              </div>
              <Filter className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            <div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>

            <div className="flex gap-2">
              <Input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              />
              <Button onClick={handleSearch} size="sm">
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading expenses...</div>
          ) : expenses.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No expenses found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-bold">Date</TableHead>
                    <TableHead className="font-bold">Time</TableHead>
                    <TableHead className="font-bold">Title</TableHead>
                    <TableHead className="font-bold">Category</TableHead>
                    <TableHead className="font-bold">Vendor</TableHead>
                    <TableHead className="font-bold">Payment</TableHead>
                    <TableHead className="font-bold text-right">Amount</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="font-bold">Receipt#</TableHead>
                    <TableHead className="font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id} className="hover:bg-muted/30">
                      <TableCell>
                        {new Date(expense.expense_date).toLocaleDateString('en-GB')}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatTime(expense.expense_time)}
                      </TableCell>
                      <TableCell className="font-semibold">{expense.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {CATEGORY_LABELS[expense.category] || expense.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{expense.vendor_name || '-'}</TableCell>
                      <TableCell className="text-sm capitalize">
                        {expense.payment_method.replace('_', ' ')}
                      </TableCell>
                      <TableCell className="text-right font-bold text-red-600">
                        Rs {Math.round(expense.amount).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(expense.status)}>
                          {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-mono">
                        {expense.receipt_number || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(expense)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(expense.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingExpense ? 'Edit Expense' : 'Add New Expense'}
            </DialogTitle>
            <DialogDescription>
              {editingExpense ? 'Update the expense details' : 'Fill in the expense details below'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2">
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Office Electricity Bill"
              />
            </div>

            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description..."
              />
            </div>

            <div>
              <Label>Amount (Rs) *</Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label>Category *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Date *</Label>
              <Input
                type="date"
                value={formData.expense_date}
                onChange={(e) => setFormData(prev => ({ ...prev, expense_date: e.target.value }))}
              />
            </div>

            <div>
              <Label>Time *</Label>
              <Input
                type="time"
                value={formData.expense_time}
                onChange={(e) => setFormData(prev => ({ ...prev, expense_time: e.target.value }))}
              />
            </div>

            <div>
              <Label>Payment Method *</Label>
              <Select value={formData.payment_method} onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(method => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Supplier (Optional)</Label>
              <Select 
                value={formData.supplier_id ? formData.supplier_id.toString() : 'none'} 
                onValueChange={(value) => {
                  if (value === 'none') {
                    // Clear supplier selection
                    setFormData(prev => ({ 
                      ...prev, 
                      supplier_id: '',
                      vendor_name: ''  // Clear vendor name when supplier removed
                    }));
                  } else {
                    const selectedSupplier = suppliers.find(s => s.id.toString() === value);
                    setFormData(prev => ({ 
                      ...prev, 
                      supplier_id: value,
                      // Auto-fill vendor name from supplier (but user can edit)
                      vendor_name: selectedSupplier?.name || ''
                    }));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Supplier</SelectItem>
                  {suppliers.map(supplier => (
                    <SelectItem key={supplier.id} value={supplier.id.toString()}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Vendor Name</Label>
              <Input
                value={formData.vendor_name}
                onChange={(e) => setFormData(prev => ({ ...prev, vendor_name: e.target.value }))}
                placeholder={formData.supplier_id ? "Auto-filled from supplier" : "e.g., ABC Suppliers"}
              />
              {formData.supplier_id && (
                <p className="text-xs text-green-600 mt-1">
                  ℹ️ Auto-filled from supplier (editable)
                </p>
              )}
            </div>

            <div>
              <Label>Receipt Number <span className="text-xs text-muted-foreground">(Auto-generated)</span></Label>
              <Input
                value={formData.receipt_number}
                onChange={(e) => setFormData(prev => ({ ...prev, receipt_number: e.target.value }))}
                placeholder="Auto-generated: EXP-YYYYMMDD-XXX"
                disabled={!editingExpense}
              />
              {!editingExpense && (
                <p className="text-xs text-muted-foreground mt-1">
                  💡 Receipt number will be auto-generated when you create the expense
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateExpense}>
              {editingExpense ? 'Update Expense' : 'Create Expense'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
