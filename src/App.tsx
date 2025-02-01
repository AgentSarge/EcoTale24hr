import { ErrorBoundary } from '@sentry/react';
import { Suspense } from 'react';

interface FallbackProps {
  error: Error;
  componentStack: string | null;
  eventId: string | null;
  resetError(): void;
}

const ErrorFallback = ({ error }: FallbackProps) => (
  <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-red-50">
    <div className="max-w-md p-8 bg-white rounded-lg shadow-lg">
      <h1 className="mb-4 text-2xl font-bold text-red-600">Something went wrong</h1>
      <p className="mb-4 text-gray-600">{error.message}</p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700"
      >
        Try again
      </button>
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary
      fallback={ErrorFallback}
      beforeCapture={(scope) => {
        scope.setTag("location", "App");
        scope.setContext("app_info", {
          MODE: import.meta.env.MODE,
          VERSION: import.meta.env.VITE_APP_VERSION,
        });
      }}
    >
      <Suspense fallback={<div>Loading...</div>}>
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
          <div className="container mx-auto px-4 py-16">
            <h1 className="text-4xl font-bold text-center mb-8">Welcome to EcoTale</h1>
            <p className="text-lg text-center text-gray-700">
              Your platform for environmental storytelling and impact tracking.
            </p>
          </div>
        </div>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App; 