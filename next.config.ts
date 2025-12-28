import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Izinkan semua domain (untuk development)
      },
    ],
  },
};

export default nextConfig;
