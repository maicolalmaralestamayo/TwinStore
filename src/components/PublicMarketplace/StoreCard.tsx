import React from 'react';
import { Store } from '../../types';
import { ThemeImage } from '../common/ThemeImage';
import {
  displayCubanPhone,
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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden p-5 gap-4">
      {/* Top Header: Logo + Info */}
      <div className="flex items-start gap-4">
        <ThemeImage
          src={getStoreLogoUrl(store)}
          alt={store.name}
          fallbackType="store"
          className="w-16 h-16 rounded-xl border border-slate-200 shrink-0 shadow-xs bg-white"
        />

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-black text-slate-900 text-base sm:text-lg truncate">
              {store.name}
            </h4>
            {store.badge && (
              <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full shrink-0">
                {store.badge}
              </span>
            )}
          </div>

          {store.slogan && (
            <p className="text-xs font-medium text-indigo-600 line-clamp-1 italic">
              “{store.slogan}”
            </p>
          )}

          {/* Tasa de cambio: 1 USD x 328 CUP */}
          <div className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200/80 font-mono">
            <span>Tasa:</span>
            <span className="text-indigo-800 font-extrabold">
              1 USD x {formatNumberWithDots(store.usdToCupRate || 330)} CUP
            </span>
          </div>
        </div>
      </div>

      {/* Description & Address */}
      <div className="space-y-2 text-xs text-slate-600">
        <p className="line-clamp-2 leading-relaxed text-slate-500">
          {store.description}
        </p>

        <div className="flex items-start justify-between gap-2 pt-1 border-t border-slate-100">
          <div className="flex items-start gap-1 text-slate-700 min-w-0">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span className="truncate">{normalizedAddress}</span>
          </div>

          <button
            onClick={handleMaps}
            className="text-[11px] font-bold text-blue-600 hover:text-blue-800 shrink-0 flex items-center gap-1 cursor-pointer"
            title="Ver en Google Maps"
          >
            <Navigation className="w-3 h-3" />
            <span>Mapa</span>
          </button>
        </div>
      </div>

      {/* Badges: Domicilio, Transferencia, Teléfono y Cantidad de Productos */}
      <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-[10px] font-bold">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${
            store.deliveryAvailable
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-slate-100 text-slate-500'
          }`}
        >
          <Truck className="w-3 h-3" />
          {store.deliveryAvailable ? 'Domicilio: SÍ' : 'Sin Domicilio'}
        </span>

        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${
            store.paymentOptions?.transferAccepted
              ? 'bg-purple-50 text-purple-800 border border-purple-200'
              : 'bg-slate-100 text-slate-500'
          }`}
        >
          <CreditCard className="w-3 h-3" />
          {store.paymentOptions?.transferAccepted
            ? `Transferencia (${store.paymentOptions.transferFeePercentage || 0}%)`
            : 'Solo Efectivo'}
        </span>

        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200 ml-auto">
          <ShoppingBag className="w-3 h-3" />
          <span>{productsCount} ofertas</span>
        </span>
      </div>

      {/* Actions: Ver Productos + Contactar WhatsApp */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          onClick={() => onViewStoreProducts(store.id)}
          className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs cursor-pointer border border-indigo-200"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Ver Ofertas</span>
        </button>

        <button
          onClick={handleWhatsApp}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs cursor-pointer shadow-xs"
        >
          <MessageCircle className="w-3.5 h-3.5 fill-current" />
          <span>Contactar</span>
        </button>
      </div>
    </div>
  );
};
