const router = require('express').Router();
const c = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('admin'));
router.get('/', c.list);
router.patch('/:id/role', c.updateRole);
router.patch('/:id/status', c.updateStatus);

module.exports = router;
