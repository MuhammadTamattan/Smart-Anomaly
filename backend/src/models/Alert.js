import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true,
    },
    type: {
      type: String,
      enum: ['anomaly_detected', 'brute_force', 'sql_injection', 'port_scan', 'high_error_rate', 'suspicious_activity'],
      required: true,
    },
    status: {
      type: String,
      enum: ['new', 'investigating', 'resolved'],
      default: 'new',
    },
    sourceLog: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Log',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    anomalyScore: {
      type: Number,
      default: null,
    },
    indicators: [{
      type: String,
    }],
    detectedAt: {
      type: Date,
      default: Date.now,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

alertSchema.index({ user: 1, detectedAt: -1 });
alertSchema.index({ user: 1, severity: 1 });
alertSchema.index({ user: 1, status: 1 });

export default mongoose.model('Alert', alertSchema);
