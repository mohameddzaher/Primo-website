'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  HiOutlineCalendar,
  HiOutlineUser,
  HiOutlineClock,
  HiOutlineChevronRight,
  HiOutlineShare,
} from 'react-icons/hi';
import { FaFacebook, FaTwitter, FaLinkedin } from 'react-icons/fa';
import { Button, Card } from '@/components/ui';
import { blogApi } from '@/lib/api';

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { data: post, isLoading } = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: () => blogApi.getPost(slug),
    enabled: !!slug,
  });

  const { data: relatedPosts } = useQuery({
    queryKey: ['blog-posts', 'related', post?.categoryId?._id],
    queryFn: () =>
      blogApi.getPosts({ category: post?.categoryId?.slug, limit: 3 }),
    enabled: !!post?.categoryId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-beige-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="animate-pulse">
            <div className="h-8 bg-beige-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-beige-200 rounded w-1/4 mb-8"></div>
            <div className="aspect-video bg-beige-200 rounded-xl mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-beige-200 rounded w-full"></div>
              <div className="h-4 bg-beige-200 rounded w-full"></div>
              <div className="h-4 bg-beige-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-beige-50 py-8">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl font-semibold text-dark-900 mb-4">
            Post Not Found
          </h1>
          <Link href="/blog">
            <Button>Back to Blog</Button>
          </Link>
        </div>
      </div>
    );
  }

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <div className="min-h-screen bg-beige-50 py-8">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-dark-500 mb-6 max-w-4xl mx-auto">
          <Link href="/" className="hover:text-primary-600">
            Home
          </Link>
          <HiOutlineChevronRight size={16} />
          <Link href="/blog" className="hover:text-primary-600">
            Blog
          </Link>
          <HiOutlineChevronRight size={16} />
          <span className="text-dark-900 line-clamp-1">{post.title}</span>
        </nav>

        <article className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Category */}
            {post.categoryId && (
              <Link
                href={`/blog?category=${post.categoryId.slug}`}
                className="inline-block px-3 py-1 bg-primary-100 text-primary-700 text-sm font-medium rounded-full mb-4 hover:bg-primary-200 transition-colors"
              >
                {post.categoryId.name}
              </Link>
            )}

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-display font-semibold text-dark-900 mb-4">
              {post.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-dark-500 mb-6">
              {post.authorId && (
                <span className="flex items-center gap-1">
                  <HiOutlineUser size={16} />
                  {post.authorId.firstName} {post.authorId.lastName}
                </span>
              )}
              <span className="flex items-center gap-1">
                <HiOutlineCalendar size={16} />
                {new Date(post.publishedAt || post.createdAt).toLocaleDateString(
                  'en-US',
                  { year: 'numeric', month: 'long', day: 'numeric' }
                )}
              </span>
              {post.readingTime && (
                <span className="flex items-center gap-1">
                  <HiOutlineClock size={16} />
                  {post.readingTime} min read
                </span>
              )}
            </div>

            {/* Featured Image */}
            {post.featuredImage && (
              <div className="aspect-video rounded-xl overflow-hidden mb-8">
                <img
                  src={post.featuredImage}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Content */}
            <div
              className="prose prose-lg max-w-none mb-8
                prose-headings:text-dark-900 prose-headings:font-semibold
                prose-p:text-dark-700 prose-p:leading-relaxed
                prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline
                prose-strong:text-dark-900
                prose-ul:text-dark-700 prose-ol:text-dark-700
                prose-img:rounded-xl"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {post.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-beige-100 text-dark-600 text-sm rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Share */}
            <div className="flex items-center gap-4 py-6 border-t border-b border-beige-200 mb-8">
              <span className="text-dark-700 font-medium flex items-center gap-2">
                <HiOutlineShare size={18} />
                Share:
              </span>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-dark-400 hover:text-blue-600 transition-colors"
              >
                <FaFacebook size={20} />
              </a>
              <a
                href={`https://twitter.com/intent/tweet?url=${shareUrl}&text=${post.title}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-dark-400 hover:text-sky-500 transition-colors"
              >
                <FaTwitter size={20} />
              </a>
              <a
                href={`https://www.linkedin.com/shareArticle?mini=true&url=${shareUrl}&title=${post.title}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-dark-400 hover:text-blue-700 transition-colors"
              >
                <FaLinkedin size={20} />
              </a>
            </div>
          </motion.div>
        </article>

        {/* Related Posts */}
        {relatedPosts?.posts && relatedPosts.posts.length > 0 && (
          <div className="max-w-6xl mx-auto mt-12">
            <h2 className="text-2xl font-semibold text-dark-900 mb-6">
              Related Posts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.posts
                .filter((p: any) => p._id !== post._id)
                .slice(0, 3)
                .map((relatedPost: any) => (
                  <Link key={relatedPost._id} href={`/blog/${relatedPost.slug}`}>
                    <Card padding="none" className="overflow-hidden group h-full">
                      <div className="aspect-video bg-beige-100 overflow-hidden">
                        {relatedPost.featuredImage ? (
                          <img
                            src={relatedPost.featuredImage}
                            alt={relatedPost.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-beige-400">
                            No Image
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium text-dark-900 group-hover:text-primary-600 transition-colors line-clamp-2">
                          {relatedPost.title}
                        </h3>
                        <p className="text-sm text-dark-500 mt-2">
                          {new Date(relatedPost.publishedAt || relatedPost.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </Card>
                  </Link>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
