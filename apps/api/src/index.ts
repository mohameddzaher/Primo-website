// ============================================
// PRIMO API - Main Entry Point
// ============================================

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import http from 'http';
import mongoose from 'mongoose';

import { config, validateConfig } from './config';
import { connectDatabase, disconnectDatabase } from './config/database';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Import routes
import authRoutes from './routes/auth.routes';
import productsRoutes from './routes/products.routes';
import categoriesRoutes from './routes/categories.routes';
import cartRoutes from './routes/cart.routes';
import ordersRoutes from './routes/orders.routes';
import reviewsRoutes from './routes/reviews.routes';
import usersRoutes from './routes/users.routes';
import adminRoutes from './routes/admin.routes';
import notificationsRoutes from './routes/notifications.routes';
import offersRoutes from './routes/offers.routes';
import bannersRoutes from './routes/banners.routes';
import cmsRoutes from './routes/cms.routes';
import blogRoutes from './routes/blog.routes';
import testimonialsRoutes from './routes/testimonials.routes';
import referralsRoutes from './routes/referrals.routes';
import brandsRoutes from './routes/brands.routes';
import loyaltyRoutes from './routes/loyalty.routes';
import settingsRoutes from './routes/settings.routes';
import inventoryRoutes from './routes/inventory.routes';
import accountingRoutes from './routes/accounting.routes';
import seoRoutes from './routes/seo.routes';

// Validate configuration
validateConfig();

// Create Express app
const app: Express = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: config.isDev ? false : undefined,
}));

// CORS configuration
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Compression
app.use(compression());

// Logging
if (config.isDev) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to API routes
app.use('/api', limiter);

// Stricter limiter for authentication endpoints to blunt credential-stuffing /
// brute-force attacks. Only FAILED attempts count (skipSuccessfulRequests), so
// legitimate users are never throttled by their own successful logins.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.isDev ? 100 : 20,
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again in a few minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});
const API_AUTH_PREFIX = `/api/${config.apiVersion}/auth`;
app.use(`${API_AUTH_PREFIX}/login`, authLimiter);
app.use(`${API_AUTH_PREFIX}/register`, authLimiter);
app.use(`${API_AUTH_PREFIX}/forgot-password`, authLimiter);
app.use(`${API_AUTH_PREFIX}/reset-password`, authLimiter);

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health / readiness endpoint — reports DB connectivity so load balancers and
// orchestrators (k8s, ECS) can route traffic only to healthy instances.
app.get('/health', (_req: Request, res: Response) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const dbState = mongoose.connection.readyState;
  const healthy = dbState === 1;
  res.status(healthy ? 200 : 503).json({
    success: healthy,
    status: healthy ? 'healthy' : 'degraded',
    db: states[dbState] || 'unknown',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: config.env,
  });
});

// API routes
const API_PREFIX = `/api/${config.apiVersion}`;

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/products`, productsRoutes);
app.use(`${API_PREFIX}/categories`, categoriesRoutes);
app.use(`${API_PREFIX}/cart`, cartRoutes);
app.use(`${API_PREFIX}/orders`, ordersRoutes);
app.use(`${API_PREFIX}/reviews`, reviewsRoutes);
app.use(`${API_PREFIX}/users`, usersRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);
app.use(`${API_PREFIX}/notifications`, notificationsRoutes);
app.use(`${API_PREFIX}/offers`, offersRoutes);
app.use(`${API_PREFIX}/banners`, bannersRoutes);
app.use(`${API_PREFIX}/cms`, cmsRoutes);
app.use(`${API_PREFIX}/blog`, blogRoutes);
app.use(`${API_PREFIX}/testimonials`, testimonialsRoutes);
app.use(`${API_PREFIX}/referrals`, referralsRoutes);
app.use(`${API_PREFIX}/brands`, brandsRoutes);
app.use(`${API_PREFIX}/loyalty`, loyaltyRoutes);
app.use(`${API_PREFIX}/settings`, settingsRoutes);
app.use(`${API_PREFIX}/admin/inventory`, inventoryRoutes);
app.use(`${API_PREFIX}/admin/accounting`, accountingRoutes);
app.use(`${API_PREFIX}/admin/seo`, seoRoutes);

// API info endpoint
app.get(`${API_PREFIX}`, (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'PRIMO API',
    version: config.apiVersion,
    environment: config.env,
    endpoints: {
      auth: `${API_PREFIX}/auth`,
      products: `${API_PREFIX}/products`,
      categories: `${API_PREFIX}/categories`,
      cart: `${API_PREFIX}/cart`,
      orders: `${API_PREFIX}/orders`,
      reviews: `${API_PREFIX}/reviews`,
      users: `${API_PREFIX}/users`,
      admin: `${API_PREFIX}/admin`,
      notifications: `${API_PREFIX}/notifications`,
      offers: `${API_PREFIX}/offers`,
      banners: `${API_PREFIX}/banners`,
      cms: `${API_PREFIX}/cms`,
      blog: `${API_PREFIX}/blog`,
      testimonials: `${API_PREFIX}/testimonials`,
      referrals: `${API_PREFIX}/referrals`,
      brands: `${API_PREFIX}/brands`,
    },
  });
});

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Database connection and server start
let server: http.Server;
const startServer = async (): Promise<void> => {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Start server
    server = app.listen(config.port, () => {
      console.log(`
╔═══════════════════════════════════════════════╗
║                                               ║
║   🚀 PRIMO API Server Started                 ║
║                                               ║
║   Environment: ${config.env.padEnd(27)}  ║
║   Port: ${String(config.port).padEnd(34)}  ║
║   API URL: http://localhost:${config.port}${API_PREFIX.padEnd(13)}  ║
║                                               ║
╚═══════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});

// Graceful shutdown: stop accepting new connections, let in-flight requests
// finish, close the DB, then exit. Critical for zero-downtime rolling deploys
// under load — abruptly exiting would drop requests mid-flight.
const gracefulShutdown = (signal: string): void => {
  console.log(`${signal} received. Shutting down gracefully...`);
  if (!server) {
    process.exit(0);
    return;
  }
  server.close(async () => {
    await disconnectDatabase();
    console.log('Closed out remaining connections. Exiting.');
    process.exit(0);
  });
  // Failsafe: force-exit if connections don't drain within 10s
  setTimeout(() => {
    console.error('Could not close connections in time, forcing shutdown.');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start the server
startServer();

export default app;
