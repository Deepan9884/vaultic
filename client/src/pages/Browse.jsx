import { useEffect, useState } from 'react';
import api from '../services/api.js';
import DocCard from '../components/DocCard.jsx';
import { EmptyState, PageHeader, Spinner } from '../components/ui.jsx';

const CATEGORIES = ['', 'Project', 'API', 'SOP', 'Manual', 'FAQ'];

export default function Browse() {
  const [docs, setDocs] = useState([]);
  const [filters, setFilters] = useState({ category: '', team: '', q: '' });
  const [loading, setLoading] = useState(false);

  const fetchDocs = async (override) => {
    setLoading(true);
    try {
      const f = override || filters;
      const params = {};
      if (f.category) params.category = f.category;
      if (f.team) params.team = f.team;
      if (f.q) params.q = f.q;
      const { data } = await api.get('/documents', { params });
      const list = data?.data || data?.docs || [];
      setDocs(Array.isArray(list) ? list : []);
    } catch {
      setDocs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearFilters = () => {
    const empty = { category: '', team: '', q: '' };
    setFilters(empty);
    fetchDocs(empty);
  };

  return (
    <div>
      <PageHeader
        title="Browse library"
        sub="Everything you're permitted to see — filter by category, team or keyword."
        actions={
          <>
            {(filters.category || filters.team || filters.q) && (
              <button onClick={clearFilters} className="btn-secondary !py-2">Clear</button>
            )}
            <button onClick={() => fetchDocs()} className="btn-primary !py-2">Apply filters</button>
          </>
        }
      />
      <div className="card mb-5 flex flex-wrap gap-2.5 p-3.5">
        <input className="input min-w-[180px] flex-1" placeholder="Keyword…" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && fetchDocs()} />
        <select className="input min-w-[160px] flex-1" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c || 'All categories'}</option>)}
        </select>
        <input className="input min-w-[140px] flex-1" placeholder="Team…" value={filters.team} onChange={(e) => setFilters({ ...filters, team: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && fetchDocs()} />
      </div>

      {!loading && docs.length > 0 && (
        <p className="mb-3 text-[13px] text-slate-500">
          {docs.length} document{docs.length === 1 ? '' : 's'}
          {(filters.category || filters.team || filters.q) ? ' match your filters' : ' in your library'}
        </p>
      )}
      {loading ? <Spinner /> : docs.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((d) => <DocCard key={d._id || d.id} doc={d} />)}
        </div>
      ) : (
        <EmptyState title="No documents found" sub="Try widening the filters — or upload the missing doc and it will appear here after approval." />
      )}
    </div>
  );
}
