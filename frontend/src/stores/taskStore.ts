import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as Sentry from '@sentry/react';
import { useNotificationStore } from './notificationStore';

export interface Task {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly';
  targetKg: number;
  progress: number;
  completed: boolean;
  expiresAt: Date;
  createdAt: Date;
}

interface TaskState {
  tasks: Task[];
  streak: number;
  lastCompletedDate: string | null;
  isLoading: boolean;
  error: string | null;
  generateTasks: () => void;
  updateProgress: (recycledKg: number) => void;
  checkStreak: () => void;
}

const createTask = (type: 'daily' | 'weekly'): Task => {
  const now = new Date();
  const expiresAt = new Date(now);
  
  if (type === 'daily') {
    expiresAt.setDate(now.getDate() + 1);
    expiresAt.setHours(0, 0, 0, 0);
  } else {
    expiresAt.setDate(now.getDate() + 7);
    expiresAt.setHours(0, 0, 0, 0);
  }

  return {
    id: crypto.randomUUID(),
    title: type === 'daily' ? 'Daily Recycling Goal' : 'Weekly Recycling Challenge',
    description: type === 'daily' 
      ? 'Recycle at least 1kg of materials today'
      : 'Recycle at least 5kg of materials this week',
    type,
    targetKg: type === 'daily' ? 1 : 5,
    progress: 0,
    completed: false,
    expiresAt,
    createdAt: now,
  };
};

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      streak: 0,
      lastCompletedDate: null,
      isLoading: false,
      error: null,

      generateTasks: () => {
        const now = new Date();
        const currentTasks = get().tasks.filter(task => new Date(task.expiresAt) > now);
        
        const newTasks: Task[] = [];
        
        // Generate daily task if none exists
        if (!currentTasks.some(task => task.type === 'daily')) {
          newTasks.push(createTask('daily'));
        }
        
        // Generate weekly task if none exists
        if (!currentTasks.some(task => task.type === 'weekly')) {
          newTasks.push(createTask('weekly'));
        }

        set((state) => ({
          tasks: [...currentTasks, ...newTasks],
        }));

        if (newTasks.length > 0) {
          const addNotification = useNotificationStore.getState().addNotification;
          addNotification({
            type: 'task',
            title: 'New Tasks Available',
            message: 'Check out your new recycling tasks for today!',
            expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Expires in 24 hours
          });
        }
      },

      updateProgress: (recycledKg: number) => {
        const now = new Date();
        const addNotification = useNotificationStore.getState().addNotification;
        
        set((state) => {
          const updatedTasks = state.tasks.map(task => {
            if (new Date(task.expiresAt) < now || task.completed) {
              return task;
            }

            const newProgress = task.progress + recycledKg;
            const justCompleted = !task.completed && newProgress >= task.targetKg;

            if (justCompleted) {
              addNotification({
                type: 'task',
                title: `${task.type === 'daily' ? 'Daily' : 'Weekly'} Task Completed!`,
                message: `Congratulations! You've reached your ${task.type} recycling goal!`,
              });
            }

            return {
              ...task,
              progress: newProgress,
              completed: newProgress >= task.targetKg,
            };
          });

          return { tasks: updatedTasks };
        });

        get().checkStreak();
      },

      checkStreak: () => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const today = now.toISOString().split('T')[0];
        const lastCompleted = get().lastCompletedDate;
        const addNotification = useNotificationStore.getState().addNotification;

        // Check if any daily task was completed today
        const completedToday = get().tasks.some(
          task => task.type === 'daily' && task.completed && 
          new Date(task.expiresAt).toISOString().split('T')[0] === today
        );

        if (completedToday) {
          set((state) => {
            const yesterday = new Date(now);
            yesterday.setDate(now.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            let newStreak = state.streak;
            if (lastCompleted === yesterdayStr) {
              newStreak += 1;
              if (newStreak % 7 === 0) {
                addNotification({
                  type: 'streak',
                  title: '🔥 Week-long Streak!',
                  message: `Amazing! You've maintained your recycling streak for ${newStreak} days!`,
                });
              }
            } else if (lastCompleted !== today) {
              newStreak = 1;
            }

            return {
              streak: newStreak,
              lastCompletedDate: today,
            };
          });
        }
      },
    }),
    {
      name: 'ecotale-tasks',
      partialize: (state) => ({ 
        tasks: state.tasks,
        streak: state.streak,
        lastCompletedDate: state.lastCompletedDate,
      }),
    }
  )
); 