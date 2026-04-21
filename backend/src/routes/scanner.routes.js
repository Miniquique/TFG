const router = require('express').Router();
const { scanShoppingList, addScannedToPantry } = require('../controllers/scanner.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.post('/scan', authenticate, scanShoppingList);
router.post('/add-to-pantry', authenticate, addScannedToPantry);

module.exports = router;
