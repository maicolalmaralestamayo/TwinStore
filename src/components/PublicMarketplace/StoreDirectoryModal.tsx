import React, { useState } from 'react';
import { Store, Product } from '../../types';
import { ThemeImage } from '../common/ThemeImage';
import {
  X,
  Store as StoreIcon,
  MapPin,
  MessageCircle,
  Search,
  BadgeCheck,
  Truck,
  CreditCard,
  Navigation,
} from 'lucide-react';
import {
  displayCubanPhone,
  generateStoreWhatsAppUrl,
  formatNormalizedAddressText,
  getStoreGoogleMapsUrl,
  getStoreLogoUrl,
  formatNumberWithDots,
} from '../../lib/utils';

interface StoreDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  stores: Store[];
  products: Product[];
  onSelectStore: (storeId: string) => void;
}

export const StoreDirectoryModal: React.FC<StoreDirectoryModalProps> = ({
  isOpen,
  onClose,
  stores,
  products,
  onSelectStore,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const activeStores = stores
    .filter((s) => s.active)
    .filter(
      (s) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.slogan && s.slogan.toLowerCase().includes(searchTerm.toLowerCase())) ||
        s.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formatNormalizedAddressText(s).toLowerCase().includes(searchTerm.toLowerCase())
    );

  const getStoreProductCount = (storeId: string) => {
    return products.filter((p) => p.storeId === storeId).length;
  };

  const handleWhatsAppContact = (store: Store, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = generateStoreWhatsAppUrl(store);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleOpenGoogleMaps = (store: Store, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getStoreGoogleMapsUrl(store);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between shrink-0 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <StoreIcon className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-xl font-black">Directorio de Tiendas y Proveedores</h3>
              <p className="text-xs text-slate-300">
                Información normalizada: Dirección, WhatsApp, Google Maps, Tasas de cambio y Tipo de pago
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Cerrar directorio"
            aria-label="Cerrar directorio"
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar tienda o proveedor por nombre, municipio, calle..."
              title="Buscar en el directorio"
              aria-label="Buscar en el directorio"
              className="w-full pl-10 pr-10 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:border-indigo-500 outline-none"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                title="Limpiar búsqueda"
                aria-label="Limpiar búsqueda"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Stores list */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeStores.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              <StoreIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="font-semibold">No se encontraron tiendas o proveedores que coincidan.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {activeStores.map((store) => {
                const count = getStoreProductCount(store.id);
                const fullAddress = formatNormalizedAddressText(store);
                const pay = store.paymentOptions;

                return (
                  <div
                    key={store.id}
                    className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 hover:shadow-lg transition-all flex flex-col justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <ThemeImage
                        src={getStoreLogoUrl(store)}
                        alt={store.name}
                        fallbackType="store"
                        className="w-16 h-16 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0 shadow-xs bg-white dark:bg-slate-800"
                      />
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-black text-slate-900 dark:text-white text-base truncate">
                            {store.name}
                          </h4>
                          {store.badge && (
                            <span className="inline-flex items-center gap-1 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 border border-indigo-200 dark:border-indigo-700">
                              <BadgeCheck className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                              {store.badge}
                            </span>
                          )}
                        </div>

                        {store.slogan && (
                          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 italic line-clamp-1">
                            “{store.slogan}”
                          </p>
                        )}

                        <div className="flex items-start gap-1 text-xs text-slate-600 dark:text-slate-300 pt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{fullAddress}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {store.description}
                    </p>

                    {/* Pill badges: delivery & payments */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          store.deliveryAvailable
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <Truck className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                        {store.deliveryAvailable ? 'Mensajería' : 'Recogida en tienda'}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          pay?.transferAccepted
                            ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <CreditCard className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                        {pay?.transferAccepted
                          ? `Transferencia (${pay.transferFeePercentage || 0}%)`
                          : 'Efectivo'}
                      </span>

                      {pay?.acceptedCurrencies && pay.acceptedCurrencies.map((c) => (
                        <span
                          key={c}
                          className="text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full"
                        >
                          {c}
                        </span>
                      ))}
                    </div>

                    {/* Exchange Rate highlight & Product count */}
                    <div className="bg-indigo-50/70 dark:bg-slate-800/80 border border-indigo-100 dark:border-slate-700 rounded-xl p-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-indigo-800 dark:text-indigo-300 font-bold uppercase block">
                          Tasa USD/CUP:
                        </span>
                        <strong className="text-indigo-900 dark:text-indigo-200 font-extrabold text-sm font-mono">
                          1 USD x {formatNumberWithDots(store.usdToCupRate)} CUP
                        </strong>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">
                          WhatsApp:
                        </span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {displayCubanPhone(store.whatsappPhone)}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectStore(store.id);
                          onClose();
                        }}
                        title={`Ver los ${count} productos y servicios de ${store.name}`}
                        aria-label={`Ver los ${count} productos y servicios de ${store.name}`}
                        className="flex-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
                      >
                        <span>Ver productos ({count})</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleOpenGoogleMaps(store, e)}
                        className="py-2 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold transition-colors flex items-center justify-center gap-1 border border-blue-200 dark:border-blue-800 cursor-pointer"
                        title="Ver dirección en Google Maps"
                        aria-label="Ver dirección en Google Maps"
                      >
                        <Navigation className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span className="hidden sm:inline">Mapa</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleWhatsAppContact(store, e)}
                        className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer whitespace-nowrap"
                        title="Contactar al proveedor por WhatsApp"
                        aria-label="Contactar al proveedor por WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-current shrink-0" />
                        <span>Contactar por WhatsApp</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400 shrink-0">
          Mostrando <strong>{activeStores.length}</strong> tiendas y proveedores con información normalizada
        </div>
      </div>
    </div>
  );
};
