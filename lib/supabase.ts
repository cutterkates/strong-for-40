import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key not configured. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database types (generated from schema)
export type Database = {
  public: {
    Tables: {
      areas: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string | null;
          icon: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['areas']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['areas']['Insert']>;
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          area_id: string | null;
          name: string;
          description: string | null;
          status: 'active' | 'completed' | 'archived';
          due_date: string | null;
          color: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['projects']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['projects']['Insert']>;
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          area_id: string | null;
          title: string;
          notes: string | null;
          status: 'inbox' | 'today' | 'next' | 'waiting' | 'someday' | 'completed';
          priority: number;
          due_at: string | null;
          duration_min: number | null;
          scheduled_for: string | null;
          time_block_start: string | null;
          time_block_end: string | null;
          completed_at: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['tasks']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['tasks']['Insert']>;
      };
      habits: {
        Row: {
          id: string;
          user_id: string;
          area_id: string | null;
          name: string;
          description: string | null;
          frequency_type: 'daily' | 'weekly';
          weekly_target: number | null;
          color: string | null;
          icon: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['habits']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['habits']['Insert']>;
      };
      habit_logs: {
        Row: {
          id: string;
          user_id: string;
          habit_id: string;
          completed_date: string;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['habit_logs']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['habit_logs']['Insert']>;
      };
      workout_programs: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['workout_programs']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['workout_programs']['Insert']>;
      };
      workouts: {
        Row: {
          id: string;
          user_id: string;
          program_id: string;
          name: string;
          description: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['workouts']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['workouts']['Insert']>;
      };
      exercises: {
        Row: {
          id: string;
          user_id: string;
          workout_id: string;
          name: string;
          notes: string | null;
          target_sets: number;
          target_reps: number;
          current_weight: number;
          weight_increment: number;
          deload_percentage: number;
          failed_attempts: number;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['exercises']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['exercises']['Insert']>;
      };
      workout_sessions: {
        Row: {
          id: string;
          user_id: string;
          workout_id: string;
          session_date: string;
          notes: string | null;
          duration_minutes: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['workout_sessions']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['workout_sessions']['Insert']>;
      };
      exercise_sets: {
        Row: {
          id: string;
          user_id: string;
          session_id: string;
          exercise_id: string;
          set_number: number;
          reps_completed: number;
          weight_used: number;
          rpe: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['exercise_sets']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['exercise_sets']['Insert']>;
      };
    };
  };
};
