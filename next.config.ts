import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  agentRules: false,
  outputFileTracingIncludes: {
    '/*': ['./server/migrations/*.sql'],
  },
  async redirects() {
    return [{ source: '/admin.html', destination: '/admin', permanent: false }];
  },
};

export default nextConfig;