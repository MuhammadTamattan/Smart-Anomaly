import Alert from '../models/Alert.js';

export const getAlerts = async (req, res, next) => {
  try {
    const filter = req.user?.role === 'admin' ? {} : { user: req.user._id };
    const alerts = await Alert.find(filter)
      .populate('sourceLog', 'originalName fileType')
      .sort({ detectedAt: -1 });
    res.json(alerts);
  } catch (error) {
    next(error);
  }
};

export const getAlertById = async (req, res, next) => {
  try {
    const query = req.user?.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, user: req.user._id };
    const alert = await Alert.findOne(query)
      .populate('sourceLog', 'originalName fileType fileSize status analysisResult');

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    res.json(alert);
  } catch (error) {
    next(error);
  }
};

export const createAlert = async (req, res, next) => {
  try {
    const {
      title,
      description,
      severity = 'high',
      type = 'anomaly_detected',
      status = 'new',
      sourceLog = null,
      anomalyScore = 0.85,
      indicators = [],
    } = req.body;

    const alert = await Alert.create({
      title: title || 'Anomaly Detected in Log',
      description: description || 'Anomaly detected during log analysis.',
      severity,
      type,
      status,
      sourceLog: sourceLog || null,
      user: req.user._id,
      anomalyScore,
      indicators: Array.isArray(indicators) && indicators.length > 0 ? indicators : ['Unusual pattern detected'],
      detectedAt: new Date(),
    });

    const populated = await Alert.findById(alert._id).populate('sourceLog', 'originalName fileType');
    res.status(201).json(populated || alert);
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
    } else {
      updateData.resolvedAt = null;
    }

    const query = req.user?.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, user: req.user._id };
    const alert = await Alert.findOneAndUpdate(
      query,
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
    const query = req.user?.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, user: req.user._id };
    const alert = await Alert.findOneAndDelete(query);

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    res.json({ message: 'Alert deleted', id: req.params.id });
  } catch (error) {
    next(error);
  }
};

export const getAlertStats = async (req, res, next) => {
  try {
    const filter = req.user?.role === 'admin' ? {} : { user: req.user._id };

    const [total, critical, high, medium, low, investigating, resolved] = await Promise.all([
      Alert.countDocuments(filter),
      Alert.countDocuments({ ...filter, severity: 'critical' }),
      Alert.countDocuments({ ...filter, severity: 'high' }),
      Alert.countDocuments({ ...filter, severity: 'medium' }),
      Alert.countDocuments({ ...filter, severity: 'low' }),
      Alert.countDocuments({ ...filter, status: 'investigating' }),
      Alert.countDocuments({ ...filter, status: 'resolved' }),
    ]);

    res.json({ total, critical, high, medium, low, investigating, resolved });
  } catch (error) {
    next(error);
  }
};

