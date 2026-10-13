const Document = require('../models/Document');
const DocumentChunk = require('../models/DocumentChunk');
const Faq = require('../models/Faq');
const { getQueryEmbedding, cosineSimilarity } = require('./embedder');
const { buildDocFilter, canAccessDoc, canAccessFaq } = require('../utils/visibility');

function tokenize(s) {
  return String(s || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2);
}

function escapeRegExp(s) {
  return String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function vectorDocHits(qvec, user, topK, category) {
  const match = {};
  if (category) match.category = category;

  // Pull candidate chunks (cap for in-memory cosine rank).
  // When Atlas Vector Search is configured, replace this block with a $vectorSearch aggregation.
  const chunks = await DocumentChunk.find(match)
    .sort({ createdAt: -1 })
    .limit(2000)
    .populate('documentId');

  const scored = [];
  for (const c of chunks) {
    const doc = c.documentId;
    if (!doc || !doc._id) continue;
    if (doc.isDeleted) continue;
    if (!canAccessDoc(user, doc)) continue;
    if (!c.embedding || c.embedding.length === 0) continue;
    const score = cosineSimilarity(qvec, c.embedding);
    scored.push({ chunk: c, doc, score });
  }

  scored.sort((a, b) => b.score - a.score);

  const grouped = new Map();
  for (const s of scored) {
    const id = String(s.doc._id);
    if (!grouped.has(id)) {
      grouped.set(id, { type: 'document', document: s.doc, score: s.score, snippets: [s.chunk.text.slice(0, 500)] });
    } else {
      const g = grouped.get(id);
      if (g.snippets.length < 3) g.snippets.push(s.chunk.text.slice(0, 500));
      if (s.score > g.score) g.score = s.score;
    }
    if (grouped.size >= topK && scored.indexOf(s) > topK * 10) break;
  }

  return [...grouped.values()].slice(0, topK);
}

// FAQs are short and question-shaped: token-overlap ranks them well
// without embedding every FAQ on each query.
async function faqHitsFor(user, query) {
  const qTokens = new Set(tokenize(query));
  if (!qTokens.size) return [];
  const faqs = await Faq.find({}).sort({ createdAt: -1 }).limit(500);
  const scored = [];
  for (const f of faqs) {
    if (!canAccessFaq(user, f)) continue;
    const fTokens = new Set(tokenize(`${f.question} ${f.answer} ${(f.tags || []).join(' ')}`));
    let inter = 0;
    for (const t of qTokens) if (fTokens.has(t)) inter++;
    if (!inter) continue;
    scored.push({
      type: 'faq',
      faq: f,
      score: Math.min(0.95, 0.35 + 0.12 * inter),
      snippets: [String(f.answer).slice(0, 420)],
    });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 5);
}

// Keyword fallback: fills gaps when embeddings miss (e.g. exact IDs,
// names, or terms the model scores low). RBAC-filtered like everything else.
async function keywordDocHits(user, query, excludeIds, limit, category) {
  const words = [...new Set(tokenize(query))].map(escapeRegExp);
  if (!words.length || limit <= 0) return [];
  const rx = new RegExp(words.join('|'), 'i');
  const and = [
    buildDocFilter(user),
    { _id: { $nin: excludeIds } },
    { $or: [{ title: rx }, { description: rx }, { tags: rx }] },
  ];
  if (category) and.push({ category });
  const docs = await Document.find({ $and: and })
    .populate('uploadedBy', 'name email')
    .sort({ createdAt: -1 })
    .limit(limit);
  return docs.map((d) => ({
    type: 'document',
    document: d,
    score: 0.3,
    snippets: [String(d.description || d.title).slice(0, 420)],
  }));
}

async function semanticSearch(query, user, opts = {}) {
  const topK = Math.min(parseInt(opts.topK || '5', 10) || 5, 20);
  const category = opts.category;
  const qvec = await getQueryEmbedding(query);

  const [docs, faqs] = await Promise.all([
    vectorDocHits(qvec, user, topK, category),
    faqHitsFor(user, query),
  ]);

  const merged = [...docs];
  const seen = new Set(docs.map((d) => String(d.document._id)));
  for (const f of faqs) {
    if (merged.length >= topK + 3) break;
    merged.push(f);
  }

  if (merged.length < topK) {
    const kw = await keywordDocHits(user, query, [...seen], topK - merged.length, category);
    merged.push(...kw);
  }

  return merged.slice(0, topK + 3);
}

module.exports = { semanticSearch };
