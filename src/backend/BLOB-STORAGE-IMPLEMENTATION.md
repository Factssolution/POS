# 🖼️ Database BLOB Storage System - Complete Implementation Guide

## 📋 **Overview:**

Yeh system ensure karega ke **saari images database mein store hon**:
- ✅ Company Logo
- ✅ Receipt Header/Footer Images
- ✅ Product Images
- ✅ Employee Photos
- ✅ Customer Avatars
- ✅ Documents & Signatures

**Benefit:** Subscription renew hone par bhi sab images safe rahengi!

---

## 🗄️ **1. Database Schema:**

### **Tenant Database mein add karein:**

```sql
-- BLOB Storage Table (All Images)
CREATE TABLE blobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blob_type VARCHAR(50) NOT NULL,
    -- Types: 'logo', 'receipt_header', 'receipt_footer', 'product_image',
    --        'employee_photo', 'customer_avatar', 'document', 'signature'
    
    blob_name VARCHAR(255) NOT NULL,
    blob_data BYTEA NOT NULL,           -- Binary image data
    blob_size INTEGER NOT NULL,          -- File size in bytes
    mime_type VARCHAR(100),              -- 'image/png', 'image/jpeg', 'image/webp'
    width INTEGER,                       -- Image width
    height INTEGER,                      -- Image height
    
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_blobs_type ON blobs(blob_type);
CREATE INDEX idx_blobs_uploaded_by ON blobs(uploaded_by);

-- Update company_settings table to reference blobs
ALTER TABLE company_settings 
ADD COLUMN logo_blob_id UUID REFERENCES blobs(id),
ADD COLUMN receipt_header_blob_id UUID REFERENCES blobs(id),
ADD COLUMN receipt_footer_blob_id UUID REFERENCES blobs(id),
ADD COLUMN signature_blob_id UUID REFERENCES blobs(id);
```

---

## 🔧 **2. Backend Implementation:**

### **Create Blob Model (`src/backend/models/Blob.js`):**

```javascript
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Blob = sequelize.define('Blob', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    blob_type: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    blob_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    blob_data: {
      type: DataTypes.BLOB('long'),  // BYTEA in PostgreSQL
      allowNull: false
    },
    blob_size: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    mime_type: {
      type: DataTypes.STRING(100)
    },
    width: {
      type: DataTypes.INTEGER
    },
    height: {
      type: DataTypes.INTEGER
    },
    uploaded_by: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'blobs',
    timestamps: true,
    createdAt: 'uploaded_at',
    updatedAt: 'updated_at'
  });

  return Blob;
};
```

### **Create Blob Controller (`src/backend/controllers/blobController.js`):**

```javascript
const { Blob, CompanySetting } = require('../config/database');
const sharp = require('sharp');

// Upload Image
exports.uploadBlob = async (req, res) => {
  try {
    const { type } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ 
        error: 'Only PNG, JPEG, and WebP images are allowed' 
      });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ 
        error: 'File size must be less than 5MB' 
      });
    }

    // Check storage quota
    const usage = await getStorageUsage(req.tenant.id);
    if (usage.used_mb + (file.size / 1024 / 1024) > usage.limit_mb) {
      return res.status(403).json({
        error: 'Storage quota exceeded',
        used: usage.used_mb.toFixed(2) + ' MB',
        limit: usage.limit_mb + ' MB',
        message: 'Please upgrade your plan or delete unused images'
      });
    }

    // Optimize image
    let optimizedImage = sharp(file.buffer);
    
    // Resize based on type
    if (type === 'logo') {
      optimizedImage = optimizedImage.resize(300, 100, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      });
    } else if (type === 'product_image') {
      optimizedImage = optimizedImage.resize(800, 800, { fit: 'inside' });
    }

    // Convert to WebP for better compression
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
      uploaded_by: req.user.id
    });

    res.status(201).json({
      success: true,
      blob_id: blob.id,
      url: `/api/blobs/${blob.id}`,
      size: (blob.blob_size / 1024).toFixed(2) + ' KB'
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
};

// Get Image (as binary)
exports.getBlob = async (req, res) => {
  try {
    const blob = await Blob.findByPk(req.params.id);

    if (!blob) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Set content type and send binary data
    res.set('Content-Type', blob.mime_type);
    res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.send(blob.blob_data);

  } catch (error) {
    console.error('Get blob error:', error);
    res.status(500).json({ error: 'Failed to retrieve image' });
  }
};

// Get Image (as Base64)
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
      height: blob.height
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
    const settings = await CompanySetting.findAll({
      where: {
        [Op.or]: [
          { logo_blob_id: blob.id },
          { receipt_header_blob_id: blob.id },
          { receipt_footer_blob_id: blob.id },
          { signature_blob_id: blob.id }
        ]
      }
    });

    if (settings.length > 0) {
      return res.status(400).json({
        error: 'Cannot delete image that is currently in use',
        message: 'Please update settings first to remove this image'
      });
    }

    await blob.destroy();

    res.json({ success: true, message: 'Image deleted successfully' });

  } catch (error) {
    console.error('Delete blob error:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
};

// Get Storage Usage
exports.getStorageUsage = async (req, res) => {
  try {
    const usage = await getStorageUsage(req.tenant.id);
    res.json(usage);
  } catch (error) {
    console.error('Get usage error:', error);
    res.status(500).json({ error: 'Failed to get storage usage' });
  }
};

// Helper: Calculate storage usage
async function getStorageUsage(tenantId) {
  const result = await Blob.findOne({
    attributes: [
      [sequelize.fn('SUM', sequelize.col('blob_size')), 'total_size']
    ],
    raw: true
  });

  const totalBytes = parseInt(result.total_size) || 0;
  const usedMB = totalBytes / (1024 * 1024);
  
  // Get limit from subscription
  const subscription = await getSubscription(tenantId);
  const limitMB = subscription?.max_storage_mb || 100; // Default 100MB

  return {
    used_mb: usedMB.toFixed(2),
    limit_mb: limitMB,
    remaining_mb: (limitMB - usedMB).toFixed(2),
    percentage: ((usedMB / limitMB) * 100).toFixed(2)
  };
}
```

### **Create Blob Routes (`src/backend/routes/blobs.js`):**

```javascript
const express = require('express');
const router = express.Router();
const multer = require('multer');
const blobController = require('../controllers/blobController');
const { authenticateToken } = require('../middleware/auth');
const { requireTenant } = require('../middleware/tenant');

// Multer config (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// All routes require authentication and tenant context
router.use(authenticateToken);
router.use(requireTenant);

// Routes
router.post('/upload', upload.single('file'), blobController.uploadBlob);
router.get('/:id', blobController.getBlob);
router.get('/:id/base64', blobController.getBlobBase64);
router.delete('/:id', blobController.deleteBlob);
router.get('/usage', blobController.getStorageUsage);

module.exports = router;
```

### **Register Routes in server.js:**

```javascript
const blobRoutes = require('./routes/blobs');
app.use('/api/blobs', blobRoutes);
```

---

## 💻 **3. Frontend Integration:**

### **Update API Service (`src/services/api.ts`):**

```typescript
// BLOB Storage APIs
export const api = {
  // ... existing methods
  
  // Upload image
  uploadBlob: async (formData: FormData): Promise<any> => {
    return apiCall('/blobs/upload', {
      method: 'POST',
      body: formData,
      headers: {} // Don't set Content-Type for FormData
    });
  },

  // Get image URL
  getBlobUrl: (blobId: string): string => {
    return `${API_BASE_URL}/blobs/${blobId}`;
  },

  // Get image as base64
  getBlobAsBase64: async (blobId: string): Promise<string> => {
    const response = await apiCall(`/blobs/${blobId}/base64`);
    return response.data;
  },

  // Delete image
  deleteBlob: async (blobId: string): Promise<void> => {
    return apiCall(`/blobs/${blobId}`, {
      method: 'DELETE'
    });
  },

  // Get storage usage
  getBlobUsage: async (): Promise<any> => {
    return apiCall('/blobs/usage');
  }
};
```

### **Update Settings Page (Logo Upload):**

```typescript
// SettingsPage.tsx
const [logoBlobId, setLogoBlobId] = useState<string>('');
const [logoPreview, setLogoPreview] = useState<string>('');
const [uploading, setUploading] = useState(false);

// Load logo from database
useEffect(() => {
  if (settings.logo_blob_id) {
    api.getBlobAsBase64(settings.logo_blob_id)
      .then(base64 => setLogoPreview(base64))
      .catch(err => console.error('Failed to load logo:', err));
  }
}, [settings.logo_blob_id]);

// Handle logo upload
const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  setUploading(true);
  try {
    // Check storage quota
    const usage = await api.getBlobUsage();
    const fileSizeMB = file.size / 1024 / 1024;
    
    if (parseFloat(usage.remaining_mb) < fileSizeMB) {
      alert(`Storage limit exceeded!\nUsed: ${usage.used_mb} MB\nLimit: ${usage.limit_mb} MB`);
      return;
    }

    // Upload to database
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'logo');
    formData.append('name', file.name);

    const response = await api.uploadBlob(formData);
    
    // Update settings with new blob_id
    await api.updateSettings({
      logo_blob_id: response.blob_id
    });

    setLogoBlobId(response.blob_id);
    setLogoPreview(response.url);
    
    alert('Logo uploaded successfully!');
  } catch (error: any) {
    alert('Failed to upload logo: ' + error.message);
  } finally {
    setUploading(false);
  }
};

// Display in UI
<div className="space-y-4">
  <label className="block text-sm font-medium text-gray-700">Company Logo</label>
  
  {logoPreview && (
    <img 
      src={logoPreview} 
      alt="Company Logo" 
      className="h-20 object-contain border rounded p-2"
    />
  )}
  
  <input
    type="file"
    accept="image/png,image/jpeg,image/webp"
    onChange={handleLogoUpload}
    disabled={uploading}
    className="block w-full text-sm text-gray-500
      file:mr-4 file:py-2 file:px-4
      file:rounded-full file:border-0
      file:text-sm file:font-semibold
      file:bg-blue-50 file:text-blue-700
      hover:file:bg-blue-100"
  />
  
  {uploading && <p className="text-sm text-blue-600">Uploading...</p>}
</div>
```

### **Create Reusable Image Component:**

```typescript
// components/DatabaseImage.tsx
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

interface DatabaseImageProps {
  blobId: string;
  alt?: string;
  className?: string;
  fallback?: string;
}

const DatabaseImage: React.FC<DatabaseImageProps> = ({ 
  blobId, 
  alt = 'Image', 
  className = '',
  fallback = '/placeholder.png'
}) => {
  const [imageSrc, setImageSrc] = useState<string>(fallback);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!blobId) {
      setImageSrc(fallback);
      setLoading(false);
      return;
    }

    // Always fetch from database
    api.getBlobAsBase64(blobId)
      .then(base64 => {
        setImageSrc(base64);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load image:', err);
        setImageSrc(fallback);
        setLoading(false);
      });
  }, [blobId, fallback]);

  if (loading) {
    return <div className={`animate-pulse bg-gray-200 ${className}`} />;
  }

  return <img src={imageSrc} alt={alt} className={className} />;
};

export default DatabaseImage;
```

### **Usage Example:**

```typescript
// Anywhere in your app
import DatabaseImage from './DatabaseImage';

// Company Logo
<DatabaseImage 
  blobId={settings.logo_blob_id}
  alt="Company Logo"
  className="h-16 object-contain"
/>

// Receipt Header
<DatabaseImage 
  blobId={settings.receipt_header_blob_id}
  alt="Receipt Header"
  className="w-full h-24 object-cover"
/>

// Product Image
<DatabaseImage 
  blobId={product.image_blob_id}
  alt={product.name}
  className="w-32 h-32 object-cover rounded"
/>
```

---

## 📊 **4. Storage Quota Enforcement:**

### **Update Subscription Plans:**

```sql
ALTER TABLE subscriptions
ADD COLUMN max_storage_mb INTEGER NOT NULL DEFAULT 100;

-- Update existing plans
UPDATE subscriptions SET max_storage_mb = 100 WHERE plan_type = 'Basic';
UPDATE subscriptions SET max_storage_mb = 500 WHERE plan_type = 'Standard';
UPDATE subscriptions SET max_storage_mb = 2048 WHERE plan_type = 'Premium';
```

### **Storage Quota Middleware:**

Already implemented in blobController.js (see `getStorageUsage` function)

---

## 🔄 **5. Subscription Renewal Flow:**

```javascript
// When subscription expires:
1. Images remain in database (NOT deleted)
2. User cannot upload NEW images
3. Existing images still accessible
4. Upon renewal:
   - Upload capability restored
   - All images immediately available
   - No data loss!
```

### **Auto-Renewal Benefits:**

✅ **Images persist forever in database**
✅ **No file system dependency**
✅ **Complete backup with pg_dump**
✅ **Instant restoration**
✅ **Zero downtime**

---

## 🚀 **6. Implementation Steps:**

### **Step 1: Database Migration**
```bash
cd src/backend
node -e "
const { sequelize } = require('./config/database');
sequelize.query(\`
  CREATE TABLE IF NOT EXISTS blobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blob_type VARCHAR(50) NOT NULL,
    blob_name VARCHAR(255) NOT NULL,
    blob_data BYTEA NOT NULL,
    blob_size INTEGER NOT NULL,
    mime_type VARCHAR(100),
    width INTEGER,
    height INTEGER,
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );
\`).then(() => console.log('✅ Blobs table created'));
"
```

### **Step 2: Install Dependencies**
```bash
cd src/backend
npm install sharp multer
npm install --save-dev @types/multer
```

### **Step 3: Create Files**
- `models/Blob.js` ✅
- `controllers/blobController.js` ✅
- `routes/blobs.js` ✅

### **Step 4: Update Existing Code**
- Add blob references to `company_settings`
- Update SettingsPage for logo upload
- Create DatabaseImage component
- Update API service

### **Step 5: Test**
```bash
cd src/backend
node test-blob-upload.js
```

---

## 🎯 **Benefits Summary:**

| Feature | File System | Database BLOB |
|---------|-------------|---------------|
| **Subscription Safety** | ❌ Files may be lost | ✅ Always safe |
| **Backup** | ❌ Separate backup needed | ✅ Included in DB backup |
| **Multi-Tenant** | ❌ Complex isolation | ✅ Built-in isolation |
| **Restoration** | ❌ Manual file restore | ✅ Automatic with DB |
| **Performance** | ✅ Fast CDN | ⚡ PostgreSQL TOAST |
| **Cost** | ✅ Cheap storage | 💰 Included in DB |
| **Security** | ⚠️ File permissions | ✅ Database ACL |

---

## ✅ **Next Steps:**

1. **Shall I implement this BLOB storage system?**
2. **Start with database migration?**
3. **Create backend controllers?**
4. **Update frontend components?**

Bataein, start karein implementation? 🚀
