import WebsiteScan from '../models/WebsiteScan.js';
import { scanWebsiteUrl } from '../services/scannerService.js';

/**
 * Scan a website URL and persist the result
 * POST /api/website-scanner/scan
 */
export const scanWebsite = async (req, res, next) => {
  try {
    const { url } = req.body;
    const userId = req.user._id;

    if (!url || typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid website URL to scan.',
      });
    }

    // Execute defensive security checks via scanning service
    const scanData = await scanWebsiteUrl(url.trim());

    // Save scan to MongoDB
    const websiteScan = await WebsiteScan.create({
      ...scanData,
      scannedBy: userId,
    });

    res.status(201).json({
      success: true,
      message: 'Website security scan completed successfully.',
      scan: websiteScan,
    });
  } catch (error) {
    // If it's an SSRF or invalid URL error, return client-friendly 400
    if (
      error.message.includes('cannot be scanned for security reasons') ||
      error.message.includes('Invalid URL') ||
      error.message.includes('Only HTTP and HTTPS')
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes('Unable to reach') || error.message.includes('timed out')) {
      return res.status(502).json({
        success: false,
        message: error.message,
      });
    }

    next(error);
  }
};

/**
 * Get user's website scan history
 * GET /api/website-scanner/history
 */
export const getScanHistory = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const isAdmin = req.user?.role === 'admin';
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));

    const filter = isAdmin ? {} : { scannedBy: userId };

    const [scans, totalCount] = await Promise.all([
      WebsiteScan.find(filter)
        .select('url hostname ipAddress httpStatus https ssl headersScore riskScore riskLevel createdAt')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
      WebsiteScan.countDocuments(filter),
    ]);

    res.json({
      success: true,
      count: scans.length,
      total: totalCount,
      scans,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific scan report by ID
 * GET /api/website-scanner/:id
 */
export const getScanById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const isAdmin = req.user?.role === 'admin';

    const scan = await WebsiteScan.findById(id).lean();

    if (!scan) {
      return res.status(404).json({
        success: false,
        message: 'Website scan report not found.',
      });
    }

    // Authorization check
    if (!isAdmin && scan.scannedBy.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this scan report.',
      });
    }

    res.json({
      success: true,
      scan,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a scan report from history
 * DELETE /api/website-scanner/:id
 */
export const deleteScan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const isAdmin = req.user?.role === 'admin';

    const scan = await WebsiteScan.findById(id);

    if (!scan) {
      return res.status(404).json({
        success: false,
        message: 'Website scan not found.',
      });
    }

    if (!isAdmin && scan.scannedBy.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this scan report.',
      });
    }

    await WebsiteScan.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Website scan deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
