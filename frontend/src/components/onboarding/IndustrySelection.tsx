import React from 'react';
import { useCompanyStore } from '@/stores/companyStore';

interface Industry {
  id: string;
  name: string;
  icon: string;
  description: string;
}

const industries: Industry[] = [
  {
    id: 'cpg',
    name: 'Consumer Packaged Goods',
    icon: '🛍️',
    description: 'Manufacturers of packaged consumer products'
  },
  {
    id: 'retail',
    name: 'Retail',
    icon: '🏪',
    description: 'Retail stores and chains'
  },
  {
    id: 'automotive',
    name: 'Automotive',
    icon: '🚗',
    description: 'Automotive manufacturers and suppliers'
  },
  {
    id: 'electronics',
    name: 'Electronics',
    icon: '💻',
    description: 'Electronics manufacturers and retailers'
  },
  {
    id: 'food_beverage',
    name: 'Food & Beverage',
    icon: '🍽️',
    description: 'Food and beverage manufacturers'
  }
];

export const IndustrySelection: React.FC = () => {
  const { profile, updateProfile, isLoading } = useCompanyStore();

  const handleIndustrySelect = async (industryId: string) => {
    try {
      await updateProfile({ industry: industryId });
    } catch (error) {
      console.error('Failed to update industry:', error);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Select Your Industry
      </h2>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Choose your industry to help us customize your sustainability tracking experience.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {industries.map((industry) => (
          <button
            key={industry.id}
            onClick={() => handleIndustrySelect(industry.id)}
            disabled={isLoading}
            className={`p-6 rounded-lg border-2 transition-all ${
              profile?.industry === industry.id
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                : 'border-gray-200 hover:border-green-300 dark:border-gray-700'
            } flex flex-col items-center text-center`}
          >
            <span className="text-4xl mb-4" role="img" aria-label={industry.name}>
              {industry.icon}
            </span>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {industry.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {industry.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}; 