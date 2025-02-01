import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import * as Sentry from '@sentry/react';
import { useNotificationStore } from './notificationStore';
import { useTaskStore } from './taskStore';

interface RecyclingEntry {
  id: string;
  user_id: string;
  material_type: string;
  weight_kg: number;
  co2_saved_kg: number;
  created_at: string;
}

interface RecyclingState {
  recyclingData: RecyclingEntry[];
  isLoading: boolean;
  error: string | null;
  fetchRecyclingData: () => Promise<void>;
  addRecyclingEntry: (entry: Omit<RecyclingEntry, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  deleteRecyclingEntry: (id: string) => Promise<void>;
}

const checkAchievements = (totalRecycled: number, addNotification: Function) => {
  // Major milestones
  if (totalRecycled >= 1000) {
    addNotification({
      type: 'achievement',
      title: '🏆 Master Recycler Achievement',
      message: 'Congratulations! You\'ve recycled over 1,000kg of materials!',
    });
  } else if (totalRecycled >= 500) {
    addNotification({
      type: 'achievement',
      title: '🌟 Pro Recycler Achievement',
      message: 'Amazing! You\'ve recycled over 500kg of materials!',
    });
  } else if (totalRecycled >= 100) {
    addNotification({
      type: 'achievement',
      title: '🌱 Green Warrior Achievement',
      message: 'Great job! You\'ve recycled over 100kg of materials!',
    });
  }

  // CO2 impact milestones
  const co2Saved = totalRecycled * 2.5; // Approximate CO2 savings per kg
  if (co2Saved >= 1000) {
    addNotification({
      type: 'achievement',
      title: '🌍 Climate Champion',
      message: 'Your recycling has saved over 1,000kg of CO2 emissions!',
    });
  }
};

const checkMaterialMilestones = (entries: RecyclingEntry[], addNotification: Function) => {
  const materialTotals = entries.reduce((acc, entry) => {
    acc[entry.material_type] = (acc[entry.material_type] || 0) + entry.weight_kg;
    return acc;
  }, {} as Record<string, number>);

  Object.entries(materialTotals).forEach(([material, total]) => {
    if (total >= 100) {
      addNotification({
        type: 'milestone',
        title: `♻️ ${material} Specialist`,
        message: `You've recycled over 100kg of ${material}!`,
      });
    }
  });
};

export const useRecyclingStore = create<RecyclingState>((set, get) => ({
  recyclingData: [],
  isLoading: false,
  error: null,

  fetchRecyclingData: async () => {
    try {
      set({ isLoading: true, error: null });
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('recycling_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ recyclingData: data });

      Sentry.addBreadcrumb({
        category: 'recycling',
        message: 'Fetched recycling data',
        data: { count: data.length },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch recycling data';
      set({ error: message });
      Sentry.captureException(err, {
        extra: { context: 'fetchRecyclingData' },
      });
    } finally {
      set({ isLoading: false });
    }
  },

  addRecyclingEntry: async (entry) => {
    try {
      set({ isLoading: true, error: null });
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('recycling_entries')
        .insert([{ ...entry, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      const updatedData = [data, ...get().recyclingData];
      set({ recyclingData: updatedData });

      // Update tasks progress
      useTaskStore.getState().updateProgress(entry.weight_kg);

      const addNotification = useNotificationStore.getState().addNotification;

      // Check achievements and milestones
      const totalRecycled = updatedData.reduce((sum, e) => sum + e.weight_kg, 0);
      checkAchievements(totalRecycled, addNotification);
      checkMaterialMilestones(updatedData, addNotification);

      // Single entry milestones
      if (entry.weight_kg >= 50) {
        addNotification({
          type: 'milestone',
          title: '🎯 Big Recycling Milestone',
          message: `Wow! You just recycled ${entry.weight_kg.toFixed(1)}kg in one go!`,
        });
      }

      // Daily streaks and records
      const today = new Date().toISOString().split('T')[0];
      const todayTotal = updatedData
        .filter(e => e.created_at.split('T')[0] === today)
        .reduce((sum, e) => sum + e.weight_kg, 0);

      if (todayTotal >= 10) {
        addNotification({
          type: 'milestone',
          title: '📈 Daily Record',
          message: `You've recycled over 10kg today! Keep up the momentum!`,
        });
      }

      Sentry.addBreadcrumb({
        category: 'recycling',
        message: 'Added recycling entry',
        data: { entry },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add recycling entry';
      set({ error: message });
      Sentry.captureException(err, {
        extra: { context: 'addRecyclingEntry', entry },
      });
    } finally {
      set({ isLoading: false });
    }
  },

  deleteRecyclingEntry: async (id) => {
    try {
      set({ isLoading: true, error: null });
      const { error } = await supabase
        .from('recycling_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        recyclingData: state.recyclingData.filter((entry) => entry.id !== id),
      }));

      Sentry.addBreadcrumb({
        category: 'recycling',
        message: 'Deleted recycling entry',
        data: { id },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete recycling entry';
      set({ error: message });
      Sentry.captureException(err, {
        extra: { context: 'deleteRecyclingEntry', id },
      });
    } finally {
      set({ isLoading: false });
    }
  },
})); 