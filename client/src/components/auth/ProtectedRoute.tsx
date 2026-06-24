import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute() {
  const credentials = localStorage.getItem('admin_credentials');

  if (!credentials) {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
}
