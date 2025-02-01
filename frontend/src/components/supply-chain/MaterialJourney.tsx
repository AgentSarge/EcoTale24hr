import React, { useState } from 'react';
import { useCompanyStore } from '@/stores/companyStore';

interface JourneyStep {
  id: string;
  location: string;
  status: 'completed' | 'in_progress' | 'pending';
  timestamp: string;
  recoveryRate?: number;
  notes?: string;
}

interface Material {
  id: string;
  name: string;
  type: string;
  quantity: number;
  unit: string;
  journey: JourneyStep[];
}

const mockMaterials: Material[] = [
  {
    id: '1',
    name: 'Aluminum Cans',
    type: 'aluminum',
    quantity: 1000,
    unit: 'kg',
    journey: [
      {
        id: 'step1',
        location: 'Collection Bin A123',
        status: 'completed',
        timestamp: '2024-01-31T08:00:00Z',
        notes: 'Collected from downtown area'
      },
      {
        id: 'step2',
        location: 'Sorting Facility SF1',
        status: 'completed',
        timestamp: '2024-01-31T10:30:00Z',
        recoveryRate: 95,
        notes: 'Sorted and compressed'
      },
      {
        id: 'step3',
        location: 'Recycling Plant RP4',
        status: 'in_progress',
        timestamp: '2024-01-31T14:00:00Z',
        recoveryRate: 92,
        notes: 'Processing batch #45892'
      }
    ]
  }
];

export const MaterialJourney: React.FC = () => {
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  const getStatusColor = (status: JourneyStep['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in_progress':
        return 'bg-blue-500';
      case 'pending':
        return 'bg-gray-300 dark:bg-gray-600';
    }
  };

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        Material Journey Tracking
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Material List */}
        <div className="lg:col-span-1 border-r border-gray-200 dark:border-gray-700 pr-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Materials
          </h3>
          <div className="space-y-3">
            {mockMaterials.map((material) => (
              <button
                key={material.id}
                onClick={() => setSelectedMaterial(material)}
                className={`w-full p-4 rounded-lg border-2 transition-all ${
                  selectedMaterial?.id === material.id
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 hover:border-green-300 dark:border-gray-700'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-left font-medium text-gray-900 dark:text-white">
                      {material.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {material.quantity} {material.unit}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {material.journey.map((step) => (
                      <div
                        key={step.id}
                        className={`w-2 h-2 rounded-full ${getStatusColor(step.status)}`}
                      />
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Journey Timeline */}
        <div className="lg:col-span-2">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Journey Timeline
          </h3>
          {selectedMaterial ? (
            <div className="relative">
              {selectedMaterial.journey.map((step, index) => (
                <div key={step.id} className="mb-8 relative">
                  {/* Timeline line */}
                  {index < selectedMaterial.journey.length - 1 && (
                    <div className="absolute left-3.5 top-8 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
                  )}
                  
                  <div className="flex items-start">
                    {/* Status indicator */}
                    <div
                      className={`w-7 h-7 rounded-full ${getStatusColor(
                        step.status
                      )} flex items-center justify-center relative z-10`}
                    >
                      <span className="text-white text-sm">{index + 1}</span>
                    </div>
                    
                    {/* Step details */}
                    <div className="ml-4 flex-1">
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {step.location}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {new Date(step.timestamp).toLocaleString()}
                        </p>
                        {step.recoveryRate && (
                          <div className="mt-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Recovery Rate:
                            </span>
                            <div className="mt-1 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${step.recoveryRate}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {step.recoveryRate}%
                            </span>
                          </div>
                        )}
                        {step.notes && (
                          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            {step.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              Select a material to view its journey
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 