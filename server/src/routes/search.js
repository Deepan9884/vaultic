const router = require('express').Router();
const c = require('../controllers/searchController');
const { authenticate } = require('../middleware/auth');
const { rateLimit } = require('../middleware/rateLimit');

const searchLimit = rateLimit({ windowMs: 60000, max: 120, key: (req) => `search:${req.ip}` });

router.get('/recent', authenticate, c.recent);
router.post('/ask', authenticate, searchLimit, c.ask);
router.get('/', authenticate, searchLimit, c.search);

module.exports = router;
