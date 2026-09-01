import React from 'react';
import {
  CategoryItem,
  FilterState,
  PriceFilterCurrency,
  Store,
  DepartmentCategory,
  TagGroup,
  GeoProvince,
} from '../../types';
import {
  INITIAL_DEPARTMENT_CATALOG,
  INITIAL_TAGS_CATALOG,
  INITIAL_GEO_CATALOG,
} from '../../data/initialData';
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
} from 'lucide-react';
import { SearchableMultiSelect } from '../common/SearchableMultiSelect';
import { SearchableSelect } from '../common/SearchableSelect';
import { interfaz } from '../../data/interfaz';

interface AdvancedSearchProps {
  categories?: CategoryItem[];
  departmentsCatalog?: DepartmentCategory[];
  tagsCatalog?: TagGroup[];
  geoCatalog?: GeoProvince[];
  stores: Store[];
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  onResetFilters: () => void;
  totalResults: number;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  departmentsCatalog,
  tagsCatalog,
  geoCatalog,
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

  // --- DEPENDENCY & DISABLING LOGIC ---

  // Helper to extract location safely from Store
  const getStoreLocation = (s: Store) => ({
    province: s.address?.province || (s as any).province || '',
    municipality: s.address?.municipality || (s as any).municipality || '',
    reparto: s.address?.neighborhood || (s as any).reparto || (s as any).neighborhood || '',
  });

  // 1. Geography & Stores hierarchy:
  // ONLY if Store is directly selected -> disables Reparto, Municipality, Province
  const isStoreSelected = Boolean(filters.storeIds && filters.storeIds.length > 0);

  const isProvinceDisabled = isStoreSelected;
  const isMunicipalityDisabled = isStoreSelected;
  const isRepartoDisabled = isStoreSelected;

  // 2. Departments & Subdepartments:
  // If Subdepartment is directly selected -> disables Department
  const isSubcategorySelected = Boolean(filters.subcategories && filters.subcategories.length > 0);
  const isDepartmentDisabled = isSubcategorySelected;

  // 3. Supertags & Tags:
  // If Tag is directly selected -> disables Supertag
  const isTagSelected = Boolean(filters.tagValues && filters.tagValues.length > 0);
  const isSupertagDisabled = isTagSelected;

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
    // 4. Payment method filter (Transferencia / Efectivo)
    if (filters.paymentMethods && filters.paymentMethods.length > 0) {
      const wantsTransfer = filters.paymentMethods.includes('transfer');
      const wantsCash = filters.paymentMethods.includes('cash');
      if (wantsTransfer && !wantsCash && !s.paymentOptions?.transferAccepted) {
        return false;
      }
    } else if (filters.transferOnly && !s.paymentOptions?.transferAccepted) {
      return false;
    }

    // 5. Delivery method filter (Mensajería / Recogida)
    if (filters.deliveryMethods && filters.deliveryMethods.length > 0) {
      const wantsDelivery = filters.deliveryMethods.includes('delivery');
      const wantsPickup = filters.deliveryMethods.includes('pickup');
      if (wantsDelivery && !wantsPickup && !s.deliveryAvailable) {
        return false;
      }
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

  // OFFER TYPE (Productos / Servicios)
  const itemTypeOptions = [
    {
      value: 'product',
      label: t.options.product || 'Productos',
      sublabel: t.options.productSublabel || 'Artículos físicos y bienes',
    },
    {
      value: 'service',
      label: t.options.service || 'Servicios',
      sublabel: t.options.serviceSublabel || 'Servicios profesionales y prestaciones',
    },
  ];

  // TIPO DE PAGO (Transferencia / Efectivo)
  const paymentMethodOptions = [
    {
      value: 'transfer',
      label: t.options.payTransfer || 'Transferencia',
      sublabel: t.options.transferSublabel || 'Pago por transferencia bancaria o entre tarjetas',
    },
    {
      value: 'cash',
      label: t.options.payCash || 'Efectivo',
      sublabel: t.options.cashSublabel || 'Pago en efectivo directo',
    },
  ];

  // MENSAJERÍA (Mensajería / Recogida)
  const deliveryMethodOptions = [
    {
      value: 'delivery',
      label: t.options.deliveryCourier || 'Mensajería',
      sublabel: t.options.courierSublabel || 'Tiendas con servicio de mensajería',
    },
    {
      value: 'pickup',
      label: t.options.deliveryPickup || 'Recogida',
      sublabel: t.options.pickupSublabel || 'Tiendas con recogida en local',
    },
  ];

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

  // Helper to generate disabled reason notice
  const getGeoDisabledReason = () => {
    if (isStoreSelected) return t.disabledNotices.byStore || '(Bloqueado por tienda o proveedor)';
    return '';
  };

  // Count active filters
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
    (filters.searchQuery ? 1 : 0);

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
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold truncate max-w-[170px]" title={getGeoDisabledReason()}>
                      {getGeoDisabledReason()}
                    </span>
                  )}
                </label>
                <SearchableMultiSelect
                  options={provinceOptions}
                  values={filters.provinces || []}
                  onChange={(values) => handleUpdate('provinces', values)}
                  placeholder={isProvinceDisabled ? (t.disabledNotices.byStore || 'Deshabilitado (filtro tienda activo)') : (t.placeholders.allProvinces || 'Todas las provincias')}
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
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold truncate max-w-[170px]" title={getGeoDisabledReason()}>
                      {getGeoDisabledReason()}
                    </span>
                  )}
                </label>
                <SearchableMultiSelect
                  options={municipalityOptions}
                  values={filters.municipalities || []}
                  onChange={(values) => handleUpdate('municipalities', values)}
                  placeholder={
                    isMunicipalityDisabled
                      ? (t.disabledNotices.byStore || 'Deshabilitado (filtro tienda activo)')
                      : municipalityOptions.length === 0
                      ? (t.placeholders.noMunicipalities || 'Sin municipios disponibles')
                      : (t.placeholders.allMunicipalities || 'Todos los municipios')
                  }
                  allLabel={t.placeholders.allMunicipalities || 'Todos los municipios'}
                  searchPlaceholder={t.placeholders.selectMunicipality || 'Buscar municipio...'}
                  disabled={isMunicipalityDisabled || municipalityOptions.length === 0}
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
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold truncate max-w-[170px]" title={getGeoDisabledReason()}>
                      {getGeoDisabledReason()}
                    </span>
                  )}
                </label>
                <SearchableMultiSelect
                  options={repartoOptions}
                  values={filters.repartos || []}
                  onChange={(values) => handleUpdate('repartos', values)}
                  placeholder={
                    isRepartoDisabled
                      ? (t.disabledNotices.byStore || 'Deshabilitado (filtro tienda activo)')
                      : repartoOptions.length === 0
                      ? (t.placeholders.noRepartos || 'Sin repartos disponibles')
                      : (t.placeholders.allNeighborhoods || 'Todos los repartos')
                  }
                  allLabel={t.placeholders.allNeighborhoods || 'Todos los repartos'}
                  searchPlaceholder={t.placeholders.selectNeighborhood || 'Buscar reparto...'}
                  disabled={isRepartoDisabled || repartoOptions.length === 0}
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
