const express = require('express');
const { getSoilMoisture, simulateSoilTick, getWeather } = require('../controllers/telemetryController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/soil/latest', getSoilMoisture);
router.post('/soil/simulate', simulateSoilTick);
router.get('/weather', getWeather);

module.exports = router;
