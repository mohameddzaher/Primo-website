import type { Metadata } from 'next';
import { getDiscountedPrice } from '@/lib/utils';
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

/**
 * The price a shopper actually pays: the discount only applies while it is
 * live (no end date, or an end date still in the future). Publishing the
 * pre-discount price here causes Google Merchant Center price mismatches.
 */
function sellingPrice(product: any): { price: number; validUntil?: string } {
  const base = Number(product?.price) || 0;
  const discount = Number(product?.discount) || 0;
  if (discount <= 0) return { price: base };

  const endsAt = product?.discountEndsAt ? new Date(product.discountEndsAt) : null;
  const isLive = !endsAt || (!Number.isNaN(endsAt.getTime()) && endsAt.getTime() > Date.now());
  if (!isLive) return { price: base };

  return {
    price: getDiscountedPrice(base, discount),
    validUntil: endsAt ? endsAt.toISOString().split('T')[0] : undefined,
  };
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
  const offer = product ? sellingPrice(product) : null;
  const inStock = (product?.stockQuantity ?? product?.stock ?? 0) > 0;
  const reviewCount = Number(product?.reviewCount) || 0;
  const averageRating = Number(product?.averageRating) || 0;

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
          reviewCount > 0 && averageRating > 0
            ? {
                '@type': 'AggregateRating',
                ratingValue: averageRating,
                reviewCount,
              }
            : undefined,
        offers: {
          '@type': 'Offer',
          url: `${APP_URL}/products/${product.slug}`,
          priceCurrency: 'SAR',
          // Actual selling price (post-discount while the discount is live)
          price: offer!.price,
          priceValidUntil: offer!.validUntil,
          itemCondition: 'https://schema.org/NewCondition',
          availability: inStock
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
