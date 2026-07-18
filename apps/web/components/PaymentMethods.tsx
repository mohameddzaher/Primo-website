'use client';

/**
 * Accepted payment methods strip for the Saudi market.
 *
 * All marks are rendered as inline SVG / styled chips on purpose:
 * no external image URLs (they are blocked) and no extra dependencies.
 * These are brand renditions for display only.
 */

type Size = 'sm' | 'md';

const chipSize: Record<Size, string> = {
  sm: 'h-6 w-11',
  md: 'h-8 w-14',
};

function Chip({
  size,
  label,
  children,
}: {
  size: Size;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <span
      title={label}
      aria-label={label}
      role="img"
      className={`${chipSize[size]} inline-flex items-center justify-center rounded-md bg-white ring-1 ring-black/10 shadow-sm px-1`}
    >
      {children}
    </span>
  );
}

/** mada — Saudi Arabia's national debit network */
function MadaMark() {
  return (
    <svg viewBox="0 0 44 20" className="h-full w-full" focusable="false">
      <text
        x="22"
        y="12"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="10"
        fontWeight="700"
        letterSpacing="-0.3"
        fill="#1B3B6F"
      >
        mada
      </text>
      <path
        d="M9 16 Q22 20 35 16"
        fill="none"
        stroke="#84BD00"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M9 16 Q15.5 18 22 18.6"
        fill="none"
        stroke="#0089CF"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function VisaMark() {
  return (
    <svg viewBox="0 0 44 20" className="h-full w-full" focusable="false">
      <text
        x="22"
        y="13"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="11"
        fontWeight="700"
        fontStyle="italic"
        letterSpacing="0.5"
        fill="#1A1F71"
      >
        VISA
      </text>
      <path d="M8 16h28" stroke="#F7B600" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function MastercardMark() {
  return (
    <svg viewBox="0 0 44 20" className="h-full w-full" focusable="false">
      <circle cx="18" cy="10" r="7" fill="#EB001B" />
      <circle cx="26" cy="10" r="7" fill="#F79E1B" />
      <path
        d="M22 4.6a7 7 0 0 0 0 10.8 7 7 0 0 0 0-10.8z"
        fill="#FF5F00"
      />
    </svg>
  );
}

function ApplePayMark() {
  return (
    <svg viewBox="0 0 44 20" className="h-full w-full" focusable="false">
      {/* Simplified Apple glyph */}
      <g fill="#000" transform="translate(7 4.2) scale(0.42)">
        <path d="M14.7 6.1c.9-1.1 1.5-2.6 1.3-4.1-1.3.05-2.9.9-3.8 2-.8 1-1.6 2.5-1.4 4 1.5.1 3-.8 3.9-1.9z" />
        <path d="M16 8.4c-2.1-.1-3.9 1.2-4.9 1.2-1 0-2.5-1.1-4.2-1.1C4.7 8.6 2.6 9.9 1.5 12c-2.3 4-.6 9.9 1.6 13.1 1.1 1.6 2.4 3.4 4.1 3.3 1.6-.1 2.2-1.1 4.2-1.1 2 0 2.5 1.1 4.2 1 1.7 0 2.8-1.6 3.9-3.2 1.2-1.8 1.7-3.6 1.7-3.7-.04-.02-3.3-1.3-3.4-5.1 0-3.2 2.6-4.7 2.7-4.8-1.5-2.2-3.8-2.4-4.5-2.5z" />
      </g>
      <text
        x="31"
        y="13.5"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="9"
        fontWeight="600"
        fill="#000"
      >
        Pay
      </text>
    </svg>
  );
}

function CodMark() {
  return (
    <svg viewBox="0 0 44 20" className="h-full w-full" focusable="false">
      <rect
        x="6"
        y="4.5"
        width="32"
        height="11"
        rx="2"
        fill="none"
        stroke="#3F3F46"
        strokeWidth="1.3"
      />
      <circle cx="22" cy="10" r="2.6" fill="none" stroke="#3F3F46" strokeWidth="1.3" />
      <path d="M9.5 10h2M32.5 10h2" stroke="#3F3F46" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export interface PaymentMethodsProps {
  /** Show the Cash on Delivery chip (usually driven by settings.enableCOD) */
  includeCOD?: boolean;
  /** Leading label, e.g. "We accept:". Pass null to hide. */
  label?: string | null;
  /** Tailwind classes for the label — lets it sit on dark or light backgrounds */
  labelClassName?: string;
  size?: Size;
  className?: string;
}

export function PaymentMethods({
  includeCOD = true,
  label = 'We accept:',
  labelClassName = 'text-dark-500',
  size = 'sm',
  className = '',
}: PaymentMethodsProps) {
  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      {label && (
        <span className={`text-[10px] uppercase tracking-wide ${labelClassName}`}>
          {label}
        </span>
      )}
      <div className="flex items-center gap-1.5">
        <Chip size={size} label="mada">
          <MadaMark />
        </Chip>
        <Chip size={size} label="Visa">
          <VisaMark />
        </Chip>
        <Chip size={size} label="Mastercard">
          <MastercardMark />
        </Chip>
        <Chip size={size} label="Apple Pay">
          <ApplePayMark />
        </Chip>
        {includeCOD && (
          <Chip size={size} label="Cash on Delivery">
            <CodMark />
          </Chip>
        )}
      </div>
    </div>
  );
}

export default PaymentMethods;
