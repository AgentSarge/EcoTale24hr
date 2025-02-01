import { useEffect } from 'react';
import { useTaskStore } from '../../stores/taskStore';
import { Container } from '../layout/Container';

export const Tasks = () => {
  const { tasks, streak, generateTasks } = useTaskStore();

  useEffect(() => {
    generateTasks();
    // Check for new tasks every hour
    const interval = setInterval(generateTasks, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [generateTasks]);

  const getProgressColor = (progress: number, target: number) => {
    const percentage = (progress / target) * 100;
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  return (
    <Container>
      <div className="space-y-6">
        {/* Streak Banner */}
        {streak > 0 && (
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-4 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🔥</span>
                <div>
                  <h3 className="font-bold">Current Streak</h3>
                  <p className="text-sm opacity-90">Keep up the great work!</p>
                </div>
              </div>
              <div className="text-3xl font-bold">{streak} days</div>
            </div>
          </div>
        )}

        {/* Tasks Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden"
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {task.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {task.description}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    task.completed
                      ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
                  }`}>
                    {task.completed ? 'Completed' : 'In Progress'}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Progress</span>
                    <span>{task.progress.toFixed(1)} / {task.targetKg} kg</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${getProgressColor(task.progress, task.targetKg)}`}
                      style={{ width: `${Math.min((task.progress / task.targetKg) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    Expires: {new Date(task.expiresAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {tasks.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              No Active Tasks
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Check back later for new recycling tasks!
            </p>
          </div>
        )}
      </div>
    </Container>
  );
}; 