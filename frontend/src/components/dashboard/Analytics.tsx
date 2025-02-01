import React, { useMemo, Suspense, lazy } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { useCompanyStore } from '@/stores/companyStore';
import { useSupplyChainStore } from '@/stores/supplyChainStore';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Lazy load chart components
const Line = lazy(() => import('react-chartjs-2').then(module => ({ default: module.Line })));
const Bar = lazy(() => import('react-chartjs-2').then(module => ({ default: module.Bar })));
const Doughnut = lazy(() => import('react-chartjs-2').then(module => ({ default: module.Doughnut })));

// Loading fallback component
const ChartSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="w-full h-80 bg-gray-200 dark:bg-gray-700 rounded-lg" />
  </div>
);

export const Analytics: React.FC = () => {
  const { profile } = useCompanyStore();
  const { materials } = useSupplyChainStore();

  // Memoize chart data
  const recyclingTrendsData = useMemo(() => ({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Monthly Recycling Volume (tons)',
        data: [120, 150, 180, 190, 210, 250],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
      },
    ],
  }), []);

  const materialDistributionData = useMemo(() => ({
    labels: ['Aluminum', 'Plastic', 'Paper', 'Glass', 'Electronics'],
    datasets: [
      {
        data: [30, 25, 20, 15, 10],
        backgroundColor: [
          'rgb(34, 197, 94)',
          'rgb(59, 130, 246)',
          'rgb(249, 115, 22)',
          'rgb(168, 85, 247)',
          'rgb(236, 72, 153)',
        ],
      },
    ],
  }), []);

  const sustainabilityImpactData = useMemo(() => ({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'CO2 Saved (tons)',
        data: [50, 65, 75, 85, 95, 110],
        backgroundColor: 'rgb(34, 197, 94)',
      },
    ],
  }), []);

  const options = useMemo(() => ({
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  }), []);

  // Memoize goal calculations
  const goalsProgress = useMemo(() => {
    return profile?.sustainabilityGoals.map(goal => ({
      ...goal,
      percentage: Math.round((goal.currentValue / goal.targetValue) * 100),
    }));
  }, [profile?.sustainabilityGoals]);

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Total Recycled
          </h3>
          <p className="text-3xl font-bold text-green-500">
            1,100 tons
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            +15% from last month
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            CO2 Impact
          </h3>
          <p className="text-3xl font-bold text-blue-500">
            480 tons
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            CO2 emissions prevented
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Recovery Rate
          </h3>
          <p className="text-3xl font-bold text-purple-500">
            92%
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Average material recovery
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recycling Trends */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Recycling Trends
          </h3>
          <div className="h-80">
            <Suspense fallback={<ChartSkeleton />}>
              <Line data={recyclingTrendsData} options={options} />
            </Suspense>
          </div>
        </div>

        {/* Material Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Material Distribution
          </h3>
          <div className="h-80">
            <Suspense fallback={<ChartSkeleton />}>
              <Doughnut 
                data={materialDistributionData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                }}
              />
            </Suspense>
          </div>
        </div>

        {/* Sustainability Impact */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Sustainability Impact
          </h3>
          <div className="h-80">
            <Suspense fallback={<ChartSkeleton />}>
              <Bar data={sustainabilityImpactData} options={options} />
            </Suspense>
          </div>
        </div>

        {/* Goals Progress */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Goals Progress
          </h3>
          <div className="space-y-4">
            {goalsProgress?.map((goal) => (
              <div key={goal.id} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {goal.title}
                  </span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {goal.percentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(goal.percentage, 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="flex justify-end space-x-4">
        <button className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
          Export as PDF
        </button>
        <button className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
          Export as CSV
        </button>
      </div>
    </div>
  );
}; 