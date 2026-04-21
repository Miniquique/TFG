const router = require('express').Router();
const { getAllUsers, updateUserRole, updateProfile, changePassword } = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.get('/', authenticate, authorize('admin'), getAllUsers);
router.patch('/:id/role', authenticate, authorize('admin'), updateUserRole);
router.put('/profile', authenticate, updateProfile);
router.patch('/password', authenticate, changePassword);

module.exports = router;
