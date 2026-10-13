import { useEffect, useState } from 'react';
import api from '../../services/api.js';
import StatsCards from '../../components/StatsCards.jsx';
import { BarChart, DonutChart, TrendChart } from '../../components/Charts.jsx';
import { PageHeader, Spinner } from '../../components/ui.jsx';

const VIS_COLORS = { public: '#3d9e63', team: '#5b5bd6', private: '#c0526b' };

function last14Days(filled) {
  const map = new Map((filled || []).map((d) => [d._id, d.count]));
  const out = [];
  for (let i = 13; i >= 0; i--) {
    const dt = new Date();
    dt.setDate(dt.getDate() - i);
    const key = dt.toISOString().slice(0, 10);
    out.push({ day: key, count: map.get(key) || 0 });
  }
  return out;
}

export default function AdminAnalytics() {
  const [overview, setOverview] = useState(null);
  const [searches, setSearches] = useState([]);
  const [loading, setLoading] = useState(true);

  const exportCsv = async () => {
    const res = await api.get('/analytics/activity', {
      params: { action: 'search', limit: 100, format: 'csv' },
      responseType: 'blob',
    });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vaultic-searches.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  useEffect(() => {
    Promise.allSettled([
      api.get('/analytics/overview'),
      api.get('/analytics/searches'),
    ]).then(([o, s]) => {
      if (o.status === 'fulfilled') setOverview(o.value.data?.data ?? o.value.data);
      if (s.status === 'fulfilled') {
        const list = s.value.data?.data || s.value.data?.searches || [];
        setSearches(Array.isArray(list) ? list : []);
      }
      setLoading(false);
    });
  }, []);

  const categories = (overview?.docsByCategory || []).map((c) => ({
    label: c._id || 'Unset',
    value: c.count,
  }));
  const visibility = (overview?.docsByVisibility || []).map((v) => ({
    label: v._id || 'Unset',
    value: v.count,
    color: VIS_COLORS[v._id] || '#6f6a8f',
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Insights"
        sub="Adoption, content health and what people are actually asking."
        actions={
          <span className="no-print flex gap-2">
            <button onClick={exportCsv} className="btn-secondary !py-2 text-[13px]">
              Export CSV
            </button>
            <button onClick={() => window.print()} className="btn-secondary !py-2 text-[13px]">
              ↓ Download PDF
            </button>
          </span>
        }
      />
      {loading ? <Spinner /> : (
        <>
          {overview && (
            <StatsCards
              stats={[
                { label: 'Users', value: overview.users ?? '—' },
                { label: 'Documents', value: overview.documents ?? '—' },
                { label: 'Pending', value: overview.pending ?? '—', hint: overview.pending ? 'Needs a decision' : 'Queue is clear' },
                { label: 'Storage', value: overview.storageBytes != null ? `${(overview.storageBytes / 1048576).toFixed(1)} MB` : '—' },
              ]}
            />
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="card p-5">
              <h2 className="text-sm font-bold text-ink-950">Documents by category</h2>
              <div className="mt-4">
                <BarChart data={categories} />
              </div>
            </div>
            <div className="card p-5">
              <h2 className="text-sm font-bold text-ink-950">Documents by visibility</h2>
              <div className="mt-4">
                <DonutChart data={visibility} />
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h2 className="text-sm font-bold text-ink-950">Search activity</h2>
            <div className="mt-3">
              <TrendChart data={last14Days(overview?.searchesByDay)} />
            </div>
          </div>

          <div className="card overflow-hidden">
            <h2 className="px-4 pt-4 text-sm font-bold text-ink-950">Recent searches</h2>
            <div className="overflow-x-auto">
              <table className="mt-2 w-full text-sm">
                <thead>
                  <tr className="border-y border-slate-100 bg-slate-50/70 text-left text-[11px] uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-2.5 font-semibold">Query</th>
                    <th className="px-4 py-2.5 font-semibold">User</th>
                    <th className="px-4 py-2.5 font-semibold">Hits</th>
                    <th className="px-4 py-2.5 font-semibold">When</th>
                  </tr>
                </thead>
                <tbody>
                  {searches.map((s, i) => (
                    <tr key={s._id || s.id || i} className="border-b border-slate-50 last:border-0">
                      <td className="px-4 py-2.5 font-medium text-slate-800">{s.query || s.q}</td>
                      <td className="px-4 py-2.5 text-slate-500">{s.userId?.email || s.user?.email || s.userEmail || '—'}</td>
                      <td className="px-4 py-2.5 text-slate-500">{s.metadata?.count ?? s.resultCount ?? '—'}</td>
                      <td className="px-4 py-2.5 text-slate-400">{s.createdAt ? new Date(s.createdAt).toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!searches.length && <p className="px-4 py-6 text-center text-sm text-slate-400">No search data yet.</p>}
          </div>
        </>
      )}
    </div>
  );
}
