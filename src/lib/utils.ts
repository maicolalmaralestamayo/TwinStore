import { Product, Store } from '../types';

/**
 * Formats a number by grouping digits in groups of three separated by dots (e.g., 410, 134.480, 1.500.000)
 */
export function formatNumberWithDots(amount: number): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '0';
  const rounded = Math.round(amount);
  return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Format currency amount without duplicate symbols, using dot thousand-separators
 * Example: formatCurrency(410, 'USD') -> "410 USD"
 * Example: formatCurrency(134480, 'CUP') -> "134.480 CUP"
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return `${formatNumberWithDots(amount)} ${currency}`;
}

/**
 * Formats dual price pair cleanly without conjunction 'y': e.g. "410 USD  134.480 CUP"
 */
export function formatPricePair(priceUSD: number, cupPrice: number): string {
  return `${formatNumberWithDots(priceUSD)} USD  ${formatNumberWithDots(cupPrice)} CUP`;
}

/**
 * Extracts pure tag names for display from a product (without supertag group names)
 */
export function extractProductDisplayTags(product: Product): string[] {
  if (product.tagSelections && product.tagSelections.length > 0) {
    const names = product.tagSelections
      .map((ts) => ts.tagName || ts.value || '')
      .filter(Boolean);
    return Array.from(new Set(names));
  }
  if (product.tags && product.tags.length > 0) {
    return Array.from(new Set(product.tags.filter(Boolean)));
  }
  return [];
}

/**
 * Given a USD price and a store's exchange rate, return the CUP equivalent.
 * Las tasas de cambio siempre son números enteros.
 */
export function calculateCUP(priceUSD: number, rate: number): number {
  const integerRate = Math.round(rate || 330);
  return Math.round(priceUSD * integerRate);
}

/**
 * Gets all allowed exchange rates from the store for a specific product.
 */
export function getProductAllowedExchangeRates(
  product: Product,
  store: Store | undefined
): import('../types').StoreExchangeRate[] {
  if (!store || !store.exchangeRates || store.exchangeRates.length === 0) return [];
  const prodCurrency = (product.currency || 'USD').toUpperCase();
  const allowedIds = product.allowedExchangeRateIds;

  if (Array.isArray(allowedIds) && allowedIds.length > 0) {
    return store.exchangeRates.filter((r) => allowedIds.includes(r.id));
  }

  return store.exchangeRates.filter((r) => (r.fromCurrency || '').toUpperCase() === prodCurrency);
}

/**
 * Returns list of prices in all currencies allowed for this product (original + converted).
 */
export function getProductPricesInAllowedCurrencies(
  product: Product,
  store: Store | undefined
): { currency: string; amount: number; rate: number; isOriginal: boolean }[] {
  const origPrice = product.price !== undefined && product.price !== null ? product.price : (product.priceUSD || 0);
  const origCurrency = (product.currency || 'USD').toUpperCase();
  const results: { currency: string; amount: number; rate: number; isOriginal: boolean }[] = [
    {
      currency: origCurrency,
      amount: origPrice,
      rate: 1,
      isOriginal: true,
    },
  ];

  const allowedRates = getProductAllowedExchangeRates(product, store);
  for (const rateObj of allowedRates) {
    if ((rateObj.fromCurrency || '').toUpperCase() === origCurrency && rateObj.rate > 0) {
      const converted = Math.round(origPrice * rateObj.rate * 100) / 100;
      results.push({
        currency: (rateObj.toCurrency || '').toUpperCase(),
        amount: converted,
        rate: rateObj.rate,
        isOriginal: false,
      });
    }
  }
  return results;
}

/**
 * Retrieves the effective exchange rate between two currencies for a given store.
 */
export function getStoreExchangeRate(
  store: Store | undefined,
  fromCurr: string,
  toCurr: string
): number | undefined {
  if (!store || !fromCurr || !toCurr || fromCurr === toCurr) return 1;
  const rates = store.exchangeRates || [];
  const direct = rates.find((r) => r.fromCurrency === fromCurr && r.toCurrency === toCurr);
  if (direct && direct.rate > 0) return Math.round(direct.rate);
  const inverse = rates.find((r) => r.fromCurrency === toCurr && r.toCurrency === fromCurr);
  if (inverse && inverse.rate > 0) return 1 / Math.round(inverse.rate);

  // Fallback for USD <-> CUP legacy rate (siempre entero)
  if (fromCurr === 'USD' && toCurr === 'CUP' && store.usdToCupRate) {
    return Math.round(store.usdToCupRate);
  }
  if (fromCurr === 'CUP' && toCurr === 'USD' && store.usdToCupRate) {
    return 1 / Math.round(store.usdToCupRate);
  }
  return undefined;
}

/**
 * Calculates a product's price in a target currency according to the store's currency settings.
 * Las tasas de cambio siempre son números enteros.
 */
export function calculateProductPriceInCurrency(
  product: Product,
  store: Store | undefined,
  targetCurrency: string
): number {
  const origPrice = product.price !== undefined && product.price !== null ? product.price : (product.priceUSD || 0);
  const origCurrency = (product.currency || 'USD').toUpperCase();
  const target = (targetCurrency || 'USD').toUpperCase();

  if (!target || target === origCurrency) {
    return origPrice;
  }

  const allowedRates = getProductAllowedExchangeRates(product, store);
  const matchedRate = allowedRates.find(
    (r) => (r.fromCurrency || '').toUpperCase() === origCurrency && (r.toCurrency || '').toUpperCase() === target
  );
  if (matchedRate && matchedRate.rate > 0) {
    const integerRate = Math.round(matchedRate.rate);
    return Math.round(origPrice * integerRate * 100) / 100;
  }

  const rate = getStoreExchangeRate(store, origCurrency, target);
  if (rate !== undefined && rate > 0) {
    return Math.round(origPrice * rate * 100) / 100;
  }

  if (origCurrency === 'USD' && target === 'CUP') {
    return calculateCUP(origPrice, Math.round(store?.usdToCupRate || 330));
  }

  return origPrice;
}

/**
 * Normalize phone number for wa.me URL
 * Strips spaces, dashes, parentheses and ensures valid Cuban country code (53)
 */
export function normalizeWhatsAppPhone(rawPhone: string): string {
  if (!rawPhone) return '';
  let cleaned = rawPhone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  }
  // If it's an 8-digit Cuban mobile number starting with 5 (e.g. 52345678), add 53
  if (cleaned.length === 8 && (cleaned.startsWith('5') || cleaned.startsWith('6') || cleaned.startsWith('7'))) {
    cleaned = `53${cleaned}`;
  }
  return cleaned;
}

/**
 * Format phone number for human display (e.g. "+53 5234-5678")
 */
export function displayCubanPhone(phone: string): string {
  const norm = normalizeWhatsAppPhone(phone);
  if (norm.startsWith('53') && norm.length === 10) {
    const main = norm.substring(2);
    return `+53 ${main.substring(0, 4)} ${main.substring(4)}`;
  }
  return phone;
}

/**
 * Build the WhatsApp direct chat URL with pre-filled message
 */
export function generateWhatsAppOrderUrl(product: Product, store: Store): string {
  const phone = normalizeWhatsAppPhone(store.whatsappPhone || '');
  const text = `Estoy interesado en el producto ${product.title}.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

/**
 * Build a general WhatsApp inquiry URL for a store
 */
export function generateStoreWhatsAppUrl(store: Store): string {
  const phone = normalizeWhatsAppPhone(store.whatsappPhone || '');
  const text = `¡Hola! 👋 Les escribo desde el marketplace. Quisiera consultar su catálogo y ofertas disponibles en *${store.name}*.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

/**
 * Helper to download JSON file for backups
 */
export function downloadJsonFile(data: any, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Format normalized relational address into readable full Cuban address text
 */
export function formatNormalizedAddressText(store: Store): string {
  if (!store.address) return store.location || '';

  const {
    street,
    number,
    building,
    apartment,
    crossStreet1,
    crossStreet2,
    neighborhood,
    municipality,
    province,
  } = store.address;

  const parts: string[] = [];
  if (street && number) {
    parts.push(`${street} ${number}`);
  } else if (street) {
    parts.push(street);
  } else if (number) {
    parts.push(`No. ${number}`);
  }

  if (building) parts.push(building);
  if (apartment) parts.push(apartment);

  if (crossStreet1 && crossStreet2) {
    parts.push(`(Entre ${crossStreet1} y ${crossStreet2})`);
  } else if (crossStreet1) {
    parts.push(`(E/ ${crossStreet1})`);
  }

  if (neighborhood) parts.push(neighborhood);
  if (municipality) parts.push(municipality);
  if (province && province !== municipality) parts.push(province);

  const formatted = parts.join(', ');
  return formatted || store.location || '';
}

/**
 * Get Google Maps URL for a store
 */
export function getStoreGoogleMapsUrl(store: Store): string {
  if (store.address?.googleMapsUrl) {
    return store.address.googleMapsUrl;
  }
  const query = encodeURIComponent(formatNormalizedAddressText(store));
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

/**
 * Get store logo URL with fallback to global default or local SVG illustration
 */
export function getStoreLogoUrl(
  store: { logoUrl?: string },
  defaultStoreLogoUrl?: string
): string {
  if (store.logoUrl && store.logoUrl.trim().length > 0) {
    return store.logoUrl.trim();
  }
  if (defaultStoreLogoUrl && defaultStoreLogoUrl.trim().length > 0) {
    return defaultStoreLogoUrl.trim();
  }
  return 'local:store';
}

/**
 * Get product image URL with fallback to global default or local SVG illustration
 */
export function getProductImageUrl(
  product: { imageUrl?: string },
  defaultProductImageUrl?: string
): string {
  if (product.imageUrl && product.imageUrl.trim().length > 0) {
    return product.imageUrl.trim();
  }
  if (defaultProductImageUrl && defaultProductImageUrl.trim().length > 0) {
    return defaultProductImageUrl.trim();
  }
  return 'local:product';
}

/**
 * Download a CSV string as a file
 */
export function downloadCsvFile(csvContent: string, filename: string): void {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export Stores list to CSV
 */
export function exportStoresToCsv(stores: Store[]): void {
  const headers = ['id', 'name', 'slogan', 'description', 'whatsappPhone', 'location', 'usdToCupRate', 'deliveryAvailable', 'active'];
  const rows = stores.map((s) => [
    s.id,
    `"${(s.name || '').replace(/"/g, '""')}"`,
    `"${(s.slogan || '').replace(/"/g, '""')}"`,
    `"${(s.description || '').replace(/"/g, '""')}"`,
    `"${(s.whatsappPhone || '').replace(/"/g, '""')}"`,
    `"${(s.location || '').replace(/"/g, '""')}"`,
    s.usdToCupRate || 330,
    s.deliveryAvailable ? 'true' : 'false',
    s.active ? 'true' : 'false',
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadCsvFile(csv, `Tiendas_MercadoCuba_${new Date().toISOString().split('T')[0]}.csv`);
}

/**
 * Export Products list to CSV
 */
export function exportProductsToCsv(products: Product[]): void {
  const headers = ['id', 'storeId', 'code', 'title', 'description', 'priceUSD', 'category', 'subcategory', 'isAvailable'];
  const rows = products.map((p) => [
    p.id,
    p.storeId,
    `"${(p.code || '').replace(/"/g, '""')}"`,
    `"${(p.title || '').replace(/"/g, '""')}"`,
    `"${(p.description || '').replace(/"/g, '""')}"`,
    p.priceUSD || 0,
    `"${(p.category || '').replace(/"/g, '""')}"`,
    `"${(p.subcategory || '').replace(/"/g, '""')}"`,
    p.isAvailable ? 'true' : 'false',
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadCsvFile(csv, `Productos_MercadoCuba_${new Date().toISOString().split('T')[0]}.csv`);
}

/**
 * Simple CSV line parser taking quotes into account
 */
export function parseCsvLines(csvText: string): string[][] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  return lines.map((line) => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  });
}

/**
 * Intelligently parse a CSV file and determine if it contains Stores or Products
 */
export function parseAndImportCsvContent(
  csvText: string
): { type: 'stores'; stores: Store[] } | { type: 'products'; products: Product[] } | { type: 'unknown'; error: string } {
  const rows = parseCsvLines(csvText);
  if (rows.length < 2) {
    return { type: 'unknown', error: 'El archivo CSV no contiene filas de datos' };
  }

  const header = rows[0].map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const isStoresCsv = header.includes('slogan') || header.includes('whatsappphone') || header.includes('usdtocuprate') || header.includes('deliveryavailable');
  const isProductsCsv = header.includes('storeid') || header.includes('priceusd') || header.includes('isavailable') || header.includes('isservice');

  if (isStoresCsv) {
    const stores: Store[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length >= 2 && row[1]) {
        stores.push({
          id: row[0] || `store_csv_${Date.now()}_${i}`,
          name: row[1],
          slogan: row[2] || '',
          description: row[3] || '',
          whatsappPhone: row[4] || '+53 50000000',
          location: row[5] || 'La Habana',
          baseCurrency: 'USD',
          secondaryCurrency: 'CUP',
          exchangeRates: [{ id: `rate_${i}`, fromCurrency: 'USD', toCurrency: 'CUP', rate: Number(row[6]) || 330 }],
          usdToCupRate: Number(row[6]) || 330,
          deliveryAvailable: row[7] === 'true' || row[7] === '1',
          active: row[8] !== 'false' && row[8] !== '0',
          createdAt: new Date().toISOString(),
        });
      }
    }
    return { type: 'stores', stores };
  } else if (isProductsCsv) {
    const products: Product[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length >= 3 && row[2]) {
        products.push({
          id: row[0] || `prod_csv_${Date.now()}_${i}`,
          storeId: row[1] || 'store_1',
          code: `PRD-${Date.now().toString().slice(-4)}${i}`,
          title: row[2],
          description: row[3] || '',
          price: Number(row[4]) || 10,
          priceUSD: Number(row[4]) || 10,
          currency: 'USD',
          category: row[5] || 'Alimentos y Combos',
          subcategory: row[6] || '',
          imageUrl: 'local:product',
          isAvailable: row[7] !== 'false' && row[7] !== '0',
          tags: ['csv', 'importado'],
          createdAt: new Date().toISOString(),
        });
      }
    }
    return { type: 'products', products };
  }

  // Fallback: Check structure by column count
  if (rows[0].length >= 8) {
    // Attempt store parse
    const stores: Store[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row[1]) {
        stores.push({
          id: row[0] || `store_csv_${Date.now()}_${i}`,
          name: row[1],
          slogan: row[2] || '',
          description: row[3] || '',
          whatsappPhone: row[4] || '+53 50000000',
          location: row[5] || 'La Habana',
          baseCurrency: 'USD',
          secondaryCurrency: 'CUP',
          exchangeRates: [{ id: `rate_fallback_${i}`, fromCurrency: 'USD', toCurrency: 'CUP', rate: Number(row[6]) || 330 }],
          usdToCupRate: Number(row[6]) || 330,
          deliveryAvailable: row[7] === 'true',
          active: row[8] !== 'false',
          createdAt: new Date().toISOString(),
        });
      }
    }
    return { type: 'stores', stores };
  }

  return { type: 'unknown', error: 'No se pudo identificar si el CSV corresponde a Tiendas o Productos' };
}




