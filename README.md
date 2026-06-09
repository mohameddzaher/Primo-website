# PRIMO - Premium Home Appliances E-commerce Platform

A full-stack, production-ready e-commerce platform built with Next.js, Express.js, and MongoDB.

![PRIMO](https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800)

## Features

### Customer Features
- Product browsing with advanced filtering, sorting, and search
- Product comparison (up to 4 products)
- Shopping cart with discount codes
- Wishlist and recently viewed products
- Multi-step checkout with location detection
- Order tracking and history
- Product reviews and ratings
- Newsletter subscription

### Admin Features
- Comprehensive dashboard with analytics
- Order management with status workflow
- Product and category management (CRUD)
- Customer management
- Review moderation
- Offers and banners management
- Blog/CMS system
- Staff management (Super Admin only)

### Technical Features
- JWT authentication with refresh token rotation
- Role-based access control (User, Admin, Super Admin)
- Real-time notifications (in-app + Web Push ready)
- Three.js animated hero section
- Fully responsive (4K to mobile)
- SEO optimized with Next.js metadata
- Premium, minimal UI design

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: TanStack React Query
- **Forms**: React Hook Form + Zod
- **3D Graphics**: Three.js with React Three Fiber
- **Animations**: Framer Motion

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (Access + Refresh tokens)
- **Validation**: Zod
- **Email**: Nodemailer

### Shared
- **Monorepo**: npm workspaces
- **Types**: Shared TypeScript definitions
- **Schemas**: Shared Zod validation schemas

## Project Structure

```
primo-website/
├── apps/
│   ├── api/                    # Express.js backend
│   │   ├── src/
│   │   │   ├── config/        # Configuration
│   │   │   ├── controllers/   # Route controllers
│   │   │   ├── middleware/    # Express middleware
│   │   │   ├── models/        # Mongoose models
│   │   │   ├── routes/        # API routes
│   │   │   ├── services/      # Business logic
│   │   │   ├── utils/         # Utilities
│   │   │   └── scripts/       # Seed scripts
│   │   └── tests/             # API tests
│   │
│   └── web/                    # Next.js frontend
│       ├── app/               # Next.js app router pages
│       ├── components/        # React components
│       │   ├── ui/           # Base UI components
│       │   ├── layout/       # Layout components
│       │   ├── home/         # Home page sections
│       │   ├── product/      # Product components
│       │   └── admin/        # Admin components
│       ├── hooks/            # Custom React hooks
│       ├── lib/              # Utilities and config
│       └── styles/           # Global styles
│
├── packages/
│   └── shared/                # Shared code
│       ├── types/            # TypeScript types
│       ├── schemas/          # Zod schemas
│       └── utils/            # Shared utilities
│
└── docs/                      # Documentation
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+
- MongoDB Atlas account (or local MongoDB)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/primo-website.git
cd primo-website
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Copy the example env files:
```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Edit `apps/api/.env`:
```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/primo

# JWT
JWT_ACCESS_SECRET=your-access-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@primo.com

# Web Push (optional)
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

4. **Seed the database**
```bash
npm run seed
```

5. **Start development servers**
```bash
npm run dev
```

This starts both:
- API server: http://localhost:5000
- Web app: http://localhost:3000

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both API and web in development |
| `npm run dev:api` | Start API server only |
| `npm run dev:web` | Start web app only |
| `npm run build` | Build all packages for production |
| `npm run start` | Start production servers |
| `npm run seed` | Seed database with sample data |
| `npm run test` | Run all tests |
| `npm run lint` | Run ESLint |

## Demo Credentials

After running the seed script:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@primo.com | admin123 |
| Admin | staff@primo.com | staff123 |
| Customer | user@primo.com | user123 |

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login user |
| POST | `/api/v1/auth/logout` | Logout user |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/forgot-password` | Request password reset |
| POST | `/api/v1/auth/reset-password` | Reset password |
| GET | `/api/v1/auth/me` | Get current user |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/products` | List products (with filters) |
| GET | `/api/v1/products/:slug` | Get product by slug |
| GET | `/api/v1/products/featured` | Get featured products |
| GET | `/api/v1/products/brands` | Get all brands |
| GET | `/api/v1/products/compare` | Compare products |
| POST | `/api/v1/products` | Create product (Admin) |
| PATCH | `/api/v1/products/:id` | Update product (Admin) |
| DELETE | `/api/v1/products/:id` | Delete product (Admin) |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/orders` | List user orders |
| GET | `/api/v1/orders/:id` | Get order details |
| POST | `/api/v1/orders` | Create order |
| PATCH | `/api/v1/orders/:id/status` | Update status (Admin) |
| POST | `/api/v1/orders/:id/cancel` | Cancel order |

### Cart
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/cart` | Get cart |
| POST | `/api/v1/cart/items` | Add item to cart |
| PATCH | `/api/v1/cart/items/:id` | Update quantity |
| DELETE | `/api/v1/cart/items/:id` | Remove item |
| DELETE | `/api/v1/cart` | Clear cart |
| POST | `/api/v1/cart/discount` | Apply discount |

### Reviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/reviews/product/:id` | Get product reviews |
| POST | `/api/v1/reviews` | Create review |
| PATCH | `/api/v1/reviews/:id` | Update review |
| DELETE | `/api/v1/reviews/:id` | Delete review |
| PATCH | `/api/v1/reviews/:id/approve` | Approve review (Admin) |

See full API documentation in `/docs/API.md`

## Paymob Integration

The payment system is designed with Paymob integration placeholder. To integrate:

1. **Get Paymob credentials** from [Paymob Dashboard](https://accept.paymob.com/)

2. **Add to `.env`**:
```env
PAYMOB_API_KEY=your-api-key
PAYMOB_INTEGRATION_ID=your-integration-id
PAYMOB_IFRAME_ID=your-iframe-id
PAYMOB_HMAC_SECRET=your-hmac-secret
```

3. **Update payment service** at `apps/api/src/services/payment.service.ts`

4. **Handle webhooks** at `/api/v1/payments/webhook`

## Deployment

### Build for Production
```bash
npm run build
```

### Environment Variables for Production
Ensure all environment variables are set in your production environment.

### Recommended Platforms
- **Frontend**: Vercel, Netlify
- **Backend**: Railway, Render, DigitalOcean
- **Database**: MongoDB Atlas

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support, email support@primo.com or open an issue on GitHub.

---

Built with care for the premium e-commerce experience.
