import { render, screen, act } from '@testing-library/react';
import { Tasks } from '../Tasks';
import { useTaskStore } from '../../../stores/taskStore';

// Mock the taskStore
jest.mock('../../../stores/taskStore');

describe('Tasks', () => {
  const mockTasks = [
    {
      id: '1',
      title: 'Recycle Plastics',
      description: 'Collect and recycle plastic materials',
      progress: 7.5,
      targetKg: 10,
      completed: false,
      expiresAt: '2024-02-01T00:00:00Z'
    },
    {
      id: '2',
      title: 'Paper Collection',
      description: 'Gather paper for recycling',
      progress: 15,
      targetKg: 15,
      completed: true,
      expiresAt: '2024-02-02T00:00:00Z'
    }
  ];

  const mockGenerateTasks = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    (useTaskStore as jest.Mock).mockReturnValue({
      tasks: mockTasks,
      streak: 5,
      generateTasks: mockGenerateTasks
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('renders tasks component with streak banner', () => {
    render(<Tasks />);
    
    expect(screen.getByText('Current Streak')).toBeInTheDocument();
    expect(screen.getByText('5 days')).toBeInTheDocument();
  });

  it('displays all tasks', () => {
    render(<Tasks />);
    
    mockTasks.forEach(task => {
      expect(screen.getByText(task.title)).toBeInTheDocument();
      expect(screen.getByText(task.description)).toBeInTheDocument();
    });
  });

  it('shows correct progress for tasks', () => {
    render(<Tasks />);
    
    mockTasks.forEach(task => {
      expect(screen.getByText(`${task.progress.toFixed(1)} / ${task.targetKg} kg`)).toBeInTheDocument();
    });
  });

  it('displays correct status badges', () => {
    render(<Tasks />);
    
    const completedTask = mockTasks.find(t => t.completed);
    const inProgressTask = mockTasks.find(t => !t.completed);
    
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    
    const completedBadge = screen.getByText('Completed').closest('span');
    const inProgressBadge = screen.getByText('In Progress').closest('span');
    
    expect(completedBadge).toHaveClass('bg-green-100');
    expect(inProgressBadge).toHaveClass('bg-blue-100');
  });

  it('shows expiration dates', () => {
    render(<Tasks />);
    
    mockTasks.forEach(task => {
      const date = new Date(task.expiresAt).toLocaleDateString();
      expect(screen.getByText(`Expires: ${date}`)).toBeInTheDocument();
    });
  });

  it('generates tasks on mount', () => {
    render(<Tasks />);
    expect(mockGenerateTasks).toHaveBeenCalledTimes(1);
  });

  it('sets up task generation interval', () => {
    render(<Tasks />);
    
    // Fast-forward time by 1 hour
    act(() => {
      jest.advanceTimersByTime(60 * 60 * 1000);
    });
    
    expect(mockGenerateTasks).toHaveBeenCalledTimes(2);
  });

  it('cleans up interval on unmount', () => {
    const { unmount } = render(<Tasks />);
    
    unmount();
    
    // Fast-forward time by 1 hour
    act(() => {
      jest.advanceTimersByTime(60 * 60 * 1000);
    });
    
    expect(mockGenerateTasks).toHaveBeenCalledTimes(1); // Only the initial call
  });

  it('shows empty state when no tasks', () => {
    (useTaskStore as jest.Mock).mockReturnValue({
      tasks: [],
      streak: 0,
      generateTasks: mockGenerateTasks
    });
    
    render(<Tasks />);
    
    expect(screen.getByText('No Active Tasks')).toBeInTheDocument();
    expect(screen.getByText('Check back later for new recycling tasks!')).toBeInTheDocument();
  });

  it('hides streak banner when streak is 0', () => {
    (useTaskStore as jest.Mock).mockReturnValue({
      tasks: mockTasks,
      streak: 0,
      generateTasks: mockGenerateTasks
    });
    
    render(<Tasks />);
    
    expect(screen.queryByText('Current Streak')).not.toBeInTheDocument();
  });

  it('applies correct progress bar colors', () => {
    render(<Tasks />);
    
    const completedTask = mockTasks.find(t => t.progress === t.targetKg);
    const inProgressTask = mockTasks.find(t => t.progress < t.targetKg);
    
    if (completedTask) {
      const completedBar = screen.getByTestId(`progress-bar-${completedTask.id}`);
      expect(completedBar).toHaveClass('bg-green-500');
    }
    
    if (inProgressTask) {
      const inProgressBar = screen.getByTestId(`progress-bar-${inProgressTask.id}`);
      expect(inProgressBar).toHaveClass(inProgressTask.progress >= inProgressTask.targetKg / 2 ? 'bg-yellow-500' : 'bg-blue-500');
    }
  });
}); 