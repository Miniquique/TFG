const router = require('express').Router();
const { getFoods, getFoodById, createFood } = require('../controllers/food.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.get('/', authenticate, getFoods);
router.get('/:id', authenticate, getFoodById);
router.post('/', authenticate, authorize('admin'), createFood);

module.exports = router;
