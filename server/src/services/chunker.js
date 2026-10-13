function chunkText(text, chunkSize = 600, overlap = 100) {
  const clean = String(text || '').replace(/\r/g, '').trim();
  if (!clean) return [];
  const paras = clean.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const chunks = [];
  let current = '';

  function pushCurrent() {
    const t = current.trim();
    if (t) chunks.push(t);
  }

  for (const para of paras) {
    if ((current + '\n\n' + para).trim().length <= chunkSize || !current) {
      current = current ? current + '\n\n' + para : para;
    } else {
      pushCurrent();
      // overlap: keep last `overlap` chars of previous chunk
      const tail = current.slice(-overlap);
      current = (tail + '\n\n' + para).trim();
      // if a single paragraph is huge, hard-split it
      while (current.length > chunkSize) {
        chunks.push(current.slice(0, chunkSize).trim());
        current = current.slice(chunkSize - overlap).trim();
      }
    }
  }
  pushCurrent();

  // fallback: no paragraph breaks at all
  if (chunks.length === 0) {
    for (let i = 0; i < clean.length; i += chunkSize - overlap) {
      chunks.push(clean.slice(i, i + chunkSize).trim());
    }
  }
  return chunks.filter(Boolean);
}

module.exports = { chunkText };
