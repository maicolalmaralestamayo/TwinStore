import {
  Store,
  Product,
  CartItem,
  StoreCartPreferences,
  MarketplaceConfig,
  PaymentMethodItem,
  DeliveryMethodItem,
  StoreCurrencyPaymentMethod,
  StoreRatePaymentMethod,
  StoreExchangeRate,
} from '../types';
import {
  calculateProductPriceInCurrency,
  getStoreExchangeRate,
  formatNumberWithDots,
  normalizeWhatsAppPhone,
  formatNormalizedAddressText,
} from './utils';

/**
 * Returns all accepted payment currencies configured or supported for a store.
 * Always returns whole configured currencies; first one is the default.
 */
export function getStoreAcceptedCurrencies(store: Store | undefined): string[] {
  if (!store) return ['USD', 'CUP'];
  const currencies: string[] = [];

  const addCurr = (curr?: string) => {
    if (!curr) return;
    const c = curr.toUpperCase().trim();
    if (c && !currencies.includes(c)) {
      currencies.push(c);
    }
  };

  // 1. Currencies defined in the relational table (currencyPaymentMethods)
  if (store.currencyPaymentMethods && Array.isArray(store.currencyPaymentMethods)) {
    store.currencyPaymentMethods.forEach((cpm) => addCurr(cpm.currency));
  }

  // 2. Primary currency configured in store
  addCurr(store.baseCurrency || (store as any).currency);

  // 3. Secondary currency configured in store
  addCurr(store.secondaryCurrency);

  // 4. Accepted currencies list
  if (store.paymentOptions?.acceptedCurrencies && Array.isArray(store.paymentOptions.acceptedCurrencies)) {
    store.paymentOptions.acceptedCurrencies.forEach(addCurr);
  }

  // 5. Currencies from active exchange rates
  if (store.exchangeRates && Array.isArray(store.exchangeRates)) {
    store.exchangeRates.forEach((r) => {
      addCurr(r.fromCurrency);
      addCurr(r.toCurrency);
    });
  }

  // 6. USD and CUP fallback
  if (store.usdToCupRate && store.usdToCupRate > 0) {
    addCurr('USD');
    addCurr('CUP');
  }

  if (currencies.length === 0) {
    currencies.push('USD', 'CUP');
  }

  return currencies;
}

/**
 * Formats the exchange rates of a store into a compact text line.
 * Las tasas de cambio siempre son números enteros.
 */
export function formatStoreExchangeRatesText(store: Store | undefined): string {
  if (!store) return '';
  const parts: string[] = [];

  if (store.exchangeRates && Array.isArray(store.exchangeRates) && store.exchangeRates.length > 0) {
    store.exchangeRates
      .filter((r) => r.rate > 0)
      .forEach((r) => {
        const intRate = Math.round(r.rate);
        parts.push(`1 ${r.fromCurrency.toUpperCase()} = ${formatNumberWithDots(intRate)} ${r.toCurrency.toUpperCase()}`);
      });
  } else if (store.usdToCupRate && store.usdToCupRate > 0) {
    const intRate = Math.round(store.usdToCupRate);
    parts.push(`1 USD = ${formatNumberWithDots(intRate)} CUP`);
  }

  return parts.join(' • ');
}

/**
 * Formats only the exchange rates that were actually utilized in the user's purchase for a store.
 * If products were bought in their original currency without conversion, no unnecessary rates are listed.
 * Las tasas de cambio siempre son números enteros.
 */
export function getUsedExchangeRatesText(
  store: Store | undefined,
  items: StoreCartItemDetail[]
): string {
  if (!store || !items || items.length === 0) return '';
  const seenPairs = new Set<string>();
  const parts: string[] = [];

  items.forEach((item) => {
    const from = (item.originalCurrency || 'USD').toUpperCase();
    const to = (item.paymentCurrency || 'USD').toUpperCase();
    if (from !== to) {
      const pairKey = `${from}->${to}`;
      if (!seenPairs.has(pairKey)) {
        seenPairs.add(pairKey);
        const rate = getStoreExchangeRate(store, from, to);
        if (rate && rate > 0) {
          const intRate = Math.round(rate);
          parts.push(`1 ${from} = ${formatNumberWithDots(intRate)} ${to}`);
        }
      }
    }
  });

  return parts.join(' • ');
}

/**
 * Resolves available payment methods for a store along with their commission/gravamen percentage
 */
export function getStorePaymentMethods(
  store: Store | undefined,
  paymentMethodsCatalog?: PaymentMethodItem[]
): { id: string; name: string; gravamen: number; description?: string }[] {
  if (!store) {
    return [{ id: 'pm-efectivo', name: 'Efectivo', gravamen: 0, description: 'Pago directo en mano' }];
  }

  if (store.paymentMethodIds && store.paymentMethodIds.length > 0 && paymentMethodsCatalog) {
    const list = store.paymentMethodIds
      .map((pmId) => {
        const item = paymentMethodsCatalog.find((pm) => pm.id === pmId);
        if (!item) return null;
        let grav = item.gravamen ?? 0;
        if (item.id === 'pm-transferencia' && store.paymentOptions?.transferFeePercentage !== undefined) {
          grav = store.paymentOptions.transferFeePercentage;
        }
        return {
          id: item.id,
          name: item.name,
          gravamen: grav,
          description: item.description,
        };
      })
      .filter(Boolean) as { id: string; name: string; gravamen: number; description?: string }[];

    if (list.length > 0) return list;
  }

  // Fallback defaults based on store flags
  const fallbackList: { id: string; name: string; gravamen: number; description?: string }[] = [
    { id: 'pm-efectivo', name: 'Efectivo', gravamen: 0, description: 'Pago directo en mano' },
  ];

  if (store.paymentOptions?.transferAccepted) {
    fallbackList.push({
      id: 'pm-transferencia',
      name: 'Transferencia Bancaria',
      gravamen: store.paymentOptions.transferFeePercentage || 0,
      description: 'Transfermóvil / EnZona',
    });
  }

  return fallbackList;
}

/**
 * Returns the relational mapping of Moneda ↔ Formas de Pago for a store.
 * If the store has explicit currencyPaymentMethods configured, uses them.
 * Otherwise, generates an intelligent Cuba-market fallback:
 * - USD, EUR: Cash (Efectivo)
 * - CUP: Cash (Efectivo) + Bank Transfer (Transferencia) if transfer is enabled
 */
export function getStoreCurrencyPaymentMethods(
  store: Store | undefined
): StoreCurrencyPaymentMethod[] {
  if (!store) return [];

  if (store.currencyPaymentMethods && store.currencyPaymentMethods.length > 0) {
    return store.currencyPaymentMethods;
  }

  // Generic fallback:
  const list: StoreCurrencyPaymentMethod[] = [];
  const acceptedCurrencies = getStoreAcceptedCurrencies(store);
  const hasCash =
    !store.paymentMethodIds ||
    store.paymentMethodIds.length === 0 ||
    store.paymentMethodIds.includes('pm-efectivo');
  const hasTransfer = Boolean(
    store.paymentOptions?.transferAccepted ||
    (store.paymentMethodIds && store.paymentMethodIds.includes('pm-transferencia'))
  );

  acceptedCurrencies.forEach((curr) => {
    const c = curr.toUpperCase().trim();
    if (hasCash) {
      list.push({
        id: `cpm-${store.id}-${c}-cash`,
        storeId: store.id,
        currency: c,
        paymentMethodId: 'pm-efectivo',
        notes: 'Pago en mano / efectivo',
      });
    }
    if (hasTransfer) {
      list.push({
        id: `cpm-${store.id}-${c}-transf`,
        storeId: store.id,
        currency: c,
        paymentMethodId: 'pm-transferencia',
        notes: 'Transferencia bancaria / electrónica',
      });
    }
  });

  return list;
}

/**
 * Returns available payment methods for a specific currency in a store.
 */
export function getStorePaymentMethodsForCurrency(
  store: Store | undefined,
  currency: string,
  paymentMethodsCatalog?: PaymentMethodItem[]
): { id: string; name: string; gravamen: number; description?: string; notes?: string }[] {
  if (!store) {
    return [{ id: 'pm-efectivo', name: 'Efectivo', gravamen: 0, description: 'Pago directo en mano' }];
  }

  const curr = (currency || store.baseCurrency || 'USD').toUpperCase().trim();
  const cpmList = getStoreCurrencyPaymentMethods(store);
  const matchedForCurrency = cpmList.filter((m) => m.currency.toUpperCase().trim() === curr);

  if (matchedForCurrency.length > 0) {
    return matchedForCurrency.map((m) => {
      const catalogItem = paymentMethodsCatalog?.find((pm) => pm.id === m.paymentMethodId);
      let name =
        catalogItem?.name ||
        (m.paymentMethodId === 'pm-transferencia'
          ? 'Transferencia Bancaria'
          : m.paymentMethodId === 'pm-efectivo'
          ? 'Efectivo'
          : m.paymentMethodId);
      let gravamen = catalogItem?.gravamen ?? 0;
      if (m.paymentMethodId === 'pm-transferencia' && store.paymentOptions?.transferFeePercentage !== undefined) {
        gravamen = store.paymentOptions.transferFeePercentage;
      }
      return {
        id: m.paymentMethodId,
        name,
        gravamen,
        description: catalogItem?.description || m.notes,
        notes: m.notes,
      };
    });
  }

  // Fallback to all store payment methods if no specific currency match found
  return getStorePaymentMethods(store, paymentMethodsCatalog);
}

/**
 * Resolves available payment methods and gravámenes accepted for a specific exchange rate of the store.
 * e.g. For Tasa 1 (USD a CUP 530): Efectivo 0% gravamen, Transferencia 10% gravamen.
 */
export function getStorePaymentMethodsForRate(
  store: Store | undefined,
  exchangeRateId: string,
  paymentMethodsCatalog?: PaymentMethodItem[]
): { id: string; name: string; gravamen: number; description?: string; notes?: string; paymentMethodId: string }[] {
  if (!store || !exchangeRateId) return [];

  const rpmList = (store.ratePaymentMethods || []).filter(
    (rpm) => rpm.exchangeRateId === exchangeRateId
  );

  if (rpmList.length > 0) {
    return rpmList.map((rpm) => {
      const catalogItem = paymentMethodsCatalog?.find((pm) => pm.id === rpm.paymentMethodId);
      const isCash = rpm.paymentMethodId === 'pm-efectivo';
      const isTransf = rpm.paymentMethodId === 'pm-transferencia';
      const name =
        catalogItem?.name ||
        (isCash ? 'Efectivo' : isTransf ? 'Transferencia Bancaria' : rpm.paymentMethodId);
      return {
        id: rpm.paymentMethodId,
        paymentMethodId: rpm.paymentMethodId,
        name,
        gravamen: rpm.gravamen !== undefined ? rpm.gravamen : (catalogItem?.gravamen ?? 0),
        description: catalogItem?.description || rpm.notes,
        notes: rpm.notes,
      };
    });
  }

  // Fallback if rate has no explicit ratePaymentMethods configured yet
  const defaultFee = store.paymentOptions?.transferFeePercentage ?? 10;
  return [
    {
      id: 'pm-efectivo',
      paymentMethodId: 'pm-efectivo',
      name: 'Efectivo',
      gravamen: 0,
      description: 'Pago en mano al recibir',
      notes: 'Sin gravamen adicional (0%)',
    },
    {
      id: 'pm-transferencia',
      paymentMethodId: 'pm-transferencia',
      name: 'Transferencia Bancaria',
      gravamen: defaultFee,
      description: 'Transfermóvil / EnZona',
      notes: `Gravamen (+${defaultFee}%)`,
    },
  ];
}

/**
 * Groups all store exchange rates with their corresponding accepted payment methods and gravamen.
 */
export function getAllStoreRatePaymentMethods(
  store: Store | undefined,
  paymentMethodsCatalog?: PaymentMethodItem[]
): {
  exchangeRate: StoreExchangeRate;
  methods: { id: string; name: string; gravamen: number; notes?: string }[];
}[] {
  if (!store || !store.exchangeRates || store.exchangeRates.length === 0) return [];

  return store.exchangeRates.map((rate) => ({
    exchangeRate: rate,
    methods: getStorePaymentMethodsForRate(store, rate.id, paymentMethodsCatalog),
  }));
}

/**
 * Returns available payment methods for a specific cart item based on:
 * - If product was converted using an exchange rate -> payment methods configured for that rate
 * - If product is in its native currency -> payment methods configured for that currency
 */
export function getItemAvailablePaymentMethods(
  store: Store | undefined,
  product: Product | undefined,
  paymentCurrency: string,
  paymentMethodsCatalog?: PaymentMethodItem[]
): { id: string; name: string; gravamen: number; description?: string; notes?: string }[] {
  if (!store) {
    return [{ id: 'pm-efectivo', name: 'Efectivo', gravamen: 0, description: 'Pago directo en mano' }];
  }
  const prodCurr = (product?.currency || 'USD').toUpperCase();
  const payCurr = (paymentCurrency || store.baseCurrency || 'USD').toUpperCase();

  if (prodCurr !== payCurr && store.exchangeRates && store.exchangeRates.length > 0) {
    const matchedRate = store.exchangeRates.find(
      (r) => (r.fromCurrency || '').toUpperCase() === prodCurr && (r.toCurrency || '').toUpperCase() === payCurr
    );
    if (matchedRate) {
      return getStorePaymentMethodsForRate(store, matchedRate.id, paymentMethodsCatalog);
    }
  }

  return getStorePaymentMethodsForCurrency(store, payCurr, paymentMethodsCatalog);
}

/**
 * Resolves available delivery/pickup methods for a store
 */
export function getStoreDeliveryMethods(
  store: Store | undefined,
  deliveryMethodsCatalog?: DeliveryMethodItem[]
): { id: string; name: string; description?: string }[] {
  if (!store) {
    return [{ id: 'dm-recogida', name: 'Recogida en Local / Tienda', description: 'Retiro en la dirección de la tienda' }];
  }

  if (store.deliveryMethodIds && store.deliveryMethodIds.length > 0 && deliveryMethodsCatalog) {
    const list = store.deliveryMethodIds
      .map((dmId) => {
        const item = deliveryMethodsCatalog.find((dm) => dm.id === dmId);
        if (!item) return null;
        return {
          id: item.id,
          name: item.name,
          description: item.description,
        };
      })
      .filter(Boolean) as { id: string; name: string; description?: string }[];

    if (list.length > 0) return list;
  }

  // Fallback based on store flags
  const fallbackList: { id: string; name: string; description?: string }[] = [];

  if (store.deliveryAvailable) {
    fallbackList.push({
      id: 'dm-mensajeria',
      name: 'Mensajería a Domicilio',
      description: 'Envío directo hasta su dirección',
    });
  }

  fallbackList.push({
    id: 'dm-recogida',
    name: 'Recogida en Local / Tienda',
    description: 'Retiro presencial en la dirección del proveedor',
  });

  return fallbackList;
}

export interface StoreCartItemDetail {
  cartItem: CartItem;
  product: Product;
  originalPrice: number;
  originalCurrency: string;
  paymentCurrency: string;
  unitPrice: number;
  lineTotal: number;
  paymentMethod: { id: string; name: string; gravamen: number; description?: string };
  gravamenAmount: number;
  lineFinalTotal: number;
  deliveryMethod: { id: string; name: string; description?: string };
}

export interface StoreCurrencySubtotal {
  currency: string;
  itemsSubtotal: number;
  gravamenTotal: number;
  finalSubtotal: number;
  itemsCount: number;
}

export interface StoreCartCalculation {
  store: Store;
  items: StoreCartItemDetail[];
  totalQuantity: number;
  currencySubtotals: Record<string, StoreCurrencySubtotal>;
  defaultCurrency: string;
  exchangeRatesText: string;
  usedExchangeRatesText: string;
}

/**
 * Calculates complete summary for a store group in the cart.
 * Allows each product to have its own payment currency, payment method, and pickup/delivery method.
 * Subtotals are broken down by payment currency.
 */
export function calculateStoreCartGroup(
  store: Store,
  cartItems: CartItem[],
  allProducts: Product[],
  preferences: StoreCartPreferences | undefined,
  paymentMethodsCatalog?: PaymentMethodItem[],
  deliveryMethodsCatalog?: DeliveryMethodItem[]
): StoreCartCalculation {
  const acceptedCurrencies = getStoreAcceptedCurrencies(store);
  const defaultCurrency = acceptedCurrencies[0] || 'USD';
  const availablePaymentMethods = getStorePaymentMethods(store, paymentMethodsCatalog);
  const defaultPaymentMethod = availablePaymentMethods[0];
  const availableDeliveryMethods = getStoreDeliveryMethods(store, deliveryMethodsCatalog);
  const defaultDeliveryMethod = availableDeliveryMethods[0];

  const itemDetails: StoreCartItemDetail[] = cartItems
    .map((ci) => {
      const product = allProducts.find((p) => p.id === ci.productId);
      if (!product) return null;

      // Determine item-level payment currency (defaults to store's first configured currency or store preference)
      const paymentCurrency =
        ci.paymentCurrency && acceptedCurrencies.includes(ci.paymentCurrency)
          ? ci.paymentCurrency
          : preferences?.selectedCurrency && acceptedCurrencies.includes(preferences.selectedCurrency)
          ? preferences.selectedCurrency
          : defaultCurrency;

      // Determine valid payment methods for THIS specific item & currency (rate-aware)
      const currencyPaymentMethods = getItemAvailablePaymentMethods(
        store,
        product,
        paymentCurrency,
        paymentMethodsCatalog
      );
      const defaultCurrencyPaymentMethod = currencyPaymentMethods[0] || defaultPaymentMethod;

      // Determine item-level payment method (must be valid for the chosen currency)
      const chosenPaymentMethodId = ci.paymentMethodId || preferences?.selectedPaymentMethodId;
      const paymentMethod =
        currencyPaymentMethods.find((pm) => pm.id === chosenPaymentMethodId) ||
        defaultCurrencyPaymentMethod;

      // Determine item-level delivery method
      const chosenDeliveryMethodId = ci.deliveryMethodId || preferences?.selectedDeliveryMethodId;
      const deliveryMethod =
        availableDeliveryMethods.find((dm) => dm.id === chosenDeliveryMethodId) || defaultDeliveryMethod;

      const originalPrice =
        product.price !== undefined && product.price !== null ? product.price : (product.priceUSD || 0);
      const originalCurrency = (product.currency || 'USD').toUpperCase();

      const unitPrice = calculateProductPriceInCurrency(product, store, paymentCurrency);
      const lineTotal = Math.round(unitPrice * ci.quantity * 100) / 100;

      const gravamenPercent = paymentMethod?.gravamen || 0;
      const gravamenAmount =
        gravamenPercent > 0 ? Math.round(((lineTotal * gravamenPercent) / 100) * 100) / 100 : 0;
      const lineFinalTotal = Math.round((lineTotal + gravamenAmount) * 100) / 100;

      return {
        cartItem: ci,
        product,
        originalPrice,
        originalCurrency,
        paymentCurrency,
        unitPrice,
        lineTotal,
        paymentMethod,
        gravamenAmount,
        lineFinalTotal,
        deliveryMethod,
      };
    })
    .filter(Boolean) as StoreCartItemDetail[];

  const totalQuantity = itemDetails.reduce((sum, item) => sum + item.cartItem.quantity, 0);

  // Group subtotals by payment currency for this store
  const currencySubtotals: Record<string, StoreCurrencySubtotal> = {};

  itemDetails.forEach((item) => {
    const curr = item.paymentCurrency;
    if (!currencySubtotals[curr]) {
      currencySubtotals[curr] = {
        currency: curr,
        itemsSubtotal: 0,
        gravamenTotal: 0,
        finalSubtotal: 0,
        itemsCount: 0,
      };
    }
    currencySubtotals[curr].itemsSubtotal =
      Math.round((currencySubtotals[curr].itemsSubtotal + item.lineTotal) * 100) / 100;
    currencySubtotals[curr].gravamenTotal =
      Math.round((currencySubtotals[curr].gravamenTotal + item.gravamenAmount) * 100) / 100;
    currencySubtotals[curr].finalSubtotal =
      Math.round((currencySubtotals[curr].finalSubtotal + item.lineFinalTotal) * 100) / 100;
    currencySubtotals[curr].itemsCount += item.cartItem.quantity;
  });

  const exchangeRatesText = formatStoreExchangeRatesText(store);
  const usedExchangeRatesText = getUsedExchangeRatesText(store, itemDetails);

  return {
    store,
    items: itemDetails,
    totalQuantity,
    currencySubtotals,
    defaultCurrency,
    exchangeRatesText,
    usedExchangeRatesText,
  };
}

/**
 * Builds the customized WhatsApp order text for an individual store
 */
export function generateStoreCartWhatsAppMessage(
  calc: StoreCartCalculation,
  marketplaceConfig: MarketplaceConfig
): string {
  const { store, items, currencySubtotals, usedExchangeRatesText } = calc;
  const address = formatNormalizedAddressText(store);

  let msg = `¡Hola *${store.name}*! 👋\n`;
  msg += `Te contacto desde *${marketplaceConfig.name}* para realizar el siguiente pedido:\n\n`;

  if (usedExchangeRatesText) {
    msg += `ℹ️ *Tasas utilizadas:* ${usedExchangeRatesText}\n\n`;
  }

  msg += `🛒 *DETALLE DEL PEDIDO:*\n`;

  items.forEach((item, index) => {
    const codeTag = item.product.code ? `[${item.product.code}] ` : '';
    msg += `${index + 1}. ${codeTag}*${item.product.title}*\n`;
    msg += `   • Cantidad: ${item.cartItem.quantity}\n`;
    msg += `   • Precio Base: ${formatNumberWithDots(item.originalPrice)} ${item.originalCurrency}\n`;
    msg += `   • Precio Unitario Pago: ${formatNumberWithDots(item.unitPrice)} ${item.paymentCurrency}\n`;
    msg += `   • Subtotal Producto: ${formatNumberWithDots(item.lineTotal)} ${item.paymentCurrency}\n`;
    msg += `   • Forma de Pago: ${item.paymentMethod.name}`;
    if (item.paymentMethod.gravamen > 0) {
      msg += ` (+${item.paymentMethod.gravamen}% = +${formatNumberWithDots(item.gravamenAmount)} ${item.paymentCurrency})`;
    }
    msg += `\n`;
    msg += `   • Recogida / Entrega: ${item.deliveryMethod.name}\n`;
    msg += `   • Total Item: *${formatNumberWithDots(item.lineFinalTotal)} ${item.paymentCurrency}*\n\n`;
  });

  msg += `──────────────\n`;
  msg += `💰 *SUBTOTALES POR MONEDA DE PAGO:*\n`;
  (Object.values(currencySubtotals) as StoreCurrencySubtotal[]).forEach((sub) => {
    msg += `👉 *${sub.currency}:* *${formatNumberWithDots(sub.finalSubtotal)} ${sub.currency}*`;
    if (sub.gravamenTotal > 0) {
      msg += ` (incluye ${formatNumberWithDots(sub.gravamenTotal)} ${sub.currency} de gravamen)`;
    }
    msg += `\n`;
  });
  msg += `──────────────\n\n`;

  if (address) {
    msg += `📍 *Ubicación de la tienda registrada:* ${address}\n`;
  }
  msg += `Por favor confirmen disponibilidad de los artículos para coordinar el pago y la entrega. ¡Muchas gracias! 🙏`;

  return msg;
}

/**
 * Builds direct WhatsApp URL for a specific store order
 */
export function generateStoreCartWhatsAppUrl(
  calc: StoreCartCalculation,
  marketplaceConfig: MarketplaceConfig
): string {
  const phone = normalizeWhatsAppPhone(calc.store.whatsappPhone || '');
  const message = generateStoreCartWhatsAppMessage(calc, marketplaceConfig);
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/**
 * Builds the consolidated WhatsApp order text for the marketplace owner (SEO)
 */
export function generateMarketplaceConsolidatedWhatsAppMessage(
  calculations: StoreCartCalculation[],
  marketplaceConfig: MarketplaceConfig
): string {
  let msg = `¡Hola Dueño / Administrador de *${marketplaceConfig.name}*! 🌟\n`;
  msg += `Te contacto con un *Pedido Consolidado Multi-Tienda* generado desde el marketplace:\n\n`;

  let totalItemsCount = 0;
  const grandCurrencyTotals: Record<string, number> = {};

  calculations.forEach((calc, idx) => {
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `🏪 *TIENDA ${idx + 1}: ${calc.store.name}*\n`;
    if (calc.exchangeRatesText) {
      msg += `📈 Tasas: ${calc.exchangeRatesText}\n`;
    }
    if (calc.store.whatsappPhone) {
      msg += `📞 Teléfono Tienda: ${calc.store.whatsappPhone}\n`;
    }
    msg += `📍 Ubicación: ${formatNormalizedAddressText(calc.store)}\n`;
    msg += `🛒 *Artículos:*\n`;

    calc.items.forEach((item) => {
      totalItemsCount += item.cartItem.quantity;
      const codeTag = item.product.code ? `[${item.product.code}] ` : '';
      msg += `  • ${codeTag}${item.product.title} (x${item.cartItem.quantity}) = ${formatNumberWithDots(item.lineFinalTotal)} ${item.paymentCurrency} [${item.paymentMethod.name} | ${item.deliveryMethod.name}]\n`;
    });

    msg += `💰 *Subtotales Tienda por Moneda:*\n`;
    (Object.values(calc.currencySubtotals) as StoreCurrencySubtotal[]).forEach((sub) => {
      msg += `    • ${sub.currency}: *${formatNumberWithDots(sub.finalSubtotal)} ${sub.currency}*\n`;
      grandCurrencyTotals[sub.currency] =
        Math.round(((grandCurrencyTotals[sub.currency] || 0) + sub.finalSubtotal) * 100) / 100;
    });
    msg += `\n`;
  });

  msg += `━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📊 *RESUMEN GENERAL DEL PEDIDO:*\n`;
  msg += `• Total de Tiendas: ${calculations.length}\n`;
  msg += `• Total de Productos / Unidades: ${totalItemsCount}\n`;
  msg += `• *TOTALES GENERALES A PAGAR POR MONEDA:*\n`;
  Object.entries(grandCurrencyTotals).forEach(([curr, sum]) => {
    msg += `   👉 *${formatNumberWithDots(sum)} ${curr}*\n`;
  });
  msg += `\nSolicito apoyo y seguimiento de esta orden consolidada. ¡Muchas gracias! 🙏`;

  return msg;
}

/**
 * Builds direct WhatsApp URL for the marketplace owner (SEO)
 */
export function generateMarketplaceOwnerWhatsAppUrl(
  calculations: StoreCartCalculation[],
  marketplaceConfig: MarketplaceConfig
): string {
  const ownerPhone =
    marketplaceConfig.socialLinks?.whatsapp || '+5350000000';
  const cleanPhone = normalizeWhatsAppPhone(ownerPhone);
  const message = generateMarketplaceConsolidatedWhatsAppMessage(calculations, marketplaceConfig);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
