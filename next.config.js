/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  experimental: {
    serverActions: true,
    serverComponentsExternalPackages: ['@supabase/supabase-js', '@supabase/auth-helpers-nextjs']
  }
};

module.exports = nextConfig;
