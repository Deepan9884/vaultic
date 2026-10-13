const DIM = 384;
let _pipe = null;
let _failed = false;

async function getPipeline() {
  if (_pipe) return _pipe;
  if (_failed) return null;
  if (process.env.EMBEDDING_PROVIDER === 'hash') return null;
  try {
    const { pipeline } = require('@xenova/transformers');
    _pipe = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    return _pipe;
  } catch (e) {
    console.warn('[embedder] transformer model unavailable, using hash fallback:', e.message);
    _failed = true;
    return null;
  }
}

// Deterministic offline fallback so the app runs without network/model.
function hashEmbedding(text) {
  const vec = new Array(DIM).fill(0);
  const tokens = String(text || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  if (tokens.length === 0) return vec;
  for (const tok of tokens) {
    let h = 2166136261;
    for (let i = 0; i < tok.length; i++) {
      h ^= tok.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    const idx = Math.abs(h) % DIM;
    vec[idx] += 1;
    const idx2 = Math.abs(Math.imul(h, 31)) % DIM;
    vec[idx2] += 0.5;
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

async function embedChunks(texts) {
  const arr = (texts || []).map((t) => String(t || '').slice(0, 4000));
  if (arr.length === 0) return [];
  const pipe = await getPipeline();
  if (!pipe) return arr.map(hashEmbedding);
  try {
    const out = [];
    for (const t of arr) {
      const res = await pipe(t, { pooling: 'mean', normalize: true });
      const v = res.tolist()[0];
      out.push(Array.from(v));
    }
    return out;
  } catch (e) {
    console.warn('[embedder] inference failed, hash fallback:', e.message);
    _failed = true;
    return arr.map(hashEmbedding);
  }
}

async function getQueryEmbedding(query) {
  const vecs = await embedChunks([query]);
  return vecs[0] || new Array(DIM).fill(0);
}

function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

module.exports = { embedChunks, getQueryEmbedding, cosineSimilarity, DIM };
