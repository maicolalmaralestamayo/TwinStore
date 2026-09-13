import React from 'react';
import { Store, Product, MarketplaceConfig } from '../../types';
import { ThemeImage } from '../common/ThemeImage';
import {
  formatNumberWithDots,
  formatNormalizedAddressText,
  getStoreGoogleMapsUrl,
  getStoreLogoUrl,
  displayCubanPhone,
  generateStoreWhatsAppUrl,
} from '../../lib/utils';
import {
  X,
  Store as StoreIcon,
  MapPin,
  MessageCircle,
  Truck,
  CreditCard,
  Navigation,
  BadgeCheck,
  Coins,
  Percent,
  Layers,
  Phone,
  Package,
} from 'lucide-react';
import {
  INITIAL_PAYMENT_METHODS_CATALOG,
  INITIAL_DELIVERY_METHODS_CATALOG,
} from '../../data/initialData';

interface StoreDetailModalProps {
  isOpen: boolean;
  store: Store | null;
  onClose: () => void;
  marketplaceConfig?: MarketplaceConfig;
  products?: Product[];
}

export const StoreDetailModal: React.FC<StoreDetailModalProps> = ({
  isOpen,
  store,
  onClose,
  marketplaceConfig,
  products = [],
}) => {
  if (!isOpen || !store) return null;

  const paymentMethodsCatalog =
    marketplaceConfig?.paymentMethodsCatalog || INITIAL_PAYMENT_METHODS_CATALOG;
  const deliveryMethodsCatalog =
    marketplaceConfig?.deliveryMethodsCatalog || INITIAL_DELIVERY_METHODS_CATALOG;

  // Resolve payment methods for this store
  const storePaymentMethods = (store.paymentMethodIds || [])
    .map((pmId) => paymentMethodsCatalog.find((pm) => pm.id === pmId))
    .filter(Boolean);

  // Resolve delivery methods for this store
  const storeDeliveryMethods = (store.deliveryMethodIds || [])
    .map((dmId) => deliveryMethodsCatalog.find((dm) => dm.id === dmId))
    .filter(Boolean);

  const storeProductsCount = products.filter((p) => p.storeId === store.id).length;
  const usdRate = store.usdToCupRate || 330;
  const normalizedAddress = formatNormalizedAddressText(store);
  const mapsUrl = getStoreGoogleMapsUrl(store);

  const handleWhatsApp = () => {
    const url = generateStoreWhatsAppUrl(store);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleMaps = () => {
    if (mapsUrl) {
      window.open(mapsUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 relative shrink-0 border-b border-slate-700">
          <button
            type="button"
            onClick={onClose}
            title="Cerrar modal de tienda"
            aria-label="Cerrar modal de tienda"
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4 pr-10">
            <ThemeImage
              src={getStoreLogoUrl(store)}
              alt={store.name}
              fallbackType="store"
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover bg-white dark:bg-slate-800 border-2 border-white/20 shadow-md shrink-0"
            />
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl sm:text-2xl font-black text-white truncate">
                  {store.name}
                </h3>
                {store.badge && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-indigo-500/30 text-indigo-200 px-2.5 py-0.5 rounded-full border border-indigo-400/30">
                    <BadgeCheck className="w-3 h-3 text-indigo-400" />
                    <span>{store.badge}</span>
                  </span>
                )}
              </div>

              {store.slogan && (
                <p className="text-xs sm:text-sm text-indigo-200 italic font-medium line-clamp-2">
                  “{store.slogan}”
                </p>
              )}

              <div className="flex items-center gap-2 text-xs text-slate-300 flex-wrap pt-1">
                {store.whatsappPhone && (
                  <span className="flex items-center gap-1 font-mono font-semibold">
                    <Phone className="w-3 h-3 text-emerald-400" />
                    <span>{displayCubanPhone(store.whatsappPhone)}</span>
                  </span>
                )}
                {storeProductsCount > 0 && (
                  <span className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-full font-bold">
                    <Package className="w-3 h-3 text-amber-400" />
                    <span>{storeProductsCount} publicaciones activas</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Store Content */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-5 text-slate-800 dark:text-slate-200">
          
          {/* Descripción de la tienda */}
          {store.description && (
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80">
              <span className="text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider block mb-1.5 flex items-center gap-1.5">
                <StoreIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Acerca de la tienda</span>
              </span>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {store.description}
              </p>
            </div>
          )}

          {/* Galería de fotos de la tienda si tiene */}
          {store.images && store.images.length > 0 && (
            <div>
              <span className="text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider block mb-2">
                Fotos del establecimiento ({store.images.length})
              </span>
              <div className="flex gap-2.5 overflow-x-auto pb-2">
                {store.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`${store.name} foto ${idx + 1}`}
                    className="w-28 h-20 sm:w-36 sm:h-24 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shrink-0 shadow-2xs"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Dirección Desglosada */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Ubicación y Dirección</span>
              </span>
              {mapsUrl && (
                <button
                  type="button"
                  onClick={handleMaps}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Ver en Google Maps</span>
                </button>
              )}
            </div>

            <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
              {normalizedAddress || store.location}
            </p>

            {store.address && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700/80 text-xs">
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Reparto</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">{store.address.neighborhood || 'N/D'}</span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Municipio</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">{store.address.municipality || 'N/D'}</span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Provincia</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">{store.address.province || 'N/D'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Tasa de Cambio y Métodos de Pago */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Tasa de cambio */}
            <div className="bg-indigo-50/70 dark:bg-slate-800/80 p-4 rounded-2xl border border-indigo-100 dark:border-slate-700">
              <span className="text-[11px] font-extrabold uppercase text-indigo-700 dark:text-indigo-400 tracking-wider flex items-center gap-1.5 mb-1.5">
                <Coins className="w-3.5 h-3.5" />
                <span>Tasa de Cambio Oficial de la Tienda</span>
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white">
                  1 USD = {formatNumberWithDots(usdRate)} CUP
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Aplica a todas las publicaciones y conversiones de esta tienda.
              </p>
            </div>

            {/* Opciones de mensajería */}
            <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] font-extrabold uppercase text-slate-600 dark:text-slate-400 tracking-wider flex items-center gap-1.5 mb-1.5">
                <Truck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Mensajería y Envíos</span>
              </span>
              <div className="space-y-1.5">
                {storeDeliveryMethods.length > 0 ? (
                  storeDeliveryMethods.map((dm) => (
                    <div key={dm?.id} className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                      <span>{dm?.name}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {store.deliveryAvailable ? '✓ Mensajería a domicilio disponible' : '• Solo recogida en tienda física'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Formas de Pago y Gravamen */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <span className="text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Tipos de Pago y Gravámenes</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {storePaymentMethods.length > 0 ? (
                storePaymentMethods.map((pm) => {
                  const gravamen =
                    pm?.id === 'pm-transferencia' && store.paymentOptions?.transferFeePercentage !== undefined
                      ? store.paymentOptions.transferFeePercentage
                      : pm?.gravamen ?? 0;
                  return (
                    <div
                      key={pm?.id}
                      className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block truncate">
                          {pm?.name}
                        </span>
                        {pm?.description && (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                            {pm.description}
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-xs font-black font-mono px-2 py-0.5 rounded-md shrink-0 ${
                          gravamen > 0
                            ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                            : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                        }`}
                      >
                        {gravamen > 0 ? `+${gravamen}% Gravamen` : '0% Gravamen'}
                      </span>
                    </div>
                  );
                })
              ) : (
                <>
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Efectivo</span>
                    <span className="text-xs font-black font-mono px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                      0% Gravamen
                    </span>
                  </div>
                  {store.paymentOptions?.transferAccepted && (
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Transferencia Bancaria</span>
                      <span className="text-xs font-black font-mono px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                        {store.paymentOptions.transferFeePercentage || 5}% Gravamen
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Monedas Aceptadas */}
            {store.paymentOptions?.acceptedCurrencies && store.paymentOptions.acceptedCurrencies.length > 0 && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2 flex-wrap text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-bold text-[11px]">Monedas aceptadas:</span>
                {store.paymentOptions.acceptedCurrencies.map((curr) => (
                  <span
                    key={curr}
                    className="font-mono font-black text-[11px] bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800"
                  >
                    {curr}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cerrar
          </button>

          <button
            type="button"
            onClick={handleWhatsApp}
            className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl flex items-center justify-center gap-2 text-xs transition-colors shadow-sm cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>Contactar a {store.name}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
