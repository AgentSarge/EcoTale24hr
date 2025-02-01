import React from 'react';
import { Link } from 'react-router-dom';

export const NotFound: React.FC = () => {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-bold text-gray-900 dark:text-white">404</h1>
        <p className="mb-8 text-xl text-gray-600 dark:text-gray-400">
          Oops! The page you're looking for doesn't exist.
        </p>
        <Link
          to="/"
          className="rounded-lg bg-green-500 px-6 py-3 text-white transition-colors hover:bg-green-600"
        >
          Go back home
        </Link>
      </div>
    </div>
  );
}; 