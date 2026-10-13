const router = require('express').Router();
const c = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { rateLimit } = require('../middleware/rateLimit');

const authLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 60, key: (req) => `auth:${req.ip}` });

router.post('/signup', authLimit, c.signup);
router.post('/login', authLimit, c.login);
router.get('/me', authenticate, c.me);

module.exports = router;
