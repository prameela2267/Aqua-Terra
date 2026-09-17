const PumpLog = require('../models/PumpLog');
const Recommendation = require('../models/Recommendation');
const { evaluateIrrigation } = require('../services/decisionEngine');
const soilSimService = require('../services/soilSimService');
const weatherService = require('../services/weatherService');

// Flow rate of irrigation pump in Liters per minute (standard 1 HP agricultural drip pump)
const FLOW_RATE_LPM = 15;

// @desc    Get current pump status and runtime metrics
// @route   GET /api/pump/status
// @access  Private
const getPumpStatus = async (req, res, next) => {
  try {
    const activeSession = await PumpLog.findOne({
      userId: req.user.id,
      status: 'ON',
      stoppedAt: null
    }).sort({ startedAt: -1 });

    const lastCompleted = await PumpLog.findOne({
      userId: req.user.id,
      stoppedAt: { $ne: null }
    }).sort({ stoppedAt: -1 });

    let currentSessionData = null;
    if (activeSession) {
      const elapsedMinutes = Math.max(0.1, (Date.now() - new Date(activeSession.startedAt).getTime()) / 60000);
      currentSessionData = {
        id: activeSession._id,
        startedAt: activeSession.startedAt,
        elapsedMinutes: +(elapsedMinutes.toFixed(2)),
        estimatedWaterUsedLiters: +( (elapsedMinutes * FLOW_RATE_LPM).toFixed(1) )
      };
    }

    res.status(200).json({
      success: true,
      isRunning: !!activeSession,
      activeSession: currentSessionData,
      lastCompletedSession: lastCompleted
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle pump state (Safety gate enforced)
// @route   POST /api/pump/toggle
// @access  Private
const togglePump = async (req, res, next) => {
  try {
    const { action, triggerType } = req.body; // action: 'ON' | 'OFF'

    const activeSession = await PumpLog.findOne({
      userId: req.user.id,
      status: 'ON',
      stoppedAt: null
    }).sort({ startedAt: -1 });

    // Determine target action if not explicitly given
    const targetAction = action ? action.toUpperCase() : (activeSession ? 'OFF' : 'ON');

    if (targetAction === 'ON') {
      if (activeSession) {
        return res.status(400).json({
          success: false,
          error: 'Pump is already running.',
          isRunning: true
        });
      }

      // STRICT SAFETY INTERLOCK: Verify decision engine recommendation
      let latestRecommendation = await Recommendation.findOne({ userId: req.user.id }).sort({ timestamp: -1 });

      // If no recommendation or older than 5 mins, re-evaluate fresh
      if (!latestRecommendation || (Date.now() - new Date(latestRecommendation.timestamp).getTime() > 5 * 60 * 1000)) {
        const [soilReading, weather] = await Promise.all([
          soilSimService.getLatestReading(req.user.id),
          weatherService.getWeatherData(req.user.city, req.user.id, false)
        ]);
        const evalResult = evaluateIrrigation({
          soilMoisture: soilReading.moisturePercent,
          rainProbability: weather.rainProbability
        });
        latestRecommendation = await Recommendation.create({
          userId: req.user.id,
          soilMoisture: soilReading.moisturePercent,
          weatherSnapshot: {
            temperature: weather.temperature,
            humidity: weather.humidity,
            rainProbability: weather.rainProbability,
            windSpeed: weather.windSpeed,
            description: weather.description
          },
          decision: evalResult.decision,
          reason: evalResult.reason,
          timestamp: new Date()
        });
      }

      if (latestRecommendation.decision !== 'IRRIGATE_NOW') {
        return res.status(400).json({
          success: false,
          error: `Safety Interlock Engaged: Pump activation blocked. Decision Engine reports: "${latestRecommendation.reason}"`,
          recommendation: latestRecommendation
        });
      }

      // Safe to turn ON
      const newSession = await PumpLog.create({
        userId: req.user.id,
        status: 'ON',
        startedAt: new Date(),
        triggerType: triggerType || 'MANUAL'
      });

      return res.status(200).json({
        success: true,
        message: 'Irrigation pump started successfully. Soil hydration in progress.',
        isRunning: true,
        session: newSession
      });
    } else {
      // Turn OFF
      if (!activeSession) {
        return res.status(400).json({
          success: false,
          error: 'Pump is not currently running.',
          isRunning: false
        });
      }

      const stoppedAt = new Date();
      const elapsedMs = stoppedAt.getTime() - new Date(activeSession.startedAt).getTime();
      const durationMinutes = +(Math.max(0.1, elapsedMs / 60000).toFixed(2));
      const estimatedWaterUsedLiters = +( (durationMinutes * FLOW_RATE_LPM).toFixed(1) );

      activeSession.stoppedAt = stoppedAt;
      activeSession.durationMinutes = durationMinutes;
      activeSession.estimatedWaterUsedLiters = estimatedWaterUsedLiters;
      await activeSession.save();

      // Trigger a soil moisture boost to reflect pump watering
      await soilSimService.generateTick(req.user.id);

      return res.status(200).json({
        success: true,
        message: `Irrigation pump stopped. Cycle duration: ${durationMinutes} minutes. Total water dispensed: ${estimatedWaterUsedLiters} L.`,
        isRunning: false,
        session: activeSession
      });
    }
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPumpStatus,
  togglePump
};
