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
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api/v1',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
  async rewrites() {
    // Where THIS server reaches the API. Must be absolute, and must not be the
    // public NEXT_PUBLIC_API_URL when that is relative ('/api/proxy') — the
    // rewrite would then point at itself and loop.
    const internalApi =
      process.env.API_INTERNAL_URL ||
      (/^https?:\/\//i.test(process.env.NEXT_PUBLIC_API_URL || '')
        ? process.env.NEXT_PUBLIC_API_URL
        : 'http://localhost:5005/api/v1');
    // Uploaded files are served from the API ROOT (/uploads), not under /api/v1.
    const apiRoot = internalApi.replace(/\/api\/v1\/?$/, '');

    return [
      {
        source: '/api/proxy/:path*',
        destination: `${internalApi}/:path*`,
      },
      {
        // Keeps admin-uploaded images working in a single-service deployment,
        // where the API has no public hostname of its own.
        source: '/uploads/:path*',
        destination: `${apiRoot}/uploads/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
