import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import { config } from '../config.js';
import { requireAuth } from '../middleware/auth.js';

fs.mkdirSync(config.uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    const userDir = path.join(config.uploadDir, req.user.id);
    fs.mkdirSync(userDir, { recursive: true });
    callback(null, userDir);
  },
  filename: (req, file, callback) => {
    const ext = path.extname(file.originalname).toLowerCase();
    callback(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, callback) => {
    if (!file.mimetype.startsWith('image/')) {
      return callback(new Error('Only image uploads are allowed'));
    }

    callback(null, true);
  },
});

const router = Router();

router.post('/photo', requireAuth, upload.single('photo'), (req, res) => {
  const relativePath = path.relative(config.uploadDir, req.file.path).split(path.sep).join('/');
  res.status(201).json({
    photo_url: `${config.publicBaseUrl}/uploads/${relativePath}`,
  });
});

export default router;
