const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Ensure upload directories exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Configure storage for audio files
const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const category = req.body.category || 'uploads';
    const uploadPath = path.join(__dirname, '../../assets/audio', category);
    ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Configure storage for image files
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const category = req.body.category || 'uploads';
    const ageGroup = req.body.ageGroup || 'uploads';
    const type = req.body.type || 'uploads';
    const uploadPath = path.join(__dirname, '../../assets/images', category, ageGroup, type);
    ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filters
const audioFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    cb(new Error('Only audio files are allowed'), false);
  }
};

const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const uploadAudio = multer({
  storage: audioStorage,
  fileFilter: audioFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

const uploadImage = multer({
  storage: imageStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Audio upload route
router.post('/audio', authMiddleware, uploadAudio.single('audio'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file uploaded' });
  }

  const filePath = `/assets/audio/${req.body.category}/${req.file.filename}`;
  res.json({
    success: true,
    filePath,
    fileName: req.file.filename,
    originalName: req.file.originalname
  });
});

// Image upload route
router.post('/image', authMiddleware, uploadImage.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded' });
  }

  const filePath = `/assets/images/${req.body.category}/${req.body.ageGroup}/${req.body.type}/${req.file.filename}`;
  res.json({
    success: true,
    filePath,
    fileName: req.file.filename,
    originalName: req.file.originalname
  });
});

module.exports = router;

