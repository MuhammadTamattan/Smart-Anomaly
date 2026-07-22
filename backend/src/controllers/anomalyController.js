import Anomaly from '../models/Anomaly.js';

export const getAnomalies = async (req, res, next) => {
  try {
    const anomalies = await Anomaly.find().sort({ createdAt: -1 });
    res.json(anomalies);
  } catch (error) {
    next(error);
  }
};

export const getAnomalyById = async (req, res, next) => {
  try {
    const anomaly = await Anomaly.findById(req.params.id);
    
    if (!anomaly) {
      return res.status(404).json({ message: 'Anomaly not found' });
    }
    
    res.json(anomaly);
  } catch (error) {
    next(error);
  }
};

export const createAnomaly = async (req, res, next) => {
  try {
    const anomaly = await Anomaly.create(req.body);
    res.status(201).json(anomaly);
  } catch (error) {
    next(error);
  }
};

export const updateAnomaly = async (req, res, next) => {
  try {
    const anomaly = await Anomaly.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!anomaly) {
      return res.status(404).json({ message: 'Anomaly not found' });
    }
    
    res.json(anomaly);
  } catch (error) {
    next(error);
  }
};

export const deleteAnomaly = async (req, res, next) => {
  try {
    const anomaly = await Anomaly.findByIdAndDelete(req.params.id);
    
    if (!anomaly) {
      return res.status(404).json({ message: 'Anomaly not found' });
    }
    
    res.json({ message: 'Anomaly removed' });
  } catch (error) {
    next(error);
  }
};