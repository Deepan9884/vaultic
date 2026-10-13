// Minimal in-memory rate limiter (per key over a sliding window).
// For multi-instance production use, replace with a Redis store.
const hits = new Map();

function cleanup(now) {
  for (const [k, arr] of hits) {
    const fresh = arr.filter((t) => now - t < 15 * 60 * 1000);
    if (fresh.length) hits.set(k, fresh);
    else hits.delete(k);
  }
}
setInterval(() => cleanup(Date.now()), 60 * 1000).unref?.();

function rateLimit({ windowMs = 60000, max = 60, key = (req) => req.ip } = {}) {
  return (req, res, next) => {
    const now = Date.now();
    const k = `${key(req)}`;
    const arr = (hits.get(k) || []).filter((t) => now - t < windowMs);
    arr.push(now);
    hits.set(k, arr);
    const remaining = Math.max(0, max - arr.length);
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    if (arr.length > max) {
      const retry = Math.ceil((arr[0] + windowMs - now) / 1000);
      res.setHeader('Retry-After', Math.max(1, retry));
      return res.status(429).json({ success: false, message: 'Too many requests, slow down.' });
    }
    return next();
  };
}

module.exports = { rateLimit };
