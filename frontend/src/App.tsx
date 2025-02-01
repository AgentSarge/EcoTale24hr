import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { Navigation } from './components/layout/Navigation';
import { AuthForm } from './components/auth/AuthForm';
import { Dashboard } from './components/dashboard/Dashboard';
import { Leaderboard } from './components/leaderboard/Leaderboard';
import { Profile } from './components/profile/Profile';
import { Tasks } from './components/tasks/Tasks';
import { useProfileStore } from './stores/profileStore';
import { useTaskStore } from './stores/taskStore';
import { IndustrySelection } from './components/onboarding/IndustrySelection';
import { SustainabilityGoals } from './components/dashboard/SustainabilityGoals';
import { MaterialJourney } from './components/supply-chain/MaterialJourney';
import { SupplierComparison } from './components/supply-chain/SupplierComparison';
import { Login } from './components/auth/Login';
import { Register } from './components/auth/Register';
import { NotFound } from './components/NotFound';
import { securityMiddleware } from '@/middleware/security';
import { auditLogger } from '@/utils/auditLogger';
import { useLocation } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import { StoreProvider } from './providers/StoreProvider';
import { Router as CustomRouter } from './Router';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { session } = useAuthStore();
  return session ? <>{children}</> : <Navigate to="/auth" />;
};

const ErrorFallback = ({ error }: { error: Error }) => (
  <div className="flex min-h-screen items-center justify-center bg-gray-50">
    <div className="rounded-lg bg-white p-8 shadow-lg">
      <h1 className="mb-4 text-2xl font-bold text-red-600">Something went wrong</h1>
      <pre className="mb-4 max-w-lg overflow-auto rounded bg-gray-100 p-4 text-sm">
        {error.message}
      </pre>
      <button
        onClick={() => window.location.reload()}
        className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
      >
        Try again
      </button>
    </div>
  </div>
);

const App: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  const { fetchProfile } = useProfileStore();
  const { generateTasks } = useTaskStore();
  const location = useLocation();

  useEffect(() => {
    // Initialize security headers
    securityMiddleware.setupSecurityHeaders();

    // Log application start
    auditLogger.logSystem('app_initialized', {
      timestamp: new Date().toISOString(),
      environment: import.meta.env.MODE,
    });
  }, []);

  useEffect(() => {
    if (user) {
      auditLogger.logAuth('user_session_start', {
        userId: user.id,
        email: user.email,
      });
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
    generateTasks();
  }, [fetchProfile, generateTasks]);

  return (
    <Sentry.ErrorBoundary
      fallback={(errorData) => <ErrorFallback error={errorData.error as Error} />}
    >
      <StoreProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Navigation />
            <main className="container mx-auto px-4 py-8">
              <Routes>
                {/* Public Routes */}
                <Route
                  path="/"
                  element={
                    isAuthenticated ? (
                      <Navigate to="/dashboard" replace />
                    ) : (
                      <Navigate to="/login" replace />
                    )
                  }
                />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected Routes */}
                <Route
                  path="/onboarding"
                  element={
                    isAuthenticated ? <IndustrySelection /> : <Navigate to="/login" replace />
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />
                  }
                />
                <Route
                  path="/sustainability-goals"
                  element={
                    isAuthenticated ? <SustainabilityGoals /> : <Navigate to="/login" replace />
                  }
                />
                <Route
                  path="/supply-chain"
                  element={
                    isAuthenticated ? (
                      <div className="space-y-8">
                        <MaterialJourney />
                        <SupplierComparison />
                      </div>
                    ) : (
                      <Navigate to="/login" replace />
                    )
                  }
                />
                <Route
                  path="/profile"
                  element={
                    isAuthenticated ? <Profile /> : <Navigate to="/login" replace />
                  }
                />
                <Route
                  path="/leaderboard"
                  element={
                    isAuthenticated ? <Leaderboard /> : <Navigate to="/login" replace />
                  }
                />

                {/* Error Routes */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </Router>
      </StoreProvider>
    </Sentry.ErrorBoundary>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (!user && !isLoading) {
      auditLogger.logSecurity('unauthorized_access_attempt', {
        path: location.pathname,
      });
    }
  }, [user, isLoading, location]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default App;
