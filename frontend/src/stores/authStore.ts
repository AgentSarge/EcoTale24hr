import { create } from 'zustand';
import { supabase, type UserSession } from '../lib/supabase';
import * as Sentry from '@sentry/react';

interface SignUpData {
  email: string;
  password: string;
  metadata?: {
    companyName?: string;
    industry?: string;
  };
}

interface AuthState {
  session: UserSession | null;
  isLoading: boolean;
  error: Error | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: { full_name?: string; avatar_url?: string }) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  isLoading: true,
  error: null,

  signIn: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      // Set user context in Sentry
      const session = await supabase.auth.getSession();
      if (session.data.session?.user) {
        Sentry.setUser({
          id: session.data.session.user.id,
          email: session.data.session.user.email,
        });
      }
    } catch (error) {
      set({ error: error as Error });
      Sentry.captureException(error);
    } finally {
      set({ isLoading: false });
    }
  },

  signUp: async ({ email, password, metadata }) => {
    try {
      set({ isLoading: true, error: null });
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata }
      });
      if (error) throw error;
    } catch (error) {
      set({ error: error as Error });
      Sentry.captureException(error);
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    try {
      set({ isLoading: true, error: null });
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear user context from Sentry
      Sentry.setUser(null);
      set({ session: null });
    } catch (error) {
      set({ error: error as Error });
      Sentry.captureException(error);
    } finally {
      set({ isLoading: false });
    }
  },

  resetPassword: async (email: string) => {
    try {
      set({ isLoading: true, error: null });
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
    } catch (error) {
      set({ error: error as Error });
      Sentry.captureException(error);
    } finally {
      set({ isLoading: false });
    }
  },

  updateProfile: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const { error } = await supabase.auth.updateUser({
        data
      });
      if (error) throw error;

      // Update Sentry user context
      const session = get().session;
      if (session?.user) {
        Sentry.setUser({
          id: session.user.id,
          email: session.user.email,
          ...data
        });
      }
    } catch (error) {
      set({ error: error as Error });
      Sentry.captureException(error);
    } finally {
      set({ isLoading: false });
    }
  }
})); 