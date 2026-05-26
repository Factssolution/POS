const { Product } = require('../models');
const { Op } = require('sequelize');

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const { status, category, search, page = 1, limit = 50 } = req.query;
    
    const where = {};
    
    if (status) {
      where.status = status;
    }
    
    if (category) {
      where.category = category;
    }
    
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { barcode: { [Op.like]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Product.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        products: rows.map(p => {
          const productJson = p.toJSON();
          // Ensure image_url is a full URL if it exists
          if (productJson.image_url && !productJson.image_url.startsWith('http')) {
            productJson.image_url = `http://localhost:${process.env.PORT || 5000}${productJson.image_url}`;
          }
          return {
            ...productJson,
            price: parseFloat(p.price),
            cost_price: parseFloat(p.cost_price)
          };
        }),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
};

// Get all unique categories - Now fetches from Category table for proper category management
exports.getCategories = async (req, res) => {
  try {
    const { Category } = require('../models');
    
    // Fetch active categories from the Category table (proper category management)
    const categories = await Category.findAll({
      where: { status: 'active' },
      order: [['sort_order', 'ASC'], ['name', 'ASC']],
      attributes: ['id', 'name', 'description', 'color', 'icon']
    });

    const categoryList = categories.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      color: c.color,
      icon: c.icon
    }));

    res.json({
      success: true,
      data: {
        categories: categoryList,
        count: categoryList.length
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

// Get product by ID
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const productJson = product.toJSON();
    // Ensure image_url is a full URL if it exists
    if (productJson.image_url && !productJson.image_url.startsWith('http')) {
      productJson.image_url = `http://localhost:${process.env.PORT || 5000}${productJson.image_url}`;
    }

    res.json({
      success: true,
      data: {
        ...productJson,
        price: parseFloat(product.price),
        cost_price: parseFloat(product.cost_price)
      }
    });
  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message
    });
  }
};

// Create product
exports.createProduct = async (req, res) => {
  try {
    const productData = {
      ...req.body,
      image_url: req.file ? `http://localhost:${process.env.PORT || 5000}/uploads/products/${req.file.filename}` : (req.body.image_url || null)
    };

    // Check if barcode already exists
    const existingProduct = await Product.findOne({
      where: { barcode: productData.barcode }
    });

    if (existingProduct) {
      return res.status(409).json({
        success: false,
        message: 'Product with this barcode already exists'
      });
    }

    const product = await Product.create(productData);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: {
        ...product.toJSON(),
        price: parseFloat(product.price),
        cost_price: parseFloat(product.cost_price)
      }
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message
    });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const updateData = { ...req.body };
    
    // If new image file is uploaded, update image_url with full URL
    if (req.file) {
      updateData.image_url = `http://localhost:${process.env.PORT || 5000}/uploads/products/${req.file.filename}`;
    }

    // Check if barcode is being changed and if it already exists
    if (updateData.barcode && updateData.barcode !== product.barcode) {
      const existingProduct = await Product.findOne({
        where: { barcode: updateData.barcode }
      });

      if (existingProduct) {
        return res.status(409).json({
          success: false,
          message: 'Product with this barcode already exists'
        });
      }
    }

    await product.update(updateData);

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: {
        ...product.toJSON(),
        price: parseFloat(product.price),
        cost_price: parseFloat(product.cost_price)
      }
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message
    });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if product has been used in orders
    const { OrderItem } = require('../models');
    const orderItemsCount = await OrderItem.count({
      where: { product_id: id }
    });

    if (orderItemsCount > 0) {
      // Soft delete: Mark as inactive instead of hard delete
      // This preserves order history and data integrity
      await product.update({ status: 'inactive' });
      
      return res.json({
        success: true,
        message: 'Product marked as inactive (has order history)',
        data: {
          ...product.toJSON(),
          price: parseFloat(product.price),
          cost_price: parseFloat(product.cost_price)
        }
      });
    }

    // Hard delete only if no order history
    await product.destroy();

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message
    });
  }
};

// Get low stock products
exports.getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: {
        stock: {
          [Op.lte]: sequelize.col('min_stock')
        },
        status: 'active'
      },
      order: [['stock', 'ASC']]
    });

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch low stock products',
      error: error.message
    });
  }
};
