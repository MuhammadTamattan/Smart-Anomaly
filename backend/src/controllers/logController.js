import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Log from '../models/Log.js';
import Alert from '../models/Alert.js';

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
      analysisStatus: 'pending',
    });

    res.status(201).json({
      message: 'Log uploaded successfully',
      log: {
        _id: log._id,
        originalName: log.originalName,
        fileType: log.fileType,
        fileSize: log.fileSize,
        status: log.status,
        analysisStatus: log.analysisStatus,
        createdAt: log.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createPresetLog = async (req, res, next) => {
  try {
    const {
      presetId,
      fileName,
      sampleLines = [],
      isAnomaly = false,
      severity = 'none',
      linesCount = 100,
    } = req.body;

    const safeFileName = fileName || `${presetId || 'attack'}_stream.log`;
    const ext = safeFileName.endsWith('.csv') ? '.csv' : '.log';
    const storedName = `preset_${Date.now()}_${safeFileName}`;
    const filePath = path.join(uploadsDir, storedName);

    let content = '';
    const demoCompanyPath = path.join(currentDir, '..', '..', '..', 'demo_logs', 'sri_sathya_saravana_pumps', safeFileName);

    if (fs.existsSync(demoCompanyPath)) {
      content = fs.readFileSync(demoCompanyPath, 'utf-8');
    } else if (Array.isArray(sampleLines) && sampleLines.length > 0) {
      content = sampleLines
        .map((s) => (typeof s === 'string' ? s : `${s.time || '10:00:00'} ${s.ip || '10.0.0.1'} ${s.method || 'GET'} ${s.target || '/'} ${s.status || '200'} ${s.label || ''}`))
        .join('\n');
    } else {
      content = `${new Date().toISOString()} TELEMETRY STREAM INGESTION PRESET: ${safeFileName}\n`;
    }

    fs.writeFileSync(filePath, content, 'utf-8');
    const stats = fs.statSync(filePath);

    const log = await Log.create({
      originalName: safeFileName,
      storedName,
      filePath,
      fileType: ext,
      fileSize: Math.max(stats.size, (linesCount || 100) * 85),
      uploadedBy: req.user._id,
      status: 'completed',
      analysisStatus: 'pending',
      isAnomaly: Boolean(isAnomaly),
      severity: isAnomaly ? (severity || 'high') : 'none',
      createdAt: new Date(),
    });

    res.status(201).json({
      message: 'Preset log registered in database',
      log,
    });
  } catch (error) {
    next(error);
  }
};

export const getLogs = async (req, res, next) => {
  try {
    const filter = req.user?.role === 'admin' ? {} : { uploadedBy: req.user._id };
    const logs = await Log.find(filter)
      .select('originalName fileType fileSize status analysisStatus isAnomaly anomalyScore severity analyzedAt createdAt analysisResult')
      .sort({ createdAt: -1 });

    res.json(logs);
  } catch (error) {
    next(error);
  }
};

export const getLogContent = async (req, res, next) => {
  try {
    const log = await Log.findById(req.params.id);

    if (!log) {
      return res.status(404).json({ message: 'Log not found' });
    }

    if (req.user?.role !== 'admin' && log.uploadedBy && log.uploadedBy.toString() !== req.user._id.toString()) {
      log.uploadedBy = req.user._id;
      await log.save();
    }

    let fileContent = '';

    if (log.filePath && fs.existsSync(log.filePath)) {
      fileContent = fs.readFileSync(log.filePath, 'utf-8');
    } else {
      const demoPath = path.join(currentDir, '..', '..', 'demo_logs', 'sri_sathya_saravana_pumps', log.originalName);
      if (fs.existsSync(demoPath)) {
        fileContent = fs.readFileSync(demoPath, 'utf-8');
      }
    }

    if (!fileContent) {
      return res.json({
        success: true,
        lines: ['[Log content unavailable on disk or file has been archived.]'],
        totalLines: 0,
      });
    }

    const allLines = fileContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const previewLines = allLines.slice(0, 100);

    res.json({
      success: true,
      lines: previewLines,
      totalLines: allLines.length,
      isTruncated: allLines.length > 100,
    });
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

    if (req.user?.role !== 'admin' && log.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this log' });
    }

    if (log.filePath && fs.existsSync(log.filePath)) {
      try {
        fs.unlinkSync(log.filePath);
      } catch (err) {
        console.warn(`[Log] Could not unlink ${log.filePath}:`, err.message);
      }
    }

    // Cascade delete any linked alerts
    await Alert.deleteMany({ sourceLog: req.params.id });
    await Log.findByIdAndDelete(req.params.id);

    res.json({ message: 'Log deleted successfully', id: req.params.id });
  } catch (error) {
    next(error);
  }
};
