import React, { useState, useEffect } from 'react';
import { Store, Product, MarketplaceConfig } from '../../types';
import { ThemeImage } from '../common/ThemeImage';
import {
  formatNumberWithDots,
  formatNormalizedAddressText,
  getStoreGoogleMapsUrl,
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
  Layers,
  Phone,
  Package,
  Banknote,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
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
  onViewStoreProducts?: (storeId: string) => void;
}

export const StoreDetailModal: React.FC<StoreDetailModalProps> = ({
  isOpen,
  store,
  onClose,
  marketplaceConfig,
  products = [],
  onViewStoreProducts,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [copiedAddress, setCopiedAddress] = useState(false);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [store?.id]);

  if (!isOpen || !store) return null;

  // Gallery resolution
  const gallery =
    store.images && store.images.length > 0
      ? store.images
      : [store.logoUrl || marketplaceConfig?.defaultStoreLogoUrl || 'local:store'];

  const activeImage = gallery[activeImageIndex] || gallery[0];

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev === 0 ? gallery.length - 1 : prev - 1));
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev === gallery.length - 1 ? 0 : prev + 1));
  };

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

  // Delivery flags
  const hasPickup =
    !store.deliveryMethodIds ||
    store.deliveryMethodIds.length === 0 ||
    store.deliveryMethodIds.includes('dm-recogida');
  const hasCourier =
    store.deliveryAvailable ||
    (store.deliveryMethodIds && store.deliveryMethodIds.includes('dm-mensajeria'));
  const hasNational =
    store.deliveryMethodIds && store.deliveryMethodIds.includes('dm-envio-nacional');

  // Payment flags
  const hasCash =
    !store.paymentMethodIds ||
    store.paymentMethodIds.length === 0 ||
    store.paymentMethodIds.includes('pm-efectivo');
  const hasTransfer =
    store.paymentOptions?.transferAccepted ||
    (store.paymentMethodIds && store.paymentMethodIds.includes('pm-transferencia'));
  const transferFee = store.paymentOptions?.transferFeePercentage;
  const hasZelle =
    (store.paymentMethodIds && store.paymentMethodIds.includes('pm-zelle')) ||
    store.paymentOptions?.acceptedCurrencies?.includes('Zelle');
  const hasMlc =
    (store.paymentMethodIds && store.paymentMethodIds.includes('pm-mlc')) ||
    store.paymentOptions?.acceptedCurrencies?.includes('MLC');

  const handleWhatsApp = () => {
    const url = generateStoreWhatsAppUrl(store);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleMaps = () => {
    if (mapsUrl) {
      window.open(mapsUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCopyAddress = () => {
    if (normalizedAddress) {
      navigator.clipboard.writeText(normalizedAddress);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
      onClick={onClose}
    >
      <div
        className="relative bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================================================= */}
        {/* Header Sticky                                                             */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-0.5">
              Detalles de la Tienda
            </span>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
              {store.name}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            title="Cerrar detalles"
            aria-label="Cerrar detalles"
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* Cuerpo Desplazable con el mismo orden e información estructurada           */}
        {/* ========================================================================= */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-5 text-slate-800 dark:text-slate-100">
          {/* Galería de Imágenes de la Tienda */}
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
              Imágenes del Comercio / Establecimiento
            </span>
            <div className="relative w-full h-64 sm:h-80 bg-slate-100 dark:bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex items-center justify-center group shadow-2xs">
              <ThemeImage
                src={activeImage}
                alt={store.name}
                fallbackType="store"
                className="w-full h-full"
                imgClassName="w-full h-full object-cover select-none"
              />

              {gallery.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prevImage}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-all cursor-pointer opacity-90 group-hover:opacity-100"
                    title="Imagen anterior"
                    aria-label="Imagen anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={nextImage}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-all cursor-pointer opacity-90 group-hover:opacity-100"
                    title="Imagen siguiente"
                    aria-label="Imagen siguiente"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2.5 right-2.5 bg-black/70 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs select-none">
                    {activeImageIndex + 1} / {gallery.length}
                  </div>
                </>
              )}
            </div>

            {/* Carrusel de Miniaturas */}
            {gallery.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2">
                {gallery.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                      idx === activeImageIndex
                        ? 'border-indigo-600 ring-2 ring-indigo-500/20 scale-105'
                        : 'border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <ThemeImage
                      src={img}
                      fallbackType="store"
                      className="w-full h-full"
                      imgClassName="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Identificación del Comercio y Sello */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {store.name}
              </h3>
              {store.badge ? (
                <span className="inline-flex items-center gap-1 bg-indigo-600 text-white px-2.5 py-0.5 rounded-full text-xs font-bold shadow-xs">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  <span>{store.badge}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-emerald-600 text-white px-2.5 py-0.5 rounded-full text-xs font-bold shadow-xs">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  <span>Tienda Verificada</span>
                </span>
              )}
            </div>
            {store.slogan && (
              <p className="text-xs sm:text-sm font-semibold text-indigo-700 dark:text-indigo-400 italic">
                “{store.slogan}”
              </p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
              Descripción y Presentación
            </span>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
              {store.description || 'Sin descripción detallada por el momento.'}
            </p>
          </div>

          {/* Tasa de Cambio Oficial de la Tienda */}
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
              Tasa de Cambio Oficial de la Tienda
            </span>
            <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Tasa Oficial para Operaciones en CUP
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Fijada por el comercio para compras equivalentes
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg sm:text-xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
                  1 USD = {formatNumberWithDots(usdRate)} CUP
                </span>
              </div>
            </div>
          </div>

          {/* Métodos de Recogida y Mensajería */}
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
              Métodos de Recogida y Mensajería
            </span>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2.5">
              <div className="flex flex-wrap gap-2">
                {hasPickup && (
                  <span className="inline-flex items-center gap-1.5 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-xs font-bold px-3 py-1.5 rounded-xl">
                    <StoreIcon className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <span>Recogida en tienda</span>
                  </span>
                )}
                {hasCourier && (
                  <span className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold px-3 py-1.5 rounded-xl">
                    <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Mensajería a domicilio disponible</span>
                  </span>
                )}
                {hasNational && (
                  <span className="inline-flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold px-3 py-1.5 rounded-xl">
                    <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Envío interprovincial</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Coordina las opciones de entrega y el costo del servicio directamente por WhatsApp con el comercio.
              </p>
            </div>
          </div>

          {/* Formas de Pago, Gravamen y Monedas Aceptadas */}
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
              Formas de Pago y Gravamen
            </span>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
              <div className="flex flex-wrap gap-2">
                {hasCash && (
                  <span className="inline-flex items-center gap-1.5 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold px-3 py-1.5 rounded-xl">
                    <Banknote className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>Efectivo (0% gravamen)</span>
                  </span>
                )}
                {hasTransfer && (
                  <span className="inline-flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold px-3 py-1.5 rounded-xl">
                    <CreditCard className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Transferencia {transferFee ? `(Gravamen: +${transferFee}%)` : '(Sin gravamen adicional)'}</span>
                  </span>
                )}
                {hasZelle && (
                  <span className="inline-flex items-center gap-1.5 bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 text-xs font-bold px-3 py-1.5 rounded-xl">
                    <span>Zelle</span>
                  </span>
                )}
                {hasMlc && (
                  <span className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold px-3 py-1.5 rounded-xl">
                    <span>MLC</span>
                  </span>
                )}
              </div>

              {store.paymentOptions?.acceptedCurrencies && store.paymentOptions.acceptedCurrencies.length > 0 && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Monedas aceptadas:</span>
                  <div className="flex flex-wrap gap-1">
                    {store.paymentOptions.acceptedCurrencies.map((cur) => (
                      <span
                        key={cur}
                        className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold"
                      >
                        {cur}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {store.paymentOptions?.notes && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                  Nota del comercio: {store.paymentOptions.notes}
                </p>
              )}
            </div>
          </div>

          {/* Ubicación y Dirección Desglosada */}
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
              Ubicación y Dirección Desglosada
            </span>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 block">
                    {normalizedAddress || store.location || 'Dirección no especificada'}
                  </span>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {store.address?.neighborhood && (
                      <span>
                        Reparto: <strong>{store.address.neighborhood}</strong>
                      </span>
                    )}
                    {store.address?.municipality && (
                      <span>
                        Municipio: <strong>{store.address.municipality}</strong>
                      </span>
                    )}
                    {store.address?.province && (
                      <span>
                        Provincia: <strong>{store.address.province}</strong>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-700/80">
                {mapsUrl && (
                  <button
                    type="button"
                    onClick={handleMaps}
                    className="flex-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-bold py-2 px-3 rounded-xl border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center gap-1.5 text-xs transition-colors cursor-pointer"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Ver en Google Maps</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCopyAddress}
                  className="flex-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 text-xs transition-colors cursor-pointer"
                >
                  {copiedAddress ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copiada</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copiar Dirección</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Contacto y Catálogo */}
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
              Contacto y Publicaciones
            </span>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    {displayCubanPhone(store.whatsappPhone)}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Línea oficial de WhatsApp
                  </span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold px-3 py-1.5 rounded-xl font-mono">
                <Package className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>{storeProductsCount} publicaciones</span>
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Footer Sticky                                                             */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md space-y-2.5 shrink-0">
          {/* Botón Principal de Contactar */}
          <button
            type="button"
            onClick={handleWhatsApp}
            title={`Contactar a ${store.name} por WhatsApp`}
            aria-label={`Contactar a ${store.name} por WhatsApp`}
            className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black py-3 px-5 rounded-2xl flex items-center justify-center gap-2.5 transition-all shadow-md text-sm cursor-pointer"
          >
            <MessageCircle className="w-5 h-5 fill-current" />
            <span>Contactar por WhatsApp</span>
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {onViewStoreProducts && storeProductsCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onViewStoreProducts(store.id);
                }}
                className="w-full bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors border border-indigo-200 dark:border-indigo-800 text-xs cursor-pointer shadow-2xs"
              >
                <Package className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Ver catálogo ({storeProductsCount} publicaciones)</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className={`w-full bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors border border-slate-200 dark:border-slate-700 text-xs cursor-pointer ${
                !onViewStoreProducts || storeProductsCount === 0 ? 'sm:col-span-2' : ''
              }`}
            >
              <span>Cerrar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
