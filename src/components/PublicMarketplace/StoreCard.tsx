import React from 'react';
import { Store } from '../../types';
import { ThemeImage } from '../common/ThemeImage';
import {
  generateStoreWhatsAppUrl,
  formatNormalizedAddressText,
  getStoreLogoUrl,
  formatNumberWithDots,
} from '../../lib/utils';
import {
  getStoreAcceptedCurrencies,
  getStorePaymentMethodsForCurrency,
} from '../../lib/cartUtils';
import {
  MapPin,
  MessageCircle,
  Truck,
  Coins,
  Store as StoreIcon,
  Banknote,
  CreditCard,
} from 'lucide-react';
import { interfaz } from '../../data/interfaz';

export interface StoreCardProps {
  store: Store;
  productsCount: number;
  onSelectStore?: (store: Store) => void;
  onViewStoreProducts?: (storeId: string) => void;
}

export const StoreCard: React.FC<StoreCardProps> = ({
  store,
  productsCount,
  onSelectStore,
  onViewStoreProducts,
}) => {
  const handleCardClick = () => {
    if (onSelectStore) {
      onSelectStore(store);
    } else if (onViewStoreProducts) {
      onViewStoreProducts(store.id);
    }
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = generateStoreWhatsAppUrl(store);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const baseCurrency = store.baseCurrency || 'USD';
  const secondaryCurrency = store.secondaryCurrency;
  let secondaryRate: number | null = null;
  if (secondaryCurrency) {
    const foundRate = store.exchangeRates?.find(
      (r) => r.fromCurrency === baseCurrency && r.toCurrency === secondaryCurrency
    );
    secondaryRate = foundRate ? foundRate.rate : (store.usdToCupRate || 330);
  }
  const normalizedAddress = formatNormalizedAddressText(store);
  const mainImage = store.images && store.images.length > 0 ? store.images[0] : getStoreLogoUrl(store);

  // Delivery flags
  const hasPickup =
    !store.deliveryMethodIds ||
    store.deliveryMethodIds.length === 0 ||
    store.deliveryMethodIds.includes('dm-recogida');
  const hasCourier =
    store.deliveryAvailable ||
    (store.deliveryMethodIds && store.deliveryMethodIds.includes('dm-mensajeria'));

  // Accepted currencies & relational payment methods
  const acceptedCurrencies = getStoreAcceptedCurrencies(store);
  const currencyPaymentList = acceptedCurrencies.map((curr) => ({
    currency: curr,
    methods: getStorePaymentMethodsForCurrency(store, curr),
  }));

  return (
    <div
      onClick={handleCardClick}
      className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden cursor-pointer relative"
    >
      {/* 1. Foto principal del establecimiento / tienda con tags superpuestas */}
      <div className="relative h-48 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <ThemeImage
          src={mainImage}
          alt={store.name}
          fallbackType="store"
          className="w-full h-full"
          imgClassName="group-hover:scale-105 transition-transform duration-500 object-cover w-full h-full"
        />

        {/* Gradiente sutil para máxima legibilidad de las tags sobre cualquier imagen */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/80 pointer-events-none" />

        {/* Tags superiores sobre la imagen: Tasa de cambio (izquierda) y Métodos de entrega/recogida (derecha) */}
        <div className="absolute top-2.5 inset-x-2.5 z-10 flex items-start justify-between gap-2">
          {/* Tag Moneda / Tasa de cambio */}
          <div className="bg-slate-950/85 backdrop-blur-md text-emerald-400 text-[10px] font-extrabold px-2.5 py-1 rounded-lg shadow-sm border border-emerald-500/30 flex items-center gap-1 font-mono shrink-0">
            <Coins className="w-3 h-3 text-emerald-400 shrink-0" />
            {secondaryCurrency && secondaryRate !== null ? (
              <span>1 {baseCurrency} = {formatNumberWithDots(secondaryRate)} {secondaryCurrency}</span>
            ) : (
              <span>Moneda: {baseCurrency}</span>
            )}
          </div>

          {/* Tags Métodos de recogida / entrega */}
          <div className="flex flex-wrap items-center justify-end gap-1">
            {hasPickup && (
              <span className="inline-flex items-center gap-1 bg-slate-950/85 backdrop-blur-md text-sky-300 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-sky-400/30 shadow-xs">
                <StoreIcon className="w-3 h-3 text-sky-300 shrink-0" />
                <span>Recogida</span>
              </span>
            )}
            {hasCourier && (
              <span className="inline-flex items-center gap-1 bg-slate-950/85 backdrop-blur-md text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-blue-400/30 shadow-xs">
                <Truck className="w-3 h-3 text-blue-300 shrink-0" />
                <span>Mensajería</span>
              </span>
            )}
          </div>
        </div>

        {/* Tags inferiores sobre la imagen: Relación Moneda ↔ Forma de Pago aceptada */}
        <div className="absolute bottom-2.5 inset-x-2.5 z-10 flex flex-wrap items-center gap-1.5">
          {currencyPaymentList.map((cp) => (
            <span
              key={cp.currency}
              className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-lg bg-slate-950/85 backdrop-blur-md text-slate-200 border border-slate-700/60 shadow-xs"
              title={`Para ${cp.currency} acepta: ${cp.methods.map((m) => m.name).join(', ')}`}
            >
              <span className="font-extrabold text-amber-300 font-mono">{cp.currency}:</span>
              <span>{cp.methods.map((m) => m.name).join(', ')}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Card body content */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div className="space-y-2.5">
          {/* 2. Nombre de la tienda */}
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
            {store.name}
          </h3>

          {/* 3. Eslogan / Descripción */}
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {store.slogan ? `“${store.slogan}” — ${store.description}` : store.description}
          </p>

          {/* 4. Caja destacada con la información más importante (Ubicación y Ofertas) */}
          <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <MapPin className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                {store.address?.municipality || store.location || normalizedAddress}
              </span>
            </div>
            <span className="text-xs font-black text-indigo-700 dark:text-indigo-400 shrink-0 font-mono">
              {productsCount} {interfaz.header.productsCountLabel}
            </span>
          </div>
        </div>

        {/* 5. Botón de Contactar por WhatsApp */}
        <div className="pt-1">
          <button
            type="button"
            onClick={handleWhatsApp}
            className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs text-xs sm:text-sm cursor-pointer"
            title={`Contactar a ${store.name} por WhatsApp`}
            aria-label={`Contactar a ${store.name} por WhatsApp`}
          >
            <MessageCircle className="w-4 h-4 shrink-0 fill-current" />
            <span>{interfaz.storeCard.contactButton || 'Contactar por WhatsApp'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
