import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  agentRules: false,
  outputFileTracingIncludes: {
    '/*': ['./server/migrations/*.sql'],
  },
  async redirects() {
    return [{ source: '/admin.html', destination: '/admin', permanent: false }];
  },
  async headers() {
    return [
      {
        source: '/admin',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
      {
        source: '/admin/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
    ];
  },
};

export default nextConfig;