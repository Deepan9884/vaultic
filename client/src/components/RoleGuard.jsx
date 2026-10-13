import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Spinner } from './ui.jsx';

export default function RoleGuard({ roles = [], children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner label="Checking session…" />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles.length && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}
