import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'smart_anomaly_detection_jwt_secret_2026';

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });
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

    // Always enforce 'user' role and 'pending' status for public registrations
    // Do not trust role or status sent from request body
    const user = await User.create({
      name,
      email,
      password,
      role: 'user',
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Registration submitted. Waiting for administrator approval.',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
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

    const userStatus = user.status || (user.role === 'admin' ? 'approved' : 'pending');
    if (userStatus === 'pending') {
      return res.status(403).json({
        message: 'Your account is awaiting administrator approval.',
        status: 'pending',
      });
    }

    if (userStatus === 'rejected') {
      return res.status(403).json({
        message: 'Your registration was rejected.',
        status: 'rejected',
      });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status || 'approved',
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
      avatar: user.avatar || '',
      bio: user.bio || 'Cyber Threat Intelligence & Anomaly Detection Specialist.',
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
      avatar,
      bio,
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
    if (avatar !== undefined) user.avatar = avatar;
    if (bio !== undefined) user.bio = bio.trim();
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
      avatar: user.avatar || '',
      bio: user.bio || '',
      notifications: user.notifications,
      message: 'Profile operational changes saved successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const getRegistrationRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = { role: { $ne: 'admin' } };
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query.status = status;
    }

    const requests = await User.find(query)
      .select('_id name email role status department roleTitle clearance createdAt updatedAt')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    next(error);
  }
};

export const approveRegistrationRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.status = 'approved';
    await user.save();

    res.json({
      success: true,
      message: `Account for ${user.name} (${user.email}) approved successfully.`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const rejectRegistrationRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user._id.toString() === id.toString()) {
      return res.status(400).json({ message: 'Cannot reject your own admin account' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.status = 'rejected';
    await user.save();

    res.json({
      success: true,
      message: `Account registration for ${user.name} (${user.email}) was rejected.`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

