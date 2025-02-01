import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Dashboard } from '../Dashboard';
import { useRecyclingStore } from '../../../stores/recyclingStore';

// Mock the stores
vi.mock('../../../stores/recyclingStore');

const mockRecyclingData = [
  {
    id: '1',
    created_at: '2024-01-01T12:00:00Z',
    user_id: 'user1',
    material_type: 'plastic',
    weight_kg: 2.5,
    co2_saved_kg: 7.5,
  },
  {
    id: '2',
    created_at: '2024-01-02T12:00:00Z',
    user_id: 'user1',
    material_type: 'paper',
    weight_kg: 3.0,
    co2_saved_kg: 4.5,
  },
];

describe('Dashboard', () => {
  beforeEach(() => {
    (useRecyclingStore as any).mockImplementation(() => ({
      recyclingData: mockRecyclingData,
      isLoading: false,
      error: null,
    }));
  });

  it('renders dashboard with data', () => {
    render(<Dashboard />);
    
    expect(screen.getByText('Recycling Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Material Type Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Recycling History')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    (useRecyclingStore as any).mockImplementation(() => ({
      recyclingData: [],
      isLoading: true,
      error: null,
    }));

    render(<Dashboard />);
    
    expect(screen.getByTestId('chart-skeleton')).toBeInTheDocument();
  });

  it('shows empty state when no data', () => {
    (useRecyclingStore as any).mockImplementation(() => ({
      recyclingData: [],
      isLoading: false,
      error: null,
    }));

    render(<Dashboard />);
    
    expect(screen.getByText('No recycling data yet')).toBeInTheDocument();
  });

  it('shows error state', () => {
    (useRecyclingStore as any).mockImplementation(() => ({
      recyclingData: [],
      isLoading: false,
      error: new Error('Failed to load data'),
    }));

    render(<Dashboard />);
    
    expect(screen.getByText('Error loading data')).toBeInTheDocument();
  });

  it('filters data by date range', async () => {
    render(<Dashboard />);
    
    // Open date picker
    fireEvent.click(screen.getByText('Filter by date'));
    
    // Select dates (implementation depends on your date picker component)
    const startDate = screen.getByRole('button', { name: /january 1/i });
    const endDate = screen.getByRole('button', { name: /january 2/i });
    
    fireEvent.click(startDate);
    fireEvent.click(endDate);
    
    await waitFor(() => {
      // Check if filtered data is displayed
      expect(screen.getByText('2.5')).toBeInTheDocument(); // weight of first record
      expect(screen.getByText('3.0')).toBeInTheDocument(); // weight of second record
    });
  });

  it('exports data as CSV', () => {
    // Mock URL.createObjectURL and document.createElement
    const mockUrl = 'blob:test';
    const mockLink = {
      setAttribute: vi.fn(),
      click: vi.fn(),
    };
    
    global.URL.createObjectURL = vi.fn().mockReturnValue(mockUrl);
    document.createElement = vi.fn().mockReturnValue(mockLink);
    document.body.appendChild = vi.fn();
    document.body.removeChild = vi.fn();
    
    render(<Dashboard />);
    
    fireEvent.click(screen.getByText('Export CSV'));
    
    expect(mockLink.setAttribute).toHaveBeenCalledWith('href', mockUrl);
    expect(mockLink.setAttribute).toHaveBeenCalledWith('download', 'recycling_data.csv');
    expect(mockLink.click).toHaveBeenCalled();
  });
}); 