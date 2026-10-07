import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    authorName: {
      type: String,
      default: 'Admin',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const incidentSchema = new mongoose.Schema(
  {
    incidentId: {
      type: String,
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    type: {
      type: String,
      default: 'anomaly_detected',
      trim: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      required: true,
    },
    status: {
      type: String,
      enum: ['open', 'investigating', 'resolved'],
      default: 'open',
      required: true,
    },
    relatedAlert: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Alert',
      default: null,
    },
    source: {
      type: String,
      default: 'System Telemetry',
      trim: true,
    },
    anomalyScore: {
      type: Number,
      default: null,
    },
    indicators: [
      {
        type: String,
      },
    ],
    notes: [noteSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

incidentSchema.index({ status: 1 });
incidentSchema.index({ severity: 1 });
incidentSchema.index({ createdAt: -1 });

// Generate sequential INC-XXXX ID if not provided
incidentSchema.pre('validate', async function () {
  if (!this.incidentId) {
    try {
      const count = await mongoose.model('Incident').countDocuments();
      this.incidentId = `INC-${1000 + count + 1}`;
    } catch {
      this.incidentId = `INC-${Date.now().toString().slice(-4)}`;
    }
  }
});

export default mongoose.model('Incident', incidentSchema);
