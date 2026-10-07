import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    username: {
      type: String,
      trim: true,
      default: 'alexvance',
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    roleTitle: {
      type: String,
      default: 'Student / Project Analyst',
    },
    department: {
      type: String,
      default: 'Computer Science & Engineering',
    },
    phone: {
      type: String,
      default: '+1 (555) 123-4567',
    },
    analystId: {
      type: String,
      default: '#stu-2026',
    },
    clearance: {
      type: String,
      default: 'Standard Access',
    },
    timezone: {
      type: String,
      default: 'UTC +05:30 (Indian Standard Time)',
    },
    avatar: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: 'Cyber Threat Intelligence & Anomaly Detection Specialist.',
    },
    notifications: {
      notifyP1: { type: Boolean, default: true },
      notifyDrift: { type: Boolean, default: true },
      notifyWeekly: { type: Boolean, default: false },
      autoQuarantine: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);