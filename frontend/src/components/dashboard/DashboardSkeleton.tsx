export const DashboardSkeleton = () => {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Metric Cards Skeleton */}
        {[1, 2].map((i) => (
          <div key={i} className="card">
            <div className="h-6 w-32 bg-gray-200 rounded mb-4" />
            <div className="h-8 w-24 bg-gray-300 rounded" />
          </div>
        ))}
      </div>

      {/* Chart Skeleton */}
      <div className="card">
        <div className="h-6 w-40 bg-gray-200 rounded mb-4" />
        <div className="h-96 bg-gray-100 rounded-lg">
          <div className="h-full w-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-gray-300"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 15l4-4 6 6 6-6"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Data Table Skeleton */}
      <div className="card">
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
        </div>
      </div>
    </div>
  );
}; 