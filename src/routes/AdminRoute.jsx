import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AnimatedIcon } from '../components/icons/AnimatedIcon';

export const AdminRoute = () => {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <AnimatedIcon name="Loader2" size={40} autoplay />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (userRole !== 'admin') {
    return <Navigate to="/dashboard/overview" replace />;
  }

  return <Outlet />;
};
