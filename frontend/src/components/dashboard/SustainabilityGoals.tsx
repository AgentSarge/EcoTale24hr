import React, { useState } from 'react';
import { useCompanyStore, SustainabilityGoal } from '@/stores/companyStore';

interface GoalFormData {
  title: string;
  targetDate: string;
  targetValue: number;
  metric: string;
}

const metricOptions = [
  { id: 'recycling_rate', label: 'Recycling Rate', unit: '%' },
  { id: 'co2_saved', label: 'CO2 Saved', unit: 'tons' },
  { id: 'waste_reduced', label: 'Waste Reduced', unit: 'kg' },
  { id: 'water_saved', label: 'Water Saved', unit: 'liters' },
  { id: 'energy_saved', label: 'Energy Saved', unit: 'kWh' },
];

export const SustainabilityGoals: React.FC = () => {
  const { profile, addSustainabilityGoal, updateSustainabilityGoal, isLoading } = useCompanyStore();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<GoalFormData>({
    title: '',
    targetDate: '',
    targetValue: 0,
    metric: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addSustainabilityGoal(formData);
      setShowForm(false);
      setFormData({ title: '', targetDate: '', targetValue: 0, metric: '' });
    } catch (error) {
      console.error('Failed to add goal:', error);
    }
  };

  const calculateProgress = (goal: SustainabilityGoal) => {
    return Math.min((goal.currentValue / goal.targetValue) * 100, 100);
  };

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Sustainability Goals
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          Add Goal
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Goal Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Target Date
              </label>
              <input
                type="date"
                value={formData.targetDate}
                onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Target Value
              </label>
              <input
                type="number"
                value={formData.targetValue}
                onChange={(e) => setFormData({ ...formData, targetValue: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                required
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Metric
              </label>
              <select
                value={formData.metric}
                onChange={(e) => setFormData({ ...formData, metric: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                required
              >
                <option value="">Select a metric</option>
                {metricOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label} ({option.unit})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Adding...' : 'Add Goal'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {profile?.sustainabilityGoals.map((goal) => (
          <div
            key={goal.id}
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {goal.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Target: {goal.targetValue} {metricOptions.find(m => m.id === goal.metric)?.unit}
                  {' by '}
                  {new Date(goal.targetDate).toLocaleDateString()}
                </p>
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {goal.currentValue} / {goal.targetValue}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-green-500 h-2.5 rounded-full transition-all"
                style={{ width: `${calculateProgress(goal)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 