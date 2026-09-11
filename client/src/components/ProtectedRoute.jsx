import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // A brand-new signup has no role yet — send them to finish onboarding (or wait
  // for admin approval) instead of into the app shell.
  if (user.status === 'pending' && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
