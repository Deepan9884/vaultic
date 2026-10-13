import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { ErrorBanner, Spinner } from '../components/ui.jsx';

export default function DocDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [doc, setDoc] = useState(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/documents/${id}`);
      setDoc(data?.data || data?.doc || data);
    } catch {
      setDoc(null);
    } finally {
      setLoading(false);
    }
    try {
      const { data } = await api.get('/bookmarks');
      const list = data?.data || data?.bookmarks || [];
      setBookmarked(
        (Array.isArray(list) ? list : []).some((b) => String(b.documentId?._id || b.documentId || b.doc?._id) === String(id))
      );
    } catch { /* ignore */ }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const downloadFile = async () => {
    setMsg('');
    try {
      const res = await api.get(`/documents/${id}/file`, { responseType: 'blob' });
      const disp = res.headers['content-disposition'] || '';
      const m = /filename="([^"]+)"/.exec(disp);
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = (m && m[1]) || 'document';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (e) {
      setMsg('Download failed — you may not have access, or no file is stored.');
    }
  };

  const toggleBookmark = async () => {    setMsg('');
    try {
      if (bookmarked) {
        await api.delete(`/bookmarks/${id}`);
        setBookmarked(false);
      } else {
        await api.post('/bookmarks', { documentId: id });
        setBookmarked(true);
      }
    } catch (e) {
      setMsg(e.response?.data?.message || 'Could not update bookmarks.');
    }
  };

  const moderate = async (action) => {
    setMsg('');
    try {
      await api.post(`/documents/${id}/${action}`);
      load();
    } catch (e) {
      setMsg(e.response?.data?.message || 'Action failed.');
    }
  };

  if (loading) return <Spinner label="Opening…" />;
  if (!doc) return <p className="card p-8 text-center text-sm text-slate-500">This document doesn't exist or isn't shared with you. <Link className="font-semibold text-brand-700 hover:underline" to="/browse">Back to the library</Link></p>;

  const meta = [
    doc.category, doc.team, doc.visibility,
    doc.fileSize > 0 ? `${(doc.fileSize / 1024).toFixed(0)} KB` : null,
  ].filter(Boolean);

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/browse" className="text-[13px] font-medium text-slate-400 hover:text-ink-950 hover:underline">← Library</Link>

      <p className="eyebrow mt-4">{meta.join('   ·   ')}</p>
      <h1 className="mt-1.5 font-display text-[32px] font-normal leading-[1.2] text-ink-950">{doc.title}</h1>
      {(doc.uploadedBy?.name || doc.status !== 'approved') && (
        <p className="mt-2 text-[13px] text-slate-400">
          {doc.uploadedBy?.name ? `Written by ${doc.uploadedBy.name}` : ''}
          {doc.status && doc.status !== 'approved' ? `  ·  ${doc.status} review` : ''}
        </p>
      )}

      <div className="mt-5 space-y-4">
        <ErrorBanner message={msg} />
        {doc.description && <p className="text-[15px] leading-relaxed text-slate-600">{doc.description}</p>}

        <div className="flex flex-wrap gap-2 border-y border-[#e3e0f0] py-3.5">
          <button onClick={downloadFile} className="btn-secondary">
            Download file
          </button>
          <button onClick={toggleBookmark} className={bookmarked ? 'btn-secondary' : 'btn-primary'}>
            {bookmarked ? 'Saved ✓' : 'Save for later'}
          </button>
          {user?.role === 'admin' && doc.status === 'pending' && (
            <>
              <button onClick={() => moderate('approve')} className="rounded-lg bg-emerald-700 px-4 py-2 text-[13px] font-semibold text-white hover:bg-emerald-600">Approve</button>
              <button onClick={() => moderate('reject')} className="btn-secondary !text-red-700">Reject</button>
            </>
          )}
        </div>

        {(doc.tags || []).length > 0 && (
          <p className="text-[13px] text-slate-400">{doc.tags.map((t) => `#${t}`).join('  ')}</p>
        )}
      </div>
    </div>
  );
}
