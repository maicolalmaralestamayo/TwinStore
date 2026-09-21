import React, { useState, useEffect, useMemo } from 'react';
import {
  Product,
  Store,
  CategoryItem,
  CategoryType,
  DepartmentCategory,
  TagGroup,
  ProductTagSelection,
  NomenclatorItem,
  MarketplaceConfig,
  FilterState,
} from '../../types';
import {
  PRESET_PRODUCT_IMAGES,
  INITIAL_DEPARTMENT_CATALOG,
  INITIAL_TAGS_CATALOG,
  INITIAL_PRODUCT_TYPES_CATALOG,
  INITIAL_CURRENCIES_CATALOG,
} from '../../data/initialData';
import {
  formatCurrency,
  calculateProductPriceInCurrency,
  getStoreExchangeRate,
  formatNumberWithDots,
  getProductAllowedExchangeRates,
  getProductPricesInAllowedCurrencies,
} from '../../lib/utils';
import { ThemeImage } from '../common/ThemeImage';
import { ImageGalleryUploader } from '../common/ImageGalleryUploader';
import { SearchableSelect } from '../common/SearchableSelect';
import { SearchableMultiSelect } from '../common/SearchableMultiSelect';
import { AdvancedSearch } from '../PublicMarketplace/AdvancedSearch';
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Search,
  Image as ImageIcon,
  Store as StoreIcon,
  Tag,
  Check,
  Upload,
  FolderTree,
  ChevronLeft,
  ChevronRight,
  Coins,
  ArrowRightLeft,
  DollarSign,
  Sparkles,
} from 'lucide-react';

const DEFAULT_PRODUCT_FILTERS: FilterState = {
  searchQuery: '',
  storeIds: [],
  categories: [],
  subcategories: [],
  tagGroups: [],
  tagValues: [],
  provinces: [],
  municipalities: [],
  repartos: [],
  itemTypes: [],
  paymentMethods: [],
  deliveryMethods: [],
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

interface ProductManagerProps {
  products: Product[];
  stores: Store[];
  categories: CategoryItem[];
  departmentsCatalog?: DepartmentCategory[];
  tagsCatalog?: TagGroup[];
  productTypesCatalog?: NomenclatorItem[];
  paymentMethodsCatalog?: NomenclatorItem[];
  deliveryMethodsCatalog?: NomenclatorItem[];
  marketplaceConfig?: MarketplaceConfig;
  onAddProduct: (product: Omit<Product, 'id' | 'createdAt'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onShowToast: (title: string, desc?: string, type?: 'success' | 'info' | 'error') => void;
}

const ITEMS_PER_PAGE = 10;

export const ProductManager: React.FC<ProductManagerProps> = ({
  products,
  stores,
  categories,
  departmentsCatalog,
  tagsCatalog,
  productTypesCatalog,
  paymentMethodsCatalog,
  deliveryMethodsCatalog,
  marketplaceConfig,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onShowToast,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_PRODUCT_FILTERS);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showPresets, setShowPresets] = useState(false);

  // Form State
  const [code, setCode] = useState('');
  const [storeId, setStoreId] = useState(stores[0]?.id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceUSD, setPriceUSD] = useState<number>(45);
  const [currency, setCurrency] = useState<string>('USD');
  const [allowedExchangeRateIds, setAllowedExchangeRateIds] = useState<string[]>([]);
  const [category, setCategory] = useState<string>('');
  const [subcategory, setSubcategory] = useState<string>('');
  const [imageUrl, setImageUrl] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [productTypeId, setProductTypeId] = useState<string>('pt-producto');
  const [selectedTagSelections, setSelectedTagSelections] = useState<ProductTagSelection[]>([]);
  const [selectedSupertagComboId, setSelectedSupertagComboId] = useState<string>('');

  const generateUniqueCode = (): string => {
    let num = products.length + 1;
    let candidate = `PRD-${String(num).padStart(3, '0')}`;
    while (products.some((p) => (p.code || '').toUpperCase() === candidate)) {
      num++;
      candidate = `PRD-${String(num).padStart(3, '0')}`;
    }
    return candidate;
  };

  const catalogToUse =
    departmentsCatalog && departmentsCatalog.length > 0
      ? departmentsCatalog
      : INITIAL_DEPARTMENT_CATALOG;
  const effectiveTagsCatalog =
    tagsCatalog && tagsCatalog.length > 0 ? tagsCatalog : INITIAL_TAGS_CATALOG;
  const effectiveProductTypesCatalog =
    productTypesCatalog && productTypesCatalog.length > 0
      ? productTypesCatalog
      : INITIAL_PRODUCT_TYPES_CATALOG;
  const currentDept = category
    ? catalogToUse.find((d) => d.name === category || d.id === category)
    : undefined;
  const availableSubcats = currentDept?.subcategories || [];

  const selectedStore = stores.find((s) => s.id === storeId) || stores[0];
  const currentRates = selectedStore?.exchangeRates || [];
  const primaryRate = currentRates[0]?.rate || selectedStore?.usdToCupRate || 1;
  const secondaryCurrencyName = currentRates[0]?.toCurrency || marketplaceConfig?.secondaryCurrency || 'EUR';
  const convertedPricePreview = Math.round((priceUSD || 0) * primaryRate * 100) / 100;

  const currentStoreRatesForCurrency = useMemo(() => {
    return (selectedStore?.exchangeRates || []).filter((r) => r.fromCurrency === currency);
  }, [selectedStore, currency]);

  const toggleAllowedRate = (rateId: string) => {
    setAllowedExchangeRateIds((prev) =>
      prev.includes(rateId) ? prev.filter((id) => id !== rateId) : [...prev, rateId]
    );
  };

  const handleSelectAllRates = () => {
    const allIds = currentStoreRatesForCurrency.map((r) => r.id);
    setAllowedExchangeRateIds(allIds);
  };

  const handleDeselectAllRates = () => {
    setAllowedExchangeRateIds([]);
  };

  // Reset page when filtering
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const openNewModal = () => {
    setEditingProduct(null);
    setCode(generateUniqueCode());
    const initialStore = stores[0];
    setStoreId(initialStore?.id || '');
    setTitle('');
    setDescription('');
    setPriceUSD(45);
    const initialCurr = initialStore?.baseCurrency || 'USD';
    setCurrency(initialCurr);
    const matchingRates = (initialStore?.exchangeRates || []).filter(
      (r) => r.fromCurrency === initialCurr
    );
    setAllowedExchangeRateIds(matchingRates.map((r) => r.id));
    setCategory('');
    setSubcategory('');
    setSelectedSupertagComboId('');
    setSelectedTagSelections([]);
    const defaultImg = marketplaceConfig?.defaultProductImageUrl || 'local:product';
    setImageUrl(defaultImg);
    setImages([]);
    setNewImageUrl('');
    setIsAvailable(true);
    setProductTypeId('pt-producto');
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setCode(product.code || generateUniqueCode());
    setStoreId(product.storeId);
    setTitle(product.title);
    setDescription(product.description);
    setPriceUSD(product.priceUSD);
    const prodCurr = product.currency || 'USD';
    setCurrency(prodCurr);
    setAllowedExchangeRateIds(product.allowedExchangeRateIds || []);
    setCategory(product.category || '');
    setSubcategory(product.subcategory || '');
    setSelectedSupertagComboId('');
    setSelectedTagSelections(product.tagSelections || []);
    const defaultImg = marketplaceConfig?.defaultProductImageUrl || 'local:product';
    const mainImg = product.imageUrl || defaultImg;
    const initialGallery = product.images && product.images.length > 0 ? product.images : [mainImg];
    setImageUrl(mainImg);
    setImages(initialGallery);
    setNewImageUrl('');
    setIsAvailable(product.isAvailable ?? true);
    const matchedPt =
      effectiveProductTypesCatalog.find(
        (pt) => pt.id === product.productTypeId || pt.name === product.productType
      ) || effectiveProductTypesCatalog[0];
    setProductTypeId(matchedPt?.id || 'pt-producto');
    setIsModalOpen(true);
  };

  const handleUploadProductImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      onShowToast('Imagen muy grande', 'El tamaño máximo permitido es 3MB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setImages((prev) => [...prev, result]);
        if (!imageUrl || imageUrl === 'local:product') {
          setImageUrl(result);
        }
        onShowToast('Imagen Agregada', 'Se añadió la foto a la galería de la publicación');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddImageUrl = () => {
    if (!newImageUrl.trim()) return;
    setImages((prev) => [...prev, newImageUrl.trim()]);
    if (!imageUrl || imageUrl === 'local:product') {
      setImageUrl(newImageUrl.trim());
    }
    setNewImageUrl('');
    onShowToast('Imagen Agregada', 'Se añadió la URL a la galería de fotos');
  };

  const handleRemoveImage = (imgToRemove: string) => {
    const updated = images.filter((i) => i !== imgToRemove);
    setImages(updated);
    if (imageUrl === imgToRemove) {
      setImageUrl(updated[0] || 'local:product');
    }
  };

  const handleSetMainImage = (mainImg: string) => {
    setImageUrl(mainImg);
    onShowToast('Imagen Principal', 'Se definió la portada principal de la oferta');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !storeId) {
      onShowToast('Datos incompletos', 'Asigna una tienda y título del producto', 'error');
      return;
    }

    const tagSelections: ProductTagSelection[] = selectedTagSelections.map((ts) => {
      const gName = ts.groupName || ts.group || '';
      const tName = ts.tagName || ts.value || '';
      return {
        group: gName,
        value: tName,
        groupId: ts.groupId || gName,
        groupName: gName,
        tagId: ts.tagId || tName,
        tagName: tName,
      };
    });

    const twoTierTagNames = selectedTagSelections
      .map((ts) => (ts.tagName || ts.value || '').toLowerCase())
      .filter(Boolean);

    const tags = Array.from(new Set(twoTierTagNames));
    const finalMainImage =
      (imageUrl && imageUrl.trim() !== '')
        ? imageUrl.trim()
        : images[0] || marketplaceConfig?.defaultProductImageUrl || 'local:product';
    const finalGallery = images.length > 0 ? images : [finalMainImage];

    const cleanCode = (code || '').trim().toUpperCase();
    if (!cleanCode) {
      onShowToast('Código requerido', 'Debes ingresar un código para el producto', 'error');
      return;
    }

    const duplicate = products.find(
      (p) => (p.code || '').toUpperCase() === cleanCode && p.id !== editingProduct?.id
    );
    if (duplicate) {
      onShowToast(
        'Código duplicado',
        `El código "${cleanCode}" ya existe en "${duplicate.title}". Debe ser único en toda la base de datos.`,
        'error'
      );
      return;
    }

    const chosenPt =
      effectiveProductTypesCatalog.find((pt) => pt.id === productTypeId) ||
      effectiveProductTypesCatalog[0];
    const finalProductTypeId = chosenPt?.id || productTypeId;
    const finalProductTypeName = chosenPt?.name;

    if (editingProduct) {
      onUpdateProduct({
        ...editingProduct,
        code: cleanCode,
        storeId,
        title,
        description,
        priceUSD: Number(priceUSD) || 0,
        currency: currency || 'USD',
        allowedExchangeRateIds,
        category,
        subcategory: subcategory.trim() || undefined,
        imageUrl: finalMainImage,
        images: finalGallery,
        isAvailable,
        productTypeId: finalProductTypeId,
        productType: finalProductTypeName,
        tags,
        tagSelections,
      });
      onShowToast('Publicación actualizada', `Se guardaron los cambios de "${title}"`);
    } else {
      onAddProduct({
        code: cleanCode,
        storeId,
        title,
        description,
        priceUSD: Number(priceUSD) || 0,
        currency: currency || 'USD',
        allowedExchangeRateIds,
        category,
        subcategory: subcategory.trim() || undefined,
        imageUrl: finalMainImage,
        images: finalGallery,
        isAvailable,
        productTypeId: finalProductTypeId,
        productType: finalProductTypeName,
        featured: true,
        tags,
        tagSelections,
      });
      onShowToast('¡Publicación creada!', `"${title}" está disponible en el catálogo`);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (product: Product) => {
    if (window.confirm(`¿Seguro de eliminar la publicación "${product.title}"?`)) {
      onDeleteProduct(product.id);
      onShowToast('Eliminado', `"${product.title}" fue borrado del catálogo`);
    }
  };


  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const pStore = stores.find((s) => s.id === p.storeId);
      const pTypeId = p.productTypeId || (p.isService ? 'pt-servicio' : 'pt-producto');
      const isServ =
        pTypeId === 'pt-servicio' ||
        (p.productType || '').toLowerCase().includes('servicio') ||
        Boolean((p as any).isService);

      // Offer Type / Product Type
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

      // Search Query (title, description, code, store name)
      if (filters.searchQuery?.trim()) {
        const q = filters.searchQuery.toLowerCase().trim();
        const storeName = pStore?.name.toLowerCase() || '';
        const matches =
          (p.code && p.code.toLowerCase().includes(q)) ||
          p.title.toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.subcategory && p.subcategory.toLowerCase().includes(q)) ||
          storeName.includes(q);
        if (!matches) return false;
      }

      // Code filter
      if (filters.code?.trim()) {
        const codeQ = filters.code.toLowerCase().trim();
        if (!p.code || !p.code.toLowerCase().includes(codeQ)) {
          return false;
        }
      }

      // Categories (Departamentos)
      if (filters.categories && filters.categories.length > 0) {
        if (!filters.categories.includes(p.category)) return false;
      } else if (filters.category && filters.category !== 'ALL' && p.category !== filters.category) {
        return false;
      }

      // Subcategories (Subdepartamentos)
      if (filters.subcategories && filters.subcategories.length > 0) {
        if (!p.subcategory || !filters.subcategories.includes(p.subcategory)) return false;
      } else if (filters.subcategory && filters.subcategory !== 'ALL' && p.subcategory !== filters.subcategory) {
        return false;
      }

      // Store filter
      if (filters.storeIds && filters.storeIds.length > 0) {
        if (!filters.storeIds.includes(p.storeId)) return false;
      } else if (filters.storeId && filters.storeId !== 'ALL' && p.storeId !== filters.storeId) {
        return false;
      }

      // Price filter
      const evalPrice = calculateProductPriceInCurrency(p, pStore, filters.priceCurrency || 'USD');
      if (filters.minPrice !== '' && evalPrice < Number(filters.minPrice)) {
        return false;
      }
      if (filters.maxPrice !== '' && evalPrice > Number(filters.maxPrice)) {
        return false;
      }

      // Availability filter
      if (filters.availabilityOnly && !p.isAvailable) {
        return false;
      }

      // Delivery methods
      if (filters.deliveryMethods && filters.deliveryMethods.length > 0) {
        const storeDeliveryIds: string[] = pStore?.deliveryMethodIds && pStore.deliveryMethodIds.length > 0
          ? pStore.deliveryMethodIds
          : pStore?.deliveryAvailable
          ? ['dm-mensajeria', 'delivery']
          : ['dm-recogida', 'pickup'];
        const prodDeliveryIds: string[] = p.deliveryMethodIds || [];
        const allDeliveryIds = [...storeDeliveryIds, ...prodDeliveryIds];
        const matchesDelivery = filters.deliveryMethods.some((selected) => {
          if (selected === 'delivery' || selected === 'dm-mensajeria') {
            return allDeliveryIds.includes('dm-mensajeria') || allDeliveryIds.includes('delivery') || Boolean(pStore?.deliveryAvailable) || Boolean(p.deliveryAvailable);
          }
          if (selected === 'pickup' || selected === 'dm-recogida') {
            return allDeliveryIds.includes('dm-recogida') || allDeliveryIds.includes('pickup') || !pStore?.deliveryAvailable;
          }
          return allDeliveryIds.includes(selected);
        });
        if (!matchesDelivery) return false;
      }

      // Payment methods
      if (filters.paymentMethods && filters.paymentMethods.length > 0) {
        const storePayIds: string[] = pStore?.paymentMethodIds && pStore.paymentMethodIds.length > 0
          ? pStore.paymentMethodIds
          : pStore?.paymentOptions?.transferAccepted
          ? ['pm-efectivo', 'pm-transferencia', 'transfer', 'cash']
          : ['pm-efectivo', 'cash'];
        const prodPayIds: string[] = p.paymentMethodIds || [];
        const allPayIds = [...storePayIds, ...prodPayIds];
        const matchesPayment = filters.paymentMethods.some((selected) => {
          if (selected === 'transfer' || selected === 'pm-transferencia') {
            return allPayIds.includes('pm-transferencia') || allPayIds.includes('transfer') || Boolean(pStore?.paymentOptions?.transferAccepted);
          }
          if (selected === 'cash' || selected === 'pm-efectivo') {
            return allPayIds.includes('pm-efectivo') || allPayIds.includes('cash');
          }
          return allPayIds.includes(selected);
        });
        if (!matchesPayment) return false;
      }

      // Location filters
      if (pStore) {
        const storeProv = pStore.address?.province || (pStore as any).province || '';
        const storeMun = pStore.address?.municipality || (pStore as any).municipality || '';
        const storeRep = pStore.address?.neighborhood || (pStore as any).reparto || '';

        if (filters.provinces && filters.provinces.length > 0 && !filters.provinces.includes(storeProv)) {
          return false;
        }
        if (filters.municipalities && filters.municipalities.length > 0 && !filters.municipalities.includes(storeMun)) {
          return false;
        }
        if (filters.repartos && filters.repartos.length > 0 && !filters.repartos.includes(storeRep)) {
          return false;
        }
      }

      // Tags filters
      if (filters.tagGroups && filters.tagGroups.length > 0) {
        const matchesGroup = p.tagSelections?.some(
          (ts) =>
            filters.tagGroups?.includes(ts.groupName || '') ||
            filters.tagGroups?.includes(ts.group || '') ||
            filters.tagGroups?.includes(ts.groupId || '')
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
      }

      return true;
    });
  }, [products, stores, filters]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;
  const currentProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const startItem = filteredProducts.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length);

  return (
    <div className="space-y-6">
      {/* Top action bar - EXACT SAME DESIGN AS STORE MANAGER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h3 className="text-xl font-extrabold text-gray-900">
            Catálogo de Productos y Servicios
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Gestiona ofertas, tiendas asignadas, precios y disponibilidad con edición en línea.
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo</span>
        </button>
      </div>

      {/* Search / Filter System - SAME AS PUBLIC MARKETPLACE USER VIEW */}
      <AdvancedSearch
        products={products}
        categories={categories}
        departmentsCatalog={departmentsCatalog || marketplaceConfig?.departmentsCatalog}
        tagsCatalog={tagsCatalog || marketplaceConfig?.tagsCatalog}
        geoCatalog={marketplaceConfig?.geoCatalog}
        offerTypesCatalog={effectiveProductTypesCatalog}
        paymentMethodsCatalog={paymentMethodsCatalog as any}
        deliveryMethodsCatalog={deliveryMethodsCatalog as any}
        stores={stores}
        filters={filters}
        onFilterChange={setFilters}
        onResetFilters={() => setFilters(DEFAULT_PRODUCT_FILTERS)}
        totalResults={filteredProducts.length}
        isExpanded={isFilterExpanded}
        onToggleExpanded={() => setIsFilterExpanded((prev) => !prev)}
      />

      {/* Products list table - EXACT SAME DESIGN & INLINE EDITING AS STORE MANAGER */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-600">
                <th className="py-3.5 px-4">Código</th>
                <th className="py-3.5 px-4">Producto</th>
                <th className="py-3.5 px-4">Clasificación</th>
                <th className="py-3.5 px-4">Precio</th>
                <th className="py-3.5 px-4">Tasas Permitidas</th>
                <th className="py-3.5 px-4">Etiquetas</th>
                <th className="py-3.5 px-4">Activo en Marketplace</th>
                <th className="py-3.5 px-4">Tipo</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {currentProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-500 text-sm italic">
                    No se encontraron productos o servicios que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                currentProducts.map((p) => {
                  const productStore = stores.find((s) => s.id === p.storeId);
                  const currentDeptObj =
                    catalogToUse.find((d) => d.name === p.category || d.id === p.category) ||
                    catalogToUse[0];
                  const deptSubcats = currentDeptObj?.subcategories || [];

                  return (
                    <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                      {/* Código del Producto */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-slate-900 text-white shadow-xs">
                          {p.code || 'S/C'}
                        </span>
                      </td>

                      {/* Tienda & Título del Producto - Inline Combo & Input */}
                      <td className="py-3 px-4 min-w-[240px]">
                        <div className="flex items-center gap-3">
                          <ThemeImage
                            src={p.imageUrl}
                            alt={p.title}
                            fallbackType="product"
                            className="w-10 h-10 rounded-xl object-cover border border-gray-200 shrink-0 bg-white"
                          />
                          <div className="flex-1 space-y-1">
                            {/* Combo de Tienda */}
                            <div>
                              <select
                                value={p.storeId}
                                onChange={(e) =>
                                  onUpdateProduct({ ...p, storeId: e.target.value })
                                }
                                className="w-full px-1.5 py-0.5 rounded-md border border-slate-200 bg-slate-50 text-xs font-extrabold text-indigo-900 focus:border-indigo-500 outline-none cursor-pointer"
                              >
                                {stores.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Título editable */}
                            <input
                              type="text"
                              value={p.title}
                              onChange={(e) =>
                                onUpdateProduct({ ...p, title: e.target.value })
                              }
                              className="font-bold text-gray-900 bg-transparent hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-emerald-500 rounded-md px-2 py-0.5 border border-transparent focus:border-emerald-400 text-sm outline-none w-full transition-all"
                              title="Toca para editar el título del producto"
                            />
                          </div>
                        </div>
                      </td>

                      {/* Clasificación (Departamento & Subdepartamento Combos) */}
                      <td className="py-3 px-4 min-w-[200px]">
                        <div className="space-y-1">
                          {/* Combo 1er Escalón: Departamento */}
                          <div>
                            <select
                              value={p.category}
                              onChange={(e) => {
                                const newCat = e.target.value as CategoryType;
                                const dObj = catalogToUse.find((d) => d.name === newCat || d.id === newCat);
                                const firstSub = dObj?.subcategories[0]?.name || '';
                                onUpdateProduct({ ...p, category: newCat, subcategory: firstSub });
                              }}
                              className="w-full px-2 py-1 rounded-lg border border-slate-300 bg-white text-xs font-bold text-indigo-900 focus:border-indigo-500 outline-none cursor-pointer"
                            >
                              {(catalogToUse.length > 0
                                ? catalogToUse.map((d) => ({ id: d.name, name: d.name }))
                                : categories
                              ).map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Combo 2do Escalón: Subdepartamento */}
                          <div className="pl-4">
                            {deptSubcats.length > 0 ? (
                              <select
                                value={p.subcategory || ''}
                                onChange={(e) =>
                                  onUpdateProduct({ ...p, subcategory: e.target.value })
                                }
                                className="w-full px-2 py-0.5 rounded-lg border border-slate-200 bg-emerald-50 text-[11px] font-semibold text-emerald-900 focus:border-emerald-500 outline-none cursor-pointer"
                              >
                                <option value="">-- Sin Subdepartamento --</option>
                                {deptSubcats.map((sub) => (
                                  <option key={sub.id} value={sub.name}>
                                    {sub.name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={p.subcategory || ''}
                                onChange={(e) =>
                                  onUpdateProduct({ ...p, subcategory: e.target.value })
                                }
                                placeholder="Subdepartamento..."
                                className="w-full px-2 py-0.5 rounded-lg border border-slate-200 bg-white text-[11px] font-semibold text-gray-800 outline-none"
                              />
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Precio y Moneda - Inline Numeric Input */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200">
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={p.priceUSD || 0}
                              onChange={(e) =>
                                onUpdateProduct({
                                  ...p,
                                  priceUSD: Number(e.target.value) || 0,
                                })
                              }
                              className="w-16 px-1.5 py-0.5 rounded-lg border border-gray-300 bg-white text-center font-black text-xs text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                              title="Toca para cambiar precio"
                            />
                            <span className="text-[11px] font-mono font-black text-slate-800">
                              {p.currency || productStore?.baseCurrency || 'USD'}
                            </span>
                          </div>
                          {(() => {
                            const allowedRates = getProductAllowedExchangeRates(p, productStore);
                            if (allowedRates.length > 0) {
                              return (
                                <span className="text-[10px] text-emerald-700 font-bold">
                                  +{allowedRates.length} {allowedRates.length === 1 ? 'tasa' : 'tasas'} permitidas
                                </span>
                              );
                            }
                            return (
                              <span className="text-[10px] text-slate-400 font-medium">
                                Solo en moneda original
                              </span>
                            );
                          })()}
                        </div>
                      </td>

                      {/* Tasas de Cambio Permitidas - Combobox MultiSelect como en filtros */}
                      <td className="py-3 px-4 min-w-[210px]">
                        {productStore?.exchangeRates && productStore.exchangeRates.length > 0 ? (
                          <SearchableMultiSelect
                            options={productStore.exchangeRates.map((r) => ({
                              value: r.id,
                              label: `1 ${r.fromCurrency} = ${r.rate} ${r.toCurrency}`,
                              sublabel: `${r.fromCurrency} → ${r.toCurrency}`,
                            }))}
                            values={p.allowedExchangeRateIds || []}
                            onChange={(newRateIds) => {
                              onUpdateProduct({
                                ...p,
                                allowedExchangeRateIds: newRateIds,
                              });
                            }}
                            placeholder="Todas las tasas..."
                            allLabel="Todas las tasas"
                            size="sm"
                          />
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Sin tasas en tienda
                          </span>
                        )}
                      </td>

                      {/* Etiquetas - Combobox MultiSelect como en filtros */}
                      <td className="py-3 px-4 min-w-[210px]">
                        <SearchableMultiSelect
                          options={effectiveTagsCatalog.flatMap((g) =>
                            g.tags.map((t) => ({
                              value: t.name,
                              label: t.name,
                              sublabel: g.name,
                            }))
                          )}
                          values={p.tags || []}
                          onChange={(newTags) => {
                            const newTagSelections = newTags.map((tagName) => {
                              const foundGroup = effectiveTagsCatalog.find((g) =>
                                g.tags.some((t) => t.name === tagName)
                              );
                              return {
                                groupId: foundGroup?.id,
                                groupName: foundGroup?.name || 'General',
                                group: foundGroup?.name || 'General',
                                tagName,
                                value: tagName,
                              };
                            });
                            onUpdateProduct({
                              ...p,
                              tags: newTags,
                              tagSelections: newTagSelections,
                            });
                          }}
                          placeholder="Etiquetas..."
                          allLabel="Todas las etiquetas"
                          size="sm"
                        />
                      </td>

                      {/* Activo en Marketplace - Toggle Switch Interruptor */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input
                              type="checkbox"
                              checked={!!p.isAvailable}
                              onChange={() =>
                                onUpdateProduct({
                                  ...p,
                                  isAvailable: !p.isAvailable,
                                 })
                              }
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                          </label>
                          <span
                            className={`text-xs font-bold ${
                              p.isAvailable ? 'text-emerald-800' : 'text-slate-400'
                            }`}
                          >
                            {p.isAvailable ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </td>

                      {/* Tipo Oferta (Nomenclador Dinámico - Sin iconos) */}
                      <td className="py-3 px-4">
                        {(() => {
                          const matchedType = effectiveProductTypesCatalog.find(
                            (pt) => pt.id === p.productTypeId || pt.name === p.productType
                          ) || effectiveProductTypesCatalog[0];

                          return (
                            <select
                              value={matchedType?.id || 'pt-producto'}
                              onChange={(e) => {
                                const newTypeId = e.target.value;
                                const targetPt = effectiveProductTypesCatalog.find((pt) => pt.id === newTypeId);
                                onUpdateProduct({
                                  ...p,
                                  productTypeId: targetPt?.id,
                                  productType: targetPt?.name,
                                });
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-900 border border-indigo-200 focus:outline-none focus:ring-1 focus:ring-indigo-400 cursor-pointer"
                            >
                              {effectiveProductTypesCatalog.map((pt) => (
                                <option key={pt.id} value={pt.id}>
                                  {pt.name}
                                </option>
                              ))}
                            </select>
                          );
                        })()}
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-emerald-50 text-gray-600 hover:text-emerald-700 transition-colors cursor-pointer"
                            title="Editar en modal completo"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-rose-50 text-gray-600 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Eliminar publicación"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer - EXACT SAME DESIGN AS STORE MANAGER */}
        {filteredProducts.length > 0 && (
          <div className="bg-gray-50/80 px-4 py-3.5 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold text-gray-600">
            <div>
              Mostrando <span className="font-bold text-gray-900">{startItem}</span> - <span className="font-bold text-gray-900">{endItem}</span> de <span className="font-bold text-gray-900">{filteredProducts.length}</span> ofertas (Página <span className="font-bold text-emerald-700">{currentPage}</span> de {totalPages})
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((pg) => Math.max(1, pg - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Anterior</span>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg font-bold transition-all cursor-pointer ${
                    currentPage === page
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((pg) => Math.min(totalPages, pg + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <span>Siguiente</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-gray-100 p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-black text-gray-900">
                {editingProduct ? 'Editar Publicación' : `Nueva Publicación para ${marketplaceConfig?.name || 'Marketplace'}`}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Código Único del Producto & Tienda */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase text-gray-700">
                      Código Único del Producto *
                    </label>
                    <button
                      type="button"
                      onClick={() => setCode(generateUniqueCode())}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer inline-flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Generar código</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Ej. PRD-001"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 font-mono font-bold text-sm text-gray-900 focus:border-emerald-500 outline-none uppercase"
                    required
                  />
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Identificador único en toda la base de datos.
                  </p>
                </div>

                {/* Store Selector (Shows Exchange Rate!) */}
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                    Tienda o Proveedor del Producto
                  </label>
                  <SearchableSelect
                    options={stores.map((s) => ({
                      value: s.id,
                      label: s.name,
                      sublabel: s.exchangeRates && s.exchangeRates.length > 0
                        ? `Tasa: 1 ${s.exchangeRates[0].fromCurrency} = ${s.exchangeRates[0].rate} ${s.exchangeRates[0].toCurrency}`
                        : (s.usdToCupRate ? `Tasa: ${s.usdToCupRate}` : 'Tasa estándar'),
                    }))}
                    value={storeId}
                    onChange={(val) => setStoreId(val || '')}
                    searchPlaceholder="Buscar tienda..."
                  />
                  <p className="text-[11px] text-emerald-700 mt-1">
                    * Calcula la equivalencia según las tasas configuradas de la tienda.
                  </p>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Título del Producto / Servicio
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Combo Familiar de Cárnicos #1..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-emerald-500 outline-none"
                  required
                />
              </div>

              {/* CLASSIFICATION */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold uppercase text-indigo-900 mb-1 flex items-center gap-1.5">
                    <FolderTree className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Departamento (Opcional)</span>
                  </label>
                  <SearchableSelect
                    options={(catalogToUse.length > 0
                      ? catalogToUse.map((d) => ({ value: d.name, label: d.name }))
                      : categories.map((c) => ({ value: c.id, label: c.name }))
                    )}
                    value={category}
                    onChange={(val) => {
                      const newCat = (val || '') as CategoryType;
                      setCategory(newCat);
                      setSubcategory('');
                    }}
                    searchPlaceholder="Seleccionar departamento (opcional)..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-emerald-900 mb-1 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Subdepartamento (Opcional)</span>
                  </label>
                  {!category ? (
                    <div className="px-3.5 py-2.5 rounded-xl border border-dashed border-slate-300 bg-white text-slate-400 text-xs font-medium flex items-center h-[42px]">
                      Selecciona primero un departamento (opcional)
                    </div>
                  ) : availableSubcats.length > 0 ? (
                    <SearchableSelect
                      options={availableSubcats.map((s) => ({
                        value: s.name,
                        label: s.name,
                      }))}
                      value={subcategory}
                      onChange={(val) => setSubcategory(val || '')}
                      searchPlaceholder="Seleccionar subdepartamento (opcional)..."
                    />
                  ) : (
                    <input
                      type="text"
                      value={subcategory}
                      onChange={(e) => setSubcategory(e.target.value)}
                      placeholder="Ej. Plomería, Herramientas, Carnes..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:border-emerald-500 outline-none"
                    />
                  )}
                </div>
              </div>

              {/* Currency & Price Section (Arquitectura por Producto) */}
              <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  {/* Tipo de Moneda del Producto */}
                  <div className="sm:col-span-5">
                    <label className="block text-xs font-black uppercase text-slate-800 mb-1 flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Moneda del Producto *</span>
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => {
                        const newCurr = e.target.value;
                        setCurrency(newCurr);
                        const matchingRates = (selectedStore?.exchangeRates || []).filter(
                          (r) => r.fromCurrency === newCurr
                        );
                        setAllowedExchangeRateIds(matchingRates.map((r) => r.id));
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-sm text-slate-900 focus:border-emerald-500 outline-none cursor-pointer"
                    >
                      {(marketplaceConfig?.currenciesCatalog || INITIAL_CURRENCIES_CATALOG)
                        .filter((c) => c.active !== false)
                        .map((c) => (
                          <option key={c.id} value={c.code}>
                            {c.code} - {c.name} ({c.symbol})
                          </option>
                        ))}
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1">
                      El precio del producto está expresado en esta moneda.
                    </p>
                  </div>

                  {/* Precio en la Moneda Seleccionada */}
                  <div className="sm:col-span-7">
                    <label className="block text-xs font-black uppercase text-slate-800 mb-1 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Precio del Producto ({currency}) *</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={priceUSD}
                        onChange={(e) => setPriceUSD(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-black text-lg text-slate-900 focus:border-emerald-500 outline-none pr-16"
                        required
                        placeholder="0.00"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono font-black text-xs px-2 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                        {currency}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tasas de Cambio Permitidas para este Producto */}
                <div className="pt-3 border-t border-slate-200/80 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                        <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Tasas de Cambio Permitidas de la Tienda</span>
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Selecciona en qué otras monedas la tienda permite cobrar este producto y con qué tasas.
                      </p>
                    </div>

                    {currentStoreRatesForCurrency.length > 0 && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={handleSelectAllRates}
                          className="px-2 py-1 rounded-lg text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 cursor-pointer transition-colors"
                        >
                          Habilitar todas
                        </button>
                        <button
                          type="button"
                          onClick={handleDeselectAllRates}
                          className="px-2 py-1 rounded-lg text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 cursor-pointer transition-colors"
                        >
                          Desmarcar todas
                        </button>
                      </div>
                    )}
                  </div>

                  {currentStoreRatesForCurrency.length === 0 ? (
                    <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                      <p className="font-bold">
                        La tienda "{selectedStore?.name}" no tiene tasas registradas con origen {currency}.
                      </p>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        Este producto se venderá y cobrará únicamente en <span className="font-bold">{currency}</span>. Si deseas permitir cobros en otras monedas, añade las tasas correspondientes en la pestaña de Tasas de la Tienda.
                      </p>
                    </div>
                  ) : (
                    <SearchableMultiSelect
                      options={currentStoreRatesForCurrency.map((rate) => {
                        const convertedPrice = Math.round((priceUSD || 0) * rate.rate * 100) / 100;
                        return {
                          value: rate.id,
                          label: `Permitir cobro en ${rate.toCurrency} (${formatNumberWithDots(convertedPrice)} ${rate.toCurrency})`,
                          sublabel: `Tasa: 1 ${rate.fromCurrency} = ${rate.rate} ${rate.toCurrency}`,
                        };
                      })}
                      values={allowedExchangeRateIds}
                      onChange={(newIds) => setAllowedExchangeRateIds(newIds)}
                      placeholder="Seleccionar monedas de cobro permitidas..."
                      allLabel="Todas las tasas habilitadas"
                    />
                  )}
                </div>
              </div>

              {/* Image Gallery Uploader */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <ImageGalleryUploader
                  images={images}
                  mainImage={imageUrl}
                  onImagesChange={(newImgs, newMain) => {
                    setImages(newImgs);
                    setImageUrl(newMain);
                  }}
                  label="Galería de Fotos del Producto / Servicio"
                  description="Sube una o varias imágenes locales. La primera o la seleccionada como principal se mostrará en la tarjeta."
                  fallbackType="product"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Descripción Detallada
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Detalla lo que incluye, peso, marca, garantía..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-emerald-500 outline-none"
                  required
                />
              </div>

              {/* Multi-Tag Selection (Combo Superetiquetas -> Combobox Multi-Select Etiquetas -> List of Selected Tags) */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase text-slate-700 flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-emerald-600" />
                    <span>Etiquetado de Producto (Superetiquetas y Etiquetas)</span>
                  </label>
                  {selectedTagSelections.length > 0 && (
                    <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      <span>{selectedTagSelections.length} seleccionadas</span>
                    </span>
                  )}
                </div>

                {/* Combos con Superetiquetas y Etiquetas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-slate-600 mb-1">
                      Filtrar por Superetiqueta (Opcional)
                    </label>
                    <SearchableSelect
                      options={effectiveTagsCatalog.map((group) => ({
                        value: group.id,
                        label: group.name,
                        sublabel: `${group.tags.length} etiquetas`,
                      }))}
                      value={selectedSupertagComboId}
                      onChange={(val) => setSelectedSupertagComboId(val || '')}
                      searchPlaceholder="Todas las superetiquetas..."
                    />
                  </div>

                  {/* Combobox Selección Múltiple de Etiquetas */}
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-slate-600 mb-1">
                      Selecciona Etiquetas (Combobox Selección Múltiple)
                    </label>
                    <SearchableMultiSelect
                      options={
                        selectedSupertagComboId
                          ? (effectiveTagsCatalog.find((g) => g.id === selectedSupertagComboId)?.tags || []).map((t) => ({
                              value: t.id,
                              label: t.name,
                              sublabel: effectiveTagsCatalog.find((g) => g.id === selectedSupertagComboId)?.name,
                            }))
                          : effectiveTagsCatalog.flatMap((g) =>
                              g.tags.map((t) => ({
                                value: t.id,
                                label: t.name,
                                sublabel: g.name,
                              }))
                            )
                      }
                      values={selectedTagSelections.map((ts) => ts.tagId || ts.tagName || ts.value || '')}
                      onChange={(selectedTagIds) => {
                        const newSelections: ProductTagSelection[] = [];
                        effectiveTagsCatalog.forEach((group) => {
                          group.tags.forEach((tagItem) => {
                            if (selectedTagIds.includes(tagItem.id) || selectedTagIds.includes(tagItem.name)) {
                              newSelections.push({
                                group: group.name,
                                groupName: group.name,
                                groupId: group.id,
                                value: tagItem.name,
                                tagName: tagItem.name,
                                tagId: tagItem.id,
                              });
                            }
                          });
                        });
                        setSelectedTagSelections(newSelections);
                      }}
                      placeholder="Seleccionar etiquetas..."
                      allLabel="Todas las etiquetas asignadas"
                    />
                  </div>
                </div>

                {/* 3. Listado de etiquetas seleccionadas por cada producto */}
                <div className="pt-2 border-t border-slate-200">
                  <label className="block text-[11px] font-extrabold uppercase text-slate-600 mb-2">
                    Etiquetas Seleccionadas para esta Oferta:
                  </label>
                  {selectedTagSelections.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No se han seleccionado etiquetas aún.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedTagSelections.map((ts, idx) => {
                        const gName = ts.groupName || ts.group || 'Etiqueta';
                        const vName = ts.tagName || ts.value || '';
                        return (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold shadow-xs"
                          >
                            <Tag className="w-3 h-3 shrink-0 opacity-80" />
                            <span className="opacity-75">{gName}:</span>
                            <span>{vName}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedTagSelections((prev) => prev.filter((_, i) => i !== idx))
                              }
                              className="p-0.5 rounded-full hover:bg-white/20 text-white cursor-pointer ml-0.5"
                              title="Quitar etiqueta"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Nomenclador de Tipo de Oferta & Opciones de Disponibilidad */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                    Tipo de Oferta (Nomenclador de Negocio)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {effectiveProductTypesCatalog.map((pt) => {
                      const isSelected = productTypeId === pt.id;
                      return (
                        <button
                          key={pt.id}
                          type="button"
                          onClick={() => setProductTypeId(pt.id)}
                          className={`flex items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-300'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <p className="text-xs font-black truncate">{pt.name}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-900">
                      <input
                        type="checkbox"
                        checked={isAvailable}
                        onChange={(e) => setIsAvailable(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                      />
                      <span>Activo en el marketplace</span>
                    </label>
                    <p className="text-[11px] text-slate-500 mt-1 pl-6">
                      *(Si está desactivado o si la tienda proveedora está inactiva, la oferta no se mostrará en el mercado)*
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm cursor-pointer inline-flex items-center justify-center gap-1.5"
                >
                  <X className="w-4 h-4" />
                  <span>Cancelar</span>
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md cursor-pointer inline-flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingProduct ? 'Guardar Cambios' : `Publicar en ${marketplaceConfig?.name || 'Marketplace'}`}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
