import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Spinner } from '../components/ui.jsx';

const Loading = () => <div className="flex min-h-screen items-center justify-center"><Spinner className="h-8 w-8 text-brand" /></div>;

export function ProtectedRoute() {
  const { user, loading } = useAuth(); const loc = useLocation();
  if (loading) return <Loading />;
  return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: loc.pathname }} />;
}
export function PublicOnlyRoute() {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  return user ? <Navigate to="/dashboard" replace /> : <Outlet />;
}
