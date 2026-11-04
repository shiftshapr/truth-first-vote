import type { MetadataRoute } from 'next';
import { publicBase } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/', '/unsubscribe', '/play'] }],
    sitemap: `${publicBase()}/sitemap.xml`,
  };
}
