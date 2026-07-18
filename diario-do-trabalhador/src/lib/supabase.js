import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL || 'https://cukqrzxfcveolzvbhtnt.supabase.co'
const key =
  import.meta.env.VITE_SUPABASE_KEY || 'sb_publishable_8KSqgPGqXiI7uPCShE3Oog_4qWd9s-k'

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true }
})
