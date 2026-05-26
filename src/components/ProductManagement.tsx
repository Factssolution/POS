import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Plus, Edit, Trash2, Package, Search, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { api, Product } from '../services/api';

interface FormData {
  name: string;
  description: string;
  category: string;
  price: string;
  costPrice: string;
  stock: string;
  minStock: string;
  barcode: string;
  image: string;
  imageFile: File | null;
  supplierId: string;
}

// Move ProductForm outside as a separate component
const ProductForm = ({ 
  formData, 
  setFormData, 
  onSubmit, 
  isEdit = false,
  onGenerateBarcode,
  submitting = false,
  categories = []
}: { 
  formData: FormData;
  setFormData: (data: FormData) => void;
  onSubmit: () => void;
  isEdit?: boolean;
  onGenerateBarcode: () => void;
  submitting?: boolean;
  categories?: Array<{id: number; name: string; description: string | null; color: string; icon: string}>;
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      setFormData({ ...formData, imageFile: file, image: '' });
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, imageFile: null, image: '' });
  };

  return (
  <div className="space-y-4 max-h-96 overflow-y-auto">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="name">Product Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter product name"
        />
      </div>
      <div>
        <Label htmlFor="category">Category *</Label>
        <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(category => (
              <SelectItem key={category.id} value={category.name}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>

    <div>
      <Label htmlFor="description">Description</Label>
      <Textarea
        id="description"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        placeholder="Enter product description"
        rows={2}
      />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="price">Selling Price (Rs) *</Label>
        <Input
          id="price"
          type="number"
          step="0.01"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          placeholder="0.00"
        />
      </div>
      <div>
        <Label htmlFor="costPrice">Cost Price (Rs)</Label>
        <Input
          id="costPrice"
          type="number"
          step="0.01"
          value={formData.costPrice}
          onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
          placeholder="0.00"
        />
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="stock">Stock Quantity *</Label>
        <Input
          id="stock"
          type="number"
          value={formData.stock}
          onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
          placeholder="0"
        />
      </div>
      <div>
        <Label htmlFor="minStock">Minimum Stock</Label>
        <Input
          id="minStock"
          type="number"
          value={formData.minStock}
          onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
          placeholder="0"
        />
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="barcode">Barcode/SKU</Label>
        <div className="flex gap-2">
          <Input
            id="barcode"
            value={formData.barcode}
            onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
            placeholder="Auto-generated"
            className="font-mono"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const newBarcode = `P${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 900 + 100)}`;
              setFormData({ ...formData, barcode: newBarcode });
            }}
            title="Regenerate barcode"
          >
            Generate
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Auto-generated, but can be edited</p>
      </div>
      <div>
        <Label htmlFor="image">Product Image</Label>
        <div className="space-y-2">
          {/* Image Preview */}
          {(formData.imageFile || formData.image) && (
            <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
              <img 
                src={formData.imageFile ? URL.createObjectURL(formData.imageFile) : formData.image}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                ×
              </button>
            </div>
          )}
          
          {/* File Upload */}
          <div className="flex items-center gap-2">
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="flex-1"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Upload image (Max 5MB, JPG/PNG/GIF/WebP)
          </p>
        </div>
      </div>
    </div>

    <Button 
      onClick={onSubmit} 
      className="w-full"
      disabled={submitting}
    >
      {submitting ? (isEdit ? 'Updating...' : 'Adding...') : (isEdit ? 'Update Product' : 'Add Product')}
    </Button>
  </div>
  );
};

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Array<{id: number; name: string; description: string | null; color: string; icon: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    category: '',
    price: '',
    costPrice: '',
    stock: '',
    minStock: '',
    barcode: '',
    image: '',
    imageFile: null,
    supplierId: ''
  });

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await api.getCategories();
      // Extract just the names for the dropdown, but keep full data for reference
      setCategories(response.categories || []);
    } catch (error: any) {
      console.error('Failed to load categories from API, using fallback:', error);
      toast.error('Failed to load categories');
      setCategories([]);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      // Only load active products by default
      const response = await api.getProducts({ status: 'active' });
      setProducts(response.products || []);
    } catch (error: any) {
      console.error('Failed to load products:', error);
      toast.error('Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to validate and sanitize image URLs
  const isValidImageUrl = (url: string | null): boolean => {
    if (!url) return false;
    // Block file:// protocol URLs
    if (url.startsWith('file://')) return false;
    // Only allow http:// or https:// URLs
    if (!url.startsWith('http://') && !url.startsWith('https://')) return false;
    return true;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      price: '',
      costPrice: '',
      stock: '',
      minStock: '',
      barcode: '',
      image: '',
      imageFile: null,
      supplierId: ''
    });
  };

  const generateBarcode = () => {
    // Generate a clean serial number: P + timestamp (last 6 digits) + random (3 digits)
    const timestamp = Date.now().toString().slice(-6);
    const randomNum = Math.floor(Math.random() * 900 + 100); // 100-999
    return `P${timestamp}${randomNum}`;
  };

  const handleAdd = () => {
    resetForm();
    // Auto-generate barcode when opening add dialog
    setFormData(prev => ({
      ...prev,
      barcode: generateBarcode()
    }));
    setShowAddDialog(true);
  };

  const handleAddProduct = async () => {
    if (!formData.name || !formData.category || !formData.price || !formData.stock) {
      toast.error('Please fill in all required fields');
      return;
    }

    const price = parseFloat(formData.price);
    const costPrice = parseFloat(formData.costPrice) || 0;
    const stock = parseInt(formData.stock);
    const minStock = parseInt(formData.minStock) || 0;

    if (isNaN(price) || price <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    if (isNaN(stock) || stock < 0) {
      toast.error('Please enter a valid stock quantity');
      return;
    }

    try {
      setSubmitting(true);
      
      // Use FormData if image file is uploaded, otherwise use JSON
      if (formData.imageFile) {
        const formDataObj = new FormData();
        formDataObj.append('name', formData.name);
        formDataObj.append('description', formData.description);
        formDataObj.append('category', formData.category);
        formDataObj.append('price', price.toString());
        formDataObj.append('cost_price', costPrice.toString());
        formDataObj.append('stock', stock.toString());
        formDataObj.append('min_stock', minStock.toString());
        formDataObj.append('barcode', formData.barcode || generateBarcode());
        formDataObj.append('status', 'active');
        formDataObj.append('image', formData.imageFile);
        
        await api.createProduct(formDataObj);
      } else {
        await api.createProduct({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          price: price,
          cost_price: costPrice,
          stock: stock,
          min_stock: minStock,
          barcode: formData.barcode || generateBarcode(),
          image_url: formData.image || '',
          status: 'active'
        });
      }
      
      toast.success('Product added successfully');
      setShowAddDialog(false);
      resetForm();
      loadProducts();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditProduct = async () => {
    if (!formData.name || !formData.category || !formData.price || !formData.stock) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!selectedProduct) return;

    const price = parseFloat(formData.price);
    const costPrice = parseFloat(formData.costPrice) || 0;
    const stock = parseInt(formData.stock);
    const minStock = parseInt(formData.minStock) || 0;

    if (isNaN(price) || price <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    if (isNaN(stock) || stock < 0) {
      toast.error('Please enter a valid stock quantity');
      return;
    }

    try {
      setSubmitting(true);
      
      // Use FormData if new image file is uploaded, otherwise use JSON
      if (formData.imageFile) {
        const formDataObj = new FormData();
        formDataObj.append('name', formData.name);
        formDataObj.append('description', formData.description);
        formDataObj.append('category', formData.category);
        formDataObj.append('price', price.toString());
        formDataObj.append('cost_price', costPrice.toString());
        formDataObj.append('stock', stock.toString());
        formDataObj.append('min_stock', minStock.toString());
        formDataObj.append('barcode', formData.barcode);
        formDataObj.append('image', formData.imageFile);
        
        await api.updateProduct(selectedProduct.id, formDataObj);
      } else {
        await api.updateProduct(selectedProduct.id, {
          name: formData.name,
          description: formData.description,
          category: formData.category,
          price: price,
          cost_price: costPrice,
          stock: stock,
          min_stock: minStock,
          barcode: formData.barcode || selectedProduct.barcode,
          image_url: formData.image || selectedProduct.image_url || ''
        });
      }
      
      toast.success('Product updated successfully');
      setShowEditDialog(false);
      setSelectedProduct(null);
      resetForm();
      loadProducts();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    try {
      await api.deleteProduct(id);
      toast.success('Product deleted successfully');
      loadProducts();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete product');
    }
  };

  const openEditDialog = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      description: product.description ?? '',
      category: product.category,
      price: product.price.toString(),
      costPrice: product.cost_price.toString(),
      stock: product.stock.toString(),
      minStock: product.min_stock.toString(),
      barcode: product.barcode,
      image: product.image_url ?? '',
      imageFile: null,
      supplierId: ''
    });
    setShowEditDialog(true);
  };

  const toggleProductStatus = async (id: number) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;

    try {
      const newStatus = product.status === 'active' ? 'inactive' : 'active';
      await api.updateProduct(id, { status: newStatus });
      toast.success('Product status updated');
      loadProducts();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update product status');
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.barcode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getLowStockProducts = () => {
    return products.filter((product) => product.stock <= product.min_stock);
  };

  const getTotalValue = () => {
    return products.reduce((total: number, product) => total + (product.price * product.stock), 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2>Product Management</h2>
          <p className="text-muted-foreground">Manage your inventory and product catalog</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4" />
          Add Product
        </Button>
        
        {/* Add Dialog - Controlled manually */}
        <Dialog open={showAddDialog} onOpenChange={(open) => {
          if (!open) {
            resetForm();
          }
          setShowAddDialog(open);
        }}>
          <DialogContent className="max-w-2xl" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <ProductForm 
              formData={formData} 
              setFormData={setFormData} 
              onSubmit={handleAddProduct} 
              onGenerateBarcode={generateBarcode}
              submitting={submitting}
              categories={categories}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : products.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Active Products</CardTitle>
            <Package className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : products.filter((p) => p.status === 'active').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Low Stock Items</CardTitle>
            <Package className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {loading ? '...' : getLowStockProducts().length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Inventory Value</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : `Rs ${getTotalValue().toLocaleString()}`}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Low Stock Alert */}
      {getLowStockProducts().length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-700">Low Stock Alert</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-600 mb-2">
              {getLowStockProducts().length} product(s) are running low on stock:
            </p>
            <div className="flex flex-wrap gap-2">
              {getLowStockProducts().map((product: any) => (
                <Badge key={product.id} variant="outline" className="text-orange-700 border-orange-300">
                  {product.name} ({product.stock} left)
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products ({filteredProducts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading products...</p>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Products Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedCategory !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Get started by adding your first product'}
              </p>
              {!searchTerm && selectedCategory === 'all' && (
                <Button onClick={handleAdd}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="w-12 h-12 rounded border overflow-hidden">
                          {product.image_url && isValidImageUrl(product.image_url) ? (
                            <img 
                              src={product.image_url} 
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Hide image if it fails to load
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <ImageIcon className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.barcode}</p>
                        </div>
                      </TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>
                        <div>
                          <p>Rs {product.price}</p>
                          {product.cost_price > 0 && (
                            <p className="text-xs text-muted-foreground">Cost: Rs {product.cost_price}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className={product.stock <= product.min_stock ? 'text-orange-600' : ''}>
                            {product.stock}
                          </span>
                          {product.min_stock > 0 && (
                            <span className="text-xs text-muted-foreground">Min: {product.min_stock}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={product.status === 'active' ? 'default' : 'secondary'}
                          className="cursor-pointer"
                          onClick={() => toggleProductStatus(product.id)}
                        >
                          {product.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(product)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            <Trash2 className="w-3 h-3" />
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

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <ProductForm 
            formData={formData} 
            setFormData={setFormData} 
            onSubmit={handleEditProduct} 
            isEdit={true}
            onGenerateBarcode={generateBarcode}
            submitting={submitting}
            categories={categories}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}