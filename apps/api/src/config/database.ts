// ============================================
// PRIMO API - Database Configuration
// ============================================

import mongoose from 'mongoose';
import { config } from './index';

export const connectDatabase = async (): Promise<void> => {
  try {
    mongoose.set('strictQuery', true);

    const options: mongoose.ConnectOptions = {
      // Connection pool sized for high concurrency. Each app instance keeps up to
      // maxPoolSize sockets open to MongoDB; 10 is far too small under load and
      // causes request queueing. Tune via DB_POOL_SIZE env if needed.
      maxPoolSize: parseInt(process.env.DB_POOL_SIZE || '50', 10),
      minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE || '5', 10),
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4, // Force IPv4 — avoids slow IPv6 resolution attempts on some networks
    };

    await mongoose.connect(config.mongoUri, options);

    console.log('✅ MongoDB connected successfully');

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB disconnected');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
  }
};
