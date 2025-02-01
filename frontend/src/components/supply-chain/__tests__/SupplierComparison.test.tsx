import { render, screen, fireEvent } from '@testing-library/react';
import { SupplierComparison } from '../SupplierComparison';

// Mock data
const mockSuppliers = [
  {
    id: '1',
    name: 'EcoRecycle Solutions',
    recoveryRate: 95,
    processingTime: 24,
    costPerTon: 150,
    qualityScore: 4.8,
    carbonFootprint: 0.5,
    capacity: 1000,
    reliability: 98
  },
  {
    id: '2',
    name: 'GreenProcess Inc',
    recoveryRate: 92,
    processingTime: 36,
    costPerTon: 130,
    qualityScore: 4.5,
    carbonFootprint: 0.8,
    capacity: 800,
    reliability: 95
  }
];

// Mock the module that contains the mockSuppliers data
jest.mock('../../../data/mockData', () => ({
  mockSuppliers
}));

describe('SupplierComparison', () => {
  it('renders supplier comparison component', () => {
    render(<SupplierComparison />);
    
    expect(screen.getByText('Supplier Comparison')).toBeInTheDocument();
    expect(screen.getByText('Select Suppliers')).toBeInTheDocument();
    expect(screen.getByText('Compare by Metric')).toBeInTheDocument();
  });

  it('displays all suppliers', () => {
    render(<SupplierComparison />);
    
    mockSuppliers.forEach(supplier => {
      expect(screen.getByText(supplier.name)).toBeInTheDocument();
    });
  });

  it('allows selecting suppliers', () => {
    render(<SupplierComparison />);
    
    const firstSupplier = screen.getByText(mockSuppliers[0].name);
    fireEvent.click(firstSupplier);
    
    expect(firstSupplier.closest('button')).toHaveClass('border-green-500');
  });

  it('enables quote request button when suppliers are selected', () => {
    render(<SupplierComparison />);
    
    const quoteButton = screen.getByText('Request Quote');
    expect(quoteButton).toBeDisabled();
    
    const supplier = screen.getByText(mockSuppliers[0].name);
    fireEvent.click(supplier);
    
    expect(quoteButton).not.toBeDisabled();
  });

  it('allows changing comparison metric', () => {
    render(<SupplierComparison />);
    
    const metricSelect = screen.getByRole('combobox');
    fireEvent.change(metricSelect, { target: { value: 'costPerTon' } });
    
    expect(metricSelect).toHaveValue('costPerTon');
  });

  it('displays correct metric values for selected suppliers', () => {
    render(<SupplierComparison />);
    
    // Select first supplier
    fireEvent.click(screen.getByText(mockSuppliers[0].name));
    
    // Check if the recovery rate is displayed
    expect(screen.getByText('95 %')).toBeInTheDocument();
    
    // Change metric to cost per ton
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'costPerTon' } });
    
    // Check if the cost per ton is displayed
    expect(screen.getByText('150 USD')).toBeInTheDocument();
  });

  it('applies correct color coding for metrics', () => {
    render(<SupplierComparison />);
    
    // Select both suppliers
    mockSuppliers.forEach(supplier => {
      fireEvent.click(screen.getByText(supplier.name));
    });
    
    // The supplier with better recovery rate should have a greener color
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars[0]).toHaveStyle({ backgroundColor: expect.stringContaining('hsl(120') });
  });

  it('handles supplier deselection', () => {
    render(<SupplierComparison />);
    
    const supplier = screen.getByText(mockSuppliers[0].name);
    
    // Select supplier
    fireEvent.click(supplier);
    expect(supplier.closest('button')).toHaveClass('border-green-500');
    
    // Deselect supplier
    fireEvent.click(supplier);
    expect(supplier.closest('button')).not.toHaveClass('border-green-500');
  });
}); 