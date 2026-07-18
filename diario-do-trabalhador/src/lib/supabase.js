import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL || 'https://SEU-CODIGO.supabase.co'
const key =
  import.meta.env.VITE_SUPABASE_KEY || 'SUA_CHAVE_PUBLISHABLE'

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true }
})
