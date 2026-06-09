/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@primo/shared'],
  images: {
    remotePatterns: [
      // Allow ANY https host — admin can paste any image URL (product/category images)
      {
        protocol: 'https',
        hostname: '**',
      },
      // Allow local API server for uploaded files (localhost or LAN IP)
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '192.168.100.93',
        port: '',
        pathname: '/**',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
