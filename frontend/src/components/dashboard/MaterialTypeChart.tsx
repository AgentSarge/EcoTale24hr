import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { RecyclingData } from '../../lib/supabase';

interface MaterialTypeChartProps {
  data: RecyclingData[];
}

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884D8',
  '#82CA9D',
];

export const MaterialTypeChart = ({ data }: MaterialTypeChartProps) => {
  const chartData = useMemo(() => {
    const materialTotals = data.reduce((acc, item) => {
      const existingMaterial = acc.find(m => m.name === item.material_type);
      if (existingMaterial) {
        existingMaterial.value += item.weight_kg;
      } else {
        acc.push({
          name: item.material_type,
          value: item.weight_kg,
        });
      }
      return acc;
    }, [] as { name: string; value: number }[]);

    return materialTotals.sort((a, b) => b.value - a.value);
  }, [data]);

  const totalWeight = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.value, 0);
  }, [chartData]);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Material Type Breakdown
      </h2>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [
                `${value.toFixed(2)} kg (${((value / totalWeight) * 100).toFixed(1)}%)`,
                'Weight',
              ]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}; 