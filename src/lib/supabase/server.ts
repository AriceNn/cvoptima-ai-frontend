// src/lib/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers' // next/headers importu

// Ortam değişkenleri
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Sunucu Bileşenleri, Route Handler'lar, Server Actions için
// --- FONKSİYONU ASYNC YAPTIK ---
export const createClient = async () => {
  // --- AWAIT EKLEDİK ---
  const cookieStore = await cookies() // next/headers'dan alıyoruz

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        // 'cookieStore' artık Promise değil, doğrudan nesne
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          // 'cookieStore' artık Promise değil, doğrudan nesne
          cookieStore.set({ name, value, ...options })
        } catch (error) {
           // console.warn(`Server Component cookie set error ('${name}'):`, error)
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          // 'cookieStore' artık Promise değil, doğrudan nesne
          cookieStore.set({ name, value: '', ...options })
        } catch (error) {
           // console.warn(`Server Component cookie remove error ('${name}'):`, error)
        }
      },
    },
  })
}