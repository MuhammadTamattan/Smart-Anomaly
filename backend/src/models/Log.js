import mongoose from 'mongoose';

const logSchema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    storedName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
      enum: ['.log', '.txt', '.csv'],
    },
    fileSize: {
      type: Number,
      required: true,
      min: 1,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['uploaded', 'processing', 'completed', 'failed'],
      default: 'uploaded',
    },
    analysisStatus: {
      type: String,
      enum: ['pending', 'processing', 'analyzed', 'failed'],
      default: 'pending',
    },
    isAnomaly: {
      type: Boolean,
      default: null,
    },
    anomalyScore: {
      type: Number,
      default: null,
    },
    severity: {
      type: String,
      enum: ['none', 'low', 'medium', 'high', 'critical', null],
      default: null,
    },
    analyzedAt: {
      type: Date,
      default: null,
    },
    analysisResult: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

logSchema.index({ uploadedBy: 1, createdAt: -1 });

export default mongoose.model('Log', logSchema);
