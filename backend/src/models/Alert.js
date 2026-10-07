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
      enum: [
        'anomaly_detected',
        'brute_force',
        'sql_injection',
        'port_scan',
        'high_error_rate',
        'suspicious_activity',
        'ddos',
        'dns_tunneling',
        'credential_stuffing',
        'injection',
        'zero_day',
        'ransomware',
      ],
      default: 'anomaly_detected',
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
      required: false,
      default: null,
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
