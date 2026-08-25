// Utility to generate dynamic square SVG data URLs for default images
// Colors adapt dynamically based on marketplace configuration (primaryColor & secondaryColor)

export function createProductSvgDataUrl(primaryColor = '#4f46e5', secondaryColor = '#0284c7', accentColor = '#f59e0b'): string {
  const pColor = primaryColor || '#4f46e5';
  const sColor = secondaryColor || '#0284c7';
  const aColor = accentColor || sColor;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="16" fill="${pColor}" fill-opacity="0.08"/>
  <circle cx="50" cy="50" r="38" fill="${sColor}" fill-opacity="0.10"/>
  <g transform="translate(18, 12)">
    <path d="M20 22 C20 10, 44 10, 44 22" stroke="${pColor}" stroke-width="6" stroke-linecap="round" fill="none"/>
    <rect x="6" y="22" width="52" height="50" rx="9" stroke="${pColor}" stroke-width="6" fill="#ffffff"/>
    <path d="M21 47 L29 55 L43 38" stroke="${aColor}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </g>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function createStoreSvgDataUrl(primaryColor = '#4f46e5', secondaryColor = '#0284c7', accentColor = '#f59e0b'): string {
  const pColor = primaryColor || '#4f46e5';
  const sColor = secondaryColor || '#0284c7';
  const aColor = accentColor || sColor;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="16" fill="${pColor}" fill-opacity="0.08"/>
  <circle cx="50" cy="50" r="38" fill="${sColor}" fill-opacity="0.10"/>
  <g transform="translate(14, 15)">
    <path d="M10 18 L62 18 L68 28 L4 28 Z" stroke="${pColor}" stroke-width="5" stroke-linejoin="round" fill="#ffffff"/>
    <path d="M4 28 C6.5 33, 11 33, 13.5 28 C16 33, 20.5 33, 23 28 C25.5 33, 30 33, 32.5 28 C35 33, 39.5 33, 42 28 C44.5 33, 49 33, 51.5 28 C54 33, 58.5 33, 61 28 C63.5 33, 67 33, 68 28" stroke="${sColor}" stroke-width="4" stroke-linecap="round" fill="none"/>
    <path d="M10 28 V64 M62 28 V64" stroke="${pColor}" stroke-width="5" stroke-linecap="round"/>
    <path d="M2 64 H70" stroke="${pColor}" stroke-width="6" stroke-linecap="round"/>
    <rect x="16" y="35" width="16" height="29" rx="2" stroke="${pColor}" stroke-width="4" fill="#ffffff"/>
    <line x1="16" y1="42" x2="32" y2="42" stroke="${pColor}" stroke-width="3"/>
    <circle cx="28" cy="52" r="1.5" fill="${aColor}"/>
    <rect x="38" y="38" width="20" height="16" rx="2" stroke="${sColor}" stroke-width="4" fill="#ffffff"/>
  </g>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function createMarketplaceLogoSvgDataUrl(primaryColor = '#4f46e5', secondaryColor = '#0284c7', accentColor = '#f59e0b'): string {
  const pColor = primaryColor || '#4f46e5';
  const sColor = secondaryColor || '#0284c7';
  const aColor = accentColor || pColor;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="16" fill="${pColor}" fill-opacity="0.08"/>
  <circle cx="50" cy="50" r="40" fill="${sColor}" fill-opacity="0.10"/>
  <g transform="translate(10, 8)">
    <rect x="10" y="8" width="46" height="68" rx="12" stroke="${pColor}" stroke-width="6" fill="#ffffff"/>
    <path d="M26 14 H40" stroke="${pColor}" stroke-width="4" stroke-linecap="round"/>
    <g transform="translate(32, 36)">
      <path d="M6 10 H42" stroke="${sColor}" stroke-width="5" stroke-linecap="round"/>
      <path d="M6 10 C8 15, 12 15, 14 10 C16 15, 20 15, 22 10 C24 15, 28 15, 30 10 C32 15, 36 15, 38 10 C40 14, 42 13, 42 10" stroke="${sColor}" stroke-width="4" stroke-linecap="round" fill="none"/>
      <rect x="10" y="15" width="28" height="22" rx="4" stroke="${aColor}" stroke-width="5" fill="#ffffff"/>
    </g>
  </g>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function resolveImageUrl(
  url: string | undefined | null,
  type: 'product' | 'store' | 'logo',
  primaryColor = '#4f46e5',
  secondaryColor = '#0284c7',
  accentColor = '#f59e0b'
): string {
  if (!url || url === 'local:product' || url === 'placeholder' || url === 'default') {
    if (type === 'product') return createProductSvgDataUrl(primaryColor, secondaryColor, accentColor);
    if (type === 'store') return createStoreSvgDataUrl(primaryColor, secondaryColor, accentColor);
    if (type === 'logo') return createMarketplaceLogoSvgDataUrl(primaryColor, secondaryColor, accentColor);
  }
  if (url === 'local:store') {
    return createStoreSvgDataUrl(primaryColor, secondaryColor, accentColor);
  }
  if (url === 'local:logo') {
    return createMarketplaceLogoSvgDataUrl(primaryColor, secondaryColor, accentColor);
  }
  return url;
}
