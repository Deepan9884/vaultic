import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import FileDropzone from '../components/FileDropzone.jsx';
import { ErrorBanner, PageHeader } from '../components/ui.jsx';

const CATEGORIES = ['Project', 'API', 'SOP', 'Manual', 'FAQ'];

export default function Upload() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', category: 'SOP', team: '', visibility: 'team', tags: '' });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!file) {
      setError('Attach a file to publish.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File is larger than 10 MB.');
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append('file', file);
      const { data } = await api.post('/documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const doc = data?.data || data?.doc || data;
      const nid = doc?._id || doc?.id;
      navigate(nid ? `/docs/${nid}` : '/browse');
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed — attach a pdf, docx, txt or md file');
    } finally {
      setBusy(false);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Publish a document" sub="It enters review, gets indexed into semantic search on approval." />
      <div className="card p-6 sm:p-8">
        <form onSubmit={submit} className="space-y-4">
          <ErrorBanner message={error} />
          <div>
            <label className="label">Title</label>
            <input className="input" placeholder="e.g. Password reset SOP" value={form.title} onChange={set('title')} required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" placeholder="What is this doc, and when should someone read it?" value={form.description} onChange={set('description')} rows={3} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={set('category')}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Team</label>
              <input className="input" placeholder="eng" value={form.team} onChange={set('team')} />
            </div>
            <div>
              <label className="label">Visibility</label>
              <select className="input" value={form.visibility} onChange={set('visibility')}>
                <option value="public">Public — everyone</option>
                <option value="team">Team — my team</option>
                <option value="private">Private — only me</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Tags</label>
            <input className="input" placeholder="onboarding, auth, billing (comma separated)" value={form.tags} onChange={set('tags')} />
          </div>
          <div>
            <label className="label">File · pdf / docx / txt / md · max 10 MB</label>
            <FileDropzone onFile={setFile} />
          </div>
          <button disabled={busy} className="btn-primary w-full">
            {busy ? 'Publishing & indexing…' : 'Publish document'}
          </button>
        </form>
      </div>
    </div>
  );
}
