// ============================================
// PRIMO API - SEO Routes
// ============================================

import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { authenticate, requireAdminOnly, AuthRequest } from '../middleware/auth';
import { asyncHandler, NotFoundError, BadRequestError } from '../middleware/errorHandler';
import { escapeRegex } from '../utils/regex';
import { SEOPage } from '../models/SEOPage';
import { SEORedirect } from '../models/SEORedirect';
import { SEOKeyword } from '../models/SEOKeyword';
import { Product } from '../models/Product';
import { Category } from '../models/Category';

const router = Router();

// ============================================
// Dashboard
// ============================================

// GET /dashboard - SEO health overview
router.get(
  '/dashboard',
  authenticate,
  requireAdminOnly,
  asyncHandler(async (_req: AuthRequest, res: Response) => {
    const [
      totalPages,
      totalProducts,
      productsWithMeta,
      activeRedirects,
      trackedKeywords,
      productsWithCompleteSEO,
    ] = await Promise.all([
      SEOPage.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({
        metaTitle: { $exists: true, $ne: '' },
      }),
      SEORedirect.countDocuments({ isActive: true }),
      SEOKeyword.countDocuments(),
      Product.countDocuments({
        metaTitle: { $exists: true, $ne: '' },
        metaDescription: { $exists: true, $ne: '' },
      }),
    ]);

    const productsMissingMeta = totalProducts - productsWithMeta;
    const seoScore = totalProducts > 0
      ? Math.round((productsWithCompleteSEO / totalProducts) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        totalPages,
        totalProducts,
        productsWithMeta,
        productsMissingMeta,
        activeRedirects,
        trackedKeywords,
        seoScore,
      },
    });
  })
);

// ============================================
// SEO Pages
// ============================================

// GET /pages - List SEO page configs (paginated)
router.get(
  '/pages',
  authenticate,
  requireAdminOnly,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const search = (req.query.search as string) || '';

    const query: any = {};

    if (search) {
      query.$or = [
        { path: { $regex: escapeRegex(search), $options: 'i' } },
        { metaTitle: { $regex: escapeRegex(search), $options: 'i' } },
      ];
    }

    const [pages, total] = await Promise.all([
      SEOPage.find(query)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      SEOPage.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: pages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  })
);

// POST /pages - Create page SEO config
router.post(
  '/pages',
  authenticate,
  requireAdminOnly,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
      path,
      metaTitle,
      metaDescription,
      ogTitle,
      ogDescription,
      ogImage,
      canonicalUrl,
      keywords,
      noIndex,
      noFollow,
      structuredData,
    } = req.body;

    if (!path) {
      throw new BadRequestError('Path is required');
    }

    // Check for duplicate path
    const existing = await SEOPage.findOne({ path });
    if (existing) {
      throw new BadRequestError('A page config with this path already exists');
    }

    const seoPage = await SEOPage.create({
      path,
      metaTitle,
      metaDescription,
      ogTitle,
      ogDescription,
      ogImage,
      canonicalUrl,
      keywords,
      noIndex,
      noFollow,
      structuredData,
    });

    res.json({
      success: true,
      data: seoPage,
    });
  })
);

// GET /pages/:id - Get single page config
router.get(
  '/pages/:id',
  authenticate,
  requireAdminOnly,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid page ID');
    }

    const seoPage = await SEOPage.findById(id).lean();
    if (!seoPage) {
      throw new NotFoundError('SEO page config not found');
    }

    res.json({
      success: true,
      data: seoPage,
    });
  })
);

// PATCH /pages/:id - Update page config
router.patch(
  '/pages/:id',
  authenticate,
  requireAdminOnly,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid page ID');
    }

    const seoPage = await SEOPage.findById(id);
    if (!seoPage) {
      throw new NotFoundError('SEO page config not found');
    }

    const allowedFields = [
      'path',
      'metaTitle',
      'metaDescription',
      'ogTitle',
      'ogDescription',
      'ogImage',
      'canonicalUrl',
      'keywords',
      'noIndex',
      'noFollow',
      'structuredData',
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        (seoPage as any)[field] = req.body[field];
      }
    }

    await seoPage.save();

    res.json({
      success: true,
      data: seoPage,
    });
  })
);

// DELETE /pages/:id - Delete page config
router.delete(
  '/pages/:id',
  authenticate,
  requireAdminOnly,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid page ID');
    }

    const seoPage = await SEOPage.findByIdAndDelete(id);
    if (!seoPage) {
      throw new NotFoundError('SEO page config not found');
    }

    res.json({
      success: true,
      data: { message: 'SEO page config deleted successfully' },
    });
  })
);

// ============================================
// Product SEO
// ============================================

// GET /products - Products with SEO status (paginated)
router.get(
  '/products',
  authenticate,
  requireAdminOnly,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const status = (req.query.status as string) || 'all';

    const query: any = { isActive: true };

    if (status === 'complete') {
      query.metaTitle = { $exists: true, $ne: '' };
      query.metaDescription = { $exists: true, $ne: '' };
    } else if (status === 'incomplete') {
      query.$or = [
        { metaTitle: { $exists: false } },
        { metaTitle: '' },
        { metaDescription: { $exists: false } },
        { metaDescription: '' },
      ];
    }

    const [products, total] = await Promise.all([
      Product.find(query)
        .select('title slug metaTitle metaDescription images updatedAt')
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
    ]);

    // Map products to include only the first image and SEO completion status
    const mapped = products.map((product: any) => ({
      _id: product._id,
      title: product.title,
      slug: product.slug,
      metaTitle: product.metaTitle || '',
      metaDescription: product.metaDescription || '',
      image: product.images?.[0] || null,
      updatedAt: product.updatedAt,
      seoComplete: !!(product.metaTitle && product.metaDescription),
    }));

    res.json({
      success: true,
      data: mapped,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  })
);

// PATCH /products/:id - Update product SEO
router.patch(
  '/products/:id',
  authenticate,
  requireAdminOnly,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid product ID');
    }

    const { metaTitle, metaDescription } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    if (metaTitle !== undefined) product.metaTitle = metaTitle;
    if (metaDescription !== undefined) product.metaDescription = metaDescription;

    await product.save();

    res.json({
      success: true,
      data: {
        _id: product._id,
        title: product.title,
        slug: product.slug,
        metaTitle: product.metaTitle,
        metaDescription: product.metaDescription,
      },
    });
  })
);

// POST /products/bulk - Bulk update product SEO
router.post(
  '/products/bulk',
  authenticate,
  requireAdminOnly,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      throw new BadRequestError('Updates array is required and must not be empty');
    }

    const results: { productId: string; success: boolean; error?: string }[] = [];

    for (const update of updates) {
      const { productId, metaTitle, metaDescription } = update;

      if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
        results.push({ productId, success: false, error: 'Invalid product ID' });
        continue;
      }

      try {
        const product = await Product.findById(productId);
        if (!product) {
          results.push({ productId, success: false, error: 'Product not found' });
          continue;
        }

        if (metaTitle !== undefined) product.metaTitle = metaTitle;
        if (metaDescription !== undefined) product.metaDescription = metaDescription;

        await product.save();
        results.push({ productId, success: true });
      } catch (err: any) {
        results.push({ productId, success: false, error: err.message });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    res.json({
      success: true,
      data: {
        results,
        summary: {
          total: results.length,
          successful: successCount,
          failed: failureCount,
        },
      },
    });
  })
);

// ============================================
// Redirects
// ============================================

// GET /redirects - List redirects (paginated)
router.get(
  '/redirects',
  authenticate,
  requireAdminOnly,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const search = (req.query.search as string) || '';

    const query: any = {};

    if (search) {
      query.$or = [
        { fromPath: { $regex: escapeRegex(search), $options: 'i' } },
        { toPath: { $regex: escapeRegex(search), $options: 'i' } },
      ];
    }

    const [redirects, total] = await Promise.all([
      SEORedirect.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      SEORedirect.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: redirects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  })
);

// POST /redirects - Create redirect
router.post(
  '/redirects',
  authenticate,
  requireAdminOnly,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { fromPath, toPath, type, isActive } = req.body;

    if (!fromPath || !toPath) {
      throw new BadRequestError('fromPath and toPath are required');
    }

    // Check for duplicate fromPath
    const existing = await SEORedirect.findOne({ fromPath });
    if (existing) {
      throw new BadRequestError('A redirect with this fromPath already exists');
    }

    const redirect = await SEORedirect.create({
      fromPath,
      toPath,
      type: type || '301',
      isActive: isActive !== undefined ? isActive : true,
    });

    res.json({
      success: true,
      data: redirect,
    });
  })
);

// PATCH /redirects/:id - Update redirect
router.patch(
  '/redirects/:id',
  authenticate,
  requireAdminOnly,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid redirect ID');
    }

    const redirect = await SEORedirect.findById(id);
    if (!redirect) {
      throw new NotFoundError('Redirect not found');
    }

    const allowedFields = ['fromPath', 'toPath', 'type', 'isActive'];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        (redirect as any)[field] = req.body[field];
      }
    }

    await redirect.save();

    res.json({
      success: true,
      data: redirect,
    });
  })
);

// DELETE /redirects/:id - Delete redirect
router.delete(
  '/redirects/:id',
  authenticate,
  requireAdminOnly,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid redirect ID');
    }

    const redirect = await SEORedirect.findByIdAndDelete(id);
    if (!redirect) {
      throw new NotFoundError('Redirect not found');
    }

    res.json({
      success: true,
      data: { message: 'Redirect deleted successfully' },
    });
  })
);

// ============================================
// Keywords
// ============================================

// GET /keywords - List keywords (paginated)
router.get(
  '/keywords',
  authenticate,
  requireAdminOnly,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const search = (req.query.search as string) || '';
    const difficulty = req.query.difficulty as string;

    const query: any = {};

    if (search) {
      query.keyword = { $regex: escapeRegex(search), $options: 'i' };
    }

    if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty)) {
      query.difficulty = difficulty;
    }

    const [keywords, total] = await Promise.all([
      SEOKeyword.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      SEOKeyword.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: keywords,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  })
);

// POST /keywords - Create keyword tracking entry
router.post(
  '/keywords',
  authenticate,
  requireAdminOnly,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { keyword, targetPage, currentRank, searchVolume, difficulty, notes } = req.body;

    if (!keyword) {
      throw new BadRequestError('Keyword is required');
    }

    const entry = await SEOKeyword.create({
      keyword,
      targetPage,
      currentRank,
      searchVolume,
      difficulty,
      notes,
    });

    res.json({
      success: true,
      data: entry,
    });
  })
);

// PATCH /keywords/:id - Update keyword
router.patch(
  '/keywords/:id',
  authenticate,
  requireAdminOnly,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid keyword ID');
    }

    const entry = await SEOKeyword.findById(id);
    if (!entry) {
      throw new NotFoundError('Keyword not found');
    }

    const allowedFields = ['keyword', 'targetPage', 'currentRank', 'searchVolume', 'difficulty', 'notes'];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        (entry as any)[field] = req.body[field];
      }
    }

    await entry.save();

    res.json({
      success: true,
      data: entry,
    });
  })
);

// DELETE /keywords/:id - Delete keyword
router.delete(
  '/keywords/:id',
  authenticate,
  requireAdminOnly,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid keyword ID');
    }

    const entry = await SEOKeyword.findByIdAndDelete(id);
    if (!entry) {
      throw new NotFoundError('Keyword not found');
    }

    res.json({
      success: true,
      data: { message: 'Keyword deleted successfully' },
    });
  })
);

// ============================================
// Audit
// ============================================

// GET /audit - SEO audit scan
router.get(
  '/audit',
  authenticate,
  requireAdminOnly,
  asyncHandler(async (_req: AuthRequest, res: Response) => {
    const products = await Product.find({ isActive: true })
      .select('title slug metaTitle metaDescription images')
      .lean();

    const issues: {
      type: string;
      description: string;
      count: number;
      products: { _id: string; title: string; slug: string }[];
    }[] = [];

    const missingTitle: { _id: string; title: string; slug: string }[] = [];
    const missingDescription: { _id: string; title: string; slug: string }[] = [];
    const missingImageAlt: { _id: string; title: string; slug: string }[] = [];
    const titleTooLong: { _id: string; title: string; slug: string }[] = [];
    const descriptionTooLong: { _id: string; title: string; slug: string }[] = [];

    for (const product of products) {
      const p = product as any;
      const info = { _id: p._id.toString(), title: p.title, slug: p.slug };

      // Check missing metaTitle
      if (!p.metaTitle || p.metaTitle.trim() === '') {
        missingTitle.push(info);
      }

      // Check missing metaDescription
      if (!p.metaDescription || p.metaDescription.trim() === '') {
        missingDescription.push(info);
      }

      // Check images without alt text
      if (p.images && p.images.length > 0) {
        const hasEmptyAlt = p.images.some((img: any) => !img.alt || img.alt.trim() === '');
        if (hasEmptyAlt) {
          missingImageAlt.push(info);
        }
      }

      // Check title too long (> 60 characters)
      if (p.metaTitle && p.metaTitle.length > 60) {
        titleTooLong.push(info);
      }

      // Check description too long (> 160 characters)
      if (p.metaDescription && p.metaDescription.length > 160) {
        descriptionTooLong.push(info);
      }
    }

    if (missingTitle.length > 0) {
      issues.push({
        type: 'missing_meta_title',
        description: 'Products missing meta title',
        count: missingTitle.length,
        products: missingTitle,
      });
    }

    if (missingDescription.length > 0) {
      issues.push({
        type: 'missing_meta_description',
        description: 'Products missing meta description',
        count: missingDescription.length,
        products: missingDescription,
      });
    }

    if (missingImageAlt.length > 0) {
      issues.push({
        type: 'missing_image_alt',
        description: 'Products with images missing alt text',
        count: missingImageAlt.length,
        products: missingImageAlt,
      });
    }

    if (titleTooLong.length > 0) {
      issues.push({
        type: 'title_too_long',
        description: 'Products with meta title longer than 60 characters',
        count: titleTooLong.length,
        products: titleTooLong,
      });
    }

    if (descriptionTooLong.length > 0) {
      issues.push({
        type: 'description_too_long',
        description: 'Products with meta description longer than 160 characters',
        count: descriptionTooLong.length,
        products: descriptionTooLong,
      });
    }

    const totalIssues = issues.reduce((sum, issue) => sum + issue.count, 0);

    res.json({
      success: true,
      data: {
        totalProducts: products.length,
        totalIssues,
        issueTypes: issues.length,
        issues,
      },
    });
  })
);

// ============================================
// Seed / Auto-populate SEO Data
// ============================================

// POST /seed - Auto-populate all SEO data from existing products, categories, and pages
router.post(
  '/seed',
  authenticate,
  requireAdminOnly,
  asyncHandler(async (_req: AuthRequest, res: Response) => {
    const results = {
      pagesCreated: 0,
      productsUpdated: 0,
      keywordsCreated: 0,
      redirectsCreated: 0,
      skipped: 0,
    };

    // ---- 1. Create SEO page configs for all major site pages ----
    const sitePages = [
      {
        path: '/',
        metaTitle: 'PRIMO - Premium Fashion & Lifestyle Store',
        metaDescription: 'Discover the finest selection of premium fashion, accessories, and lifestyle products at PRIMO. Free shipping on orders over SAR 500.',
        ogTitle: 'PRIMO - Premium Fashion & Lifestyle Store',
        ogDescription: 'Shop premium fashion, accessories, and lifestyle products. Exclusive collections with fast delivery.',
        keywords: ['primo', 'fashion', 'premium', 'online shopping', 'saudi arabia', 'lifestyle'],
      },
      {
        path: '/products',
        metaTitle: 'Shop All Products - PRIMO',
        metaDescription: 'Browse our complete collection of premium products. Find the latest trends in fashion, accessories, and more at PRIMO.',
        ogTitle: 'Shop All Products - PRIMO',
        ogDescription: 'Browse the complete PRIMO collection. Latest trends in fashion and lifestyle.',
        keywords: ['shop', 'products', 'fashion', 'accessories', 'primo collection'],
      },
      {
        path: '/categories',
        metaTitle: 'Shop by Category - PRIMO',
        metaDescription: 'Explore our product categories and find exactly what you are looking for. From clothing to accessories, PRIMO has it all.',
        ogTitle: 'Shop by Category - PRIMO',
        ogDescription: 'Explore product categories at PRIMO. Clothing, accessories, and more.',
        keywords: ['categories', 'shop by category', 'clothing', 'accessories'],
      },
      {
        path: '/offers',
        metaTitle: 'Special Offers & Deals - PRIMO',
        metaDescription: 'Don\'t miss our exclusive offers and deals. Save big on premium fashion and lifestyle products at PRIMO.',
        ogTitle: 'Special Offers & Deals - PRIMO',
        ogDescription: 'Exclusive deals and discounts on premium products at PRIMO.',
        keywords: ['offers', 'deals', 'discounts', 'sale', 'promotions'],
      },
      {
        path: '/new-arrivals',
        metaTitle: 'New Arrivals - Latest Products at PRIMO',
        metaDescription: 'Check out the latest additions to our collection. New arrivals in fashion, accessories, and lifestyle products.',
        ogTitle: 'New Arrivals - PRIMO',
        ogDescription: 'Discover the latest products added to PRIMO. Fresh styles and trends.',
        keywords: ['new arrivals', 'latest', 'new products', 'fresh collection'],
      },
      {
        path: '/best-sellers',
        metaTitle: 'Best Sellers - Most Popular at PRIMO',
        metaDescription: 'Shop our best-selling products loved by thousands of customers. Top-rated fashion and lifestyle items at PRIMO.',
        ogTitle: 'Best Sellers - PRIMO',
        ogDescription: 'Our most popular products. Shop best sellers at PRIMO.',
        keywords: ['best sellers', 'popular', 'top rated', 'most loved'],
      },
      {
        path: '/about',
        metaTitle: 'About PRIMO - Our Story',
        metaDescription: 'Learn about PRIMO\'s mission to deliver premium fashion and lifestyle products. Quality, style, and exceptional service.',
        ogTitle: 'About PRIMO',
        ogDescription: 'Our mission: delivering premium quality fashion and lifestyle products.',
        keywords: ['about primo', 'our story', 'premium fashion brand'],
      },
      {
        path: '/contact',
        metaTitle: 'Contact Us - PRIMO Customer Support',
        metaDescription: 'Get in touch with PRIMO customer support. We\'re here to help with orders, returns, and any questions you may have.',
        ogTitle: 'Contact PRIMO',
        ogDescription: 'Reach out to PRIMO support. We\'re here to help.',
        keywords: ['contact', 'customer support', 'help', 'primo support'],
      },
      {
        path: '/auth/login',
        metaTitle: 'Sign In to Your Account - PRIMO',
        metaDescription: 'Sign in to your PRIMO account to track orders, manage your wishlist, and enjoy personalized shopping.',
        ogTitle: 'Sign In - PRIMO',
        ogDescription: 'Access your PRIMO account.',
        keywords: ['login', 'sign in', 'account'],
        noIndex: true,
      },
      {
        path: '/auth/register',
        metaTitle: 'Create an Account - PRIMO',
        metaDescription: 'Join PRIMO today and enjoy exclusive offers, faster checkout, and order tracking. Create your free account now.',
        ogTitle: 'Join PRIMO',
        ogDescription: 'Create your free PRIMO account for exclusive benefits.',
        keywords: ['register', 'sign up', 'create account'],
        noIndex: true,
      },
      {
        path: '/cart',
        metaTitle: 'Your Shopping Cart - PRIMO',
        metaDescription: 'Review items in your shopping cart before checkout. Enjoy secure payment and fast delivery with PRIMO.',
        ogTitle: 'Shopping Cart - PRIMO',
        ogDescription: 'Review your cart and proceed to checkout.',
        keywords: ['cart', 'shopping cart', 'checkout'],
        noIndex: true,
      },
      {
        path: '/wishlist',
        metaTitle: 'Your Wishlist - PRIMO',
        metaDescription: 'Your saved favorites are waiting for you. View your PRIMO wishlist and never miss out on products you love.',
        ogTitle: 'My Wishlist - PRIMO',
        ogDescription: 'Your saved favorite products at PRIMO.',
        keywords: ['wishlist', 'favorites', 'saved items'],
        noIndex: true,
      },
      {
        path: '/blog',
        metaTitle: 'PRIMO Blog - Fashion Tips & Lifestyle',
        metaDescription: 'Read the latest fashion tips, style guides, and lifestyle articles from PRIMO. Stay trendy and inspired.',
        ogTitle: 'PRIMO Blog',
        ogDescription: 'Fashion tips, style guides, and lifestyle inspiration from PRIMO.',
        keywords: ['blog', 'fashion tips', 'style guide', 'lifestyle'],
      },
      {
        path: '/privacy-policy',
        metaTitle: 'Privacy Policy - PRIMO',
        metaDescription: 'Read PRIMO\'s privacy policy. Learn how we collect, use, and protect your personal information.',
        ogTitle: 'Privacy Policy - PRIMO',
        ogDescription: 'How PRIMO protects your personal information.',
        keywords: ['privacy policy', 'data protection'],
        noIndex: true,
      },
      {
        path: '/terms',
        metaTitle: 'Terms & Conditions - PRIMO',
        metaDescription: 'Read PRIMO\'s terms and conditions for using our website and services.',
        ogTitle: 'Terms & Conditions - PRIMO',
        ogDescription: 'PRIMO terms and conditions of use.',
        keywords: ['terms', 'conditions', 'terms of use'],
        noIndex: true,
      },
    ];

    for (const page of sitePages) {
      const existing = await SEOPage.findOne({ path: page.path });
      if (!existing) {
        await SEOPage.create({
          ...page,
          noIndex: page.noIndex || false,
          noFollow: false,
        });
        results.pagesCreated++;
      } else {
        results.skipped++;
      }
    }

    // ---- 2. Create SEO page configs for each category ----
    const categories = await Category.find({ isActive: true }).lean();
    for (const cat of categories) {
      const catSlug = (cat as any).slug || (cat as any).name.toLowerCase().replace(/\s+/g, '-');
      const path = `/categories/${catSlug}`;
      const existing = await SEOPage.findOne({ path });
      if (!existing) {
        await SEOPage.create({
          path,
          metaTitle: `${(cat as any).name} - Shop at PRIMO`,
          metaDescription: `Browse our ${(cat as any).name} collection. Premium quality ${(cat as any).name.toLowerCase()} products with fast delivery at PRIMO.`.slice(0, 160),
          ogTitle: `${(cat as any).name} Collection - PRIMO`,
          ogDescription: `Shop premium ${(cat as any).name.toLowerCase()} at PRIMO.`,
          keywords: [(cat as any).name.toLowerCase(), 'primo', 'shop', 'buy online'],
          noIndex: false,
          noFollow: false,
        });
        results.pagesCreated++;
      } else {
        results.skipped++;
      }
    }

    // ---- 3. Auto-fill product metaTitle and metaDescription for products missing them ----
    const productsToUpdate = await Product.find({
      isActive: true,
      $or: [
        { metaTitle: { $exists: false } },
        { metaTitle: '' },
        { metaTitle: null },
        { metaDescription: { $exists: false } },
        { metaDescription: '' },
        { metaDescription: null },
      ],
    }).populate('categoryId', 'name').lean();

    for (const prod of productsToUpdate) {
      const p = prod as any;
      const categoryName = p.categoryId?.name || '';
      const brandName = p.brand || '';
      const priceStr = p.price ? `SAR ${p.price}` : '';

      const updates: any = {};

      if (!p.metaTitle || p.metaTitle.trim() === '') {
        // Generate meta title: "Product Title - Category | PRIMO" (max 60 chars)
        let title = p.title;
        if (categoryName) {
          title = `${p.title} - ${categoryName}`;
        }
        if (title.length > 50) {
          title = title.slice(0, 50);
        }
        updates.metaTitle = `${title} | PRIMO`;
      }

      if (!p.metaDescription || p.metaDescription.trim() === '') {
        // Generate meta description from product description or title
        let desc = '';
        if (p.description) {
          // Strip HTML tags
          const cleanDesc = p.description.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
          desc = cleanDesc.slice(0, 120);
        } else {
          desc = `Shop ${p.title}`;
          if (categoryName) desc += ` in ${categoryName}`;
          if (brandName) desc += ` by ${brandName}`;
        }
        if (priceStr) desc += `. ${priceStr}`;
        desc += '. Free shipping on qualifying orders at PRIMO.';
        updates.metaDescription = desc.slice(0, 160);
      }

      if (Object.keys(updates).length > 0) {
        await Product.findByIdAndUpdate(p._id, { $set: updates });
        results.productsUpdated++;
      }
    }

    // ---- 4. Generate keywords from categories and products ----
    const existingKeywords = await SEOKeyword.find().select('keyword').lean();
    const existingKeywordSet = new Set(existingKeywords.map((k) => (k as any).keyword.toLowerCase()));

    // Category-based keywords
    const categoryKeywords = categories.map((cat) => ({
      keyword: `buy ${(cat as any).name.toLowerCase()} online`,
      targetPage: `/categories/${(cat as any).slug || (cat as any).name.toLowerCase().replace(/\s+/g, '-')}`,
      difficulty: 'medium' as const,
      notes: 'Auto-generated from category',
    }));

    // Brand-based keywords
    const brands = await Product.distinct('brand', { brand: { $exists: true, $ne: '' } });
    const brandKeywords = brands.map((brand) => ({
      keyword: `${brand} products online`,
      targetPage: '/products',
      difficulty: 'medium' as const,
      notes: 'Auto-generated from brand',
    }));

    // General e-commerce keywords
    const generalKeywords = [
      { keyword: 'primo saudi arabia', targetPage: '/', difficulty: 'easy' as const, notes: 'Brand keyword' },
      { keyword: 'primo online store', targetPage: '/', difficulty: 'easy' as const, notes: 'Brand keyword' },
      { keyword: 'online fashion store saudi arabia', targetPage: '/', difficulty: 'hard' as const, notes: 'Competitive keyword' },
      { keyword: 'premium fashion saudi arabia', targetPage: '/', difficulty: 'medium' as const, notes: 'Mid-tier keyword' },
      { keyword: 'buy fashion online saudi arabia', targetPage: '/products', difficulty: 'hard' as const, notes: 'Competitive keyword' },
      { keyword: 'best deals fashion saudi arabia', targetPage: '/offers', difficulty: 'medium' as const, notes: 'Deals keyword' },
      { keyword: 'new fashion arrivals', targetPage: '/new-arrivals', difficulty: 'medium' as const, notes: 'Seasonal keyword' },
      { keyword: 'fashion blog saudi arabia', targetPage: '/blog', difficulty: 'medium' as const, notes: 'Content keyword' },
    ];

    const allKeywords = [...categoryKeywords, ...brandKeywords, ...generalKeywords];

    for (const kw of allKeywords) {
      if (!existingKeywordSet.has(kw.keyword.toLowerCase())) {
        await SEOKeyword.create(kw);
        existingKeywordSet.add(kw.keyword.toLowerCase());
        results.keywordsCreated++;
      } else {
        results.skipped++;
      }
    }

    // ---- 5. Create common redirects ----
    const commonRedirects = [
      { fromPath: '/home', toPath: '/', type: '301' as const },
      { fromPath: '/shop', toPath: '/products', type: '301' as const },
      { fromPath: '/store', toPath: '/products', type: '301' as const },
      { fromPath: '/login', toPath: '/auth/login', type: '301' as const },
      { fromPath: '/signup', toPath: '/auth/register', type: '301' as const },
      { fromPath: '/register', toPath: '/auth/register', type: '301' as const },
      { fromPath: '/signin', toPath: '/auth/login', type: '301' as const },
      { fromPath: '/catalogue', toPath: '/products', type: '301' as const },
      { fromPath: '/catalog', toPath: '/products', type: '301' as const },
    ];

    for (const redirect of commonRedirects) {
      const existing = await SEORedirect.findOne({ fromPath: redirect.fromPath });
      if (!existing) {
        await SEORedirect.create({ ...redirect, isActive: true });
        results.redirectsCreated++;
      } else {
        results.skipped++;
      }
    }

    res.json({
      success: true,
      data: {
        message: 'SEO data populated successfully',
        ...results,
      },
    });
  })
);

export default router;
