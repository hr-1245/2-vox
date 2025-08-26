import { createClient } from "@/utils/supabase/server"
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from './types'

// Maintain single instance for server-side operations
let supabaseServerInstance: SupabaseClient<Database> | null = null

// Get or create a server-side Supabase client instance
export async function getSupabase() {
  if (!supabaseServerInstance) {
    supabaseServerInstance = await createClient()
  }
  return supabaseServerInstance
}

// Force create a new instance if needed (e.g., after token expiry)
export async function refreshSupabase() {
  supabaseServerInstance = await createClient()
  return supabaseServerInstance
}
