import { createClient } from '@supabase/supabase-js'

const url = 'https://cukqrzxfcveolzvbhtnt.supabase.co'
const key = 'sb_publishable_8KSqgPGqXiI7uPCShE3Oog_4qWd9s-k'

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true }
})
