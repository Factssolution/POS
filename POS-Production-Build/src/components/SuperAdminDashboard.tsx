import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { toast } from 'sonner';
import { api } from '../services/api';
import {
  Key,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Users,
  Settings,
  Copy,
  Trash2,
} from 'lucide-react';

interface License {
  id: number;
  license_key: string;
  client_email: string;
  client_name: string | null;
  client_phone: string | null;
  client_company: string | null;
  plan_type: string;
  plan_duration: number;
  price: number;
  status: string;
  issued_date: string;
  expiry_date: string;
  days_remaining?: number;
  created_by: number;
  creator?: {
    name: string;
    email: string;
  };
}

interface LicenseStatus {
  is_trial: boolean;
  license_status: string;
  license_key: string | null;
  trial_start_date: string | null;
  trial_end_date: string | null;
  trial_days: number;
  days_remaining: number;
  expiry_date: string | null;
  is_expired: boolean;
}

export default function SuperAdminDashboard() {
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(null);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });

  // Generate License Form
  const [genForm, setGenForm] = useState({
    client_email: '',
    client_name: '',
    client_phone: '',
    client_company: '',
    plan_type: 'monthly' as 'monthly' | 'yearly' | 'lifetime',
    price: 5000,
    payment_method: 'cash',
    notes: '',
  });

  useEffect(() => {
    loadLicenseStatus();
    loadLicenses();
  }, []);

  const loadLicenseStatus = async () => {
    try {
      const status = await api.getLicenseStatus();
      setLicenseStatus(status);
    } catch (error: any) {
      toast.error('Failed to load license status: ' + error.message);
    }
  };

  const loadLicenses = async (page = 1) => {
    try {
      setIsLoading(true);
      const response = await api.getAllLicenses({ page, limit: 20 });
      setLicenses(response.data || []);
      setPagination(response.pagination || { currentPage: 1, totalPages: 1, totalItems: 0 });
    } catch (error: any) {
      toast.error('Failed to load licenses: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateLicense = async () => {
    if (!genForm.client_email) {
      toast.error('Client email is required');
      return;
    }

    try {
      setIsGenerating(true);
      const response = await api.generateLicense(genForm);
      
      // Show license key in multiple ways
      toast.success('✅ License generated successfully!');
      
      // Show detailed toast with license info
      toast.success(
        <div className="space-y-2">
          <p className="font-semibold">License Key:</p>
          <p className="font-mono text-sm bg-gray-100 p-2 rounded">{response.license_key}</p>
          <p className="text-xs text-gray-600">Client: {genForm.client_email}</p>
          <p className="text-xs text-gray-600">Plan: {genForm.plan_type}</p>
          <p className="text-xs text-gray-600">Price: Rs {genForm.price.toLocaleString()}</p>
        </div>,
        { duration: 10000 }
      );
      
      // Also show in alert for easy copying
      alert(
        `✅ LICENSE GENERATED SUCCESSFULLY!\n\n` +
        `License Key: ${response.license_key}\n` +
        `Client: ${genForm.client_email}\n` +
        `Plan: ${genForm.plan_type}\n` +
        `Price: Rs ${genForm.price.toLocaleString()}\n\n` +
        `Please copy this license key and send it to the client.`
      );
      
      // Reset form
      setGenForm({
        client_email: '',
        client_name: '',
        client_phone: '',
        client_company: '',
        plan_type: 'monthly',
        price: 5000,
        payment_method: 'cash',
        notes: '',
      });

      // Reload licenses
      loadLicenses();
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate license');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevokeLicense = async (licenseId: number, licenseKey: string) => {
    if (!confirm(`Are you sure you want to revoke license: ${licenseKey}?`)) {
      return;
    }

    try {
      await api.revokeLicense(licenseId);
      toast.success('License revoked successfully');
      loadLicenses();
    } catch (error: any) {
      toast.error(error.message || 'Failed to revoke license');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      active: { color: 'bg-green-500', icon: CheckCircle, label: 'Active' },
      expired: { color: 'bg-red-500', icon: XCircle, label: 'Expired' },
      revoked: { color: 'bg-gray-500', icon: XCircle, label: 'Revoked' },
      pending: { color: 'bg-yellow-500', icon: Clock, label: 'Pending' },
    };

    const config = statusConfig[status] || statusConfig.active;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getDaysRemainingBadge = (days: number, isTrial: boolean) => {
    if (days <= 0) {
      return <Badge className="bg-red-500 text-white">Expired</Badge>;
    }
    if (days <= 7) {
      return (
        <Badge className="bg-orange-500 text-white">
          <AlertTriangle className="w-3 h-3 mr-1" />
          {days} days left
        </Badge>
      );
    }
    return (
      <Badge className="bg-green-500 text-white">
        {days} days
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Super Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">License Management & System Control</p>
        </div>
        <Button onClick={() => loadLicenses()} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* License Status Banner */}
      {licenseStatus && (
        <Card className={licenseStatus.is_expired ? 'border-red-500' : 'border-blue-500'}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              {licenseStatus.is_trial ? (
                <>
                  <Clock className="w-8 h-8 text-blue-500" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">Trial Period</h3>
                    <p className="text-sm text-muted-foreground">
                      {licenseStatus.days_remaining > 0
                        ? `${licenseStatus.days_remaining} days remaining`
                        : 'Trial has expired'}
                    </p>
                  </div>
                  {getDaysRemainingBadge(licenseStatus.days_remaining, true)}
                </>
              ) : (
                <>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">Licensed System</h3>
                    <p className="text-sm text-muted-foreground">
                      License: {licenseStatus.license_key || 'N/A'}
                    </p>
                  </div>
                  {getDaysRemainingBadge(licenseStatus.days_remaining, false)}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Key className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Licenses</p>
                <p className="text-2xl font-bold">{pagination.totalItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Licenses</p>
                <p className="text-2xl font-bold">
                  {licenses.filter(l => l.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold">
                  Rs {licenses.reduce((sum, l) => sum + (parseFloat(String(l.price)) || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="licenses">
        <TabsList>
          <TabsTrigger value="licenses">
            <Key className="w-4 h-4 mr-2" />
            Licenses
          </TabsTrigger>
          <TabsTrigger value="generate">
            <Plus className="w-4 h-4 mr-2" />
            Generate License
          </TabsTrigger>
          <TabsTrigger value="pricing">
            <DollarSign className="w-4 h-4 mr-2" />
            Pricing
          </TabsTrigger>
        </TabsList>

        {/* Licenses List */}
        <TabsContent value="licenses">
          <Card>
            <CardHeader>
              <CardTitle>All Licenses</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>License Key</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Issued</TableHead>
                        <TableHead>Expiry</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {licenses.map((license) => (
                        <TableRow key={license.id}>
                          <TableCell className="font-mono text-xs">
                            <div className="flex items-center gap-2">
                              <span>{license.license_key}</span>
                              <button
                                onClick={() => copyToClipboard(license.license_key)}
                                className="text-blue-500 hover:text-blue-700"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{license.client_name || 'N/A'}</p>
                              <p className="text-xs text-muted-foreground">{license.client_email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {license.plan_type}
                            </Badge>
                          </TableCell>
                          <TableCell>Rs {parseFloat(String(license.price)).toLocaleString()}</TableCell>
                          <TableCell>{formatDate(license.issued_date)}</TableCell>
                          <TableCell>{formatDate(license.expiry_date)}</TableCell>
                          <TableCell>{getStatusBadge(license.status)}</TableCell>
                          <TableCell>
                            {license.status === 'active' && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRevokeLicense(license.id, license.license_key)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {pagination.totalItems} licenses
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.currentPage === 1}
                        onClick={() => loadLicenses(pagination.currentPage - 1)}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.currentPage === pagination.totalPages}
                        onClick={() => loadLicenses(pagination.currentPage + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Generate License */}
        <TabsContent value="generate">
          <Card>
            <CardHeader>
              <CardTitle>Generate New License</CardTitle>
              <CardDescription>Create a new license key for a client</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="client_email">Client Email *</Label>
                    <Input
                      id="client_email"
                      value={genForm.client_email}
                      onChange={(e) => setGenForm({ ...genForm, client_email: e.target.value })}
                      placeholder="client@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="client_name">Client Name</Label>
                    <Input
                      id="client_name"
                      value={genForm.client_name}
                      onChange={(e) => setGenForm({ ...genForm, client_name: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="client_phone">Phone</Label>
                    <Input
                      id="client_phone"
                      value={genForm.client_phone}
                      onChange={(e) => setGenForm({ ...genForm, client_phone: e.target.value })}
                      placeholder="+923001234567"
                    />
                  </div>
                  <div>
                    <Label htmlFor="client_company">Company</Label>
                    <Input
                      id="client_company"
                      value={genForm.client_company}
                      onChange={(e) => setGenForm({ ...genForm, client_company: e.target.value })}
                      placeholder="Company Name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="plan_type">Plan Type</Label>
                    <select
                      id="plan_type"
                      className="w-full border rounded px-3 py-2"
                      value={genForm.plan_type}
                      onChange={(e) => setGenForm({ ...genForm, plan_type: e.target.value as any })}
                    >
                      <option value="monthly">Monthly (30 days)</option>
                      <option value="yearly">Yearly (365 days)</option>
                      <option value="lifetime">Lifetime</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="price">Price (Rs)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={genForm.price}
                      onChange={(e) => setGenForm({ ...genForm, price: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="payment_method">Payment Method</Label>
                    <select
                      id="payment_method"
                      className="w-full border rounded px-3 py-2"
                      value={genForm.payment_method}
                      onChange={(e) => setGenForm({ ...genForm, payment_method: e.target.value })}
                    >
                      <option value="cash">Cash</option>
                      <option value="jazzcash">JazzCash</option>
                      <option value="easypaisa">Easypaisa</option>
                      <option value="bank">Bank Transfer</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={genForm.notes}
                    onChange={(e) => setGenForm({ ...genForm, notes: e.target.value })}
                    placeholder="Additional notes..."
                  />
                </div>

                <Button
                  onClick={handleGenerateLicense}
                  disabled={isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4 mr-2" />
                      Generate License Key
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pricing Management */}
        <TabsContent value="pricing">
          <Card>
            <CardHeader>
              <CardTitle>Pricing Management</CardTitle>
              <CardDescription>Update license pricing for all plans</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Monthly Price (Rs)</Label>
                    <Input type="number" defaultValue={5000} />
                  </div>
                  <div>
                    <Label>Yearly Price (Rs)</Label>
                    <Input type="number" defaultValue={50000} />
                  </div>
                  <div>
                    <Label>Lifetime Price (Rs)</Label>
                    <Input type="number" defaultValue={150000} />
                  </div>
                </div>
                <Button className="w-full">
                  <Settings className="w-4 h-4 mr-2" />
                  Update Pricing
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
