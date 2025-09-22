/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  {
        protocol: 'https',
        hostname: 'jaylcuvsaucgnmhmwynr.supabase.co', // Your Supabase project hostname
        port: '',
        pathname: '/**', // Allow all images from public storage buckets
      },
};

module.exports = nextConfig;
