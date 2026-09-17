const User = require('../models/User');
const SoilReading = require('../models/SoilReading');
const WeatherLog = require('../models/WeatherLog');
const Recommendation = require('../models/Recommendation');
const PumpLog = require('../models/PumpLog');

/**
 * Automatically seeds default users and initial demonstration telemetry.
 */
const seedDatabase = async () => {
  try {
    // 1. Seed Admin User
    let admin = await User.findOne({ email: 'admin@irrigation.com' });
    if (!admin) {
      admin = await User.create({
        name: 'System Administrator',
        email: 'admin@irrigation.com',
        password: 'Admin@1234',
        role: 'admin',
        city: 'Bengaluru',
        cropType: 'Field Research'
      });
      console.log('[Seeder] Created default Admin: admin@irrigation.com (Pass: Admin@1234)');
    }

    // 2. Seed Farmer User
    let farmer = await User.findOne({ email: 'farmer@irrigation.com' });
    if (!farmer) {
      farmer = await User.create({
        name: 'Rajesh Kumar',
        email: 'farmer@irrigation.com',
        password: 'Farmer@1234',
        role: 'farmer',
        city: 'Bengaluru',
        cropType: 'Organic Tomatoes'
      });
      console.log('[Seeder] Created default Farmer: farmer@irrigation.com (Pass: Farmer@1234)');
    }

    // 3. Seed historical telemetry if farmer has fewer than 10 readings
    const readingCount = await SoilReading.countDocuments({ userId: farmer._id });
    if (readingCount < 10) {
      console.log('[Seeder] Generating 7-day realistic telemetry history for demo farmer...');
      const now = Date.now();
      const points = 21; // 3 per day for 7 days
      const intervalMs = (7 * 24 * 60 * 60 * 1000) / points;

      const soilDocs = [];
      const weatherDocs = [];
      const recDocs = [];

      let currentMoisture = 32.5;

      for (let i = points; i >= 0; i--) {
        const timestamp = new Date(now - i * intervalMs);
        const hour = timestamp.getHours();

        // Natural curve
        const diurnalShift = Math.sin(((hour - 6) / 24) * 2 * Math.PI) * 5.0;
        const temp = +(24.0 + diurnalShift + (Math.random() - 0.5) * 1.5).toFixed(1);
        const humidity = Math.min(92, Math.max(38, Math.round(72 - diurnalShift * 3)));
        const rainProb = Math.round(12 + Math.random() * 25);

        // Slow moisture drift
        currentMoisture = Math.max(24, Math.min(76, currentMoisture + (Math.random() - 0.49) * 3.5));
        const moisture = +(currentMoisture.toFixed(1));

        soilDocs.push({
          userId: farmer._id,
          moisturePercent: moisture,
          sensorId: 'SENSOR-SOIL-01',
          source: 'SIMULATED',
          timestamp
        });

        weatherDocs.push({
          userId: farmer._id,
          city: farmer.city,
          temperature: temp,
          humidity,
          rainProbability: rainProb,
          windSpeed: +(3.0 + Math.random() * 2.0).toFixed(1),
          description: rainProb > 30 ? 'Partly cloudy' : 'Clear skies',
          icon: rainProb > 30 ? '03d' : '01d',
          timestamp
        });

        const shouldIrrigate = moisture < 35 && rainProb < 40;
        recDocs.push({
          userId: farmer._id,
          soilMoisture: moisture,
          weatherSnapshot: {
            temperature: temp,
            humidity,
            rainProbability: rainProb,
            windSpeed: 3.5,
            description: rainProb > 30 ? 'Partly cloudy' : 'Clear skies'
          },
          decision: shouldIrrigate ? 'IRRIGATE_NOW' : 'NO_IRRIGATION_NEEDED',
          reason: shouldIrrigate
            ? `Soil moisture (${moisture}%) dropped below 35% with low rain prospect (${rainProb}%).`
            : `Hydration adequate (${moisture}%) or rain expected (${rainProb}%).`,
          timestamp
        });
      }

      await SoilReading.insertMany(soilDocs);
      await WeatherLog.insertMany(weatherDocs);
      await Recommendation.insertMany(recDocs);

      // Seed 3 historical completed pump cycles
      const pumpCycles = [
        {
          userId: farmer._id,
          status: 'OFF',
          startedAt: new Date(now - 5 * 24 * 60 * 60 * 1000),
          stoppedAt: new Date(now - 5 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000),
          durationMinutes: 45,
          estimatedWaterUsedLiters: 675,
          triggerType: 'MANUAL'
        },
        {
          userId: farmer._id,
          status: 'OFF',
          startedAt: new Date(now - 3 * 24 * 60 * 60 * 1000),
          stoppedAt: new Date(now - 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
          durationMinutes: 30,
          estimatedWaterUsedLiters: 450,
          triggerType: 'MANUAL'
        },
        {
          userId: farmer._id,
          status: 'OFF',
          startedAt: new Date(now - 1 * 24 * 60 * 60 * 1000),
          stoppedAt: new Date(now - 1 * 24 * 60 * 60 * 1000 + 40 * 60 * 1000),
          durationMinutes: 40,
          estimatedWaterUsedLiters: 600,
          triggerType: 'MANUAL'
        }
      ];
      await PumpLog.insertMany(pumpCycles);

      console.log('[Seeder] Historical demo data seeded successfully!');
    }
  } catch (err) {
    console.error('[Seeder Error]', err.message);
  }
};

module.exports = { seedDatabase };
