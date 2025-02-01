import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { DashboardSkeleton } from './dashboard/DashboardSkeleton';
import { ErrorBoundary } from './ErrorBoundary';
import { useRecyclingData } from '../hooks/useRecyclingData';
import { MaterialBreakdown } from './dashboard/MaterialBreakdown';
import { DateRangeFilter } from './dashboard/DateRangeFilter';
import { Button } from './ui/Button';
import * as Sentry from '@sentry/react';

const DashboardContent = () => {
  const [startDate, setStartDate] = useState<Date | null>(
    new Date(new Date().setDate(new Date().getDate() - 30))
  );
  const [endDate, setEndDate] = useState<Date | null>(new Date());

  const {
    data,
    isLoading,
    error,
    totalRecycled,
    totalCO2Saved,
  } = useRecyclingData({
    orderBy: 'created_at',
    orderDirection: 'asc',
  });

  const handleDateRangeChange = (start: Date | null, end: Date | null) => {
    setStartDate(start);
    setEndDate(end);
    // Add breadcrumb for date range change
    Sentry.addBreadcrumb({
      category: 'user-action',
      message: 'Changed date range',
      data: {
        startDate: start?.toISOString(),
        endDate: end?.toISOString(),
      },
    });
  };

  const handleExportData = () => {
    try {
      const filteredData = data.filter(item => {
        const itemDate = new Date(item.created_at);
        if (startDate && itemDate < startDate) return false;
        if (endDate && itemDate > endDate) return false;
        return true;
      });

      const csvContent = [
        ['Date', 'Material Type', 'Weight (kg)', 'CO2 Saved (kg)'],
        ...filteredData.map(item => [
          new Date(item.created_at).toLocaleDateString(),
          item.material_type,
          item.weight_kg.toString(),
          item.co2_saved_kg.toString(),
        ]),
      ]
        .map(row => row.join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recycling-data-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      Sentry.addBreadcrumb({
        category: 'user-action',
        message: 'Exported recycling data',
        data: {
          rowCount: filteredData.length,
          dateRange: `${startDate?.toISOString()} - ${endDate?.toISOString()}`,
        },
      });
    } catch (err) {
      Sentry.captureException(err, {
        extra: {
          context: 'Exporting recycling data',
          dateRange: {
            start: startDate?.toISOString(),
            end: endDate?.toISOString(),
          },
        },
      });
      throw err;
    }
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    throw new Error(error);
  }

  const filteredData = data.filter(item => {
    const itemDate = new Date(item.created_at);
    if (startDate && itemDate < startDate) return false;
    if (endDate && itemDate > endDate) return false;
    return true;
  });

  const chartData = filteredData.map(item => ({
    date: new Date(item.created_at).toLocaleDateString(),
    weight: item.weight_kg,
    co2Saved: item.co2_saved_kg,
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <DateRangeFilter onFilterChange={handleDateRangeChange} />
        <Button
          variant="secondary"
          onClick={handleExportData}
          className="ml-4"
        >
          Export Data
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900">Total Recycled</h3>
          <p className="mt-2 text-3xl font-bold text-primary-600">
            {totalRecycled.toFixed(1)} kg
          </p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900">CO2 Saved</h3>
          <p className="mt-2 text-3xl font-bold text-primary-600">
            {totalCO2Saved.toFixed(1)} kg
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recycling Trends</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="weight"
                  name="Recycled (kg)"
                  stroke="#16a34a"
                  activeDot={{ r: 8 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="co2Saved"
                  name="CO2 Saved (kg)"
                  stroke="#64748b"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <MaterialBreakdown data={filteredData} />
      </div>
    </div>
  );
};

export const Dashboard = () => {
  return (
    <ErrorBoundary>
      <DashboardContent />
    </ErrorBoundary>
  );
}; 