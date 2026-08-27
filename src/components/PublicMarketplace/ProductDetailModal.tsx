import React, { useState, useEffect } from 'react';
import { Product, Store } from '../../types';
import { ThemeImage } from '../common/ThemeImage';
import { interfaz } from '../../data/interfaz';
import {
  formatNumberWithDots,
  formatPricePair,
  calculateCUP,
  generateWhatsAppOrderUrl,
  formatNormalizedAddressText,
  getStoreLogoUrl,
  extractProductDisplayTags,
} from '../../lib/utils';
import {
  X,
  MessageCircle,
  Copy,
  Check,
  Store as StoreIcon,
  MapPin,
  Truck,
  Tag,
  FolderTree,
} from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  store: Store | null;
  onClose: () => void;
  onFilterByStore: (storeId: string) => void;
  onShowToast: (title: string, desc?: string, type?: 'success' | 'info' | 'error') => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  store,
  onClose,
  onFilterByStore,
  onShowToast,
}) => {
  const [copied, setCopied] = useState(false);
  const gallery =
    product?.images && product.images.length > 0
      ? product.images
      : product?.imageUrl
      ? [product.imageUrl]
      : [];
  const [activeImage, setActiveImage] = useState<string>(gallery[0] || 'local:product');

  useEffect(() => {
    if (gallery.length > 0) {
      setActiveImage(gallery[0]);
    }
  }, [product]);

  if (!product || !store) return null;

  const usdRate = store.usdToCupRate || 330;
  const cupPrice = calculateCUP(product.priceUSD, usdRate);
  const displayTags = extractProductDisplayTags(product);

  const orderMessageText = `¡Hola! 👋 Vi su publicación:\n*${product.title}*\n💵 Precio: *${formatPricePair(product.priceUSD, cupPrice)}*\n🏪 Tienda: ${store.name}\n\nMe interesa este ${product.isService ? 'servicio' : 'producto'}. ¿Tienen disponibilidad en este momento?`;

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(orderMessageText);
    setCopied(true);
    onShowToast('Mensaje copiado', 'Puedes pegarlo en WhatsApp o SMS con el vendedor');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    const url = generateWhatsAppOrderUrl(product, store);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleViewStoreProducts = () => {
    onFilterByStore(store.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="relative bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top close button */}
        <button
          type="button"
          onClick={onClose}
          title="Cerrar detalles"
          aria-label="Cerrar detalles"
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col md:flex-row">
          {/* Left / Top Product Image and Gallery */}
          <div className="md:w-1/2 bg-slate-100 dark:bg-slate-950 relative p-4 flex flex-col items-center justify-between overflow-hidden">
            <div className="w-full h-64 md:h-80 flex items-center justify-center relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <ThemeImage
                src={activeImage}
                alt={product.title}
                fallbackType="product"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnail Row */}
            {gallery.length > 1 && (
              <div className="flex items-center gap-2 mt-3 overflow-x-auto w-full pb-1 px-1">
                {gallery.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImage(img)}
                    title={`Ver imagen ${idx + 1}`}
                    aria-label={`Ver imagen ${idx + 1}`}
                    className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      activeImage === img
                        ? 'border-indigo-600 dark:border-indigo-400 scale-105 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <ThemeImage
                      src={img}
                      alt={`Foto ${idx + 1}`}
                      fallbackType="product"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right / Content Area */}
          <div className="md:w-1/2 p-6 sm:p-8 flex flex-col justify-between gap-6 overflow-y-auto max-h-[85vh]">
            <div className="space-y-4">
              {/* Subdepartment & Tags in Header */}
              <div className="flex flex-wrap items-center gap-1.5">
                {product.subcategory && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1 rounded-full border border-indigo-200/70 dark:border-indigo-800">
                    <FolderTree className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>{product.subcategory}</span>
                  </span>
                )}
                {displayTags.map((tagName, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-200/70 dark:border-emerald-800"
                  >
                    <Tag className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                    <span>{tagName}</span>
                  </span>
                ))}
                {product.deliveryAvailable && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-full border border-blue-200/60 dark:border-blue-800 ml-auto">
                    <Truck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    Mensajería
                  </span>
                )}
              </div>

              {/* Title */}
              <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                {product.title}
              </h2>

              {/* Price Breakdown Box in USD and CUP */}
              <div className="bg-indigo-50/70 dark:bg-slate-800 rounded-2xl p-4 border border-indigo-100 dark:border-slate-700">
                <div className="flex items-baseline justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wide">
                      Precio en USD
                    </span>
                    <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                      {formatNumberWithDots(product.priceUSD)} USD
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wide">
                      Precio en CUP
                    </span>
                    <p className="text-xl sm:text-2xl font-black text-indigo-700 dark:text-indigo-400 font-mono">
                      {formatNumberWithDots(cupPrice)} CUP
                    </p>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-indigo-100 dark:border-slate-700 flex items-center justify-between text-xs text-indigo-900 dark:text-slate-300">
                  <span className="font-medium">Tasa de cambio configurada:</span>
                  <span className="font-bold bg-white dark:bg-slate-900 px-2.5 py-1 rounded-md border border-indigo-200 dark:border-slate-700 font-mono text-slate-900 dark:text-slate-100">
                    1 USD x {formatNumberWithDots(usdRate)} CUP
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-1">
                  Descripción
                </h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>

              {/* Subdepartamento y Etiquetas */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                <h4 className="text-xs font-extrabold uppercase text-slate-800 dark:text-slate-200 tracking-wider flex items-center gap-1.5 border-b border-slate-200/80 dark:border-slate-700 pb-1.5">
                  <Tag className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Subdepartamento y Etiquetas</span>
                </h4>

                {product.subcategory && (
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase text-indigo-700 dark:text-indigo-400">
                      Subdepartamento:
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">{product.subcategory}</span>
                  </div>
                )}

                {displayTags.length > 0 && (
                  <div className="pt-1">
                    <span className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 block mb-1.5">
                      Etiquetas:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {displayTags.map((tagName, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-800"
                        >
                          <Tag className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                          <span>{tagName}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Store Box */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <ThemeImage
                      src={getStoreLogoUrl(store)}
                      alt={store.name}
                      fallbackType="store"
                      className="w-14 h-14 rounded-xl border border-slate-300 dark:border-slate-700 shrink-0 shadow-xs bg-white dark:bg-slate-800"
                    />
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <h5 className="font-extrabold text-slate-900 dark:text-white text-sm truncate">
                          {store.name}
                        </h5>
                        {store.badge && (
                          <span className="text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 px-2 py-0.5 rounded-full shrink-0 border border-indigo-200 dark:border-indigo-700">
                            {store.badge}
                          </span>
                        )}
                      </div>

                      {store.slogan && (
                        <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 italic">
                          “{store.slogan}”
                        </p>
                      )}

                      <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <span className="truncate">{formatNormalizedAddressText(store)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rates quick info */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Tasa aplicada:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    1 USD x {formatNumberWithDots(usdRate)} CUP
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleOpenWhatsApp}
                title="Contactar al vendedor por WhatsApp para pedir este producto o servicio"
                aria-label="Contactar al vendedor por WhatsApp"
                className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md text-sm cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 fill-current" />
                <span>Contactar por WhatsApp</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  title="Copiar texto del mensaje para enviar"
                  aria-label="Copiar texto del mensaje"
                  className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs cursor-pointer border border-slate-200 dark:border-slate-700"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                  <span>{copied ? '¡Copiado!' : 'Copiar Texto'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleViewStoreProducts}
                  title={`Ver todos los productos y servicios de ${store.name}`}
                  aria-label={`Ver todos los productos y servicios de ${store.name}`}
                  className="w-full bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs cursor-pointer border border-indigo-200 dark:border-indigo-800"
                >
                  <StoreIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Ver tienda</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
