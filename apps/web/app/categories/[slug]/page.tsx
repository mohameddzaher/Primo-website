import type { Metadata } from 'next';
import CategoryClient from './CategoryClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api/v1';
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');

async function getCategory(slug: string): Promise<any | null> {
  try {
    const res = await fetch(`${API_URL}/categories/slug/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const category = await getCategory(params.slug);

  if (!category) {
    return { title: 'Categories', description: 'Shop premium home appliances by category at PRIMO.' };
  }

  const title = category.metaTitle || category.name;
  const description =
    category.metaDescription ||
    category.description ||
    `Shop ${category.name} at PRIMO — authentic premium appliances with official warranty and fast delivery.`;
  const url = `${APP_URL}/categories/${category.slug}`;

  return {
    title: category.metaTitle ? { absolute: category.metaTitle } : title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      title: category.metaTitle || `${category.name} | PRIMO`,
      description,
      url,
      images: category.image ? [{ url: category.image, alt: category.name }] : undefined,
    },
  };
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const category = await getCategory(params.slug);

  const jsonLd = category
    ? {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: category.name,
        description: category.description || category.metaDescription || category.name,
        url: `${APP_URL}/categories/${category.slug}`,
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <CategoryClient />
    </>
  );
}
