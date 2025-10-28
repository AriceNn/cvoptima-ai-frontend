// src/app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server'; // DİKKAT: Sunucu istemcisini kullanıyoruz!
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Bu, sunucu tarafında çalışan bir GET endpoint'idir
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Eğer 'next' parametresi yolladıysak (opsiyonel)
  const next = searchParams.get('next') ?? '/dashboard' // Varsayılan olarak /dashboard'a yolla

  if (code) {
    const supabase = await createClient() // Sunucu istemcisini oluştur
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Başarıyla oturum açıldı, kullanıcıyı 'next' adresine (veya /dashboard'a) yönlendir
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Hata durumunda veya 'code' yoksa, kullanıcıyı hata sayfasıyla birlikte anasayfaya yönlendir
  console.error("Auth Callback Hatası: 'code' alınamadı veya session değiştirilemedi.");
  return NextResponse.redirect(`${origin}/login?error=Oturum açılamadı. Lütfen tekrar deneyin.`);
}