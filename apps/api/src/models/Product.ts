// ============================================
// PRIMO API - Product Model
// ============================================

import mongoose, { Document, Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { slugify } from '@primo/shared';

export interface IProductImage {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
  order: number;
}

export interface IProductSpec {
  name: string;
  value: string;
  group?: string;
}

export interface IProductFAQ {
  id: string;
  question: string;
  answer: string;
  order: number;
}

/**
 * A single purchasable option of a product — e.g. Colour / "Stainless Steel",
 * Capacity / "12 kg", Screen Size / "65 inch".
 *
 * Variants are OPTIONAL and purely additive: a product with an empty `variants`
 * array behaves exactly as it always has (base price, `stockQuantity` is the
 * only stock). When a variant IS selected, the variant is authoritative for
 * BOTH price (base price after discount + `priceModifier`) and stock
 * (`variant.stockQuantity`, never the product aggregate).
 *
 * `stockQuantity` on the parent product is kept as the AGGREGATE across
 * variants: order placement decrements both the variant and the parent in a
 * single atomic update, so listing pages / "in stock" filters keep working
 * without having to unwind the variants array.
 */
export interface IProductVariant {
  id: string;
  /** Option name, e.g. "Colour". Variants sharing a name form one selector. */
  name: string;
  /** Option value, e.g. "Stainless Steel". */
  value: string;
  sku: string;
  /** Added to the discounted base price. May be negative. */
  priceModifier: number;
  stockQuantity: number;
  image?: string;
  isDefault?: boolean;
}

export interface IProduct extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  brand: string;
  sku: string;
  description: string;
  shortDescription?: string;
  specs: IProductSpec[];
  warranty: string;
  deliveryNotes?: string;
  installationNotes?: string;
  price: number;
  compareAtPrice?: number;
  discount?: number;
  discountEndsAt?: Date;
  stockQuantity: number;
  lowStockThreshold: number;
  variants: IProductVariant[];
  images: IProductImage[];
  categoryId: mongoose.Types.ObjectId;
  subcategoryId?: mongoose.Types.ObjectId;
  tags: string[];
  faqs: IProductFAQ[];
  relatedProductIds: mongoose.Types.ObjectId[];
  isActive: boolean;
  isFeatured: boolean;
  metaTitle?: string;
  metaDescription?: string;
  soldCount: number;
  viewCount: number;
  averageRating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
  primaryImage?: IProductImage;
  finalPrice: number;
  isOnSale: boolean;
  isInStock: boolean;
}

const productImageSchema = new Schema<IProductImage>(
  {
    id: { type: String, required: true },
    url: { type: String, required: true },
    alt: { type: String, default: '' },
    isPrimary: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const productSpecSchema = new Schema<IProductSpec>(
  {
    name: { type: String, required: true },
    value: { type: String, required: true },
    group: String,
  },
  { _id: false }
);

const productFAQSchema = new Schema<IProductFAQ>(
  {
    id: { type: String, required: true },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const productVariantSchema = new Schema<IProductVariant>(
  {
    // Defaulted so an admin/seed payload may omit it — the id is what cart and
    // order lines reference forever, so it must never be blank.
    id: { type: String, required: true, default: () => uuidv4() },
    name: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
    sku: { type: String, required: true, uppercase: true, trim: true },
    priceModifier: { type: Number, default: 0 },
    stockQuantity: { type: Number, required: true, min: 0, default: 0 },
    image: String,
    isDefault: { type: Boolean, default: false },
  },
  { _id: false }
);

const productSchema = new Schema<IProduct>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: 'text',
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    brand: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    shortDescription: String,
    specs: [productSpecSchema],
    warranty: {
      type: String,
      default: '',
    },
    deliveryNotes: String,
    installationNotes: String,
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    compareAtPrice: {
      type: Number,
      min: 0,
    },
    discount: {
      type: Number,
      min: 0,
      max: 100,
    },
    discountEndsAt: Date,
    stockQuantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 5,
      min: 0,
    },
    // Optional. An empty array means "this product has no options" and every
    // existing code path (base price, product-level stock) applies unchanged.
    variants: { type: [productVariantSchema], default: [] },
    images: [productImageSchema],
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    subcategoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
    },
    tags: [{ type: String, lowercase: true, trim: true }],
    faqs: [productFAQSchema],
    relatedProductIds: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    metaTitle: String,
    metaDescription: String,
    soldCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals
productSchema.virtual('primaryImage').get(function (this: IProduct) {
  return this.images?.find((img) => img.isPrimary) || this.images?.[0];
});

productSchema.virtual('finalPrice').get(function (this: IProduct) {
  if (this.discount && this.discount > 0) {
    const now = new Date();
    if (!this.discountEndsAt || this.discountEndsAt > now) {
      return this.price * (1 - this.discount / 100);
    }
  }
  return this.price;
});

productSchema.virtual('isOnSale').get(function (this: IProduct) {
  if (!this.discount || this.discount <= 0) return false;
  if (this.discountEndsAt && this.discountEndsAt <= new Date()) return false;
  return true;
});

productSchema.virtual('isInStock').get(function (this: IProduct) {
  return this.stockQuantity > 0;
});

// Keep the aggregate `stockQuantity` equal to the sum of the variants' stock, so
// listing pages, the `isInStock` virtual and low-stock alerts stay truthful for a
// variant product. Order placement/cancellation move both numbers together via a
// single atomic $inc (which bypasses this hook by design), so this only ever
// fires on admin edits and seeding.
productSchema.pre('validate', function (next) {
  if (this.variants && this.variants.length > 0) {
    this.stockQuantity = this.variants.reduce((sum, v) => sum + (v.stockQuantity || 0), 0);
  }
  next();
});

// Pre-save middleware to generate slug
productSchema.pre('save', async function (next) {
  if (this.isModified('title') || !this.slug) {
    let baseSlug = slugify(this.title);
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await mongoose.model('Product').findOne({ slug, _id: { $ne: this._id } });
      if (!existing) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    this.slug = slug;
  }
  next();
});

// Indexes
productSchema.index({ price: 1 });
productSchema.index({ averageRating: -1 });
productSchema.index({ soldCount: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ categoryId: 1, isActive: 1 });
productSchema.index({ brand: 1, isActive: 1 });
productSchema.index({ tags: 1 });
// Compound indexes for the public storefront list queries (always filtered by
// isActive, then a facet + a sort). These let MongoDB serve listing pages from
// an index instead of collection scans under high traffic.
productSchema.index({ isActive: 1, isFeatured: 1, soldCount: -1 }); // featured rail
productSchema.index({ isActive: 1, createdAt: -1 }); // new arrivals / default
productSchema.index({ isActive: 1, discount: 1, discountEndsAt: 1 }); // on-sale facet
productSchema.index({ isActive: 1, categoryId: 1, soldCount: -1 }); // category pages
productSchema.index(
  { title: 'text', description: 'text', brand: 'text', tags: 'text' },
  { weights: { title: 10, brand: 5, tags: 3, description: 1 } }
);

export const Product = mongoose.model<IProduct>('Product', productSchema);

// ─── Variant-aware pricing / stock helpers ───────────────────────────────────
// These are plain functions (not virtuals) on purpose: most read paths use
// `.lean()`, which strips virtuals. They are the SINGLE definition of "what does
// this line actually cost and how many can I buy", shared by the cart routes and
// order creation so the two can never drift apart.

type PricedProduct = {
  price: number;
  discount?: number | null;
  discountEndsAt?: Date | string | null;
  stockQuantity?: number;
  variants?: IProductVariant[];
};

/** Base unit price after any *currently active* product discount. */
export function getProductFinalPrice(product: PricedProduct, now: Date = new Date()): number {
  const discount = product.discount ?? 0;
  if (discount > 0 && (!product.discountEndsAt || new Date(product.discountEndsAt) > now)) {
    return product.price * (1 - discount / 100);
  }
  return product.price;
}

export function findProductVariant(
  product: PricedProduct,
  variantId?: string | null
): IProductVariant | undefined {
  if (!variantId) return undefined;
  return (product.variants || []).find((v) => v.id === variantId);
}

/**
 * Resolve what a cart/order line for `product` (+ optional variant) really costs
 * and how much of it can be sold. `variantMissing` is true when a variantId was
 * supplied but no longer exists on the product (variant deleted by an admin
 * while it sat in someone's cart) — callers decide whether to reject or drop.
 */
export function resolveLinePricing(
  product: PricedProduct,
  variantId?: string | null,
  now: Date = new Date()
): {
  variant?: IProductVariant;
  variantMissing: boolean;
  unitPrice: number;
  availableStock: number;
} {
  const basePrice = getProductFinalPrice(product, now);
  const variant = findProductVariant(product, variantId);
  const variantMissing = !!variantId && !variant;

  return {
    variant,
    variantMissing,
    // The discount applies to the base price; the modifier is a flat SAR
    // adjustment on top of it. Product-level VAT/shipping math is untouched.
    unitPrice: variant ? Math.max(0, basePrice + (variant.priceModifier || 0)) : basePrice,
    // A variant's own stock is authoritative — never the product aggregate.
    availableStock: variant ? variant.stockQuantity : product.stockQuantity ?? 0,
  };
}
