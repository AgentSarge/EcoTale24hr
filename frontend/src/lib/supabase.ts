import { createClient } from '@supabase/supabase-js';

interface RecyclingEvent {
  id: string;
  material: 'PET' | 'Aluminum' | 'Glass' | 'Paper';
  weight: number;
  location: string;
  timestamp: string;
}

interface Database {
  public: {
    Tables: {
      recycling_events: {
        Row: RecyclingEvent;
        Insert: Omit<RecyclingEvent, 'id' | 'timestamp'>;
        Update: Partial<Omit<RecyclingEvent, 'id'>>;
      };
    };
  };
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
});

// Type for user session
export type UserSession = {
  user: {
    id: string;
    email?: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
    };
  } | null;
  session: any | null;
}; 