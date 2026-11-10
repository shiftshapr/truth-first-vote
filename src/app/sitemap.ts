import type { MetadataRoute } from 'next';
import { publicBase } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = publicBase();
  return ['', '/countries', '/updates', '/support', '/privacy'].map((p) => ({ url: `${base}${p}`, changeFrequency: 'weekly' as const }));
}
