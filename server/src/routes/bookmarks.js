const router = require('express').Router();
const c = require('../controllers/bookmarkController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', c.list);
router.post('/', c.add);
router.delete('/:id', c.remove);

module.exports = router;
