const express = require('express');
const { getPumpStatus, togglePump } = require('../controllers/pumpController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/status', getPumpStatus);
router.post('/toggle', togglePump);

module.exports = router;
