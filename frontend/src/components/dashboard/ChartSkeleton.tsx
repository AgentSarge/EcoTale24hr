export const ChartSkeleton = () => {
  return (
    <div className="animate-pulse space-y-4" data-testid="chart-skeleton">
      <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
      <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className="h-full w-full flex items-center justify-center">
          <svg
            className="w-12 h-12 text-gray-300 dark:text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}; 