import Incident from '../models/Incident.js';
import Alert from '../models/Alert.js';

/**
 * GET /api/incidents
 * Get all incidents with optional status filter and search
 */
export const getIncidents = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ title: regex }, { incidentId: regex }, { type: regex }];
    }

    const incidents = await Incident.find(filter)
      .populate('relatedAlert', 'title type severity status detectedAt sourceLog indicators')
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 });

    res.json(incidents);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/incidents/stats
 * Get incident count breakdown by status and severity
 */
export const getIncidentStats = async (req, res, next) => {
  try {
    const [total, open, investigating, resolved, critical, high] = await Promise.all([
      Incident.countDocuments(),
      Incident.countDocuments({ status: 'open' }),
      Incident.countDocuments({ status: 'investigating' }),
      Incident.countDocuments({ status: 'resolved' }),
      Incident.countDocuments({ severity: 'critical' }),
      Incident.countDocuments({ severity: 'high' }),
    ]);

    res.json({
      total,
      open,
      investigating,
      resolved,
      critical,
      high,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/incidents/:id
 * Get single incident details by MongoDB ID or readable incidentId
 */
export const getIncidentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = id.startsWith('INC-') ? { incidentId: id } : { _id: id };

    const incident = await Incident.findOne(query)
      .populate({
        path: 'relatedAlert',
        populate: { path: 'sourceLog', select: 'originalName fileType fileSize' },
      })
      .populate('createdBy', 'name email role');

    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    res.json(incident);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/incidents
 * Create incident either from an existing alert or manually
 */
export const createIncident = async (req, res, next) => {
  try {
    const {
      alertId,
      title,
      description,
      type,
      severity,
      source,
      note,
    } = req.body;

    let incidentData = {
      createdBy: req.user._id,
      notes: [],
    };

    // If creating from an existing alert
    if (alertId) {
      const alert = await Alert.findById(alertId).populate('sourceLog', 'originalName');
      if (!alert) {
        return res.status(404).json({ message: 'Referenced alert not found' });
      }

      incidentData.title = title || alert.title;
      incidentData.description = description || alert.description;
      incidentData.type = type || alert.type;
      incidentData.severity = severity || alert.severity;
      incidentData.relatedAlert = alert._id;
      incidentData.source = source || (alert.sourceLog?.originalName ? `Log: ${alert.sourceLog.originalName}` : 'Alert System');
      incidentData.anomalyScore = alert.anomalyScore;
      incidentData.indicators = alert.indicators || [];

      // Link and transition alert status to 'investigating' if it was 'new'
      if (alert.status === 'new') {
        alert.status = 'investigating';
        await alert.save();
      }

      // Add default escalation note
      incidentData.notes.push({
        text: `Incident initiated from Alert: "${alert.title}" (Severity: ${alert.severity.toUpperCase()}).`,
        author: req.user._id,
        authorName: req.user.name || 'Admin',
        createdAt: new Date(),
      });
    } else {
      // Manual incident creation
      if (!title || !title.trim()) {
        return res.status(400).json({ message: 'Incident title is required' });
      }

      incidentData.title = title.trim();
      incidentData.description = description ? description.trim() : '';
      incidentData.type = type || 'anomaly_detected';
      incidentData.severity = severity || 'medium';
      incidentData.source = source ? source.trim() : 'Manual Administrator Triage';
    }

    if (note && note.trim()) {
      incidentData.notes.push({
        text: note.trim(),
        author: req.user._id,
        authorName: req.user.name || 'Admin',
        createdAt: new Date(),
      });
    }

    const incident = await Incident.create(incidentData);

    const populated = await Incident.findById(incident._id)
      .populate('relatedAlert', 'title type severity status detectedAt')
      .populate('createdBy', 'name email role');

    res.status(201).json(populated || incident);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/incidents/:id/status
 * Update incident status (open -> investigating -> resolved)
 */
export const updateIncidentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['open', 'investigating', 'resolved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value. Must be open, investigating, or resolved.' });
    }

    const updateData = { status };
    if (status === 'resolved') {
      updateData.resolvedAt = new Date();
    } else {
      updateData.resolvedAt = null;
    }

    const incident = await Incident.findByIdAndUpdate(id, updateData, { new: true })
      .populate('relatedAlert', 'title type severity status')
      .populate('createdBy', 'name email role');

    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    // If resolved and related to an alert, resolve the related alert as well
    if (status === 'resolved' && incident.relatedAlert) {
      await Alert.findByIdAndUpdate(incident.relatedAlert._id || incident.relatedAlert, {
        status: 'resolved',
        resolvedAt: new Date(),
      });
    }

    res.json(incident);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/incidents/:id/notes
 * Add an investigation note to the incident
 */
export const addIncidentNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Note text is required' });
    }

    const incident = await Incident.findById(id);
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    incident.notes.push({
      text: text.trim(),
      author: req.user._id,
      authorName: req.user.name || 'Admin',
      createdAt: new Date(),
    });

    await incident.save();

    const updated = await Incident.findById(id)
      .populate('relatedAlert', 'title type severity status')
      .populate('createdBy', 'name email role');

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/incidents/:id
 * Delete an incident
 */
export const deleteIncident = async (req, res, next) => {
  try {
    const { id } = req.params;
    const incident = await Incident.findByIdAndDelete(id);

    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    res.json({ message: 'Incident deleted successfully', id });
  } catch (error) {
    next(error);
  }
};
