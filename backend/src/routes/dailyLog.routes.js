const router = require('express').Router();
const { getDailyLog, addToLog, deleteLogItem, getStats } = require('../controllers/dailyLog.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/', authenticate, getDailyLog);
router.get('/stats', authenticate, getStats);
router.post('/', authenticate, addToLog);
router.delete('/:id', authenticate, deleteLogItem);

module.exports = router;
