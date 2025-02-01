import React from 'react';
import { Analytics } from './Analytics';
import { SustainabilityGoals } from './SustainabilityGoals';

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
      </div>
      
      <Analytics />
      
      <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
        <SustainabilityGoals />
      </div>
    </div>
  );
}; 