import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './store/authStore';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import ToastConfig from './components/Toast';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import NewIdeaPage from './pages/NewIdeaPage';
import IdeaDetailPage from './pages/IdeaDetailPage';
import ValidationPage from './pages/ValidationPage';
import ReportPage from './pages/ReportPage';

// Animated wrapper for route transitions (Prompt 7)
function AnimatedRoutes() {
  const location = useLocation();
  return (
    <div key={location.pathname} className="animate-fadeIn transition-opacity duration-200">
      <Routes location={location}>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Routes inside Layout */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ideas/new"
          element={
            <ProtectedRoute>
              <Layout>
                <NewIdeaPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ideas/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <IdeaDetailPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ideas/:id/validate"
          element={
            <ProtectedRoute>
              <Layout>
                <ValidationPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ideas/:id/report"
          element={
            <ProtectedRoute>
              <Layout>
                <ReportPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastConfig />
      <Router>
        <AnimatedRoutes />
      </Router>
    </AuthProvider>
  );
}
