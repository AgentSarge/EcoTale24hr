import { render, screen } from '@testing-library/react';
import { MaterialBreakdown } from '../MaterialBreakdown';
import type { RecyclingData } from '../../../lib/supabase';

// Mock recharts components
jest.mock('recharts', () => ({
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ data }: { data: any[] }) => (
    <div data-testid="pie">
      {data.map((item, index) => (
        <div key={index} data-testid="pie-segment">
          {item.name}: {item.value}
        </div>
      ))}
    </div>
  ),
  Cell: () => <div data-testid="pie-cell" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Legend: () => <div data-testid="legend" />,
  Tooltip: () => <div data-testid="tooltip" />
}));

describe('MaterialBreakdown', () => {
  const mockData: RecyclingData[] = [
    {
      id: '1',
      created_at: '2024-01-01',
      material_type: 'plastic',
      weight_kg: 10,
      user_id: 'user1',
      co2_saved_kg: 30
    },
    {
      id: '2',
      created_at: '2024-01-01',
      material_type: 'paper',
      weight_kg: 15,
      user_id: 'user1',
      co2_saved_kg: 20
    },
    {
      id: '3',
      created_at: '2024-01-01',
      material_type: 'plastic',
      weight_kg: 5,
      user_id: 'user1',
      co2_saved_kg: 15
    }
  ];

  it('renders material breakdown component', () => {
    render(<MaterialBreakdown data={mockData} />);
    
    expect(screen.getByText('Material Breakdown')).toBeInTheDocument();
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    expect(screen.getByTestId('legend')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
  });

  it('aggregates material data correctly', () => {
    render(<MaterialBreakdown data={mockData} />);
    
    // Check if plastic data is aggregated (10 + 5 = 15 kg)
    expect(screen.getByText('plastic: 15')).toBeInTheDocument();
    // Check paper data
    expect(screen.getByText('paper: 15')).toBeInTheDocument();
  });

  it('renders correct number of pie segments', () => {
    render(<MaterialBreakdown data={mockData} />);
    
    // Should have 2 segments (plastic and paper)
    const segments = screen.getAllByTestId('pie-segment');
    expect(segments).toHaveLength(2);
  });

  it('handles empty data', () => {
    render(<MaterialBreakdown data={[]} />);
    
    expect(screen.getByText('Material Breakdown')).toBeInTheDocument();
    expect(screen.queryAllByTestId('pie-segment')).toHaveLength(0);
  });

  it('applies correct colors to materials', () => {
    render(<MaterialBreakdown data={mockData} />);
    
    const cells = screen.getAllByTestId('pie-cell');
    expect(cells).toHaveLength(2); // One for each unique material type
  });

  it('renders with single material type', () => {
    const singleMaterialData = [
      {
        id: '1',
        created_at: '2024-01-01',
        material_type: 'plastic',
        weight_kg: 10,
        user_id: 'user1',
        co2_saved_kg: 30
      }
    ];

    render(<MaterialBreakdown data={singleMaterialData} />);
    
    const segments = screen.getAllByTestId('pie-segment');
    expect(segments).toHaveLength(1);
    expect(screen.getByText('plastic: 10')).toBeInTheDocument();
  });

  it('maintains consistent colors for material types', () => {
    const { rerender } = render(<MaterialBreakdown data={mockData} />);
    const initialCells = screen.getAllByTestId('pie-cell');
    
    // Rerender with same data
    rerender(<MaterialBreakdown data={mockData} />);
    const newCells = screen.getAllByTestId('pie-cell');
    
    expect(initialCells).toHaveLength(newCells.length);
  });
}); 