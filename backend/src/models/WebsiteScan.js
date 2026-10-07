import mongoose from 'mongoose';

const findingSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ['https', 'ssl', 'headers', 'redirects', 'network', 'general'],
      required: true,
    },
    level: {
      type: String,
      enum: ['pass', 'warning', 'danger'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const websiteScanSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
    hostname: {
      type: String,
      required: true,
      trim: true,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    scannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    scanDate: {
      type: Date,
      default: Date.now,
    },
    httpStatus: {
      type: Number,
      default: null,
    },
    statusText: {
      type: String,
      default: null,
    },
    responseTimeMs: {
      type: Number,
      default: null,
    },
    https: {
      enabled: { type: Boolean, default: false },
      protocol: { type: String, default: null },
    },
    ssl: {
      valid: { type: Boolean, default: false },
      issuer: { type: String, default: null },
      subject: { type: String, default: null },
      validFrom: { type: Date, default: null },
      validTo: { type: Date, default: null },
      daysRemaining: { type: Number, default: null },
      error: { type: String, default: null },
    },
    redirectCount: {
      type: Number,
      default: 0,
    },
    redirectChain: [{
      type: String,
    }],
    securityHeaders: {
      contentSecurityPolicy: {
        present: { type: Boolean, default: false },
        value: { type: String, default: null },
      },
      strictTransportSecurity: {
        present: { type: Boolean, default: false },
        value: { type: String, default: null },
      },
      xFrameOptions: {
        present: { type: Boolean, default: false },
        value: { type: String, default: null },
      },
      xContentTypeOptions: {
        present: { type: Boolean, default: false },
        value: { type: String, default: null },
      },
      referrerPolicy: {
        present: { type: Boolean, default: false },
        value: { type: String, default: null },
      },
      permissionsPolicy: {
        present: { type: Boolean, default: false },
        value: { type: String, default: null },
      },
    },
    headersScore: {
      configured: { type: Number, default: 0 },
      total: { type: Number, default: 6 },
    },
    findings: [findingSchema],
    riskScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true,
    },
    serverBanner: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast querying
websiteScanSchema.index({ scannedBy: 1, createdAt: -1 });
websiteScanSchema.index({ hostname: 1 });
websiteScanSchema.index({ riskLevel: 1 });

const WebsiteScan = mongoose.model('WebsiteScan', websiteScanSchema);

export default WebsiteScan;
