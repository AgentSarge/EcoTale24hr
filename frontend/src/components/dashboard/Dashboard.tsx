import { useEcoStore } from '../../stores/ecoStore';
import { TaskList } from '../tasks/TaskList';
import { AddTask } from '../tasks/AddTask';

export const Dashboard = () => {
  const { userPoints, tasks } = useEcoStore();
  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Eco Impact</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-green-600">Total Points</p>
            <p className="mt-2 text-3xl font-bold text-green-900">{userPoints}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-blue-600">Tasks Completed</p>
            <p className="mt-2 text-3xl font-bold text-blue-900">{completedTasks}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-purple-600">Completion Rate</p>
            <p className="mt-2 text-3xl font-bold text-purple-900">
              {totalTasks === 0 ? '0' : Math.round((completedTasks / totalTasks) * 100)}%
            </p>
          </div>
        </div>
      </div>

      {/* Task Management */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Eco Tasks</h2>
        </div>
        <AddTask />
        <TaskList />
      </div>

      {/* Environmental Tips */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Eco Tips</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-semibold text-yellow-800">Energy Saving</h3>
            <p className="mt-2 text-yellow-700">Turn off lights and unplug devices when not in use to reduce energy consumption.</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-green-800">Reduce Waste</h3>
            <p className="mt-2 text-green-700">Use reusable bags, containers, and water bottles to minimize single-use plastics.</p>
          </div>
        </div>
      </div>
    </div>
  );
}; 