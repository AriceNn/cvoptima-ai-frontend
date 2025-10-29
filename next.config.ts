// next.config.ts

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  devIndicators: false,

  async rewrites() {
    return [
      {
        source: "/dl/:path*",
        destination: "https://api.cvoptima.com/dl/:path*",  // <-- BURASI DÜZELDİ
      },
    ];
  },
};

export default nextConfig;