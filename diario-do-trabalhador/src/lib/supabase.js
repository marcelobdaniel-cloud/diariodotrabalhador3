import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL || 'COLE_AQUI_A_SUA_PROJECT_URL'
const key =
  import.meta.env.VITE_SUPABASE_KEY || 'COLE_AQUI_A_SUA_PUBLISHABLE_KEY'

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true }
})
