const soilSimService = require('../services/soilSimService');
const weatherService = require('../services/weatherService');
const SoilReading = require('../models/SoilReading');

// @desc    Get latest soil reading and recent trends
// @route   GET /api/telemetry/soil/latest
// @access  Private
const getSoilMoisture = async (req, res, next) => {
  try {
    const latest = await soilSimService.getLatestReading(req.user.id);
    const recent = await SoilReading.find({ userId: req.user.id })
      .sort({ timestamp: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      latest: {
        moisturePercent: latest.moisturePercent,
        timestamp: latest.timestamp,
        sensorId: latest.sensorId,
        source: latest.source
      },
      recent: recent.reverse()
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Trigger a simulation tick or manually set moisture for demo
// @route   POST /api/telemetry/soil/simulate
// @access  Private
const simulateSoilTick = async (req, res, next) => {
  try {
    const { forceValue } = req.body;
    const reading = await soilSimService.generateTick(
      req.user.id,
      typeof forceValue === 'number' ? forceValue : null
    );

    res.status(200).json({
      success: true,
      reading
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current weather for user location
// @route   GET /api/telemetry/weather
// @access  Private
const getWeather = async (req, res, next) => {
  try {
    const city = req.query.city || req.user.city || 'Bengaluru';
    const weather = await weatherService.getWeatherData(city, req.user.id, true);

    res.status(200).json({
      success: true,
      weather
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSoilMoisture,
  simulateSoilTick,
  getWeather
};
