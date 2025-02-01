import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Profile } from '../lib/supabase';
import * as Sentry from '@sentry/react';

interface ProfileState {
  profile: Profile | null;
  profiles: Profile[];
  isLoading: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
  fetchProfiles: () => Promise<void>;
  updateProfile: (updates: Partial<Omit<Profile, 'id' | 'created_at' | 'total_recycled_kg' | 'total_co2_saved_kg'>>) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  profiles: [],
  isLoading: false,
  error: null,

  fetchProfile: async () => {
    try {
      set({ isLoading: true, error: null });
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      set({ profile: data });

      Sentry.addBreadcrumb({
        category: 'profile',
        message: 'Fetched user profile',
        data: {
          username: data.username,
          totalRecycled: data.total_recycled_kg,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch profile';
      set({ error: message });
      Sentry.captureException(err, {
        extra: { context: 'fetchProfile' },
      });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchProfiles: async () => {
    try {
      set({ isLoading: true, error: null });
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('total_recycled_kg', { ascending: false });

      if (error) throw error;
      set({ profiles: data });

      Sentry.addBreadcrumb({
        category: 'profiles',
        message: 'Fetched all profiles for leaderboard',
        data: {
          count: data.length,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch profiles';
      set({ error: message });
      Sentry.captureException(err, {
        extra: { context: 'fetchProfiles' },
      });
    } finally {
      set({ isLoading: false });
    }
  },

  updateProfile: async (updates) => {
    try {
      set({ isLoading: true, error: null });
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      set({ profile: data });

      Sentry.addBreadcrumb({
        category: 'profile',
        message: 'Updated user profile',
        data: { updates },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      set({ error: message });
      Sentry.captureException(err, {
        extra: { context: 'updateProfile', updates },
      });
    } finally {
      set({ isLoading: false });
    }
  },

  uploadAvatar: async (file) => {
    try {
      set({ isLoading: true, error: null });
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('No user found');

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await useProfileStore.getState().updateProfile({
        avatar_url: publicUrl,
      });

      Sentry.addBreadcrumb({
        category: 'profile',
        message: 'Uploaded new avatar',
        data: { fileSize: file.size, fileType: file.type },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload avatar';
      set({ error: message });
      Sentry.captureException(err, {
        extra: { context: 'uploadAvatar' },
      });
    } finally {
      set({ isLoading: false });
    }
  },
})); 