import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { auth } from '../services/supabase';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface LoginScreenProps {
  onLogin: (user: User, token: string) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Password validation
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      // Use Supabase Auth directly
      const { user, session } = await auth.login(formData.email, formData.password);
      
      if (!user || !session) {
        toast.error('Login failed. Please try again.');
        return;
      }
      
      // Get user profile from metadata or use defaults
      const userData = {
        id: user.id,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        role: user.user_metadata?.role || 'cashier'
      };
      
      // Pass user and Supabase session token to parent component
      onLogin(userData as any, session.access_token);
      
      toast.success('Login successful!');
      
    } catch (error: any) {
      // Log only error message for debugging (no sensitive data)
      console.error('Login failed:', error.message);
      
      // Provide specific error messages
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Invalid email or password. Please check your credentials.');
      } else if (error.message.includes('Email not confirmed')) {
        toast.error('Please verify your email address before logging in.');
      } else if (error.message.includes('Too many requests')) {
        toast.error('Too many login attempts. Please try again later.');
      } else {
        toast.error('Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-slate-50 to-zinc-100 p-4 sm:p-6 lg:p-8 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gray-200/50 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-slate-200/40 rounded-full blur-3xl"></div>
          {/* Subtle grid pattern overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Login Card Container */}
          <Card className="bg-white/98 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200/60 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-gray-300/80">
            <CardContent className="px-8 sm:px-10 py-8 sm:py-10">
              {/* Branding Section */}
              <div className="text-center mb-8">
                {/* Logo */}
                <div className="flex justify-center items-center mb-6">
                  {imageError ? (
                    <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl shadow-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                        <line x1="8" y1="21" x2="16" y2="21"></line>
                        <line x1="12" y1="17" x2="12" y2="21"></line>
                      </svg>
                    </div>
                  ) : (
                    <img 
                      src="/factssolution.jpeg" 
                      alt="Facts Solution Logo"
                      className="w-20 h-20 object-contain rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
                      onError={handleImageError}
                    />
                  )}
                </div>
                
                {/* Application Title */}
                <h1 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                  POS System
                </h1>
                
                {/* Description */}
                <p className="text-sm text-gray-600 max-w-xs mx-auto leading-relaxed">
                  Streamline your business operations with our comprehensive point-of-sale solution. Manage inventory, process transactions, and track performance.
                </p>
                
                {/* Decorative line */}
                <div className="mt-6 mb-2 flex items-center justify-center gap-2">
                  <div className="h-px w-12 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                  <div className="h-1.5 w-1.5 rounded-full bg-gray-400"></div>
                  <div className="h-px w-12 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                </div>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-5" noValidate>
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                    Email Address
                    <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-gray-700 transition-colors pointer-events-none" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-10 h-12 border-gray-300 rounded-xl focus:border-gray-600 focus:ring-2 focus:ring-gray-600/15 transition-all duration-200 bg-gray-50/50 hover:bg-white"
                      disabled={isLoading}
                      autoComplete="email"
                      required
                      aria-required="true"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                      Password
                      <span className="text-red-500">*</span>
                    </Label>
                    <a href="#" className="text-xs text-gray-600 hover:text-gray-900 font-semibold transition-colors" tabIndex={0}>
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-gray-700 transition-colors pointer-events-none" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="pl-10 pr-10 h-12 border-gray-300 rounded-xl focus:border-gray-600 focus:ring-2 focus:ring-gray-600/15 transition-all duration-200 bg-gray-50/50 hover:bg-white"
                      disabled={isLoading}
                      autoComplete="current-password"
                      required
                      aria-required="true"
                      minLength={6}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-200/70 rounded-lg transition-all duration-200"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-600 hover:text-gray-800 transition-colors" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-600 hover:text-gray-800 transition-colors" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="remember"
                    className="w-4 h-4 rounded border-gray-400 text-gray-700 focus:ring-gray-600 focus:ring-2 cursor-pointer transition-all accent-gray-700"
                    disabled={isLoading}
                  />
                  <Label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer select-none font-medium">
                    Remember me for 30 days
                  </Label>
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black text-white font-semibold text-base rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] border border-gray-700"
                  disabled={isLoading}
                  aria-label="Sign in to POS System"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </Button>
              </form>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-gray-200/80 text-center space-y-2">
                <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500">
                  <svg className="h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="leading-relaxed font-medium">
                    Main Auto Bhan Road Near TCL Building Hyderabad
                  </span>
                </div>
                <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
                  <svg className="h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="leading-relaxed font-medium">
                    Powered by Facts Solution © 2026 - 2030 All Rights Reserved
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Toaster position="top-right" richColors closeButton />
    </>
  );
}
