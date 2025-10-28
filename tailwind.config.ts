// tailwind.config.ts
import type { Config } from "tailwindcss"

const config = {
  darkMode: "class", // shadcn/ui genellikle class tabanlı dark mode kullanır
  content: [
    // Tailwind'in hangi dosyalardaki sınıfları tarayacağını belirtir
    './pages/**/*.{ts,tsx}', // Geleneksel pages dizini (varsa)
    './components/**/*.{ts,tsx}', // Genel bileşenler
    './app/**/*.{ts,tsx}',    // App Router sayfaları ve bileşenleri
    './src/**/*.{ts,tsx}',    // src/ altındaki her şey
  ],
  prefix: "", // shadcn/ui için prefix genellikle boş bırakılır
  theme: {
    container: { // Container ayarları
      center: true, // İçeriği ortalar
      padding: {    // Duyarlı padding ayarları
        DEFAULT: "1rem",
        sm: "2rem",
        lg: "4rem",
        xl: "5rem",
        "2xl": "6rem",
      },
      screens: {    // Container'ın maksimum genişliği
        "2xl": "1400px",
      },
    },
    extend: { // shadcn/ui tarafından eklenen veya özelleştirilen tema değerleri
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))", // Temel arka plan (Slate için kırık beyaz/koyu gri)
        foreground: "hsl(var(--foreground))", // Temel metin rengi
        primary: { // Ana renk (Slate için mavi tonları)
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))", // Ana renk üzerindeki metin
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: { // Soluk arka planlar
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))", // Soluk metin
        },
        accent: { // Vurgu rengi (hover vb.)
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: { // Kart arka planı
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: { // Köşe yuvarlaklığı değerleri
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: { // Animasyonlar için
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: { // Keyframe animasyonlarının isimleri
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      fontFamily: { // Font ayarı (layout.tsx'teki değişkenle eşleşmeli)
        sans: ["var(--font-sans)", "sans-serif"], // 'sans-serif' fallback olarak eklendi
      },
    },
  },
  plugins: [require("tailwindcss-animate")], // shadcn/ui animasyonları için
} satisfies Config

export default config