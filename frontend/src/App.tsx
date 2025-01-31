import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { useAuthStore } from './stores/authStore';
import { AuthForm } from './components/auth/AuthForm';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Layout component with navigation
const Layout = ({ children }: { children: React.ReactNode }) => {
  const { signOut } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">EcoTale</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => signOut()}
                className="ml-4 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

// Dashboard component with actual content
const Dashboard = () => (
  <div className="bg-white shadow rounded-lg p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h2>
    <p className="text-gray-600">Welcome to EcoTale! Your eco-journey starts here.</p>
  </div>
);

function App() {
  const { setSession } = useAuthStore();

  useEffect(() => {
    // Check active sessions and set the initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session ? { user: session.user, session } : null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ? { user: session.user, session } : null);
    });

    return () => subscription.unsubscribe();
  }, [setSession]);

  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<AuthForm />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
