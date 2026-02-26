import { useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const navigate = useNavigate();
  const userRole = JSON.parse(localStorage.getItem('user') || 'null')?.role;

  useEffect(() => {
    if (!userRole || !allowedRoles.includes(userRole)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  }, [userRole, allowedRoles, navigate]);

  if (!userRole || !allowedRoles.includes(userRole)) {
    return <div className="min-h-screen flex items-center justify-center">Redirecting...</div>;
  }

  return <Outlet />;
};

export default ProtectedRoute;  // ← CRITICAL: THIS LINE FIXES THE ERROR
