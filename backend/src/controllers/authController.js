import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please fill all fields' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({ name, email, password });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please fill all fields' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      _id: user._id,
      name: user.name,
      username: user.username || user.email?.split('@')[0] || 'alexvance',
      email: user.email,
      role: user.role,
      roleTitle: user.roleTitle || 'Student / Project Analyst',
      department: user.department || 'Computer Science & Engineering',
      phone: user.phone || '+1 (555) 123-4567',
      analystId: user.analystId || '#stu-2026',
      clearance: user.clearance || 'Standard Access',
      timezone: user.timezone || 'UTC +05:30 (Indian Standard Time)',
      notifications: user.notifications || {
        notifyP1: true,
        notifyDrift: true,
        notifyWeekly: false,
        autoQuarantine: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const {
      name,
      username,
      email,
      roleTitle,
      department,
      phone,
      analystId,
      clearance,
      timezone,
      notifications,
    } = req.body;

    if (name !== undefined && name.trim()) user.name = name.trim();
    if (username !== undefined && username.trim()) user.username = username.trim();
    if (email !== undefined && email.trim() && email.trim() !== user.email) {
      const emailExists = await User.findOne({ email: email.trim(), _id: { $ne: user._id } });
      if (emailExists) {
        return res.status(400).json({ message: 'Email is already in use by another account' });
      }
      user.email = email.trim();
    }
    if (roleTitle !== undefined) user.roleTitle = roleTitle.trim();
    if (department !== undefined) user.department = department.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (analystId !== undefined) user.analystId = analystId.trim();
    if (clearance !== undefined) user.clearance = clearance.trim();
    if (timezone !== undefined) user.timezone = timezone.trim();
    if (notifications !== undefined) {
      user.notifications = {
        ...(user.notifications?.toObject?.() || {}),
        ...notifications,
      };
    }

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      username: user.username || user.email?.split('@')[0] || 'alexvance',
      email: user.email,
      role: user.role,
      roleTitle: user.roleTitle,
      department: user.department,
      phone: user.phone,
      analystId: user.analystId,
      clearance: user.clearance,
      timezone: user.timezone,
      notifications: user.notifications,
      message: 'Profile operational changes saved successfully',
    });
  } catch (error) {
    next(error);
  }
};
