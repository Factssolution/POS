const { Category, Product } = require('../models');
const { Op } = require('sequelize');
const supabase = require('../config/supabase');

// Get all categories
exports.getAllCategories = async (req, res) => {
  try {
    const { status, search } = req.query;
    
    // Use Supabase for Vercel deployment
    let query = supabase
      .from('categories')
      .select('*', { count: 'exact' })
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data: categories, error, count } = await query;
    
    if (error) {
      console.error('Supabase categories query error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch categories',
        error: error.message
      });
    }

    // Get product count for each category
    const categoriesWithCount = await Promise.all(
      (categories || []).map(async (category) => {
        const { count: productCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('category', category.name);
        
        return {
          ...category,
          product_count: productCount || 0
        };
      })
    );

    res.json({
      success: true,
      data: {
        categories: categoriesWithCount,
        count: categoriesWithCount.length
      }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
};

// Get category by ID
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Get product count
    const productCount = await Product.count({
      where: { category: category.name }
    });

    res.json({
      success: true,
      data: {
        ...category.toJSON(),
        product_count: productCount
      }
    });
  } catch (error) {
    console.error('Get category by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category',
      error: error.message
    });
  }
};

// Create new category
exports.createCategory = async (req, res) => {
  try {
    const { name, description, color, icon, status, sort_order } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    // Use Supabase for Vercel deployment
    // Check if category already exists
    const { data: existingCategories, error: checkError } = await supabase
      .from('categories')
      .select('id')
      .eq('name', name.trim())
      .limit(1);
    
    if (checkError) {
      console.error('Supabase check error:', checkError);
      return res.status(500).json({
        success: false,
        message: 'Failed to check existing category',
        error: checkError.message
      });
    }

    if (existingCategories && existingCategories.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }

    // Create category
    const { data: newCategory, error: createError } = await supabase
      .from('categories')
      .insert({
        name: name.trim(),
        description: description || null,
        color: color || '#000000',
        icon: icon || null,
        status: status || 'active',
        sort_order: sort_order || 0
      })
      .select()
      .single();
    
    if (createError) {
      console.error('Supabase create error:', createError);
      return res.status(500).json({
        success: false,
        message: 'Failed to create category',
        error: createError.message
      });
    }

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: newCategory
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create category',
      error: error.message
    });
  }
};

// Update category
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color, icon, status, sort_order } = req.body;

    // Use Supabase for Vercel deployment
    const { data: category, error: findError } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (findError || !category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // If name is being changed, check for duplicates
    if (name && name.trim() !== category.name) {
      const { data: existingCategories } = await supabase
        .from('categories')
        .select('id')
        .eq('name', name.trim())
        .neq('id', id)
        .limit(1);

      if (existingCategories && existingCategories.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Another category with this name already exists'
        });
      }

      // Update product category references if name changes
      await supabase
        .from('products')
        .update({ category: name.trim() })
        .eq('category', category.name);
    }

    // Update the category
    const { data: updatedCategory, error: updateError } = await supabase
      .from('categories')
      .update({
        name: name ? name.trim() : category.name,
        description: description !== undefined ? description : category.description,
        color: color || category.color,
        icon: icon || category.icon,
        status: status || category.status,
        sort_order: sort_order !== undefined ? sort_order : category.sort_order,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Supabase update error:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Failed to update category',
        error: updateError.message
      });
    }

    // Get updated product count
    const { count: productCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category', updatedCategory.name);

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: {
        ...updatedCategory,
        product_count: productCount || 0
      }
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category',
      error: error.message
    });
  }
};

// Delete category
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Use Supabase for Vercel deployment
    const { data: category, error: findError } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (findError || !category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
        error: findError?.message
      });
    }

    // Check if category has products
    const { count: productCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category', category.name);

    if (productCount && productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It has ${productCount} product(s) assigned to it.`,
        data: { category_name: category.name, product_count: productCount }
      });
    }

    // Delete the category
    const { error: deleteError } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      console.error('Supabase delete error:', deleteError);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete category',
        error: deleteError.message
      });
    }

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category',
      error: error.message
    });
  }
};

// Get category statistics
exports.getCategoryStats = async (req, res) => {
  try {
    const categories = await Category.findAll({
      attributes: ['id', 'name', 'status']
    });

    const stats = await Promise.all(
      categories.map(async (category) => {
        const productCount = await Product.count({
          where: { category: category.name }
        });

        const activeProducts = await Product.count({
          where: { 
            category: category.name,
            status: 'active'
          }
        });

        return {
          id: category.id,
          name: category.name,
          status: category.status,
          total_products: productCount,
          active_products: activeProducts
        };
      })
    );

    res.json({
      success: true,
      data: {
        stats,
        total_categories: categories.length,
        active_categories: categories.filter(c => c.status === 'active').length
      }
    });
  } catch (error) {
    console.error('Get category stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category statistics',
      error: error.message
    });
  }
};
