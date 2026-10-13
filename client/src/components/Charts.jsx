const BAR_COLORS = ['#5b5bd6', '#7a8fc4', '#4f7a6a', '#8a6d3b', '#8a4f5b', '#6f6a8f'];

export function BarChart({ data = [] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (!data.length) return <p className="py-6 text-center text-sm text-slate-400">No data yet.</p>;
  return (
    <div className="space-y-2.5">
      {data.map((d, i) => (
        <div key={d.label}>
          <div className="mb-1 flex items-baseline justify-between text-[13px]">
            <span className="font-medium text-slate-600">{d.label}</span>
            <span className="font-bold text-ink-950">{d.value}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.max(3, (d.value / max) * 100)}%`, background: BAR_COLORS[i % BAR_COLORS.length] }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DonutChart({ data = [] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!total) return <p className="py-6 text-center text-sm text-slate-400">No data yet.</p>;
  const R = 54;
  const C = 2 * Math.PI * R;
  let acc = 0;
  const segs = data.map((d) => {
    const frac = d.value / total;
    const seg = { ...d, offset: acc, len: frac * C };
    acc += frac * C;
    return seg;
  });
  return (
    <div className="flex items-center gap-5">
      <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
        <circle cx="70" cy="70" r={R} fill="none" stroke="#eef0f6" strokeWidth="18" />
        {segs.map((s) => (
          <circle
            key={s.label}
            cx="70"
            cy="70"
            r={R}
            fill="none"
            stroke={s.color}
            strokeWidth="18"
            strokeDasharray={`${Math.max(0, s.len - 2)} ${C - Math.max(0, s.len - 2)}`}
            strokeDashoffset={-s.offset}
            strokeLinecap="butt"
          />
        ))}
        <text x="70" y="66" textAnchor="middle" fontSize="24" fontWeight="400" fill="#23233a" fontFamily="Georgia, 'Times New Roman', serif" transform="rotate(90 70 70)">{total}</text>
        <text x="70" y="82" textAnchor="middle" fontSize="10" fill="#8e89a8" transform="rotate(90 70 70)">docs</text>
      </svg>
      <ul className="space-y-1.5 text-[13px]">
        {segs.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
            <span className="font-medium capitalize text-slate-600">{s.label}</span>
            <span className="font-bold text-ink-950">{s.value}</span>
            <span className="text-slate-400">({Math.round((s.value / total) * 100)}%)</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TrendChart({ data = [] }) {
  // data: [{ day: 'YYYY-MM-DD', count }]
  const W = 560, H = 180, PAD = 32;
  const max = Math.max(1, ...data.map((d) => d.count));
  if (!data.length) return <p className="py-6 text-center text-sm text-slate-400">No data yet.</p>;
  const x = (i) => PAD + (i * (W - PAD * 2)) / Math.max(1, data.length - 1);
  const y = (v) => H - PAD - (v / max) * (H - PAD * 2);
  const pts = data.map((d, i) => `${x(i)},${y(d.count)}`).join(' ');
  const area = `${PAD},${H - PAD} ${pts} ${x(data.length - 1)},${H - PAD}`;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5b5bd6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#5b5bd6" stopOpacity="0.03" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f} x1={PAD} x2={W - PAD} y1={y(max * f)} y2={y(max * f)} stroke="#e7e5f2" strokeWidth="1" />
        ))}
        <polygon points={area} fill="url(#trendFill)" />
        <polyline points={pts} fill="none" stroke="#5b5bd6" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {data.map((d, i) => (
          <circle key={d.day} cx={x(i)} cy={y(d.count)} r="3.5" fill="#fff" stroke="#5b5bd6" strokeWidth="2.5">
            <title>{`${d.day}: ${d.count} search${d.count === 1 ? '' : 'es'}`}</title>
          </circle>
        ))}
        {data.map((d, i) =>
          i % Math.ceil(data.length / 7) === 0 ? (
            <text key={d.day} x={x(i)} y={H - 10} textAnchor="middle" fontSize="10" fill="#8e89a8">
              {d.day.slice(5)}
            </text>
          ) : null
        )}
      </svg>
      <p className="mt-1 text-xs text-slate-400">Searches per day · last 14 days · peak {max}/day</p>
    </div>
  );
}
