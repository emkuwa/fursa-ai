import { createBrowserClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || ''
}

function getSupabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
}

export function createClient() {
  const url = getSupabaseUrl()
  const key = getSupabaseAnonKey()
  if (!url || !key) {
    if (typeof window !== 'undefined') {
      console.warn('Supabase env vars not configured')
    }
    return createBrowserClient(url || 'https://placeholder.supabase.co', key || 'placeholder-key')
  }
  return createBrowserClient(url, key)
}

export function createServiceClient() {
  const url = getSupabaseUrl()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || getSupabaseAnonKey()
  return createSupabaseClient(url || 'https://placeholder.supabase.co', key || 'placeholder-key')
}
