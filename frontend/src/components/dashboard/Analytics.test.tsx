import { render, screen } from '@testing-library/react';
import { Analytics } from './Analytics';
import { useCompanyStore } from '@/stores/companyStore';
import { useSupplyChainStore } from '@/stores/supplyChainStore';

// Mock the stores
jest.mock('@/stores/companyStore');
jest.mock('@/stores/supplyChainStore');
// Mock Chart.js to avoid canvas rendering issues in tests
jest.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="line-chart" />,
  Bar: () => <div data-testid="bar-chart" />,
  Doughnut: () => <div data-testid="doughnut-chart" />,
}));

describe('Analytics', () => {
  const mockProfile = {
    sustainabilityGoals: [
      {
        id: '1',
        title: 'Reduce CO2',
        currentValue: 75,
        targetValue: 100,
      },
      {
        id: '2',
        title: 'Increase Recycling',
        currentValue: 80,
        targetValue: 100,
      },
    ],
  };

  beforeEach(() => {
    (useCompanyStore as jest.Mock).mockReturnValue({
      profile: mockProfile,
    });
    (useSupplyChainStore as jest.Mock).mockReturnValue({
      materials: [],
    });
  });

  it('renders summary cards', () => {
    render(<Analytics />);
    
    expect(screen.getByText('Total Recycled')).toBeInTheDocument();
    expect(screen.getByText('CO2 Impact')).toBeInTheDocument();
    expect(screen.getByText('Recovery Rate')).toBeInTheDocument();
  });

  it('renders all charts', () => {
    render(<Analytics />);
    
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.getByTestId('doughnut-chart')).toBeInTheDocument();
  });

  it('displays sustainability goals progress', () => {
    render(<Analytics />);
    
    mockProfile.sustainabilityGoals.forEach(goal => {
      expect(screen.getByText(goal.title)).toBeInTheDocument();
      expect(screen.getByText(`${Math.round((goal.currentValue / goal.targetValue) * 100)}%`)).toBeInTheDocument();
    });
  });

  it('renders export options', () => {
    render(<Analytics />);
    
    expect(screen.getByText('Export as PDF')).toBeInTheDocument();
    expect(screen.getByText('Export as CSV')).toBeInTheDocument();
  });

  it('displays correct percentage in progress bars', () => {
    render(<Analytics />);
    
    mockProfile.sustainabilityGoals.forEach(goal => {
      const progressBar = screen.getByText(goal.title)
        .closest('div')
        ?.querySelector('.bg-green-500');
      
      expect(progressBar).toHaveStyle({
        width: `${Math.min((goal.currentValue / goal.targetValue) * 100, 100)}%`,
      });
    });
  });
}); 