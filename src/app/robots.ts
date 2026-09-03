import type { MetadataRoute } from 'next';
import { getBaseUrl } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/checkout', '/voucher', '/admin', '/api'],
    },
    sitemap: `${getBaseUrl()}/sitemap.xml`,
  };
}
