import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api.js';
import SearchBar from '../components/SearchBar.jsx';
import { EmptyState, PageHeader, Spinner } from '../components/ui.jsx';

export default function SearchResults() {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ask, setAsk] = useState('');
  const [answer, setAnswer] = useState(null);
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    if (!q) { setResults([]); return; }
    setLoading(true);
    api.get('/search', { params: { q, topK: 8 } })
      .then(({ data }) => {
        const list = data?.data || data?.results || [];
        setResults(Array.isArray(list) ? list : []);
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [q]);

  const doAsk = async (e) => {
    e?.preventDefault();
    const question = (ask || q).trim();
    if (!question || asking) return;
    setAsking(true);
    setAnswer(null);
    try {
      const { data } = await api.post('/search/ask', { q: question });
      setAnswer(data?.data || null);
    } catch {
      setAnswer({ summary: 'Could not get an answer right now.', citations: [] });
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Search" sub="Ranked by relevance to your question." />
      <SearchBar initial={q} auto />

      <form onSubmit={doAsk} className="card mt-4 flex flex-wrap items-center gap-2 p-3">
        <input
          value={ask}
          onChange={(e) => setAsk(e.target.value)}
          placeholder={q ? `Ask about “${q}”…` : 'Ask Vaultic anything…'}
          className="input min-w-[200px] flex-1"
          aria-label="Ask Vaultic"
        />
        <button disabled={asking} className="btn-primary shrink-0">
          {asking ? 'Thinking…' : '✦ Ask Vaultic'}
        </button>
      </form>
      {answer && (
        <div className="card mt-3 border-brand-600/20 p-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-brand-600">Grounded answer</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-700">{answer.summary}</p>
          {(answer.citations || []).length > 0 && (
            <ol className="mt-3 space-y-2">
              {answer.citations.map((c) => (
                <li key={c.n} className="rounded-lg bg-slate-50 px-3 py-2 text-[13px]">
                  <span className="font-bold text-brand-700">[{c.n}]</span>{' '}
                  <Link
                    className="font-semibold text-ink-950 hover:underline"
                    to={c.kind === 'faq' ? '/faqs' : `/docs/${c.id}`}
                  >
                    {c.title}
                  </Link>
                  <span className="mt-0.5 block leading-relaxed text-slate-500">…{c.snippet}…</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      <div className="mt-5">
        {loading && <Spinner label={`Searching for “${q}”…`} />}
        {!loading && q && (
          <p className="mb-4 text-sm text-slate-500">
            <b className="text-slate-800">{results.length}</b> result{results.length === 1 ? '' : 's'} for <b className="text-slate-800">“{q}”</b>
          </p>
        )}
        <div className="space-y-3.5">
          {results.map((r, i) => {
            if (r.type === 'faq' && r.faq) {
              const f = r.faq;
              return (
                <article key={f._id || f.id || i} className="card p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">FAQ answer</p>
                  <p className="mt-0.5 text-[15px] font-bold tracking-tight text-ink-950">{f.question}</p>
                  {(r.snippets || []).slice(0, 1).map((s, j) => (
                    <p key={j} className="mt-2 border-l-2 border-brand-100 bg-brand-50 px-3 py-2 text-[13px] leading-relaxed text-slate-600">
                      {String(s).slice(0, 420)}
                    </p>
                  ))}
                  <Link to="/faqs" className="mt-3 inline-block text-[13px] font-semibold text-ink-950 hover:underline">Open in FAQs →</Link>
                </article>
              );
            }
            const doc = r.document || r.doc || r;
            const id = doc._id || doc.id;
            if (!id) return null;
            const score = Number(r.score || 0);
            return (
              <article key={id} className="card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Result {i + 1} · {(score * 100).toFixed(0)}% match</p>
                    <Link to={`/docs/${id}`} className="mt-0.5 block text-[15px] font-bold tracking-tight text-ink-950 hover:underline">
                      {doc.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-slate-400">{doc.category || ''}{doc.team ? ` · ${doc.team}` : ''}{doc.visibility ? ` · ${doc.visibility}` : ''}</p>
                  </div>
                  <div className="hidden w-28 shrink-0 sm:block">
                    <div className="h-1 overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full rounded-full bg-slate-700" style={{ width: `${Math.min(100, Math.max(4, score * 100))}%` }} />
                    </div>
                  </div>
                </div>
                {(r.snippets || (r.snippet ? [r.snippet] : [])).slice(0, 2).map((s, j) => (
                  <blockquote key={j} className="mt-3 border-l-2 border-brand-100 bg-brand-50 px-3 py-2 text-[13px] leading-relaxed text-slate-600">
                    …{String(s).replace(/<[^>]*>/g, '').slice(0, 420)}…
                  </blockquote>
                ))}
                <Link to={`/docs/${id}`} className="mt-3 inline-block text-[13px] font-semibold text-ink-950 hover:underline">Open document →</Link>
              </article>
            );
          })}
        </div>
        {!loading && q && !results.length && (
          <EmptyState title="No results found" sub="Try different wording, or browse the library by category." />
        )}
        {!q && <EmptyState title="Ask anything" sub="Type a question above — Vaultic embeds it and finds the closest passages." />}
      </div>
    </div>
  );
}
