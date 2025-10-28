// middleware.ts (Proje kök dizininde - Nihai Hata Ayıklama Sürümü)
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Ortam değişkenleri (NEXT_PUBLIC_ öneki önemli)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  // Middleware'e özel Supabase istemcisini oluştur
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) { return request.cookies.get(name)?.value },
      set(name: string, value: string, options: CookieOptions) {
        // console.log(`[Middleware] Cookie AYARLANIYOR: ${name}`); // DEBUG
        response.cookies.set({ name, value, ...options })
      },
      remove(name: string, options: CookieOptions) {
        // console.log(`[Middleware] Cookie SİLİNİYOR: ${name}`); // DEBUG
        response.cookies.set({ name, value: '', ...options })
      },
    },
  })

  // Kullanıcı oturumunu al (ve gerekirse yenile)
  // Bu satır kritik! Cookie'leri okur, gerekirse Supabase ile konuşur, cookie'leri güncelleyebilir.
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  // getUser hatasını kontrol et (nadiren olur ama önemlidir)
  if (authError) {
    console.error('[Middleware] Supabase auth.getUser hatası:', authError.message);
    // Hata durumunda ne yapacağına karar ver - belki login'e yönlendir? Şimdilik devam etsin.
  }

  const { pathname } = request.nextUrl // Gidilmeye çalışılan yol

  // --- YÖNLENDİRME KURALLARI ---

  // KORUNAN YOLLAR: Giriş yapmamış kullanıcı erişemez
  // '/dashboard' ile başlayan TÜM yolları koruyalım
  const isProtectedPath = pathname.startsWith('/dashboard');

  // DEBUG LOGLARI
  console.log(`[Middleware] Path: ${pathname}, User found: ${!!user} (Email: ${user?.email ?? 'Yok'}), Is Protected Path: ${isProtectedPath}`);

  // KURAL 1: Giriş YAPMAMIŞSA (user null) VE KORUNAN bir sayfaya gitmeye çalışıyorsa -> /login'e yönlendir
  if (!user && isProtectedPath) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    console.log(`[Middleware] KURAL 1 TETİKLENDİ: Yetkisiz erişim ${pathname}. Yönlendiriliyor -> /login`);
    return NextResponse.redirect(redirectUrl)
  }

  // HERKESE AÇIK AMA GİRİŞ YAPMIŞ KULLANICININ GİTMEMESİ GEREKEN YOLLAR
  const authRoutes = ['/login', '/register']; // Sadece login ve register
  const homeRoute = '/'; // Anasayfa ayrı kontrol edilecek

  // KURAL 2A: Giriş YAPMIŞSA VE /login veya /register'a gitmeye çalışıyorsa -> /dashboard'a yönlendir
  if (user && authRoutes.includes(pathname)) {
     const redirectUrl = request.nextUrl.clone()
     redirectUrl.pathname = '/dashboard'
     console.log(`[Middleware] KURAL 2A TETİKLENDİ: Giriş yapılmış, ${pathname} yasak. Yönlendiriliyor -> /dashboard`);
     return NextResponse.redirect(redirectUrl)
  }

  // KURAL 2B: Giriş YAPMIŞSA VE Anasayfa'ya (/) gitmeye çalışıyorsa -> /dashboard'a yönlendir
  if (user && pathname === homeRoute) {
     const redirectUrl = request.nextUrl.clone()
     redirectUrl.pathname = '/dashboard'
     console.log(`[Middleware] KURAL 2B TETİKLENDİ: Giriş yapılmış, anasayfa (/) yasak. Yönlendiriliyor -> /dashboard`);
     return NextResponse.redirect(redirectUrl)
  }

  // Diğer tüm durumlar normal devam eder
  // Örn: Giriş yapmamış ve /, /login, /register'a gidiyor
  // Örn: Giriş yapmış ve /dashboard, /dashboard/cvs gibi korunan yollara gidiyor
  console.log(`[Middleware] DEVAM EDİLİYOR: ${pathname} erişimine izin verildi.`);
  return response
}

// Middleware'in hangi yollarda çalışacağını yapılandır
export const config = {
  matcher: [
    /*
     * Tüm istek yollarıyla eşleşir, ancak şunlarla başlayanlar hariç:
     * - api (Backend API rotaları)
     * - _next/static (statik dosyalar)
     * - _next/image (resim optimizasyon dosyaları)
     * - favicon.ico (favicon dosyası)
     * - images (varsa public/images klasörü)
     * - dl (dosya indirme yönlendirmesi)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images|dl).*)',
  ],
}