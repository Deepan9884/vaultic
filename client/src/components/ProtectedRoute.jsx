import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Spinner } from './ui.jsx';

export default function ProtectedRoute({ children }) {
  const { user, token, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner label="Checking session…" />;
  if (!token || !user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}
