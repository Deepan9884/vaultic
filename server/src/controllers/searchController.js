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
    const extractive =
      citations.length === 0
        ? 'I could not find anything in your library about that. Try different wording or browse by category.'
        : `Found ${citations.length} relevant passage${citations.length === 1 ? '' : 's'} in your library: ` +
          citations.map((c) => `[${c.n}] ${c.title}`).join('; ') + '.';
    // Generative upgrade when a Gemini key is configured; otherwise
    // fall back to the extractive summary above (still fully cited).
    const generated = await geminiAnswer(q, citations);
    await Activity.create({ userId: req.user.id, action: 'ask', query: q, metadata: { count: citations.length, generated: !!generated } }).catch(() => {});
    return res.json({ success: true, data: { question: q, summary: generated || extractive, generated: !!generated, citations } });
  } catch (e) { return next(e); }
}

// Optional Gemini answering over the retrieved (RBAC-filtered) passages.
// Returns null when unconfigured or on any API failure -> caller falls back.
async function geminiAnswer(question, citations) {
  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key || citations.length === 0) return null;
    const model = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';
    const context = citations.map((c) => `[${c.n}] ${c.title}:\n${c.snippet}`).join('\n\n');
    const prompt =
      'Answer the question using ONLY the company passages below. ' +
      'If the answer is not in them, say you could not find it. ' +
      'Cite sources inline like [1], [2]. Keep it under 150 words.\n\n' +
      `Question: ${question}\n\nPassages:\n${context}`;
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 512 },
      }),
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) {
      console.warn('[ask] Gemini API error:', res.status);
      return null;
    }
    const data = await res.json();
    const text = (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('').trim();
    return text || null;
  } catch (e) {
    console.warn('[ask] Gemini failed, using extractive fallback:', e.message);
    return null;
  }
}

module.exports = { search, recent, ask };
