const express = require('express');
const { generatePdfReport } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/:userId', generatePdfReport);

module.exports = router;
