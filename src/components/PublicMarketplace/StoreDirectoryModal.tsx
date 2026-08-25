import React, { useState } from 'react';
import { Store, Product } from '../../types';
import { ThemeImage } from '../common/ThemeImage';
import {
  X,
  Store as StoreIcon,
  MapPin,
  MessageCircle,
  Search,
  ExternalLink,
  Phone,
  RefreshCw,
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between shrink-0 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <StoreIcon className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <h3 className="text-xl font-black">Directorio de Tiendas y Proveedores en Cuba</h3>
              <p className="text-xs text-slate-300">
                Información normalizada: Dirección, WhatsApp, Google Maps, Tasas de cambio y Medios de pago
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar tienda por nombre, municipio, calle o especialidad..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 bg-white text-sm focus:border-indigo-500 outline-none"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Stores list */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeStores.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <StoreIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="font-semibold">No se encontraron tiendas que coincidan.</p>
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
                    className="bg-white rounded-2xl border border-gray-200/90 p-5 hover:shadow-lg transition-all flex flex-col justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <ThemeImage
                        src={getStoreLogoUrl(store)}
                        alt={store.name}
                        fallbackType="store"
                        className="w-16 h-16 rounded-xl border border-gray-200 shrink-0 shadow-xs bg-white"
                      />
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-black text-gray-900 text-base truncate">
                            {store.name}
                          </h4>
                          {store.badge && (
                            <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                              <BadgeCheck className="w-3 h-3" />
                              {store.badge}
                            </span>
                          )}
                        </div>

                        {store.slogan && (
                          <p className="text-xs font-semibold text-indigo-600 italic line-clamp-1">
                            “{store.slogan}”
                          </p>
                        )}

                        <div className="flex items-start gap-1 text-xs text-slate-600 pt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{fullAddress}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {store.description}
                    </p>

                    {/* Relational normalized data pill badges: delivery & payments */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          store.deliveryAvailable
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        <Truck className="w-3 h-3" />
                        {store.deliveryAvailable ? 'Mensajería Domicilio: SÍ' : 'Sin Mensajería'}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          pay?.transferAccepted
                            ? 'bg-purple-50 text-purple-800 border border-purple-200'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        <CreditCard className="w-3 h-3" />
                        {pay?.transferAccepted
                          ? `Transferencia (${pay.transferFeePercentage || 0}% comisión)`
                          : 'Solo Efectivo'}
                      </span>

                      {pay?.acceptedCurrencies && pay.acceptedCurrencies.map((c) => (
                        <span
                          key={c}
                          className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80 px-2 py-0.5 rounded-full"
                        >
                          {c}
                        </span>
                      ))}
                    </div>

                    {/* Exchange Rate highlight & Product count */}
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-indigo-800 font-bold uppercase block">
                          Tasa de cambio USD/CUP:
                        </span>
                        <strong className="text-indigo-900 font-extrabold text-sm font-mono">
                          1 USD x {formatNumberWithDots(store.usdToCupRate)} CUP
                        </strong>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                          WhatsApp del local:
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          {displayCubanPhone(store.whatsappPhone)}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => {
                          onSelectStore(store.id);
                          onClose();
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Ver catálogo ({count})</span>
                      </button>

                      <button
                        onClick={(e) => handleOpenGoogleMaps(store, e)}
                        className="py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors flex items-center justify-center gap-1 border border-blue-200 cursor-pointer"
                        title="Ver dirección en Google Maps"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Mapa</span>
                      </button>

                      <button
                        onClick={(e) => handleWhatsAppContact(store, e)}
                        className="py-2 px-3 rounded-xl bg-green-500 hover:bg-green-600 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                        title="Contactar al proveedor por WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500 shrink-0">
          Mostrando <strong>{activeStores.length}</strong> tiendas del marketplace en Cuba con información normalizada
        </div>
      </div>
    </div>
  );
};

