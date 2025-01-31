import { useEffect } from 'react';
import { useEcoStore } from '../../stores/ecoStore';

export const TaskList = () => {
  const { tasks, isLoading, error, fetchTasks, completeTask } = useEcoStore();

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
              <p className="mt-1 text-gray-600">{task.description}</p>
              <div className="mt-2 flex items-center space-x-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {task.points} points
                </span>
                {task.completed && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Completed
                  </span>
                )}
              </div>
            </div>
            {!task.completed && (
              <button
                onClick={() => completeTask(task.id)}
                className="ml-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Complete
              </button>
            )}
          </div>
        </div>
      ))}
      {tasks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No eco-tasks available. Start your eco-journey by adding a task!</p>
        </div>
      )}
    </div>
  );
}; 