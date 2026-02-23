import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function PrivateRoute() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

export function AdminRoute() {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/kitchen" replace />;
  return <Outlet />;
}

export function EmployeeRoute() {
  const { isAuthenticated, isEmployee } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isEmployee) return <Navigate to="/admin/dashboard" replace />;
  return <Outlet />;
}
