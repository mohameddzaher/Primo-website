import type { MetadataRoute } from 'next';

// Dynamic sitemap — automatically includes every active product, category and
// blog post by fetching the API at request time. Falls back to static routes
// if the API is unreachable so the sitemap never 500s.

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';

// Revalidate the sitemap hourly so new products/categories show up automatically.
export const revalidate = 3600;

async function safeFetch(path: string): Promise<any[]> {
  try {
    const res = await fetch(`${API_URL}${path}`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = await res.json();
    const data = json?.data ?? json;
    return Array.isArray(data) ? data : data?.items ?? data?.posts ?? [];
  } catch {
    return [];
  }
}

// Some list endpoints cap `limit` at 100, so walk pages until exhausted
// (bounded to avoid an unbounded loop). Used for products/blog which can grow large.
async function fetchAllPaginated(basePath: string, perPage = 100, maxPages = 50): Promise<any[]> {
  const all: any[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const sep = basePath.includes('?') ? '&' : '?';
    const batch = await safeFetch(`${basePath}${sep}limit=${perPage}&page=${page}`);
    if (!batch.length) break;
    all.push(...batch);
    if (batch.length < perPage) break;
  }
  return all;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Static, always-present routes.
  const staticRoutes: MetadataRoute.Sitemap = [
    '',
    '/products',
    '/categories',
    '/deals',
    '/blog',
    '/about',
    '/contact',
    '/faq',
    '/track-order',
    '/shipping',
    '/returns',
    '/warranty',
    '/privacy',
    '/terms',
    '/careers',
    '/press',
    '/help',
  ].map((route) => ({
    url: `${APP_URL}${route}`,
    lastModified: now,
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : 0.7,
  }));

  // Dynamic routes from the API.
  const [products, categories, blogPosts] = await Promise.all([
    fetchAllPaginated('/products'),
    safeFetch('/categories'),
    fetchAllPaginated('/blog/posts'),
  ]);

  const productRoutes: MetadataRoute.Sitemap = products
    .filter((p) => p?.slug)
    .map((p) => ({
      url: `${APP_URL}/products/${p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

  const categoryRoutes: MetadataRoute.Sitemap = categories
    .filter((c) => c?.slug)
    .map((c) => ({
      url: `${APP_URL}/categories/${c.slug}`,
      lastModified: c.updatedAt ? new Date(c.updatedAt) : now,
      changeFrequency: 'weekly',
      priority: 0.6,
    }));

  const blogRoutes: MetadataRoute.Sitemap = blogPosts
    .filter((b) => b?.slug)
    .map((b) => ({
      url: `${APP_URL}/blog/${b.slug}`,
      lastModified: b.updatedAt ? new Date(b.updatedAt) : now,
      changeFrequency: 'monthly',
      priority: 0.5,
    }));

  return [...staticRoutes, ...productRoutes, ...categoryRoutes, ...blogRoutes];
}
