/**
 * Extracts a user-friendly, descriptive error message from API error responses.
 *
 * Handles all backend error formats:
 * - Zod/Mongoose validation errors with field-level details
 * - AppError with message
 * - MongoDB duplicate key errors
 * - Generic error messages
 */

// Friendly field name mapping for common backend field paths
const FIELD_LABELS: Record<string, string> = {
  'title': 'Title',
  'name': 'Name',
  'description': 'Description',
  'price': 'Price',
  'sku': 'SKU',
  'stockQuantity': 'Stock Quantity',
  'categoryId': 'Category',
  'brand': 'Brand',
  'email': 'Email',
  'password': 'Password',
  'firstName': 'First Name',
  'lastName': 'Last Name',
  'phone': 'Phone',
  'fullName': 'Full Name',
  'fullAddress': 'Full Address',
  'city': 'City',
  'area': 'Area',
  'image': 'Image',
  'images': 'Images',
  'code': 'Code',
  'type': 'Type',
  'value': 'Value',
  'startsAt': 'Start Date',
  'endsAt': 'End Date',
  'status': 'Status',
  'content': 'Content',
  'excerpt': 'Excerpt',
  'slug': 'Slug',
  'url': 'URL',
  'link': 'Link',
  'order': 'Order',
  'role': 'Role',
  'permissions': 'Permissions',
  'quantity': 'Quantity',
  'amount': 'Amount',
  'category': 'Category',
  'date': 'Date',
  'reason': 'Reason',
  'note': 'Note',
  'paymentMethod': 'Payment Method',
  'shippingAddress': 'Shipping Address',
  'shippingAddress.fullName': 'Full Name',
  'shippingAddress.phone': 'Phone',
  'shippingAddress.email': 'Email',
  'shippingAddress.fullAddress': 'Address',
  'shippingAddress.city': 'City',
  'shippingAddress.area': 'Area',
  'minOrderAmount': 'Min Order Amount',
  'maxDiscount': 'Max Discount',
  'usageLimit': 'Usage Limit',
  'compareAtPrice': 'Compare at Price',
  'discount': 'Discount',
  'warranty': 'Warranty',
  'subtitle': 'Subtitle',
  'mobileImage': 'Mobile Image',
  'linkText': 'Link Text',
  'backgroundColor': 'Background Color',
  'textColor': 'Text Color',
  'isActive': 'Active Status',
  'isFeatured': 'Featured Status',
  'rating': 'Rating',
  'comment': 'Comment',
  'productId': 'Product',
  'orderId': 'Order',
};

function getFriendlyFieldName(path: string): string {
  // Check direct match first
  if (FIELD_LABELS[path]) return FIELD_LABELS[path];

  // Try stripping "body." prefix from validation middleware
  const withoutPrefix = path.replace(/^(body|query|params)\./, '');
  if (FIELD_LABELS[withoutPrefix]) return FIELD_LABELS[withoutPrefix];

  // Fallback: capitalize and humanize field name
  const lastPart = withoutPrefix.split('.').pop() || withoutPrefix;
  return lastPart
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

export function getApiErrorMessage(error: any, fallback: string): string {
  const data = error?.response?.data;
  if (!data) {
    // Network error or no response
    if (error?.message === 'Network Error') {
      return 'Unable to connect to the server. Please check your internet connection.';
    }
    return fallback;
  }

  // Handle field-level validation errors (Zod / Mongoose)
  // Format: { errors: { "fieldPath": ["message1", "message2"] } }
  if (data.errors && typeof data.errors === 'object' && !Array.isArray(data.errors)) {
    const entries = Object.entries(data.errors) as [string, string[]][];
    if (entries.length > 0) {
      const details = entries
        .map(([field, messages]) => {
          const label = getFriendlyFieldName(field);
          const msg = Array.isArray(messages) ? messages[0] : String(messages);
          return `• ${label}: ${msg}`;
        })
        .join('\n');

      if (entries.length === 1) {
        const [field, messages] = entries[0];
        const label = getFriendlyFieldName(field);
        const msg = Array.isArray(messages) ? messages[0] : String(messages);
        return `${label}: ${msg}`;
      }

      return `Please fix the following:\n${details}`;
    }
  }

  // Handle simple error message from backend
  // The backend sends either { error: "message" } or { message: "message" }
  const message = data.error || data.message;
  if (message && typeof message === 'string') {
    return message;
  }

  return fallback;
}
