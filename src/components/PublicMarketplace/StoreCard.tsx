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
  MapPin,
  MessageCircle,
  Truck,
  BadgeCheck,
  Package,
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

  const usdRate = store.usdToCupRate || 330;
  const normalizedAddress = formatNormalizedAddressText(store);
  const mainImage = store.images && store.images.length > 0 ? store.images[0] : getStoreLogoUrl(store);

  return (
    <div
      onClick={handleCardClick}
      className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden cursor-pointer relative"
    >
      {/* 1. Foto principal del establecimiento / tienda */}
      <div className="relative h-48 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <ThemeImage
          src={mainImage}
          alt={store.name}
          fallbackType="store"
          className="w-full h-full"
          imgClassName="group-hover:scale-105 transition-transform duration-500 object-cover w-full h-full"
        />

        {/* Badges superiores: Tasa de cambio y Sello/Publicaciones */}
        <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 items-start">
          <div className="bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs border border-white/10 font-mono">
            {interfaz.productCard.ratePrefix} {formatNumberWithDots(usdRate)} {interfaz.productCard.rateSuffix}
          </div>

          {store.badge ? (
            <span className="inline-flex items-center gap-1 bg-indigo-600/95 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs">
              <BadgeCheck className="w-3 h-3" />
              <span>{store.badge}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-indigo-600/95 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs">
              <Package className="w-3 h-3" />
              <span>{productsCount} ofertas</span>
            </span>
          )}
        </div>

        {/* Badge superior derecho: Mensajería */}
        {store.deliveryAvailable && (
          <div className="absolute top-2.5 right-2.5 z-10">
            <span className="inline-flex items-center gap-1 bg-blue-600/90 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs border border-white/10">
              <Truck className="w-3 h-3" />
              <span>Mensajería</span>
            </span>
          </div>
        )}
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
        <div className="pt-2">
          <button
            type="button"
            onClick={handleWhatsApp}
            className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs text-xs sm:text-sm cursor-pointer"
            title={`Contactar a ${store.name} por WhatsApp`}
            aria-label={`Contactar a ${store.name} por WhatsApp`}
          >
            <MessageCircle className="w-4 h-4 shrink-0 fill-current" />
            <span>{interfaz.storeCard.contactButton || 'Contactar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
