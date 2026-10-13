export function PageHeader({ title, sub, actions }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="page-title">{title}</h1>
        {sub && <p className="page-sub">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ title = 'Nothing here', sub = '', action = null }) {
  return (
    <div className="card px-6 py-10 text-center">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      {sub && <p className="mx-auto mt-1 max-w-sm text-[13px] text-slate-500">{sub}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex items-center gap-2 py-8 text-[13px] text-slate-500">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
      {label}
    </div>
  );
}

export function ErrorBanner({ message }) {
  if (!message) return null;
  return <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">{message}</p>;
}
