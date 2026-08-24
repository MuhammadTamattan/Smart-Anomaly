import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Log from '../models/Log.js';

const currentFilename = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFilename);

const uploadsDir = path.join(currentDir, '..', '..', 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const ALLOWED_EXTENSIONS = ['.log', '.txt', '.csv'];
const ALLOWED_MIMES = ['text/plain', 'text/csv', 'application/csv', 'application/octet-stream', 'text/x-log'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new Error(`Unsupported file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`));
  }

  if (file.size === 0) {
    return cb(new Error('Empty files are not allowed'));
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

export const uploadLog = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();

    const log = await Log.create({
      originalName: req.file.originalname,
      storedName: req.file.filename,
      filePath: req.file.path,
      fileType: ext,
      fileSize: req.file.size,
      uploadedBy: req.user._id,
      status: 'uploaded',
    });

    res.status(201).json({
      message: 'Log uploaded successfully',
      log: {
        _id: log._id,
        originalName: log.originalName,
        fileType: log.fileType,
        fileSize: log.fileSize,
        status: log.status,
        createdAt: log.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getLogs = async (req, res, next) => {
  try {
    const logs = await Log.find({ uploadedBy: req.user._id })
      .select('originalName fileType fileSize status analysisStatus isAnomaly anomalyScore severity analyzedAt createdAt')
      .sort({ createdAt: -1 });

    res.json(logs);
  } catch (error) {
    next(error);
  }
};

export const deleteLog = async (req, res, next) => {
  try {
    const log = await Log.findById(req.params.id);

    if (!log) {
      return res.status(404).json({ message: 'Log not found' });
    }

    if (log.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this log' });
    }

    if (log.filePath && fs.existsSync(log.filePath)) {
      fs.unlinkSync(log.filePath);
    }

    await Log.findByIdAndDelete(req.params.id);

    res.json({ message: 'Log deleted successfully' });
  } catch (error) {
    next(error);
  }
};
