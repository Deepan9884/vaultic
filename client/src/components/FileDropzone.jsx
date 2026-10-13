import { useRef, useState } from 'react';

function fmtSize(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function FileDropzone({ onFile, accept = '.pdf,.docx,.txt,.md' }) {
  const [drag, setDrag] = useState(false);
  const [file, setFile] = useState(null);
  const inputRef = useRef(null);

  const pick = (f) => {
    if (!f) return;
    setFile(f);
    onFile && onFile(f);
  };

  const clear = (e) => {
    e.stopPropagation();
    setFile(null);
    onFile && onFile(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}
      onClick={() => inputRef.current?.click()}
      className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition ${
        drag ? 'border-brand-600 bg-brand-50' : 'border-[#d5d1e6] bg-white hover:border-brand-500 hover:bg-brand-50/50'
      }`}
    >
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(e) => pick(e.target.files[0])} />
      {file ? (
        <div className="flex items-center justify-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 font-mono text-[10px] font-bold text-brand-700">
            {file.name.split('.').pop()?.toUpperCase().slice(0, 4) || 'FILE'}
          </span>
          <span className="text-left">
            <span className="block max-w-[220px] truncate text-sm font-semibold text-ink-950">{file.name}</span>
            <span className="block text-xs text-slate-400">{fmtSize(file.size)}</span>
          </span>
          <button type="button" onClick={clear} aria-label="Remove file" className="rounded-md px-2 py-1 text-sm text-slate-400 hover:bg-slate-100 hover:text-slate-700">×</button>
        </div>
      ) : (
        <>
          <p className="text-sm font-semibold text-ink-950">{drag ? 'Drop it!' : 'Drop a file here or click to browse'}</p>
          <p className="mt-1 text-xs text-slate-400">PDF, DOCX, TXT, MD · max 10 MB</p>
        </>
      )}
    </div>
  );
}
