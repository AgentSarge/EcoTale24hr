import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { RecyclingData } from '../../lib/supabase';

interface MaterialBreakdownProps {
  data: RecyclingData[];
}

const COLORS = {
  plastic: '#16a34a',
  paper: '#64748b',
  glass: '#0ea5e9',
  metal: '#f59e0b',
};

export const MaterialBreakdown = ({ data }: MaterialBreakdownProps) => {
  const materialData = data.reduce((acc, item) => {
    const existing = acc.find(d => d.name === item.material_type);
    if (existing) {
      existing.value += item.weight_kg;
    } else {
      acc.push({
        name: item.material_type,
        value: item.weight_kg,
      });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  const total = materialData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Material Breakdown</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={materialData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name} (${(value / total * 100).toFixed(1)}%)`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {materialData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[entry.name as keyof typeof COLORS]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => `${value.toFixed(1)} kg`}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}; 