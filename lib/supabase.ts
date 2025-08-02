import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface UserConnection {
  id: number
  user_id: string
  provider: string
  access_token?: string
  refresh_token?: string
  system_id?: string
  api_key?: string
  system_size?: number
  monthly_generation?: number
  country?: string
  connected_at: string
  last_sync?: string
  is_active: boolean
}
