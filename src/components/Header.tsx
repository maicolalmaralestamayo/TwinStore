import React from 'react';
import { CurrencyDisplayMode, Store, Product, MarketplaceConfig } from '../types';
import { ThemeImage } from './common/ThemeImage';
import { ThemeSelector } from './common/ThemeSelector';
import { useTheme } from '../context/ThemeContext';
import { interfaz } from '../data/interfaz';
import {
  Store as StoreIcon,
  ShieldCheck,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';

interface HeaderProps {
  stores: Store[];
  products: Product[];
  marketplaceConfig: MarketplaceConfig;
  currencyMode: CurrencyDisplayMode;
  onCurrencyChange: (mode: CurrencyDisplayMode) => void;
  activeView: 'public' | 'admin';
  onSwitchView: (view: 'public' | 'admin') => void;
  publicSubView?: 'products' | 'stores';
  onPublicSubViewChange?: (view: 'products' | 'stores') => void;
  onOpenStoresModal: () => void;
  isAdminAuthenticated: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  stores,
  products = [],
  marketplaceConfig,
  currencyMode,
  onCurrencyChange,
  activeView,
  onSwitchView,
  publicSubView = 'products',
  onPublicSubViewChange,
  onOpenStoresModal,
  isAdminAuthenticated,
}) => {
  const { theme, resolvedTheme, setTheme } = useTheme();

  // Extract branding configuration
  const displayName = marketplaceConfig?.name || 'TwinStore';
  const displaySlogan = marketplaceConfig?.slogan || interfaz.header.defaultSlogan;
  const logoUrl = marketplaceConfig?.logoUrl || '';
  const primaryColor = marketplaceConfig?.primaryColor || '#4f46e5';
  const secondaryColor = marketplaceConfig?.secondaryColor || '#0284c7';

  // Format name nicely
  const nameParts = displayName.trim().split(/\s+/);
  const firstWord = nameParts[0];
  const restWords = nameParts.slice(1).join(' ');

  // Calculate active stores & active products metrics
  const activeStores = stores.filter((s) => s.active);
  const activeStoreIds = new Set(activeStores.map((s) => s.id));
  const activeProducts = products.filter(
    (p) => p.isAvailable !== false && activeStoreIds.has(p.storeId)
  );

  // Exchange rate statistics
  const rates = activeStores.map((s) => s.usdToCupRate).filter(Boolean);
  const avgRate = rates.length > 0 ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : 675;
  const minRate = rates.length > 0 ? Math.min(...rates) : 675;
  const maxRate = rates.length > 0 ? Math.max(...rates) : 675;
  const rateRangeText = minRate === maxRate ? `${minRate} CUP` : `${minRate} - ${maxRate} CUP`;

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
      {/* Main header bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => onSwitchView('public')}
            className="cursor-pointer flex items-center gap-2.5 group"
          >
            <ThemeImage
              id="marketplace-header-logo"
              src={logoUrl}
              alt={displayName}
              fallbackType="logo"
              className="w-10 h-10 rounded-lg shadow-xs group-hover:scale-105 transition-transform border border-slate-200 dark:border-slate-700 shrink-0 bg-white dark:bg-slate-800"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span
                  id="marketplace-header-name"
                  className="font-bold text-xl sm:text-2xl tracking-tight text-slate-800 dark:text-white"
                >
                  {firstWord}
                  {restWords ? (
                    <span style={{ color: primaryColor }} className="font-medium ml-1">
                      {restWords}
                    </span>
                  ) : (
                    <span style={{ color: primaryColor }}>•</span>
                  )}
                </span>
                <span
                  style={{
                    backgroundColor: `${secondaryColor}20`,
                    color: secondaryColor,
                    borderColor: `${secondaryColor}40`,
                  }}
                  className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-md border"
                >
                  Marketplace
                </span>
              </div>
              <p
                id="marketplace-header-slogan"
                className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block"
              >
                {displaySlogan}
              </p>
            </div>
          </div>
        </div>

        {/* Center/Right Metrics & Tools */}
        <div className="flex items-center flex-wrap gap-1.5 sm:gap-2.5">
          {/* Average Exchange Rate Tag - Visible everywhere, text hidden on mobile/tablets */}
          <div
            title={`${interfaz.header.avgRateLabel} 1 USD = ${avgRate} CUP (Rango: ${rateRangeText})`}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold shadow-2xs"
          >
            <TrendingUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="hidden lg:inline text-slate-600 dark:text-slate-400 font-semibold">{interfaz.header.avgRateLabel}</span>
            <span>1 USD = {avgRate} CUP</span>
          </div>

          {/* Active Products and Services Badge */}
          <div
            title={`${activeProducts.length} ${interfaz.header.productsCountLabel} en el catálogo`}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold shadow-2xs"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="hidden lg:inline text-slate-600 dark:text-slate-400 font-semibold">{interfaz.header.productsBadge}</span>
            <span>{activeProducts.length}</span>
          </div>

          {/* Directory of Active Stores and Providers Badge - Static display tag */}
          <div
            title={`${activeStores.length} ${interfaz.header.inStoresLabel}`}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold shadow-2xs select-none"
          >
            <StoreIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="hidden lg:inline text-slate-600 dark:text-slate-400 font-semibold">{interfaz.header.storesBadge}</span>
            <span>{activeStores.length}</span>
          </div>

          {/* Theme Selector (Claro / Oscuro / Sistema) */}
          <ThemeSelector
            theme={theme}
            resolvedTheme={resolvedTheme}
            onThemeChange={setTheme}
          />

          {/* Admin / CEO Portal Toggle */}
          <button
            type="button"
            onClick={() => onSwitchView(activeView === 'admin' ? 'public' : 'admin')}
            title={activeView === 'admin' ? interfaz.header.btnCatalogTitle : interfaz.header.btnCeoTitle}
            aria-label={activeView === 'admin' ? interfaz.header.btnCatalogTitle : interfaz.header.btnCeoTitle}
            style={
              activeView === 'admin'
                ? { backgroundColor: primaryColor, color: '#ffffff' }
                : {}
            }
            className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-extrabold transition-all shadow-xs cursor-pointer ${
              activeView === 'admin'
                ? ''
                : isAdminAuthenticated
                ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900'
                : 'bg-slate-900 dark:bg-slate-700 text-white hover:bg-slate-800 dark:hover:bg-slate-600'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span className="hidden xs:inline">{activeView === 'admin' ? interfaz.header.btnCatalog : interfaz.header.btnCeo}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
