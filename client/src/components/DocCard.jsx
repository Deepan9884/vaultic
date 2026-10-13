import { Link } from 'react-router-dom';

const FILE_TINT = {
  PDF: 'border-[#e3c9c4] bg-[#faf0ee] text-[#9c3b2e]',
  DOCX: 'border-[#c3d4ec] bg-[#eef3fc] text-[#2b4d8f]',
  MD: 'border-[#d8cfae] bg-[#faf6e9] text-[#7a6420]',
  TXT: 'border-[#e3e0f0] bg-[#f0eef8] text-slate-600',
};

function fileLabel(doc) {
  const mt = String(doc.fileType || '').toLowerCase();
  const fp = String(doc.filePath || '');
  if (mt.includes('pdf') || /pdf$/i.test(fp)) return 'PDF';
  if (mt.includes('word') || /\.docx?$/i.test(fp)) return 'DOCX';
  if (mt.includes('markdown') || /\.md$/i.test(fp)) return 'MD';
  if (mt.includes('text') || /\.txt$/i.test(fp)) return 'TXT';
  return (doc.category || 'DOC').slice(0, 4).toUpperCase();
}

function dateStr(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + (d.getFullYear() === new Date().getFullYear() ? '' : ` ${d.getFullYear()}`);
}

export default function DocCard({ doc }) {
  const id = doc._id || doc.id;
  const ft = fileLabel(doc);
  return (
    <Link
      to={`/docs/${id}`}
      className="card group flex flex-col p-4 transition hover:border-ink-950/40 hover:shadow-pop"
    >
      <div className="flex items-center justify-between gap-2">
        <span className={`rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wider ${FILE_TINT[ft] || FILE_TINT.TXT}`}>
          {ft}
        </span>
        <span className="flex items-center gap-1.5 text-[11px] capitalize text-slate-400">
          <span className={`h-1.5 w-1.5 rounded-full ${doc.visibility === 'private' ? 'bg-red-400' : doc.visibility === 'public' ? 'bg-emerald-500' : 'bg-sky-500'}`} />
          {doc.visibility || 'team'}
          {doc.status && doc.status !== 'approved' && <span className="font-semibold text-amber-600">· {doc.status}</span>}
        </span>
      </div>

      <h3 className="mt-2.5 text-[14.5px] font-semibold leading-snug text-ink-950">
        {doc.title}
        <span className="ml-1 inline-block text-slate-300 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100">→</span>
      </h3>
      {doc.description && <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-slate-500">{doc.description}</p>}

      <p className="mt-auto truncate pt-3 text-xs text-slate-500">
        {[doc.category, doc.team, dateStr(doc.updatedAt || doc.createdAt)].filter(Boolean).join('  ·  ')}
        {(doc.tags || []).length > 0 && <span className="text-slate-400">  ·  {(doc.tags || []).slice(0, 3).join(', ')}</span>}
      </p>
    </Link>
  );
}
