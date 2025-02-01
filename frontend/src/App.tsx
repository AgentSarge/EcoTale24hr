import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import { StoreProvider } from './providers/StoreProvider';
import { useAppStore } from './hooks/useAppStore';
import { Navigation } from './components/layout/Navigation';
import { Dashboard } from './components/dashboard/Dashboard';
import { Leaderboard } from './components/leaderboard/Leaderboard';
import { Profile } from './components/profile/Profile';
import { Tasks } from './components/tasks/Tasks';
import { IndustrySelection } from './components/onboarding/IndustrySelection';
import { SustainabilityGoals } from './components/dashboard/SustainabilityGoals';
import { MaterialJourney } from './components/supply-chain/MaterialJourney';
import { SupplierComparison } from './components/supply-chain/SupplierComparison';
import { Login } from './components/auth/Login';
import { Register } from './components/auth/Register';
import { NotFound } from './components/NotFound';

const ErrorFallback = ({ error, resetError }: { error: Error; resetError: () => void }) => (
  <div className="flex min-h-screen items-center justify-center bg-gray-50">
    <div className="rounded-lg bg-white p-8 shadow-lg">
      <h1 className="mb-4 text-2xl font-bold text-red-600">Something went wrong</h1>
      <pre className="mb-4 max-w-lg overflow-auto rounded bg-gray-100 p-4 text-sm">
        {error.message}
      </pre>
      <button
        onClick={resetError}
        className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
      >
        Try again
      </button>
    </div>
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAppStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
    <Navigation />
    <main className="container mx-auto px-4 py-8">
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sustainability-goals"
          element={
            <ProtectedRoute>
              <SustainabilityGoals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/supply-chain"
          element={
            <ProtectedRoute>
              <div className="space-y-8">
                <MaterialJourney />
                <SupplierComparison />
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute>
              <Leaderboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasks"
          element={
            <ProtectedRoute>
              <Tasks />
            </ProtectedRoute>
          }
        />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <IndustrySelection />
            </ProtectedRoute>
          }
        />

        {/* Error Routes */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </main>
  </div>
);

const App: React.FC = () => {
  return (
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <ErrorFallback error={error} resetError={resetError} />
      )}
    >
      <StoreProvider>
        <Router>
          <AppRoutes />
        </Router>
      </StoreProvider>
    </Sentry.ErrorBoundary>
  );
};

export default App;
