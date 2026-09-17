const Recommendation = require('../models/Recommendation');
const { evaluateIrrigation } = require('../services/decisionEngine');
const soilSimService = require('../services/soilSimService');
const weatherService = require('../services/weatherService');

// @desc    Get latest recommendation (or re-evaluate if stale / none exists)
// @route   GET /api/recommendation/latest
// @access  Private
const getLatestRecommendation = async (req, res, next) => {
  try {
    let latest = await Recommendation.findOne({ userId: req.user.id }).sort({ timestamp: -1 });

    // If no recommendation exists or older than 10 minutes, evaluate fresh
    const isStale = !latest || (Date.now() - new Date(latest.timestamp).getTime() > 10 * 60 * 1000);

    if (isStale) {
      const [soilReading, weather] = await Promise.all([
        soilSimService.getLatestReading(req.user.id),
        weatherService.getWeatherData(req.user.city, req.user.id, false)
      ]);

      const evaluation = evaluateIrrigation({
        soilMoisture: soilReading.moisturePercent,
        rainProbability: weather.rainProbability
      });

      latest = await Recommendation.create({
        userId: req.user.id,
        soilMoisture: soilReading.moisturePercent,
        weatherSnapshot: {
          temperature: weather.temperature,
          humidity: weather.humidity,
          rainProbability: weather.rainProbability,
          windSpeed: weather.windSpeed,
          description: weather.description
        },
        decision: evaluation.decision,
        reason: evaluation.reason,
        timestamp: new Date()
      });
    }

    res.status(200).json({
      success: true,
      recommendation: latest
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Force re-evaluate recommendation on demand
// @route   POST /api/recommendation/evaluate
// @access  Private
const evaluateNow = async (req, res, next) => {
  try {
    const [soilReading, weather] = await Promise.all([
      soilSimService.getLatestReading(req.user.id),
      weatherService.getWeatherData(req.user.city, req.user.id, false)
    ]);

    const evaluation = evaluateIrrigation({
      soilMoisture: soilReading.moisturePercent,
      rainProbability: weather.rainProbability
    });

    const newRecommendation = await Recommendation.create({
      userId: req.user.id,
      soilMoisture: soilReading.moisturePercent,
      weatherSnapshot: {
        temperature: weather.temperature,
        humidity: weather.humidity,
        rainProbability: weather.rainProbability,
        windSpeed: weather.windSpeed,
        description: weather.description
      },
      decision: evaluation.decision,
      reason: evaluation.reason,
      timestamp: new Date()
    });

    res.status(200).json({
      success: true,
      recommendation: newRecommendation
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getLatestRecommendation,
  evaluateNow
};
