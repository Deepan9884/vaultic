const TINT = {
  Users: ['bg-[#e7e4f9]', 'text-[#5b5bd6]'],
  Documents: ['bg-[#ddf0e3]', 'text-[#3d7a52]'],
  Pending: ['bg-[#fbeed3]', 'text-[#9a6b1a]'],
  'Storage used': ['bg-[#ddebf9]', 'text-[#2f5f9e]'],
};

const GLYPH = {
  Users: '◉',
  Documents: '▤',
  Pending: '◷',
  'Storage used': '▦',
};

export default function StatsCards({ stats = [] }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((s) => {
        const [bg, fg] = TINT[s.label] || ['bg-[#f0eef8]', 'text-[#6f6a8f]'];
        return (
          <div key={s.label} className="card flex items-center gap-3 px-4 py-3.5">
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[15px] ${bg} ${fg}`}>
              {GLYPH[s.label] || '·'}
            </span>
            <span className="min-w-0">
              <span className="eyebrow block truncate">{s.label}</span>
              <span className="block font-display text-[26px] font-normal leading-tight tracking-normal text-ink-950" style={{ fontVariantNumeric: 'lining-nums' }}>{s.value ?? '—'}</span>
              {s.hint && <span className="block truncate text-xs text-slate-500">{s.hint}</span>}
            </span>
          </div>
        );
      })}
    </div>
  );
}
