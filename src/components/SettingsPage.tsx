import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { Upload, Building, Bell, Shield, Database, Download, Clock, Key } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../services/api';
import LicenseActivation from './LicenseActivation';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companySettings, setCompanySettings] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    gst: '',
    logo: null as File | null,
    logoUrl: '' as string
  });

  const [posSettings, setPosSettings] = useState({
    taxRate: '18',
    currency: 'PKR',
    receiptFooter: '',
    enableBarcode: true,
    printReceipt: true,
    soundEnabled: true
  });

  const [notificationSettings, setNotificationSettings] = useState({
    lowStock: true,
    dailyReport: true,
    employeeLogin: false,
    supplierPayments: true
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactor: false,
    sessionTimeout: '30',
    passwordPolicy: true,
    auditLog: true,
    maxLoginAttempts: '5',
    lockoutDuration: '15'
  });

  const [dataSettings, setDataSettings] = useState({
    backupPath: '',
    autoBackup: false,
    backupFrequency: 'daily',
    backups: [] as any[],
    loadingBackups: false,
    creatingBackup: false,
    restoringBackup: false,
    includeData: true,
    includeStructure: true,
    includeSettings: true,
    includeProducts: true,
    includeOrders: true,
    includeEmployees: true,
    includeSuppliers: true,
    includeTransactions: true
  });

  const [shopHoursSettings, setShopHoursSettings] = useState({
    monday:    { open: "10:00", close: "22:00", enabled: true },
    tuesday:   { open: "10:00", close: "22:00", enabled: true },
    wednesday: { open: "10:00", close: "22:00", enabled: true },
    thursday:  { open: "10:00", close: "22:00", enabled: true },
    friday:    { open: "14:00", close: "23:00", enabled: true },
    saturday:  { open: "10:00", close: "23:00", enabled: true },
    sunday:    { open: "12:00", close: "20:00", enabled: true }
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const settings = await api.getSettings();
      
      // Map backend settings to frontend state
      setCompanySettings({
        name: settings.company_name || '',
        address: settings.company_address || '',
        phone: settings.company_phone || '',
        email: settings.company_email || '',
        gst: settings.gst_number || '',
        logo: null,
        logoUrl: settings.company_logo || ''
      });
      
      setPosSettings({
        taxRate: settings.tax_rate?.toString() || '18',
        currency: settings.currency || 'PKR',
        receiptFooter: settings.receipt_footer || '',
        enableBarcode: settings.enable_barcode === 'true' || settings.enable_barcode === true,
        printReceipt: settings.print_receipt === 'true' || settings.print_receipt === true,
        soundEnabled: settings.sound_enabled === 'true' || settings.sound_enabled === true
      });

      setNotificationSettings({
        lowStock: settings.notification_low_stock === 'true' || settings.notification_low_stock === true,
        dailyReport: settings.notification_daily_report === 'true' || settings.notification_daily_report === true,
        employeeLogin: settings.notification_employee_login === 'true' || settings.notification_employee_login === true,
        supplierPayments: settings.notification_supplier_payments === 'true' || settings.notification_supplier_payments === true
      });

      setSecuritySettings({
        twoFactor: settings.security_two_factor === 'true' || settings.security_two_factor === true,
        sessionTimeout: settings.security_session_timeout?.toString() || '30',
        passwordPolicy: settings.security_password_policy === 'true' || settings.security_password_policy === true,
        auditLog: settings.security_audit_log === 'true' || settings.security_audit_log === true,
        maxLoginAttempts: settings.security_max_login_attempts?.toString() || '5',
        lockoutDuration: settings.security_lockout_duration?.toString() || '15'
      });

      // Load backup configuration
      try {
        const backupConfig = await api.getBackupConfig();
        setDataSettings(prev => ({
          ...prev,
          backupPath: backupConfig.backupDirectory || ''
        }));
        loadBackups();
      } catch (err) {
        console.error('Backup config load error:', err);
      }
      
      // Load shop hours configuration
      try {
        const shopHoursData = await api.getShopHours();
        if (shopHoursData.shop_hours) {
          setShopHoursSettings(shopHoursData.shop_hours);
        }
      } catch (err) {
        console.error('Shop hours load error:', err);
      }
      
    } catch (error: any) {
      console.error('Settings load error:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      
      try {
        setSaving(true);
        const response = await api.uploadCompanyLogo(file);
        setCompanySettings({ 
          ...companySettings, 
          logo: file,
          logoUrl: response.logo_url 
        });
        toast.success('Logo uploaded and saved successfully');
      } catch (error: any) {
        console.error('Logo upload error:', error);
        toast.error(error.message || 'Failed to upload logo');
      } finally {
        setSaving(false);
      }
    }
  };

  const saveCompanySettings = async () => {
    try {
      setSaving(true);
      
      await api.updateSettings({
        company_name: companySettings.name,
        company_address: companySettings.address,
        company_phone: companySettings.phone,
        company_email: companySettings.email,
        gst_number: companySettings.gst
      });
      
      toast.success('Company settings saved successfully');
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const savePosSettings = async () => {
    try {
      setSaving(true);
      
      await api.updateSettings({
        tax_rate: parseFloat(posSettings.taxRate),
        currency: posSettings.currency,
        receipt_footer: posSettings.receiptFooter,
        enable_barcode: posSettings.enableBarcode,
        print_receipt: posSettings.printReceipt,
        sound_enabled: posSettings.soundEnabled
      });
      
      toast.success('POS settings saved successfully');
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const saveNotificationSettings = async () => {
    try {
      setSaving(true);
      
      await api.updateSettings({
        notification_low_stock: notificationSettings.lowStock,
        notification_daily_report: notificationSettings.dailyReport,
        notification_employee_login: notificationSettings.employeeLogin,
        notification_supplier_payments: notificationSettings.supplierPayments
      });
      
      toast.success('Notification settings saved successfully');
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message || 'Failed to save notification settings');
    } finally {
      setSaving(false);
    }
  };

  const saveSecuritySettings = async () => {
    try {
      setSaving(true);
      
      await api.updateSettings({
        security_two_factor: securitySettings.twoFactor,
        security_session_timeout: parseInt(securitySettings.sessionTimeout),
        security_password_policy: securitySettings.passwordPolicy,
        security_audit_log: securitySettings.auditLog,
        security_max_login_attempts: parseInt(securitySettings.maxLoginAttempts),
        security_lockout_duration: parseInt(securitySettings.lockoutDuration)
      });
      
      toast.success('Security settings saved successfully');
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message || 'Failed to save security settings');
    } finally {
      setSaving(false);
    }
  };

  const saveShopHoursSettings = async () => {
    try {
      setSaving(true);
      
      await api.updateShopHours(shopHoursSettings);
      
      toast.success('Shop hours saved successfully! Tokens will reset based on these hours.');
    } catch (error: any) {
      console.error('Save shop hours error:', error);
      toast.error(error.message || 'Failed to save shop hours');
    } finally {
      setSaving(false);
    }
  };

  const loadBackups = async () => {
    try {
      setDataSettings(prev => ({ ...prev, loadingBackups: true }));
      const response = await api.listBackups(dataSettings.backupPath || undefined);
      setDataSettings(prev => ({ ...prev, backups: response.backups || [] }));
    } catch (error: any) {
      console.error('Load backups error:', error);
      toast.error('Failed to load backups');
    } finally {
      setDataSettings(prev => ({ ...prev, loadingBackups: false }));
    }
  };

  const handleCreateBackup = async () => {
    try {
      setDataSettings(prev => ({ ...prev, creatingBackup: true }));
      
      const result = await api.createBackup({
        includeData: dataSettings.includeData,
        includeStructure: dataSettings.includeStructure,
        includeSettings: dataSettings.includeSettings,
        includeProducts: dataSettings.includeProducts,
        includeOrders: dataSettings.includeOrders,
        includeEmployees: dataSettings.includeEmployees,
        includeSuppliers: dataSettings.includeSuppliers,
        includeTransactions: dataSettings.includeTransactions,
        backupPath: dataSettings.backupPath || undefined
      });
      
      toast.success(`Backup created successfully: ${result.filename}`);
      loadBackups();
    } catch (error: any) {
      console.error('Create backup error:', error);
      toast.error(error.message || 'Failed to create backup');
    } finally {
      setDataSettings(prev => ({ ...prev, creatingBackup: false }));
    }
  };

  const handleRestoreBackup = async (filename: string) => {
    if (!confirm(`Are you sure you want to restore from ${filename}? This will overwrite current data.`)) {
      return;
    }

    try {
      setDataSettings(prev => ({ ...prev, restoringBackup: true }));
      
      await api.restoreBackup(filename, dataSettings.backupPath || undefined);
      
      toast.success('Database restored successfully');
      loadBackups();
    } catch (error: any) {
      console.error('Restore backup error:', error);
      toast.error(error.message || 'Failed to restore backup');
    } finally {
      setDataSettings(prev => ({ ...prev, restoringBackup: false }));
    }
  };

  const handleDeleteBackup = async (filename: string) => {
    if (!confirm(`Are you sure you want to delete backup: ${filename}?`)) {
      return;
    }

    try {
      await api.deleteBackup(filename, dataSettings.backupPath || undefined);
      toast.success('Backup deleted successfully');
      loadBackups();
    } catch (error: any) {
      console.error('Delete backup error:', error);
      toast.error(error.message || 'Failed to delete backup');
    }
  };

  const handleSaveBackupPath = async () => {
    try {
      setSaving(true);
      await api.updateSettings({
        backup_path: dataSettings.backupPath,
        auto_backup: dataSettings.autoBackup,
        backup_frequency: dataSettings.backupFrequency
      });
      toast.success('Backup settings saved successfully');
      loadBackups();
    } catch (error: any) {
      console.error('Save backup path error:', error);
      toast.error(error.message || 'Failed to save backup settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2>Settings</h2>
        <p className="text-muted-foreground">Manage your POS system configuration</p>
      </div>

      <Tabs defaultValue="company" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="pos">POS</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="shophours">
            <Clock className="w-4 h-4 mr-2" />
            Shop Hours
          </TabsTrigger>
          <TabsTrigger value="license">
            <Key className="w-4 h-4 mr-2" />
            License
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Upload */}
              <div>
                <Label>Company Logo</Label>
                <div className="mt-2 flex items-center gap-4">
                  <div className="w-20 h-20 border-2 border-dashed border-muted-foreground rounded-lg flex items-center justify-center overflow-hidden bg-white">
                    {companySettings.logoUrl ? (
                      <img 
                        src={companySettings.logoUrl} 
                        alt="Company Logo" 
                        className="w-full h-full object-contain rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : companySettings.logo ? (
                      <img 
                        src={URL.createObjectURL(companySettings.logo)} 
                        alt="Company Logo" 
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Upload className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <Button 
                      variant="outline" 
                      onClick={() => document.getElementById('logo-upload')?.click()}
                      disabled={saving}
                    >
                      {saving ? 'Uploading...' : 'Upload Logo'}
                    </Button>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Recommended size: 200x200px, Max: 5MB
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input
                    id="company-name"
                    value={companySettings.name}
                    onChange={(e) => setCompanySettings({ ...companySettings, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="company-phone">Phone Number</Label>
                  <Input
                    id="company-phone"
                    value={companySettings.phone}
                    onChange={(e) => setCompanySettings({ ...companySettings, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="company-email">Email Address</Label>
                  <Input
                    id="company-email"
                    type="email"
                    value={companySettings.email}
                    onChange={(e) => setCompanySettings({ ...companySettings, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="company-gst">GST Number</Label>
                  <Input
                    id="company-gst"
                    value={companySettings.gst}
                    onChange={(e) => setCompanySettings({ ...companySettings, gst: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="company-address">Address</Label>
                <Textarea
                  id="company-address"
                  rows={3}
                  value={companySettings.address}
                  onChange={(e) => setCompanySettings({ ...companySettings, address: e.target.value })}
                />
              </div>

              <Button onClick={saveCompanySettings}>Save Company Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pos">
          <Card>
            <CardHeader>
              <CardTitle>POS Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tax-rate">Tax Rate (%)</Label>
                  <Input
                    id="tax-rate"
                    type="number"
                    value={posSettings.taxRate}
                    onChange={(e) => setPosSettings({ ...posSettings, taxRate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency Symbol</Label>
                  <Input
                    id="currency"
                    value={posSettings.currency}
                    onChange={(e) => setPosSettings({ ...posSettings, currency: e.target.value })}
                    placeholder="Rs"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Default: Rs (Pakistani Rupee)
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <Label>Static Receipt Footer</Label>
                  <div className="mt-2 p-3 bg-muted rounded-md">
                    <p className="text-sm">Powered by Factssolution, All Rights Reserved 2025-2026</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    This footer will always appear on all receipts and reports
                  </p>
                </div>

                <div>
                  <Label htmlFor="receipt-footer">Custom Receipt Footer (Editable)</Label>
                  <Textarea
                    id="receipt-footer"
                    rows={3}
                    value={posSettings.receiptFooter}
                    onChange={(e) => setPosSettings({ ...posSettings, receiptFooter: e.target.value })}
                    placeholder="Enter your company address or custom message..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This will appear above the static footer on receipts
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4>Features</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Barcode Generation</Label>
                      <p className="text-sm text-muted-foreground">Generate barcodes for receipts</p>
                    </div>
                    <Switch
                      checked={posSettings.enableBarcode}
                      onCheckedChange={(checked) => setPosSettings({ ...posSettings, enableBarcode: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto Print Receipt</Label>
                      <p className="text-sm text-muted-foreground">Automatically print receipts after checkout</p>
                    </div>
                    <Switch
                      checked={posSettings.printReceipt}
                      onCheckedChange={(checked) => setPosSettings({ ...posSettings, printReceipt: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Sound Effects</Label>
                      <p className="text-sm text-muted-foreground">Play sounds for actions</p>
                    </div>
                    <Switch
                      checked={posSettings.soundEnabled}
                      onCheckedChange={(checked) => setPosSettings({ ...posSettings, soundEnabled: checked })}
                    />
                  </div>
                </div>
              </div>

              <Button onClick={savePosSettings}>Save POS Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Low Stock Alerts</Label>
                    <p className="text-sm text-muted-foreground">Get notified when products are running low</p>
                  </div>
                  <Switch
                    checked={notificationSettings.lowStock}
                    onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, lowStock: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Daily Sales Report</Label>
                    <p className="text-sm text-muted-foreground">Receive daily sales summary</p>
                  </div>
                  <Switch
                    checked={notificationSettings.dailyReport}
                    onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, dailyReport: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Employee Login Alerts</Label>
                    <p className="text-sm text-muted-foreground">Get notified when employees log in/out</p>
                  </div>
                  <Switch
                    checked={notificationSettings.employeeLogin}
                    onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, employeeLogin: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Supplier Payment Reminders</Label>
                    <p className="text-sm text-muted-foreground">Reminders for pending supplier payments</p>
                  </div>
                  <Switch
                    checked={notificationSettings.supplierPayments}
                    onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, supplierPayments: checked })}
                  />
                </div>
              </div>

              <Button onClick={saveNotificationSettings}>Save Notification Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security to user accounts</p>
                  </div>
                  <Switch
                    checked={securitySettings.twoFactor}
                    onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, twoFactor: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Strong Password Policy</Label>
                    <p className="text-sm text-muted-foreground">Enforce strong passwords (min 8 chars, uppercase, numbers)</p>
                  </div>
                  <Switch
                    checked={securitySettings.passwordPolicy}
                    onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, passwordPolicy: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Audit Log</Label>
                    <p className="text-sm text-muted-foreground">Keep track of all system activities and user actions</p>
                  </div>
                  <Switch
                    checked={securitySettings.auditLog}
                    onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, auditLog: checked })}
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                  <Input
                    id="session-timeout"
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: e.target.value })}
                    placeholder="30"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Auto-logout after inactivity
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="max-login-attempts">Max Login Attempts</Label>
                  <Input
                    id="max-login-attempts"
                    type="number"
                    value={securitySettings.maxLoginAttempts}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, maxLoginAttempts: e.target.value })}
                    placeholder="5"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Lock account after failed attempts
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="lockout-duration">Lockout Duration (minutes)</Label>
                  <Input
                    id="lockout-duration"
                    type="number"
                    value={securitySettings.lockoutDuration}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, lockoutDuration: e.target.value })}
                    placeholder="15"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    How long to lock account
                  </p>
                </div>
              </div>

              <Button onClick={saveSecuritySettings} disabled={saving}>
                {saving ? 'Saving...' : 'Save Security Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Data Management & Backups
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Backup Configuration */}
              <div>
                <h4>Backup Configuration</h4>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="backup-path">Backup Folder Path</Label>
                    <Input
                      id="backup-path"
                      value={dataSettings.backupPath}
                      onChange={(e) => setDataSettings({ ...dataSettings, backupPath: e.target.value })}
                      placeholder="Default: ./backups"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Leave empty to use default backup directory
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Automatic Backup</Label>
                      <p className="text-sm text-muted-foreground">Create backups automatically</p>
                    </div>
                    <Switch
                      checked={dataSettings.autoBackup}
                      onCheckedChange={(checked) => setDataSettings({ ...dataSettings, autoBackup: checked })}
                    />
                  </div>

                  {dataSettings.autoBackup && (
                    <div>
                      <Label htmlFor="backup-frequency">Backup Frequency</Label>
                      <select
                        id="backup-frequency"
                        className="w-full border rounded-md p-2 mt-1"
                        value={dataSettings.backupFrequency}
                        onChange={(e) => setDataSettings({ ...dataSettings, backupFrequency: e.target.value })}
                      >
                        <option value="hourly">Hourly</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                  )}

                  <Button onClick={handleSaveBackupPath} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Backup Settings'}
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Create Backup */}
              <div>
                <h4>Create New Backup</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Select what to include in your backup:
                </p>
                
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <Label>Include Database Structure</Label>
                    <Switch
                      checked={dataSettings.includeStructure}
                      onCheckedChange={(checked) => setDataSettings({ ...dataSettings, includeStructure: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Include All Data</Label>
                    <Switch
                      checked={dataSettings.includeData}
                      onCheckedChange={(checked) => setDataSettings({ ...dataSettings, includeData: checked })}
                    />
                  </div>
                  
                  {dataSettings.includeData && (
                    <div className="grid grid-cols-2 gap-2 pl-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={dataSettings.includeSettings}
                          onCheckedChange={(checked) => setDataSettings({ ...dataSettings, includeSettings: checked })}
                        />
                        <Label className="text-sm">Settings</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={dataSettings.includeProducts}
                          onCheckedChange={(checked) => setDataSettings({ ...dataSettings, includeProducts: checked })}
                        />
                        <Label className="text-sm">Products</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={dataSettings.includeOrders}
                          onCheckedChange={(checked) => setDataSettings({ ...dataSettings, includeOrders: checked })}
                        />
                        <Label className="text-sm">Orders</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={dataSettings.includeEmployees}
                          onCheckedChange={(checked) => setDataSettings({ ...dataSettings, includeEmployees: checked })}
                        />
                        <Label className="text-sm">Employees</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={dataSettings.includeSuppliers}
                          onCheckedChange={(checked) => setDataSettings({ ...dataSettings, includeSuppliers: checked })}
                        />
                        <Label className="text-sm">Suppliers</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={dataSettings.includeTransactions}
                          onCheckedChange={(checked) => setDataSettings({ ...dataSettings, includeTransactions: checked })}
                        />
                        <Label className="text-sm">Transactions</Label>
                      </div>
                    </div>
                  )}
                </div>

                <Button 
                  onClick={handleCreateBackup}
                  disabled={dataSettings.creatingBackup}
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {dataSettings.creatingBackup ? 'Creating Backup...' : 'Create Backup Now'}
                </Button>
              </div>

              <Separator />

              {/* Backup List */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4>Available Backups</h4>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={loadBackups}
                    disabled={dataSettings.loadingBackups}
                  >
                    Refresh
                  </Button>
                </div>

                {dataSettings.loadingBackups ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading backups...</p>
                  </div>
                ) : dataSettings.backups.length === 0 ? (
                  <div className="text-center py-8 bg-muted rounded-lg">
                    <Database className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No backups found</p>
                    <p className="text-sm text-muted-foreground">Create your first backup above</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {dataSettings.backups.map((backup: any) => (
                      <div key={backup.filename} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{backup.filename}</p>
                          <p className="text-xs text-muted-foreground">
                            {(backup.size / 1024).toFixed(2)} KB • {new Date(backup.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRestoreBackup(backup.filename)}
                            disabled={dataSettings.restoringBackup}
                          >
                            Restore
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteBackup(backup.filename)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Danger Zone */}
              <div className="bg-destructive/10 p-4 rounded-lg">
                <h4 className="text-destructive font-semibold mb-2">Danger Zone</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  These actions are irreversible. Please proceed with caution.
                </p>
                <Button variant="destructive" disabled>
                  Reset All Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shophours">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Shop Operating Hours & Token Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Shop Hours Configuration */}
              <div>
                <Label>Daily Operating Hours</Label>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Tokens will reset daily at shop opening time. Orders are counted per business day.
                </p>
                <div className="space-y-3">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                    <div key={day} className="flex items-center gap-4 p-3 border rounded-md">
                      <Switch
                        checked={shopHoursSettings[day as keyof typeof shopHoursSettings].enabled}
                        onCheckedChange={(checked) => 
                          setShopHoursSettings({
                            ...shopHoursSettings,
                            [day]: { ...shopHoursSettings[day as keyof typeof shopHoursSettings], enabled: checked }
                          })
                        }
                      />
                      <span className="w-24 font-medium capitalize">{day}</span>
                      <Input
                        type="time"
                        value={shopHoursSettings[day as keyof typeof shopHoursSettings].open}
                        onChange={(e) => 
                          setShopHoursSettings({
                            ...shopHoursSettings,
                            [day]: { ...shopHoursSettings[day as keyof typeof shopHoursSettings], open: e.target.value }
                          })
                        }
                        className="w-32"
                        disabled={!shopHoursSettings[day as keyof typeof shopHoursSettings].enabled}
                      />
                      <span className="text-muted-foreground">to</span>
                      <Input
                        type="time"
                        value={shopHoursSettings[day as keyof typeof shopHoursSettings].close}
                        onChange={(e) => 
                          setShopHoursSettings({
                            ...shopHoursSettings,
                            [day]: { ...shopHoursSettings[day as keyof typeof shopHoursSettings], close: e.target.value }
                          })
                        }
                        className="w-32"
                        disabled={!shopHoursSettings[day as keyof typeof shopHoursSettings].enabled}
                      />
                      {shopHoursSettings[day as keyof typeof shopHoursSettings].enabled && (
                        <span className="text-xs text-muted-foreground ml-2">
                          (Tokens: 0001 → Reset at open time)
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              {/* Token Format Preview */}
              <div>
                <Label>Token Number Format</Label>
                <div className="mt-2 p-4 bg-muted rounded-md">
                  <p className="text-2xl font-bold text-primary">TOKEN #0001</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    • Tokens start from <strong>0001</strong> at shop opening time
                  </p>
                  <p className="text-sm text-muted-foreground">
                    • Tokens increment: <strong>0001, 0002, 0003...</strong> throughout the day
                  </p>
                  <p className="text-sm text-muted-foreground">
                    • Tokens reset to <strong>0001</strong> at next day's opening time
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    • <strong>Example:</strong> If shop opens at 4:00 PM, tokens reset at 4:00 PM daily
                  </p>
                </div>
              </div>

              <Separator />

              {/* Important Note */}
              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="text-blue-900 dark:text-blue-100 font-semibold mb-2">ℹ️ Important Notes</h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• If closing time is before opening time (e.g., 4 PM to 4 AM), shop crosses midnight</li>
                  <li>• Orders after midnight but before closing time count toward previous business day</li>
                  <li>• Dashboard and reports will use business day (not calendar day) for calculations</li>
                  <li>• Changes take effect immediately for new orders</li>
                </ul>
              </div>
              
              <Button onClick={saveShopHoursSettings} disabled={saving}>
                {saving ? 'Saving...' : 'Save Shop Hours'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* License Tab */}
        <TabsContent value="license">
          <LicenseActivation />
        </TabsContent>
      </Tabs>
    </div>
  );
}