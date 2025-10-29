// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  devIndicators: false,

  // --- YENİ KURAL BURADA ---
  async rewrites() {
    return [
      {
        // Gelen kaynak path: /dl/ ile başlayan her şey (tek bir parametre alır)
        source: '/dl/:path*', 
        // Hedef: Backend API adresimiz
        destination: 'https://cvoptima-api.onrender.com/dl/:path*', 
      },
    ]
  },
  // --- KURAL BİTTİ ---
};

export default nextConfig;