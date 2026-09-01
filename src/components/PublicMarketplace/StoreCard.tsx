import React from 'react';
import { Store } from '../../types';
import { ThemeImage } from '../common/ThemeImage';
import {
  generateStoreWhatsAppUrl,
  formatNormalizedAddressText,
  getStoreGoogleMapsUrl,
  getStoreLogoUrl,
  formatNumberWithDots,
} from '../../lib/utils';
import {
  MapPin,
  MessageCircle,
  Truck,
  CreditCard,
  Navigation,
  ShoppingBag,
} from 'lucide-react';
import { interfaz } from '../../data/interfaz';

interface StoreCardProps {
  store: Store;
  productsCount: number;
  onViewStoreProducts: (storeId: string) => void;
}

export const StoreCard: React.FC<StoreCardProps> = ({
  store,
  productsCount,
  onViewStoreProducts,
}) => {
  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = generateStoreWhatsAppUrl(store);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleMaps = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getStoreGoogleMapsUrl(store);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const normalizedAddress = formatNormalizedAddressText(store);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden p-5 gap-4">
      {/* Top Header: Logo + Info */}
      <div className="flex items-start gap-4">
        <ThemeImage
          src={getStoreLogoUrl(store)}
          alt={store.name}
          fallbackType="store"
          className="w-16 h-16 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0 shadow-xs bg-white dark:bg-slate-800"
        />

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-black text-slate-900 dark:text-white text-base sm:text-lg truncate">
              {store.name}
            </h4>
            {store.badge && (
              <span className="text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 px-2 py-0.5 rounded-full shrink-0 border border-indigo-200 dark:border-indigo-700">
                {store.badge}
              </span>
            )}
          </div>

          {store.slogan && (
            <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 line-clamp-1 italic">
              “{store.slogan}”
            </p>
          )}

          {/* Tasa de cambio: 1 USD x 328 CUP */}
          <div className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md border border-slate-200/80 dark:border-slate-700 font-mono">
            <span>{interfaz.storeCard.rateLabel}:</span>
            <span className="text-indigo-800 dark:text-indigo-300 font-extrabold">
              {interfaz.productCard.ratePrefix} {formatNumberWithDots(store.usdToCupRate || 330)} {interfaz.productCard.rateSuffix}
            </span>
          </div>
        </div>
      </div>

      {/* Description & Address */}
      <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
        <p className="line-clamp-2 leading-relaxed text-slate-500 dark:text-slate-400">
          {store.description}
        </p>

        <div className="flex items-start justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-start gap-1 text-slate-700 dark:text-slate-300 min-w-0">
            <MapPin className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <span className="truncate">{normalizedAddress}</span>
          </div>

          <button
            type="button"
            onClick={handleMaps}
            className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 shrink-0 flex items-center gap-1 cursor-pointer"
            title="Ver ubicación en Google Maps"
            aria-label="Ver ubicación en Google Maps"
          >
            <Navigation className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
            <span>{interfaz.storeCard.mapButton}</span>
          </button>
        </div>
      </div>

      {/* Badges: Mensajería / Recogida en tienda, Tipo de Pago (Transferencia / Efectivo) y Cantidad de Productos y servicios */}
      <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] font-bold">
        <span
          title={store.deliveryAvailable ? 'Cuenta con servicio de mensajería' : 'Solo retirada presencial en tienda'}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${
            store.deliveryAvailable
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <Truck className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
          {store.deliveryAvailable ? interfaz.filters.options.deliveryCourier : interfaz.filters.options.deliveryPickup}
        </span>

        <span
          title={store.paymentOptions?.transferAccepted ? 'Acepta pago por transferencia bancaria' : 'Acepta pago solo en efectivo'}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${
            store.paymentOptions?.transferAccepted
              ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <CreditCard className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
          {store.paymentOptions?.transferAccepted
            ? `${interfaz.filters.options.payTransfer} (${store.paymentOptions.transferFeePercentage || 0}%)`
            : interfaz.filters.options.payCash}
        </span>

        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 ml-auto">
          <ShoppingBag className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
          <span>{productsCount} {interfaz.header.productsCountLabel}</span>
        </span>
      </div>

      {/* Actions: Ver Productos y servicios + Contactar WhatsApp */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={() => onViewStoreProducts(store.id)}
          title={`Ver catálogo de productos y servicios de ${store.name}`}
          aria-label={`Ver catálogo de productos y servicios de ${store.name}`}
          className="w-full bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs cursor-pointer border border-indigo-200 dark:border-indigo-800"
        >
          <ShoppingBag className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>{interfaz.storeCard.viewProductsButton}</span>
        </button>

        <button
          type="button"
          onClick={handleWhatsApp}
          title={`Contactar a ${store.name} por WhatsApp`}
          aria-label={`Contactar a ${store.name} por WhatsApp`}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs cursor-pointer shadow-xs"
        >
          <MessageCircle className="w-3.5 h-3.5 fill-current" />
          <span>{interfaz.storeCard.contactButton}</span>
        </button>
      </div>
    </div>
  );
};
