
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    NEXT_PUBLIC_AFRICASTALKING_USERNAME: process.env.AFRICASTALKING_USERNAME,
    NEXT_PUBLIC_AFRICASTALKING_SENDER_ID: process.env.AFRICASTALKING_SENDER_ID,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Exclude jspdf from server-side bundle
    if (isServer) {
      config.externals.push('jspdf');
    }
    return config;
  },
};

export default nextConfig;
