import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['rjqjjudatklqdrynuati.supabase.co'], // ✅ Add your Supabase storage domain here
  },
};

export default nextConfig;
