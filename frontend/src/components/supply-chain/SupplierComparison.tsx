import React, { useState } from 'react';
import { useCompanyStore } from '@/stores/companyStore';

interface SupplierMetrics {
  id: string;
  name: string;
  recoveryRate: number;
  processingTime: number;
  costPerTon: number;
  qualityScore: number;
  carbonFootprint: number;
  capacity: number;
  reliability: number;
}

const mockSuppliers: SupplierMetrics[] = [
  {
    id: 'sup1',
    name: 'EcoRecycle Solutions',
    recoveryRate: 95,
    processingTime: 24,
    costPerTon: 250,
    qualityScore: 4.8,
    carbonFootprint: 0.8,
    capacity: 1000,
    reliability: 98
  },
  {
    id: 'sup2',
    name: 'GreenProcess Inc',
    recoveryRate: 92,
    processingTime: 36,
    costPerTon: 220,
    qualityScore: 4.5,
    carbonFootprint: 1.2,
    capacity: 1500,
    reliability: 95
  },
  {
    id: 'sup3',
    name: 'Sustainable Recyclers',
    recoveryRate: 88,
    processingTime: 48,
    costPerTon: 180,
    qualityScore: 4.2,
    carbonFootprint: 1.5,
    capacity: 2000,
    reliability: 92
  }
];

export const SupplierComparison: React.FC = () => {
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<keyof SupplierMetrics>('recoveryRate');

  const metrics: { key: keyof SupplierMetrics; label: string; unit: string }[] = [
    { key: 'recoveryRate', label: 'Recovery Rate', unit: '%' },
    { key: 'processingTime', label: 'Processing Time', unit: 'hours' },
    { key: 'costPerTon', label: 'Cost per Ton', unit: 'USD' },
    { key: 'qualityScore', label: 'Quality Score', unit: '/5' },
    { key: 'carbonFootprint', label: 'Carbon Footprint', unit: 'CO2e/ton' },
    { key: 'capacity', label: 'Monthly Capacity', unit: 'tons' },
    { key: 'reliability', label: 'Reliability Score', unit: '%' }
  ];

  const toggleSupplier = (supplierId: string) => {
    setSelectedSuppliers(prev =>
      prev.includes(supplierId)
        ? prev.filter(id => id !== supplierId)
        : [...prev, supplierId]
    );
  };

  const getMetricColor = (value: number, metric: keyof SupplierMetrics) => {
    const isHigherBetter = !['processingTime', 'costPerTon', 'carbonFootprint'].includes(metric);
    const suppliers = mockSuppliers.map(s => s[metric] as number);
    const max = Math.max(...suppliers);
    const min = Math.min(...suppliers);
    const range = max - min;
    const normalized = (value - min) / range;
    
    return isHigherBetter
      ? `hsl(${normalized * 120}, 70%, 45%)`
      : `hsl(${(1 - normalized) * 120}, 70%, 45%)`;
  };

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Supplier Comparison
        </h2>
        <button
          onClick={() => setShowQuoteForm(true)}
          disabled={selectedSuppliers.length === 0}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Request Quote
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Supplier Selection */}
        <div className="lg:col-span-1">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Select Suppliers
          </h3>
          <div className="space-y-3">
            {mockSuppliers.map((supplier) => (
              <button
                key={supplier.id}
                onClick={() => toggleSupplier(supplier.id)}
                className={`w-full p-4 rounded-lg border-2 transition-all ${
                  selectedSuppliers.includes(supplier.id)
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 hover:border-green-300 dark:border-gray-700'
                }`}
              >
                <h4 className="text-left font-medium text-gray-900 dark:text-white">
                  {supplier.name}
                </h4>
              </button>
            ))}
          </div>
        </div>

        {/* Comparison Chart */}
        <div className="lg:col-span-3">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Compare by Metric
            </label>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as keyof SupplierMetrics)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
            >
              {metrics.map((metric) => (
                <option key={metric.key} value={metric.key}>
                  {metric.label}
                </option>
              ))}
            </select>
          </div>

          {selectedSuppliers.length > 0 ? (
            <div className="space-y-6">
              {metrics.map((metric) => (
                <div key={metric.key} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    {metric.label}
                  </h4>
                  <div className="space-y-3">
                    {mockSuppliers
                      .filter((s) => selectedSuppliers.includes(s.id))
                      .map((supplier) => (
                        <div key={supplier.id} className="flex items-center">
                          <span className="w-32 text-sm text-gray-600 dark:text-gray-400">
                            {supplier.name}
                          </span>
                          <div className="flex-1 ml-4">
                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                              <div
                                className="h-2.5 rounded-full transition-all"
                                style={{
                                  width: '100%',
                                  backgroundColor: getMetricColor(
                                    supplier[metric.key] as number,
                                    metric.key
                                  ),
                                }}
                              />
                            </div>
                          </div>
                          <span className="ml-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                            {supplier[metric.key]} {metric.unit}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              Select suppliers to compare their performance
            </div>
          )}
        </div>
      </div>

      {/* Quote Request Form Modal */}
      {showQuoteForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Request Quote
            </h3>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Material Type
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md">
                  <option>Aluminum</option>
                  <option>Plastic</option>
                  <option>Paper</option>
                  <option>Glass</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quantity (tons)
                </label>
                <input
                  type="number"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Delivery Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Additional Requirements
                </label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowQuoteForm(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}; 