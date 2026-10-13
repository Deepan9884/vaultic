import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import SearchBar from './SearchBar.jsx';
import Logo from './Logo.jsx';

const PATHS = {
  home: (<><path d="M3 10.5 12 3l9 7.5" /><path d="M5 10v10h5v-6h4v6h5V10" /></>),
  library: (<><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5" /></>),
  faq: (<><path d="M21 12a8 8 0 0 1-8 8H4l2-3a8 8 0 1 1 15-5Z" /><path d="M9.5 12h.01M12 12h.01M14.5 12h.01" /></>),
  saved: (<><path d="M6 3h12v18l-6-4.5L6 21Z" /></>),
  upload: (<><path d="M12 15V5m0 0-4 4m4-4 4 4" /><path d="M4 20h16" /></>),
  review: (<><circle cx="12" cy="12" r="9" /><path d="m8.5 12.5 2.5 2.5 5-5.5" /></>),
  users: (<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" /><path d="M16 5.2a2.8 2.8 0 0 1 0 5.6M17.5 14.6c2.2.7 4 2.5 4 5.4" /></>),
  reports: (<><path d="M5 20v-8M11 20V5M17 20v-5" /><path d="M3 20h18" /></>),
};

function NavIcon({ name }) {
  return (
    <span className="nav-ic grid h-5 w-5 shrink-0 place-items-center">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        {PATHS[name]}
      </svg>
    </span>
  );
}

const itemCls = ({ isActive }) =>
  `group flex items-center gap-2.5 rounded-xl px-3 py-[7px] text-[13.5px] font-medium transition ${
    isActive
      ? 'rounded-lg bg-white text-[#2e2950] shadow-sm'
      : 'text-[#5a5478] hover:bg-white/60 hover:text-[#2e2950]'
  }`;

function Section({ label, children }) {
  return (
    <div className="mt-6 first:mt-2">
      <p className="px-3 text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#8e89a8]">{label}</p>
      <div className="mt-1.5 space-y-0.5">{children}</div>
    </div>
  );
}

const HUES = ['#b08968', '#7d9b76', '#7a8fc4', '#c48fad', '#8a7ac4'];
const hueFor = (s = '') => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 997;
  return HUES[h % HUES.length];
};

function SidebarBody({ onNav }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState(0);

  const isManager = user && (user.role === 'manager' || user.role === 'admin');
  const isAdmin = user && user.role === 'admin';

  useEffect(() => {
    if (!isAdmin) return;
    api.get('/documents', { params: { status: 'pending', limit: 1 } })
      .then(({ data }) => setPending(data?.total ?? (data?.data || []).length ?? 0))
      .catch(() => {});
  }, [isAdmin]);

  return (
    <div className="flex h-full flex-col px-3 py-4">
      <Link to="/" onClick={onNav} className="px-1.5" aria-label="Vaultic home">
        <Logo />
      </Link>

      {user && (
        <div className="mt-4">
          <SearchBar compact />
        </div>
      )}

      <nav className="mt-3 flex-1 overflow-y-auto">
        {user ? (
          <>
            <Section label="Workspace">
              <NavLink className={itemCls} to="/" end onClick={onNav}><NavIcon name="home" />Home</NavLink>
              <NavLink className={itemCls} to="/browse" onClick={onNav}><NavIcon name="library" />Library</NavLink>
              <NavLink className={itemCls} to="/faqs" onClick={onNav}><NavIcon name="faq" />FAQs</NavLink>
              <NavLink className={itemCls} to="/bookmarks" onClick={onNav}><NavIcon name="saved" />Saved</NavLink>
            </Section>
            {isManager && (
              <Section label="Contribute">
                <NavLink className={itemCls} to="/upload" onClick={onNav}><NavIcon name="upload" />Upload</NavLink>
              </Section>
            )}
            {isAdmin && (
              <Section label="Administer">
                <NavLink className={itemCls} to="/admin/approvals" onClick={onNav}>
                  <NavIcon name="review" />Review
                  {pending > 0 && (
                    <span className="ml-auto rounded-full bg-[#f2b950] px-1.5 py-px text-[10px] font-bold text-[#4a3200]">{pending}</span>
                  )}
                </NavLink>
                <NavLink className={itemCls} to="/admin/users" onClick={onNav}><NavIcon name="users" />Users</NavLink>
                <NavLink className={itemCls} to="/admin/analytics" onClick={onNav}><NavIcon name="reports" />Reports</NavLink>
              </Section>
            )}
          </>
        ) : (
          <Section label="Account">
            <NavLink className={itemCls} to="/login" onClick={onNav}>Sign in</NavLink>
            <NavLink className={itemCls} to="/register" onClick={onNav}>Create account</NavLink>
          </Section>
        )}
      </nav>

      {user && (
        <div className="mt-3 rounded-xl bg-white/70 p-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <span
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold text-white"
              style={{ background: hueFor(user.email) }}
            >
              {(user.name || user.email || '–').charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-[13px] font-semibold text-[#2e2950]">{user.name || user.email}</span>
              <span className="block text-[11px] capitalize text-[#8e89a8]">{user.role}{user.team ? ` · ${user.team}` : ''}</span>
            </span>
          </div>
          <button
            onClick={() => { logout(); onNav && onNav(); navigate('/login'); }}
            className="mt-2.5 w-full rounded-lg border border-[#d5d1e6] px-2.5 py-1.5 text-xs font-semibold text-[#5a5478] transition hover:bg-white"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 border-r border-[#d9d4ec] bg-lilac lg:block">
        <SidebarBody />
      </aside>

      {/* mobile top bar */}
      <div className="no-print sticky top-0 z-40 flex items-center gap-2 border-b border-[#e3e0f0] bg-paper px-4 py-2.5 lg:hidden">
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="rounded-md border border-[#e3e0f0] bg-white px-2.5 py-1.5 text-sm">
          ☰
        </button>
        <Link to="/" aria-label="Vaultic home"><Logo size={26} /></Link>
      </div>

      {/* mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-[#2e2950]/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-lilac shadow-xl">
            <SidebarBody onNav={() => setOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
