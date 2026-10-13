import { useEffect, useState } from 'react';
import api from '../../services/api.js';
import { EmptyState, PageHeader, Spinner } from '../../components/ui.jsx';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => api.get('/users').then(({ data }) => {
    const list = data?.data || data?.users || [];
    setUsers(Array.isArray(list) ? list : []);
  }).catch(() => {}).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const changeRole = async (id, role) => {
    await api.patch(`/users/${id}/role`, { role });
    load();
  };

  const toggleActive = async (u) => {
    const id = u._id || u.id;
    await api.patch(`/users/${id}/status`, { isActive: !u.isActive });
    load();
  };

  return (
    <div>
      <PageHeader title="Manage users" sub="Assign roles and control access — changes apply immediately." />
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-left text-[11px] uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3 font-semibold">Member</th>
                <th className="px-4 py-3 font-semibold">Team</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const id = u._id || u.id;
                return (
                  <tr key={id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <span className="block font-semibold text-slate-900">{u.name}</span>
                      <span className="block text-xs text-slate-400">{u.email}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{u.team || '—'}</td>
                    <td className="px-4 py-3">
                      <select value={u.role} onChange={(e) => changeRole(id, e.target.value)} className="rounded-md border border-[#d5d1e6] bg-white px-2 py-1 text-[13px] font-medium capitalize focus:outline-none">
                        <option value="employee">employee</option>
                        <option value="manager">manager</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${u.isActive === false ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                        {u.isActive === false ? 'Deactivated' : 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => toggleActive(u)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                        {u.isActive === false ? 'Activate' : 'Deactivate'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {loading && <div className="px-4"><Spinner /></div>}
        {!loading && !users.length && <div className="p-6"><EmptyState title="No users" /></div>}
      </div>
    </div>
  );
}
