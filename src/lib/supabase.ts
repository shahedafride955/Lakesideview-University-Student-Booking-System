import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database types based on the schema
export interface DbResource {
  id: string;
  name: string;
  type: string;
  capacity: number;
  building: string;
  floor: string;
  features: string;
  image_url: string;
  is_active: boolean;
  created_at: string;
}

export interface DbUser {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface DbBooking {
  id: string;
  resource_id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  status: string;
  created_at: string;
}

export interface DbHistoricalUsage {
  id: string;
  resource_id: string;
  recorded_at: string;
  occupancy_count: number;
}