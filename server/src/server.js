const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const { seedDatabase } = require('./config/seed');
const env = require('./config/env');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const telemetryRoutes = require('./routes/telemetryRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const pumpRoutes = require('./routes/pumpRoutes');
const historyRoutes = require('./routes/historyRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const reportRoutes = require('./routes/reportRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Services for periodic simulation loop
const User = require('./models/User');
const soilSimService = require('./services/soilSimService');

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// API Routes
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    service: 'Smart Irrigation System API',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime())
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/recommendation', recommendationRoutes);
app.use('/api/pump', pumpRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);

// Error Handling Middleware
app.use(errorHandler);

// Background Simulation Loop (Every 20 seconds, drift soil moisture for active farmers)
let simulationInterval = null;
const startSimulationLoop = () => {
  if (simulationInterval) clearInterval(simulationInterval);

  simulationInterval = setInterval(async () => {
    try {
      const farmers = await User.find({ role: 'farmer', isActive: true }).select('_id name');
      for (const farmer of farmers) {
        await soilSimService.generateTick(farmer._id);
      }
    } catch (err) {
      // Background tick silent catch to keep server robust
      console.debug('[Telemetry Daemon Tick Error]', err.message);
    }
  }, 20000); // 20-second interval

  console.log('[Telemetry Daemon] Background telemetry drift loop initialized (20s interval)');
};

// Bootstrap Server
const startServer = async () => {
  try {
    await connectDB();
    await seedDatabase();

    const server = app.listen(env.PORT, () => {
      console.log(`=======================================================`);
      console.log(`  SMART IRRIGATION SYSTEM API RUNNING`);
      console.log(`  Port: ${env.PORT}`);
      console.log(`  Mode: ${env.NODE_ENV}`);
      console.log(`  Health Check: http://localhost:${env.PORT}/api/health`);
      console.log(`=======================================================`);
    });

    startSimulationLoop();

    return server;
  } catch (err) {
    console.error('Fatal Server Startup Error:', err.message);
    process.exit(1);
  }
};

// Start if run directly
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
