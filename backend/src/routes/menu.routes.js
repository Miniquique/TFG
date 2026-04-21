const router = require('express').Router();
const { getMenus, getMenuById, generateMenu, getMenuTemplates, selectMenuTemplate, deleteMenu } = require('../controllers/menu.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.get('/', authenticate, getMenus);
router.get('/templates', authenticate, getMenuTemplates);
router.get('/:id', authenticate, getMenuById);
router.post('/generate', authenticate, authorize('admin', 'premium'), generateMenu);
router.post('/select-template', authenticate, selectMenuTemplate);
router.delete('/:id', authenticate, deleteMenu);

module.exports = router;
