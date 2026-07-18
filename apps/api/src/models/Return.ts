// ============================================
// PRIMO API - Return / RMA Model
// ============================================

import mongoose, { Document, Schema } from 'mongoose';

export type ReturnReason =
  | 'damaged'
  | 'defective'
  | 'wrong_item'
  | 'not_as_described'
  | 'changed_mind'
  | 'other';

export type ReturnStatus = 'requested' | 'approved' | 'rejected' | 'received' | 'refunded';

export const RETURN_REASONS: ReturnReason[] = [
  'damaged',
  'defective',
  'wrong_item',
  'not_as_described',
  'changed_mind',
  'other',
];

export const RETURN_STATUSES: ReturnStatus[] = [
  'requested',
  'approved',
  'rejected',
  'received',
  'refunded',
];

export interface IReturnItem {
  productId: mongoose.Types.ObjectId;
  // The exact option that was bought, so the refund restores stock to THAT
  // variant. Absent for products sold without variants.
  variantId?: string;
  variantName?: string;
  variantValue?: string;
  title: string;
  sku: string;
  quantity: number;
  price: number;
  reason?: ReturnReason;
}

export interface IReturn extends Document {
  _id: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  orderNumber: string;
  items: IReturnItem[];
  reason: ReturnReason;
  description?: string;
  status: ReturnStatus;
  refundAmount: number;
  adminNote?: string;
  requestedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const returnItemSchema = new Schema<IReturnItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    variantId: String,
    variantName: String,
    variantValue: String,
    title: { type: String, required: true },
    sku: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    reason: {
      type: String,
      enum: RETURN_REASONS,
    },
  },
  { _id: false }
);

const returnSchema = new Schema<IReturn>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      required: true,
      index: true,
    },
    items: {
      type: [returnItemSchema],
      validate: {
        validator: (items: IReturnItem[]) => Array.isArray(items) && items.length > 0,
        message: 'A return must include at least one item',
      },
    },
    reason: {
      type: String,
      enum: RETURN_REASONS,
      required: true,
    },
    description: String,
    status: {
      type: String,
      enum: RETURN_STATUSES,
      default: 'requested',
      index: true,
    },
    refundAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    adminNote: String,
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    resolvedAt: Date,
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
// At most one *live* return per order, enforced at the DB level so two
// concurrent submissions can't both slip past the application-level check.
// Rejected returns are excluded so a customer can re-request after a rejection.
returnSchema.index(
  { orderId: 1 },
  {
    unique: true,
    // $ne is not a valid partial-index operator — enumerate the live statuses.
    partialFilterExpression: {
      status: { $in: ['requested', 'approved', 'received', 'refunded'] },
    },
  }
);
returnSchema.index({ orderId: 1, createdAt: -1 });
returnSchema.index({ createdAt: -1 });
returnSchema.index({ status: 1, createdAt: -1 }); // admin list filtered by status
returnSchema.index({ userId: 1, createdAt: -1 }); // customer's own returns

export const Return = mongoose.model<IReturn>('Return', returnSchema);
