import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { RecyclingData } from '../../lib/supabase';
import { Button } from '../ui/Button';

interface RecyclingTableProps {
  data: RecyclingData[];
  onExport: () => void;
}

type SortField = 'created_at' | 'material_type' | 'weight_kg' | 'co2_saved_kg';
type SortOrder = 'asc' | 'desc';

export const RecyclingTable = ({ data, onExport }: RecyclingTableProps) => {
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [searchQuery, setSearchQuery] = useState('');

  const sortedData = useMemo(() => {
    return [...data]
      .filter(item =>
        item.material_type.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        const multiplier = sortOrder === 'asc' ? 1 : -1;
        if (sortField === 'created_at') {
          return multiplier * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        }
        return multiplier * (a[sortField] > b[sortField] ? 1 : -1);
      });
  }, [data, sortField, sortOrder, searchQuery]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (field !== sortField) return null;
    return (
      <svg
        className="w-4 h-4 ml-1"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d={
            sortOrder === 'asc'
              ? 'M5 15l7-7 7 7'
              : 'M19 9l-7 7-7-7'
          }
        />
      </svg>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recycling History
          </h2>
          <div className="flex space-x-4 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search by material..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <Button onClick={onExport} variant="outline">
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm font-medium text-gray-500 dark:text-gray-400">
              <th
                className="px-6 py-4 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center">
                  Date
                  <SortIcon field="created_at" />
                </div>
              </th>
              <th
                className="px-6 py-4 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                onClick={() => handleSort('material_type')}
              >
                <div className="flex items-center">
                  Material Type
                  <SortIcon field="material_type" />
                </div>
              </th>
              <th
                className="px-6 py-4 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                onClick={() => handleSort('weight_kg')}
              >
                <div className="flex items-center">
                  Weight (kg)
                  <SortIcon field="weight_kg" />
                </div>
              </th>
              <th
                className="px-6 py-4 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                onClick={() => handleSort('co2_saved_kg')}
              >
                <div className="flex items-center">
                  CO2 Saved (kg)
                  <SortIcon field="co2_saved_kg" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {sortedData.map((item) => (
              <tr
                key={item.id}
                className="text-sm text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td className="px-6 py-4">
                  {format(new Date(item.created_at), 'MMM d, yyyy')}
                </td>
                <td className="px-6 py-4 capitalize">{item.material_type}</td>
                <td className="px-6 py-4">{item.weight_kg.toFixed(2)}</td>
                <td className="px-6 py-4">{item.co2_saved_kg.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}; 