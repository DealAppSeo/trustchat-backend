import { createClient } from '@supabase/supabase-js'

export const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321'
export const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'dummy_anon'
export const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_service'

export const getSupabaseClient = () => createClient(supabaseUrl, supabaseAnonKey)
export const getSupabaseServer = () => createClient(supabaseUrl, supabaseServiceKey)
