# PRIMO Mobile Development Handoff

## Brand Guidelines

### Colors

#### Primary (Gold/Beige)
| Name | Hex | Usage |
|------|-----|-------|
| Primary 50 | #faf5f0 | Light backgrounds |
| Primary 100 | #f5ebe0 | Hover states |
| Primary 200 | #ead6c1 | Borders |
| Primary 500 | #b8935f | Primary actions |
| Primary 600 | #a67c4e | Primary buttons |
| Primary 700 | #8a6642 | Active states |

#### Neutral (Dark)
| Name | Hex | Usage |
|------|-----|-------|
| Dark 50 | #f6f6f6 | Background |
| Dark 400 | #888888 | Secondary text |
| Dark 600 | #5d5d5d | Body text |
| Dark 900 | #3d3d3d | Headings |
| Dark 950 | #1a1a1a | Primary text |

#### Beige (Background)
| Name | Hex | Usage |
|------|-----|-------|
| Beige 50 | #fdfcfa | Main background |
| Beige 100 | #faf8f5 | Card background |
| Beige 200 | #f5f1eb | Dividers |
| Beige 300 | #efe9e0 | Borders |

#### Status Colors
| Name | Hex | Usage |
|------|-----|-------|
| Success | #22c55e | Success states |
| Warning | #f59e0b | Warning states |
| Error | #ef4444 | Error states |
| Info | #3b82f6 | Info states |

### Typography

#### Font Families
- **Primary**: Inter (Sans-serif) - Body text
- **Display**: Playfair Display (Serif) - Headings

#### Font Sizes
| Name | Size | Line Height | Usage |
|------|------|-------------|-------|
| xs | 12px | 16px | Captions |
| sm | 13px | 20px | Small text |
| base | 14px | 24px | Body text |
| lg | 16px | 28px | Large body |
| xl | 18px | 28px | Small headings |
| 2xl | 20px | 32px | Section titles |
| 3xl | 24px | 32px | Page titles |
| 4xl | 30px | 36px | Large titles |

### Spacing Scale
| Name | Value | Usage |
|------|-------|-------|
| 0 | 0px | - |
| 1 | 4px | Minimal spacing |
| 2 | 8px | Compact spacing |
| 3 | 12px | Standard gap |
| 4 | 16px | Section padding |
| 5 | 20px | Card padding |
| 6 | 24px | Large padding |
| 8 | 32px | Section spacing |
| 10 | 40px | Page margins |
| 12 | 48px | Large sections |

### Border Radius
| Name | Value | Usage |
|------|-------|-------|
| sm | 4px | Small elements |
| md | 6px | Inputs |
| lg | 8px | Buttons |
| xl | 12px | Cards |
| 2xl | 16px | Large cards |
| full | 9999px | Pills, avatars |

---

## UI Components

### Buttons

#### Variants
1. **Primary** - Gold background, white text
2. **Secondary** - White background, dark text, border
3. **Ghost** - Transparent, dark text
4. **Outline** - Transparent, gold border and text
5. **Danger** - Red background, white text

#### Sizes
- **sm**: 32px height, 12px padding
- **md**: 40px height, 16px padding
- **lg**: 48px height, 24px padding

### Cards
- Background: White
- Border: 1px beige-200
- Border radius: 12px
- Shadow: soft (0 2px 15px rgba(0,0,0,0.07))
- Padding: 16-24px

### Product Card
```
┌─────────────────────────┐
│  [Image - aspect 1:1]   │
│  ┌─ Discount badge      │
│  └─ Wishlist button ─┐  │
├─────────────────────────┤
│ Brand                   │
│ Product Title           │
│ ★★★★☆ (4.5) 120 reviews │
│ EGP 2,500 ̶E̶G̶P̶ ̶3̶,̶0̶0̶0̶    │
└─────────────────────────┘
```

### Input Fields
- Height: 44px (mobile), 40px (desktop)
- Border: 1px beige-300
- Border radius: 8px
- Focus: Primary-500 border + ring

### Badges
- Padding: 4px 10px
- Border radius: Full
- Font size: 12px
- Variants: default, primary, success, warning, error

---

## Screen List

### User App

#### Authentication
1. **Login** - Email/password, Google OAuth, remember me
2. **Register** - Name, email, phone, password, terms acceptance
3. **Forgot Password** - Email input for reset link
4. **Reset Password** - New password input

#### Home
5. **Home** - Hero, features, categories, featured products, deals, newsletter

#### Products
6. **Products List** - Filters, sort, grid/list view, pagination
7. **Product Detail** - Gallery, info, specs, reviews, FAQ, related
8. **Compare** - Side-by-side product comparison (up to 4)
9. **Search Results** - Search bar, results, filters

#### Shopping
10. **Cart** - Items, quantity, discount code, totals
11. **Checkout** - Contact, address, payment, order summary
12. **Order Confirmation** - Success message, order details

#### User Account
13. **Account Dashboard** - Overview, recent orders
14. **Orders** - Order list with status filters
15. **Order Detail** - Items, status timeline, receipt
16. **Addresses** - Address book management
17. **Wishlist** - Saved products grid
18. **Profile Settings** - Name, email, phone, password

#### Content Pages
19. **Categories** - All categories grid
20. **Category Detail** - Products in category
21. **Deals** - Active promotions
22. **Blog List** - Articles grid
23. **Blog Post** - Article content
24. **Contact** - Form, contact info, map
25. **About** - Company info
26. **FAQ** - Accordion questions
27. **Policies** - Privacy, terms, returns, shipping

### Admin App

#### Dashboard
1. **Dashboard** - Stats, charts, recent orders, top products

#### Orders
2. **Orders List** - Table with filters, status badges
3. **Order Detail** - Full order info, status management

#### Products
4. **Products List** - Table with search, filters
5. **Product Create/Edit** - Form with images, specs, FAQ

#### Categories
6. **Categories List** - Hierarchical view
7. **Category Create/Edit** - Form with parent selection

#### Customers
8. **Customers List** - Table with search
9. **Customer Detail** - Profile, orders, activity

#### Reviews
10. **Reviews Moderation** - Pending reviews queue

#### Marketing
11. **Offers List** - Active/scheduled offers
12. **Offer Create/Edit** - Discount rules form
13. **Banners List** - Position-based banners
14. **Banner Create/Edit** - Image upload, scheduling

#### Blog
15. **Posts List** - Draft/published posts
16. **Post Create/Edit** - Rich text editor

#### Settings (Super Admin)
17. **Staff List** - Admin users
18. **Staff Create/Edit** - Permissions management
19. **Analytics** - Revenue charts, metrics
20. **Site Settings** - CMS content, policies

---

## Navigation Map

### User App
```
├── Home
├── Products
│   ├── Category
│   ├── Product Detail
│   ├── Compare
│   └── Search
├── Cart
│   └── Checkout
├── Account
│   ├── Dashboard
│   ├── Orders
│   │   └── Order Detail
│   ├── Addresses
│   ├── Wishlist
│   └── Settings
├── Content
│   ├── About
│   ├── Contact
│   ├── Blog
│   ├── FAQ
│   └── Policies
└── Auth
    ├── Login
    ├── Register
    └── Forgot Password
```

### Admin App
```
├── Dashboard
├── Orders
│   └── Order Detail
├── Products
│   └── Create/Edit
├── Categories
│   └── Create/Edit
├── Customers
│   └── Detail
├── Reviews
├── Marketing
│   ├── Offers
│   ├── Banners
│   └── Blog
└── Settings (Super Admin)
    ├── Staff
    ├── Analytics
    └── Site Settings
```

---

## API Endpoints Summary

### Auth
- `POST /auth/register` - Register user
- `POST /auth/login` - Login
- `POST /auth/logout` - Logout
- `POST /auth/refresh` - Refresh token
- `GET /auth/me` - Get current user

### Products
- `GET /products` - List with filters
- `GET /products/:slug` - Get by slug
- `GET /products/featured` - Featured list
- `GET /products/brands` - All brands
- `GET /products/compare` - Compare products

### Categories
- `GET /categories` - All categories
- `GET /categories/:slug` - Category detail
- `GET /categories/tree` - Hierarchical tree

### Cart
- `GET /cart` - Get cart
- `POST /cart/items` - Add item
- `PATCH /cart/items/:id` - Update quantity
- `DELETE /cart/items/:id` - Remove item
- `POST /cart/discount` - Apply discount

### Orders
- `GET /orders` - User orders
- `POST /orders` - Create order
- `GET /orders/:id` - Order detail

### User
- `GET /users/profile` - Get profile
- `PATCH /users/profile` - Update profile
- `GET /users/addresses` - Get addresses
- `POST /users/addresses` - Add address
- `GET /users/wishlist` - Get wishlist
- `POST /users/wishlist` - Add to wishlist

### Reviews
- `GET /reviews/product/:id` - Product reviews
- `POST /reviews` - Create review

### Notifications
- `GET /notifications` - List notifications
- `PATCH /notifications/:id/read` - Mark as read

---

## Data Models

### User
```typescript
{
  _id: ObjectId,
  email: string,
  password: string (hashed),
  name: string,
  phone?: string,
  avatar?: string,
  role: 'user' | 'admin' | 'super_admin',
  addresses: Address[],
  wishlist: ObjectId[],
  recentlyViewed: ObjectId[],
  isActive: boolean,
  isVerified: boolean,
  permissions?: Record<string, boolean>,
  createdAt: Date,
  updatedAt: Date
}
```

### Product
```typescript
{
  _id: ObjectId,
  title: string,
  slug: string,
  sku: string,
  brand?: string,
  description: string,
  shortDescription?: string,
  price: number,
  compareAtPrice?: number,
  discount?: number,
  stock: number,
  lowStockThreshold: number,
  images: { url: string, alt?: string }[],
  categories: ObjectId[],
  tags: string[],
  specs: { name: string, value: string }[],
  faqs: { question: string, answer: string }[],
  warranty?: string,
  deliveryNotes?: string,
  averageRating: number,
  reviewCount: number,
  soldCount: number,
  viewCount: number,
  isFeatured: boolean,
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Order
```typescript
{
  _id: ObjectId,
  orderNumber: string,
  customer: ObjectId,
  items: {
    product: ObjectId,
    title: string,
    price: number,
    quantity: number,
    discount?: number
  }[],
  shippingAddress: {
    fullName: string,
    phone: string,
    email: string,
    street: string,
    city: string,
    country: string,
    coordinates?: { lat: number, lng: number }
  },
  subtotal: number,
  shippingFee: number,
  discount: number,
  total: number,
  discountCode?: string,
  paymentMethod: 'cash_on_delivery' | 'card' | 'apple_pay',
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded',
  status: 'new' | 'accepted' | 'in_progress' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'failed',
  statusHistory: {
    status: string,
    changedBy: ObjectId,
    changedAt: Date,
    note?: string
  }[],
  notes?: string,
  createdAt: Date,
  updatedAt: Date
}
```

### Review
```typescript
{
  _id: ObjectId,
  product: ObjectId,
  order: ObjectId,
  author: ObjectId,
  rating: number (1-5),
  comment?: string,
  status: 'pending' | 'approved' | 'rejected',
  isVerified: boolean,
  helpfulCount: number,
  createdAt: Date,
  updatedAt: Date
}
```

### Notification
```typescript
{
  _id: ObjectId,
  user: ObjectId,
  type: 'order_new' | 'order_status' | 'review_new' | 'stock_low' | 'promo' | 'system',
  title: string,
  message: string,
  data?: any,
  isRead: boolean,
  createdAt: Date
}
```

### Offer
```typescript
{
  _id: ObjectId,
  code: string,
  name: string,
  type: 'percentage' | 'fixed' | 'buy_x_get_y' | 'bundle',
  value: number,
  minPurchase?: number,
  maxDiscount?: number,
  usageLimit?: number,
  usedCount: number,
  startDate: Date,
  endDate: Date,
  applicableCategories?: ObjectId[],
  applicableProducts?: ObjectId[],
  isActive: boolean,
  createdAt: Date
}
```

---

## Edge Cases & Validation Rules

### Authentication
- Password: min 6 characters
- Email: valid format, unique
- Token expiry: Access 15min, Refresh 7 days
- Max login attempts: 5 per 15 minutes

### Products
- Price: positive number
- Stock: non-negative integer
- Images: max 10 per product
- Title: max 200 characters
- Description: max 10000 characters

### Orders
- Min order: No minimum
- Max items: 50 per order
- Shipping free: Orders over EGP 2000
- Cancel window: Only 'new' status can cancel

### Reviews
- One review per product per order
- Rating: 1-5 integer
- Comment: max 2000 characters
- Edit window: 30 days

### Cart
- Max quantity per item: 10 (or stock)
- Session expiry: 7 days for guests
- Discount code: one per cart

---

## Status Flow

### Order Status
```
new → accepted → in_progress → out_for_delivery → delivered
  ↓       ↓           ↓               ↓
cancelled cancelled  cancelled      failed
```

### Review Status
```
pending → approved
    ↓
rejected
```

### Notification Triggers
| Event | Recipients | Type |
|-------|------------|------|
| New order | Admin, Super Admin | order_new |
| Status change | Customer | order_status |
| New review | Admin | review_new |
| Low stock | Admin, Super Admin | stock_low |
| Promotion | All users | promo |

---

## Notes for Mobile Development

1. **Offline Support**: Implement local storage for cart and wishlist
2. **Push Notifications**: Register device token with backend
3. **Deep Linking**: Support product and order deep links
4. **Image Optimization**: Use CDN URLs, implement caching
5. **Pagination**: Infinite scroll for product lists
6. **Pull to Refresh**: Implement on all list screens
7. **Error Handling**: Show user-friendly error messages
8. **Loading States**: Use skeleton screens, not spinners
9. **Haptic Feedback**: Add to button interactions
10. **Biometric Auth**: Support FaceID/TouchID for login
