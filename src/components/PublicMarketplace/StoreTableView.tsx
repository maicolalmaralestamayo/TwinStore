import React from 'react';
import { Store, Product } from '../../types';
import { ThemeImage } from '../common/ThemeImage';
import {
  formatNormalizedAddressText,
  generateStoreWhatsAppUrl,
} from '../../lib/utils';
import {
  Eye,
  MessageCircle,
  MapPin,
  ExternalLink,
  Truck,
  CreditCard,
  ShoppingBag,
  Star,
  Coins,
} from 'lucide-react';

interface StoreTableViewProps {
  stores: Store[];
  products: Product[];
  onSelectStore: (store: Store) => void;
  onViewStoreProducts: (storeId: string) => void;
}

export const StoreTableView: React.FC<StoreTableViewProps> = ({
  stores,
  products,
  onSelectStore,
  onViewStoreProducts,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3.5 px-4">Tienda / Proveedor</th>
              <th className="py-3.5 px-4">Ubicación</th>
              <th className="py-3.5 px-4">Tasas & Monedas</th>
              <th className="py-3.5 px-4">Formas de Entrega</th>
              <th className="py-3.5 px-4">Métodos de Pago</th>
              <th className="py-3.5 px-4">Catálogo</th>
              <th className="py-3.5 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {stores.map((store) => {
              const storeProductsCount = products.filter(
                (p) => p.storeId === store.id && p.isAvailable !== false
              ).length;
              const whatsAppUrl = generateStoreWhatsAppUrl(store);
              const addressText = formatNormalizedAddressText(store);

              return (
                <tr
                  key={store.id}
                  className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                  onClick={() => onSelectStore(store)}
                >
                  {/* Tienda */}
                  <td className="py-3 px-4 min-w-[220px]">
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0 w-11 h-11 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                        <ThemeImage
                          src={store.logoUrl}
                          alt={store.name}
                          fallbackType="store"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-sm">
                            {store.name}
                          </h4>
                          {store.rating && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200/50">
                              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-500" />
                              {store.rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                        {store.slogan && (
                          <p className="text-xs text-slate-500 line-clamp-1">
                            {store.slogan}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Ubicación */}
                  <td className="py-3 px-4 min-w-[170px]">
                    <div className="flex flex-col gap-1 text-xs">
                      <div className="flex items-center gap-1 text-slate-700 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="line-clamp-1">
                          {store.address?.province || 'Sin provincia'}
                          {store.address?.municipality ? `, ${store.address.municipality}` : ''}
                        </span>
                      </div>
                      {store.address?.neighborhood && (
                        <span className="text-[11px] text-slate-400 pl-4.5 line-clamp-1">
                          {store.address.neighborhood}
                        </span>
                      )}
                      {store.address?.googleMapsUrl && (
                        <a
                          href={store.address.googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold pl-4.5"
                        >
                          <span>Ver en mapa</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </td>

                  {/* Tasas & Monedas */}
                  <td className="py-3 px-4 min-w-[150px]">
                    <div className="flex flex-col gap-1">
                      <div className="inline-flex items-center gap-1 text-xs font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100 w-fit">
                        <Coins className="w-3 h-3 text-indigo-600" />
                        <span>1 USD = {store.usdToCupRate || 330} CUP</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Base: {store.baseCurrency || 'USD'}
                      </span>
                    </div>
                  </td>

                  {/* Formas de Entrega */}
                  <td className="py-3 px-4 min-w-[140px]">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold ${
                          store.deliveryAvailable ? 'text-emerald-700' : 'text-slate-500'
                        }`}
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>{store.deliveryAvailable ? 'Mensajería' : 'Recogida en local'}</span>
                      </span>
                      {store.deliveryCoverage && (
                        <span className="text-[10px] text-slate-400 line-clamp-1">
                          {store.deliveryCoverage}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Métodos de Pago */}
                  <td className="py-3 px-4 min-w-[150px]">
                    <div className="flex flex-col gap-1 text-xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                          Efectivo
                        </span>
                        {store.paymentOptions?.transferAccepted && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-medium text-[11px] border border-emerald-100">
                            Transferencia
                          </span>
                        )}
                      </div>
                      {store.paymentOptions?.transferAccepted &&
                        store.paymentOptions?.transferFeePercent !== undefined &&
                        store.paymentOptions.transferFeePercent > 0 && (
                          <span className="text-[10px] text-amber-700 font-bold">
                            +{store.paymentOptions.transferFeePercent}% recargo
                          </span>
                        )}
                    </div>
                  </td>

                  {/* Catálogo */}
                  <td className="py-3 px-4 min-w-[120px]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewStoreProducts(store.id);
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{storeProductsCount} ofertas</span>
                    </button>
                  </td>

                  {/* Acciones */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div
                      className="inline-flex items-center gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => onSelectStore(store)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors cursor-pointer"
                        title="Ver detalles de la tienda"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Ver</span>
                      </button>

                      {whatsAppUrl && (
                        <a
                          href={whatsAppUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
                          title="Contactar por WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
