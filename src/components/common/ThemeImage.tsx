import React, { useState } from 'react';

export type ThemeImageType = 'logo' | 'banner' | 'store' | 'product';

export interface ThemeImageProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  className?: string;
  fallbackType?: ThemeImageType;
  imgClassName?: string;
}

/**
 * Determines whether a URL should render as an inline SVG Theme Illustration.
 * This includes empty strings, 'local:' markers, or default unsplash placeholder URLs.
 */
export function isThemeIllustrationUrl(url?: string): boolean {
  if (!url || !url.trim()) return true;
  const clean = url.trim();
  if (clean.startsWith('local:')) return true;
  if (clean === 'default' || clean === 'placeholder') return true;

  // Unsplash defaults previously used in initialData
  const defaultUnsplashIDs = [
    'photo-1542838132',
    'photo-1523275335',
    'photo-1506744038',
    'photo-1516321318',
    'photo-1556742049',
    'photo-1507525428',
    'photo-1472851294',
    'photo-1506484381',
    'photo-1587593810',
    'photo-1558611848',
    'photo-1544716278',
    'photo-1598327105',
    'photo-1558981403',
    'photo-1581092160',
    'photo-1542291026',
    'photo-1522337360',
    'photo-1504328345',
    'photo-1558346490',
    'photo-1584269600',
  ];
  if (clean.includes('images.unsplash.com')) {
    return defaultUnsplashIDs.some((id) => clean.includes(id));
  }
  return false;
}

/**
 * 1. Product Default Illustration (Square 1:1)
 * Based on bag_check_icon_185337.png:
 * Bold shopping bag with rounded handle and centered checkmark (✓),
 * affected dynamically by the Marketplace Identity Colors.
 */
export const ProductDefaultIllustration: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 100 100"
    className={`w-full h-full select-none ${className || ''}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Square rounded background with subtle theme tint */}
    <rect width="100" height="100" rx="16" fill="var(--theme-primary)" fillOpacity="0.08" />

    {/* Inner subtle glow ring */}
    <circle cx="50" cy="50" r="38" fill="var(--theme-secondary)" fillOpacity="0.10" />

    {/* Shopping Bag Structure */}
    <g transform="translate(18, 12)">
      {/* Bag Handle */}
      <path
        d="M20 22 C20 10, 44 10, 44 22"
        stroke="var(--theme-primary)"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />

      {/* Bag Body - Square Rounded Box */}
      <rect
        x="6"
        y="22"
        width="52"
        height="50"
        rx="9"
        stroke="var(--theme-primary)"
        strokeWidth="6"
        fill="white"
      />

      {/* Accent Checkmark inside the Bag */}
      <path
        d="M21 47 L29 55 L43 38"
        stroke="var(--theme-accent, var(--theme-secondary))"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </g>
  </svg>
);

/**
 * 2. Store Default Illustration (Square 1:1)
 * Based on ecommerce_and_shopping_store_shop_food_icon_227795.png:
 * Storefront building with slanted awning, 5 scallops, door with transom on left,
 * display window on right, and solid base, affected by Marketplace Colors.
 */
export const StoreDefaultIllustration: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 100 100"
    className={`w-full h-full select-none ${className || ''}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Square rounded background with subtle theme tint */}
    <rect width="100" height="100" rx="16" fill="var(--theme-primary)" fillOpacity="0.08" />

    {/* Inner decorative circle */}
    <circle cx="50" cy="50" r="38" fill="var(--theme-secondary)" fillOpacity="0.10" />

    {/* Storefront Silhouette */}
    <g transform="translate(14, 15)">
      {/* Top Roof Awning / Toldo */}
      <path
        d="M10 18 L62 18 L68 28 L4 28 Z"
        stroke="var(--theme-primary)"
        strokeWidth="5"
        strokeLinejoin="round"
        fill="white"
      />

      {/* Scallops on the Awning edge */}
      <path
        d="M4 28 C6.5 33, 11 33, 13.5 28 C16 33, 20.5 33, 23 28 C25.5 33, 30 33, 32.5 28 C35 33, 39.5 33, 42 28 C44.5 33, 49 33, 51.5 28 C54 33, 58.5 33, 61 28 C63.5 33, 67 33, 68 28"
        stroke="var(--theme-secondary)"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />

      {/* Main Building Walls */}
      <path
        d="M10 28 V64 M62 28 V64"
        stroke="var(--theme-primary)"
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* Ground Base Bar */}
      <path
        d="M2 64 H70"
        stroke="var(--theme-primary)"
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* Left Door with Upper Transom & Knob */}
      <rect
        x="16"
        y="35"
        width="16"
        height="29"
        rx="2"
        stroke="var(--theme-primary)"
        strokeWidth="4"
        fill="white"
      />
      <line
        x1="16"
        y1="42"
        x2="32"
        y2="42"
        stroke="var(--theme-primary)"
        strokeWidth="3"
      />
      <circle cx="28" cy="52" r="1.5" fill="var(--theme-accent, var(--theme-secondary))" />

      {/* Right Display Window */}
      <rect
        x="38"
        y="38"
        width="20"
        height="16"
        rx="2"
        stroke="var(--theme-secondary)"
        strokeWidth="4"
        fill="white"
      />
    </g>
  </svg>
);

/**
 * 3. Marketplace Logo Illustration (Square 1:1)
 * Based on online_market_store_ecommerce_mobile_phone_icon_179545.png:
 * Smartphone device merged with an online store / awning at the bottom right.
 */
export const MarketplaceLogoIllustration: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 100 100"
    className={`w-full h-full select-none ${className || ''}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Square rounded background with subtle theme tint */}
    <rect width="100" height="100" rx="16" fill="var(--theme-primary)" fillOpacity="0.08" />

    {/* Inner subtle glow circle */}
    <circle cx="50" cy="50" r="40" fill="var(--theme-secondary)" fillOpacity="0.10" />

    {/* Smartphone Device Body */}
    <g transform="translate(10, 8)">
      {/* Phone Outline */}
      <rect
        x="10"
        y="8"
        width="46"
        height="68"
        rx="12"
        stroke="var(--theme-primary)"
        strokeWidth="6"
        fill="white"
      />

      {/* Top Speaker / Notch */}
      <path
        d="M26 14 H40"
        stroke="var(--theme-primary)"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Merged Storefront / Shop at Bottom Right */}
      <g transform="translate(32, 36)">
        {/* Store Awning with Scallops */}
        <path
          d="M6 10 H42"
          stroke="var(--theme-secondary)"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M6 10 C8 15, 12 15, 14 10 C16 15, 20 15, 22 10 C24 15, 28 15, 30 10 C32 15, 36 15, 38 10 C40 14, 42 13, 42 10"
          stroke="var(--theme-secondary)"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />

        {/* Store Base & Window */}
        <rect
          x="10"
          y="15"
          width="28"
          height="22"
          rx="4"
          stroke="var(--theme-accent, var(--theme-primary))"
          strokeWidth="5"
          fill="white"
        />
      </g>
    </g>
  </svg>
);

/**
 * Renders the Banner Illustration:
 * Stacked shipping and merchandise boxes on a pallet.
 */
export const BannerIllustration: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 800 400"
    className={`w-full h-full select-none ${className || ''}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid slice"
  >
    {/* Dynamic colored background gradient & decorative aura */}
    <rect width="800" height="400" fill="var(--theme-primary)" fillOpacity="0.07" />
    <circle cx="680" cy="120" r="160" fill="var(--theme-secondary)" fillOpacity="0.12" />
    <circle cx="150" cy="320" r="200" fill="var(--theme-primary)" fillOpacity="0.08" />

    {/* Decorative geometric stars / sparkles */}
    <path d="M720 80 L724 92 L736 96 L724 100 L720 112 L716 100 L704 96 L716 92 Z" fill="var(--theme-accent)" fillOpacity="0.6" />
    <path d="M520 60 L522 68 L530 70 L522 72 L520 80 L518 72 L510 70 L518 68 Z" fill="var(--theme-primary)" fillOpacity="0.5" />
    <circle cx="460" cy="110" r="6" fill="var(--theme-accent)" fillOpacity="0.7" />
    <circle cx="640" cy="320" r="8" fill="var(--theme-secondary)" fillOpacity="0.5" />

    {/* Wooden Pallet / Tarima Base at bottom */}
    <g transform="translate(360, 290)">
      <rect x="0" y="0" width="380" height="14" rx="4" fill="var(--theme-primary)" fillOpacity="0.35" />
      <rect x="25" y="14" width="35" height="16" rx="2" fill="var(--theme-primary)" fillOpacity="0.25" />
      <rect x="172" y="14" width="35" height="16" rx="2" fill="var(--theme-primary)" fillOpacity="0.25" />
      <rect x="320" y="14" width="35" height="16" rx="2" fill="var(--theme-primary)" fillOpacity="0.25" />
      <rect x="0" y="30" width="380" height="10" rx="3" fill="var(--theme-primary)" fillOpacity="0.35" />
    </g>

    {/* Left Bottom Box */}
    <g transform="translate(385, 175)">
      <rect x="0" y="0" width="135" height="115" rx="8" fill="var(--theme-secondary)" fillOpacity="0.85" />
      <rect x="0" y="0" width="135" height="25" rx="8" fill="var(--theme-secondary)" />
      <rect x="58" y="0" width="20" height="115" fill="var(--theme-primary)" fillOpacity="0.25" />
      <rect x="18" y="45" width="45" height="34" rx="3" fill="white" />
      <rect x="25" y="54" width="30" height="4" rx="1" fill="var(--theme-primary)" />
      <rect x="25" y="64" width="20" height="4" rx="1" fill="var(--theme-accent)" />
    </g>

    {/* Left Top Box */}
    <g transform="translate(395, 90)">
      <rect x="0" y="0" width="115" height="85" rx="8" fill="var(--theme-secondary)" />
      <rect x="0" y="0" width="115" height="20" rx="8" fill="var(--theme-secondary)" fillOpacity="0.8" />
      <rect x="48" y="0" width="18" height="85" fill="white" fillOpacity="0.2" />
      <path d="M30 45 L38 35 L46 45 M38 35 V60" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </g>

    {/* Right Bottom Large Box */}
    <g transform="translate(525, 145)">
      <rect x="0" y="0" width="190" height="145" rx="12" fill="var(--theme-primary)" />
      <rect x="0" y="0" width="190" height="30" rx="12" fill="var(--theme-primary)" fillOpacity="0.8" />
      <rect x="83" y="0" width="24" height="145" fill="var(--theme-accent)" />
      <rect x="22" y="55" width="50" height="55" rx="4" fill="white" />
      <rect x="30" y="66" width="34" height="6" rx="2" fill="var(--theme-primary)" />
      <rect x="30" y="78" width="24" height="4" rx="1" fill="var(--theme-secondary)" />
      <rect x="30" y="88" width="28" height="4" rx="1" fill="var(--theme-secondary)" />
      <circle cx="145" cy="80" r="18" fill="var(--theme-secondary)" />
      <path d="M138 80 L143 85 L153 75" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </g>

    {/* Right Top Medium Box */}
    <g transform="translate(545, 65)">
      <rect x="0" y="0" width="150" height="80" rx="10" fill="var(--theme-accent)" />
      <rect x="0" y="0" width="150" height="22" rx="10" fill="var(--theme-accent)" fillOpacity="0.85" />
      <rect x="66" y="0" width="18" height="80" fill="white" fillOpacity="0.25" />
      <rect x="20" y="30" width="38" height="28" rx="3" fill="white" fillOpacity="0.95" />
      <rect x="26" y="38" width="24" height="4" rx="1" fill="var(--theme-primary)" />
      <rect x="26" y="46" width="16" height="4" rx="1" fill="var(--theme-secondary)" />
    </g>

    {/* Front Center Box */}
    <g transform="translate(450, 195)">
      <rect x="0" y="0" width="130" height="95" rx="10" fill="var(--theme-primary)" fillOpacity="0.92" />
      <rect x="0" y="0" width="130" height="22" rx="10" fill="var(--theme-primary)" fillOpacity="0.75" />
      <rect x="56" y="0" width="18" height="95" fill="var(--theme-accent)" />
      <rect x="18" y="38" width="34" height="38" rx="4" fill="white" />
      <rect x="24" y="48" width="22" height="4" rx="1" fill="var(--theme-primary)" />
      <rect x="24" y="58" width="16" height="4" rx="1" fill="var(--theme-secondary)" />
    </g>
  </svg>
);

/**
 * Universal ThemeImage component.
 * Automatically renders the dynamic SVG illustration when:
 * - src is empty or undefined
 * - src starts with 'local:' or is 'default' / 'placeholder'
 * - src is a legacy Unsplash placeholder
 * - or when an external image URL fails to load
 */
export const ThemeImage: React.FC<ThemeImageProps> = ({
  src,
  alt = '',
  className = '',
  fallbackType = 'product',
  imgClassName = '',
  ...props
}) => {
  const [hasError, setHasError] = useState(false);

  const shouldRenderIllustration = hasError || isThemeIllustrationUrl(src);

  if (shouldRenderIllustration) {
    return (
      <div
        className={`relative flex items-center justify-center overflow-hidden ${className}`}
        {...props}
      >
        {fallbackType === 'logo' && <MarketplaceLogoIllustration className={imgClassName} />}
        {fallbackType === 'banner' && <BannerIllustration className={imgClassName} />}
        {fallbackType === 'store' && <StoreDefaultIllustration className={imgClassName} />}
        {fallbackType === 'product' && <ProductDefaultIllustration className={imgClassName} />}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`} {...props}>
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover ${imgClassName}`}
        onError={() => setHasError(true)}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

export default ThemeImage;
