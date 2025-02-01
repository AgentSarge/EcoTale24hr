import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as Sentry from '@sentry/react';

export interface Notification {
  id: string;
  type: 'achievement' | 'milestone' | 'info' | 'task' | 'streak';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

interface NotificationState {
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
  removeExpired: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      isLoading: false,
      error: null,

      addNotification: (notification) => {
        const newNotification: Notification = {
          id: crypto.randomUUID(),
          ...notification,
          read: false,
          createdAt: new Date(),
        };

        // Remove expired notifications before adding new ones
        get().removeExpired();

        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 50), // Keep last 50 notifications
        }));

        // Play notification sound if it's an achievement or milestone
        if (notification.type === 'achievement' || notification.type === 'milestone') {
          const audio = new Audio('/sounds/achievement.mp3');
          audio.volume = 0.5;
          audio.play().catch(() => {}); // Ignore errors if sound can't play
        }

        Sentry.addBreadcrumb({
          category: 'notification',
          message: 'Added new notification',
          data: { notification },
        });
      },

      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      },

      clearAll: () => {
        set({ notifications: [] });
      },

      removeExpired: () => {
        const now = new Date();
        set((state) => ({
          notifications: state.notifications.filter((n) => 
            !n.expiresAt || new Date(n.expiresAt) > now
          ),
        }));
      },
    }),
    {
      name: 'ecotale-notifications',
      partialize: (state) => ({ notifications: state.notifications }),
    }
  )
); 