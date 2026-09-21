import React, { useState, useEffect, useMemo } from 'react';
import {
  Store,
  Product,
  CategoryType,
  FilterState,
  StoreFilterState,
  CurrencyDisplayMode,
  ToastMessage,
  MarketplaceConfig,
  CartItem,
  StoreCartPreferences,
} from './types';
import {
  INITIAL_STORES,
  INITIAL_PRODUCTS,
  INITIAL_CATEGORIES,
  INITIAL_MARKETPLACE_CONFIG,
} from './data/initialData';
import { calculateProductPriceInCurrency, calculateCUP, generateStoreWhatsAppUrl, formatNormalizedAddressText } from './lib/utils';
import {
  getStorePaymentMethodsForCurrency,
  getStoreAcceptedCurrencies,
} from './lib/cartUtils';
import {
  fetchStoresApi,
  saveStoreApi,
  deleteStoreApi,
  fetchProductsApi,
  saveProductApi,
  deleteProductApi,
  fetchConfigApi,
  saveConfigApi,
  restoreDbApi,
  fetchInterfazApi,
  saveInterfazApi,
} from './lib/api';
import { Header } from './components/Header';
import { ThemeImage } from './components/common/ThemeImage';
import { ToastContainer } from './components/Toast';
import { AdvancedSearch } from './components/PublicMarketplace/AdvancedSearch';
import { ProductCard } from './components/PublicMarketplace/ProductCard';
import { ProductTableView } from './components/PublicMarketplace/ProductTableView';
import { StoreCard } from './components/PublicMarketplace/StoreCard';
import { StoreTableView } from './components/PublicMarketplace/StoreTableView';
import { StoreFilterBar } from './components/PublicMarketplace/StoreFilterBar';
import { ProductDetailModal } from './components/PublicMarketplace/ProductDetailModal';
import { StoreDetailModal } from './components/PublicMarketplace/StoreDetailModal';
import { StoreDirectoryModal } from './components/PublicMarketplace/StoreDirectoryModal';
import { CartModal } from './components/Cart/CartModal';
import { AdminLoginModal } from './components/AdminPortal/AdminLoginModal';
import { AdminDashboard } from './components/AdminPortal/AdminDashboard';
import { interfaz, setLiveInterfaz } from './data/interfaz';
import { InterfazProvider } from './context/InterfazContext';
import {
  MessageCircle,
  ShoppingBag,
  Store as StoreIcon,
  HelpCircle,
  Instagram,
  Facebook,
  Linkedin,
  Share2,
  Send,
  Twitter,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Table,
  Eye,
  ExternalLink,
  MapPin,
  CheckCircle2,
  XCircle,
  ShoppingCart,
} from 'lucide-react';

const LOCAL_STORAGE_KEYS = {
  STORES: 'mc_stores_v1',
  PRODUCTS: 'mc_products_v1',
  CURRENCY_MODE: 'mc_currency_mode_v1',
  CONFIG: 'mc_config_v1',
  CART: 'mc_cart_items_v1',
  CART_PREFS: 'mc_cart_prefs_v1',
};

const DEFAULT_FILTERS: FilterState = {
  searchQuery: '',
  storeIds: [],
  categories: [],
  subcategories: [],
  tagGroups: [],
  tagValues: [],
  provinces: [],
  municipalities: [],
  repartos: [],
  itemTypes: [], // empty = both products and services
  paymentMethods: [], // empty = all payment methods
  deliveryMethods: [], // empty = all delivery methods
  priceCurrency: 'USD',
  minPrice: '',
  maxPrice: '',
  availabilityOnly: false,
  deliveryOnly: false,
  transferOnly: false,
  serviceOnly: false,
  category: 'ALL',
  subcategory: 'ALL',
  storeId: 'ALL',
  location: 'ALL',
  province: 'ALL',
  municipality: 'ALL',
  reparto: 'ALL',
  tagGroup: 'ALL',
  tagValue: 'ALL',
  sortBy: 'featured',
};

const DEFAULT_STORE_FILTERS: StoreFilterState = {
  searchQuery: '',
  provinces: [],
  municipalities: [],
  repartos: [],
  paymentMethods: [],
  deliveryMethods: [],
  deliveryOnly: false,
  transferOnly: false,
  province: 'ALL',
  municipality: 'ALL',
  reparto: 'ALL',
};

export default function App() {
  // --- Persistent State ---
  const [stores, setStores] = useState<Store[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.STORES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_STORES;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.PRODUCTS);
      if (saved) {
        const parsed: Product[] = JSON.parse(saved);
        return parsed.map((p) => {
          const initialMatch = INITIAL_PRODUCTS.find((ip) => ip.id === p.id);
          return {
            ...p,
            subcategory: p.subcategory || initialMatch?.subcategory,
            tagSelections:
              p.tagSelections && p.tagSelections.length > 0
                ? p.tagSelections
                : initialMatch?.tagSelections || [],
          };
        });
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_PRODUCTS;
  });

  const [currencyMode, setCurrencyMode] = useState<CurrencyDisplayMode>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.CURRENCY_MODE) as CurrencyDisplayMode;
      if (saved) return saved;
    } catch (e) {
      console.error(e);
    }
    return 'BOTH';
  });

  const [marketplaceConfig, setMarketplaceConfig] = useState<MarketplaceConfig>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.CONFIG);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_MARKETPLACE_CONFIG,
          ...parsed,
          defaultProductImageUrl:
            parsed.defaultProductImageUrl || INITIAL_MARKETPLACE_CONFIG.defaultProductImageUrl,
          accentColor: parsed.accentColor || INITIAL_MARKETPLACE_CONFIG.accentColor,
          socialLinks: {
            ...INITIAL_MARKETPLACE_CONFIG.socialLinks,
            ...(parsed.socialLinks || {}),
          },
          geoCatalog:
            Array.isArray(parsed.geoCatalog) && parsed.geoCatalog.length > 0
              ? parsed.geoCatalog
              : INITIAL_MARKETPLACE_CONFIG.geoCatalog,
          departmentsCatalog:
            Array.isArray(parsed.departmentsCatalog) && parsed.departmentsCatalog.length > 0
              ? parsed.departmentsCatalog
              : INITIAL_MARKETPLACE_CONFIG.departmentsCatalog,
          tagsCatalog:
            Array.isArray(parsed.tagsCatalog) && parsed.tagsCatalog.length > 0
              ? parsed.tagsCatalog
              : INITIAL_MARKETPLACE_CONFIG.tagsCatalog,
        };
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_MARKETPLACE_CONFIG;
  });

  // --- UI State ---
  const [activeView, setActiveView] = useState<'public' | 'admin'>('public');
  const [publicSubView, setPublicSubView] = useState<'products' | 'stores'>('products');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isStoresModalOpen, setIsStoresModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [storeFilters, setStoreFilters] = useState<StoreFilterState>(DEFAULT_STORE_FILTERS);
  const [productCurrentPage, setProductCurrentPage] = useState<number>(1);
  const [storeCurrentPage, setStoreCurrentPage] = useState<number>(1);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // --- Shopping Cart State & Persistence ---
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.CART);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [storeCartPreferences, setStoreCartPreferences] = useState<Record<string, StoreCartPreferences>>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.CART_PREFS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {};
  });

  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  const totalCartCount = useMemo(() => {
    return cartItems.reduce((acc, curr) => acc + curr.quantity, 0);
  }, [cartItems]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEYS.CART, JSON.stringify(cartItems));
    } catch (e) {
      console.error(e);
    }
  }, [cartItems]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEYS.CART_PREFS, JSON.stringify(storeCartPreferences));
    } catch (e) {
      console.error(e);
    }
  }, [storeCartPreferences]);

  const handleAddToCart = (product: Product, quantity = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { productId: product.id, quantity, addedAt: new Date().toISOString() }];
    });
    showToast(
      'Añadido al carrito',
      `${product.title} (+${quantity}) añadido al carrito`,
      'success'
    );
  };

  const handleUpdateCartQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    setCartItems((prev) => {
      const existing = prev.find((item) => item.productId === productId);
      if (existing) {
        return prev.map((item) =>
          item.productId === productId ? { ...item, quantity: newQuantity } : item
        );
      }
      return [...prev, { productId, quantity: newQuantity, addedAt: new Date().toISOString() }];
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleUpdateStorePreferences = (storeId: string, prefs: Partial<StoreCartPreferences>) => {
    setStoreCartPreferences((prev) => ({
      ...prev,
      [storeId]: {
        ...prev[storeId],
        ...prefs,
      },
    }));
  };

  const handleUpdateItemPreferences = (productId: string, prefs: Partial<CartItem>) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, ...prefs } : item
      )
    );
  };

  // Persistent filter accordion expansion state (memory across views & reloads, collapsed by default)
  const [isProductFilterExpanded, setIsProductFilterExpanded] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('mc_product_filter_expanded');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  const [isStoreFilterExpanded, setIsStoreFilterExpanded] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('mc_store_filter_expanded');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  const toggleProductFilterExpanded = () => {
    setIsProductFilterExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('mc_product_filter_expanded', String(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  // View modes: cards or table
  const [productViewMode, setProductViewMode] = useState<'cards' | 'table'>('cards');
  const [storeViewMode, setStoreViewMode] = useState<'cards' | 'table'>('cards');

  const toggleStoreFilterExpanded = () => {
    setIsStoreFilterExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('mc_store_filter_expanded', String(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  // Constants for pagination
  const PRODUCTS_PER_PAGE = 10;
  const STORES_PER_PAGE = 10;

  // Reset product page to 1 whenever product filters change
  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setProductCurrentPage(1);
  };

  // Reset store page to 1 whenever store filters change
  const handleStoreFilterChange = (newStoreFilters: StoreFilterState) => {
    setStoreFilters(newStoreFilters);
    setStoreCurrentPage(1);
  };

  // --- Initial SQLite Load & Sync ---
  useEffect(() => {
    let isMounted = true;
    async function loadSqliteData() {
      try {
        const [dbStores, dbProducts, dbConfig, dbInterfaz] = await Promise.all([
          fetchStoresApi(),
          fetchProductsApi(),
          fetchConfigApi(),
          fetchInterfazApi(),
        ]);
        if (!isMounted) return;
        if (dbStores && dbStores.length > 0) {
          setStores(dbStores);
        }
        if (dbProducts && dbProducts.length > 0) {
          setProducts(dbProducts);
        }
        const effectiveUiTexts = dbInterfaz || dbConfig?.uiTexts;
        if (effectiveUiTexts) {
          setLiveInterfaz(effectiveUiTexts);
        }
        if (dbConfig) {
          setMarketplaceConfig((prev) => ({
            ...prev,
            ...dbConfig,
            uiTexts: effectiveUiTexts || prev.uiTexts,
            geoCatalog:
              Array.isArray(dbConfig.geoCatalog) && dbConfig.geoCatalog.length > 0
                ? dbConfig.geoCatalog
                : prev.geoCatalog,
            departmentsCatalog:
              Array.isArray(dbConfig.departmentsCatalog) && dbConfig.departmentsCatalog.length > 0
                ? dbConfig.departmentsCatalog
                : prev.departmentsCatalog,
            tagsCatalog:
              Array.isArray(dbConfig.tagsCatalog) && dbConfig.tagsCatalog.length > 0
                ? dbConfig.tagsCatalog
                : prev.tagsCatalog,
          }));
        } else if (effectiveUiTexts) {
          setMarketplaceConfig((prev) => ({
            ...prev,
            uiTexts: effectiveUiTexts,
          }));
        }
      } catch (err) {
        console.error('Error cargando datos de SQLite:', err);
      }
    }
    loadSqliteData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync to localStorage as offline secondary backup
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.STORES, JSON.stringify(stores));
  }, [stores]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.CURRENCY_MODE, currencyMode);
  }, [currencyMode]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.CONFIG, JSON.stringify(marketplaceConfig));
  }, [marketplaceConfig]);

  // Dynamic Browser Tab Title & Favicon updating based on marketplace config
  useEffect(() => {
    const marketplaceName = marketplaceConfig?.name || 'TwinStore';
    document.title = marketplaceName;

    let faviconLink = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    if (!faviconLink) {
      faviconLink = document.createElement('link');
      faviconLink.rel = 'icon';
      document.head.appendChild(faviconLink);
    }

    if (marketplaceConfig.logoUrl && (marketplaceConfig.logoUrl.startsWith('http') || marketplaceConfig.logoUrl.startsWith('data:'))) {
      faviconLink.href = marketplaceConfig.logoUrl;
    } else {
      const primary = marketplaceConfig.primaryColor || '#4f46e5';
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="${primary}"/><path d="M7 10h18l-2 14H9L7 10z" fill="white"/><path d="M12 10V7a4 4 0 0 1 8 0v3" stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none"/><path d="M12 17l3 3 5-5" stroke="${primary}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`;
      faviconLink.href = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    }
  }, [marketplaceConfig.name, marketplaceConfig.logoUrl, marketplaceConfig.primaryColor]);

  // --- Toast Handler ---
  const showToast = (
    title: string,
    description?: string,
    type: 'success' | 'info' | 'error' = 'success'
  ) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, title, description, type }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // --- Switch View Handler ---
  const handleSwitchView = (view: 'public' | 'admin') => {
    if (view === 'admin' && !isAdminAuthenticated) {
      setIsLoginModalOpen(true);
    } else {
      setActiveView(view);
    }
  };

  const handleLoginSuccess = () => {
    setIsAdminAuthenticated(true);
    setIsLoginModalOpen(false);
    setActiveView('admin');
  };

  const handleLogout = () => {
    setIsAdminAuthenticated(false);
    setActiveView('public');
    showToast('Sesión cerrada', 'Saliste del Área de Administración', 'info');
  };

  // --- Store Handlers ---
  const handleAddStore = (newStoreData: Omit<Store, 'id' | 'createdAt'>) => {
    const defaultLogo = marketplaceConfig.defaultStoreLogoUrl || 'local:store';
    const finalLogo = newStoreData.logoUrl?.trim() || defaultLogo;
    const finalImages =
      newStoreData.images && newStoreData.images.length > 0
        ? newStoreData.images
        : [finalLogo];

    const newStore: Store = {
      ...newStoreData,
      logoUrl: finalLogo,
      images: finalImages,
      id: `store-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setStores((prev) => [newStore, ...prev]);
    saveStoreApi(newStore);
  };

  const handleUpdateStore = (updated: Store) => {
    setStores((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    saveStoreApi(updated);
  };

  const handleDeleteStore = (storeId: string) => {
    setStores((prev) => prev.filter((s) => s.id !== storeId));
    deleteStoreApi(storeId);
  };

  const handleUpdateStoreRate = (storeId: string, newRate: number) => {
    setStores((prev) => {
      const updatedList = prev.map((s) => (s.id === storeId ? { ...s, usdToCupRate: newRate } : s));
      const targetStore = updatedList.find((s) => s.id === storeId);
      if (targetStore) saveStoreApi(targetStore);
      return updatedList;
    });
  };

  const handleUpdateAllStoresRate = (newRate: number) => {
    setStores((prev) => {
      const updatedList = prev.map((s) => ({ ...s, usdToCupRate: newRate }));
      updatedList.forEach((s) => saveStoreApi(s));
      return updatedList;
    });
  };

  const handleUpdateMarketplaceConfig = (newConfig: MarketplaceConfig) => {
    if (newConfig.uiTexts) {
      setLiveInterfaz(newConfig.uiTexts);
      saveInterfazApi(newConfig.uiTexts);
    }
    setMarketplaceConfig(newConfig);
    saveConfigApi(newConfig);
  };

  // --- Product Handlers ---
  const handleAddProduct = (newProdData: Omit<Product, 'id' | 'createdAt'>) => {
    const defaultProductImage = marketplaceConfig.defaultProductImageUrl || 'local:product';
    const finalImg = newProdData.imageUrl?.trim() || defaultProductImage;
    const finalImages =
      newProdData.images && newProdData.images.length > 0
        ? newProdData.images
        : [finalImg];

    const newProd: Product = {
      ...newProdData,
      imageUrl: finalImg,
      images: finalImages,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setProducts((prev) => [newProd, ...prev]);
    saveProductApi(newProd);
  };

  const handleUpdateProduct = (updated: Product) => {
    const finalProd: Product = {
      ...updated,
      imageUrl:
        updated.imageUrl?.trim() ||
        marketplaceConfig.defaultProductImageUrl ||
        'local:product',
    };
    setProducts((prev) => prev.map((p) => (p.id === finalProd.id ? finalProd : p)));
    saveProductApi(finalProd);
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    deleteProductApi(productId);
  };

  // --- Backup / Restore Handlers ---
  const handleRestoreDefaults = () => {
    setStores(INITIAL_STORES);
    setProducts(INITIAL_PRODUCTS);
    setMarketplaceConfig(INITIAL_MARKETPLACE_CONFIG);
    restoreDbApi({
      stores: INITIAL_STORES,
      products: INITIAL_PRODUCTS,
      config: INITIAL_MARKETPLACE_CONFIG,
    });
  };

  const handleImportData = (importedStores: Store[], importedProducts: Product[]) => {
    setStores(importedStores);
    setProducts(importedProducts);
    restoreDbApi({
      stores: importedStores,
      products: importedProducts,
    });
  };

  // --- Filtered and Sorted Products ---
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // 1. Check Store Active status
      const store = stores.find((s) => s.id === p.storeId);
      if (store && !store.active) return false;

      // 1b. Offer Type (Nomenclador Dinámico de Tipos de Oferta)
      const pTypeId = p.productTypeId || (p.isService ? 'pt-servicio' : 'pt-producto');
      const isServ =
        pTypeId === 'pt-servicio' ||
        (p.productType || '').toLowerCase().includes('servicio') ||
        Boolean((p as any).isService);

      if (filters.productTypes && filters.productTypes.length > 0) {
        if (!filters.productTypes.includes(pTypeId) && !filters.productTypes.includes(p.productType || '')) {
          return false;
        }
      } else if (filters.itemTypes && filters.itemTypes.length > 0) {
        const matchesType = filters.itemTypes.some((selected) => {
          if (selected === 'product' || selected === 'pt-producto') return !isServ;
          if (selected === 'service' || selected === 'pt-servicio') return isServ;
          return selected === pTypeId || selected === p.productType;
        });
        if (!matchesType) return false;
      } else if (filters.serviceOnly) {
        if (!isServ) return false;
      }

      // 2. Search query filter (Búsqueda estrictamente por descripción)
      if (filters.searchQuery?.trim()) {
        const q = filters.searchQuery.toLowerCase().trim();
        const matchesDesc = (p.description || '').toLowerCase().includes(q);
        if (!matchesDesc) {
          return false;
        }
      }

      // 2b. Specific Product Code filter (Búsqueda por código de producto o servicio)
      if (filters.code?.trim()) {
        const codeQuery = filters.code.toLowerCase().trim();
        if (!p.code || !p.code.toLowerCase().includes(codeQuery)) {
          return false;
        }
      }

      // 3. Category (Departamento) filter (Multiselect)
      if (filters.categories && filters.categories.length > 0) {
        if (!filters.categories.includes(p.category)) {
          return false;
        }
      } else if (filters.category && filters.category !== 'ALL' && p.category !== filters.category) {
        return false;
      }

      // 3b. Subcategory (Subdepartamento) filter (Multiselect)
      if (filters.subcategories && filters.subcategories.length > 0) {
        if (!p.subcategory || !filters.subcategories.includes(p.subcategory)) {
          return false;
        }
      } else if (
        filters.subcategory &&
        filters.subcategory !== 'ALL' &&
        p.subcategory !== filters.subcategory
      ) {
        return false;
      }

      // 4. Store filter (Multiselect)
      if (filters.storeIds && filters.storeIds.length > 0) {
        if (!filters.storeIds.includes(p.storeId)) {
          return false;
        }
      } else if (filters.storeId && filters.storeId !== 'ALL' && p.storeId !== filters.storeId) {
        return false;
      }

      // 5. Price filter (evaluated in selected currency)
      const evalPrice = calculateProductPriceInCurrency(p, store, filters.priceCurrency || 'USD');

      if (filters.minPrice !== '' && evalPrice < Number(filters.minPrice)) {
        return false;
      }
      if (filters.maxPrice !== '' && evalPrice > Number(filters.maxPrice)) {
        return false;
      }

      // 6. Availability filter
      if (filters.availabilityOnly && !p.isAvailable) {
        return false;
      }

      // 7. Delivery filter (Nomenclador Dinámico)
      if (filters.deliveryMethods && filters.deliveryMethods.length > 0) {
        const storeDeliveryIds: string[] = store?.deliveryMethodIds && store.deliveryMethodIds.length > 0
          ? store.deliveryMethodIds
          : store?.deliveryAvailable
          ? ['dm-mensajeria', 'delivery']
          : ['dm-recogida', 'pickup'];
        const prodDeliveryIds: string[] = p.deliveryMethodIds || [];
        const allDeliveryIds = [...storeDeliveryIds, ...prodDeliveryIds];

        const matchesDelivery = filters.deliveryMethods.some((selected) => {
          if (selected === 'delivery' || selected === 'dm-mensajeria') {
            return allDeliveryIds.includes('dm-mensajeria') || allDeliveryIds.includes('delivery') || Boolean(store?.deliveryAvailable) || Boolean(p.deliveryAvailable);
          }
          if (selected === 'pickup' || selected === 'dm-recogida') {
            return allDeliveryIds.includes('dm-recogida') || allDeliveryIds.includes('pickup') || !store?.deliveryAvailable;
          }
          return allDeliveryIds.includes(selected);
        });
        if (!matchesDelivery) return false;
      } else if (filters.deliveryOnly && (!store?.deliveryAvailable && !p.deliveryAvailable)) {
        return false;
      }

      // 7b. Transfer / Payment filter (Relación Moneda ↔ Forma de Pago)
      if (filters.paymentMethods && filters.paymentMethods.length > 0) {
        const itemCurrency = p.currency || store?.baseCurrency || 'USD';
        const validPayMethods = store
          ? getStorePaymentMethodsForCurrency(store, itemCurrency, marketplaceConfig.paymentMethodsCatalog)
          : [
              { id: 'pm-efectivo', name: 'Efectivo', gravamen: 0 },
              { id: 'pm-transferencia', name: 'Transferencia', gravamen: 0 },
            ];
        const validPayIds = validPayMethods.map((pm) => pm.id);
        const prodPayIds: string[] = p.paymentMethodIds || [];
        const allPayIds = [...validPayIds, ...prodPayIds];

        const matchesPayment = filters.paymentMethods.some((selected) => {
          if (selected === 'transfer' || selected === 'pm-transferencia') {
            return (
              allPayIds.includes('pm-transferencia') ||
              allPayIds.includes('transfer') ||
              Boolean(store?.paymentOptions?.transferAccepted)
            );
          }
          if (selected === 'cash' || selected === 'pm-efectivo') {
            return allPayIds.includes('pm-efectivo') || allPayIds.includes('cash');
          }
          return allPayIds.includes(selected);
        });
        if (!matchesPayment) return false;
      } else if (filters.transferOnly) {
        const itemCurrency = p.currency || store?.baseCurrency || 'USD';
        const validPayMethods = store
          ? getStorePaymentMethodsForCurrency(store, itemCurrency, marketplaceConfig.paymentMethodsCatalog)
          : [];
        const hasTransfer = validPayMethods.some(
          (pm) => pm.id === 'pm-transferencia' || pm.id.toLowerCase().includes('transfer')
        );
        if (!hasTransfer) return false;
      }

      // 8. Location filter (3-Tier Address: Provincia, Municipio, Reparto) (Multiselect)
      if (store) {
        const storeProv = store.address?.province || (store as any).province || '';
        const storeMun = store.address?.municipality || (store as any).municipality || '';
        const storeRep = store.address?.neighborhood || (store as any).reparto || (store as any).neighborhood || '';

        if (filters.provinces && filters.provinces.length > 0) {
          const matchesProv = filters.provinces.includes(storeProv);
          if (!matchesProv) return false;
        } else if (filters.province && filters.province !== 'ALL') {
          const matchesProv =
            storeProv === filters.province ||
            store.location?.toLowerCase().includes(filters.province.toLowerCase());
          if (!matchesProv) return false;
        }

        if (filters.municipalities && filters.municipalities.length > 0) {
          const matchesMun = filters.municipalities.includes(storeMun);
          if (!matchesMun) return false;
        } else if (filters.municipality && filters.municipality !== 'ALL') {
          const matchesMun =
            storeMun === filters.municipality ||
            store.location?.toLowerCase().includes(filters.municipality.toLowerCase());
          if (!matchesMun) return false;
        }

        if (filters.repartos && filters.repartos.length > 0) {
          const matchesRep = filters.repartos.includes(storeRep);
          if (!matchesRep) return false;
        } else if (filters.reparto && filters.reparto !== 'ALL') {
          const matchesRep =
            storeRep === filters.reparto ||
            store.location?.toLowerCase().includes(filters.reparto.toLowerCase());
          if (!matchesRep) return false;
        }
      }

      // 9. 2-Tier Tags Filter (Superetiquetas and Etiquetas) (Multiselect)
      if (filters.tagGroups && filters.tagGroups.length > 0) {
        const matchesGroup = p.tagSelections?.some(
          (ts) =>
            filters.tagGroups?.includes(ts.groupName || '') ||
            filters.tagGroups?.includes(ts.group || '') ||
            filters.tagGroups?.includes(ts.groupId || '')
        );
        if (!matchesGroup) return false;
      } else if (filters.tagGroup && filters.tagGroup !== 'ALL') {
        const matchesGroup = p.tagSelections?.some(
          (ts) => ts.groupName === filters.tagGroup || ts.group === filters.tagGroup || ts.groupId === filters.tagGroup
        );
        if (!matchesGroup) return false;
      }

      if (filters.tagValues && filters.tagValues.length > 0) {
        const matchesTag =
          p.tagSelections?.some(
            (ts) =>
              filters.tagValues?.includes(ts.tagName || '') ||
              filters.tagValues?.includes(ts.value || '') ||
              filters.tagValues?.includes(ts.tagId || '')
          ) || p.tags.some((t) => filters.tagValues?.some((tv) => tv.toLowerCase() === t.toLowerCase()));
        if (!matchesTag) return false;
      } else if (filters.tagValue && filters.tagValue !== 'ALL') {
        const matchesTag =
          p.tagSelections?.some(
            (ts) =>
              ts.tagName === filters.tagValue ||
              ts.value === filters.tagValue ||
              ts.tagId === filters.tagValue
          ) || p.tags.some((t) => t.toLowerCase() === filters.tagValue?.toLowerCase());
        if (!matchesTag) return false;
      }

      return true;
    }).sort((a, b) => {
      const storeA = stores.find((s) => s.id === a.storeId);
      const storeB = stores.find((s) => s.id === b.storeId);
      const priceA = calculateProductPriceInCurrency(a, storeA, filters.priceCurrency || 'USD');
      const priceB = calculateProductPriceInCurrency(b, storeB, filters.priceCurrency || 'USD');

      if (filters.sortBy === 'price_asc') {
        return priceA - priceB;
      }
      if (filters.sortBy === 'price_desc') {
        return priceB - priceA;
      }
      if (filters.sortBy === 'newest') {
        return b.createdAt.localeCompare(a.createdAt);
      }
      if (filters.sortBy === 'name_asc') {
        return a.title.localeCompare(b.title);
      }
      // default: 'featured'
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    });
  }, [products, stores, filters]);

  // --- Filtered Stores ---
  const filteredStores = useMemo(() => {
    return stores
      .filter((s) => s.active)
      .filter((s) => {
        if (storeFilters.searchQuery.trim()) {
          const q = storeFilters.searchQuery.toLowerCase();
          const matchesName = s.name.toLowerCase().includes(q);
          const matchesSlogan = (s.slogan || '').toLowerCase().includes(q);
          const matchesDesc = (s.description || '').toLowerCase().includes(q);
          const matchesLoc = (s.location || '').toLowerCase().includes(q);
          const matchesAddr = formatNormalizedAddressText(s).toLowerCase().includes(q);
          if (!matchesName && !matchesSlogan && !matchesDesc && !matchesLoc && !matchesAddr) {
            return false;
          }
        }
        const sProv = s.address?.province || (s as any).province || '';
        const sMun = s.address?.municipality || (s as any).municipality || '';
        const sRep = s.address?.neighborhood || (s as any).reparto || (s as any).neighborhood || '';

        if (storeFilters.provinces && storeFilters.provinces.length > 0) {
          const matchesProv = storeFilters.provinces.includes(sProv);
          if (!matchesProv) return false;
        } else if (storeFilters.province && storeFilters.province !== 'ALL') {
          const matchesProv =
            sProv === storeFilters.province ||
            s.location?.toLowerCase().includes(storeFilters.province.toLowerCase());
          if (!matchesProv) return false;
        }

        if (storeFilters.municipalities && storeFilters.municipalities.length > 0) {
          const matchesMun = storeFilters.municipalities.includes(sMun);
          if (!matchesMun) return false;
        } else if (storeFilters.municipality && storeFilters.municipality !== 'ALL') {
          const matchesMun =
            sMun === storeFilters.municipality ||
            s.location?.toLowerCase().includes(storeFilters.municipality.toLowerCase());
          if (!matchesMun) return false;
        }

        if (storeFilters.repartos && storeFilters.repartos.length > 0) {
          const matchesRep = storeFilters.repartos.includes(sRep);
          if (!matchesRep) return false;
        } else if (storeFilters.reparto && storeFilters.reparto !== 'ALL') {
          const matchesRep =
            sRep === storeFilters.reparto ||
            s.location?.toLowerCase().includes(storeFilters.reparto.toLowerCase());
          if (!matchesRep) return false;
        }

        // Delivery filter (Nomenclador Dinámico)
        if (storeFilters.deliveryMethods && storeFilters.deliveryMethods.length > 0) {
          const storeDeliveryIds: string[] = s.deliveryMethodIds && s.deliveryMethodIds.length > 0
            ? s.deliveryMethodIds
            : s.deliveryAvailable
            ? ['dm-mensajeria', 'delivery']
            : ['dm-recogida', 'pickup'];

          const matchesDelivery = storeFilters.deliveryMethods.some((selected) => {
            if (selected === 'delivery' || selected === 'dm-mensajeria') {
              return storeDeliveryIds.includes('dm-mensajeria') || storeDeliveryIds.includes('delivery') || Boolean(s.deliveryAvailable);
            }
            if (selected === 'pickup' || selected === 'dm-recogida') {
              return storeDeliveryIds.includes('dm-recogida') || storeDeliveryIds.includes('pickup') || !s.deliveryAvailable;
            }
            return storeDeliveryIds.includes(selected);
          });
          if (!matchesDelivery) return false;
        } else if (storeFilters.deliveryOnly && !s.deliveryAvailable) {
          return false;
        }

        // Currencies filter (Monedas aceptadas por la tienda)
        if (storeFilters.currencies && storeFilters.currencies.length > 0) {
          const storeCurrs = getStoreAcceptedCurrencies(s).map((c) => c.toUpperCase());
          const matchesCurr = storeFilters.currencies.some((c) => storeCurrs.includes(c.toUpperCase()));
          if (!matchesCurr) return false;
        }

        // Payment filter (Relación Moneda ↔ Forma de Pago)
        if (storeFilters.paymentMethods && storeFilters.paymentMethods.length > 0) {
          const targetCurrencies =
            storeFilters.currencies && storeFilters.currencies.length > 0
              ? storeFilters.currencies
              : getStoreAcceptedCurrencies(s);

          const storePayIdsForTargetCurrencies = Array.from(
            new Set(
              targetCurrencies.flatMap((curr) =>
                getStorePaymentMethodsForCurrency(s, curr, marketplaceConfig.paymentMethodsCatalog).map((pm) => pm.id)
              )
            )
          );

          const matchesPayment = storeFilters.paymentMethods.some((selected) => {
            if (selected === 'transfer' || selected === 'pm-transferencia') {
              return (
                storePayIdsForTargetCurrencies.includes('pm-transferencia') ||
                storePayIdsForTargetCurrencies.includes('transfer')
              );
            }
            if (selected === 'cash' || selected === 'pm-efectivo') {
              return (
                storePayIdsForTargetCurrencies.includes('pm-efectivo') ||
                storePayIdsForTargetCurrencies.includes('cash')
              );
            }
            return storePayIdsForTargetCurrencies.includes(selected);
          });
          if (!matchesPayment) return false;
        } else if (storeFilters.transferOnly && !s.paymentOptions?.transferAccepted) {
          return false;
        }
        return true;
      });
  }, [stores, storeFilters]);

  // Pagination calculations for Products
  const totalProductPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE) || 1;
  const validProductPage = Math.min(Math.max(1, productCurrentPage), totalProductPages);
  const paginatedProducts = useMemo(() => {
    const start = (validProductPage - 1) * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(start, start + PRODUCTS_PER_PAGE);
  }, [filteredProducts, validProductPage, PRODUCTS_PER_PAGE]);
  const productStartItem = filteredProducts.length === 0 ? 0 : (validProductPage - 1) * PRODUCTS_PER_PAGE + 1;
  const productEndItem = Math.min(validProductPage * PRODUCTS_PER_PAGE, filteredProducts.length);

  // Pagination calculations for Stores
  const totalStorePages = Math.ceil(filteredStores.length / STORES_PER_PAGE) || 1;
  const validStorePage = Math.min(Math.max(1, storeCurrentPage), totalStorePages);
  const paginatedStores = useMemo(() => {
    const start = (validStorePage - 1) * STORES_PER_PAGE;
    return filteredStores.slice(start, start + STORES_PER_PAGE);
  }, [filteredStores, validStorePage, STORES_PER_PAGE]);
  const storeStartItem = filteredStores.length === 0 ? 0 : (validStorePage - 1) * STORES_PER_PAGE + 1;
  const storeEndItem = Math.min(validStorePage * STORES_PER_PAGE, filteredStores.length);

  const handleViewStoreProductsFromCard = (storeId: string) => {
    handleFilterChange({
      ...DEFAULT_FILTERS,
      storeIds: [storeId],
      storeId,
    });
    setPublicSubView('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <InterfazProvider initialTexts={marketplaceConfig.uiTexts}>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Global Dynamic Theme Injection: affects both public marketplace and admin portal */}
      <style>{`
        :root {
          --theme-primary: ${marketplaceConfig.primaryColor || '#4f46e5'};
          --theme-secondary: ${marketplaceConfig.secondaryColor || '#0284c7'};
          --theme-accent: ${marketplaceConfig.accentColor || '#10b981'};
        }
        /* Primary color mapping (indigo -> primary) */
        .bg-indigo-600, .bg-indigo-700, .bg-indigo-500, .hover\\:bg-indigo-700:hover, .hover\\:bg-indigo-600:hover {
          background-color: var(--theme-primary) !important;
        }
        .bg-indigo-50 {
          background-color: color-mix(in srgb, var(--theme-primary) 12%, white) !important;
        }
        .bg-indigo-100 {
          background-color: color-mix(in srgb, var(--theme-primary) 20%, white) !important;
        }
        .text-indigo-600, .text-indigo-700, .text-indigo-500, .text-indigo-800, .text-indigo-900, .hover\\:text-indigo-600:hover {
          color: var(--theme-primary) !important;
        }
        .border-indigo-600, .border-indigo-500, .border-indigo-400, .border-indigo-200, .border-indigo-100, .focus\\:border-indigo-500:focus {
          border-color: var(--theme-primary) !important;
        }
        .from-indigo-600, .from-indigo-500, .from-indigo-700 {
          --tw-gradient-from: var(--theme-primary) !important;
        }
        .to-indigo-600, .to-indigo-500, .to-indigo-700 {
          --tw-gradient-to: var(--theme-primary) !important;
        }

        /* Secondary color mapping (sky/blue -> secondary) */
        .bg-sky-600, .bg-sky-500, .bg-blue-600, .bg-blue-500, .hover\\:bg-sky-600:hover, .hover\\:bg-blue-600:hover {
          background-color: var(--theme-secondary) !important;
        }
        .bg-sky-50, .bg-blue-50 {
          background-color: color-mix(in srgb, var(--theme-secondary) 12%, white) !important;
        }
        .bg-sky-100, .bg-blue-100 {
          background-color: color-mix(in srgb, var(--theme-secondary) 20%, white) !important;
        }
        .text-sky-600, .text-sky-500, .text-blue-600, .text-blue-500, .text-sky-700, .text-blue-700 {
          color: var(--theme-secondary) !important;
        }
        .border-sky-500, .border-blue-500, .border-sky-400, .border-blue-400 {
          border-color: var(--theme-secondary) !important;
        }
        .from-sky-500, .from-blue-500, .from-sky-600, .from-blue-600 {
          --tw-gradient-from: var(--theme-secondary) !important;
        }
        .to-sky-500, .to-blue-500, .to-sky-600, .to-blue-600 {
          --tw-gradient-to: var(--theme-secondary) !important;
        }

        /* Accent color mapping (emerald/green -> accent) */
        .bg-emerald-600, .bg-emerald-500, .bg-emerald-700, .bg-green-600, .bg-green-500, .hover\\:bg-emerald-700:hover, .hover\\:bg-emerald-600:hover {
          background-color: var(--theme-accent) !important;
        }
        .bg-emerald-50, .bg-green-50 {
          background-color: color-mix(in srgb, var(--theme-accent) 12%, white) !important;
        }
        .bg-emerald-100, .bg-green-100 {
          background-color: color-mix(in srgb, var(--theme-accent) 20%, white) !important;
        }
        .text-emerald-600, .text-emerald-700, .text-emerald-500, .text-emerald-400, .text-green-600, .text-green-700 {
          color: var(--theme-accent) !important;
        }
        .border-emerald-500, .border-emerald-600, .border-green-500, .focus\\:border-emerald-500:focus {
          border-color: var(--theme-accent) !important;
        }
        .from-emerald-500, .from-green-500 {
          --tw-gradient-from: var(--theme-accent) !important;
        }
        .to-emerald-500, .to-green-500 {
          --tw-gradient-to: var(--theme-accent) !important;
        }
      `}</style>

      {/* Toast Notifier */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Main Top Header */}
      <Header
        stores={stores}
        products={products}
        currencyMode={currencyMode}
        onCurrencyChange={setCurrencyMode}
        activeView={activeView}
        onSwitchView={handleSwitchView}
        publicSubView={publicSubView}
        onPublicSubViewChange={setPublicSubView}
        onOpenStoresModal={() => setIsStoresModalOpen(true)}
        isAdminAuthenticated={isAdminAuthenticated}
        marketplaceConfig={marketplaceConfig}
        cartItemsCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Main Area */}
      <main className="flex-1 pb-16">
        {activeView === 'public' ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            {/* View Mode Tabs (Productos y Servicios / Tiendas y Proveedores) */}
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-6 border-b border-slate-200 pb-3">
              <button
                onClick={() => {
                  setPublicSubView('products');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
                  publicSubView === 'products'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{interfaz.subviews.products}</span>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                    publicSubView === 'products'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {filteredProducts.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setPublicSubView('stores');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
                  publicSubView === 'stores'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <StoreIcon className="w-4 h-4" />
                <span>{interfaz.subviews.stores}</span>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                    publicSubView === 'stores'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {filteredStores.length}
                </span>
              </button>
            </div>

            {/* Subview 1: Products & Services */}
            {publicSubView === 'products' && (
              <>
                {/* Advanced Search & Filter (Strictly the requested 12 fields) */}
                <AdvancedSearch
                  products={products}
                  onSelectProduct={setSelectedProduct}
                  categories={INITIAL_CATEGORIES}
                  departmentsCatalog={marketplaceConfig.departmentsCatalog}
                  tagsCatalog={marketplaceConfig.tagsCatalog}
                  geoCatalog={marketplaceConfig.geoCatalog}
                  offerTypesCatalog={marketplaceConfig.offerTypesCatalog}
                  paymentMethodsCatalog={marketplaceConfig.paymentMethodsCatalog}
                  deliveryMethodsCatalog={marketplaceConfig.deliveryMethodsCatalog}
                  currenciesCatalog={marketplaceConfig.currenciesCatalog}
                  stores={stores}
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onResetFilters={() => handleFilterChange(DEFAULT_FILTERS)}
                  totalResults={filteredProducts.length}
                  isExpanded={isProductFilterExpanded}
                  onToggleExpanded={toggleProductFilterExpanded}
                />

                {/* Product Grid / Table View Switcher */}
                {filteredProducts.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-12 text-center my-6">
                    <ShoppingBag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-800">
                      {interfaz.filters.emptyResults.productsTitle}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                      {interfaz.filters.emptyResults.productsSubtitle}
                    </p>
                    <button
                      onClick={() => handleFilterChange(DEFAULT_FILTERS)}
                      className="mt-5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-xs transition-all cursor-pointer"
                    >
                      {interfaz.filters.emptyResults.resetButton}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <p className="text-xs text-slate-500 font-semibold">
                        Mostrando {filteredProducts.length} {filteredProducts.length === 1 ? 'oferta' : 'ofertas'}
                      </p>

                      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
                        <button
                          onClick={() => setProductViewMode('cards')}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            productViewMode === 'cards'
                              ? 'bg-white text-indigo-600 shadow-xs'
                              : 'text-slate-500 hover:text-slate-900'
                          }`}
                          title="Vista en tarjetas (cards)"
                        >
                          <LayoutGrid className="w-3.5 h-3.5" />
                          <span>Tarjetas</span>
                        </button>
                        <button
                          onClick={() => setProductViewMode('table')}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            productViewMode === 'table'
                              ? 'bg-white text-indigo-600 shadow-xs'
                              : 'text-slate-500 hover:text-slate-900'
                          }`}
                          title="Vista en formato de tabla"
                        >
                          <Table className="w-3.5 h-3.5" />
                          <span>Tabla</span>
                        </button>
                      </div>
                    </div>

                    {productViewMode === 'cards' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                        {paginatedProducts.map((product) => {
                          const store = stores.find((s) => s.id === product.storeId);
                          const cartItem = cartItems.find((ci) => ci.productId === product.id);
                          return (
                            <ProductCard
                              key={product.id}
                              product={product}
                              store={store}
                              currencyMode={currencyMode}
                              onSelectProduct={setSelectedProduct}
                              onAddToCart={handleAddToCart}
                              onUpdateQuantity={handleUpdateCartQuantity}
                              onRemoveFromCart={(id) => {
                                handleRemoveFromCart(id);
                                showToast('Producto eliminado', `Se quitó "${product.title}" del carrito`, 'info');
                              }}
                              cartQuantity={cartItem?.quantity || 0}
                            />
                          );
                        })}
                      </div>
                    ) : (
                      <ProductTableView
                        products={paginatedProducts}
                        stores={stores}
                        currencyMode={currencyMode}
                        onSelectProduct={setSelectedProduct}
                        onSelectStore={(st) => setSelectedStore(st)}
                        onAddToCart={handleAddToCart}
                        onUpdateQuantity={handleUpdateCartQuantity}
                        onRemoveFromCart={(id) => {
                          const prod = products.find((p) => p.id === id);
                          handleRemoveFromCart(id);
                          showToast('Producto eliminado', `Se quitó "${prod?.title || 'artículo'}" del carrito`, 'info');
                        }}
                        cartItems={cartItems}
                      />
                    )}

                    {/* Pagination for Products (Default 10 items per page) */}
                    {totalProductPages > 1 && (
                      <div className="bg-white rounded-2xl border border-slate-200 p-4 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-600 shadow-xs">
                        <div>
                          {interfaz.pagination.showing} <span className="font-bold text-slate-900">{productStartItem}</span> -{' '}
                          <span className="font-bold text-slate-900">{productEndItem}</span> {interfaz.pagination.of}{' '}
                          <span className="font-bold text-slate-900">{filteredProducts.length}</span> {interfaz.pagination.products}{' '}
                          ({interfaz.pagination.page} <span className="font-bold text-indigo-700">{validProductPage}</span> {interfaz.pagination.of}{' '}
                          <span className="font-bold text-slate-900">{totalProductPages}</span>)
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setProductCurrentPage((pg) => Math.max(1, pg - 1));
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            disabled={validProductPage === 1}
                            className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 font-bold transition-all cursor-pointer flex items-center gap-1"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                            <span>{interfaz.pagination.previous}</span>
                          </button>

                          <div className="flex items-center gap-1">
                            {Array.from({ length: totalProductPages }, (_, i) => i + 1).map((page) => (
                              <button
                                key={page}
                                onClick={() => {
                                  setProductCurrentPage(page);
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                  validProductPage === page
                                    ? 'bg-indigo-600 text-white shadow-xs'
                                    : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700'
                                }`}
                              >
                                {page}
                              </button>
                            ))}
                          </div>

                          <button
                            onClick={() => {
                              setProductCurrentPage((pg) => Math.min(totalProductPages, pg + 1));
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            disabled={validProductPage === totalProductPages}
                            className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 font-bold transition-all cursor-pointer flex items-center gap-1"
                          >
                            <span>{interfaz.pagination.next}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* Subview 2: Stores & Providers */}
            {publicSubView === 'stores' && (
              <>
                {/* Store Filter Bar */}
                <StoreFilterBar
                  geoCatalog={marketplaceConfig.geoCatalog}
                  paymentMethodsCatalog={marketplaceConfig.paymentMethodsCatalog}
                  deliveryMethodsCatalog={marketplaceConfig.deliveryMethodsCatalog}
                  currenciesCatalog={marketplaceConfig.currenciesCatalog}
                  filters={storeFilters}
                  onFilterChange={handleStoreFilterChange}
                  onReset={() => handleStoreFilterChange(DEFAULT_STORE_FILTERS)}
                  totalResults={filteredStores.length}
                  isExpanded={isStoreFilterExpanded}
                  onToggleExpanded={toggleStoreFilterExpanded}
                />

                {/* Stores Grid / Table Switcher */}
                {filteredStores.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-12 text-center my-6">
                    <StoreIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-800">
                      {interfaz.filters.emptyResults.storesTitle}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                      {interfaz.filters.emptyResults.storesSubtitle}
                    </p>
                    <button
                      onClick={() => handleStoreFilterChange(DEFAULT_STORE_FILTERS)}
                      className="mt-5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-xs transition-all cursor-pointer"
                    >
                      {interfaz.filters.emptyResults.resetButton}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <p className="text-xs text-slate-500 font-semibold">
                        Mostrando {filteredStores.length} {filteredStores.length === 1 ? 'tienda' : 'tiendas'}
                      </p>

                      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
                        <button
                          onClick={() => setStoreViewMode('cards')}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            storeViewMode === 'cards'
                              ? 'bg-white text-indigo-600 shadow-xs'
                              : 'text-slate-500 hover:text-slate-900'
                          }`}
                          title="Vista en tarjetas (cards)"
                        >
                          <LayoutGrid className="w-3.5 h-3.5" />
                          <span>Tarjetas</span>
                        </button>
                        <button
                          onClick={() => setStoreViewMode('table')}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            storeViewMode === 'table'
                              ? 'bg-white text-indigo-600 shadow-xs'
                              : 'text-slate-500 hover:text-slate-900'
                          }`}
                          title="Vista en formato de tabla"
                        >
                          <Table className="w-3.5 h-3.5" />
                          <span>Tabla</span>
                        </button>
                      </div>
                    </div>

                    {storeViewMode === 'cards' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                        {paginatedStores.map((store) => {
                          const storeProductsCount = products.filter(
                            (p) => p.storeId === store.id && p.isAvailable !== false
                          ).length;
                          return (
                            <StoreCard
                              key={store.id}
                              store={store}
                              productsCount={storeProductsCount}
                              onSelectStore={(st) => setSelectedStore(st)}
                              onViewStoreProducts={handleViewStoreProductsFromCard}
                            />
                          );
                        })}
                      </div>
                    ) : (
                      <StoreTableView
                        stores={paginatedStores}
                        products={products}
                        onSelectStore={(st) => setSelectedStore(st)}
                        onViewStoreProducts={handleViewStoreProductsFromCard}
                      />
                    )}

                    {/* Pagination for Stores */}
                    {totalStorePages > 1 && (
                      <div className="bg-white rounded-2xl border border-slate-200 p-4 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-600 shadow-xs">
                        <div>
                          {interfaz.pagination.showing} <span className="font-bold text-slate-900">{storeStartItem}</span> -{' '}
                          <span className="font-bold text-slate-900">{storeEndItem}</span> {interfaz.pagination.of}{' '}
                          <span className="font-bold text-slate-900">{filteredStores.length}</span> {interfaz.pagination.stores}{' '}
                          ({interfaz.pagination.page} <span className="font-bold text-indigo-700">{validStorePage}</span> {interfaz.pagination.of}{' '}
                          <span className="font-bold text-slate-900">{totalStorePages}</span>)
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setStoreCurrentPage((pg) => Math.max(1, pg - 1));
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            disabled={validStorePage === 1}
                            className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 font-bold transition-all cursor-pointer flex items-center gap-1"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                            <span>{interfaz.pagination.previous}</span>
                          </button>

                          <div className="flex items-center gap-1">
                            {Array.from({ length: totalStorePages }, (_, i) => i + 1).map((page) => (
                              <button
                                key={page}
                                onClick={() => {
                                  setStoreCurrentPage(page);
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                  validStorePage === page
                                    ? 'bg-indigo-600 text-white shadow-xs'
                                    : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700'
                                }`}
                              >
                                {page}
                              </button>
                            ))}
                          </div>

                          <button
                            onClick={() => {
                              setStoreCurrentPage((pg) => Math.min(totalStorePages, pg + 1));
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            disabled={validStorePage === totalStorePages}
                            className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 font-bold transition-all cursor-pointer flex items-center gap-1"
                          >
                            <span>{interfaz.pagination.next}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        ) : (
          /* Admin Dashboard Portal */
          <AdminDashboard
            stores={stores}
            products={products}
            categories={INITIAL_CATEGORIES}
            marketplaceConfig={marketplaceConfig}
            onUpdateMarketplaceConfig={handleUpdateMarketplaceConfig}
            onUpdateStoreRate={handleUpdateStoreRate}
            onUpdateAllStoresRate={handleUpdateAllStoresRate}
            onAddStore={handleAddStore}
            onUpdateStore={handleUpdateStore}
            onDeleteStore={handleDeleteStore}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onLogout={handleLogout}
            onRestoreDefaults={handleRestoreDefaults}
            onImportData={handleImportData}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 text-slate-400 py-4 px-6 text-[10px] uppercase tracking-widest shrink-0 border-t border-slate-700">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ThemeImage
              src={marketplaceConfig.logoUrl || ''}
              alt={marketplaceConfig.name}
              fallbackType="logo"
              className="w-6 h-6 rounded-lg object-cover bg-white shrink-0 border border-slate-700"
            />
            <span className="font-bold text-white">{marketplaceConfig.name}</span>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-2.5">
            {marketplaceConfig.socialLinks?.whatsapp && (
              <a
                href={marketplaceConfig.socialLinks.whatsapp}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition-all shadow-xs"
                title="WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            )}
            {marketplaceConfig.socialLinks?.telegram && (
              <a
                href={marketplaceConfig.socialLinks.telegram}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition-all shadow-xs"
                title="Telegram"
              >
                <Send className="w-4 h-4" />
              </a>
            )}
            {marketplaceConfig.socialLinks?.instagram && (
              <a
                href={marketplaceConfig.socialLinks.instagram}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition-all shadow-xs"
                title="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
            )}
            {marketplaceConfig.socialLinks?.facebook && (
              <a
                href={marketplaceConfig.socialLinks.facebook}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition-all shadow-xs"
                title="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
            )}
            {marketplaceConfig.socialLinks?.twitter && (
              <a
                href={marketplaceConfig.socialLinks.twitter}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition-all shadow-xs"
                title="X (Twitter)"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            )}
            {marketplaceConfig.socialLinks?.linkedin && (
              <a
                href={marketplaceConfig.socialLinks.linkedin}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition-all shadow-xs"
                title="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </footer>

      {/* --- Modals --- */}
      <ProductDetailModal
        product={selectedProduct}
        store={selectedProduct ? stores.find((s) => s.id === selectedProduct.storeId) || null : null}
        onClose={() => setSelectedProduct(null)}
        onFilterByStore={(storeId) => setFilters({ ...filters, storeId })}
        onShowToast={showToast}
        marketplaceConfig={marketplaceConfig}
        products={products}
        onAddToCart={handleAddToCart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveFromCart={handleRemoveFromCart}
        cartQuantity={
          selectedProduct
            ? cartItems.find((ci) => ci.productId === selectedProduct.id)?.quantity || 0
            : 0
        }
      />

      <StoreDetailModal
        isOpen={selectedStore !== null}
        store={selectedStore}
        onClose={() => setSelectedStore(null)}
        marketplaceConfig={marketplaceConfig}
        products={products}
        onViewStoreProducts={handleViewStoreProductsFromCard}
      />

      <StoreDirectoryModal
        isOpen={isStoresModalOpen}
        onClose={() => setIsStoresModalOpen(false)}
        stores={stores}
        products={products}
        onSelectStore={(storeId) => setFilters({ ...filters, storeId })}
      />

      {/* Shopping Cart Modal */}
      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        stores={stores}
        products={products}
        marketplaceConfig={marketplaceConfig}
        storePreferences={storeCartPreferences}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        onUpdateStorePreferences={handleUpdateStorePreferences}
        onUpdateItemPreferences={handleUpdateItemPreferences}
        onShowToast={showToast}
        onSelectStore={(st) => setSelectedStore(st)}
      />

      {/* Floating Action Button for Quick Cart Access */}
      {totalCartCount > 0 && !isCartOpen && (
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-black py-3 px-4 sm:px-5 rounded-2xl shadow-xl flex items-center gap-2.5 transition-all transform hover:scale-105 active:scale-95 cursor-pointer border border-indigo-400/40"
          title={`Abrir Carrito (${totalCartCount} artículos)`}
        >
          <div className="relative">
            <ShoppingCart className="w-5 h-5" />
            <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] font-black w-4 h-4 rounded-full inline-flex items-center justify-center text-center leading-none shadow-xs">
              {totalCartCount}
            </span>
          </div>
          <span className="text-xs sm:text-sm font-black hidden xs:inline">Ver Carrito</span>
        </button>
      )}

      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        onShowToast={showToast}
      />
      </div>
    </InterfazProvider>
  );
}
