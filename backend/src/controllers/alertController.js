import Alert from '../models/Alert.js';

export const getAlerts = async (req, res, next) => {
  try {
    const alerts = await Alert.find({ user: req.user._id })
      .populate('sourceLog', 'originalName fileType')
      .sort({ detectedAt: -1 });
    res.json(alerts);
  } catch (error) {
    next(error);
  }
};

export const getAlertById = async (req, res, next) => {
  try {
    const alert = await Alert.findOne({ _id: req.params.id, user: req.user._id })
      .populate('sourceLog', 'originalName fileType fileSize status analysisResult');

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    res.json(alert);
  } catch (error) {
    next(error);
  }
};

export const updateAlertStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['new', 'investigating', 'resolved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const updateData = { status };
    if (status === 'resolved') {
      updateData.resolvedAt = new Date();
    }

    const alert = await Alert.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updateData,
      { new: true }
    ).populate('sourceLog', 'originalName fileType');

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    res.json(alert);
  } catch (error) {
    next(error);
  }
};

export const deleteAlert = async (req, res, next) => {
  try {
    const alert = await Alert.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    res.json({ message: 'Alert deleted' });
  } catch (error) {
    next(error);
  }
};

export const getAlertStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [total, critical, high, medium, low, investigating, resolved] = await Promise.all([
      Alert.countDocuments({ user: userId }),
      Alert.countDocuments({ user: userId, severity: 'critical' }),
      Alert.countDocuments({ user: userId, severity: 'high' }),
      Alert.countDocuments({ user: userId, severity: 'medium' }),
      Alert.countDocuments({ user: userId, severity: 'low' }),
      Alert.countDocuments({ user: userId, status: 'investigating' }),
      Alert.countDocuments({ user: userId, status: 'resolved' }),
    ]);

    res.json({ total, critical, high, medium, low, investigating, resolved });
  } catch (error) {
    next(error);
  }
};
