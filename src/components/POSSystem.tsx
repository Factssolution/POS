import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus, Minus, Trash2, ShoppingCart, Receipt, Search, X, Package } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { toast } from 'sonner';
import { api } from '../services/api';

interface Product {
  id: number;
  name: string;
  price: number;
  image_url?: string | null;
  category: string;
  stock: number;
  barcode: string;
  status: 'active' | 'inactive';
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  stock: number;
}

interface Settings {
  tax_rate?: number;
  company_name?: string;
  company_address?: string;
  company_phone?: string;
  company_logo?: string;
  receipt_footer?: string;
}

export default function POSSystem() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tokenNumber, setTokenNumber] = useState(0);
  const [currentToken, setCurrentToken] = useState<string>('TOKEN #0000');
  const [shopStatus, setShopStatus] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [settings, setSettings] = useState<Settings>({});
  const [currentOrderId, setCurrentOrderId] = useState<number | null>(null);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);

  // Load products and settings on mount
  useEffect(() => {
    loadPOSData();
  }, []);

  const loadPOSData = async () => {
    try {
      setLoading(true);
      
      // Load active products
      const response = await api.getProducts({ status: 'active' });
      setProducts(response.products || []);
      
      // Load settings for tax rate and company info
      try {
        const settingsData = await api.getSettings();
        setSettings(settingsData);
      } catch (err) {
        console.error('Settings load error:', err);
      }
      
      // Load current token number
      try {
        const tokenData = await api.getNextToken();
        setCurrentToken(tokenData.formatted_token);
        setShopStatus(tokenData.shop_status);
        
        // Show notification if new business day
        if (tokenData.shop_status?.isNewBusinessDay) {
          toast.info(`New business day - Token reset to ${tokenData.formatted_token}`);
        }
      } catch (err) {
        console.error('Token load error:', err);
      }
      
    } catch (error: any) {
      console.error('POS load error:', error);
      toast.error('Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    if (product.status === 'inactive') {
      toast.error('This product is currently unavailable');
      return;
    }

    if (product.stock <= 0) {
      toast.error('Product is out of stock');
      return;
    }

    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        toast.error('Not enough stock available');
        return;
      }
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { 
        id: product.id, 
        name: product.name, 
        price: product.price, 
        quantity: 1,
        stock: product.stock
      }]);
    }
  };

  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(id);
    } else {
      const cartItem = cart.find(item => item.id === id);
      if (cartItem && newQuantity > cartItem.stock) {
        toast.error('Not enough stock available');
        return;
      }
      setCart(cart.map(item => 
        item.id === id ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
  };

  const getTaxRate = () => {
    return settings?.tax_rate || 18;
  };

  const getSubtotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTax = () => {
    return Math.round(getSubtotal() * (getTaxRate() / 100));
  };

  const getTotal = () => {
    return getSubtotal() + getTax();
  };

  const generateReceipt = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    try {
      setSubmitting(true);
      
      // Create order via API
      const orderData = {
        customer_name: customerName || undefined,
        customer_phone: customerPhone || undefined,
        payment_method: paymentMethod,
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity
        }))
      };

      const response = await api.createOrder(orderData);
      
      // IMMEDIATELY clear cart and reset fields after successful order
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      
      // Set token number from response
      setTokenNumber(response.token_number);
      setCurrentOrderId(response.id);
      
      // Fetch receipt data
      await loadReceiptData(response.id);
      
      // Show receipt modal
      setShowReceipt(true);
      
      toast.success('Order created successfully!');
      
      // Reload products to get updated stock
      await loadPOSData();
      
      // Update token for next order
      try {
        const tokenData = await api.getNextToken();
        setCurrentToken(tokenData.formatted_token);
        setShopStatus(tokenData.shop_status);
      } catch (err) {
        console.error('Token refresh error:', err);
      }
      
    } catch (error: any) {
      console.error('Order creation error:', error);
      toast.error(error.message || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  const loadReceiptData = async (orderId: number) => {
    try {
      setReceiptLoading(true);
      console.log('📥 Loading receipt data for order:', orderId);
      
      const data = await api.getOrderReceipt(orderId);
      console.log('✅ Receipt data loaded:', data);
      console.log(' Order object:', data.order);
      console.log(' Order created_at:', data.order?.created_at);
      console.log(' Settings object:', data.settings);
      console.log(' Logo:', data.settings?.logo || data.settings?.company_logo);
      console.log(' Name:', data.settings?.name || data.settings?.company_name);
      
      // Ensure order has created_at
      if (!data.order?.created_at) {
        console.warn('⚠️ Order missing created_at, using current time');
        data.order.created_at = new Date().toISOString();
      }
      
      setReceiptData(data);
      
    } catch (error) {
      console.error('❌ Failed to load receipt data:', error);
      toast.error('Failed to load receipt');
    } finally {
      setReceiptLoading(false);
    }
  };

  const handlePrintReceipt = () => {
    console.log('🖨️ Manual print triggered');
    
    const receiptElement = document.getElementById('receipt-content');
    if (!receiptElement) {
      toast.error('Receipt content not found');
      return;
    }

    // Open new window for printing
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) {
      toast.error('Please allow popups to print');
      return;
    }

    const receiptHTML = receiptElement.innerHTML;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 5mm;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            width: 80mm;
            font-family: 'Courier New', Courier, monospace;
            font-size: 11px;
            line-height: 1.3;
            padding: 5mm;
            color: black;
            background: white;
          }
          .receipt-section {
            margin-bottom: 10px;
          }
          .receipt-header {
            text-align: center;
            margin-bottom: 10px;
          }
          .receipt-logo {
            width: 60px;
            height: 60px;
            object-fit: contain;
            margin: 0 auto 5px;
            display: block;
          }
          .receipt-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 3px;
          }
          .receipt-info {
            font-size: 10px;
            margin-bottom: 2px;
          }
          .receipt-customer-info {
            margin-bottom: 8px;
            font-size: 10px;
          }
          .receipt-customer-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
          }
          .receipt-divider {
            border: none;
            border-top: 1px dashed #000;
            margin: 8px 0;
          }
          .receipt-section-title {
            font-weight: bold;
            margin-bottom: 5px;
            font-size: 12px;
          }
          .receipt-item {
            margin-bottom: 8px;
          }
          .receipt-item-details {
            margin-bottom: 3px;
          }
          .receipt-item-name {
            font-weight: bold;
            margin-bottom: 2px;
          }
          .receipt-item-meta {
            font-size: 10px;
            margin-bottom: 2px;
          }
          .receipt-item-total {
            text-align: right;
            font-weight: bold;
          }
          .receipt-totals {
            margin-top: 8px;
          }
          .receipt-total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
          }
          .grand-total {
            font-weight: bold;
            font-size: 13px;
            border-top: 1px solid #000;
            padding-top: 5px;
            margin-top: 5px;
          }
          .receipt-footer {
            text-align: center;
            margin-top: 10px;
            font-size: 10px;
          }
          .receipt-footer-text {
            margin-bottom: 3px;
          }
          .receipt-footer-bold {
            font-weight: bold;
            margin-bottom: 3px;
          }
          img {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @media print {
            body {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        ${receiptHTML}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 500);
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    
    toast.success('Print dialog opened!');
  };

  const completeOrder = () => {
    setShowReceipt(false);
    setCurrentOrderId(null);
    setReceiptData(null);
    
    toast.success('Ready for next customer!');
  };

  // Filter products based on search and category
  const filteredProducts = products.filter(product => {
    if (product.status === 'inactive') return false;
    
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.barcode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(products.map(p => p.category))];

  // Helper function to validate and sanitize image URLs
  const isValidImageUrl = (url: string | null | undefined): boolean => {
    if (!url) return false;
    // Block file:// protocol URLs
    if (url.startsWith('file://')) return false;
    // Only allow http:// or https:// URLs
    if (!url.startsWith('http://') && !url.startsWith('https://')) return false;
    return true;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 h-full">
      {/* Cart Section */}
      <div className="xl:col-span-1 order-2 xl:order-1">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                <span>Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})</span>
              </div>
              {cart.length > 0 && (
                <Button size="sm" variant="outline" onClick={clearCart}>
                  <X className="w-3 h-3" />
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Cart is empty</p>
                <p className="text-sm text-muted-foreground">Add products to get started</p>
              </div>
            ) : (
              <>
                {/* Customer Info */}
                <div className="space-y-2">
                  <Input
                    placeholder="Customer Name (Optional)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    autoComplete="name"
                  />
                  <Input
                    placeholder="Customer Phone (Optional)"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    autoComplete="tel"
                  />
                </div>

                <Separator />

                {/* Current Token Display */}
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Current Order</p>
                      <p className="text-3xl font-bold text-primary mt-1">{currentToken}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Business Day</p>
                      <p className="text-sm font-semibold mt-1">
                        {shopStatus?.businessDay ? new Date(shopStatus.businessDay).toLocaleDateString('en-GB') : 'Loading...'}
                      </p>
                    </div>
                  </div>
                  {shopStatus && (
                    <div className="mt-2 flex items-center gap-2 pt-2 border-t border-primary/20">
                      <div className={`w-2 h-2 rounded-full ${shopStatus.isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                      <span className="text-xs text-muted-foreground">
                        {shopStatus.isOpen ? 'Shop Open' : 'Shop Closed - Orders still allowed'}
                      </span>
                      {shopStatus.nextReset && (
                        <span className="text-xs text-muted-foreground ml-auto">
                          Next reset: {new Date(shopStatus.nextReset).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Cart Items */}
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {cart.map(item => (
                    <div key={item.id} className="bg-muted/50 p-3 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground">Rs {item.price} each</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFromCart(item.id)}
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="h-7 w-7 p-0"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="h-7 w-7 p-0"
                            disabled={item.quantity >= item.stock}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <span className="font-medium">Rs {item.price * item.quantity}</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Separator />
                
                {/* Payment Method */}
                <div>
                  <label className="text-sm font-medium">Payment Method</label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">💵 Cash</SelectItem>
                      <SelectItem value="easypaisa">📱 Easypaisa/JazzCash</SelectItem>
                      <SelectItem value="bank">🏦 Bank Transfer</SelectItem>
                      <SelectItem value="other">📝 Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />
                
                {/* Bill Summary */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>Rs {getSubtotal()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax ({getTaxRate()}%):</span>
                    <span>Rs {getTax()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>Rs {getTotal()}</span>
                  </div>
                </div>
                
                <Button 
                  className="w-full" 
                  onClick={generateReceipt}
                  disabled={cart.length === 0 || submitting}
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  {submitting ? 'Processing...' : 'Generate Bill'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Products Section */}
      <div className="xl:col-span-3 order-1 xl:order-2">
        <Card className="h-full">
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <CardTitle>Products</CardTitle>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products or scan barcode..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="overflow-auto">
            {selectedCategory === 'all' ? (
              categories.map(category => {
                const categoryProducts = filteredProducts.filter(p => p.category === category);
                if (categoryProducts.length === 0) return null;
                
                return (
                  <div key={category} className="mb-6">
                    <h3 className="font-semibold mb-3 sticky top-0 bg-background py-2">
                      {category} ({categoryProducts.length})
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {categoryProducts.map(product => (
                        <ProductCard 
                          key={product.id} 
                          product={product} 
                          onAddToCart={addToCart}
                          inCart={cart.some(item => item.id === product.id)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredProducts.map(product => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onAddToCart={addToCart}
                    inCart={cart.some(item => item.id === product.id)}
                  />
                ))}
              </div>
            )}
            
            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No products found</p>
                <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Receipt Modal */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-lg print:max-w-none print:w-full print:border-0 print:shadow-none print:fixed print:inset-0 print:bg-white print:z-[9999] flex flex-col max-h-[90vh]" aria-describedby={undefined}>
          <DialogHeader className="no-print print:hidden flex-shrink-0">
            <DialogTitle className="text-center">Receipt Preview</DialogTitle>
          </DialogHeader>
          
          {receiptLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading receipt...</p>
              </div>
            </div>
          ) : receiptData ? (
            <>
              {/* Scrollable Receipt Content */}
              <div className="flex-1 overflow-y-auto space-y-4 print:space-y-0 print:overflow-visible">
                <div id="receipt-content" className="receipt-container print:block print:w-[80mm] print:mx-auto">
                  {/* ORIGINAL RECEIPT */}
                  <ThermalReceipt 
                    order={receiptData.order}
                    settings={receiptData.settings}
                    copyType="ORIGINAL"
                  />
                  
                  <div className="my-6">
                    <hr className="border-dashed border-gray-400" />
                  </div>
                  
                  {/* CUSTOMER COPY */}
                  <ThermalReceipt 
                    order={receiptData.order}
                    settings={receiptData.settings}
                    copyType="CUSTOMER COPY"
                  />
                </div>
              </div>
              
              {/* Fixed Bottom Buttons - Always Visible */}
              <div className="flex-shrink-0 border-t pt-4 mt-4 no-print print:hidden bg-background sticky bottom-0">
                <div className="flex gap-3 justify-center">
                  <Button 
                    className="flex-1 max-w-[200px]" 
                    onClick={completeOrder}
                    size="default"
                  >
                    Complete Order
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handlePrintReceipt}
                    className="flex-1 max-w-[200px]"
                    size="default"
                  >
                    Print Receipt
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Failed to load receipt data</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Professional Thermal Receipt Component
function ThermalReceipt({ 
  order, 
  settings, 
  copyType 
}: { 
  order: any;
  settings: Record<string, any>;
  copyType: string;
}) {
  const formatDate = (dateString: string) => {
    console.log('📅 formatDate called with:', dateString, 'Type:', typeof dateString);
    if (!dateString) {
      console.log('  ⚠️ No date string, using current time');
      dateString = new Date().toISOString();
    }
    try {
      const date = new Date(dateString);
      const isValid = !isNaN(date.getTime());
      console.log('  Parsed date:', date, 'Valid:', isValid);
      if (!isValid) {
        console.log('  ❌ Invalid date, using current time');
        date.setTime(Date.now());
      }
      return date.toLocaleDateString('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }) + ' ' + date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      console.error('  ❌ formatDate error:', e);
      const now = new Date();
      return now.toLocaleDateString('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }) + ' ' + now.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return `Rs ${amount.toFixed(2)}`;
  };

  return (
    <div className="receipt-section">
      {/* Copy Type Label */}
      {copyType && (
        <div className="text-center mb-2">
          <span className="text-xs font-bold">*** {copyType} ***</span>
        </div>
      )}

      {/* Header with Logo */}
      <div className="receipt-header">
        {settings.logo && (
          <div className="mb-2 text-center">
            <img 
              src={settings.logo} 
              alt="Company Logo"
              className="receipt-logo"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
        <div className="receipt-title">
          {settings.name || settings.company_name || 'POS Store'}
        </div>
        {(settings.address || settings.company_address) && (
          <div className="receipt-info">{settings.address || settings.company_address}</div>
        )}
        {(settings.phone || settings.company_phone) && (
          <div className="receipt-info">Phone: {settings.phone || settings.company_phone}</div>
        )}
      </div>

      {/* Order Info */}
      <div className="receipt-customer-info">
        <div className="receipt-customer-row">
          <span>Token #:</span>
          <span className="font-bold">{order.token_number}</span>
        </div>
        <div className="receipt-customer-row">
          <span>Date:</span>
          <span>{formatDate(order.created_at)}</span>
        </div>
        {order.customer_name && (
          <div className="receipt-customer-row">
            <span>Customer:</span>
            <span>{order.customer_name}</span>
          </div>
        )}
        {order.customer_phone && (
          <div className="receipt-customer-row">
            <span>Phone:</span>
            <span>{order.customer_phone}</span>
          </div>
        )}
        <div className="receipt-customer-row">
          <span>Cashier:</span>
          <span>{order.cashier?.name || 'N/A'}</span>
        </div>
      </div>

      <hr className="receipt-divider" />

      {/* Items Section */}
      <div className="receipt-section">
        <div className="receipt-section-title">Items</div>
        
        {order.items.map((item: any) => (
          <div key={item.id} className="receipt-item">
            <div className="receipt-item-details">
              <div className="receipt-item-name">
                {item.index}. {item.product_name}
              </div>
              <div className="receipt-item-meta">
                {item.quantity} x {formatCurrency(item.price)}
              </div>
            </div>
            <div className="receipt-item-total">
              {formatCurrency(item.total)}
            </div>
          </div>
        ))}
      </div>

      {/* Totals Section */}
      <div className="receipt-totals">
        <div className="receipt-total-row">
          <span>Subtotal:</span>
          <span>{formatCurrency(order.subtotal)}</span>
        </div>
        <div className="receipt-total-row">
          <span>Tax ({settings.tax_rate || 0}%):</span>
          <span>{formatCurrency(order.tax_amount)}</span>
        </div>
        <div className="receipt-total-row grand-total">
          <span>TOTAL:</span>
          <span>{formatCurrency(order.total_amount)}</span>
        </div>
      </div>

      {/* Payment Info */}
      <div className="receipt-customer-info">
        <div className="receipt-customer-row">
          <span>Payment Method:</span>
          <span className="capitalize">{order.payment_method}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="receipt-footer">
        <p className="receipt-footer-text">Thank you for your business!</p>
        <p className="receipt-footer-bold">
          Powered by Factssolution
        </p>
        <p className="receipt-footer-text">
          © 2025-2026 {settings.name || settings.company_name || 'POS Store'}
        </p>
      </div>
    </div>
  );
}

// Product Card Component
function ProductCard({ 
  product, 
  onAddToCart, 
  inCart 
}: { 
  product: Product; 
  onAddToCart: (product: Product) => void;
  inCart: boolean;
}) {
  // Helper function to validate and sanitize image URLs
  const isValidImageUrl = (url: string | null | undefined): boolean => {
    if (!url) return false;
    // Block file:// protocol URLs
    if (url.startsWith('file://')) return false;
    // Only allow http:// or https:// URLs
    if (!url.startsWith('http://') && !url.startsWith('https://')) return false;
    return true;
  };

  return (
    <Card 
      className={`cursor-pointer hover:shadow-md transition-all duration-200 ${
        inCart ? 'ring-2 ring-primary' : ''
      } ${product.stock <= 0 ? 'opacity-50' : ''}`}
      onClick={() => onAddToCart(product)}
    >
      <CardContent className="p-3">
        <div className="relative">
          {product.image_url && isValidImageUrl(product.image_url) ? (
            <img 
              src={product.image_url} 
              alt={product.name}
              className="w-full h-20 sm:h-24 object-cover rounded mb-2"
              onError={(e) => {
                // Hide image if it fails to load
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-20 sm:h-24 bg-muted rounded mb-2 flex items-center justify-center">
              <Package className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
          {product.stock <= 0 && (
            <div className="absolute inset-0 bg-black/50 rounded flex items-center justify-center">
              <span className="text-white text-xs font-medium">Out of Stock</span>
            </div>
          )}
          {inCart && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center">
              ✓
            </Badge>
          )}
        </div>
        <h4 className="font-medium text-sm truncate">{product.name}</h4>
        <div className="flex justify-between items-center mt-1">
          <p className="text-sm font-semibold">Rs {product.price}</p>
          <p className="text-xs text-muted-foreground">Stock: {product.stock}</p>
        </div>
        {product.stock <= 5 && product.stock > 0 && (
          <Badge variant="outline" className="text-xs mt-1">
            Low Stock
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
