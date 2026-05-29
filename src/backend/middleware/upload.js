const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directories if they don't exist (skip on Vercel/serverless)
const uploadDirs = [
  './uploads/products',
  './uploads/logos',
  './uploads/temp'
];

// Skip directory creation on Vercel (read-only filesystem)
if (process.env.VERCEL !== '1') {
  uploadDirs.forEach(dir => {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch (err) {
      console.log('⚠️  Could not create upload directory:', dir);
    }
  });
}

// Configure storage for products
const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/products');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Configure storage for logos
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/logos');
  },
  filename: (req, file, cb) => {
    cb(null, 'company-logo' + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// Create multer upload instances
const upload = multer({
  storage: productStorage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB default
  },
  fileFilter: fileFilter
});

const uploadLogo = multer({
  storage: logoStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: fileFilter
});

module.exports = { upload, uploadLogo };
