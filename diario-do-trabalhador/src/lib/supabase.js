import { createClient } from '@supabase/supabase-js'

const url = 'https://thxqpyygvmwmcbrmlecw.supabase.co'
const key = 'sb_publishable_8ku9a2Qgi8ace9QVqnYbxw_pGUwwaSf'

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true }
})
