'use client';

import { CONTENT_ICONS, ContentIcon } from '@/components/ui';

interface IconSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/**
 * Icon picker for admin-editable content.
 *
 * These fields used to be free-text, so they filled up with emoji — which
 * render differently on every OS and make a storefront look like a chat app.
 * Constraining the field to the shipped icon set means content added from the
 * admin panel is professional by construction rather than by convention.
 * Legacy emoji values still resolve (ContentIcon maps them), so existing
 * entries keep rendering until they're re-saved.
 */
export function IconSelect({ value, onChange, className = '' }: IconSelectProps) {
  const names = Object.keys(CONTENT_ICONS);
  const isLegacy = value && !names.includes(value);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
        <ContentIcon name={value} size={20} />
      </span>
      <select
        aria-label="Icon"
        value={isLegacy ? '' : value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 border border-beige-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      >
        {isLegacy && <option value="">{`(legacy: ${value})`}</option>}
        {names.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default IconSelect;
