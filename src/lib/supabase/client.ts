// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

// .env.local dosyasından ortam değişkenlerini almamız gerekecek
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const createClient = () => createBrowserClient(supabaseUrl, supabaseAnonKey)