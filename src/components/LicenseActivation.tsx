import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { api } from '../services/api';
import {
  Key,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Shield,
  Copy,
  RefreshCw,
  Info,
} from 'lucide-react';

interface LicenseActivationProps {
  onActivationSuccess?: () => void;
}

export default function LicenseActivation({ onActivationSuccess }: LicenseActivationProps) {
  const [licenseKey, setLicenseKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [licenseStatus, setLicenseStatus] = useState<any>(null);

  const handleActivateLicense = async () => {
    if (!licenseKey.trim()) {
      toast.error('Please enter a license key');
      return;
    }

    // Validate format
    const pattern = /^FACTS-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    if (!pattern.test(licenseKey.trim())) {
      toast.error('Invalid license key format. Expected: FACTS-XXXX-XXXX-XXXX-XXXX');
      return;
    }

    try {
      setIsLoading(true);
      
      // Get current user email to auto-activate
      const userData = localStorage.getItem('pos_user_data');
      const currentUser = userData ? JSON.parse(userData) : null;
      const client_email = currentUser?.email || null;
      
      const response = await api.activateLicense(licenseKey.trim(), client_email);
      
      toast.success('✅ License activated successfully!');
      toast.success(`Valid until: ${new Date(response.expiry_date).toLocaleDateString('en-GB')}`);
      
      if (response.user_activated) {
        toast.success('✅ Your account has been activated!');
      }
      
      setLicenseKey('');
      
      // Reload status
      await loadLicenseStatus();
      
      if (onActivationSuccess) {
        onActivationSuccess();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to activate license');
    } finally {
      setIsLoading(false);
    }
  };

  const loadLicenseStatus = async () => {
    try {
      const status = await api.getLicenseStatus();
      setLicenseStatus(status);
    } catch (error: any) {
      console.error('Failed to load license status:', error);
    }
  };

  React.useEffect(() => {
    loadLicenseStatus();
  }, []);

  const getStatusIcon = () => {
    if (!licenseStatus) return <Clock className="w-6 h-6 text-gray-500" />;
    
    if (licenseStatus.is_trial) {
      return <Clock className="w-6 h-6 text-blue-500" />;
    }
    
    if (licenseStatus.is_expired) {
      return <XCircle className="w-6 h-6 text-red-500" />;
    }
    
    return <CheckCircle className="w-6 h-6 text-green-500" />;
  };

  const getStatusMessage = () => {
    if (!licenseStatus) {
      return { title: 'Checking...', color: 'text-gray-500' };
    }

    if (licenseStatus.is_trial) {
      const days = licenseStatus.days_remaining;
      if (days <= 0) {
        return { title: 'Trial Expired', color: 'text-red-500' };
      }
      if (days <= 7) {
        return { title: `Trial: ${days} days left`, color: 'text-orange-500' };
      }
      return { title: `Trial: ${days} days remaining`, color: 'text-blue-500' };
    }

    if (licenseStatus.is_expired) {
      return { title: 'License Expired', color: 'text-red-500' };
    }

    const days = licenseStatus.days_remaining;
    if (days <= 5) {
      return { title: `License: ${days} days left - RENEW NOW!`, color: 'text-orange-500' };
    }

    return { title: `Licensed: ${days} days remaining`, color: 'text-green-500' };
  };

  const statusMsg = getStatusMessage();

  return (
    <div className="space-y-4">
      {/* Current Status Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {getStatusIcon()}
              <div>
                <h3 className="font-semibold text-lg">
                  License Status
                </h3>
                <p className={`text-sm font-medium ${statusMsg.color}`}>
                  {statusMsg.title}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadLicenseStatus}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Check Status
            </Button>
          </div>

          {licenseStatus && (
            <div className="mt-4 space-y-2 text-sm">
              {licenseStatus.is_trial ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Trial Start:</span>
                    <span className="font-medium">
                      {licenseStatus.trial_start_date 
                        ? new Date(licenseStatus.trial_start_date).toLocaleDateString('en-GB')
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Trial End:</span>
                    <span className="font-medium">
                      {licenseStatus.trial_end_date
                        ? new Date(licenseStatus.trial_end_date).toLocaleDateString('en-GB')
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-blue-800 font-medium">Trial Period Active</p>
                        <p className="text-blue-600 text-xs mt-1">
                          You have full access during the trial period. Activate a license to continue after trial expires.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : licenseStatus.license_key ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">License Key:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs">{licenseStatus.license_key}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(licenseStatus.license_key);
                          toast.success('Copied!');
                        }}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expiry Date:</span>
                    <span className="font-medium">
                      {licenseStatus.expiry_date
                        ? new Date(licenseStatus.expiry_date).toLocaleDateString('en-GB')
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                      <div>
                        <p className="text-green-800 font-medium">License Active</p>
                        <p className="text-green-600 text-xs mt-1">
                          Your system is fully licensed and operational.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activation Form */}
      {!licenseStatus?.is_expired && !licenseStatus?.license_key && (
        <Card>
          <CardHeader>
            <CardTitle>Activate License</CardTitle>
            <CardDescription>
              Enter your license key to activate the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="license_key">License Key</Label>
                <Input
                  id="license_key"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                  placeholder="FACTS-XXXX-XXXX-XXXX-XXXX"
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Format: FACTS-XXXX-XXXX-XXXX-XXXX
                </p>
              </div>

              <Button
                onClick={handleActivateLicense}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Activating...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Activate License
                  </>
                )}
              </Button>

              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-yellow-800 font-medium text-sm">Need a License?</p>
                    <p className="text-yellow-600 text-xs mt-1">
                      Contact your system administrator to obtain a valid license key.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expired Warning */}
      {licenseStatus?.is_expired && (
        <Card className="border-red-500">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              System Locked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Your {licenseStatus.is_trial ? 'trial period' : 'license'} has expired. 
                The system is now locked. Please activate a new license to continue using the system.
              </p>

              <div className="space-y-2">
                <Label htmlFor="license_key_expired">Enter New License Key</Label>
                <Input
                  id="license_key_expired"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                  placeholder="FACTS-XXXX-XXXX-XXXX-XXXX"
                  className="font-mono"
                />
              </div>

              <Button
                onClick={handleActivateLicense}
                disabled={isLoading}
                className="w-full"
                variant="destructive"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Activating...
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4 mr-2" />
                    Activate New License
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
