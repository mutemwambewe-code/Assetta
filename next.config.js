
/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  experimental: {
    allowedDevOrigins: [
        "https://9000-firebase-studio-1759299167204.cluster-cbeiita7rbe7iuwhvjs5zww2i4.cloudworkstations.dev",
    ]
  },
  env: {
    NEXT_PUBLIC_AFRICASTALKING_USERNAME: process.env.AFRICASTALKING_USERNAME,
    NEXT_PUBLIC_AFRICASTALKING_SENDER_ID: process.env.AFRICASTALKING_SENDER_ID,
  }
};

module.exports = nextConfig;
