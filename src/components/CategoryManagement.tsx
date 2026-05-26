import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Plus, Search, Edit, Trash2, Package, Eye, EyeOff, Palette } from 'lucide-react';
import { toast } from 'sonner';
import { api, Category } from '../services/api';

interface CategoryFormData {
  name: string;
  description: string;
  color: string;
  icon: string;
  status: 'active' | 'inactive';
  sort_order: number;
}

const defaultFormData: CategoryFormData = {
  name: '',
  description: '',
  color: '#3b82f6',
  icon: 'Package',
  status: 'active',
  sort_order: 0
};

export default function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [formData, setFormData] = useState<CategoryFormData>(defaultFormData);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await api.getCategoryList();
      setCategories(response.categories || []);
    } catch (error: any) {
      console.error('Failed to load categories:', error);
      toast.error('Failed to load categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(defaultFormData);
  };

  const handleAdd = () => {
    resetForm();
    setShowAddDialog(true);
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color || '#3b82f6',
      icon: category.icon || 'Package',
      status: category.status,
      sort_order: category.sort_order || 0
    });
    setShowEditDialog(true);
  };

  const handleDelete = async (category: Category) => {
    if (!confirm(`Are you sure you want to delete "${category.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.deleteCategory(category.id);
      toast.success('Category deleted successfully');
      loadCategories();
    } catch (error: any) {
      console.error('Failed to delete category:', error);
      toast.error(error.message || 'Failed to delete category');
    }
  };

  const handleSubmitAdd = async () => {
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      setSubmitting(true);
      await api.createCategory(formData);
      toast.success('Category added successfully');
      setShowAddDialog(false);
      resetForm();
      loadCategories();
    } catch (error: any) {
      console.error('Failed to add category:', error);
      toast.error(error.message || 'Failed to add category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    if (!selectedCategory) return;

    try {
      setSubmitting(true);
      await api.updateCategory(selectedCategory.id, formData);
      toast.success('Category updated successfully');
      setShowEditDialog(false);
      resetForm();
      loadCategories();
    } catch (error: any) {
      console.error('Failed to update category:', error);
      toast.error(error.message || 'Failed to update category');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (category: Category) => {
    try {
      const newStatus = category.status === 'active' ? 'inactive' : 'active';
      await api.updateCategory(category.id, { status: newStatus });
      toast.success(`Category ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      loadCategories();
    } catch (error: any) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    }
  };

  // Filter categories
  const filteredCategories = categories.filter(cat => {
    const matchesSearch = cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (cat.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || cat.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  // Category Form Component
  const CategoryForm = ({ 
    formData, 
    setFormData, 
    onSubmit, 
    submitting, 
    isEdit 
  }: { 
    formData: CategoryFormData;
    setFormData: (data: CategoryFormData) => void;
    onSubmit: () => void;
    submitting: boolean;
    isEdit: boolean;
  }) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Category Name *</Label>
        <Input
          id="name"
          placeholder="Enter category name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Enter category description (optional)"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="color">Color</Label>
          <div className="flex gap-2">
            <Input
              id="color"
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="w-16 h-10 p-1"
            />
            <Input
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              placeholder="#3b82f6"
              className="flex-1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sort_order">Sort Order</Label>
          <Input
            id="sort_order"
            type="number"
            value={formData.sort_order}
            onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
            min="0"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Status</Label>
        <Select
          value={formData.status}
          onValueChange={(value: 'active' | 'inactive') => setFormData({ ...formData, status: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => isEdit ? setShowEditDialog(false) : setShowAddDialog(false)}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={submitting}>
          {submitting ? (isEdit ? 'Updating...' : 'Adding...') : (isEdit ? 'Update Category' : 'Add Category')}
        </Button>
      </DialogFooter>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Category Management</h1>
          <p className="text-muted-foreground mt-1">Manage product categories and organization</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Categories</p>
                <p className="text-2xl font-bold mt-1">{categories.length}</p>
              </div>
              <Package className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold mt-1 text-green-600">
                  {categories.filter(c => c.status === 'active').length}
                </p>
              </div>
              <Eye className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Inactive</p>
                <p className="text-2xl font-bold mt-1 text-red-600">
                  {categories.filter(c => c.status === 'inactive').length}
                </p>
              </div>
              <EyeOff className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold mt-1">
                  {categories.reduce((sum, c) => sum + (c.product_count || 0), 0)}
                </p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle>Categories ({filteredCategories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Color</TableHead>
                <TableHead>Category Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sort Order</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No categories found
                  </TableCell>
                </TableRow>
              ) : (
                filteredCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div
                        className="w-8 h-8 rounded"
                        style={{ backgroundColor: category.color || '#3b82f6' }}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {category.description || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {category.product_count || 0} products
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={category.status === 'active' ? 'default' : 'secondary'}
                        className={category.status === 'active' ? 'bg-green-600' : ''}
                      >
                        {category.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{category.sort_order || 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleStatus(category)}
                          title={category.status === 'active' ? 'Deactivate' : 'Activate'}
                        >
                          {category.status === 'active' ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(category)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(category)}
                          disabled={(category.product_count || 0) > 0}
                          title={(category.product_count || 0) > 0 ? 'Cannot delete category with products' : 'Delete'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Category Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Create a new product category to organize your inventory.
            </DialogDescription>
          </DialogHeader>
          <CategoryForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmitAdd}
            submitting={submitting}
            isEdit={false}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update category details. Changing the name will update all associated products.
            </DialogDescription>
          </DialogHeader>
          <CategoryForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmitEdit}
            submitting={submitting}
            isEdit={true}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
