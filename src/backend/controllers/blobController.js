const sequelize = require('../config/database');
const Blob = require('../models/Blob')(sequelize);
const sharp = require('sharp');
const { Op } = require('sequelize');

/**
 * BLOB Storage Controller
 * Professional-grade image storage with optimization, quota enforcement, and caching
 */

// Upload Image with optimization
exports.uploadBlob = async (req, res) => {
  try {
    const { type } = req.body;
    const file = req.file;

    // Validation
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!type) {
      return res.status(400).json({ error: 'Blob type is required' });
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ 
        error: 'Invalid file type',
        allowed: ['PNG', 'JPEG', 'WebP'],
        received: file.mimetype
      });
    }

    // Validate file size (max 5MB)
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxFileSize) {
      return res.status(400).json({ 
        error: 'File too large',
        max_size: '5MB',
        received: `${(file.size / 1024 / 1024).toFixed(2)}MB`
      });
    }

    // Check storage quota
    const usage = await getStorageUsage();
    const fileSizeMB = file.size / 1024 / 1024;
    
    // Default limit: 100MB (can be overridden by subscription)
    const storageLimitMB = process.env.MAX_STORAGE_MB || 100;
    
    if (parseFloat(usage.used_mb) + fileSizeMB > storageLimitMB) {
      return res.status(403).json({
        error: 'Storage quota exceeded',
        used: `${usage.used_mb} MB`,
        limit: `${storageLimitMB} MB`,
        remaining: `${usage.remaining_mb} MB`,
        required: `${fileSizeMB.toFixed(2)} MB`,
        message: 'Please upgrade your plan or delete unused images'
      });
    }

    // Optimize image with sharp
    let optimizedImage = sharp(file.buffer);
    
    // Type-specific optimizations
    const optimizations = {
      logo: { width: 300, height: 100, fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } },
      receipt_header: { width: 600, height: 200, fit: 'inside' },
      receipt_footer: { width: 600, height: 200, fit: 'inside' },
      product_image: { width: 800, height: 800, fit: 'inside' },
      employee_photo: { width: 400, height: 400, fit: 'cover' },
      customer_avatar: { width: 200, height: 200, fit: 'cover' },
      signature: { width: 400, height: 150, fit: 'inside' },
      document: { width: 1200, height: 1600, fit: 'inside' }
    };

    const config = optimizations[type];
    if (config) {
      optimizedImage = optimizedImage.resize(config);
    }

    // Convert to WebP for better compression (80% quality)
    const optimizedBuffer = await optimizedImage.webp({ quality: 80 }).toBuffer();

    // Get image dimensions
    const metadata = await sharp(optimizedBuffer).metadata();

    // Save to database
    const blob = await Blob.create({
      blob_type: type,
      blob_name: file.originalname,
      blob_data: optimizedBuffer,
      blob_size: optimizedBuffer.length,
      mime_type: 'image/webp',
      width: metadata.width,
      height: metadata.height,
      uploaded_by: req.user?.id || null
    });

    // Calculate compression ratio
    const compressionRatio = ((1 - optimizedBuffer.length / file.size) * 100).toFixed(1);

    res.status(201).json({
      success: true,
      blob_id: blob.id,
      url: `/api/blobs/${blob.id}`,
      base64_url: `/api/blobs/${blob.id}/base64`,
      original_size: `${(file.size / 1024).toFixed(2)} KB`,
      optimized_size: `${(blob.blob_size / 1024).toFixed(2)} KB`,
      compression: `${compressionRatio}%`,
      dimensions: `${blob.width}x${blob.height}`,
      storage_usage: {
        used: usage.used_mb,
        limit: storageLimitMB,
        remaining: (storageLimitMB - parseFloat(usage.used_mb)).toFixed(2)
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload image',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get Image as binary (with caching)
exports.getBlob = async (req, res) => {
  try {
    const blob = await Blob.findByPk(req.params.id);

    if (!blob) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Set caching headers (1 year for immutable images)
    res.set('Content-Type', blob.mime_type);
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.set('ETag', `"${blob.id}-${blob.updated_at.getTime()}"`);
    
    // Send binary data
    res.send(blob.blob_data);

  } catch (error) {
    console.error('Get blob error:', error);
    res.status(500).json({ error: 'Failed to retrieve image' });
  }
};

// Get Image as Base64 (for frontend components)
exports.getBlobBase64 = async (req, res) => {
  try {
    const blob = await Blob.findByPk(req.params.id);

    if (!blob) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Convert to base64
    const base64 = blob.blob_data.toString('base64');
    const dataUrl = `data:${blob.mime_type};base64,${base64}`;

    res.json({
      blob_id: blob.id,
      data: dataUrl,
      mime_type: blob.mime_type,
      width: blob.width,
      height: blob.height,
      size: blob.blob_size
    });

  } catch (error) {
    console.error('Get blob base64 error:', error);
    res.status(500).json({ error: 'Failed to retrieve image' });
  }
};

// Delete Image
exports.deleteBlob = async (req, res) => {
  try {
    const blob = await Blob.findByPk(req.params.id);

    if (!blob) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Check if blob is being used in settings
    const settings = await sequelize.query(`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE column_name LIKE '%blob_id%'
    `);

    // Simple check - if you have settings tables, verify usage here
    // For now, allow deletion (can add foreign key checks later)

    await blob.destroy();

    res.json({ 
      success: true, 
      message: 'Image deleted successfully',
      freed_space: `${(blob.blob_size / 1024).toFixed(2)} KB`
    });

  } catch (error) {
    console.error('Delete blob error:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
};

// Get Storage Usage
exports.getStorageUsage = async (req, res) => {
  try {
    const usage = await getStorageUsage();
    res.json(usage);
  } catch (error) {
    console.error('Get usage error:', error);
    res.status(500).json({ error: 'Failed to get storage usage' });
  }
};

// Helper: Calculate storage usage
async function getStorageUsage() {
  const result = await Blob.findOne({
    attributes: [
      [sequelize.fn('SUM', sequelize.col('blob_size')), 'total_size'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'total_files']
    ],
    raw: true
  });

  const totalBytes = parseInt(result.total_size) || 0;
  const totalFiles = parseInt(result.total_files) || 0;
  const usedMB = totalBytes / (1024 * 1024);
  
  // Get limit from environment or default
  const limitMB = parseFloat(process.env.MAX_STORAGE_MB) || 100;

  return {
    used_mb: usedMB.toFixed(2),
    limit_mb: limitMB,
    remaining_mb: Math.max(0, limitMB - usedMB).toFixed(2),
    percentage: ((usedMB / limitMB) * 100).toFixed(2),
    total_files: totalFiles,
    total_bytes: totalBytes
  };
}

// List blobs by type (for admin management)
exports.listBlobs = async (req, res) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const where = type ? { blob_type: type } : {};

    const blobs = await Blob.findAndCountAll({
      where,
      attributes: ['id', 'blob_type', 'blob_name', 'blob_size', 'mime_type', 'width', 'height', 'uploaded_at'],
      order: [['uploaded_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      total: blobs.count,
      page: parseInt(page),
      limit: parseInt(limit),
      blobs: blobs.rows.map(b => ({
        ...b.toJSON(),
        size_kb: (b.blob_size / 1024).toFixed(2)
      }))
    });

  } catch (error) {
    console.error('List blobs error:', error);
    res.status(500).json({ error: 'Failed to list blobs' });
  }
};
