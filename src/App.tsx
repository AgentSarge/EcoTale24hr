import React from 'react';
import { ErrorBoundary } from '@sentry/react';

const ErrorFallback: React.FC<{ error: Error }> = ({ error }) => (
  <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
      <h2 className="text-red-600 text-xl font-bold mb-4">Something went wrong:</h2>
      <pre className="text-sm bg-red-50 p-4 rounded overflow-auto">
        {error.message}
      </pre>
    </div>
  </div>
);

const TestError: React.FC = () => {
  const throwError = () => {
    throw new Error('This is a test error for Sentry!');
  };

  return (
    <button
      onClick={throwError}
      className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
    >
      Throw Test Error
    </button>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary fallback={ErrorFallback}>
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-4xl font-bold text-primary-800 mb-8">
            EcoTale24hr
          </h1>
          <div className="bg-white rounded-lg shadow-xl p-6">
            <h2 className="text-2xl font-semibold text-primary-600 mb-4">
              Development Setup Test
            </h2>
            <p className="text-gray-600 mb-6">
              This is a test page to verify that all our configurations are working correctly.
            </p>
            <div className="space-y-4">
              <div className="p-4 bg-primary-50 rounded-lg">
                <h3 className="font-medium text-primary-700 mb-2">
                  Environment Variables:
                </h3>
                <pre className="text-sm bg-white p-3 rounded">
                  {JSON.stringify({
                    SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
                    SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
                    MODE: import.meta.env.MODE,
                    VERSION: import.meta.env.VITE_APP_VERSION,
                  }, null, 2)}
                </pre>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <h3 className="font-medium text-red-700 mb-2">
                  Error Tracking Test:
                </h3>
                <TestError />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default App; 