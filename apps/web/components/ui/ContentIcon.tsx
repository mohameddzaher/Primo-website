'use client';

import type { IconType } from 'react-icons';
import {
  HiOutlineBadgeCheck,
  HiOutlineCash,
  HiOutlineTruck,
  HiOutlineShieldCheck,
  HiOutlineRefresh,
  HiOutlineChatAlt2,
  HiOutlineSearch,
  HiOutlineShoppingCart,
  HiOutlineClipboardCheck,
  HiOutlineCube,
  HiOutlineCreditCard,
  HiOutlineClock,
  HiOutlineLightningBolt,
  HiOutlineSparkles,
  HiOutlineStar,
  HiOutlineGift,
  HiOutlinePhone,
  HiOutlineLockClosed,
  HiOutlineHeart,
  HiOutlineTag,
} from 'react-icons/hi';

/**
 * Named icons available to admin-editable content.
 *
 * CMS entries used to store a literal emoji, which renders at the mercy of the
 * viewer's OS font and looks like a chat message rather than a storefront. These
 * are real vector icons that inherit currentColor and stay crisp at any size.
 */
export const CONTENT_ICONS: Record<string, IconType> = {
  'badge-check': HiOutlineBadgeCheck,
  cash: HiOutlineCash,
  truck: HiOutlineTruck,
  shield: HiOutlineShieldCheck,
  refresh: HiOutlineRefresh,
  chat: HiOutlineChatAlt2,
  search: HiOutlineSearch,
  cart: HiOutlineShoppingCart,
  clipboard: HiOutlineClipboardCheck,
  cube: HiOutlineCube,
  card: HiOutlineCreditCard,
  clock: HiOutlineClock,
  bolt: HiOutlineLightningBolt,
  sparkles: HiOutlineSparkles,
  star: HiOutlineStar,
  gift: HiOutlineGift,
  phone: HiOutlinePhone,
  lock: HiOutlineLockClosed,
  heart: HiOutlineHeart,
  tag: HiOutlineTag,
};

export type ContentIconName = keyof typeof CONTENT_ICONS;

/**
 * Back-compat: existing CMS documents (and any content an admin saved before
 * the icon picker existed) store emoji. Map the ones we shipped to their proper
 * icon so old content upgrades itself instead of rendering a stray glyph.
 */
const EMOJI_ALIASES: Record<string, ContentIconName> = {
  '✅': 'badge-check',
  '☑️': 'badge-check',
  '💰': 'cash',
  '💵': 'cash',
  '🚀': 'truck',
  '🚚': 'truck',
  '🛡️': 'shield',
  '🛡': 'shield',
  '↩️': 'refresh',
  '🔄': 'refresh',
  '💬': 'chat',
  '🔍': 'search',
  '🛒': 'cart',
  '📦': 'cube',
  '💳': 'card',
  '⏰': 'clock',
  '⚡': 'bolt',
  '✨': 'sparkles',
  '⭐': 'star',
  '🎁': 'gift',
  '📞': 'phone',
  '🔒': 'lock',
  '❤️': 'heart',
  '🏷️': 'tag',
};

export function resolveContentIcon(name?: string): IconType | null {
  if (!name) return null;
  const key = name.trim();
  if (CONTENT_ICONS[key]) return CONTENT_ICONS[key];
  const aliased = EMOJI_ALIASES[key];
  return aliased ? CONTENT_ICONS[aliased] : null;
}

interface ContentIconProps {
  /** An icon key ('truck') or a legacy emoji ('🚚'). */
  name?: string;
  size?: number;
  className?: string;
  /** Rendered when the name matches nothing known. */
  fallback?: IconType;
}

export function ContentIcon({
  name,
  size = 24,
  className,
  fallback = HiOutlineSparkles,
}: ContentIconProps) {
  const Icon = resolveContentIcon(name) || fallback;
  return <Icon size={size} className={className} aria-hidden />;
}

export default ContentIcon;
