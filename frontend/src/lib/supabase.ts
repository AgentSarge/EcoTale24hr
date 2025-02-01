import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export type RecyclingData = {
  id: string;
  created_at: string;
  user_id: string;
  material_type: 'plastic' | 'paper' | 'glass' | 'metal';
  weight_kg: number;
  co2_saved_kg: number;
};

export type Profile = {
  id: string;
  created_at: string;
  username: string;
  avatar_url?: string;
  total_recycled_kg: number;
  total_co2_saved_kg: number;
};

export type Database = {
  public: {
    Tables: {
      recycling_data: {
        Row: RecyclingData;
        Insert: Omit<RecyclingData, 'id' | 'created_at'>;
        Update: Partial<Omit<RecyclingData, 'id' | 'created_at'>>;
      };
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'id' | 'created_at' | 'total_recycled_kg' | 'total_co2_saved_kg'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
    };
  };
};

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

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