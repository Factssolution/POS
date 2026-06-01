const express = require('express');
const router = express.Router();
const multer = require('multer');
const blobController = require('../controllers/blobController');
const { authenticate } = require('../middleware/auth');

// Multer config (memory storage for processing)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// All routes require authentication
router.use(authenticate);

// Upload image
router.post('/upload', upload.single('file'), blobController.uploadBlob);

// Get storage usage (MUST come before /:id)
router.get('/usage', blobController.getStorageUsage);

// List blobs (admin) (MUST come before /:id)
router.get('/', blobController.listBlobs);

// Get image (binary)
router.get('/:id', blobController.getBlob);

// Get image (base64)
router.get('/:id/base64', blobController.getBlobBase64);

// Delete image
router.delete('/:id', blobController.deleteBlob);

module.exports = router;
