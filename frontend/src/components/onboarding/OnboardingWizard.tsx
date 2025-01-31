import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompanyStore } from '../../stores/companyStore';

type OnboardingStep = 'welcome' | 'company' | 'goals' | 'complete';

export const OnboardingWizard = () => {
  const navigate = useNavigate();
  const { updateProfile, addSustainabilityGoal, isLoading } = useCompanyStore();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    region: '',
    sustainabilityGoals: [
      {
        title: '',
        targetDate: '',
        targetValue: 0,
        metric: '',
      },
    ],
  });

  const handleNext = () => {
    const steps: OnboardingStep[] = ['welcome', 'company', 'goals', 'complete'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Create company profile
      await updateProfile({
        name: formData.companyName,
        industry: formData.industry,
        region: formData.region,
      });

      // Add sustainability goals
      for (const goal of formData.sustainabilityGoals) {
        await addSustainabilityGoal(goal);
      }

      handleNext();
    } catch (error) {
      console.error('Error saving onboarding data:', error);
    }
  };

  const addGoal = () => {
    setFormData({
      ...formData,
      sustainabilityGoals: [
        ...formData.sustainabilityGoals,
        {
          title: '',
          targetDate: '',
          targetValue: 0,
          metric: '',
        },
      ],
    });
  };

  const updateGoal = (index: number, field: string, value: string | number) => {
    const updatedGoals = [...formData.sustainabilityGoals];
    updatedGoals[index] = { ...updatedGoals[index], [field]: value };
    setFormData({ ...formData, sustainabilityGoals: updatedGoals });
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Welcome to EcoTale</h2>
            <p className="mt-4 text-lg text-gray-600">
              Let's set up your corporate sustainability profile and start tracking your eco-impact.
            </p>
            <button onClick={handleNext} className="mt-8 btn-primary">
              Get Started
            </button>
          </div>
        );

      case 'company':
        return (
          <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Company Information</h2>
            
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                Company Name
              </label>
              <input
                type="text"
                id="companyName"
                required
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="input-primary"
              />
            </div>

            <div>
              <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
                Industry
              </label>
              <select
                id="industry"
                required
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="input-primary"
              >
                <option value="">Select an industry</option>
                <option value="CPG">Consumer Packaged Goods</option>
                <option value="Retail">Retail</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Technology">Technology</option>
                <option value="Energy">Energy</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="region" className="block text-sm font-medium text-gray-700">
                Primary Region
              </label>
              <select
                id="region"
                required
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                className="input-primary"
              >
                <option value="">Select a region</option>
                <option value="North America">North America</option>
                <option value="Europe">Europe</option>
                <option value="Asia Pacific">Asia Pacific</option>
                <option value="Latin America">Latin America</option>
                <option value="Middle East">Middle East</option>
                <option value="Africa">Africa</option>
              </select>
            </div>

            <div className="flex justify-end">
              <button type="submit" className="btn-primary" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Next'}
              </button>
            </div>
          </form>
        );

      case 'goals':
        return (
          <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Sustainability Goals</h2>
            
            {formData.sustainabilityGoals.map((goal, index) => (
              <div key={index} className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Goal Title
                  </label>
                  <input
                    type="text"
                    required
                    value={goal.title}
                    onChange={(e) => updateGoal(index, 'title', e.target.value)}
                    className="input-primary"
                    placeholder="e.g., Reduce plastic waste by 50%"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Target Date
                    </label>
                    <input
                      type="date"
                      required
                      value={goal.targetDate}
                      onChange={(e) => updateGoal(index, 'targetDate', e.target.value)}
                      className="input-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Target Value
                    </label>
                    <input
                      type="number"
                      required
                      value={goal.targetValue}
                      onChange={(e) => updateGoal(index, 'targetValue', parseFloat(e.target.value))}
                      className="input-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Metric
                  </label>
                  <select
                    required
                    value={goal.metric}
                    onChange={(e) => updateGoal(index, 'metric', e.target.value)}
                    className="input-primary"
                  >
                    <option value="">Select a metric</option>
                    <option value="percentage">Percentage</option>
                    <option value="tons">Metric Tons</option>
                    <option value="kwh">Kilowatt Hours</option>
                    <option value="carbon">Carbon Offset</option>
                  </select>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addGoal}
              className="btn-secondary"
            >
              Add Another Goal
            </button>

            <div className="flex justify-end">
              <button type="submit" className="btn-primary" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Next'}
              </button>
            </div>
          </form>
        );

      case 'complete':
        return (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">All Set!</h2>
            <p className="mt-4 text-lg text-gray-600">
              Your company profile has been created and your sustainability goals are set.
              Let's start tracking your eco-impact!
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-8 btn-primary"
            >
              Go to Dashboard
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}; 