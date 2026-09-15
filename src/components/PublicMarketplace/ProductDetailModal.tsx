import React, { useState, useEffect, useMemo } from 'react';
import { Product, Store, MarketplaceConfig } from '../../types';
import { ThemeImage } from '../common/ThemeImage';
import {
  formatNumberWithDots,
  calculateCUP,
  generateWhatsAppOrderUrl,
  getStoreLogoUrl,
  extractProductDisplayTags,
  getProductPricesInAllowedCurrencies,
  getProductAllowedExchangeRates,
} from '../../lib/utils';
import {
  X,
  MessageCircle,
  Copy,
  Check,
  Store as StoreIcon,
  MapPin,
  Tag,
  FolderTree,
  Hash,
  Coins,
  DollarSign,
  FileText,
  Briefcase,
  ShoppingBag,
  Percent,
  Truck,
  CreditCard,
  Layers,
  Info,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  INITIAL_PAYMENT_METHODS_CATALOG,
  INITIAL_DELIVERY_METHODS_CATALOG,
  INITIAL_PRODUCT_TYPES_CATALOG,
} from '../../data/initialData';
import { StoreDetailModal } from './StoreDetailModal';

interface ProductDetailModalProps {
  product: Product | null;
  store: Store | null;
  onClose: () => void;
  onFilterByStore?: (storeId: string) => void;
  onShowToast: (title: string, desc?: string, type?: 'success' | 'info' | 'error') => void;
  marketplaceConfig?: MarketplaceConfig;
  products?: Product[];
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  store,
  onClose,
  onShowToast,
  marketplaceConfig,
  products = [],
}) => {
  const [copied, setCopied] = useState(false);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);

  // Gallery of images
  const gallery = useMemo(() => {
    if (!product) return [];
    if (product.images && product.images.length > 0) {
      return product.images;
    }
    if (product.imageUrl) {
      return [product.imageUrl];
    }
    return ['local:product'];
  }, [product]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    setActiveImageIndex(0);
    setIsStoreModalOpen(false);
  }, [product]);

  // Catalogs resolution
  const paymentMethodsCatalog =
    marketplaceConfig?.paymentMethodsCatalog || INITIAL_PAYMENT_METHODS_CATALOG;
  const deliveryMethodsCatalog =
    marketplaceConfig?.deliveryMethodsCatalog || INITIAL_DELIVERY_METHODS_CATALOG;
  const productTypesCatalog =
    marketplaceConfig?.productTypesCatalog || INITIAL_PRODUCT_TYPES_CATALOG;

  // Superetiquetas y etiquetas
  // Group tag selections by Superetiqueta (group)
  const supertagGroups = useMemo(() => {
    const groupsMap: { [key: string]: string[] } = {};
    if (product?.tagSelections && product.tagSelections.length > 0) {
      product.tagSelections.forEach((ts) => {
        const groupName = ts.groupName || ts.group || 'General';
        const tagValue = ts.tagName || ts.value;
        if (tagValue) {
          if (!groupsMap[groupName]) {
            groupsMap[groupName] = [];
          }
          if (!groupsMap[groupName].includes(tagValue)) {
            groupsMap[groupName].push(tagValue);
          }
        }
      });
    }
    return Object.entries(groupsMap).map(([group, tags]) => ({ group, tags }));
  }, [product?.tagSelections]);

  // Tipo de pago y gravamen
  // Resolve payment methods with their gravamen from store or catalog
  const storePaymentMethodsWithGravamen = useMemo(() => {
    if (!store) return [];
    if (store.paymentMethodIds && store.paymentMethodIds.length > 0) {
      return store.paymentMethodIds
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
    }

    // Fallback if no paymentMethodIds
    const methods = [
      { id: 'cash', name: 'Efectivo', gravamen: 0, description: 'Pago directo en mano' },
    ];
    if (store.paymentOptions?.transferAccepted) {
      methods.push({
        id: 'transfer',
        name: 'Transferencia Bancaria',
        gravamen: store.paymentOptions.transferFeePercentage || 5,
        description: 'Transfermóvil / EnZona',
      });
    }
    return methods;
  }, [store, paymentMethodsCatalog]);

  // Tipo de mensajería
  const storeDeliveryMethods = useMemo(() => {
    if (!store) return [];
    if (store.deliveryMethodIds && store.deliveryMethodIds.length > 0) {
      return store.deliveryMethodIds
        .map((dmId) => deliveryMethodsCatalog.find((dm) => dm.id === dmId))
        .filter(Boolean);
    }
    if (store.deliveryAvailable) {
      return [
        { id: 'dm-mensajeria', name: 'Mensajería a Domicilio', description: 'Entrega directa con mensajero' },
        { id: 'dm-recogida', name: 'Recogida en Tienda / Local', description: 'Retiro presencial en sede' },
      ];
    }
    return [
      { id: 'dm-recogida', name: 'Recogida en Tienda / Local', description: 'Retiro presencial por el cliente' },
    ];
  }, [store, deliveryMethodsCatalog]);

  if (!product || !store) return null;

  const activeImage = gallery[activeImageIndex] || gallery[0] || 'local:product';

  // Precios en monedas admitidas para este producto específico (según tasas permitidas por la tienda)
  const productPrices = getProductPricesInAllowedCurrencies(product, store);
  const primaryPriceItem = productPrices[0] || {
    currency: product.currency || 'USD',
    amount: product.price !== undefined && product.price !== null ? product.price : (product.priceUSD || 0),
    rate: 1,
    isOriginal: true,
  };
  const alternatePrices = productPrices.filter((p) => !p.isOriginal);
  const allowedRates = getProductAllowedExchangeRates(product, store);

  // Fallback for legacy cupPrice if used anywhere else
  const cupPrice = alternatePrices.find(p => p.currency === 'CUP')?.amount ?? calculateCUP(primaryPriceItem.amount, store.usdToCupRate || 330);

  // Tipo de oferta
  const isServiceItem =
    product.productTypeId === 'pt-servicio' ||
    (product.productType || '').toLowerCase().includes('servicio') ||
    Boolean((product as any).isService);

  const matchedProductType = productTypesCatalog.find(
    (pt) => pt.id === product.productTypeId || pt.name.toLowerCase() === (product.productType || '').toLowerCase()
  );
  const offerTypeName = matchedProductType?.name || product.productType || (isServiceItem ? 'Servicios Profesionales' : 'Productos Físicos');

  // Departamento y subdepartamento
  const departmentName = product.category || 'General';
  const subdepartmentName = product.subcategory || 'General';

  const generalDisplayTags = extractProductDisplayTags(product);

  // Reparto, municipio y provincia
  const reparto = store.address?.neighborhood || 'No especificado';
  const municipio = store.address?.municipality || 'No especificado';
  const provincia = store.address?.province || 'No especificado';

  // Tipos de pago (Formas y monedas aceptadas)
  const acceptedCurrencies = store.paymentOptions?.acceptedCurrencies || ['CUP', 'USD'];

  // WhatsApp Order
  const handleOpenWhatsApp = () => {
    const url = generateWhatsAppOrderUrl(product, store);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyMessage = () => {
    const priceText = productPrices.map(p => `${formatNumberWithDots(p.amount)} ${p.currency}`).join(' / ');
    const orderMessageText = `¡Hola! 👋 Vi su publicación:\n*${product.title}*${product.code ? ` (Cód: ${product.code})` : ''}\n💵 Precio: ${priceText}\n🏪 Tienda: ${store.name}\n\nMe interesa este ${isServiceItem ? 'servicio' : 'producto'}. ¿Tienen disponibilidad en este momento?`;
    navigator.clipboard.writeText(orderMessageText);
    setCopied(true);
    onShowToast('Mensaje copiado', 'Puedes pegarlo en WhatsApp o SMS con el vendedor');
    setTimeout(() => setCopied(false), 2500);
  };

  const prevImage = () => {
    setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : gallery.length - 1));
  };

  const nextImage = () => {
    setActiveImageIndex((prev) => (prev < gallery.length - 1 ? prev + 1 : 0));
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
        onClick={onClose}
      >
        <div
          className="relative bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header sticky with Close button & Product Title */}
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-0.5">
                Detalles de la Publicación
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                {product.title}
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
          {/* INFORMACIÓN UNA DEBAJO DE OTRA (ORDEN ESTRICTO SOLICITADO)                */}
          {/* ========================================================================= */}
          <div className="overflow-y-auto p-4 sm:p-6 space-y-5 text-slate-800 dark:text-slate-100">

            {/* IMÁGENES */}
            <div className="space-y-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Imágenes
              </span>
              <div className="relative w-full h-64 sm:h-80 bg-slate-100 dark:bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex items-center justify-center group shadow-2xs">
                <ThemeImage
                  src={activeImage}
                  alt={product.title}
                  fallbackType="product"
                  className="w-full h-full object-contain sm:object-cover"
                />

                {gallery.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={prevImage}
                      title="Imagen anterior"
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity cursor-pointer shadow-md"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={nextImage}
                      title="Siguiente imagen"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity cursor-pointer shadow-md"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-2.5 right-2.5 bg-black/70 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
                      {activeImageIndex + 1} / {gallery.length}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {gallery.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5">
                  {gallery.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      title={`Ver foto ${idx + 1}`}
                      className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer bg-slate-100 dark:bg-slate-900 ${
                        activeImageIndex === idx
                          ? 'border-indigo-600 dark:border-indigo-400 scale-105 shadow-sm ring-2 ring-indigo-500/20'
                          : 'border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <ThemeImage
                        src={img}
                        alt={`Miniatura ${idx + 1}`}
                        fallbackType="product"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* CÓDIGO */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1.5">
                <Hash className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Código Único</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-sm sm:text-base px-3 py-1 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 tracking-wider shadow-2xs">
                  {product.code || 'SIN-CODIGO'}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Identificador irrepetible en el catálogo
                </span>
              </div>
            </div>

            {/* DESCRIPCIÓN */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Descripción</span>
              </span>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line font-medium">
                {product.description || 'Sin descripción detallada por el vendedor.'}
              </p>
            </div>

            {/* PRECIO */}
            <div className="bg-indigo-50/70 dark:bg-slate-800/90 p-4 rounded-2xl border border-indigo-100 dark:border-slate-700">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-800 dark:text-indigo-300 flex items-center gap-1.5 mb-2">
                <DollarSign className="w-3.5 h-3.5" />
                <span>Precio y Monedas de Cobro Permitidas</span>
              </span>
              <div className="grid gap-3 items-center grid-cols-1 sm:grid-cols-2">
                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-indigo-200/80 dark:border-slate-700">
                  <span className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 block mb-0.5">
                    Precio en {primaryPriceItem.currency} (Moneda del Producto)
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    {formatNumberWithDots(primaryPriceItem.amount)} {primaryPriceItem.currency}
                  </div>
                </div>

                {alternatePrices.length > 0 ? (
                  alternatePrices.map((alt) => (
                    <div key={alt.currency} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-indigo-200/80 dark:border-slate-700">
                      <span className="text-[10px] font-extrabold uppercase text-indigo-700 dark:text-indigo-300 block mb-0.5">
                        Equivalente en {alt.currency} (Tasa: {alt.rate})
                      </span>
                      <div className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                        {formatNumberWithDots(alt.amount)} {alt.currency}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white/60 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Este producto no tiene tasas secundarias habilitadas; se cobra exclusivamente en {primaryPriceItem.currency}.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* TASA DE CAMBIO */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1.5">
                <Coins className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Tasas de Cambio Aplicables</span>
              </span>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                    Tasas de la Tienda ({store.name})
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {allowedRates.length > 0
                      ? 'Tasas de cambio permitidas específicamente para el cobro de este producto'
                      : `Este producto solo se cobra en su moneda original (${primaryPriceItem.currency})`}
                  </div>
                </div>
                {allowedRates.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {allowedRates.map((r) => (
                      <div
                        key={r.id}
                        className="font-mono font-black text-xs sm:text-sm bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs"
                      >
                        1 {r.fromCurrency} = {formatNumberWithDots(r.rate)} {r.toCurrency}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="font-mono font-bold text-xs bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                    Sin conversión alterna
                  </div>
                )}
              </div>
            </div>

            {/* TIPO DE OFERTA */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1.5">
                <Briefcase className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Tipo de Oferta</span>
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 text-xs sm:text-sm font-black px-3 py-1 rounded-xl border ${
                    isServiceItem
                      ? 'bg-sky-50 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                      : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  }`}
                >
                  {isServiceItem ? <Briefcase className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
                  <span>{offerTypeName}</span>
                </span>
                {matchedProductType?.description && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                    ({matchedProductType.description})
                  </span>
                )}
              </div>
            </div>

            {/* DEPARTAMENTO Y SUBDEPARTAMENTO */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <FolderTree className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Departamento y Subdepartamento</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-0.5">
                    Departamento Principal
                  </span>
                  <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <FolderTree className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>{departmentName}</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-0.5">
                    Subdepartamento
                  </span>
                  <div className="text-xs sm:text-sm font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>{subdepartmentName}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SUPERETIQUETAS Y ETIQUETAS */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Superetiquetas y Etiquetas</span>
              </span>

              {supertagGroups.length > 0 ? (
                <div className="space-y-2">
                  {supertagGroups.map((grp, idx) => (
                    <div
                      key={idx}
                      className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 flex-wrap"
                    >
                      <span className="text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/70 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                        Superetiqueta: {grp.group}
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {grp.tags.map((tVal, tIdx) => (
                          <span
                            key={tIdx}
                            className="text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700"
                          >
                            {tVal}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : generalDisplayTags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {generalDisplayTags.map((tagItem, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700"
                    >
                      <Tag className="w-3 h-3 text-indigo-500" />
                      <span>{tagItem}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-slate-500 dark:text-slate-400 italic">
                  No se han registrado etiquetas adicionales para esta publicación.
                </span>
              )}
            </div>

            {/* TIENDA A LA QUE PERTENECE */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-2">
                <StoreIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Tienda a la que Pertenece</span>
              </span>

              <div className="flex items-center gap-3.5 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <ThemeImage
                  src={getStoreLogoUrl(store)}
                  alt={store.name}
                  fallbackType="store"
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                      {store.name}
                    </h4>
                    {store.badge && (
                      <span className="text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-700">
                        {store.badge}
                      </span>
                    )}
                  </div>
                  {store.slogan && (
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 italic font-medium line-clamp-1">
                      “{store.slogan}”
                    </p>
                  )}
                  {store.location && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {store.location}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* REPARTO, MUNICIPIO Y PROVINCIA */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Reparto, Municipio y Provincia</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">
                    Reparto
                  </span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
                    {reparto}
                  </span>
                </div>

                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">
                    Municipio
                  </span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
                    {municipio}
                  </span>
                </div>

                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">
                    Provincia
                  </span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
                    {provincia}
                  </span>
                </div>
              </div>
            </div>

            {/* TIPO DE PAGO Y GRAVAMEN */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Tipo de Pago y Gravamen</span>
              </span>

              <div className="space-y-1.5">
                {storePaymentMethodsWithGravamen.map((pm, idx) => (
                  <div
                    key={idx}
                    className="bg-white dark:bg-slate-900 p-2.5 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white block">
                        {pm.name}
                      </span>
                      {pm.description && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                          {pm.description}
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-xs font-black font-mono px-2.5 py-1 rounded-lg shrink-0 ${
                        pm.gravamen > 0
                          ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                          : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                      }`}
                    >
                      {pm.gravamen > 0 ? `+${pm.gravamen}% de gravamen` : '0% Gravamen'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* TIPO DE MENSAJERÍA */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Tipo de Mensajería</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {storeDeliveryMethods.map((dm, idx) => (
                  <div
                    key={idx}
                    className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2"
                  >
                    <Truck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white block truncate">
                        {dm?.name}
                      </span>
                      {dm?.description && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                          {dm.description}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* TIPOS DE PAGO */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Tipos de Pago (Formas y Monedas Aceptadas)</span>
              </span>

              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span className="font-bold text-slate-600 dark:text-slate-300">Formas de pago:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {storePaymentMethodsWithGravamen.map((m) => m.name).join(' • ') || 'Efectivo'}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-1">
                  <span className="font-bold text-slate-600 dark:text-slate-300">Monedas aceptadas:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {acceptedCurrencies.map((c) => (
                      <span
                        key={c}
                        className="font-mono font-black text-[11px] px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* ========================================================================= */}
          {/* BOTONES DE ACCIÓN AL FINAL:                                               */}
          {/* - Botón de contactar (WhatsApp)                                          */}
          {/* - Botón que abre modal con datos de la tienda (SIN cambios en filtros)   */}
          {/* ========================================================================= */}
          <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md space-y-2.5 shrink-0">
            {/* Botón Principal de Contactar */}
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              title="Contactar por WhatsApp para pedir este producto o servicio"
              aria-label="Contactar por WhatsApp"
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black py-3 px-5 rounded-2xl flex items-center justify-center gap-2.5 transition-all shadow-md text-sm cursor-pointer"
            >
              <MessageCircle className="w-5 h-5 fill-current" />
              <span>Contactar por WhatsApp</span>
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Botón secundario para copiar texto prefabricado */}
              <button
                type="button"
                onClick={handleCopyMessage}
                title="Copiar mensaje preparado"
                className="w-full bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors border border-slate-200 dark:border-slate-700 text-xs cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                <span>{copied ? '¡Texto Copiado!' : 'Copiar Texto del Pedido'}</span>
              </button>

              {/* Botón que abre el modal con los datos de la tienda (sin modificar filtros de búsqueda) */}
              <button
                type="button"
                onClick={() => setIsStoreModalOpen(true)}
                title={`Ver toda la información y datos de la tienda ${store.name}`}
                aria-label={`Ver datos de la tienda ${store.name}`}
                className="w-full bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors border border-indigo-200 dark:border-indigo-800 text-xs cursor-pointer shadow-2xs"
              >
                <StoreIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Ver Datos de la Tienda</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal con los datos completos de la tienda (NO modifica los filtros de búsqueda) */}
      <StoreDetailModal
        isOpen={isStoreModalOpen}
        store={store}
        onClose={() => setIsStoreModalOpen(false)}
        marketplaceConfig={marketplaceConfig}
        products={products}
      />
    </>
  );
};
