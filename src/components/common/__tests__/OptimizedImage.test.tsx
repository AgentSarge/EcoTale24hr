import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import OptimizedImage from '../OptimizedImage';
import { monitoring } from '@/lib/monitoring';

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock monitoring service
vi.mock('@/lib/monitoring', () => ({
  monitoring: {
    setTag: vi.fn(),
    captureException: vi.fn(),
  },
}));

describe('OptimizedImage', () => {
  const defaultProps = {
    src: 'test-image.jpg',
    alt: 'Test image',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with default props', () => {
    render(<OptimizedImage {...defaultProps} />);
    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('alt', 'Test image');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('renders with priority loading', () => {
    render(<OptimizedImage {...defaultProps} priority />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('loading', 'eager');
    expect(img).toHaveAttribute('src', 'test-image.jpg');
  });

  it('handles successful image load', () => {
    const onLoad = vi.fn();
    render(<OptimizedImage {...defaultProps} onLoad={onLoad} />);
    const img = screen.getByRole('img');
    fireEvent.load(img);
    expect(onLoad).toHaveBeenCalled();
    expect(img).toHaveClass('opacity-100');
  });

  it('handles image load error', () => {
    const onError = vi.fn();
    render(<OptimizedImage {...defaultProps} onError={onError} />);
    const img = screen.getByRole('img');
    fireEvent.error(img);
    expect(onError).toHaveBeenCalled();
    expect(monitoring.captureException).toHaveBeenCalled();
    expect(screen.getByText('Failed to load image')).toBeInTheDocument();
  });

  it('generates WebP source', () => {
    render(<OptimizedImage {...defaultProps} />);
    const source = screen.getByRole('img').parentElement?.querySelector('source');
    expect(source).toHaveAttribute('type', 'image/webp');
    expect(source).toHaveAttribute('srcSet', 'test-image.webp');
  });

  it('applies custom className', () => {
    render(<OptimizedImage {...defaultProps} className="custom-class" />);
    const container = screen.getByRole('img').parentElement;
    expect(container).toHaveClass('custom-class');
  });

  it('sets width and height attributes', () => {
    render(<OptimizedImage {...defaultProps} width={100} height={100} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('width', '100');
    expect(img).toHaveAttribute('height', '100');
  });
}); 