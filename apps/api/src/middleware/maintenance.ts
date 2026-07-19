// ============================================
// PRIMO API - Maintenance Mode
// ============================================
// `maintenanceMode` existed in Settings and in the admin UI but was never
// enforced anywhere: switching it on changed nothing, so the store kept taking
// orders during a maintenance window.

import { Response, NextFunction } from 'express';
import { Settings } from '../models/Settings';
import { AuthRequest } from './auth';

/** Paths that must keep working while the store is closed. */
const ALWAYS_ALLOWED = [
  '/auth', // admins need to sign in to turn it back off
  '/settings', // the storefront reads the maintenance message from here
  '/admin', // the whole admin panel
];

/**
 * Blocks storefront traffic with 503 while maintenance mode is on.
 *
 * Deliberately NOT a blanket block:
 *  - staff/admins keep full access, otherwise enabling it would lock the owner
 *    out of the switch that disables it
 *  - auth and settings stay open so the storefront can render the notice
 *  - read-only GETs still succeed; only state-changing requests are refused,
 *    so customers can browse but cannot order mid-migration
 */
export async function maintenanceMode(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Never block a preflight — the browser would surface a CORS error instead
  // of the 503 we actually want the client to see.
  if (req.method === 'OPTIONS') return next();

  const path = req.path || '';
  if (ALWAYS_ALLOWED.some((prefix) => path.startsWith(prefix))) return next();

  // Reads are harmless during maintenance; writes are what must stop.
  if (req.method === 'GET' || req.method === 'HEAD') return next();

  let settings: any;
  try {
    settings = await (Settings as any).getSettings();
  } catch {
    // If settings can't be read, fail open — a maintenance flag we cannot
    // confirm must not take the store down by itself.
    return next();
  }

  if (!settings?.maintenanceMode) return next();

  // Staff keep working through the window.
  const role = req.user?.role;
  if (role && ['admin', 'super_admin', 'staff'].includes(role)) return next();

  res.status(503).json({
    success: false,
    error:
      settings.maintenanceMessage ||
      'The store is temporarily unavailable for maintenance. Please try again shortly.',
    maintenance: true,
  });
}
