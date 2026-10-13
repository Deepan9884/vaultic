require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ---- fail fast on unsafe / missing config in production ----
if (NODE_ENV === 'production') {
  if (!process.env.MONGO_URI) {
    console.error('FATAL: MONGO_URI is required in production.');
    process.exit(1);
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'changeme') {
    console.error('FATAL: set a strong JWT_SECRET in production.');
    process.exit(1);
  }
} else if (!process.env.JWT_SECRET) {
  console.warn('WARN: JWT_SECRET not set — using insecure dev default. Do not use in production.');
}

// Behind Render/Railway/nginx: correct client IPs for rate limiting + logs.
app.set('trust proxy', 1);

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
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));

// NOTE: uploads/ is intentionally NOT served statically —
// file bytes are only available via GET /api/documents/:id/file,
// which enforces role-based access first.

app.get('/api/health', (req, res) => res.json({
  success: true,
  message: 'Vaultic API ok',
  env: NODE_ENV,
  uptimeSec: Math.floor(process.uptime()),
  db: mongoose.connection.readyState === 1 ? 'connected' : 'not-connected',
  time: new Date().toISOString(),
}));

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
  let status = err.status || 500;
  let message = err.message || 'Server error';
  // Multer upload failures (size, type) are client errors, not 500s.
  if ((err.code && String(err.code).startsWith('LIMIT_')) || message === 'Only pdf, docx, txt, md files allowed') {
    status = 400;
  }
  if (status === 500 && NODE_ENV === 'production') message = 'Server error';
  res.status(status).json({ success: false, message });
});

let server = null;
connectDB()
  .then(() => {
    server = app.listen(PORT, () => console.log(`Vaultic server (${NODE_ENV}) on :${PORT}`));
  })
  .catch((e) => {
    console.error('DB connect failed:', e.message);
    process.exit(1);
  });

// Graceful shutdown: finish in-flight requests, close DB.
function shutdown(signal) {
  console.log(`Received ${signal}, shutting down…`);
  const close = server ? new Promise((resolve) => server.close(resolve)) : Promise.resolve();
  close
    .then(() => mongoose.connection.close())
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
  // Force exit if something hangs.
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = app;
