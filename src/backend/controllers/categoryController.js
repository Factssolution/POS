const { Category, Product } = require('../models');
const { Op } = require('sequelize');

// Get all categories
exports.getAllCategories = async (req, res) => {
  try {
    const { status, search } = req.query;
    
    const where = {};
    
    if (status) {
      where.status = status;
    }
    
    if (search) {
      where.name = { [Op.like]: `%${search}%` };
    }

    const categories = await Category.findAll({
      where,
      order: [['sort_order', 'ASC'], ['name', 'ASC']]
    });

    // Get product count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const productCount = await Product.count({
          where: { category: category.name }
        });
        
        return {
          ...category.toJSON(),
          product_count: productCount
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

    // Check if category already exists
    const existingCategory = await Category.findOne({
      where: { name: name.trim() }
    });

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: 'Category already exists'
      });
    }

    const category = await Category.create({
      name: name.trim(),
      description: description || null,
      color: color || '#3b82f6',
      icon: icon || 'Package',
      status: status || 'active',
      sort_order: sort_order || 0
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: {
        ...category.toJSON(),
        product_count: 0
      }
    });
  } catch (error) {
    console.error('Create category error:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'Category name already exists'
      });
    }

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

    const category = await Category.findByPk(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // If name is being changed, check for duplicates
    if (name && name.trim() !== category.name) {
      const existingCategory = await Category.findOne({
        where: { 
          name: name.trim(),
          id: { [Op.ne]: id }
        }
      });

      if (existingCategory) {
        return res.status(409).json({
          success: false,
          message: 'Another category with this name already exists'
        });
      }

      // Update product category references if name changes
      await Product.update(
        { category: name.trim() },
        { where: { category: category.name } }
      );
    }

    await category.update({
      name: name ? name.trim() : category.name,
      description: description !== undefined ? description : category.description,
      color: color || category.color,
      icon: icon || category.icon,
      status: status || category.status,
      sort_order: sort_order !== undefined ? sort_order : category.sort_order
    });

    // Get updated product count
    const productCount = await Product.count({
      where: { category: category.name }
    });

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: {
        ...category.toJSON(),
        product_count: productCount
      }
    });
  } catch (error) {
    console.error('Update category error:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'Category name already exists'
      });
    }

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

    const category = await Category.findByPk(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category has products
    const productCount = await Product.count({
      where: { category: category.name }
    });

    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It has ${productCount} product(s) assigned to it.`,
        data: {
          product_count: productCount
        }
      });
    }

    await category.destroy();

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
