import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  CategoryItem,
  FilterState,
  PriceFilterCurrency,
  Store,
  Product,
  DepartmentCategory,
  TagGroup,
  GeoProvince,
  NomenclatorItem,
  PaymentMethodItem,
  DeliveryMethodItem,
} from '../../types';
import {
  INITIAL_DEPARTMENT_CATALOG,
  INITIAL_TAGS_CATALOG,
  INITIAL_GEO_CATALOG,
  INITIAL_PRODUCT_TYPES_CATALOG,
  INITIAL_PAYMENT_METHODS_CATALOG,
  INITIAL_DELIVERY_METHODS_CATALOG,
} from '../../data/initialData';
import {
  getStorePaymentMethodsForCurrency,
  getStoreAcceptedCurrencies,
} from '../../lib/cartUtils';
import {
  RotateCcw,
  Store as StoreIcon,
  FolderTree,
  Tag,
  MapPin,
  DollarSign,
  CreditCard,
  Truck,
  Filter,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Search,
  Hash,
  X,
  Eye,
  ShoppingBag,
} from 'lucide-react';
import { SearchableMultiSelect } from '../common/SearchableMultiSelect';
import { SearchableSelect } from '../common/SearchableSelect';
import { interfaz } from '../../data/interfaz';

interface AdvancedSearchProps {
  products?: Product[];
  onSelectProduct?: (product: Product) => void;
  categories?: CategoryItem[];
  departmentsCatalog?: DepartmentCategory[];
  tagsCatalog?: TagGroup[];
  geoCatalog?: GeoProvince[];
  offerTypesCatalog?: NomenclatorItem[];
  paymentMethodsCatalog?: PaymentMethodItem[];
  deliveryMethodsCatalog?: DeliveryMethodItem[];
  stores: Store[];
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  onResetFilters: () => void;
  totalResults: number;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  products = [],
  onSelectProduct,
  departmentsCatalog,
  tagsCatalog,
  geoCatalog,
  offerTypesCatalog,
  paymentMethodsCatalog,
  deliveryMethodsCatalog,
  stores,
  filters,
  onFilterChange,
  onResetFilters,
  totalResults,
  isExpanded,
  onToggleExpanded,
}) => {
  const t = interfaz.filters;
  const activeStores = stores.filter((s) => s.active);
  const catalogToUse =
    departmentsCatalog && departmentsCatalog.length > 0
      ? departmentsCatalog
      : INITIAL_DEPARTMENT_CATALOG;
  const effectiveTagsCatalog =
    tagsCatalog && tagsCatalog.length > 0 ? tagsCatalog : INITIAL_TAGS_CATALOG;
  const effectiveGeoCatalog =
    geoCatalog && geoCatalog.length > 0 ? geoCatalog : INITIAL_GEO_CATALOG;
  const effectiveOfferTypes =
    offerTypesCatalog && offerTypesCatalog.length > 0
      ? offerTypesCatalog
      : INITIAL_PRODUCT_TYPES_CATALOG;
  const effectivePaymentMethods =
    paymentMethodsCatalog && paymentMethodsCatalog.length > 0
      ? paymentMethodsCatalog
      : INITIAL_PAYMENT_METHODS_CATALOG;
  const effectiveDeliveryMethods =
    deliveryMethodsCatalog && deliveryMethodsCatalog.length > 0
      ? deliveryMethodsCatalog
      : INITIAL_DELIVERY_METHODS_CATALOG;

  // --- DEPENDENCY & DISABLING LOGIC ---

  // Helper to extract location safely from Store
  const getStoreLocation = (s: Store) => ({
    province: s.address?.province || (s as any).province || '',
    municipality: s.address?.municipality || (s as any).municipality || '',
    reparto: s.address?.neighborhood || (s as any).reparto || (s as any).neighborhood || '',
  });

  // 1. Geography & Stores hierarchy:
  // Order: Provincia -> Municipio -> Reparto -> Tienda
  // When accessed left-to-right: each filter is selected sequentially.
  // When accessed out-of-order: unselected filters to the left are blocked (disabled),
  // while the selected filter and filters to its right remain enabled.
  const isProvinceSelected = Boolean(filters.provinces && filters.provinces.length > 0);
  const isMunicipalitySelected = Boolean(filters.municipalities && filters.municipalities.length > 0);
  const isRepartoSelected = Boolean(filters.repartos && filters.repartos.length > 0);
  const isStoreSelected = Boolean(filters.storeIds && filters.storeIds.length > 0);

  const isProvinceDisabled = !isProvinceSelected && (isMunicipalitySelected || isRepartoSelected || isStoreSelected);
  const isMunicipalityDisabled = !isMunicipalitySelected && (isRepartoSelected || isStoreSelected);
  const isRepartoDisabled = !isRepartoSelected && isStoreSelected;

  // 2. Departments & Subdepartments:
  // If Subdepartment is directly selected without Department -> disables Department
  const isCategorySelected = Boolean(filters.categories && filters.categories.length > 0);
  const isSubcategorySelected = Boolean(filters.subcategories && filters.subcategories.length > 0);
  const isDepartmentDisabled = !isCategorySelected && isSubcategorySelected;

  // 3. Supertags & Tags:
  // If Tag is directly selected without Supertag -> disables Supertag
  const isTagGroupSelected = Boolean(filters.tagGroups && filters.tagGroups.length > 0);
  const isTagSelected = Boolean(filters.tagValues && filters.tagValues.length > 0);
  const isSupertagDisabled = !isTagGroupSelected && isTagSelected;

  // --- ESCALONADO / CASCADING OPTIONS ---

  // PROVINCES OPTIONS
  const provinceOptions = effectiveGeoCatalog.map((p) => ({
    value: p.name,
    label: p.name,
    sublabel: `${p.municipalities?.length || 0} municipios`,
  }));

  // Selected Provinces List for cascading down
  const selectedProvincesList =
    filters.provinces && filters.provinces.length > 0
      ? effectiveGeoCatalog.filter((p) => filters.provinces?.includes(p.name))
      : effectiveGeoCatalog;

  // MUNICIPALITIES OPTIONS (cascades from selected provinces)
  const municipalityOptions = selectedProvincesList.flatMap((p) =>
    (p.municipalities || []).map((m) => ({
      value: m.name,
      label: m.name,
      sublabel: p.name,
    }))
  );

  // Selected Municipalities List for cascading down
  const selectedMunicipalitiesList = selectedProvincesList.flatMap((p) =>
    filters.municipalities && filters.municipalities.length > 0
      ? (p.municipalities || []).filter((m) =>
          filters.municipalities?.includes(m.name)
        )
      : p.municipalities || []
  );

  // REPARTOS OPTIONS (cascades from selected municipalities)
  const repartoOptions = selectedMunicipalitiesList.flatMap((m) =>
    (m.repartos || []).map((r) => ({
      value: r.name,
      label: r.name,
      sublabel: m.name,
    }))
  );

  // STORES OPTIONS (cascades from Repartos -> Municipalities -> Provinces -> Payment/Delivery)
  const matchingStores = activeStores.filter((s) => {
    const loc = getStoreLocation(s);

    // 1. Reparto filter
    if (filters.repartos && filters.repartos.length > 0) {
      if (!loc.reparto || !filters.repartos.includes(loc.reparto)) {
        return false;
      }
    }
    // 2. Municipality filter (if no reparto filter, or in addition)
    if (filters.municipalities && filters.municipalities.length > 0) {
      if (!loc.municipality || !filters.municipalities.includes(loc.municipality)) {
        return false;
      }
    }
    // 3. Province filter (if no municipality filter, or in addition)
    if (filters.provinces && filters.provinces.length > 0) {
      if (!loc.province || !filters.provinces.includes(loc.province)) {
        return false;
      }
    }
    // 4. Payment method filter (Relación Moneda ↔ Forma de Pago)
    if (filters.paymentMethods && filters.paymentMethods.length > 0) {
      const targetCurrencies =
        filters.currencies && filters.currencies.length > 0
          ? filters.currencies
          : getStoreAcceptedCurrencies(s);

      const storePayIds = Array.from(
        new Set(
          targetCurrencies.flatMap((curr) =>
            getStorePaymentMethodsForCurrency(s, curr, effectivePaymentMethods).map((pm) => pm.id)
          )
        )
      );

      const matchesPayment = filters.paymentMethods.some((selected) => {
        if (selected === 'transfer' || selected === 'pm-transferencia') {
          return (
            storePayIds.includes('pm-transferencia') ||
            storePayIds.includes('transfer')
          );
        }
        if (selected === 'cash' || selected === 'pm-efectivo') {
          return storePayIds.includes('pm-efectivo') || storePayIds.includes('cash');
        }
        return storePayIds.includes(selected);
      });
      if (!matchesPayment) return false;
    } else if (filters.transferOnly && !s.paymentOptions?.transferAccepted) {
      return false;
    }

    // 5. Delivery method filter (support catalog IDs and legacy values)
    if (filters.deliveryMethods && filters.deliveryMethods.length > 0) {
      const storeDeliveryIds: string[] = s.deliveryMethodIds && s.deliveryMethodIds.length > 0
        ? s.deliveryMethodIds
        : s.deliveryAvailable
        ? ['dm-mensajeria', 'delivery']
        : ['dm-recogida', 'pickup'];

      const matchesDelivery = filters.deliveryMethods.some((selected) => {
        if (selected === 'delivery' || selected === 'dm-mensajeria') {
          return storeDeliveryIds.includes('dm-mensajeria') || storeDeliveryIds.includes('delivery') || Boolean(s.deliveryAvailable);
        }
        if (selected === 'pickup' || selected === 'dm-recogida') {
          return storeDeliveryIds.includes('dm-recogida') || storeDeliveryIds.includes('pickup') || !s.deliveryAvailable;
        }
        return storeDeliveryIds.includes(selected);
      });
      if (!matchesDelivery) return false;
    } else if (filters.deliveryOnly && !s.deliveryAvailable) {
      return false;
    }

    return true;
  });

  const storeOptions = matchingStores.map((s) => {
    const loc = getStoreLocation(s);
    return {
      value: s.id,
      label: s.name,
      sublabel: `${loc.province || ''}${loc.municipality ? ' • ' + loc.municipality : ''}${loc.reparto ? ' • ' + loc.reparto : ''}`,
    };
  });

  // DEPARTMENTS & SUBDEPARTMENTS
  const departmentOptions = catalogToUse.map((dept) => ({
    value: dept.name,
    label: dept.name,
    sublabel: `${dept.subcategories?.length || 0} subdepartamentos`,
  }));

  const selectedDeptsList =
    filters.categories && filters.categories.length > 0
      ? catalogToUse.filter((d) => filters.categories?.includes(d.name))
      : catalogToUse;

  const subcategoryOptions = selectedDeptsList.flatMap((d) =>
    (d.subcategories || []).map((sub) => ({
      value: sub.name,
      label: sub.name,
      sublabel: d.name,
    }))
  );

  // SUPERTAGS & TAGS
  const supertagOptions = effectiveTagsCatalog.map((tg) => ({
    value: tg.name,
    label: tg.name,
    sublabel: `${tg.tags?.length || 0} etiquetas`,
  }));

  const selectedTagGroupsList =
    filters.tagGroups && filters.tagGroups.length > 0
      ? effectiveTagsCatalog.filter((g) => filters.tagGroups?.includes(g.name))
      : effectiveTagsCatalog;

  const tagOptions = selectedTagGroupsList.flatMap((g) =>
    (g.tags || []).map((tItem) => ({
      value: tItem.name,
      label: tItem.name,
      sublabel: g.name,
    }))
  );

  // OFFER TYPE (Nomenclador Dinámico de Tipos de Oferta)
  const itemTypeOptions = effectiveOfferTypes.map((ot) => ({
    value: ot.id,
    label: ot.name,
    sublabel: ot.description || 'Tipo de oferta en el catálogo',
  }));

  // TIPO DE PAGO (Nomenclador Dinámico con Gravamen)
  const paymentMethodOptions = effectivePaymentMethods.map((pm) => {
    const gravamenText = pm.gravamen && pm.gravamen > 0 ? ` (+${pm.gravamen}%)` : '';
    return {
      value: pm.id,
      label: `${pm.name}${gravamenText}`,
      sublabel: pm.gravamen && pm.gravamen > 0
        ? `Gravamen del ${pm.gravamen}% • ${pm.description || 'Método de pago'}`
        : pm.description || 'Método de pago sin recargo',
    };
  });

  // MENSAJERÍA / RECOGIDA (Nomenclador Dinámico)
  const deliveryMethodOptions = effectiveDeliveryMethods.map((dm) => ({
    value: dm.id,
    label: dm.name,
    sublabel: dm.description || 'Modalidad de entrega/recogida',
  }));

  // Filter Update Logic with cascading prune and sync
  const handleUpdate = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    if (key === 'storeIds') {
      const newStoreIds = value as string[];
      onFilterChange({
        ...filters,
        storeIds: newStoreIds,
      });
    } else if (key === 'repartos') {
      const newReps = value as string[];
      // Prune storeIds if store is not in new repartos
      const validStores = (filters.storeIds || []).filter((id) => {
        const st = activeStores.find((s) => s.id === id);
        if (!st) return false;
        const loc = getStoreLocation(st);
        if (newReps.length > 0 && (!loc.reparto || !newReps.includes(loc.reparto))) return false;
        return true;
      });

      onFilterChange({
        ...filters,
        repartos: newReps,
        storeIds: validStores,
      });
    } else if (key === 'municipalities') {
      const newMuns = value as string[];
      // Prune repartos that no longer belong to selected municipalities
      const validReps = (filters.repartos || []).filter((r) =>
        effectiveGeoCatalog
          .filter((p) => (filters.provinces || []).length === 0 || (filters.provinces || []).includes(p.name))
          .flatMap((p) => p.municipalities || [])
          .filter((m) => newMuns.length === 0 || newMuns.includes(m.name))
          .some((m) => m.repartos?.some((rep) => rep.name === r))
      );
      // Prune storeIds
      const validStores = (filters.storeIds || []).filter((id) => {
        const st = activeStores.find((s) => s.id === id);
        if (!st) return false;
        const loc = getStoreLocation(st);
        if (newMuns.length > 0 && (!loc.municipality || !newMuns.includes(loc.municipality))) return false;
        return true;
      });

      onFilterChange({
        ...filters,
        municipalities: newMuns,
        repartos: validReps,
        storeIds: validStores,
      });
    } else if (key === 'provinces') {
      const newProvs = value as string[];
      // Prune municipalities
      const validMuns = (filters.municipalities || []).filter((m) =>
        effectiveGeoCatalog
          .filter((p) => newProvs.length === 0 || newProvs.includes(p.name))
          .some((p) => p.municipalities?.some((mun) => mun.name === m))
      );
      // Prune repartos
      const validReps = (filters.repartos || []).filter((r) =>
        effectiveGeoCatalog
          .filter((p) => newProvs.length === 0 || newProvs.includes(p.name))
          .flatMap((p) => p.municipalities || [])
          .filter((m) => validMuns.length === 0 || validMuns.includes(m.name))
          .some((m) => m.repartos?.some((rep) => rep.name === r))
      );
      // Prune storeIds
      const validStores = (filters.storeIds || []).filter((id) => {
        const st = activeStores.find((s) => s.id === id);
        if (!st) return false;
        const loc = getStoreLocation(st);
        if (newProvs.length > 0 && (!loc.province || !newProvs.includes(loc.province))) return false;
        return true;
      });

      onFilterChange({
        ...filters,
        provinces: newProvs,
        municipalities: validMuns,
        repartos: validReps,
        storeIds: validStores,
      });
    } else if (key === 'subcategories') {
      const newSubcats = value as string[];
      onFilterChange({
        ...filters,
        subcategories: newSubcats,
      });
    } else if (key === 'categories') {
      const newCats = value as string[];
      // Prune subcategories that don't belong to the selected departments
      const validSubcats = (filters.subcategories || []).filter((sub) =>
        catalogToUse
          .filter((d) => newCats.length === 0 || newCats.includes(d.name))
          .some((d) => d.subcategories?.some((s) => s.name === sub))
      );
      onFilterChange({
        ...filters,
        categories: newCats,
        subcategories: validSubcats,
      });
    } else if (key === 'tagValues') {
      const newTags = value as string[];
      onFilterChange({
        ...filters,
        tagValues: newTags,
      });
    } else if (key === 'tagGroups') {
      const newGroups = value as string[];
      // Prune tag values that don't belong to the selected supertags
      const validTags = (filters.tagValues || []).filter((tv) =>
        effectiveTagsCatalog
          .filter((g) => newGroups.length === 0 || newGroups.includes(g.name))
          .some((g) => g.tags?.some((tag) => tag.name === tv))
      );
      onFilterChange({
        ...filters,
        tagGroups: newGroups,
        tagValues: validTags,
      });
    } else {
      onFilterChange({
        ...filters,
        [key]: value,
      });
    }
  };

  // Price validation: strictly enforce positive numbers only (no 'e', '+', '-', letters or negative values)
  const handleNumericPriceInput = (field: 'minPrice' | 'maxPrice', rawValue: string) => {
    const cleaned = rawValue.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    const sanitized = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : cleaned;

    if (sanitized === '' || sanitized === '.') {
      handleUpdate(field, '');
      return;
    }

    const numVal = parseFloat(sanitized);
    if (!isNaN(numVal) && numVal >= 0) {
      handleUpdate(field, numVal);
    } else {
      handleUpdate(field, '');
    }
  };

  const preventInvalidPriceKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['e', 'E', '+', '-'].includes(e.key)) {
      e.preventDefault();
    }
  };

  // Helpers to generate disabled reason notices for out-of-order selections
  const getProvinceDisabledReason = () => {
    if (!isProvinceDisabled) return '';
    if (isStoreSelected) return '(Bloqueado por tienda)';
    if (isRepartoSelected) return '(Bloqueado por reparto)';
    if (isMunicipalitySelected) return '(Bloqueado por municipio)';
    return '(Bloqueado)';
  };

  const getMunicipalityDisabledReason = () => {
    if (!isMunicipalityDisabled) return '';
    if (isStoreSelected) return '(Bloqueado por tienda)';
    if (isRepartoSelected) return '(Bloqueado por reparto)';
    return '(Bloqueado)';
  };

  const getRepartoDisabledReason = () => {
    if (!isRepartoDisabled) return '';
    if (isStoreSelected) return '(Bloqueado por tienda)';
    return '(Bloqueado)';
  };

  // Count active filters
  // --- LIVE SEARCH HOOKS & LOGIC FOR CODE & DESCRIPTION ---
  const [isCodeFocused, setIsCodeFocused] = useState(false);
  const [isDescFocused, setIsDescFocused] = useState(false);
  const codeContainerRef = useRef<HTMLDivElement>(null);
  const descContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (codeContainerRef.current && !codeContainerRef.current.contains(e.target as Node)) {
        setIsCodeFocused(false);
      }
      if (descContainerRef.current && !descContainerRef.current.contains(e.target as Node)) {
        setIsDescFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const codeQuery = (filters.code || '').trim().toLowerCase();
  const matchingByCode = useMemo(() => {
    if (!codeQuery || !products) return [];
    return products.filter((p) => {
      if (p.isAvailable === false) return false;
      return p.code ? p.code.toLowerCase().includes(codeQuery) : false;
    });
  }, [products, codeQuery]);

  const descQuery = (filters.searchQuery || '').trim().toLowerCase();
  const matchingByDesc = useMemo(() => {
    if (!descQuery || !products) return [];
    return products.filter((p) => {
      if (p.isAvailable === false) return false;
      return (p.description || '').toLowerCase().includes(descQuery);
    });
  }, [products, descQuery]);

  const isServiceItem = (p: Product) => {
    return (
      p.productTypeId === 'pt-servicio' ||
      (p.productType || '').toLowerCase().includes('servicio') ||
      p.category === 'Servicios Profesionales'
    );
  };

  const getStoreName = (storeId: string) => {
    const s = stores.find((st) => st.id === storeId);
    return s?.name || 'Tienda';
  };

  const renderDescSnippet = (desc: string, query: string) => {
    if (!desc || !query) return desc;
    const lowerDesc = desc.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const matchIndex = lowerDesc.indexOf(lowerQuery);
    if (matchIndex === -1) {
      return desc.length > 70 ? desc.slice(0, 70) + '...' : desc;
    }

    const start = Math.max(0, matchIndex - 25);
    const end = Math.min(desc.length, matchIndex + query.length + 35);
    const prefix = start > 0 ? '...' : '';
    const suffix = end < desc.length ? '...' : '';

    const before = desc.substring(start, matchIndex);
    const match = desc.substring(matchIndex, matchIndex + query.length);
    const after = desc.substring(matchIndex + query.length, end);

    return (
      <span className="text-[11px] text-slate-600 dark:text-slate-300">
        {prefix}
        {before}
        <span className="bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-bold px-1 rounded mx-0.5 border border-amber-300 dark:border-amber-700">
          {match}
        </span>
        {after}
        {suffix}
      </span>
    );
  };

  const renderCodeMatch = (codeStr: string, query: string) => {
    if (!codeStr || !query) return codeStr;
    const lowerCode = codeStr.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const matchIndex = lowerCode.indexOf(lowerQuery);
    if (matchIndex === -1) return codeStr;

    const before = codeStr.substring(0, matchIndex);
    const match = codeStr.substring(matchIndex, matchIndex + query.length);
    const after = codeStr.substring(matchIndex + query.length);

    return (
      <span>
        {before}
        <span className="bg-amber-200 dark:bg-amber-900 text-amber-950 dark:text-amber-100 font-extrabold px-0.5 rounded underline decoration-amber-500">
          {match}
        </span>
        {after}
      </span>
    );
  };

  const activeFiltersCount =
    (filters.storeIds?.length || 0) +
    (filters.categories?.length || 0) +
    (filters.subcategories?.length || 0) +
    (filters.tagGroups?.length || 0) +
    (filters.tagValues?.length || 0) +
    (filters.provinces?.length || 0) +
    (filters.municipalities?.length || 0) +
    (filters.repartos?.length || 0) +
    (filters.itemTypes?.length || 0) +
    (filters.paymentMethods?.length || 0) +
    (filters.deliveryMethods?.length || 0) +
    (filters.minPrice !== '' ? 1 : 0) +
    (filters.maxPrice !== '' ? 1 : 0) +
    (filters.searchQuery ? 1 : 0) +
    (filters.code ? 1 : 0);

  const hasActiveFilters = activeFiltersCount > 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 mb-6 transition-all duration-300 relative z-30">
      {/* Header Bar - Always visible, acts as toggle */}
      <div className="p-4 sm:p-5 flex items-center justify-between gap-3 select-none">
        <button
          type="button"
          onClick={onToggleExpanded}
          title={isExpanded ? t.tooltips.collapse : t.tooltips.expand}
          aria-label={isExpanded ? t.tooltips.collapse : t.tooltips.expand}
          className="flex items-center gap-3 text-left group cursor-pointer focus:outline-none flex-1 min-w-0"
        >
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
            <Filter className="w-4 h-4" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-slate-900 dark:text-white text-sm sm:text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-none">
                {t.productFilterTitle || 'Filtrado de Productos y servicios'}
              </h3>
              {hasActiveFilters && (
                <span className="bg-slate-100 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-slate-200 dark:border-slate-700 text-[11px] font-extrabold px-2 py-0.5 rounded-full">
                  {activeFiltersCount} activo{activeFiltersCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Encontrados: <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{totalResults}</strong> {t.resultsFound || 'resultados encontrados'}{' '}
              <span className="text-slate-400 dark:text-slate-500">
                • {isExpanded ? 'Filtros desplegados' : 'Filtros plegados'}
              </span>
            </p>
          </div>
        </button>

        <div className="flex items-center gap-2">
          {/* Reset button: icon only with tooltip */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onResetFilters();
              }}
              title={t.tooltips.reset || 'Restablecer o limpiar todos los filtros'}
              aria-label={t.tooltips.reset || 'Restablecer o limpiar todos los filtros'}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0"
            >
              <RotateCcw className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </button>
          )}

          {/* Toggle button */}
          <button
            type="button"
            onClick={onToggleExpanded}
            title={isExpanded ? t.tooltips.collapse : t.tooltips.expand}
            aria-label={isExpanded ? t.tooltips.collapse : t.tooltips.expand}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            )}
          </button>
        </div>
      </div>

      {/* Expandable Body with Filter Groups */}
      {isExpanded && (
        <div className="p-5 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-6 animate-in fade-in duration-200 rounded-b-2xl">
          
          {/* ========================================================================= */}
          {/* BÚSQUEDA RÁPIDA: PALABRA CLAVE EN DESCRIPCIÓN Y CÓDIGO ÚNICO              */}
          {/* ========================================================================= */}
          <div className="bg-white dark:bg-slate-800/90 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* FILTRO 1: BÚSQUEDA EXCLUSIVA POR DESCRIPCIÓN */}
              <div className="relative" ref={descContainerRef}>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Buscar solamente por descripción</span>
                  </label>
                  {descQuery.length > 0 && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all ${
                        matchingByDesc.length > 0
                          ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                          : 'bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                      }`}
                    >
                      {matchingByDesc.length} disponible{matchingByDesc.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                <div className="relative flex items-center">
                  <div className="absolute left-3 text-slate-400 dark:text-slate-500 pointer-events-none">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={filters.searchQuery || ''}
                    onFocus={() => setIsDescFocused(true)}
                    onChange={(e) => {
                      handleUpdate('searchQuery', e.target.value);
                      setIsDescFocused(true);
                    }}
                    placeholder={t.searchPlaceholder || 'Buscar solamente por descripción...'}
                    className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 outline-none transition-all shadow-2xs"
                  />
                  {filters.searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        handleUpdate('searchQuery', '');
                        setIsDescFocused(false);
                      }}
                      title="Limpiar búsqueda por descripción"
                      className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Live Suggestions Dropdown for Description */}
                {isDescFocused && descQuery.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-800 rounded-xl border border-indigo-200 dark:border-slate-700 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                        <Search className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Coincidencias en descripción ({matchingByDesc.length})</span>
                      </span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded text-[10px]">
                        Disponibles
                      </span>
                    </div>

                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60 p-1">
                      {matchingByDesc.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
                          No se encontraron productos o servicios disponibles con <strong className="text-slate-700 dark:text-slate-200">"{filters.searchQuery}"</strong> en su descripción.
                        </div>
                      ) : (
                        matchingByDesc.slice(0, 10).map((p) => {
                          const isServ = isServiceItem(p);
                          const storeName = getStoreName(p.storeId);
                          return (
                            <div
                              key={p.id}
                              onClick={() => {
                                setIsDescFocused(false);
                              }}
                              className="p-2.5 rounded-lg hover:bg-indigo-50/70 dark:hover:bg-slate-700/60 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                {p.imageUrl ? (
                                  <img
                                    src={p.imageUrl}
                                    alt={p.title}
                                    className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100 dark:bg-slate-800"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 text-slate-400">
                                    {isServ ? <Briefcase className="w-4 h-4 text-sky-500" /> : <ShoppingBag className="w-4 h-4 text-emerald-500" />}
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-mono font-bold text-[10px] text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/80 px-1.5 py-0.5 rounded">
                                      {p.code}
                                    </span>
                                    <span
                                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                        isServ
                                          ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300'
                                          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                      }`}
                                    >
                                      {isServ ? 'Servicio' : 'Producto'}
                                    </span>
                                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                                      {storeName}
                                    </span>
                                  </div>
                                  <div className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mt-0.5">
                                    {p.title}
                                  </div>
                                  <div className="mt-1">
                                    {renderDescSnippet(p.description, descQuery)}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className="font-black text-xs text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md">
                                  ${p.priceUSD} USD
                                </span>
                                {onSelectProduct && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onSelectProduct(p);
                                      setIsDescFocused(false);
                                    }}
                                    title="Ver detalles completos"
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-600 transition-all cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                    {matchingByDesc.length > 10 && (
                      <div className="p-2 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 text-center text-[10px] text-slate-500">
                        Mostrando 10 de {matchingByDesc.length} coincidencias disponibles.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* FILTRO 2: BÚSQUEDA EXCLUSIVA POR CÓDIGO ÚNICO */}
              <div className="relative" ref={codeContainerRef}>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>{t.labels?.productCode || 'Buscar por Código Único'}</span>
                  </label>
                  {codeQuery.length > 0 && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all ${
                        matchingByCode.length > 0
                          ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                          : 'bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                      }`}
                    >
                      {matchingByCode.length} disponible{matchingByCode.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                <div className="relative flex items-center">
                  <div className="absolute left-3 text-slate-400 dark:text-slate-500 pointer-events-none">
                    <Hash className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={filters.code || ''}
                    onFocus={() => setIsCodeFocused(true)}
                    onChange={(e) => {
                      handleUpdate('code', e.target.value);
                      setIsCodeFocused(true);
                    }}
                    placeholder="Ej. PRD-001, SRV-002..."
                    className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 outline-none uppercase transition-all shadow-2xs"
                  />
                  {filters.code && (
                    <button
                      type="button"
                      onClick={() => {
                        handleUpdate('code', '');
                        setIsCodeFocused(false);
                      }}
                      title="Limpiar código"
                      className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Live Suggestions Dropdown for Code */}
                {isCodeFocused && codeQuery.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-800 rounded-xl border border-indigo-200 dark:border-slate-700 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                        <Hash className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Coincidencias en código "{filters.code}" ({matchingByCode.length})</span>
                      </span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded text-[10px]">
                        Disponibles
                      </span>
                    </div>

                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60 p-1">
                      {matchingByCode.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
                          No se encontraron productos o servicios disponibles con el código <strong className="font-mono text-slate-700 dark:text-slate-200">"{filters.code}"</strong>.
                        </div>
                      ) : (
                        matchingByCode.slice(0, 10).map((p) => {
                          const isServ = isServiceItem(p);
                          const storeName = getStoreName(p.storeId);
                          return (
                            <div
                              key={p.id}
                              onClick={() => {
                                handleUpdate('code', p.code);
                                setIsCodeFocused(false);
                              }}
                              className="p-2.5 rounded-lg hover:bg-indigo-50/70 dark:hover:bg-slate-700/60 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                {p.imageUrl ? (
                                  <img
                                    src={p.imageUrl}
                                    alt={p.title}
                                    className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100 dark:bg-slate-800"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 text-slate-400">
                                    {isServ ? <Briefcase className="w-4 h-4 text-sky-500" /> : <ShoppingBag className="w-4 h-4 text-emerald-500" />}
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-mono font-black text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                                      {renderCodeMatch(p.code, codeQuery)}
                                    </span>
                                    <span
                                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                        isServ
                                          ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300'
                                          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                      }`}
                                    >
                                      {isServ ? 'Servicio' : 'Producto'}
                                    </span>
                                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                                      {storeName}
                                    </span>
                                  </div>
                                  <div className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mt-0.5">
                                    {p.title}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className="font-black text-xs text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md">
                                  ${p.priceUSD} USD
                                </span>
                                {onSelectProduct && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onSelectProduct(p);
                                      setIsCodeFocused(false);
                                    }}
                                    title="Ver detalles completos"
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-600 transition-all cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                    {matchingByCode.length > 10 && (
                      <div className="p-2 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 text-center text-[10px] text-slate-500">
                        Mostrando 10 de {matchingByCode.length} coincidencias disponibles.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* ========================================================================= */}
          {/* GRUPO 1: UBICACIÓN Y TIENDAS (PROVINCIAS, MUNICIPIOS, REPARTOS, TIENDAS) */}
          {/* ========================================================================= */}
          <div className="bg-white dark:bg-slate-800/90 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-700/60">
              <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  {t.groups.locationAndStores || 'Ubicación y Tiendas'}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t.groups.locationAndStoresDesc || 'Filtra por zona geográfica o selecciona directamente tus tiendas y proveedores'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Provincias */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>{t.labels.province || 'Provincias'}</span>
                  </span>
                  {isProvinceDisabled && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold truncate max-w-[170px]" title={getProvinceDisabledReason()}>
                      {getProvinceDisabledReason()}
                    </span>
                  )}
                </label>
                <SearchableMultiSelect
                  options={provinceOptions}
                  values={filters.provinces || []}
                  onChange={(values) => handleUpdate('provinces', values)}
                  placeholder={isProvinceDisabled ? 'Bloqueado (filtro a la derecha activo)' : (t.placeholders.allProvinces || 'Todas las provincias')}
                  allLabel={t.placeholders.allProvinces || 'Todas las provincias'}
                  searchPlaceholder={t.placeholders.selectProvince || 'Buscar provincia...'}
                  disabled={isProvinceDisabled}
                />
              </div>

              {/* Municipios */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>{t.labels.municipality || 'Municipios'}</span>
                  </span>
                  {isMunicipalityDisabled && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold truncate max-w-[170px]" title={getMunicipalityDisabledReason()}>
                      {getMunicipalityDisabledReason()}
                    </span>
                  )}
                </label>
                <SearchableMultiSelect
                  options={municipalityOptions}
                  values={filters.municipalities || []}
                  onChange={(values) => handleUpdate('municipalities', values)}
                  placeholder={
                    isMunicipalityDisabled
                      ? 'Bloqueado (filtro a la derecha activo)'
                      : municipalityOptions.length === 0
                      ? (t.placeholders.noMunicipalities || 'Sin municipios disponibles')
                      : (t.placeholders.allMunicipalities || 'Todos los municipios')
                  }
                  allLabel={t.placeholders.allMunicipalities || 'Todos los municipios'}
                  searchPlaceholder={t.placeholders.selectMunicipality || 'Buscar municipio...'}
                  disabled={isMunicipalityDisabled || (!isMunicipalityDisabled && municipalityOptions.length === 0)}
                />
              </div>

              {/* Repartos / Localidades */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>{t.labels.neighborhood || 'Repartos / Localidades'}</span>
                  </span>
                  {isRepartoDisabled && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold truncate max-w-[170px]" title={getRepartoDisabledReason()}>
                      {getRepartoDisabledReason()}
                    </span>
                  )}
                </label>
                <SearchableMultiSelect
                  options={repartoOptions}
                  values={filters.repartos || []}
                  onChange={(values) => handleUpdate('repartos', values)}
                  placeholder={
                    isRepartoDisabled
                      ? 'Bloqueado (filtro a la derecha activo)'
                      : repartoOptions.length === 0
                      ? (t.placeholders.noRepartos || 'Sin repartos disponibles')
                      : (t.placeholders.allNeighborhoods || 'Todos los repartos')
                  }
                  allLabel={t.placeholders.allNeighborhoods || 'Todos los repartos'}
                  searchPlaceholder={t.placeholders.selectNeighborhood || 'Buscar reparto...'}
                  disabled={isRepartoDisabled || (!isRepartoDisabled && repartoOptions.length === 0)}
                />
              </div>

              {/* Tiendas y Proveedores */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <StoreIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>{t.labels.store || 'Tiendas y proveedores'}</span>
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                    ({matchingStores.length} disp.)
                  </span>
                </label>
                <SearchableMultiSelect
                  options={storeOptions}
                  values={filters.storeIds || []}
                  onChange={(values) => handleUpdate('storeIds', values)}
                  placeholder={
                    storeOptions.length === 0
                      ? (t.placeholders.noStores || 'No hay tiendas coincidentes')
                      : (t.placeholders.allStores || 'Todas las tiendas y proveedores')
                  }
                  allLabel={t.placeholders.allStores || 'Todas las tiendas y proveedores'}
                  searchPlaceholder={t.placeholders.selectStore || 'Buscar tienda o proveedor...'}
                  disabled={storeOptions.length === 0}
                />
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* GRUPO 2: DEPARTAMENTOS, SUBDEPARTAMENTOS, SUPERETIQUETAS Y ETIQUETAS      */}
          {/* ========================================================================= */}
          <div className="bg-white dark:bg-slate-800/90 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-700/60">
              <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <FolderTree className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  {t.groups.taxonomyAndTags || 'Departamentos y Etiquetas'}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t.groups.taxonomyAndTagsDesc || 'Clasifica por categorías, subdepartamentos, superetiquetas y tags'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Departamentos */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <FolderTree className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>{t.labels.department || 'Departamentos'}</span>
                  </span>
                  {isDepartmentDisabled && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold truncate max-w-[170px]" title={t.disabledNotices.bySubcategory}>
                      {t.disabledNotices.bySubcategory}
                    </span>
                  )}
                </label>
                <SearchableMultiSelect
                  options={departmentOptions}
                  values={filters.categories || []}
                  onChange={(values) => handleUpdate('categories', values)}
                  placeholder={isDepartmentDisabled ? 'Deshabilitado (subdepartamento activo)' : (t.placeholders.allDepartments || 'Todos los departamentos')}
                  allLabel={t.placeholders.allDepartments || 'Todos los departamentos'}
                  searchPlaceholder={t.placeholders.selectDept || 'Buscar departamento...'}
                  disabled={isDepartmentDisabled}
                />
              </div>

              {/* Subdepartamentos */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <FolderTree className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>{t.labels.subcategory || 'Subdepartamentos'}</span>
                </label>
                <SearchableMultiSelect
                  options={subcategoryOptions}
                  values={filters.subcategories || []}
                  onChange={(values) => handleUpdate('subcategories', values)}
                  placeholder={
                    subcategoryOptions.length === 0
                      ? (t.placeholders.noSubcategories || 'Sin subdepartamentos')
                      : (t.placeholders.allSubcategories || 'Todos los subdepartamentos')
                  }
                  allLabel={t.placeholders.allSubcategories || 'Todos los subdepartamentos'}
                  searchPlaceholder={t.placeholders.selectSubcat || 'Buscar subdepartamento...'}
                  disabled={subcategoryOptions.length === 0}
                />
              </div>

              {/* Superetiquetas */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>{t.labels.supertag || 'Superetiquetas'}</span>
                  </span>
                  {isSupertagDisabled && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold truncate max-w-[170px]" title={t.disabledNotices.byTag}>
                      {t.disabledNotices.byTag}
                    </span>
                  )}
                </label>
                <SearchableMultiSelect
                  options={supertagOptions}
                  values={filters.tagGroups || []}
                  onChange={(values) => handleUpdate('tagGroups', values)}
                  placeholder={isSupertagDisabled ? 'Deshabilitado (etiqueta activa)' : (t.placeholders.allSupertags || 'Todas las superetiquetas')}
                  allLabel={t.placeholders.allSupertags || 'Todas las superetiquetas'}
                  searchPlaceholder={t.placeholders.selectSupertag || 'Buscar superetiqueta...'}
                  disabled={isSupertagDisabled}
                />
              </div>

              {/* Etiquetas */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>{t.labels.tag || 'Etiquetas'}</span>
                </label>
                <SearchableMultiSelect
                  options={tagOptions}
                  values={filters.tagValues || []}
                  onChange={(values) => handleUpdate('tagValues', values)}
                  placeholder={
                    tagOptions.length === 0
                      ? (t.placeholders.noTags || 'Sin etiquetas')
                      : (t.placeholders.allTags || 'Todas las etiquetas')
                  }
                  allLabel={t.placeholders.allTags || 'Todas las etiquetas'}
                  searchPlaceholder={t.placeholders.selectTag || 'Buscar etiqueta...'}
                  disabled={tagOptions.length === 0}
                />
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* GRUPO 3: TIPO DE OFERTA, FORMAS DE PAGO Y MENSAJERÍA                     */}
          {/* ========================================================================= */}
          <div className="bg-white dark:bg-slate-800/90 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-700/60">
              <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Briefcase className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  {t.groups.publicationAndPayment || 'Tipo de Oferta, Pagos y Entrega'}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t.groups.publicationAndPaymentDesc || 'Filtra por productos físicos o servicios, opciones de pago y mensajería'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Tipo de Oferta (Productos / Servicios) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>{t.labels.itemType || 'Productos y servicios'}</span>
                </label>
                <SearchableMultiSelect
                  options={itemTypeOptions}
                  values={filters.itemTypes || []}
                  onChange={(values) => handleUpdate('itemTypes', values)}
                  placeholder={t.placeholders.allItemTypes || 'Productos y servicios'}
                  allLabel={t.placeholders.allItemTypes || 'Productos y servicios'}
                  searchPlaceholder={t.placeholders.selectItemType || 'Buscar producto o servicio...'}
                />
              </div>

              {/* Tipo de Pago (Efectivo / Transferencia) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>{t.labels.paymentMethod || 'Tipo de pago'}</span>
                </label>
                <SearchableMultiSelect
                  options={paymentMethodOptions}
                  values={filters.paymentMethods || []}
                  onChange={(values) => handleUpdate('paymentMethods', values)}
                  placeholder={t.placeholders.allPaymentMethods || 'Todos los tipos de pago'}
                  allLabel={t.placeholders.allPaymentMethods || 'Todos los tipos de pago'}
                  searchPlaceholder={t.placeholders.selectPayment || 'Buscar tipo de pago...'}
                />
              </div>

              {/* Mensajería (Mensajería / Recogida) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>{t.labels.deliveryMethod || 'Mensajería'}</span>
                </label>
                <SearchableMultiSelect
                  options={deliveryMethodOptions}
                  values={filters.deliveryMethods || []}
                  onChange={(values) => handleUpdate('deliveryMethods', values)}
                  placeholder={t.placeholders.allDeliveryMethods || 'Mensajería y Recogida'}
                  allLabel={t.placeholders.allDeliveryMethods || 'Mensajería y Recogida'}
                  searchPlaceholder={t.placeholders.selectDelivery || 'Buscar opción de mensajería...'}
                />
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* GRUPO 4: RANGO DE PRECIOS Y MONEDA                                        */}
          {/* ========================================================================= */}
          <div className="bg-white dark:bg-slate-800/90 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-700/60">
              <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  {t.groups.priceRange || 'Rango de Precios y Moneda'}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t.groups.priceRangeDesc || 'Establece el rango de precios en USD o su equivalente calculado en CUP'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              {/* Precio Mínimo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>{t.labels.minPrice || 'Precio Mínimo'}</span>
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder={t.placeholders.minPrice || 'Ej. 10.50'}
                  title={t.tooltips.minPriceInput || 'Ingrese el valor numérico del precio mínimo'}
                  aria-label={t.labels.minPrice || 'Precio Mínimo'}
                  value={filters.minPrice === '' ? '' : filters.minPrice}
                  onKeyDown={preventInvalidPriceKeys}
                  onChange={(e) => handleNumericPriceInput('minPrice', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 outline-none"
                />
              </div>

              {/* Precio Máximo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>{t.labels.maxPrice || 'Precio Máximo'}</span>
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder={t.placeholders.maxPrice || 'Ej. 500'}
                  title={t.tooltips.maxPriceInput || 'Ingrese el valor numérico del precio máximo'}
                  aria-label={t.labels.maxPrice || 'Precio Máximo'}
                  value={filters.maxPrice === '' ? '' : filters.maxPrice}
                  onKeyDown={preventInvalidPriceKeys}
                  onChange={(e) => handleNumericPriceInput('maxPrice', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 outline-none"
                />
              </div>

              {/* Moneda de Referencia */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>{t.labels.priceCurrency || 'Moneda de Referencia'}</span>
                </label>
                <SearchableSelect
                  options={[
                    { value: 'USD', label: t.placeholders.currencyUsd || 'Moneda: USD (Dólares)' },
                    { value: 'CUP', label: t.placeholders.currencyCup || 'Moneda: CUP (Pesos Cubanos)' },
                  ]}
                  value={filters.priceCurrency || 'USD'}
                  onChange={(val) =>
                    handleUpdate('priceCurrency', (val || 'USD') as PriceFilterCurrency)
                  }
                  searchPlaceholder={t.placeholders.selectCurrency || 'Buscar moneda...'}
                />
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
