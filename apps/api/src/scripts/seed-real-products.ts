// ============================================
// PRIMO API - Real Product Catalog Seed Script
// ============================================
// Seeds a REAL, demo-ready catalogue of home-appliance products (sourced from
// Amazon.sa / Noon Saudi, priced in SAR) and wires every product to the rest of
// the system:
//   • Categories + subcategories (with professional cover images)
//   • Inventory  → a `purchase` StockMovement per product (opening stock)
//   • Finance    → an `inventory` Expense + a matching debit Transaction per
//                  product, so the accounting module reflects the stock buy-in
//   • Related products are cross-linked within each parent category
//
// Everything created here is fully editable / deletable / addable from the admin
// panel afterwards — this script only provides the initial demo data.
//
// Run with: npm run seed:catalog   (or: npx tsx src/scripts/seed-real-products.ts)
// ============================================

import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { slugify } from '@primo/shared';
import { Category } from '../models/Category';
import { Product } from '../models/Product';
import { Brand } from '../models/Brand';
import { StockMovement } from '../models/StockMovement';
import { Expense } from '../models/Expense';
import { Transaction } from '../models/Transaction';
import { Order } from '../models/Order';
import { Review } from '../models/Review';
import { User } from '../models/User';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/primo';

// ─── Types ──────────────────────────────────────────────────────────────────

interface CatalogImage {
  url: string;
  alt: string;
  isPrimary?: boolean;
  order?: number;
}
interface CatalogSpec {
  name: string;
  value: string;
  group?: string;
}
interface CatalogFaq {
  question: string;
  answer: string;
}
/**
 * Optional purchasable option. `stockQuantity` across a product's variants must
 * sum to the product's own `stockQuantity` — the Product model recomputes the
 * aggregate from the variants, and the inventory/accounting entries below are
 * booked against that same number.
 */
interface CatalogVariant {
  name: string;
  value: string;
  sku: string;
  priceModifier?: number;
  stockQuantity: number;
  image?: string;
  isDefault?: boolean;
}
interface CatalogProduct {
  sku: string;
  title: string;
  brand: string;
  category: string; // parent category name
  subcategory: string; // subcategory name
  description: string;
  shortDescription?: string;
  specs: CatalogSpec[];
  warranty: string;
  price: number; // SAR
  compareAtPrice?: number;
  discount?: number;
  stockQuantity: number;
  lowStockThreshold?: number;
  variants?: CatalogVariant[];
  images: CatalogImage[];
  tags?: string[];
  faqs?: CatalogFaq[];
  isFeatured?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  deliveryNotes?: string;
  installationNotes?: string;
}

// ─── Parent category presentation (order, icon, cover image, blurb) ─────────

const PARENT_META: Record<
  string,
  { order: number; icon: string; image: string; description: string }
> = {
  'Large Appliances': {
    order: 1,
    icon: '🔌',
    image: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&q=80',
    description:
      'Refrigerators, washing machines, air conditioners and dishwashers from the brands you trust.',
  },
  'Kitchen Appliances': {
    order: 2,
    icon: '🍳',
    image: 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=800&q=80',
    description:
      'Microwaves, air fryers, blenders and coffee makers to power up your kitchen.',
  },
  'Home Entertainment': {
    order: 3,
    icon: '📺',
    image: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=800&q=80',
    description: 'Smart TVs, soundbars and speakers for an immersive home experience.',
  },
  Cleaning: {
    order: 4,
    icon: '🧹',
    image: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800&q=80',
    description: 'Vacuum cleaners and steam cleaners that make light work of every chore.',
  },
  'Personal Care': {
    order: 5,
    icon: '💇',
    image: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=800&q=80',
    description: 'Hair care, shavers, trimmers and IPL devices for looking your best.',
  },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function loadCatalog(): CatalogProduct[] {
  const file = path.resolve(__dirname, 'catalog-products.json');
  if (!fs.existsSync(file)) {
    throw new Error(`Catalog data file not found: ${file}`);
  }
  const data = JSON.parse(fs.readFileSync(file, 'utf-8')) as CatalogProduct[];
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('catalog-products.json is empty or not an array');
  }
  return data;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function round(n: number): number {
  return Math.round(n);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Canonicalise brand names so the same brand never fragments across casings/spellings
const BRAND_ALIASES: Record<string, string> = {
  'black+decker': 'Black+Decker',
  'black & decker': 'Black+Decker',
  'black and decker': 'Black+Decker',
  delonghi: "De'Longhi",
  "de'longhi": "De'Longhi",
};
function normalizeBrand(name: string): string {
  return BRAND_ALIASES[name.trim().toLowerCase()] || name.trim();
}

const REVIEW_TITLES = [
  'Excellent value for money',
  'Highly recommended',
  'Exactly as described',
  'Great quality',
  'Very happy with this purchase',
  'Works perfectly',
  'Worth every riyal',
  'Fast delivery, great product',
];
const REVIEW_COMMENTS = [
  'Arrived quickly and works exactly as advertised. Build quality feels premium and it has become a daily essential at home.',
  'Really impressed with the performance. Setup was simple and it does the job better than my previous one.',
  'Great product for the price. Would definitely buy from PRIMO again — smooth experience from order to delivery.',
  'Exceeded my expectations. Quiet, efficient and well designed. Five stars from me.',
  'Solid build and reliable so far. Delivery team was professional and on time.',
  'Does everything I need. Easy to use and the finish looks great in my kitchen.',
  'Very good quality and genuine product. Packaging was secure and nothing was damaged.',
  'Happy customer here. The features are exactly what the listing promised.',
];

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔗 Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected.\n');

  const catalog = loadCatalog();
  console.log(`📋 Loaded ${catalog.length} products from catalog-products.json\n`);

  // ── An admin user is required as the actor for stock movements & expenses ──
  let admin = await User.findOne({ role: { $in: ['super_admin', 'admin'] } });
  if (!admin) {
    admin = await User.create({
      name: 'PRIMO Admin',
      email: 'admin@primo.com',
      password: 'admin123',
      role: 'super_admin',
      isEmailVerified: true,
    });
    console.log('👤 Created fallback admin user (admin@primo.com / admin123)');
  }

  // ── Step 1: clean the slate (products, the category tree, inventory & the
  //            finance records this script owns) so the demo rebuilds cleanly ─
  console.log('🗑️  Clearing existing products, categories, stock movements and seeded finance...');
  const delProducts = await Product.deleteMany({});
  const delCats = await Category.deleteMany({}); // rebuilt fresh below — avoids stale/empty cards
  await StockMovement.deleteMany({}); // inventory history is rebuilt below
  await Transaction.deleteMany({ reference: { $regex: '^SEED-INV-' } });
  await Expense.deleteMany({ title: { $regex: '^\\[Stock\\] ' } });
  console.log(
    `   Removed ${delProducts.deletedCount} products + ${delCats.deletedCount} categories; rebuilt inventory/finance.\n`
  );

  // ── Step 2: build the category tree (parents + subcategories) ─────────────
  console.log('📁 Upserting categories...');

  // Derive parent → set(subcategories) from the catalogue itself
  const tree = new Map<string, Set<string>>();
  const firstImageForSub = new Map<string, string>(); // "Parent::Sub" -> image url
  for (const p of catalog) {
    if (!tree.has(p.category)) tree.set(p.category, new Set());
    if (p.subcategory) {
      tree.get(p.category)!.add(p.subcategory);
      const key = `${p.category}::${p.subcategory}`;
      if (!firstImageForSub.has(key) && p.images?.[0]?.url) {
        firstImageForSub.set(key, p.images[0].url);
      }
    }
  }

  const categoryId = new Map<string, mongoose.Types.ObjectId>(); // name keys
  for (const [parentName, subs] of tree) {
    const meta = PARENT_META[parentName] || {
      order: 99,
      icon: '📦',
      image: '',
      description: '',
    };
    const parent = await Category.findOneAndUpdate(
      { name: parentName, parentId: { $exists: false } },
      {
        $set: {
          name: parentName,
          slug: slugify(parentName),
          description: meta.description,
          image: meta.image,
          icon: meta.icon,
          order: meta.order,
          showInTopBar: true,
          topBarOrder: meta.order,
          isActive: true,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    categoryId.set(parentName, parent._id);
    console.log(`   ▸ ${parentName}`);

    let subOrder = 1;
    for (const subName of subs) {
      const subImage = firstImageForSub.get(`${parentName}::${subName}`) || '';
      const sub = await Category.findOneAndUpdate(
        { name: subName, parentId: parent._id },
        {
          $set: {
            name: subName,
            slug: slugify(subName),
            parentId: parent._id,
            image: subImage,
            order: subOrder,
            showInTopBar: false,
            isActive: true,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      categoryId.set(`${parentName}::${subName}`, sub._id);
      console.log(`       – ${subName}`);
      subOrder++;
    }
  }
  console.log('');

  // ── Step 3: insert products + inventory + finance ─────────────────────────
  console.log('📦 Importing products with inventory & finance links...');
  const createdByCategory = new Map<string, mongoose.Types.ObjectId[]>();
  const createdProducts: any[] = [];
  let created = 0;
  let totalInventoryCost = 0;

  for (const def of catalog) {
    const catId = categoryId.get(def.category);
    if (!catId) {
      console.warn(`   ⚠️  ${def.sku}: parent category "${def.category}" missing — skipped`);
      continue;
    }
    const subId = categoryId.get(`${def.category}::${def.subcategory}`);

    const images = (def.images || []).map((img, i) => ({
      id: uuidv4(),
      url: img.url,
      alt: img.alt || def.title,
      isPrimary: img.isPrimary ?? i === 0,
      order: img.order ?? i,
    }));
    if (images.length && !images.some((im) => im.isPrimary)) images[0].isPrimary = true;

    const specs = (def.specs || []).map((s) => ({
      name: s.name,
      value: s.value,
      group: s.group || 'General',
    }));
    const faqs = (def.faqs || []).map((f, i) => ({
      id: uuidv4(),
      question: f.question,
      answer: f.answer,
      order: i,
    }));
    const variants = (def.variants || []).map((v, i) => ({
      id: uuidv4(),
      name: v.name,
      value: v.value,
      sku: v.sku.toUpperCase(),
      priceModifier: v.priceModifier ?? 0,
      stockQuantity: v.stockQuantity,
      ...(v.image && { image: v.image }),
      isDefault: v.isDefault ?? i === 0,
    }));
    if (variants.length) {
      const variantStock = variants.reduce((sum, v) => sum + v.stockQuantity, 0);
      if (variantStock !== def.stockQuantity) {
        // The Product model derives stockQuantity from the variants, so a
        // mismatch would silently desync the StockMovement/Expense entries
        // booked below against def.stockQuantity.
        throw new Error(
          `${def.sku}: variant stock (${variantStock}) must equal stockQuantity (${def.stockQuantity})`
        );
      }
    }

    const onSale = !!def.discount && def.discount > 0;
    const discountEndsAt = onSale
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      : undefined;

    const product = await Product.create({
      title: def.title,
      brand: normalizeBrand(def.brand),
      sku: def.sku.toUpperCase(),
      description: def.description,
      shortDescription: def.shortDescription,
      specs,
      warranty: def.warranty || '',
      price: def.price,
      ...(onSale
        ? {
            discount: def.discount,
            compareAtPrice: def.compareAtPrice || def.price,
            discountEndsAt,
          }
        : def.compareAtPrice
        ? { compareAtPrice: def.compareAtPrice }
        : {}),
      stockQuantity: def.stockQuantity,
      lowStockThreshold: def.lowStockThreshold ?? 5,
      variants,
      images,
      categoryId: catId,
      ...(subId && { subcategoryId: subId }),
      tags: def.tags || [],
      faqs,
      isActive: true,
      isFeatured: !!def.isFeatured,
      metaTitle: def.metaTitle,
      metaDescription: def.metaDescription,
      ...(def.deliveryNotes && { deliveryNotes: def.deliveryNotes }),
      ...(def.installationNotes && { installationNotes: def.installationNotes }),
      // soldCount / averageRating / reviewCount are driven by the real orders &
      // reviews generated below, so they stay consistent with the storefront.
      soldCount: 0,
      viewCount: randInt(80, 5000),
      averageRating: 0,
      reviewCount: 0,
    });
    created++;

    if (!createdByCategory.has(def.category)) createdByCategory.set(def.category, []);
    createdByCategory.get(def.category)!.push(product._id);
    createdProducts.push(product);

    // ── Inventory: opening-stock purchase movement ──────────────────────────
    await StockMovement.create({
      productId: product._id,
      type: 'purchase',
      quantity: def.stockQuantity,
      previousStock: 0,
      newStock: def.stockQuantity,
      reason: 'Opening stock — initial purchase order',
      reference: `SEED-INV-${product.sku}`,
      userId: admin._id,
      notes: `Initial inventory for ${def.title}`,
    });

    // ── Finance: inventory expense + matching debit transaction ─────────────
    const unitCost = round(def.price * 0.62); // assume ~38% gross margin
    const lineCost = unitCost * def.stockQuantity;
    totalInventoryCost += lineCost;
    const purchaseDate = new Date(Date.now() - randInt(1, 60) * 24 * 60 * 60 * 1000);

    const expense = await Expense.create({
      title: `[Stock] ${def.title}`,
      amount: lineCost,
      category: 'inventory',
      date: purchaseDate,
      description: `Purchase of ${def.stockQuantity} × ${def.title} (SKU ${product.sku}) @ SAR ${unitCost} cost/unit`,
      isRecurring: false,
      createdBy: admin._id,
    });

    await Transaction.create({
      type: 'debit',
      amount: lineCost,
      category: 'expense',
      description: `Inventory purchase: ${def.title} ×${def.stockQuantity}`,
      reference: `SEED-INV-${product.sku}`,
      expenseId: expense._id,
      date: purchaseDate,
      createdBy: admin._id,
    });

    console.log(
      `   + ${product.sku.padEnd(22)} SAR ${String(def.price).padStart(6)}  stock ${String(
        def.stockQuantity
      ).padStart(3)}  (cost SAR ${lineCost})`
    );
  }

  // ── Step 4: cross-link related products within each parent category ───────
  console.log('\n🔗 Linking related products...');
  for (const [, ids] of createdByCategory) {
    for (const id of ids) {
      const related = ids.filter((x) => !x.equals(id)).slice(0, 4);
      if (related.length) {
        await Product.updateOne({ _id: id }, { $set: { relatedProductIds: related } });
      }
    }
  }

  // ── Step 5: refresh category product counts ───────────────────────────────
  console.log('🔢 Updating category product counts...');
  const allCats = await Category.find({});
  for (const cat of allCats) {
    const count = await Product.countDocuments({
      isActive: true,
      $or: [{ categoryId: cat._id }, { subcategoryId: cat._id }],
    });
    await Category.updateOne({ _id: cat._id }, { $set: { productCount: count } });
  }

  // ── Step 6: brands — every product brand gets a Brand document ────────────
  console.log('🏷️  Upserting brands...');
  const brandNames = Array.from(new Set(createdProducts.map((p) => p.brand)));
  for (const name of brandNames) {
    await Brand.updateOne(
      { name },
      { $set: { name, slug: slugify(name), isActive: true } },
      { upsert: true }
    );
  }
  // Hide any leftover brands that no longer have products so the storefront brand
  // carousel/filter never lead to an empty results page.
  const deactivated = await Brand.updateMany(
    { name: { $nin: brandNames } },
    { $set: { isActive: false } }
  );
  console.log(
    `   ${brandNames.length} active brands; ${deactivated.modifiedCount} empty brand(s) hidden.`
  );

  // ── Step 7: regenerate demo orders, reviews & order revenue ───────────────
  // The previous catalogue's orders/reviews referenced now-deleted products, so
  // we rebuild them against the new products. This keeps Orders, Customers,
  // Analytics, Reviews and Finance all consistent and linked.
  console.log('🧾 Rebuilding orders, reviews and order revenue...');
  await Order.deleteMany({});
  await Review.deleteMany({});
  await Transaction.deleteMany({ category: { $in: ['order_revenue', 'order_refund'] } });

  // Customers (regular users). Create a couple of Saudi demo customers if thin.
  let customers = await User.find({ role: 'user' });
  if (customers.length < 4) {
    const demoCustomers = [
      { firstName: 'Khalid', lastName: 'Al-Otaibi', email: 'khalid@example.com', phone: '+966500000001', city: 'Riyadh', area: 'Al Olaya' },
      { firstName: 'Sara', lastName: 'Al-Qahtani', email: 'sara@example.com', phone: '+966500000002', city: 'Jeddah', area: 'Al Rawdah' },
      { firstName: 'Noura', lastName: 'Al-Harbi', email: 'noura@example.com', phone: '+966500000003', city: 'Dammam', area: 'Al Faisaliyah' },
    ];
    for (const c of demoCustomers) {
      const exists = await User.findOne({ email: c.email });
      if (!exists) {
        const u = await User.create({
          firstName: c.firstName,
          lastName: c.lastName,
          email: c.email,
          password: 'password123',
          phone: c.phone,
          role: 'user',
          isEmailVerified: true,
          addresses: [
            {
              id: uuidv4(),
              label: 'Home',
              fullAddress: `${c.area}, ${c.city}`,
              city: c.city,
              area: c.area,
              isDefault: true,
            },
          ],
        });
        customers.push(u);
      }
    }
  }

  const SAUDI_CITIES = [
    { city: 'Riyadh', area: 'Al Olaya' },
    { city: 'Jeddah', area: 'Al Rawdah' },
    { city: 'Dammam', area: 'Al Faisaliyah' },
    { city: 'Mecca', area: 'Al Aziziyah' },
    { city: 'Medina', area: 'Al Haram' },
  ];
  const ORDER_STATUSES: Array<
    'delivered' | 'delivered' | 'delivered' | 'out_for_delivery' | 'in_progress' | 'accepted' | 'new' | 'cancelled'
  > = ['delivered', 'delivered', 'delivered', 'out_for_delivery', 'in_progress', 'accepted', 'new', 'cancelled'];

  const soldByProduct = new Map<string, number>();
  let ordersCreated = 0;
  let revenueTotal = 0;
  let revenueTxns = 0;
  const deliveredOrders: any[] = [];

  const ORDER_COUNT = 28;
  for (let i = 0; i < ORDER_COUNT; i++) {
    const user = pick(customers);
    const itemCount = randInt(1, 3);
    const shuffled = [...createdProducts].sort(() => 0.5 - Math.random()).slice(0, itemCount);

    const items = shuffled.map((p) => {
      const qty = randInt(1, 2);
      const unit = round(p.finalPrice); // respects active discount
      const it: any = {
        productId: p._id,
        title: p.title,
        sku: p.sku,
        price: unit,
        quantity: qty,
        image: p.images?.[0]?.url,
      };
      if (p.discount && p.discount > 0) {
        it.originalPrice = p.price;
        it.discount = p.discount;
      }
      return it;
    });

    const subtotal = items.reduce((s, it) => s + it.price * it.quantity, 0);
    const shippingCost = subtotal >= 500 ? 0 : 50;
    const total = subtotal + shippingCost;
    const status = pick(ORDER_STATUSES);
    const daysAgo = randInt(1, 90);
    const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    const flow = ['accepted', 'in_progress', 'out_for_delivery', 'delivered'];
    const statusHistory: any[] = [{ status: 'new', timestamp: createdAt, updatedBy: user._id }];
    if (status !== 'new') {
      if (status === 'cancelled') {
        statusHistory.push({
          status: 'cancelled',
          timestamp: new Date(createdAt.getTime() + 12 * 60 * 60 * 1000),
          updatedBy: admin._id,
          note: 'Customer requested cancellation',
        });
      } else {
        const upto = flow.indexOf(status);
        for (let j = 0; j <= upto; j++) {
          statusHistory.push({
            status: flow[j],
            timestamp: new Date(createdAt.getTime() + (j + 1) * 12 * 60 * 60 * 1000),
            updatedBy: admin._id,
          });
        }
      }
    }

    const deliveredAt =
      status === 'delivered'
        ? new Date(createdAt.getTime() + 3 * 24 * 60 * 60 * 1000)
        : undefined;
    const paymentMethod = pick(['cash_on_delivery', 'card', 'apple_pay'] as const);
    const paymentStatus =
      status === 'delivered' ? 'paid' : status === 'cancelled' ? 'failed' : 'pending';
    const addr = pick(SAUDI_CITIES);

    const order = await Order.create({
      userId: user._id,
      items,
      subtotal,
      shippingCost,
      discount: 0,
      total,
      status,
      statusHistory,
      paymentMethod,
      paymentStatus,
      shippingAddress: {
        fullName: `${user.firstName} ${user.lastName}`,
        phone: user.phone || '+966500000000',
        email: user.email,
        fullAddress: user.addresses?.[0]?.fullAddress || `${addr.area}, ${addr.city}`,
        city: user.addresses?.[0]?.city || addr.city,
        area: user.addresses?.[0]?.area || addr.area,
      },
      estimatedDelivery: new Date(createdAt.getTime() + 4 * 24 * 60 * 60 * 1000),
      ...(deliveredAt && { deliveredAt }),
    });
    // timestamps:true overrides createdAt on insert — backdate it so the demo
    // shows orders spread across the last 90 days (analytics, orders list).
    await Order.updateOne({ _id: order._id }, { $set: { createdAt } }, { timestamps: false });
    ordersCreated++;

    // Count units sold for fulfilled (non-cancelled) orders
    if (status !== 'cancelled' && status !== 'new') {
      for (const it of items) {
        soldByProduct.set(it.productId.toString(), (soldByProduct.get(it.productId.toString()) || 0) + it.quantity);
      }
    }

    // Finance: paid orders book revenue
    if (paymentStatus === 'paid') {
      await Transaction.create({
        type: 'credit',
        amount: total,
        category: 'order_revenue',
        description: `Order revenue — ${order.orderNumber}`,
        reference: order.orderNumber,
        orderId: order._id,
        date: deliveredAt || createdAt,
        createdBy: admin._id,
      });
      revenueTotal += total;
      revenueTxns++;
      deliveredOrders.push({ order, user, items });
    }
  }

  // Reviews — only from delivered orders (satisfies the required orderId), then
  // recompute each product's rating from its approved reviews so the numbers match.
  let reviewsCreated = 0;
  for (const { order, user, items } of deliveredOrders) {
    for (const it of items) {
      if (Math.random() < 0.7) {
        const rating = pick([5, 5, 5, 4, 4, 3]);
        try {
          await Review.create({
            productId: it.productId,
            userId: user._id,
            userName: `${user.firstName} ${user.lastName}`,
            orderId: order._id,
            rating,
            title: pick(REVIEW_TITLES),
            comment: pick(REVIEW_COMMENTS),
            status: 'approved',
            isVerifiedPurchase: true,
          });
          reviewsCreated++;
        } catch (err: any) {
          // ignore duplicate (same product+user+order); surface anything else
          if (err?.code !== 11000) console.warn(`   ⚠️  review failed: ${err?.message}`);
        }
      }
    }
  }

  // Recompute soldCount + rating aggregates per product
  console.log('⭐ Recomputing product ratings & sold counts...');
  for (const p of createdProducts) {
    const sold = soldByProduct.get(p._id.toString()) || 0;
    const agg = await Review.aggregate([
      { $match: { productId: p._id, status: 'approved' } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    const avg = agg[0] ? Math.round(agg[0].avg * 10) / 10 : 0;
    const count = agg[0] ? agg[0].count : 0;
    await Product.updateOne(
      { _id: p._id },
      { $set: { soldCount: sold, averageRating: avg, reviewCount: count } }
    );
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n🎉 Done!');
  console.log(`   Products created:        ${created}`);
  console.log(`   Categories (incl. subs): ${allCats.length}`);
  console.log(`   Brands:                  ${brandNames.length}`);
  console.log(`   Inventory invested:      SAR ${totalInventoryCost.toLocaleString()}`);
  console.log(`   Stock movements:         ${created} (purchase)`);
  console.log(`   Inventory finance:       ${created} expenses + ${created} debit transactions`);
  console.log(`   Demo orders:             ${ordersCreated}`);
  console.log(`   Order revenue:           SAR ${revenueTotal.toLocaleString()} (${revenueTxns} credit transactions)`);
  console.log(`   Reviews:                 ${reviewsCreated} (approved)\n`);

  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB.');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
