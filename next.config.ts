import type { NextConfig } from 'next';

// Public contact details are read in the browser, so Next.js must inline them at build time. NEXT_PUBLIC_* is the
// name to use; the old VITE_* names from the Vite build are still accepted so an existing deployment keeps working.
const publicContact = (name: string) => process.env[`NEXT_PUBLIC_${name}`] ?? process.env[`VITE_${name}`] ?? '';

const nextConfig: NextConfig = {
  agentRules: false,
  env: {
    NEXT_PUBLIC_GRIEVANCE_OFFICER_NAME: publicContact('GRIEVANCE_OFFICER_NAME'),
    NEXT_PUBLIC_GRIEVANCE_EMAIL: publicContact('GRIEVANCE_EMAIL'),
    NEXT_PUBLIC_HELPLINE: publicContact('HELPLINE'),
    NEXT_PUBLIC_COMPANY_ADDRESS: publicContact('COMPANY_ADDRESS'),
  },
  outputFileTracingIncludes: {
    '/*': ['./server/migrations/*.sql'],
  },
  async redirects() {
    return [{ source: '/admin.html', destination: '/admin', permanent: false }];
  },
  async headers() {
    return [
      // Same list as API_SECURITY_HEADERS in server/lib/security-headers.ts (tests/security-headers.test.ts keeps them in step).
      {
        source: '/api/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: "default-src 'none'; frame-ancestors 'none'" },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(self)' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
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