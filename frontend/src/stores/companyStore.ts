import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface SustainabilityGoal {
  id: string;
  companyId: string;
  title: string;
  targetDate: string;
  targetValue: number;
  currentValue: number;
  metric: string;
  createdAt: string;
}

export interface CompanyProfile {
  id: string;
  name: string;
  industry: string;
  region: string;
  sustainabilityGoals: SustainabilityGoal[];
  recyclingRate: number;
  co2Saved: number;
  topRecycledProduct: string;
  competitorAlerts: string[];
  createdAt: string;
  updatedAt: string;
}

interface CompanyState {
  profile: CompanyProfile | null;
  isLoading: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<CompanyProfile>) => Promise<void>;
  addSustainabilityGoal: (goal: Omit<SustainabilityGoal, 'id' | 'companyId' | 'createdAt'>) => Promise<void>;
  updateSustainabilityGoal: (goalId: string, data: Partial<SustainabilityGoal>) => Promise<void>;
}

export const useCompanyStore = create<CompanyState>((set, get) => ({
  profile: null,
  isLoading: false,
  error: null,

  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: profile, error } = await supabase
        .from('company_profiles')
        .select('*, sustainability_goals(*)')
        .single();

      if (error) throw error;
      set({ profile });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  updateProfile: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const { data: updatedProfile, error } = await supabase
        .from('company_profiles')
        .update(data)
        .eq('id', get().profile?.id)
        .select('*, sustainability_goals(*)')
        .single();

      if (error) throw error;
      set({ profile: updatedProfile });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  addSustainabilityGoal: async (goal) => {
    set({ isLoading: true, error: null });
    try {
      const { data: newGoal, error } = await supabase
        .from('sustainability_goals')
        .insert([
          {
            ...goal,
            companyId: get().profile?.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      const currentProfile = get().profile;
      if (currentProfile) {
        set({
          profile: {
            ...currentProfile,
            sustainabilityGoals: [...currentProfile.sustainabilityGoals, newGoal],
          },
        });
      }
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  updateSustainabilityGoal: async (goalId, data) => {
    set({ isLoading: true, error: null });
    try {
      const { data: updatedGoal, error } = await supabase
        .from('sustainability_goals')
        .update(data)
        .eq('id', goalId)
        .select()
        .single();

      if (error) throw error;

      const currentProfile = get().profile;
      if (currentProfile) {
        set({
          profile: {
            ...currentProfile,
            sustainabilityGoals: currentProfile.sustainabilityGoals.map((goal) =>
              goal.id === goalId ? updatedGoal : goal
            ),
          },
        });
      }
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },
})); 