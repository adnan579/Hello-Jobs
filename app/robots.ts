import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.APP_URL?.replace(/\/$/, '');
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/me', '/employers/talent', '/employers/dashboard', '/admin'] },
    ...(baseUrl ? { sitemap: `${baseUrl}/sitemap.xml` } : {}),
  };
}