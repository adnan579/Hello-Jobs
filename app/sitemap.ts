import type { MetadataRoute } from 'next';
import { publicJobIndex } from '../server/services/publicJobs';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.APP_URL?.replace(/\/$/, '');
  if (!baseUrl) return [];
  try {
    const ids = await publicJobIndex();
    return [
      { url: `${baseUrl}/` },
      { url: `${baseUrl}/about` },
      { url: `${baseUrl}/jobs` },
      { url: `${baseUrl}/employers` },
      ...ids.map((id) => ({ url: `${baseUrl}/jobs/${encodeURIComponent(id)}` })),
    ];
  } catch (error) {
    console.error('[sitemap]', error instanceof Error ? error.message : error);
    return [];
  }
}