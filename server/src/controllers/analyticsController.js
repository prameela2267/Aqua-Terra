const SoilReading = require('../models/SoilReading');
const WeatherLog = require('../models/WeatherLog');
const Recommendation = require('../models/Recommendation');
const PumpLog = require('../models/PumpLog');

// @desc    Get aggregated analytics for Recharts visualizations
// @route   GET /api/analytics
// @access  Private
const getAnalytics = async (req, res, next) => {
  try {
    const targetUserId = (req.user.role === 'admin' && req.query.userId) ? req.query.userId : req.user.id;
    const days = parseInt(req.query.days, 10) || 7;
    const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Fetch past readings
    const [soilData, weatherData, pumpLogs, recommendations] = await Promise.all([
      SoilReading.find({ userId: targetUserId, timestamp: { $gte: sinceDate } }).sort({ timestamp: 1 }),
      WeatherLog.find({ userId: targetUserId, timestamp: { $gte: sinceDate } }).sort({ timestamp: 1 }),
      PumpLog.find({ userId: targetUserId, startedAt: { $gte: sinceDate } }).sort({ startedAt: 1 }),
      Recommendation.find({ userId: targetUserId, timestamp: { $gte: sinceDate } })
    ]);

    // Format telemetry trend for multi-line Recharts (Timestamp, Moisture, Temperature, Humidity)
    // Group telemetry by day/date
    const dayMap = {};

    // Initialize past N days
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateKey = d.toISOString().split('T')[0];
      const displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dayMap[dateKey] = {
        date: dateKey,
        label: displayDate,
        moistureTotal: 0,
        moistureCount: 0,
        tempTotal: 0,
        tempCount: 0,
        humidityTotal: 0,
        humidityCount: 0,
        waterUsedLiters: 0,
        pumpRunMinutes: 0,
        pumpCycles: 0
      };
    }

    soilData.forEach(r => {
      const key = new Date(r.timestamp).toISOString().split('T')[0];
      if (dayMap[key]) {
        dayMap[key].moistureTotal += r.moisturePercent;
        dayMap[key].moistureCount++;
      }
    });

    weatherData.forEach(w => {
      const key = new Date(w.timestamp).toISOString().split('T')[0];
      if (dayMap[key]) {
        dayMap[key].tempTotal += w.temperature;
        dayMap[key].tempCount++;
        dayMap[key].humidityTotal += w.humidity;
        dayMap[key].humidityCount++;
      }
    });

    pumpLogs.forEach(p => {
      const key = new Date(p.startedAt).toISOString().split('T')[0];
      if (dayMap[key]) {
        const mins = p.durationMinutes || 0;
        const water = p.estimatedWaterUsedLiters || mins * 15;
        dayMap[key].waterUsedLiters += water;
        dayMap[key].pumpRunMinutes += mins;
        dayMap[key].pumpCycles++;
      }
    });

    const trend = Object.values(dayMap).map(item => ({
      date: item.date,
      label: item.label,
      moisture: item.moistureCount ? +( (item.moistureTotal / item.moistureCount).toFixed(1) ) : null,
      temperature: item.tempCount ? +( (item.tempTotal / item.tempCount).toFixed(1) ) : null,
      humidity: item.humidityCount ? +( (item.humidityTotal / item.humidityCount).toFixed(1) ) : null,
      waterUsedLiters: Math.round(item.waterUsedLiters),
      pumpRunMinutes: +(item.pumpRunMinutes.toFixed(1)),
      pumpCycles: item.pumpCycles
    }));

    // Overall summary KPI stats
    const totalWaterUsed = Math.round(pumpLogs.reduce((sum, p) => sum + (p.estimatedWaterUsedLiters || (p.durationMinutes || 0) * 15), 0));
    const totalPumpCycles = pumpLogs.length;
    const totalPumpMinutes = +(pumpLogs.reduce((sum, p) => sum + (p.durationMinutes || 0), 0).toFixed(1));

    const irrigateCount = recommendations.filter(r => r.decision === 'IRRIGATE_NOW').length;
    const noIrrigateCount = recommendations.filter(r => r.decision === 'NO_IRRIGATION_NEEDED').length;
    const totalWaterSaved = noIrrigateCount * 450; // liters saved per prevented unnecessary cycle

    res.status(200).json({
      success: true,
      summary: {
        totalWaterUsedLiters: totalWaterUsed,
        totalWaterSavedLiters: totalWaterSaved,
        totalPumpCycles,
        totalPumpMinutes,
        recommendationSplit: {
          irrigateNow: irrigateCount,
          noIrrigation: noIrrigateCount
        }
      },
      trend
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAnalytics
};
