import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Plus, Edit, Trash2, Truck, IndianRupee } from 'lucide-react';
import { toast } from 'sonner';
import { api, Supplier as SupplierType } from '../services/api';

export default function SupplierManagement() {
  const [suppliers, setSuppliers] = useState<SupplierType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    opening_balance: '',
    email: '',
    address: '',
    gst_number: ''
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const data = await api.getSuppliers();
      setSuppliers(data || []);
    } catch (error: any) {
      console.error('Load suppliers error:', error);
      toast.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contact: '',
      opening_balance: '',
      email: '',
      address: '',
      gst_number: ''
    });
  };

  const handleAddSupplier = async () => {
    if (!formData.name || !formData.contact) {
      toast.error('Please fill required fields');
      return;
    }

    const openingBalance = formData.opening_balance ? parseFloat(formData.opening_balance) : 0;
    if (isNaN(openingBalance) || openingBalance < 0) {
      toast.error('Please enter a valid opening balance');
      return;
    }

    try {
      setSubmitting(true);
      
      await api.createSupplier({
        name: formData.name,
        contact: formData.contact,
        opening_balance: openingBalance,
        email: formData.email || null,
        address: formData.address || null,
        gst_number: formData.gst_number || null,
        status: 'active',
        updated_at: new Date().toISOString()
      });

      setShowAddDialog(false);
      resetForm();
      toast.success('Supplier added successfully');
      loadSuppliers();
    } catch (error: any) {
      console.error('Add supplier error:', error);
      toast.error(error.message || 'Failed to add supplier');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSupplier = async () => {
    if (!formData.name || !formData.contact) {
      toast.error('Please fill required fields');
      return;
    }

    if (!selectedSupplier) return;

    const openingBalance = formData.opening_balance ? parseFloat(formData.opening_balance) : 0;
    if (isNaN(openingBalance) || openingBalance < 0) {
      toast.error('Please enter a valid opening balance');
      return;
    }

    try {
      setSubmitting(true);
      
      await api.updateSupplier(selectedSupplier.id, {
        name: formData.name,
        contact: formData.contact,
        opening_balance: openingBalance,
        email: formData.email || null,
        address: formData.address || null,
        gst_number: formData.gst_number || null,
        updated_at: new Date().toISOString()
      });

      setShowEditDialog(false);
      setSelectedSupplier(null);
      resetForm();
      toast.success('Supplier updated successfully');
      loadSuppliers();
    } catch (error: any) {
      console.error('Update supplier error:', error);
      toast.error(error.message || 'Failed to update supplier');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSupplier = async (id: number) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return;

    try {
      await api.deleteSupplier(id);
      toast.success('Supplier deleted successfully');
      loadSuppliers();
    } catch (error: any) {
      console.error('Delete supplier error:', error);
      toast.error(error.message || 'Failed to delete supplier');
    }
  };

  const openEditDialog = (supplier: SupplierType) => {
    setSelectedSupplier(supplier);
    setFormData({
      name: supplier.name,
      contact: supplier.contact,
      opening_balance: supplier.opening_balance.toString(),
      email: supplier.email || '',
      address: supplier.address || '',
      gst_number: supplier.gst_number || ''
    });
    setShowEditDialog(true);
  };

  const toggleSupplierStatus = async (id: number) => {
    const supplier = suppliers.find(s => s.id === id);
    if (!supplier) return;

    try {
      const newStatus = supplier.status === 'active' ? 'inactive' : 'active';
      await api.updateSupplier(id, { status: newStatus });
      toast.success('Supplier status updated');
      loadSuppliers();
    } catch (error: any) {
      console.error('Toggle status error:', error);
      toast.error('Failed to update status');
    }
  };

  const getTotalOutstanding = () => {
    return suppliers.reduce((total, supplier) => total + (supplier.currentBalance || supplier.opening_balance || 0), 0);
  };

  const getActiveSuppliers = () => {
    return suppliers.filter(supplier => supplier.status === 'active').length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2>Supplier Management</h2>
          <p className="text-muted-foreground">Manage your suppliers and track balances</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Supplier
            </Button>
          </DialogTrigger>
          <DialogContent aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>Add New Supplier</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Supplier Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter supplier name"
                  autoComplete="organization"
                />
              </div>
              <div>
                <Label htmlFor="contact">Contact Number</Label>
                <Input
                  id="contact"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  placeholder="+91 9876543210"
                  autoComplete="tel"
                />
              </div>
              <div>
                <Label htmlFor="opening_balance">Opening Balance (Rs)</Label>
                <Input
                  id="opening_balance"
                  type="number"
                  value={formData.opening_balance}
                  onChange={(e) => setFormData({ ...formData, opening_balance: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="supplier@example.com"
                  autoComplete="email"
                />
              </div>
              <div>
                <Label htmlFor="address">Address (Optional)</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter address"
                  autoComplete="street-address"
                />
              </div>
              <div>
                <Label htmlFor="gst_number">GST Number (Optional)</Label>
                <Input
                  id="gst_number"
                  value={formData.gst_number}
                  onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                  placeholder="22AAAAA0000A1Z5"
                />
              </div>
              <Button onClick={handleAddSupplier} className="w-full" disabled={submitting}>
                {submitting ? 'Adding...' : 'Add Supplier'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Suppliers</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suppliers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Active Suppliers</CardTitle>
            <Truck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getActiveSuppliers()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Outstanding</CardTitle>
            <IndianRupee className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs {getTotalOutstanding().toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Average Balance</CardTitle>
            <IndianRupee className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rs {suppliers.length > 0 ? Math.round(getTotalOutstanding() / suppliers.length).toLocaleString() : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Supplier Table */}
      <Card>
        <CardHeader>
          <CardTitle>Suppliers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Opening Balance</TableHead>
                <TableHead>Current Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>{supplier.contact}</TableCell>
                  <TableCell>Rs {(supplier.opening_balance || 0).toLocaleString()}</TableCell>
                  <TableCell>
                    <span className={(supplier.currentBalance || 0) > 0 ? 'text-green-600' : (supplier.currentBalance || 0) < 0 ? 'text-red-600' : ''}>
                      Rs {(supplier.currentBalance || 0).toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={supplier.status === 'active' ? 'default' : 'secondary'}
                      className="cursor-pointer"
                      onClick={() => toggleSupplierStatus(supplier.id)}
                    >
                      {supplier.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(supplier.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(supplier)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteSupplier(supplier.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Edit Supplier</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Supplier Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter supplier name"
                autoComplete="organization"
              />
            </div>
            <div>
              <Label htmlFor="edit-contact">Contact Number</Label>
              <Input
                id="edit-contact"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                placeholder="+91 9876543210"
                autoComplete="tel"
              />
            </div>
            <div>
              <Label htmlFor="edit-opening_balance">Opening Balance (Rs)</Label>
              <Input
                id="edit-opening_balance"
                type="number"
                value={formData.opening_balance}
                onChange={(e) => setFormData({ ...formData, opening_balance: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email (Optional)</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="supplier@example.com"
                autoComplete="email"
              />
            </div>
            <div>
              <Label htmlFor="edit-address">Address (Optional)</Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter address"
                autoComplete="street-address"
              />
            </div>
            <div>
              <Label htmlFor="edit-gst_number">GST Number (Optional)</Label>
              <Input
                id="edit-gst_number"
                value={formData.gst_number}
                onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                placeholder="22AAAAA0000A1Z5"
              />
            </div>
            <Button onClick={handleEditSupplier} className="w-full" disabled={submitting}>
              {submitting ? 'Updating...' : 'Update Supplier'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}