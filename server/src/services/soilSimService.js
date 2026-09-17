const SoilReading = require('../models/SoilReading');
const PumpLog = require('../models/PumpLog');

/**
 * Soil Moisture Simulation Service
 * Simulates real sensor physics:
 * - If pump is running (ON): soil moisture increases (+2% to +5% per step)
 * - If pump is stopped (OFF): natural solar evaporation gradually decreases moisture (-0.3% to -1.0% per step)
 */
class SoilSimService {
  /**
   * Get the most recent soil moisture reading for a user.
   * If none exists, initializes one at a realistic default (42%).
   */
  async getLatestReading(userId) {
    let latest = await SoilReading.findOne({ userId }).sort({ timestamp: -1 });
    if (!latest) {
      latest = await SoilReading.create({
        userId,
        moisturePercent: 42.0,
        source: 'SIMULATED',
        timestamp: new Date()
      });
    }
    return latest;
  }

  /**
   * Generates a new simulated telemetry tick based on current pump status.
   * @param {string|ObjectId} userId
   * @param {number|null} forceValue - Optional specific value to set for interactive demo
   */
  async generateTick(userId, forceValue = null) {
    const latest = await this.getLatestReading(userId);
    let newMoisture;

    if (forceValue !== null && typeof forceValue === 'number') {
      newMoisture = Math.max(5, Math.min(95, forceValue));
    } else {
      // Check if user currently has an active pump session
      const activePump = await PumpLog.findOne({ userId, status: 'ON', stoppedAt: null });
      const isPumpOn = !!activePump;

      if (isPumpOn) {
        // Hydration phase: pump adds water
        const hydrationDelta = +(2.0 + Math.random() * 2.8).toFixed(1);
        newMoisture = Math.min(88.0, latest.moisturePercent + hydrationDelta);
      } else {
        // Evaporation phase: gradual drying
        const dryingDelta = +(0.3 + Math.random() * 0.7).toFixed(1);
        newMoisture = Math.max(18.0, latest.moisturePercent - dryingDelta);
      }
    }

    newMoisture = +(newMoisture.toFixed(1));

    const reading = await SoilReading.create({
      userId,
      moisturePercent: newMoisture,
      sensorId: 'SENSOR-SOIL-01',
      source: 'SIMULATED',
      timestamp: new Date()
    });

    return reading;
  }

  /**
   * Seed historical soil readings for past N days (useful for initial chart render)
   */
  async seedHistoricalReadings(userId, days = 7) {
    const existing = await SoilReading.countDocuments({ userId });
    if (existing >= 20) return; // already populated

    const readings = [];
    const now = Date.now();
    let currentMoisture = 38.0;

    // Generate ~3 data points per day
    const points = days * 3;
    const intervalMs = (days * 24 * 60 * 60 * 1000) / points;

    for (let i = points; i >= 1; i--) {
      const timestamp = new Date(now - i * intervalMs);
      // Natural diurnal variation
      const randomShift = (Math.random() - 0.48) * 4.0;
      currentMoisture = Math.max(22, Math.min(78, currentMoisture + randomShift));

      readings.push({
        userId,
        moisturePercent: +(currentMoisture.toFixed(1)),
        sensorId: 'SENSOR-SOIL-01',
        source: 'SIMULATED',
        timestamp
      });
    }

    // Add current reading
    readings.push({
      userId,
      moisturePercent: +(currentMoisture.toFixed(1)),
      sensorId: 'SENSOR-SOIL-01',
      source: 'SIMULATED',
      timestamp: new Date(now)
    });

    await SoilReading.insertMany(readings);
    console.log(`[SoilSim] Seeded ${readings.length} historical readings for user ${userId}`);
  }
}

module.exports = new SoilSimService();
