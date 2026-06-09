/**
 * Export data to various formats (CSV, Excel)
 */

interface ExportColumn {
  key: string;
  header: string;
  transform?: (value: any, row: any) => string;
}

/**
 * Escape CSV value to handle commas, quotes, and newlines
 */
function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  // If the value contains comma, quote, or newline, wrap it in quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

/**
 * Convert data array to CSV string
 */
export function convertToCSV<T extends Record<string, any>>(
  data: T[],
  columns: ExportColumn[]
): string {
  // Header row
  const headers = columns.map((col) => escapeCSVValue(col.header)).join(',');

  // Data rows
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const value = col.transform
          ? col.transform(row[col.key], row)
          : row[col.key];
        return escapeCSVValue(value);
      })
      .join(',')
  );

  return [headers, ...rows].join('\n');
}

/**
 * Download data as CSV file
 */
export function downloadCSV(csv: string, filename: string) {
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export data to CSV and download
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  columns: ExportColumn[],
  filename: string
) {
  const csv = convertToCSV(data, columns);
  downloadCSV(csv, filename);
}

// Predefined column configurations for common data types

export const productColumns: ExportColumn[] = [
  { key: '_id', header: 'Product ID' },
  { key: 'title', header: 'Product Name' },
  { key: 'slug', header: 'Slug' },
  { key: 'sku', header: 'SKU' },
  { key: 'brand', header: 'Brand' },
  { key: 'category', header: 'Category', transform: (_, row) => row.category?.name || row.categoryId || '' },
  { key: 'description', header: 'Description' },
  { key: 'price', header: 'Price (SAR)' },
  { key: 'compareAtPrice', header: 'Compare At Price (SAR)' },
  { key: 'discount', header: 'Discount %' },
  { key: 'stockQuantity', header: 'Stock Quantity' },
  { key: 'warranty', header: 'Warranty' },
  { key: 'averageRating', header: 'Average Rating' },
  { key: 'reviewCount', header: 'Review Count' },
  { key: 'soldCount', header: 'Sold Count' },
  { key: 'viewCount', header: 'View Count' },
  { key: 'isFeatured', header: 'Featured', transform: (val) => val ? 'Yes' : 'No' },
  { key: 'isNew', header: 'New Arrival', transform: (val) => val ? 'Yes' : 'No' },
  { key: 'isActive', header: 'Status', transform: (val) => val ? 'Active' : 'Inactive' },
  { key: 'images', header: 'Image URLs', transform: (val) => val?.map((img: any) => img.url).join('; ') || '' },
  { key: 'tags', header: 'Tags', transform: (val) => val?.join('; ') || '' },
  { key: 'createdAt', header: 'Created Date', transform: (val) => val ? new Date(val).toLocaleString() : '' },
  { key: 'updatedAt', header: 'Updated Date', transform: (val) => val ? new Date(val).toLocaleString() : '' },
];

export const orderColumns: ExportColumn[] = [
  { key: '_id', header: 'Order ID' },
  { key: 'orderNumber', header: 'Order Number' },
  { key: 'user', header: 'Customer Name', transform: (_, row) => `${row.user?.firstName || ''} ${row.user?.lastName || ''}`.trim() || row.shippingAddress?.fullName || '' },
  { key: 'email', header: 'Email', transform: (_, row) => row.user?.email || '' },
  { key: 'phone', header: 'Phone', transform: (_, row) => row.user?.phone || row.shippingAddress?.phone || '' },
  { key: 'shippingAddress', header: 'Shipping Address', transform: (val) => val ? `${val.address}, ${val.city}, ${val.state}` : '' },
  { key: 'items', header: 'Items', transform: (val) => val?.map((item: any) => `${item.product?.title || item.title} (x${item.quantity})`).join('; ') || '' },
  { key: 'itemCount', header: 'Total Items', transform: (_, row) => row.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0 },
  { key: 'subtotal', header: 'Subtotal (SAR)' },
  { key: 'discount', header: 'Discount (SAR)' },
  { key: 'discountCode', header: 'Discount Code' },
  { key: 'shippingCost', header: 'Shipping (SAR)' },
  { key: 'tax', header: 'Tax (SAR)' },
  { key: 'total', header: 'Total (SAR)' },
  { key: 'status', header: 'Order Status' },
  { key: 'paymentStatus', header: 'Payment Status' },
  { key: 'paymentMethod', header: 'Payment Method' },
  { key: 'notes', header: 'Order Notes' },
  { key: 'cancelReason', header: 'Cancel Reason' },
  { key: 'createdAt', header: 'Order Date', transform: (val) => val ? new Date(val).toLocaleString() : '' },
  { key: 'updatedAt', header: 'Last Updated', transform: (val) => val ? new Date(val).toLocaleString() : '' },
];

export const customerColumns: ExportColumn[] = [
  { key: '_id', header: 'Customer ID' },
  { key: 'firstName', header: 'First Name' },
  { key: 'lastName', header: 'Last Name' },
  { key: 'name', header: 'Full Name', transform: (_, row) => `${row.firstName || ''} ${row.lastName || ''}`.trim() },
  { key: 'email', header: 'Email' },
  { key: 'phone', header: 'Phone' },
  { key: 'role', header: 'Role' },
  { key: 'isEmailVerified', header: 'Email Verified', transform: (val) => val ? 'Yes' : 'No' },
  { key: 'isActive', header: 'Status', transform: (val) => val ? 'Active' : 'Inactive' },
  { key: 'referralCode', header: 'Referral Code' },
  { key: 'referredBy', header: 'Referred By' },
  { key: 'addresses', header: 'Address Count', transform: (val) => val?.length || 0 },
  { key: 'defaultAddress', header: 'Default Address', transform: (_, row) => {
    const addr = row.addresses?.find((a: any) => a.isDefault);
    return addr ? `${addr.address}, ${addr.city}, ${addr.state}` : '';
  }},
  { key: 'ordersCount', header: 'Total Orders' },
  { key: 'totalSpent', header: 'Total Spent (SAR)' },
  { key: 'lastLogin', header: 'Last Login', transform: (val) => val ? new Date(val).toLocaleString() : 'Never' },
  { key: 'createdAt', header: 'Joined Date', transform: (val) => val ? new Date(val).toLocaleString() : '' },
];

export const reviewColumns: ExportColumn[] = [
  { key: '_id', header: 'Review ID' },
  { key: 'product', header: 'Product', transform: (_, row) => row.product?.title || '' },
  { key: 'productId', header: 'Product ID', transform: (_, row) => row.product?._id || row.productId || '' },
  { key: 'user', header: 'Customer', transform: (_, row) => row.user?.name || `${row.user?.firstName || ''} ${row.user?.lastName || ''}`.trim() || row.userName || '' },
  { key: 'userEmail', header: 'Customer Email', transform: (_, row) => row.user?.email || '' },
  { key: 'order', header: 'Order Number', transform: (_, row) => row.order?.orderNumber || row.orderId || '' },
  { key: 'rating', header: 'Rating' },
  { key: 'title', header: 'Review Title' },
  { key: 'comment', header: 'Comment' },
  { key: 'isVerifiedPurchase', header: 'Verified Purchase', transform: (val) => val ? 'Yes' : 'No' },
  { key: 'helpfulCount', header: 'Helpful Votes' },
  { key: 'status', header: 'Status' },
  { key: 'adminResponse', header: 'Admin Response' },
  { key: 'createdAt', header: 'Date', transform: (val) => val ? new Date(val).toLocaleString() : '' },
];

export const categoryColumns: ExportColumn[] = [
  { key: '_id', header: 'Category ID' },
  { key: 'name', header: 'Category Name' },
  { key: 'slug', header: 'Slug' },
  { key: 'description', header: 'Description' },
  { key: 'parent', header: 'Parent Category', transform: (_, row) => row.parent?.name || '' },
  { key: 'image', header: 'Image URL' },
  { key: 'icon', header: 'Icon' },
  { key: 'order', header: 'Display Order' },
  { key: 'productCount', header: 'Products' },
  { key: 'isFeatured', header: 'Featured', transform: (val) => val ? 'Yes' : 'No' },
  { key: 'isActive', header: 'Status', transform: (val) => val ? 'Active' : 'Inactive' },
  { key: 'createdAt', header: 'Created Date', transform: (val) => val ? new Date(val).toLocaleString() : '' },
];

export const offerColumns: ExportColumn[] = [
  { key: '_id', header: 'Offer ID' },
  { key: 'title', header: 'Offer Title' },
  { key: 'description', header: 'Description' },
  { key: 'code', header: 'Code' },
  { key: 'discountType', header: 'Discount Type' },
  { key: 'discountValue', header: 'Discount Value' },
  { key: 'minOrderAmount', header: 'Min Order (SAR)' },
  { key: 'maxDiscountAmount', header: 'Max Discount (SAR)' },
  { key: 'usedCount', header: 'Times Used' },
  { key: 'maxUses', header: 'Max Uses' },
  { key: 'maxUsesPerUser', header: 'Max Uses Per User' },
  { key: 'applicableProducts', header: 'Applicable Products', transform: (val) => val?.length || 'All' },
  { key: 'applicableCategories', header: 'Applicable Categories', transform: (val) => val?.length || 'All' },
  { key: 'startDate', header: 'Start Date', transform: (val) => val ? new Date(val).toLocaleString() : '' },
  { key: 'endDate', header: 'End Date', transform: (val) => val ? new Date(val).toLocaleString() : '' },
  { key: 'isActive', header: 'Status', transform: (val) => val ? 'Active' : 'Inactive' },
  { key: 'createdAt', header: 'Created Date', transform: (val) => val ? new Date(val).toLocaleString() : '' },
];

export const bannerColumns: ExportColumn[] = [
  { key: '_id', header: 'Banner ID' },
  { key: 'title', header: 'Banner Title' },
  { key: 'subtitle', header: 'Subtitle' },
  { key: 'description', header: 'Description' },
  { key: 'image', header: 'Image URL' },
  { key: 'mobileImage', header: 'Mobile Image URL' },
  { key: 'link', header: 'Link' },
  { key: 'buttonText', header: 'Button Text' },
  { key: 'position', header: 'Position' },
  { key: 'order', header: 'Display Order' },
  { key: 'startDate', header: 'Start Date', transform: (val) => val ? new Date(val).toLocaleString() : '' },
  { key: 'endDate', header: 'End Date', transform: (val) => val ? new Date(val).toLocaleString() : '' },
  { key: 'isActive', header: 'Status', transform: (val) => val ? 'Active' : 'Inactive' },
  { key: 'createdAt', header: 'Created Date', transform: (val) => val ? new Date(val).toLocaleString() : '' },
];

export const blogColumns: ExportColumn[] = [
  { key: '_id', header: 'Post ID' },
  { key: 'title', header: 'Post Title' },
  { key: 'slug', header: 'Slug' },
  { key: 'excerpt', header: 'Excerpt' },
  { key: 'content', header: 'Content' },
  { key: 'author', header: 'Author', transform: (_, row) => row.author?.name || `${row.author?.firstName || ''} ${row.author?.lastName || ''}`.trim() || '' },
  { key: 'category', header: 'Category' },
  { key: 'tags', header: 'Tags', transform: (val) => val?.join('; ') || '' },
  { key: 'image', header: 'Featured Image' },
  { key: 'views', header: 'Views' },
  { key: 'likes', header: 'Likes' },
  { key: 'commentsCount', header: 'Comments' },
  { key: 'status', header: 'Status' },
  { key: 'publishedAt', header: 'Published Date', transform: (val) => val ? new Date(val).toLocaleString() : '' },
  { key: 'createdAt', header: 'Created Date', transform: (val) => val ? new Date(val).toLocaleString() : '' },
];

export const staffColumns: ExportColumn[] = [
  { key: '_id', header: 'Staff ID' },
  { key: 'firstName', header: 'First Name' },
  { key: 'lastName', header: 'Last Name' },
  { key: 'name', header: 'Full Name', transform: (_, row) => `${row.firstName || ''} ${row.lastName || ''}`.trim() },
  { key: 'email', header: 'Email' },
  { key: 'phone', header: 'Phone' },
  { key: 'role', header: 'Role' },
  { key: 'permissions', header: 'Permissions', transform: (val) => val ? Object.keys(val).join('; ') : '' },
  { key: 'isActive', header: 'Status', transform: (val) => val ? 'Active' : 'Inactive' },
  { key: 'lastLogin', header: 'Last Login', transform: (val) => val ? new Date(val).toLocaleString() : 'Never' },
  { key: 'createdAt', header: 'Created Date', transform: (val) => val ? new Date(val).toLocaleString() : '' },
];

export const testimonialColumns: ExportColumn[] = [
  { key: '_id', header: 'Testimonial ID' },
  { key: 'customerName', header: 'Customer Name' },
  { key: 'customerEmail', header: 'Email' },
  { key: 'customerAvatar', header: 'Avatar URL' },
  { key: 'rating', header: 'Rating' },
  { key: 'title', header: 'Title' },
  { key: 'content', header: 'Content' },
  { key: 'status', header: 'Status' },
  { key: 'isFeatured', header: 'Featured', transform: (val) => val ? 'Yes' : 'No' },
  { key: 'order', header: 'Display Order' },
  { key: 'moderatedBy', header: 'Moderated By', transform: (_, row) => row.moderatedBy?.name || row.moderatedBy?.email || '' },
  { key: 'moderatedAt', header: 'Moderated Date', transform: (val) => val ? new Date(val).toLocaleString() : '' },
  { key: 'createdAt', header: 'Submitted Date', transform: (val) => val ? new Date(val).toLocaleString() : '' },
];

export const referralColumns: ExportColumn[] = [
  { key: '_id', header: 'Referral ID' },
  { key: 'referrer', header: 'Referrer Name', transform: (_, row) => row.referrer?.name || `${row.referrer?.firstName || ''} ${row.referrer?.lastName || ''}`.trim() || '' },
  { key: 'referrerEmail', header: 'Referrer Email', transform: (_, row) => row.referrer?.email || '' },
  { key: 'referrerCode', header: 'Referral Code', transform: (_, row) => row.referrer?.referralCode || '' },
  { key: 'referred', header: 'Referred Name', transform: (_, row) => row.referred?.name || `${row.referred?.firstName || ''} ${row.referred?.lastName || ''}`.trim() || '' },
  { key: 'referredEmail', header: 'Referred Email', transform: (_, row) => row.referred?.email || '' },
  { key: 'status', header: 'Status' },
  { key: 'rewardAmount', header: 'Reward Amount (SAR)' },
  { key: 'rewardType', header: 'Reward Type' },
  { key: 'isRewardClaimed', header: 'Reward Claimed', transform: (val) => val ? 'Yes' : 'No' },
  { key: 'firstOrderId', header: 'First Order ID', transform: (_, row) => row.firstOrder?._id || '' },
  { key: 'firstOrderTotal', header: 'First Order Total (SAR)', transform: (_, row) => row.firstOrder?.total || '' },
  { key: 'createdAt', header: 'Referral Date', transform: (val) => val ? new Date(val).toLocaleString() : '' },
];

export const newsletterColumns: ExportColumn[] = [
  { key: '_id', header: 'Subscriber ID' },
  { key: 'email', header: 'Email' },
  { key: 'name', header: 'Name' },
  { key: 'isActive', header: 'Subscribed', transform: (val) => val ? 'Yes' : 'No' },
  { key: 'source', header: 'Source' },
  { key: 'subscribedAt', header: 'Subscribed Date', transform: (val) => val ? new Date(val).toLocaleString() : '' },
  { key: 'unsubscribedAt', header: 'Unsubscribed Date', transform: (val) => val ? new Date(val).toLocaleString() : '' },
];

export const contactColumns: ExportColumn[] = [
  { key: '_id', header: 'Message ID' },
  { key: 'name', header: 'Name' },
  { key: 'email', header: 'Email' },
  { key: 'phone', header: 'Phone' },
  { key: 'subject', header: 'Subject' },
  { key: 'message', header: 'Message' },
  { key: 'status', header: 'Status' },
  { key: 'assignedTo', header: 'Assigned To', transform: (_, row) => row.assignedTo?.name || row.assignedTo?.email || '' },
  { key: 'response', header: 'Response' },
  { key: 'respondedAt', header: 'Responded Date', transform: (val) => val ? new Date(val).toLocaleString() : '' },
  { key: 'createdAt', header: 'Received Date', transform: (val) => val ? new Date(val).toLocaleString() : '' },
];
