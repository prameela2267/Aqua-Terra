const express = require('express');
const { getLatestRecommendation, evaluateNow } = require('../controllers/recommendationController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/latest', getLatestRecommendation);
router.post('/evaluate', evaluateNow);

module.exports = router;
