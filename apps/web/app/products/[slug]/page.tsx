import type { Metadata } from 'next';
import ProductDetailClient from './ProductDetailClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api/v1';
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');

// Server-side fetch of a single product for SEO metadata + structured data.
async function getProduct(slug: string): Promise<any | null> {
  try {
    const res = await fetch(`${API_URL}/products/slug/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? null;
  } catch {
    return null;
  }
}

function primaryImage(product: any): string | undefined {
  const imgs = product?.images;
  if (!Array.isArray(imgs) || imgs.length === 0) return undefined;
  const primary = imgs.find((i: any) => i?.isPrimary) ?? imgs[0];
  return primary?.url;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await getProduct(params.slug);

  if (!product) {
    return {
      title: 'Product',
      description: 'Browse premium home appliances at PRIMO.',
    };
  }

  // Use admin metaTitle verbatim (absolute, no template) to avoid a doubled "| PRIMO" suffix;
  // fall back to the product title which the layout template decorates.
  const title = product.metaTitle
    ? { absolute: product.metaTitle }
    : product.title;
  const titleStr = product.metaTitle || `${product.title} | PRIMO`;
  const description =
    product.metaDescription ||
    product.shortDescription ||
    `Buy ${product.title} at PRIMO — authentic ${product.brand || ''} with official warranty and fast delivery.`.trim();
  const image = primaryImage(product);
  const url = `${APP_URL}/products/${product.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      title: titleStr,
      description,
      url,
      images: image ? [{ url: image, alt: product.title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: titleStr,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const product = await getProduct(params.slug);

  // Product structured data (Schema.org) for rich search results.
  const jsonLd = product
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.title,
        image: product.images?.map((i: any) => i.url).filter(Boolean) ?? [],
        description: product.shortDescription || product.metaDescription || product.title,
        sku: product.sku,
        brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
        aggregateRating:
          product.reviewCount > 0
            ? {
                '@type': 'AggregateRating',
                ratingValue: product.averageRating,
                reviewCount: product.reviewCount,
              }
            : undefined,
        offers: {
          '@type': 'Offer',
          url: `${APP_URL}/products/${product.slug}`,
          priceCurrency: 'EGP',
          price: product.price ?? 0,
          availability:
            (product.stockQuantity ?? 0) > 0
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
        },
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
      <ProductDetailClient />
    </>
  );
}
