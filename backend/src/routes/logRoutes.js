import express from 'express';
import multer from 'multer';
import { uploadLog, createPresetLog, getLogs, getLogContent, deleteLog, upload } from '../controllers/logController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const handleUpload = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File too large. Maximum size is 50MB' });
        }
        return res.status(400).json({ message: err.message });
      }
      return res.status(400).json({ message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    next();
  });
};

router.post('/upload', protect, handleUpload, uploadLog);
router.post('/preset', protect, createPresetLog);
router.get('/', protect, getLogs);
router.get('/:id/content', protect, getLogContent);
router.delete('/:id', protect, deleteLog);

export default router;
