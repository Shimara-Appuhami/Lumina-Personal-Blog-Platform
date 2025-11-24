import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';

const ProtectedRoute = ({ children, requireMatch = true }) => {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requireMatch && user?._id) {
    const segments = location.pathname.split('/').filter(Boolean);
    if (segments[0] === 'profile') {
      const pathUserId = segments[1];
      if (pathUserId && pathUserId !== user._id) {
        return <Navigate to={`/profile/${user._id}`} replace />;
      }
    }
  }

  return children;
};

export default ProtectedRoute;
