import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Plus, CreditCard, ArrowUpRight, ArrowDownRight, IndianRupee } from 'lucide-react';
import { toast } from 'sonner';
import { api, Supplier, Transaction } from '../services/api';

export default function CreditDebit() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    supplierId: '',
    type: '',
    amount: '',
    description: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading Credit & Debit data...');
      
      // Load suppliers
      const suppliersData = await api.getSuppliers();
      console.log('✅ Suppliers Loaded:', suppliersData?.length || 0, 'suppliers');
      console.log(' Suppliers Data:', suppliersData);
      setSuppliers(suppliersData || []);
      
      // Load transactions
      const transactionsResponse = await api.getTransactions();
      console.log('✅ Transactions Loaded:', transactionsResponse.transactions?.length || 0, 'transactions');
      console.log('💳 Transactions Data:', transactionsResponse.transactions);
      setTransactions(transactionsResponse.transactions || []);
      
    } catch (error: any) {
      console.error('❌ Load error:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      supplierId: '',
      type: '',
      amount: '',
      description: ''
    });
  };

  const handleAddTransaction = async () => {
    if (!formData.supplierId || !formData.type || !formData.amount || !formData.description) {
      toast.error('Please fill all fields');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      setSubmitting(true);
      
      await api.createTransaction({
        supplier_id: parseInt(formData.supplierId),
        type: formData.type as 'credit' | 'debit',
        amount: amount,
        description: formData.description,
        transaction_date: new Date().toISOString().split('T')[0],
        transaction_time: new Date().toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit', 
          hour12: true 
        })
      });

      setShowAddDialog(false);
      resetForm();
      toast.success(`${formData.type === 'credit' ? 'Credit' : 'Debit'} entry added successfully`);
      
      // Reload data
      loadData();
      
    } catch (error: any) {
      console.error('Transaction error:', error);
      toast.error(error.message || 'Failed to add transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const getTotalCredit = () => {
    return transactions
      .filter((t: any) => t.type === 'credit')
      .reduce((total: number, t: any) => total + t.amount, 0);
  };

  const getTotalDebit = () => {
    return transactions
      .filter((t: any) => t.type === 'debit')
      .reduce((total: number, t: any) => total + t.amount, 0);
  };

  const getTotalOpeningBalance = () => {
    return suppliers
      .reduce((total: number, s: any) => total + (parseFloat(s.opening_balance) || 0), 0);
  };

  const getNetBalance = () => {
    // Correct Business Logic:
    // Net Balance = Total Opening Balance + Total Credits - Total Debits
    const totalOpeningBalance = getTotalOpeningBalance();
    const totalCredits = getTotalCredit();
    const totalDebits = getTotalDebit();
    return totalOpeningBalance + totalCredits - totalDebits;
  };

  const getSupplierBalance = (supplierId: number) => {
    // Calculate actual current balance including opening balance and transactions
    const supplier = suppliers.find((s: any) => s.id === supplierId);
    if (!supplier) {
      console.log('️ Supplier not found for ID:', supplierId);
      return 0;
    }
    
    const openingBalance = typeof supplier.opening_balance === 'number' 
      ? supplier.opening_balance 
      : parseFloat(supplier.opening_balance || '0') || 0;
    
    console.log('📊 Calculating balance for:', supplier.name);
    console.log('   Opening Balance:', openingBalance);
    
    // Get all transactions for this supplier
    const supplierTransactions = transactions.filter((t: any) => 
      t.supplier_id === supplierId || t.supplier?.id === supplierId
    );
    
    console.log('   Found transactions:', supplierTransactions.length);
    
    const totalCredit = supplierTransactions
      .filter((t: any) => t.type === 'credit')
      .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);
    
    const totalDebit = supplierTransactions
      .filter((t: any) => t.type === 'debit')
      .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);
    
    const currentBalance = openingBalance + totalCredit - totalDebit;
    
    console.log('   Total Credits:', totalCredit);
    console.log('   Total Debits:', totalDebit);
    console.log('   Current Balance:', currentBalance);
    console.log('   Formula:', openingBalance, '+', totalCredit, '-', totalDebit, '=', currentBalance);
    
    // Current Balance = Opening + Credits - Debits
    return currentBalance;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2>Credit & Debit Management</h2>
          <p className="text-muted-foreground">Track credit and debit transactions with suppliers</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>Add New Transaction</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="supplier">Supplier</Label>
                <Select value={formData.supplierId} onValueChange={(value) => setFormData({ ...formData, supplierId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="type">Transaction Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit">Credit (Money Received)</SelectItem>
                    <SelectItem value="debit">Debit (Money Paid)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="amount">Amount (Rs)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter transaction description"
                  rows={3}
                />
              </div>
              <Button onClick={handleAddTransaction} className="w-full">
                Add Transaction
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Credit</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Rs {getTotalCredit().toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Money received</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Debit</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">Rs {getTotalDebit().toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Money paid</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Net Balance</CardTitle>
            <IndianRupee className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getNetBalance() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              Rs {getNetBalance().toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Opening ({getTotalOpeningBalance().toLocaleString()}) + Credit - Debit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Transactions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Supplier Balances */}
      <Card>
        <CardHeader>
          <CardTitle>Supplier Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {suppliers.length > 0 ? (
              suppliers.map((supplier: any) => {
                // Use the calculated balance function instead of direct property
                const balance = getSupplierBalance(supplier.id);
                console.log('💰 Displaying balance for', supplier.name, ':', balance);
                return (
                  <Card key={supplier.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{supplier.name}</p>
                          <p className="text-sm text-muted-foreground">Current Balance</p>
                        </div>
                        <div className={`text-lg font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          Rs {balance.toLocaleString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <p className="text-center text-muted-foreground col-span-3 py-8">
                No suppliers found
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Running Balance</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Recorded By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length > 0 ? (
                transactions.map((transaction: any, index: number) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>{new Date(transaction.transaction_date).toLocaleDateString('en-GB')}</TableCell>
                    <TableCell>
                      {transaction.transaction_time ? 
                        new Date(`1970-01-01 ${transaction.transaction_time}`).toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit',
                          hour12: true 
                        }) : 
                        'N/A'
                      }
                    </TableCell>
                    <TableCell className="font-medium">
                      {transaction.supplier?.name || transaction.supplier_name || 'N/A'}
                    </TableCell>
                    <TableCell>{transaction.supplier?.phone || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={transaction.type === 'credit' ? 'default' : 'destructive'}
                        className="flex items-center gap-1 w-fit"
                      >
                        {transaction.type === 'credit' ? (
                          <ArrowDownRight className="w-3 h-3" />
                        ) : (
                          <ArrowUpRight className="w-3 h-3" />
                        )}
                        {transaction.type === 'credit' ? '↑ Credit' : '↓ Debit'}
                      </Badge>
                    </TableCell>
                    <TableCell className={transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                      {transaction.type === 'credit' ? '+' : '-'}Rs {parseFloat(transaction.amount).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-bold">
                      Rs {parseFloat(transaction.running_balance || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>{transaction.description || '-'}</TableCell>
                    <TableCell>{transaction.creator?.name || transaction.created_by_name || 'N/A'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                    No transactions found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}