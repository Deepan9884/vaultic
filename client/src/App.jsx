import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import Sidebar from './components/Sidebar.jsx';
import CommandPalette from './components/CommandPalette.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import RoleGuard from './components/RoleGuard.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Browse from './pages/Browse.jsx';
import DocDetail from './pages/DocDetail.jsx';
import Upload from './pages/Upload.jsx';
import SearchResults from './pages/SearchResults.jsx';
import Faqs from './pages/Faqs.jsx';
import Bookmarks from './pages/Bookmarks.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';
import AdminApprovals from './pages/admin/AdminApprovals.jsx';
import AdminAnalytics from './pages/admin/AdminAnalytics.jsx';

function Shell({ children }) {
  const [palette, setPalette] = useState(false);

  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPalette((v) => !v);
      }
      if (e.key === 'Escape') setPalette(false);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  return (
    <div className="min-h-screen">
      <CommandPalette open={palette} onClose={() => setPalette(false)} />
      <Sidebar />
      <div className="min-w-0 flex-1 lg:pl-60 print:pl-0">
        <main className="mx-auto max-w-7xl px-4 py-7 sm:px-8">{children}</main>
        <footer className="mx-auto max-w-7xl px-4 pb-8 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#e3e0f0] pt-4 text-xs font-medium text-slate-500">
            <span>Vaultic · Internal document portal</span>
            <span>Access is role-based and logged</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { pathname } = useLocation();
  const bare = pathname === '/login' || pathname === '/register';
  const routes = (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/browse" element={<ProtectedRoute><Browse /></ProtectedRoute>} />
      <Route path="/docs/:id" element={<ProtectedRoute><DocDetail /></ProtectedRoute>} />
      <Route path="/search" element={<ProtectedRoute><SearchResults /></ProtectedRoute>} />
      <Route path="/faqs" element={<ProtectedRoute><Faqs /></ProtectedRoute>} />
      <Route path="/bookmarks" element={<ProtectedRoute><Bookmarks /></ProtectedRoute>} />
      <Route path="/upload" element={<ProtectedRoute><RoleGuard roles={['manager', 'admin']}><Upload /></RoleGuard></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute><RoleGuard roles={['admin']}><AdminUsers /></RoleGuard></ProtectedRoute>} />
      <Route path="/admin/approvals" element={<ProtectedRoute><RoleGuard roles={['admin']}><AdminApprovals /></RoleGuard></ProtectedRoute>} />
      <Route path="/admin/analytics" element={<ProtectedRoute><RoleGuard roles={['admin']}><AdminAnalytics /></RoleGuard></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
  if (bare) return routes;
  return <Shell>{routes}</Shell>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
