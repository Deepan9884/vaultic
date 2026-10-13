import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import DocCard from '../components/DocCard.jsx';
import StatsCards from '../components/StatsCards.jsx';
import SearchBar from '../components/SearchBar.jsx';
import { EmptyState, Spinner } from '../components/ui.jsx';

const listOf = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.docs)) return payload.docs;
  if (Array.isArray(payload?.bookmarks)) return payload.bookmarks;
  return [];
};
const docOf = (b) => b?.documentId || b?.doc || b;

function timeAgo(iso) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function ActivityRow({ a }) {
  const who = a.userId?.name || a.userId?.email || 'Someone';
  const what =
    a.action === 'search' ? `searched “${a.query}”`
    : a.action === 'upload' ? 'uploaded a document'
    : a.action === 'login' ? 'signed in'
    : a.action === 'approve' ? 'approved a document'
    : a.action === 'bookmark' ? 'saved a document'
    : a.action.replace(/_/g, ' ');
  return (
<li className="flex items-baseline justify-between gap-3 border-b border-[#eeecf6] py-2 text-[13px] last:border-0">
      <span className="truncate text-slate-600"><b className="font-semibold text-ink-950">{who}</b> {what}</span>
      <span className="shrink-0 text-xs font-medium text-slate-500">{a.createdAt ? timeAgo(a.createdAt) : ''}</span>
    </li>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [recent, setRecent] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const isManager = user?.role === 'manager' || user?.role === 'admin';

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      api.get('/documents', { params: { limit: 6 } }),
      api.get('/bookmarks'),
      user?.role === 'admin' ? api.get('/analytics/overview') : Promise.resolve(null),
    ]).then(([r, b, o]) => {
      if (r.status === 'fulfilled') setRecent(listOf(r.value.data));
      if (b.status === 'fulfilled') setBookmarks(listOf(b.value.data));
      if (o?.status === 'fulfilled' && o.value) setOverview(o.value.data?.data ?? o.value.data);
      setLoading(false);
    });
  }, [user]);

  const first = (user?.name || user?.email || '').split(' ')[0];

  return (
    <div className="space-y-7">
      <section className="rounded-2xl bg-lilac px-5 py-6 shadow-sm sm:px-7">
        <p className="eyebrow">{user?.team ? `Team ${user.team}` : 'Workspace'} · {user?.role}</p>
        <h1 className="mt-1 font-display text-[32px] font-normal leading-tight text-[#2e2950]">
          Welcome back{first ? `, ${first}` : ''}.
        </h1>
        <div className="mt-4">
          <SearchBar />
        </div>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
          <Link to="/browse" className="card group flex items-center gap-3 px-4 py-3 transition hover:border-[#c9c4e4]">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#e7e4f9] text-brand-600">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5" /></svg>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-semibold text-[#2e2950]">Browse library</span>
              <span className="block truncate text-xs text-slate-400">Everything shared with you</span>
            </span>
            <span className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600">→</span>
          </Link>
          {isManager ? (
            <Link to="/upload" className="flex items-center gap-3 rounded-[14px] bg-brand-600 px-4 py-3 shadow-sm transition hover:bg-brand-700">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/15 text-white">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15V5m0 0-4 4m4-4 4 4" /><path d="M4 20h16" /></svg>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold text-white">Upload</span>
                <span className="block truncate text-xs text-white/65">Publish a document</span>
              </span>
              <span className="shrink-0 text-white/60">→</span>
            </Link>
          ) : (
            <Link to="/bookmarks" className="card group flex items-center gap-3 px-4 py-3 transition hover:border-[#c9c4e4]">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#fbeed3] text-[#9a6b1a]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12v18l-6-4.5L6 21Z" /></svg>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold text-[#2e2950]">Saved</span>
                <span className="block truncate text-xs text-slate-400">Your bookmarked docs</span>
              </span>
              <span className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600">→</span>
            </Link>
          )}
          <Link to="/faqs" className="card group flex items-center gap-3 px-4 py-3 transition hover:border-[#c9c4e4]">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#ddf0e3] text-[#3d7a52]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8 8 0 0 1-8 8H4l2-3a8 8 0 1 1 15-5Z" /><path d="M9.5 12h.01M12 12h.01M14.5 12h.01" /></svg>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-semibold text-[#2e2950]">FAQs</span>
              <span className="block truncate text-xs text-slate-400">Quick answers</span>
            </span>
            <span className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600">→</span>
          </Link>
        </div>
      </section>

      {user?.role === 'admin' && overview && (
        <StatsCards
          stats={[
            { label: 'Users', value: overview.users ?? '—' },
            { label: 'Documents', value: overview.documents ?? '—' },
            { label: 'Pending', value: overview.pending ?? '—', hint: overview.pending ? 'Needs a decision' : 'Queue is clear' },
            { label: 'Storage used', value: overview.storageBytes != null ? `${(overview.storageBytes / 1048576).toFixed(1)} MB` : '—' },
          ]}
        />
      )}

      {loading ? <Spinner label="Loading…" /> : (
        <>
          <section>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-sm font-bold text-ink-950">Recently added</h2>
              <Link className="text-[13px] font-medium text-slate-500 hover:text-ink-950 hover:underline" to="/browse">View all</Link>
            </div>
            {recent.length ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {recent.map((d) => <DocCard key={d._id || d.id} doc={d} />)}
              </div>
            ) : (
              <EmptyState title="No documents yet" sub="Once your team uploads procedures and specs, the latest will show up here." />
            )}
          </section>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
            <section>
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="text-sm font-bold text-ink-950">Saved by you</h2>
                <Link className="text-[13px] font-medium text-slate-500 hover:text-ink-950 hover:underline" to="/bookmarks">View all</Link>
              </div>
              {bookmarks.length ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {bookmarks.slice(0, 4).map((b, i) => {
                    const d = docOf(b);
                    if (!d?._id && !d?.id) return null;
                    return <DocCard key={d._id || d.id || i} doc={d} />;
                  })}
                </div>
              ) : (
                <EmptyState title="Nothing saved" sub="Open a document and save it to keep it one click away." />
              )}
            </section>

            {user?.role === 'admin' && (overview?.recentActivity || []).length > 0 && (
              <section>
                <div className="mb-3 flex items-baseline justify-between">
                  <h2 className="text-sm font-bold text-ink-950">Latest activity</h2>
                  <Link className="text-[13px] font-medium text-slate-500 hover:text-ink-950 hover:underline" to="/admin/analytics">Reports</Link>
                </div>
                <ul className="card px-4 py-2">
                  {overview.recentActivity.slice(0, 8).map((a) => <ActivityRow key={a._id || a.id} a={a} />)}
                </ul>
              </section>
            )}
          </div>
        </>
      )}
    </div>
  );
}
