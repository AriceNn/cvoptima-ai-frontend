// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Inter as FontSans } from "next/font/google";
import "./globals.css";

import { cn } from "@/lib/utils";
import { Header } from "@/components/Header";
import { ThemeProvider } from "@/components/theme-provider";

// Font optimizasyonu - subset ve display ayarları
const fontSans = FontSans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: 'swap', // Daha iyi performans için
  adjustFontFallback: true, // Font yüklenene kadar fallback font
});

// Viewport ayarları - PWA uyumluluğu ve responsive davranış
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' }
  ],
}

// SEO ve metadata optimizasyonları
export const metadata: Metadata = {
  title: {
    default: "CVOptima - AI Destekli CV ve Ön Yazı Asistanı",
    template: "%s | CVOptima"
  },
  description: "Yapay zeka destekli CV analizi, ön yazı oluşturma ve kariyer danışmanlığı. CV'nizi iş ilanlarına göre optimize edin.",
  keywords: [
    "cv analiz",
    "ön yazı oluşturucu",
    "yapay zeka cv",
    "kariyer danışmanlığı",
    "iş başvurusu",
    "cv optimizasyonu"
  ],
  authors: [{ name: "CVOptima Team" }],
  creator: "CVOptima",
  publisher: "CVOptima",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://cvoptima.com'), // Production URL'nizle değiştirin
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: 'https://cvoptima.com',
    title: "CVOptima - AI Destekli CV ve Ön Yazı Asistanı",
    description: "Yapay zeka destekli CV analizi, ön yazı oluşturma ve kariyer danışmanlığı.",
    siteName: 'CVOptima',
    images: [
      {
        url: '/og-image.jpg', // OG image path'inizi ekleyin
        width: 1200,
        height: 630,
        alt: 'CVOptima - AI Destekli CV Asistanı',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "CVOptima - AI Destekli CV ve Ön Yazı Asistanı",
    description: "Yapay zeka destekli CV analizi, ön yazı oluşturma ve kariyer danışmanlığı.",
    images: ['/og-image.jpg'], // Twitter image path'inizi ekleyin
    creator: '@cvoptima',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Google Search Console ve diğer doğrulama kodları için
    // google: 'your-google-verification-code',
  },
};

// Performance monitoring ve analytics için
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="tr" 
      suppressHydrationWarning
      className={fontSans.variable}
    >
      <head>
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        
        {/* Favicon ve icon çeşitleri */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased flex flex-col",
          // Font optimization
          "subpixel-antialiased", // Daha iyi font rendering
        )}
        suppressHydrationWarning // Tema değişikliği için önemli
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false} // Daha smooth geçişler için
          storageKey="cvoptima-theme" // Local storage key for persistence
        >
          {/* Header with proper stacking context */}
          <div className="relative z-50">
            <Header />
          </div>
          
          {/* Main content with proper flex grow */}
          <main className="flex-1 flex flex-col w-full">
            {children}
          </main>
          
          {/* Enhanced Footer */}
          <footer className="w-full py-8 border-t bg-background/80 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
            <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center space-y-4">
                
                {/* Copyright */}
                <div className="text-sm text-muted-foreground">
                  <p>© {new Date().getFullYear()} CVOptima. Tüm hakları saklıdır.</p>
                </div>
              </div>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}