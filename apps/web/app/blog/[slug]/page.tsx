import type { Metadata } from 'next';
import BlogPostClient from './BlogPostClient';
import { SERVER_API_URL } from '@/lib/api-base';

const API_URL = SERVER_API_URL;
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');

async function getPost(slug: string): Promise<any | null> {
  try {
    const res = await fetch(`${API_URL}/blog/posts/slug/${encodeURIComponent(slug)}`, {
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
  const post = await getPost(params.slug);

  if (!post) {
    return { title: 'Blog', description: 'Tips and guides on premium home appliances from PRIMO.' };
  }

  const title = post.metaTitle || post.title;
  const description = post.metaDescription || post.excerpt || post.title;
  const image = post.featuredImage || post.image;
  const url = `${APP_URL}/blog/${post.slug}`;

  return {
    title: post.metaTitle ? { absolute: post.metaTitle } : title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title: post.metaTitle || `${post.title} | PRIMO`,
      description,
      url,
      publishedTime: post.publishedAt,
      authors: post.author ? [post.author] : undefined,
      images: image ? [{ url: image, alt: post.title }] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);

  const jsonLd = post
    ? {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.title,
        description: post.excerpt || post.metaDescription || post.title,
        image: post.featuredImage || post.image,
        datePublished: post.publishedAt,
        dateModified: post.updatedAt || post.publishedAt,
        author: { '@type': 'Organization', name: post.author || 'PRIMO Team' },
        publisher: { '@type': 'Organization', name: 'PRIMO' },
        mainEntityOfPage: `${APP_URL}/blog/${post.slug}`,
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
      <BlogPostClient />
    </>
  );
}
