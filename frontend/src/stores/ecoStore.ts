import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface EcoTask {
  id: string;
  title: string;
  description: string;
  points: number;
  completed: boolean;
  userId: string;
  createdAt: string;
}

interface EcoStore {
  tasks: EcoTask[];
  userPoints: number;
  isLoading: boolean;
  error: string | null;
  fetchTasks: () => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  addTask: (task: Omit<EcoTask, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
}

export const useEcoStore = create<EcoStore>((set, get) => ({
  tasks: [],
  userPoints: 0,
  isLoading: false,
  error: null,

  fetchTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: tasks, error } = await supabase
        .from('eco_tasks')
        .select('*')
        .order('createdAt', { ascending: false });

      if (error) throw error;
      set({ tasks, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  completeTask: async (taskId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('eco_tasks')
        .update({ completed: true })
        .eq('id', taskId);

      if (error) throw error;

      const tasks = get().tasks;
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        set(state => ({
          tasks: tasks.map(t => t.id === taskId ? { ...t, completed: true } : t),
          userPoints: state.userPoints + task.points,
        }));
      }
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  addTask: async (task) => {
    set({ isLoading: true, error: null });
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      const newTask = {
        ...task,
        userId: userData.user.id,
        createdAt: new Date().toISOString(),
        completed: false,
      };

      const { data, error } = await supabase
        .from('eco_tasks')
        .insert([newTask])
        .select()
        .single();

      if (error) throw error;
      set(state => ({ tasks: [data, ...state.tasks] }));
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },
})); 