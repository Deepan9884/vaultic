const router = require('express').Router();
const c = require('../controllers/faqController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/', c.list);
router.get('/:id', c.getById);
// FAQ writes shape what everyone finds — managers and admins only.
router.post('/', authorize('manager', 'admin'), c.create);
router.patch('/:id', authorize('manager', 'admin'), c.update);
router.delete('/:id', authorize('manager', 'admin'), c.remove);

module.exports = router;
