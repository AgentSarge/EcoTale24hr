import { render, screen, fireEvent } from '@testing-library/react';
import { MaterialJourney } from '../MaterialJourney';

// Mock data
const mockMaterials = [
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

// Mock the module that contains the mockMaterials data
jest.mock('../../../data/mockData', () => ({
  mockMaterials
}));

describe('MaterialJourney', () => {
  it('renders material journey component', () => {
    render(<MaterialJourney />);
    
    expect(screen.getByText('Material Journey Tracking')).toBeInTheDocument();
    expect(screen.getByText('Materials')).toBeInTheDocument();
  });

  it('displays all materials', () => {
    render(<MaterialJourney />);
    
    mockMaterials.forEach(material => {
      expect(screen.getByText(material.name)).toBeInTheDocument();
      expect(screen.getByText(`${material.quantity} ${material.unit}`)).toBeInTheDocument();
    });
  });

  it('shows material details when selected', () => {
    render(<MaterialJourney />);
    
    const material = mockMaterials[0];
    fireEvent.click(screen.getByText(material.name));
    
    material.journey.forEach(step => {
      expect(screen.getByText(step.location)).toBeInTheDocument();
      if (step.notes) {
        expect(screen.getByText(step.notes)).toBeInTheDocument();
      }
    });
  });

  it('displays correct status indicators', () => {
    render(<MaterialJourney />);
    
    const material = mockMaterials[0];
    const statusIndicators = screen.getAllByTestId('status-indicator');
    
    expect(statusIndicators).toHaveLength(material.journey.length);
    expect(statusIndicators[0]).toHaveClass('bg-green-500'); // completed
    expect(statusIndicators[2]).toHaveClass('bg-blue-500'); // in_progress
  });

  it('shows recovery rates when available', () => {
    render(<MaterialJourney />);
    
    const material = mockMaterials[0];
    fireEvent.click(screen.getByText(material.name));
    
    material.journey.forEach(step => {
      if (step.recoveryRate) {
        expect(screen.getByText(`${step.recoveryRate}%`)).toBeInTheDocument();
      }
    });
  });

  it('formats timestamps correctly', () => {
    render(<MaterialJourney />);
    
    const material = mockMaterials[0];
    fireEvent.click(screen.getByText(material.name));
    
    material.journey.forEach(step => {
      const date = new Date(step.timestamp);
      const formattedDate = date.toLocaleString();
      expect(screen.getByText(formattedDate)).toBeInTheDocument();
    });
  });

  it('handles material selection and deselection', () => {
    render(<MaterialJourney />);
    
    const materialButton = screen.getByText(mockMaterials[0].name);
    
    // Select material
    fireEvent.click(materialButton);
    expect(materialButton.closest('button')).toHaveClass('border-green-500');
    
    // Deselect material
    fireEvent.click(materialButton);
    expect(materialButton.closest('button')).not.toHaveClass('border-green-500');
  });

  it('displays journey steps in chronological order', () => {
    render(<MaterialJourney />);
    
    const material = mockMaterials[0];
    fireEvent.click(screen.getByText(material.name));
    
    const timestamps = screen.getAllByTestId('timestamp');
    const dates = timestamps.map(t => new Date(t.textContent || ''));
    
    // Verify timestamps are in ascending order
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i].getTime()).toBeGreaterThan(dates[i - 1].getTime());
    }
  });
}); 