import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar } from './Sidebar';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-dark-bg text-slate-900 dark:text-dark-text">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-sm font-medium text-slate-500 dark:text-dark-muted">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isFullHeight = location.pathname.startsWith('/validate');

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-[#F8FAFC] dark:bg-dark-bg text-slate-900 dark:text-dark-text transition-colors overflow-hidden">
      <Sidebar />
      <main
        className={`flex-1 min-w-0 h-full flex flex-col ${
          isFullHeight
            ? 'overflow-hidden p-0'
            : 'overflow-y-auto p-4 sm:p-6 lg:p-8'
        }`}
      >
        <Outlet />
      </main>
    </div>
  );
};

