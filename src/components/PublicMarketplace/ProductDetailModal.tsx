import React, { useState, useEffect } from 'react';
import { Product, Store, CurrencyDisplayMode } from '../../types';
import { ThemeImage } from '../common/ThemeImage';
import {
  formatNumberWithDots,
  formatPricePair,
  calculateCUP,
  generateWhatsAppOrderUrl,
  displayCubanPhone,
  formatNormalizedAddressText,
  getStoreGoogleMapsUrl,
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
  Share2,
  ExternalLink,
  DollarSign,
  Info,
  CreditCard,
  Navigation,
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
  const gallery = product?.images && product.images.length > 0 ? product.images : (product?.imageUrl ? [product.imageUrl] : []);
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

  const orderMessageText = `¡Hola! 👋 Vi en *MercadoCuba* su publicación:\n*${product.title}*\n💵 Precio: *${formatPricePair(product.priceUSD, cupPrice)}*\n🏪 Tienda: ${store.name}\n\nMe interesa este ${product.isService ? 'servicio' : 'producto'}. ¿Tienen disponibilidad en este momento? ¿Cómo sería la entrega/acuerdo?`;

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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="relative bg-white rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col md:flex-row">
          {/* Left / Top Product Image and Gallery */}
          <div className="md:w-1/2 bg-gray-100 relative p-4 flex flex-col items-center justify-between overflow-hidden">
            <div className="w-full h-64 md:h-80 flex items-center justify-center relative overflow-hidden rounded-2xl bg-white border border-slate-200">
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
                    className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      activeImage === img ? 'border-indigo-600 scale-105 shadow-xs' : 'border-slate-200 opacity-60 hover:opacity-100'
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
              {/* Subdepartment & Tags in Header (Solo subdepartamento y etiquetas) */}
              <div className="flex flex-wrap items-center gap-1.5">
                {product.subcategory && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200/70">
                    <FolderTree className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{product.subcategory}</span>
                  </span>
                )}
                {displayTags.map((tagName, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/70"
                  >
                    <Tag className="w-3 h-3 text-emerald-600" />
                    <span>{tagName}</span>
                  </span>
                ))}
                {product.deliveryAvailable && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200/60 ml-auto">
                    <Truck className="w-3.5 h-3.5" />
                    Envío disponible
                  </span>
                )}
              </div>

              {/* Title */}
              <h2 className="text-2xl font-black text-gray-900 leading-tight">
                {product.title}
              </h2>

              {/* Price Breakdown Box in USD and CUP */}
              <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
                <div className="flex items-baseline justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-indigo-800 uppercase tracking-wide">
                      Precio en Dólar (USD)
                    </span>
                    <p className="text-2xl sm:text-3xl font-black text-slate-900">
                      {formatNumberWithDots(product.priceUSD)} USD
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-indigo-800 uppercase tracking-wide">
                      Precio en Peso Cubano
                    </span>
                    <p className="text-xl sm:text-2xl font-black text-indigo-700 font-mono">
                      {formatNumberWithDots(cupPrice)} CUP
                    </p>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-indigo-100 flex items-center justify-between text-xs text-indigo-900">
                  <span className="font-medium">Tasa de cambio configurada por la tienda:</span>
                  <span className="font-bold bg-white px-2.5 py-1 rounded-md border border-indigo-200 font-mono">
                    1 USD x {formatNumberWithDots(usdRate)} CUP
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-1">
                  Descripción del Producto / Servicio
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>

              {/* Subdepartamento y Etiquetas (Solo mostrar subdepartamentos y etiquetas) */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
                <h4 className="text-xs font-extrabold uppercase text-slate-800 tracking-wider flex items-center gap-1.5 border-b border-slate-200/80 pb-1.5">
                  <Tag className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Subdepartamento y Etiquetas</span>
                </h4>

                {product.subcategory && (
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase text-indigo-700">
                      Subdepartamento:
                    </span>
                    <span className="font-bold text-slate-900 text-xs">{product.subcategory}</span>
                  </div>
                )}

                {displayTags.length > 0 && (
                  <div className="pt-1">
                    <span className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1.5">
                      Etiquetas:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {displayTags.map((tagName, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200"
                        >
                          <Tag className="w-3 h-3 text-emerald-700" />
                          <span>{tagName}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Store Box */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/90 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <ThemeImage
                      src={getStoreLogoUrl(store)}
                      alt={store.name}
                      fallbackType="store"
                      className="w-14 h-14 rounded-xl border border-slate-300 shrink-0 shadow-xs bg-white"
                    />
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <h5 className="font-extrabold text-slate-900 text-sm truncate">
                          {store.name}
                        </h5>
                        {store.badge && (
                          <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full shrink-0">
                            {store.badge}
                          </span>
                        )}
                      </div>

                      {store.slogan && (
                        <p className="text-xs font-semibold text-indigo-600 italic">
                          “{store.slogan}”
                        </p>
                      )}

                      <div className="flex items-center gap-1 text-xs text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{formatNormalizedAddressText(store)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rates & payment quick info */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Tasa aplicada:</span>
                  <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    1 USD x {formatNumberWithDots(usdRate)} CUP
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <button
                onClick={handleOpenWhatsApp}
                className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md text-sm cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 fill-current" />
                <span>Contactar por WhatsApp</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleCopyMessage}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? '¡Copiado!' : 'Copiar Texto'}</span>
                </button>

                <button
                  onClick={handleViewStoreProducts}
                  className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs cursor-pointer border border-indigo-200"
                >
                  <StoreIcon className="w-4 h-4" />
                  <span>Ver Tienda</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
