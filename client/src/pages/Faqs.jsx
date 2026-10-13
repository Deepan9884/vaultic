import { useEffect, useState } from 'react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { EmptyState, ErrorBanner, PageHeader } from '../components/ui.jsx';

export default function Faqs() {
  const { user } = useAuth();
  const [faqs, setFaqs] = useState([]);
  const [form, setForm] = useState({ question: '', answer: '', team: '', visibility: 'team' });
  const [err, setErr] = useState('');
  const [open, setOpen] = useState(null);
  const canEdit = user && (user.role === 'manager' || user.role === 'admin');

  const load = () => api.get('/faqs').then(({ data }) => {
    const list = data?.data || data?.faqs || [];
    setFaqs(Array.isArray(list) ? list : []);
  }).catch(() => {});
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      await api.post('/faqs', form);
      setForm({ question: '', answer: '', team: '', visibility: 'team' });
      load();
    } catch (ex) {
      setErr(ex.response?.data?.message || 'Could not add FAQ');
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="FAQs" sub="Short answers to questions that come up often." />
      {canEdit && (
        <form onSubmit={create} className="card mb-5 space-y-3 p-5">
          <ErrorBanner message={err} />
          <input className="input" placeholder="Question — e.g. How do I request access?" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} required />
          <textarea className="input" placeholder="Answer…" value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} rows={3} required />
          <div className="flex flex-wrap gap-2.5">
            <input className="input min-w-0 flex-1" placeholder="Team (optional)" value={form.team} onChange={(e) => setForm({ ...form, team: e.target.value })} />
            <select className="input w-full sm:w-auto sm:min-w-[150px] sm:flex-none" value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })}>
              <option value="public">Public</option>
              <option value="team">Team</option>
              <option value="private">Private</option>
            </select>
            <button className="btn-primary shrink-0">Add FAQ</button>
          </div>
        </form>
      )}
      <div className="space-y-2.5">
        {faqs.map((f) => {
          const id = f._id || f.id;
          const isOpen = open === id;
          return (
            <div key={id} className="card overflow-hidden">
              <button onClick={() => setOpen(isOpen ? null : id)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50/60">
                <span className="flex-1 text-sm font-semibold text-ink-950">{f.question}</span>
                <span className={`text-slate-400 transition ${isOpen ? 'rotate-180' : ''}`}>▾</span>
              </button>
              {isOpen && (
                <div className="border-t border-[#e3e0f0] px-4 py-3.5">
                  <p className="text-sm leading-relaxed text-slate-600">{f.answer}</p>
                  {(f.team || f.visibility) && <p className="mt-2 text-xs text-slate-400">{[f.team, f.visibility].filter(Boolean).join(' · ')}</p>}
                </div>
              )}
            </div>
          );
        })}
        {!faqs.length && <EmptyState title="No FAQs yet" sub="Managers can pin the answers everyone keeps asking for." />}
      </div>
    </div>
  );
}
