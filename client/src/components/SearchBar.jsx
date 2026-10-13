import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SearchBar({ compact = false, initial = '', auto = false, dark = false }) {
  const [q, setQ] = useState(initial);
  const navigate = useNavigate();

  useEffect(() => {
    setQ(initial);
  }, [initial]);

  useEffect(() => {
    if (!auto || compact) return;
    const t = setTimeout(() => {
      if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`);
    }, 500);
    return () => clearTimeout(t);
  }, [q, navigate, compact, auto]);

  const submit = (e) => {
    e.preventDefault();
    if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <form onSubmit={submit} role="search" className="w-full">
      <div className={`flex items-center gap-2 rounded-xl border transition focus-within:border-brand-600 ${
        dark
          ? 'border-white/10 bg-white/[0.07] focus-within:border-white/25'
          : 'border-[#d5d1e6] bg-white shadow-sm focus-within:border-brand-600'
      } ${compact ? 'py-1 pl-2.5 pr-1' : 'p-1 pl-3.5'}`}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={dark ? 'rgba(255,255,255,.45)' : '#8e89a8'} strokeWidth="2.2" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" /><path d="m20 20-3.8-3.8" />
        </svg>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={compact ? 'Search documents…' : 'Search by question or keyword…'}
          aria-label="Search documents"
          className={`w-full bg-transparent outline-none ${dark ? 'text-white placeholder:text-white/35' : 'placeholder:text-[#a09bc0]'} ${compact ? 'py-1 text-[13px]' : 'py-2 text-sm'}`}
        />
        {!compact ? (
          <span className="mr-1 hidden shrink-0 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] text-slate-400 sm:inline">⌘K</span>
        ) : (
          <button type="submit" className="shrink-0 rounded-md bg-ink-950 px-2.5 py-1 text-xs font-semibold text-white hover:bg-ink-800">
            Go
          </button>
        )}
      </div>
    </form>
  );
}
