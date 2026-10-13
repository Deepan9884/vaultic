import { useEffect, useState } from 'react';
import api from '../../services/api.js';
import DocCard from '../../components/DocCard.jsx';
import { EmptyState, PageHeader, Spinner } from '../../components/ui.jsx';

export default function AdminApprovals() {
  const [pending, setPending] = useState([]);
  const [stale, setStale] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.allSettled([
      api.get('/documents', { params: { status: 'pending', limit: 50 } }),
      api.get('/documents', { params: { stale: 'true', limit: 50 } }),
    ]).then(([p, s]) => {
      if (p.status === 'fulfilled') {
        const list = p.value.data?.data || p.value.data?.docs || [];
        setPending(Array.isArray(list) ? list : []);
      }
      if (s.status === 'fulfilled') {
        const list = s.value.data?.data || s.value.data?.docs || [];
        setStale(Array.isArray(list) ? list : []);
      }
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const act = async (id, action) => {
    await api.post(`/documents/${id}/${action}`);
    load();
  };

  const markReviewed = async (id) => {
    await api.post(`/documents/${id}/review`);
    load();
  };

  return (
    <div className="space-y-8">
      <div>
        <PageHeader title="Pending approvals" sub="Review submissions before they enter semantic search." actions={<span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">{pending.length} awaiting</span>} />
        {loading ? <Spinner /> : pending.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pending.map((d) => {
              const id = d._id || d.id;
              return (
                <div key={id} className="space-y-2">
                  <DocCard doc={d} />
                  <div className="flex gap-2">
                    <button onClick={() => act(id, 'approve')} className="flex-1 rounded-xl bg-emerald-600 py-2 text-sm font-semibold text-white hover:bg-emerald-500">Approve</button>
                    <button onClick={() => act(id, 'reject')} className="flex-1 rounded-xl bg-white py-2 text-sm font-semibold text-red-600 ring-1 ring-inset ring-red-200 hover:bg-red-50">Reject</button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState title="All caught up" sub="Every submission has been reviewed. New uploads will land here." />
        )}
      </div>

      <div>
        <PageHeader title="Needs re-review" sub="Approved docs past their 90-day review date. Confirm they're still accurate." />
        {loading ? <Spinner /> : stale.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stale.map((d) => {
              const id = d._id || d.id;
              return (
                <div key={id} className="space-y-2">
                  <DocCard doc={d} />
                  <button onClick={() => markReviewed(id)} className="btn-secondary w-full !py-2 text-[13px]">
                    Mark reviewed
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState title="Nothing stale" sub="Every approved document is inside its review window." />
        )}
      </div>
    </div>
  );
}
