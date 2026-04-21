const router = require('express').Router();
const { getPantry, addToPantry, updatePantryItem, deletePantryItem } = require('../controllers/pantry.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/', authenticate, getPantry);
router.post('/', authenticate, addToPantry);
router.put('/:id', authenticate, updatePantryItem);
router.delete('/:id', authenticate, deletePantryItem);

module.exports = router;
