const router = require('express').Router();
const c = require('../controllers/analyticsController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('admin'));
router.get('/overview', c.overview);
router.get('/searches', c.searches);
router.get('/activity', c.activity);

module.exports = router;
