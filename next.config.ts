import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'aeadljeuxqgdvcrohaff.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'aeadljeuxqgdvcrohaff.supabase.co',
        pathname: '/storage/v1/object/sign/**',
      },
    ],
  },
};

export default nextConfig;
