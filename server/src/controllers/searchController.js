const { semanticSearch } = require('../services/searchService');
const Activity = require('../models/Activity');
const mongoose = require('mongoose');

async function search(req, res, next) {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.status(400).json({ success: false, message: 'Query ?q= is required' });
    const results = await semanticSearch(q, req.user, { topK: req.query.topK, category: req.query.category });
    await Activity.create({ userId: req.user.id, action: 'search', query: q, metadata: { count: results.length } }).catch(() => {});
    return res.json({ success: true, data: results });
  } catch (e) { return next(e); }
}

// Recent distinct queries for this user (command palette, history).
async function recent(req, res, next) {
  try {
    const uid = new mongoose.Types.ObjectId(req.user.id);
    const rows = await Activity.aggregate([
      { $match: { userId: uid, action: 'search' } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$query', lastUsed: { $first: '$createdAt' }, count: { $sum: 1 } } },
      { $sort: { lastUsed: -1 } },
      { $limit: 8 },
      { $project: { _id: 0, query: '$_id', lastUsed: 1, count: 1 } },
    ]);
    return res.json({ success: true, data: rows });
  } catch (e) { return next(e); }
}

// Extractive Ask: no LLM key required — returns the best passages
// with citations so the UI can show a grounded answer.
async function ask(req, res, next) {
  try {
    const q = (req.body.q || req.query.q || '').trim();
    if (!q) return res.status(400).json({ success: false, message: 'Question ?q= is required' });
    const results = await semanticSearch(q, req.user, { topK: 6 });
    const citations = results.slice(0, 4).map((r, i) => {
      if (r.type === 'faq') {
        return {
          n: i + 1,
          kind: 'faq',
          id: String(r.faq._id),
          title: r.faq.question,
          snippet: (r.snippets[0] || '').slice(0, 420),
          score: r.score,
        };
      }
      return {
        n: i + 1,
        kind: 'document',
        id: String(r.document._id),
        title: r.document.title,
        snippet: (r.snippets[0] || '').slice(0, 420),
        score: r.score,
      };
    });
    const summary =
      citations.length === 0
        ? 'I could not find anything in your library about that. Try different wording or browse by category.'
        : `Found ${citations.length} relevant passage${citations.length === 1 ? '' : 's'} in your library: ` +
          citations.map((c) => `[${c.n}] ${c.title}`).join('; ') + '.';
    await Activity.create({ userId: req.user.id, action: 'ask', query: q, metadata: { count: citations.length } }).catch(() => {});
    return res.json({ success: true, data: { question: q, summary, citations } });
  } catch (e) { return next(e); }
}

module.exports = { search, recent, ask };
