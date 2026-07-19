// ============================================
// PRIMO API - Contact Message Model
// ============================================

import mongoose, { Document, Schema } from 'mongoose';

export type ContactStatus = 'new' | 'in_progress' | 'resolved' | 'closed';

/**
 * Contact submissions arrive through two separate storefront forms and are kept
 * in one collection, discriminated by `type`. Everything complaint-specific is
 * optional so documents created before this field existed still validate — they
 * simply default to `general`.
 */
export const CONTACT_TYPES = ['general', 'complaint'] as const;

export const COMPLAINT_CATEGORIES = [
  'delivery',
  'product_quality',
  'damaged',
  'billing',
  'warranty',
  'staff',
  'other',
] as const;

export const CONTACT_PRIORITIES = ['low', 'medium', 'high'] as const;

export type ContactType = (typeof CONTACT_TYPES)[number];
export type ComplaintCategory = (typeof COMPLAINT_CATEGORIES)[number];
export type ContactPriority = (typeof CONTACT_PRIORITIES)[number];

export interface IContactMessage extends Document {
  _id: mongoose.Types.ObjectId;
  type: ContactType;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: ContactStatus;
  // Complaint-only fields
  orderNumber?: string;
  category?: ComplaintCategory;
  priority: ContactPriority;
  assignedTo?: mongoose.Types.ObjectId;
  notes?: string;
  adminNote?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const contactMessageSchema = new Schema<IContactMessage>(
  {
    type: {
      type: String,
      enum: [...CONTACT_TYPES],
      default: 'general',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: String,
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['new', 'in_progress', 'resolved', 'closed'],
      default: 'new',
      index: true,
    },
    orderNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },
    category: {
      type: String,
      enum: [...COMPLAINT_CATEGORIES],
    },
    priority: {
      type: String,
      enum: [...CONTACT_PRIORITIES],
      default: 'medium',
      index: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: String,
    adminNote: String,
    resolvedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
contactMessageSchema.index({ createdAt: -1 });
contactMessageSchema.index({ status: 1, createdAt: -1 });
// The admin inbox is always scoped to one tab (general vs complaints) and
// sorted newest first, so the compound index covers the common list query.
contactMessageSchema.index({ type: 1, status: 1, createdAt: -1 });
contactMessageSchema.index({ orderNumber: 1 });

export const ContactMessage = mongoose.model<IContactMessage>('ContactMessage', contactMessageSchema);
