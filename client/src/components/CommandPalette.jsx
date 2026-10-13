import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function CommandPalette({ open, onClose }) {
  const [q, setQ] = useState('');
  const [docs, setDocs] = useState([]);
  const [recent, setRecent] = useState([]);
  const [sel, setSel] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!open) return;
    setQ('');
    setSel(0);
    setDocs([]);
    setTimeout(() => inputRef.current?.focus(), 30);
    api.get('/search/recent')
      .then(({ data }) => setRecent(data?.data || []))
      .catch(() => setRecent([]));
  }, [open ]);

  useEffect(() => {
    if (!open || !q.trim()) { setDocs([]); return; }
    const t = setTimeout(() => {
      api.get('/documents', { params: { q: q.trim(), limit: 6 } })
        .then(({ data }) => setDocs(data?.data || []))
        .catch(() => setDocs([]));
    }, 200);
    return () => clearTimeout(t);
  }, [q, open]);

  const actions = useMemo(() => {
    const all = [
      { label: 'Go to Home', hint: 'Dashboard', run: () => navigate('/') },
      { label: 'Go to Library', hint: 'Browse', run: () => navigate('/browse') },
      { label: 'Go to FAQs', hint: 'Questions', run: () => navigate('/faqs') },
      { label: 'Go to Saved', hint: 'Bookmarks', run: () => navigate('/bookmarks') },
    ];
    if (user?.role === 'manager' || user?.role === 'admin') {
      all.push({ label: 'Upload a document', hint: 'New', run: () => navigate('/upload') });
    }
    if (user?.role === 'admin') {
      all.push({ label: 'Review queue', hint: 'Admin', run: () => navigate('/admin/approvals') });
      all.push({ label: 'Manage users', hint: 'Admin', run: () => navigate('/admin/users') });
      all.push({ label: 'View reports', hint: 'Admin', run: () => navigate('/admin/analytics') });
    }
    const needle = q.trim().toLowerCase();
    return needle ? all.filter((a) => a.label.toLowerCase().includes(needle)) : all;
  }, [q, navigate, user]);

  const flat = useMemo(() => {
    const list = [...actions.map((a) => ({ kind: 'action', ...a }))];
    if (q.trim()) {
      list.push(...docs.map((d) => ({ kind: 'doc', label: d.title, hint: d.category || '', run: () => navigate(`/docs/${d._id || d.id}`) })));
    } else {
      list.push(...recent.map((r) => ({ kind: 'recent', label: r.query, hint: `${r.count}×`, run: () => navigate(`/search?q=${encodeURIComponent(r.query)}`) })));
    }
    return list;
  }, [actions, docs, recent, q, navigate]);

  useEffect(() => { setSel(0); }, [flat.length]);

  if (!open) return null;

  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, flat.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && flat[sel]) { flat[sel].run(); onClose(); }
  };

  const icon = (kind) => kind === 'doc' ? '▤' : kind === 'recent' ? '◷' : '→';

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-label="Command palette">
      <div className="absolute inset-0 bg-[#2e2950]/40" onClick={onClose} />
      <div className="card relative w-full max-w-xl overflow-hidden !rounded-2xl">
        <div className="flex items-center gap-2 border-b border-[#eceaf4] px-4">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8e89a8" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.8-3.8" /></svg>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="Type a command or search documents…"
            className="w-full bg-transparent py-3.5 text-sm outline-none placeholder:text-[#a09bc0]"
          />
          <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] text-slate-400">esc</span>
        </div>
        <ul className="max-h-[320px] overflow-y-auto p-2">
          {flat.length === 0 && <li className="px-3 py-6 text-center text-sm text-slate-400">No matches — press Enter to run a full search.</li>}
          {flat.map((item, i) => (
            <li key={`${item.kind}-${i}`}>
              <button
                onMouseEnter={() => setSel(i)}
                onClick={() => { item.run(); onClose(); }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm ${i === sel ? 'bg-brand-50' : ''}`}
              >
                <span className="w-4 text-center text-slate-400">{icon(item.kind)}</span>
                <span className="flex-1 truncate font-medium text-ink-950">{item.label}</span>
                {item.hint && <span className="text-xs text-slate-400">{item.hint}</span>}
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-4 border-t border-[#eceaf4] px-4 py-2 text-[11px] text-slate-400">
          <span>↑↓ navigate</span><span>↵ open</span><span>esc close</span>
        </div>
      </div>
    </div>
  );
}
