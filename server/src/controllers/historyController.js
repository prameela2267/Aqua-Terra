const SoilReading = require('../models/SoilReading');
const WeatherLog = require('../models/WeatherLog');
const Recommendation = require('../models/Recommendation');
const PumpLog = require('../models/PumpLog');

// @desc    Get paginated unified chronological history log
// @route   GET /api/history
// @access  Private
const getHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const { from, to, category } = req.query;

    const targetUserId = (req.user.role === 'admin' && req.query.userId) ? req.query.userId : req.user.id;

    // Date bounds
    const dateFilter = {};
    if (from || to) {
      dateFilter.$gte = from ? new Date(from) : new Date(0);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        dateFilter.$lte = toDate;
      }
    }

    const queryBase = { userId: targetUserId };
    if (Object.keys(dateFilter).length > 0) {
      queryBase.timestamp = dateFilter;
    }

    // Collect timeline entries based on optional category
    let entries = [];

    if (!category || category === 'ALL' || category === 'SOIL') {
      const soil = await SoilReading.find(queryBase).lean();
      soil.forEach(item => entries.push({
        type: 'SOIL',
        timestamp: item.timestamp,
        details: { moisturePercent: item.moisturePercent, sensorId: item.sensorId, source: item.source }
      }));
    }

    if (!category || category === 'ALL' || category === 'WEATHER') {
      const weather = await WeatherLog.find(queryBase).lean();
      weather.forEach(item => entries.push({
        type: 'WEATHER',
        timestamp: item.timestamp,
        details: {
          city: item.city,
          temperature: item.temperature,
          humidity: item.humidity,
          rainProbability: item.rainProbability,
          windSpeed: item.windSpeed,
          description: item.description,
          icon: item.icon
        }
      }));
    }

    if (!category || category === 'ALL' || category === 'RECOMMENDATION') {
      const recommendations = await Recommendation.find(queryBase).lean();
      recommendations.forEach(item => entries.push({
        type: 'RECOMMENDATION',
        timestamp: item.timestamp,
        details: {
          decision: item.decision,
          reason: item.reason,
          soilMoisture: item.soilMoisture,
          weatherSnapshot: item.weatherSnapshot
        }
      }));
    }

    if (!category || category === 'ALL' || category === 'PUMP') {
      const pumpQuery = { userId: targetUserId };
      if (Object.keys(dateFilter).length > 0) {
        pumpQuery.startedAt = dateFilter;
      }
      const pumps = await PumpLog.find(pumpQuery).lean();
      pumps.forEach(item => entries.push({
        type: 'PUMP',
        timestamp: item.startedAt,
        details: {
          status: item.status,
          stoppedAt: item.stoppedAt,
          durationMinutes: item.durationMinutes,
          estimatedWaterUsedLiters: item.estimatedWaterUsedLiters,
          triggerType: item.triggerType
        }
      }));
    }

    // Sort descending by timestamp
    entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const total = entries.length;
    const startIndex = (page - 1) * limit;
    const paginatedEntries = entries.slice(startIndex, startIndex + limit);

    res.status(200).json({
      success: true,
      data: paginatedEntries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getHistory
};
