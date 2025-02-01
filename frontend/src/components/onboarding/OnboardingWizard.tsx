import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../hooks/useAppStore';

interface Step {
  id: string;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    id: 'industry',
    title: 'Select Your Industry',
    description: 'Choose the industry that best describes your business',
  },
  {
    id: 'goals',
    title: 'Set Your Goals',
    description: 'Define your sustainability goals and targets',
  },
  {
    id: 'baseline',
    title: 'Establish Baseline',
    description: 'Enter your current environmental metrics',
  },
];

export const OnboardingWizard: React.FC = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState({
    industry: '',
    goals: [],
    baseline: {},
  });
  const navigate = useNavigate();
  const { auth, eco } = useAppStore();

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    try {
      await eco.saveOnboardingData(formData);
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to save onboarding data:', error);
    }
  };

  const currentStep = steps[currentStepIndex];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex items-center">
                <div
                  className={`h-8 w-8 rounded-full ${
                    index <= currentStepIndex
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  } flex items-center justify-center font-semibold`}
                >
                  {index + 1}
                </div>
                <span className="ml-2 hidden sm:inline">{step.title}</span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-0.5 w-full ${
                    index < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="mb-8">
        <h2 className="mb-2 text-2xl font-bold">{currentStep.title}</h2>
        <p className="text-gray-600">{currentStep.description}</p>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={handleBack}
          disabled={currentStepIndex === 0}
          className={`rounded px-4 py-2 ${
            currentStepIndex === 0
              ? 'cursor-not-allowed bg-gray-300'
              : 'bg-gray-500 text-white hover:bg-gray-600'
          }`}
        >
          Back
        </button>
        <button
          onClick={handleNext}
          className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
        >
          {currentStepIndex === steps.length - 1 ? 'Complete' : 'Next'}
        </button>
      </div>
    </div>
  );
}; 