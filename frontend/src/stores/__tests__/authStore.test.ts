import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '../authStore';
import { supabase } from '../../lib/supabase';

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      session: null,
      isLoading: false,
      error: null,
    });
  });

  describe('signIn', () => {
    it('should successfully sign in a user', async () => {
      const mockSession = {
        user: { id: '123', email: 'test@example.com' },
        session: { access_token: 'token' },
      };

      vi.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValueOnce({
        data: mockSession,
        error: null,
      });

      vi.spyOn(supabase.auth, 'getSession').mockResolvedValueOnce({
        data: { session: mockSession },
        error: null,
      });

      const { signIn } = useAuthStore.getState();
      await signIn('test@example.com', 'password');

      const state = useAuthStore.getState();
      expect(state.error).toBeNull();
      expect(state.isLoading).toBeFalse();
    });

    it('should handle sign in errors', async () => {
      vi.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValueOnce({
        data: null,
        error: new Error('Invalid credentials'),
      });

      const { signIn } = useAuthStore.getState();
      await signIn('test@example.com', 'wrong-password');

      const state = useAuthStore.getState();
      expect(state.error).toBeInstanceOf(Error);
      expect(state.error?.message).toBe('Invalid credentials');
      expect(state.isLoading).toBeFalse();
    });
  });

  describe('signUp', () => {
    it('should successfully sign up a new user', async () => {
      vi.spyOn(supabase.auth, 'signUp').mockResolvedValueOnce({
        data: {},
        error: null,
      });

      const { signUp } = useAuthStore.getState();
      await signUp({
        email: 'new@example.com',
        password: 'password',
        metadata: {
          companyName: 'Test Corp',
          industry: 'Technology',
        },
      });

      const state = useAuthStore.getState();
      expect(state.error).toBeNull();
      expect(state.isLoading).toBeFalse();
    });
  });

  describe('signOut', () => {
    it('should successfully sign out a user', async () => {
      vi.spyOn(supabase.auth, 'signOut').mockResolvedValueOnce({
        error: null,
      });

      const { signOut } = useAuthStore.getState();
      await signOut();

      const state = useAuthStore.getState();
      expect(state.session).toBeNull();
      expect(state.error).toBeNull();
      expect(state.isLoading).toBeFalse();
    });
  });
}); 