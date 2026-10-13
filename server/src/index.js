require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  referrerPolicy: { policy: 'no-referrer' },
}));
app.use(cors({ origin: (process.env.CLIENT_URL || 'http://localhost:5173').split(','), credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// NOTE: uploads/ is intentionally NOT served statically —
// file bytes are only available via GET /api/documents/:id/file,
// which enforces role-based access first.

app.get('/api/health', (req, res) => res.json({ success: true, message: 'Vaultic API ok', time: new Date().toISOString() }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/search', require('./routes/search'));
app.use('/api/faqs', require('./routes/faqs'));
app.use('/api/bookmarks', require('./routes/bookmarks'));
app.use('/api/analytics', require('./routes/analytics'));

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ success: false, message: err.message || 'Server error' });
});

connectDB()
  .then(() => app.listen(PORT, () => console.log(`Vaultic server on :${PORT}`)))
  .catch((e) => {
    console.error('DB connect failed:', e.message);
    process.exit(1);
  });

module.exports = app;
