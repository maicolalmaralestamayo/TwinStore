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
  const activeStores = stores.filter((s) => s.active);
  const catalogToUse =
    departmentsCatalog && departmentsCatalog.length > 0
      ? departmentsCatalog
      : INITIAL_DEPARTMENT_CATALOG;
  const effectiveTagsCatalog =
    tagsCatalog && tagsCatalog.length > 0 ? tagsCatalog : INITIAL_TAGS_CATALOG;
  const effectiveGeoCatalog =
    geoCatalog && geoCatalog.length > 0 ? geoCatalog : INITIAL_GEO_CATALOG;

  // Check if store is directly selected (disables Province, Municipality and Reparto filters)
  const isGeoDisabled = Boolean(filters.storeIds && filters.storeIds.length > 0);

  // GEO: Provinces Options
  const provinceOptions = effectiveGeoCatalog.map((p) => ({
    value: p.name,
    label: p.name,
    sublabel: `${p.municipalities?.length || 0} municipios`,
  }));

  // Selected Provinces List (or all if none selected)
  const selectedProvincesList =
    filters.provinces && filters.provinces.length > 0
      ? effectiveGeoCatalog.filter((p) => filters.provinces.includes(p.name))
      : effectiveGeoCatalog;

  // GEO: Municipalities Options (only belonging to selected provinces)
  const municipalityOptions = selectedProvincesList.flatMap((p) =>
    (p.municipalities || []).map((m) => ({
      value: m.name,
      label: m.name,
      sublabel: p.name,
    }))
  );

  // Selected Municipalities List
  const selectedMunicipalitiesList = selectedProvincesList.flatMap((p) =>
    filters.municipalities && filters.municipalities.length > 0
      ? (p.municipalities || []).filter((m) =>
          filters.municipalities.includes(m.name)
        )
      : p.municipalities || []
  );

  // GEO: Repartos Options (only belonging to selected municipalities)
  const repartoOptions = selectedMunicipalitiesList.flatMap((m) =>
    (m.repartos || []).map((r) => ({
      value: r.name,
      label: r.name,
      sublabel: m.name,
    }))
  );

  // STORES: Filtered dynamically by Province -> Municipality -> Reparto -> Payment -> Delivery
  const matchingStores = activeStores.filter((s) => {
    // 1. Province filter
    if (filters.provinces && filters.provinces.length > 0) {
      if (!s.province || !filters.provinces.includes(s.province)) {
        return false;
      }
    }
    // 2. Municipality filter
    if (filters.municipalities && filters.municipalities.length > 0) {
      if (!s.municipality || !filters.municipalities.includes(s.municipality)) {
        return false;
      }
    }
    // 3. Reparto filter
    if (filters.repartos && filters.repartos.length > 0) {
      if (!s.reparto || !filters.repartos.includes(s.reparto)) {
        return false;
      }
    }
    // 4. Payment method filter (Tipo de pago: Transferencia / Efectivo)
    if (filters.paymentMethods && filters.paymentMethods.length > 0) {
      const wantsTransfer = filters.paymentMethods.includes('transfer');
      const wantsCash = filters.paymentMethods.includes('cash');
      if (wantsTransfer && !wantsCash && !s.paymentOptions?.transferAccepted) {
        return false;
      }
    } else if (filters.transferOnly && !s.paymentOptions?.transferAccepted) {
      return false;
    }

    // 5. Delivery method filter (Mensajería / Recogida en tienda)
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

  const storeOptions = matchingStores.map((s) => ({
    value: s.id,
    label: s.name,
    sublabel: `${s.province || ''}${s.municipality ? ' • ' + s.municipality : ''}${s.reparto ? ' • ' + s.reparto : ''}`,
  }));

  // DEPARTMENTS & SUBDEPARTMENTS
  const departmentOptions = catalogToUse.map((dept) => ({
    value: dept.name,
    label: dept.name,
    sublabel: `${dept.subcategories?.length || 0} subdepartamentos`,
  }));

  const selectedDeptsList =
    filters.categories && filters.categories.length > 0
      ? catalogToUse.filter((d) => filters.categories.includes(d.name))
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
      ? effectiveTagsCatalog.filter((g) => filters.tagGroups.includes(g.name))
      : effectiveTagsCatalog;

  const tagOptions = selectedTagGroupsList.flatMap((g) =>
    (g.tags || []).map((t) => ({
      value: t.name,
      label: t.name,
      sublabel: g.name,
    }))
  );

  // OFFER TYPE OPTIONS (Productos / Servicios)
  const itemTypeOptions = [
    {
      value: 'product',
      label: 'Productos',
      sublabel: 'Artículos físicos y bienes',
    },
    {
      value: 'service',
      label: 'Servicios',
      sublabel: 'Servicios profesionales y prestaciones',
    },
  ];

  // TIPO DE PAGO OPTIONS (Transferencia / Efectivo)
  const paymentMethodOptions = [
    {
      value: 'transfer',
      label: 'Transferencia',
      sublabel: 'Pago por transferencia bancaria o entre tarjetas',
    },
    {
      value: 'cash',
      label: 'Efectivo',
      sublabel: 'Pago en efectivo directo',
    },
  ];

  // MENSAJERÍA OPTIONS (Mensajería / Recogida en tienda)
  const deliveryMethodOptions = [
    {
      value: 'delivery',
      label: 'Mensajería',
      sublabel: 'Tiendas con servicio de mensajería',
    },
    {
      value: 'pickup',
      label: 'Recogida en tienda',
      sublabel: 'Tiendas sin servicio de mensajería (solo recogida)',
    },
  ];

  // Filter Update Logic with cascading reset and validation
  const handleUpdate = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    if (key === 'storeIds') {
      const newStoreIds = value as string[];
      // If user directly filters by store, clear geo filters
      onFilterChange({
        ...filters,
        storeIds: newStoreIds,
        provinces: newStoreIds.length > 0 ? [] : filters.provinces,
        municipalities: newStoreIds.length > 0 ? [] : filters.municipalities,
        repartos: newStoreIds.length > 0 ? [] : filters.repartos,
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
        if (newProvs.length > 0 && (!st.province || !newProvs.includes(st.province))) return false;
        return true;
      });

      onFilterChange({
        ...filters,
        provinces: newProvs,
        municipalities: validMuns,
        repartos: validReps,
        storeIds: validStores,
      });
    } else if (key === 'municipalities') {
      const newMuns = value as string[];
      // Prune repartos
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
        if (newMuns.length > 0 && (!st.municipality || !newMuns.includes(st.municipality))) return false;
        return true;
      });

      onFilterChange({
        ...filters,
        municipalities: newMuns,
        repartos: validReps,
        storeIds: validStores,
      });
    } else if (key === 'repartos') {
      const newReps = value as string[];
      // Prune storeIds
      const validStores = (filters.storeIds || []).filter((id) => {
        const st = activeStores.find((s) => s.id === id);
        if (!st) return false;
        if (newReps.length > 0 && (!st.reparto || !newReps.includes(st.reparto))) return false;
        return true;
      });

      onFilterChange({
        ...filters,
        repartos: newReps,
        storeIds: validStores,
      });
    } else if (key === 'categories') {
      const newCats = value as string[];
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
    } else if (key === 'tagGroups') {
      const newGroups = value as string[];
      const validTags = (filters.tagValues || []).filter((t) =>
        effectiveTagsCatalog
          .filter((g) => newGroups.length === 0 || newGroups.includes(g.name))
          .some((g) => g.tags?.some((tag) => tag.name === t))
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
    // Keep only numbers and a single decimal dot
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
    // Block exponent 'e', 'E', minus '-', plus '+'
    if (['e', 'E', '+', '-'].includes(e.key)) {
      e.preventDefault();
    }
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
          title={isExpanded ? 'Plegar filtros avanzados' : 'Desplegar filtros avanzados'}
          aria-label={isExpanded ? 'Plegar filtros avanzados' : 'Desplegar filtros avanzados'}
          className="flex items-center gap-3 text-left group cursor-pointer focus:outline-none flex-1 min-w-0"
        >
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
            <Filter className="w-4 h-4" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-slate-900 dark:text-white text-sm sm:text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-none">
                Filtrado de Productos y servicios
              </h3>
              {hasActiveFilters && (
                <span className="bg-slate-100 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-slate-200 dark:border-slate-700 text-[11px] font-extrabold px-2 py-0.5 rounded-full">
                  {activeFiltersCount} activo{activeFiltersCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Encontrados: <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{totalResults}</strong> resultados{' '}
              <span className="text-slate-400 dark:text-slate-500">
                • {isExpanded ? 'Filtros desplegados' : 'Filtros plegados'}
              </span>
            </p>
          </div>
        </button>

        <div className="flex items-center gap-2">
          {/* Botón de limpieza de filtros: sólo ícono con tooltip */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onResetFilters();
              }}
              title="Restablecer o limpiar todos los filtros"
              aria-label="Restablecer o limpiar todos los filtros"
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0"
            >
              <RotateCcw className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </button>
          )}

          {/* Toggle button - ONLY ICON */}
          <button
            type="button"
            onClick={onToggleExpanded}
            title={isExpanded ? 'Plegar filtros' : 'Desplegar filtros'}
            aria-label={isExpanded ? 'Plegar filtros' : 'Desplegar filtros'}
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

      {/* Expandable Body */}
      {isExpanded && (
        <div className="p-5 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-4 animate-in fade-in duration-200 rounded-b-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Provincias */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Provincias</span>
                </span>
                {isGeoDisabled && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">(Bloqueado por tienda o proveedor)</span>
                )}
              </label>
              <SearchableMultiSelect
                options={provinceOptions}
                values={filters.provinces || []}
                onChange={(values) => handleUpdate('provinces', values)}
                placeholder={isGeoDisabled ? 'Deshabilitado (filtro tienda activo)' : 'Todas las provincias'}
                allLabel="Todas las provincias"
                searchPlaceholder="Buscar provincia..."
                disabled={isGeoDisabled}
              />
            </div>

            {/* Municipios */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Municipios</span>
                </span>
                {isGeoDisabled && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">(Bloqueado por tienda o proveedor)</span>
                )}
              </label>
              <SearchableMultiSelect
                options={municipalityOptions}
                values={filters.municipalities || []}
                onChange={(values) => handleUpdate('municipalities', values)}
                placeholder={
                  isGeoDisabled
                    ? 'Deshabilitado (filtro tienda activo)'
                    : municipalityOptions.length === 0
                    ? 'Sin municipios disponibles'
                    : 'Todos los municipios'
                }
                allLabel="Todos los municipios"
                searchPlaceholder="Buscar municipio..."
                disabled={isGeoDisabled || municipalityOptions.length === 0}
              />
            </div>

            {/* Reparto / Localidad */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Repartos / Localidades</span>
                </span>
                {isGeoDisabled && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">(Bloqueado por tienda o proveedor)</span>
                )}
              </label>
              <SearchableMultiSelect
                options={repartoOptions}
                values={filters.repartos || []}
                onChange={(values) => handleUpdate('repartos', values)}
                placeholder={
                  isGeoDisabled
                    ? 'Deshabilitado (filtro tienda activo)'
                    : repartoOptions.length === 0
                    ? 'Sin repartos disponibles'
                    : 'Todos los repartos'
                }
                allLabel="Todos los repartos"
                searchPlaceholder="Buscar reparto..."
                disabled={isGeoDisabled || repartoOptions.length === 0}
              />
            </div>

            {/* Tiendas y proveedores */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <StoreIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Tiendas y proveedores</span>
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
                    ? 'No hay tiendas coincidentes'
                    : 'Todas las tiendas y proveedores'
                }
                allLabel="Todas las tiendas y proveedores disponibles"
                searchPlaceholder="Buscar tienda o proveedor..."
                disabled={storeOptions.length === 0}
              />
            </div>

            {/* Departamentos */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <FolderTree className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Departamentos</span>
              </label>
              <SearchableMultiSelect
                options={departmentOptions}
                values={filters.categories || []}
                onChange={(values) => handleUpdate('categories', values)}
                placeholder="Todos los departamentos"
                allLabel="Todos los departamentos"
                searchPlaceholder="Buscar departamento..."
              />
            </div>

            {/* Subdepartamentos */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <FolderTree className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Subdepartamentos</span>
              </label>
              <SearchableMultiSelect
                options={subcategoryOptions}
                values={filters.subcategories || []}
                onChange={(values) => handleUpdate('subcategories', values)}
                placeholder="Todos los subdepartamentos"
                allLabel="Todos los subdepartamentos"
                searchPlaceholder="Buscar subdepartamento..."
                disabled={subcategoryOptions.length === 0}
              />
            </div>

            {/* Superetiquetas */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Superetiquetas</span>
              </label>
              <SearchableMultiSelect
                options={supertagOptions}
                values={filters.tagGroups || []}
                onChange={(values) => handleUpdate('tagGroups', values)}
                placeholder="Todas las superetiquetas"
                allLabel="Todas las superetiquetas"
                searchPlaceholder="Buscar superetiqueta..."
              />
            </div>

            {/* Etiquetas */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Etiquetas</span>
              </label>
              <SearchableMultiSelect
                options={tagOptions}
                values={filters.tagValues || []}
                onChange={(values) => handleUpdate('tagValues', values)}
                placeholder="Todas las etiquetas"
                allLabel="Todas las etiquetas"
                searchPlaceholder="Buscar etiqueta..."
                disabled={tagOptions.length === 0}
              />
            </div>

            {/* Tipo de Oferta (Combobox: Productos / Servicios) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Productos y servicios</span>
              </label>
              <SearchableMultiSelect
                options={itemTypeOptions}
                values={filters.itemTypes || []}
                onChange={(values) => handleUpdate('itemTypes', values)}
                placeholder="Productos y servicios"
                allLabel="Productos y servicios"
                searchPlaceholder="Buscar producto o servicio..."
              />
            </div>

            {/* Tipo de Pago (Combobox: Efectivo / Transferencia) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Tipo de pago</span>
              </label>
              <SearchableMultiSelect
                options={paymentMethodOptions}
                values={filters.paymentMethods || []}
                onChange={(values) => handleUpdate('paymentMethods', values)}
                placeholder="Todos los tipos de pago"
                allLabel="Todos los tipos de pago"
                searchPlaceholder="Buscar tipo de pago..."
              />
            </div>

            {/* Mensajería (Combobox: Mensajería / Recogida en tienda) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Mensajería</span>
              </label>
              <SearchableMultiSelect
                options={deliveryMethodOptions}
                values={filters.deliveryMethods || []}
                onChange={(values) => handleUpdate('deliveryMethods', values)}
                placeholder="Mensajería y Recogida"
                allLabel="Mensajería y Recogida"
                searchPlaceholder="Buscar opción de mensajería..."
              />
            </div>

            {/* Rango de Precios Mínimo, Máximo y Moneda */}
            <div className="sm:col-span-2 md:col-span-3 lg:col-span-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Precio Mínimo</span>
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Ej. 10.50"
                    title="Ingrese el valor numérico del precio mínimo"
                    aria-label="Precio Mínimo"
                    value={filters.minPrice === '' ? '' : filters.minPrice}
                    onKeyDown={preventInvalidPriceKeys}
                    onChange={(e) => handleNumericPriceInput('minPrice', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Precio Máximo</span>
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Ej. 500"
                    title="Ingrese el valor numérico del precio máximo"
                    aria-label="Precio Máximo"
                    value={filters.maxPrice === '' ? '' : filters.maxPrice}
                    onKeyDown={preventInvalidPriceKeys}
                    onChange={(e) => handleNumericPriceInput('maxPrice', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Moneda de Referencia</span>
                  </label>
                  <SearchableSelect
                    options={[
                      { value: 'USD', label: 'Moneda: USD (Dólares)' },
                      { value: 'CUP', label: 'Moneda: CUP (Pesos Cubanos)' },
                    ]}
                    value={filters.priceCurrency || 'USD'}
                    onChange={(val) =>
                      handleUpdate('priceCurrency', (val || 'USD') as PriceFilterCurrency)
                    }
                    searchPlaceholder="Buscar moneda..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
