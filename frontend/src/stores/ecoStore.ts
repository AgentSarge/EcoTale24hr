import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import * as Sentry from '@sentry/react';

interface EcoTask {
  id: string;
  title: string;
  description: string;
  points: number;
  completed: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface EcoState {
  tasks: EcoTask[];
  isLoading: boolean;
  error: string | null;
  fetchTasks: () => Promise<void>;
  addTask: (task: Omit<EcoTask, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Omit<EcoTask, 'id' | 'created_at' | 'updated_at' | 'user_id'>>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
}

export const useEcoStore = create<EcoState>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,

  fetchTasks: async () => {
    try {
      set({ isLoading: true, error: null });
      const { data, error } = await supabase
        .from('eco_tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ tasks: data || [] });

      Sentry.addBreadcrumb({
        category: 'tasks',
        message: 'Fetched eco tasks',
        data: { count: data?.length },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch tasks';
      set({ error: message });
      Sentry.captureException(err, {
        extra: { context: 'fetchTasks' },
      });
    } finally {
      set({ isLoading: false });
    }
  },

  addTask: async (task) => {
    try {
      set({ isLoading: true, error: null });
      const { data, error } = await supabase
        .from('eco_tasks')
        .insert([task])
        .select()
        .single();

      if (error) throw error;
      set(state => ({ tasks: [data, ...state.tasks] }));

      Sentry.addBreadcrumb({
        category: 'tasks',
        message: 'Added new eco task',
        data: { taskTitle: task.title },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add task';
      set({ error: message });
      Sentry.captureException(err, {
        extra: { context: 'addTask', task },
      });
    } finally {
      set({ isLoading: false });
    }
  },

  updateTask: async (id, updates) => {
    try {
      set({ isLoading: true, error: null });
      const { data, error } = await supabase
        .from('eco_tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      set(state => ({
        tasks: state.tasks.map(task => 
          task.id === id ? { ...task, ...data } : task
        ),
      }));

      Sentry.addBreadcrumb({
        category: 'tasks',
        message: 'Updated eco task',
        data: { taskId: id, updates },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update task';
      set({ error: message });
      Sentry.captureException(err, {
        extra: { context: 'updateTask', taskId: id, updates },
      });
    } finally {
      set({ isLoading: false });
    }
  },

  deleteTask: async (id) => {
    try {
      set({ isLoading: true, error: null });
      const { error } = await supabase
        .from('eco_tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      set(state => ({
        tasks: state.tasks.filter(task => task.id !== id),
      }));

      Sentry.addBreadcrumb({
        category: 'tasks',
        message: 'Deleted eco task',
        data: { taskId: id },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete task';
      set({ error: message });
      Sentry.captureException(err, {
        extra: { context: 'deleteTask', taskId: id },
      });
    } finally {
      set({ isLoading: false });
    }
  },

  toggleTask: async (id) => {
    const task = get().tasks.find(t => t.id === id);
    if (!task) return;

    await get().updateTask(id, { completed: !task.completed });
  },
})); 