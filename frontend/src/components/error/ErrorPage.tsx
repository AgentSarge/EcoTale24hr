import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Container } from '../layout/Container';

interface ErrorPageProps {
  error?: Error;
  resetError?: () => void;
}

export const ErrorPage = ({ error, resetError }: ErrorPageProps) => {
  const navigate = useNavigate();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    if (resetError) {
      resetError();
    } else {
      window.location.reload();
    }
  };

  return (
    <Container size="sm">
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        {isOffline ? (
          <>
            <svg
              className="h-24 w-24 text-gray-400 mb-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
              />
            </svg>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              You're Offline
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
              Please check your internet connection and try again.
              We'll automatically reconnect when you're back online.
            </p>
          </>
        ) : (
          <>
            <svg
              className="h-24 w-24 text-gray-400 mb-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Something Went Wrong
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
              {error?.message || 'An unexpected error occurred. Our team has been notified.'}
            </p>
          </>
        )}

        <div className="space-x-4">
          <Button
            variant="primary"
            onClick={handleRetry}
          >
            Try Again
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/')}
          >
            Go Home
          </Button>
        </div>
      </div>
    </Container>
  );
}; 