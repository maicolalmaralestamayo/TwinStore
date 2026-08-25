import React, { useRef } from 'react';
import {
  MessageCircle,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Store as StoreIcon,
  Truck,
  CreditCard,
  ShoppingBag,
} from 'lucide-react';
import { MarketplaceConfig, Store } from '../../types';
import { ThemeImage } from '../common/ThemeImage';
import { getStoreLogoUrl, formatNumberWithDots } from '../../lib/utils';

interface HeroBannerProps {
  stores?: Store[];
  storesCount: number;
  productsCount: number;
  onOpenSearch: () => void;
  onFilterByStore?: (storeId: string) => void;
  onOpenStoreWhatsApp?: (store: Store) => void;
  marketplaceConfig?: MarketplaceConfig;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  stores = [],
  storesCount,
  productsCount,
  onOpenSearch,
  onFilterByStore,
  onOpenStoreWhatsApp,
  marketplaceConfig,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const bannerUrl = marketplaceConfig?.bannerUrl || '';
  const slogan = marketplaceConfig?.slogan || '';
  const bannerTitle = marketplaceConfig?.bannerTitle || 'Compra directo a tiendas por WhatsApp';
  const bannerSubtitle =
    marketplaceConfig?.bannerSubtitle ||
    'Sin pasarelas de pago ni intermediarios. Explora productos y servicios de múltiples proveedores, compara precios con la tasa de cambio USD/CUP de cada tienda y coordina tu compra con un solo clic.';

  const activeStores = stores.filter((s) => s.active);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 280;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl sm:rounded-3xl shadow-md border border-slate-700/80 mb-8">
      {/* Background Banner Image or dynamic vector banner illustration */}
      <div className="absolute inset-0 z-0">
        <ThemeImage
          src={bannerUrl}
          alt="Marketplace Banner"
          fallbackType="banner"
          className="w-full h-full opacity-25 object-cover"
        />
      </div>

      {/* Subtle decorative background circles */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 px-4 sm:px-8 py-6 sm:py-10 max-w-6xl mx-auto space-y-8">
        {/* Top Hero Grid */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs sm:text-sm font-semibold">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              {slogan || 'El Marketplace para el Comercio en Cuba'}
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
              {bannerTitle}
            </h1>

            <p className="text-slate-300 text-sm sm:text-base max-w-xl leading-relaxed">
              {bannerSubtitle}
            </p>
          </div>

          {/* Quick Stats / Action Callout */}
          <div className="w-full md:w-auto bg-white/10 backdrop-blur-md border border-white/15 p-5 sm:p-6 rounded-2xl flex flex-col items-center text-center gap-4 min-w-[240px] shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Smartphone className="w-6 h-6" />
            </div>

            <div>
              <p className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">
                Catálogo Activo
              </p>
              <div className="flex items-baseline justify-center gap-2 mt-1">
                <span className="text-3xl font-extrabold text-white">{productsCount}</span>
                <span className="text-sm text-slate-300">productos</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                en <strong className="text-slate-200">{storesCount} tiendas</strong> conectadas
              </p>
            </div>

            <button
              onClick={onOpenSearch}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Explorar Ofertas</span>
            </button>
          </div>
        </div>

        {/* Carrusel de Tiendas del Marketplace */}
        {activeStores.length > 0 && (
          <div className="pt-4 border-t border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StoreIcon className="w-4 h-4 text-emerald-400" />
                <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-200">
                  Tiendas del Marketplace ({activeStores.length})
                </h2>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleScroll('left')}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 transition-all cursor-pointer"
                  title="Anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleScroll('right')}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 transition-all cursor-pointer"
                  title="Siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Carousel */}
            <div
              ref={scrollRef}
              className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x scroll-smooth"
            >
              {activeStores.map((st) => {
                const addr = st.address;
                const locStr = addr
                  ? `${addr.province || ''}${addr.municipality ? ', ' + addr.municipality : ''}`
                  : st.location;

                return (
                  <div
                    key={st.id}
                    className="bg-slate-900/60 hover:bg-slate-900/80 border border-white/15 hover:border-emerald-500/50 backdrop-blur-md rounded-2xl p-3.5 flex flex-col justify-between min-w-[240px] max-w-[260px] shrink-0 snap-start transition-all duration-200 group/card shadow-sm"
                  >
                    <div className="space-y-2">
                      {/* Top Header: Logo + Name + Tasa Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <ThemeImage
                            src={getStoreLogoUrl(st, marketplaceConfig?.defaultStoreLogoUrl)}
                            alt={st.name}
                            fallbackType="store"
                            className="w-8 h-8 rounded-full border border-white/20 shrink-0 bg-white object-cover"
                          />
                          <div className="min-w-0">
                            <h3 className="font-extrabold text-sm text-white truncate group-hover/card:text-emerald-300 transition-colors">
                              {st.name}
                            </h3>
                            <span className="text-[10px] text-emerald-400 font-mono font-bold block">
                              1 USD x {formatNumberWithDots(st.usdToCupRate)} CUP
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Location & Services */}
                      <div className="space-y-1 text-xs text-slate-300">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                          <MapPin className="w-3 h-3 text-indigo-400 shrink-0" />
                          <span className="truncate">{locStr || 'Cuba'}</span>
                        </div>

                        <div className="flex flex-wrap gap-1 text-[10px] pt-1">
                          {st.deliveryAvailable && (
                            <span className="inline-flex items-center gap-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.5 rounded font-semibold">
                              <Truck className="w-2.5 h-2.5" /> Envíos
                            </span>
                          )}
                          {st.paymentOptions?.transferAccepted && (
                            <span className="inline-flex items-center gap-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded font-semibold">
                              <CreditCard className="w-2.5 h-2.5" /> Transfer.
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 mt-2 border-t border-white/10 flex items-center gap-2">
                      <button
                        onClick={() => onFilterByStore?.(st.id)}
                        className="flex-1 py-1.5 px-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all flex items-center justify-center gap-1 border border-white/10 cursor-pointer"
                        title="Filtrar catálogo de esta tienda"
                      >
                        <ShoppingBag className="w-3 h-3 text-indigo-300" />
                        <span>Ver tienda</span>
                      </button>

                      {onOpenStoreWhatsApp && (
                        <button
                          onClick={() => onOpenStoreWhatsApp(st)}
                          className="py-1.5 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                          title="Contactar directo por WhatsApp"
                        >
                          <MessageCircle className="w-3 h-3 fill-current" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

