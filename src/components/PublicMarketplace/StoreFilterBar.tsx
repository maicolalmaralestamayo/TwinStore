import React from 'react';
import { StoreFilterState, GeoProvince, PaymentMethodItem, DeliveryMethodItem } from '../../types';
import {
  INITIAL_GEO_CATALOG,
  INITIAL_PAYMENT_METHODS_CATALOG,
  INITIAL_DELIVERY_METHODS_CATALOG,
} from '../../data/initialData';
import {
  MapPin,
  Truck,
  CreditCard,
  RotateCcw,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { SearchableMultiSelect } from '../common/SearchableMultiSelect';
import { interfaz } from '../../data/interfaz';

interface StoreFilterBarProps {
  geoCatalog?: GeoProvince[];
  paymentMethodsCatalog?: PaymentMethodItem[];
  deliveryMethodsCatalog?: DeliveryMethodItem[];
  filters: StoreFilterState;
  onFilterChange: (filters: StoreFilterState) => void;
  onReset: () => void;
  totalResults: number;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

export const StoreFilterBar: React.FC<StoreFilterBarProps> = ({
  geoCatalog,
  paymentMethodsCatalog,
  deliveryMethodsCatalog,
  filters,
  onFilterChange,
  onReset,
  totalResults,
  isExpanded,
  onToggleExpanded,
}) => {
  const t = interfaz.filters;
  const effectiveGeoCatalog =
    geoCatalog && geoCatalog.length > 0 ? geoCatalog : INITIAL_GEO_CATALOG;
  const effectivePaymentMethods =
    paymentMethodsCatalog && paymentMethodsCatalog.length > 0
      ? paymentMethodsCatalog
      : INITIAL_PAYMENT_METHODS_CATALOG;
  const effectiveDeliveryMethods =
    deliveryMethodsCatalog && deliveryMethodsCatalog.length > 0
      ? deliveryMethodsCatalog
      : INITIAL_DELIVERY_METHODS_CATALOG;

  // --- DEPENDENCY & DISABLING LOGIC ---
  const isRepartoSelected = Boolean(filters.repartos && filters.repartos.length > 0);
  const isMunicipalitySelected = Boolean(filters.municipalities && filters.municipalities.length > 0);

  const isProvinceDisabled = isRepartoSelected || isMunicipalitySelected;
  const isMunicipalityDisabled = isRepartoSelected;

  // --- ESCALONADO / CASCADING OPTIONS ---

  // Province options
  const provinceOptions = effectiveGeoCatalog.map((p) => ({
    value: p.name,
    label: p.name,
    sublabel: `${p.municipalities?.length || 0} municipios`,
  }));

  // Selected provinces list
  const selectedProvincesList =
    filters.provinces && filters.provinces.length > 0
      ? effectiveGeoCatalog.filter((p) => filters.provinces?.includes(p.name))
      : effectiveGeoCatalog;

  const municipalityOptions = selectedProvincesList.flatMap((p) =>
    (p.municipalities || []).map((m) => ({
      value: m.name,
      label: m.name,
      sublabel: p.name,
    }))
  );

  // Selected municipalities list
  const selectedMunicipalitiesList = selectedProvincesList.flatMap((p) =>
    filters.municipalities && filters.municipalities.length > 0
      ? (p.municipalities || []).filter((m) =>
          filters.municipalities?.includes(m.name)
        )
      : p.municipalities || []
  );

  const repartoOptions = selectedMunicipalitiesList.flatMap((m) =>
    (m.repartos || []).map((r) => ({
      value: r.name,
      label: r.name,
      sublabel: m.name,
    }))
  );

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

  const handleUpdate = <K extends keyof StoreFilterState>(
    key: K,
    value: StoreFilterState[K]
  ) => {
    if (key === 'provinces') {
      const newProvs = value as string[];
      const validMuns = (filters.municipalities || []).filter((m) =>
        effectiveGeoCatalog
          .filter((p) => newProvs.length === 0 || newProvs.includes(p.name))
          .some((p) => p.municipalities?.some((mun) => mun.name === m))
      );
      const validReps = (filters.repartos || []).filter((r) =>
        effectiveGeoCatalog
          .filter((p) => newProvs.length === 0 || newProvs.includes(p.name))
          .flatMap((p) => p.municipalities || [])
          .filter((m) => validMuns.length === 0 || validMuns.includes(m.name))
          .some((m) => m.repartos?.some((rep) => rep.name === r))
      );
      onFilterChange({
        ...filters,
        provinces: newProvs,
        municipalities: validMuns,
        repartos: validReps,
      });
    } else if (key === 'municipalities') {
      const newMuns = value as string[];
      const validReps = (filters.repartos || []).filter((r) =>
        effectiveGeoCatalog
          .filter((p) => (filters.provinces || []).length === 0 || (filters.provinces || []).includes(p.name))
          .flatMap((p) => p.municipalities || [])
          .filter((m) => newMuns.length === 0 || newMuns.includes(m.name))
          .some((m) => m.repartos?.some((rep) => rep.name === r))
      );
      onFilterChange({
        ...filters,
        municipalities: newMuns,
        repartos: validReps,
      });
    } else {
      onFilterChange({
        ...filters,
        [key]: value,
      });
    }
  };

  const getGeoDisabledReason = (level: 'province' | 'municipality') => {
    if (level === 'municipality' && isRepartoSelected) return t.disabledNotices.byReparto;
    if (level === 'province') {
      if (isRepartoSelected) return t.disabledNotices.byReparto;
      if (isMunicipalitySelected) return t.disabledNotices.byMunicipality;
    }
    return '';
  };

  const activeFiltersCount =
    (filters.searchQuery ? 1 : 0) +
    (filters.provinces?.length || 0) +
    (filters.municipalities?.length || 0) +
    (filters.repartos?.length || 0) +
    (filters.paymentMethods?.length || 0) +
    (filters.deliveryMethods?.length || 0);

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
                {t.storeFilterTitle || 'Filtrado de Tiendas y proveedores'}
              </h3>
              {hasActiveFilters && (
                <span className="bg-slate-100 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-slate-200 dark:border-slate-700 text-[11px] font-extrabold px-2 py-0.5 rounded-full">
                  {activeFiltersCount} activo{activeFiltersCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Encontradas: <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{totalResults}</strong> {t.storesFound || 'tiendas encontradas'}{' '}
              <span className="text-slate-400 dark:text-slate-500">
                • {isExpanded ? 'Filtros desplegados' : 'Filtros plegados'}
              </span>
            </p>
          </div>
        </button>

        <div className="flex items-center gap-2">
          {/* Botón de limpieza de filtros: sólo ícono */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onReset();
              }}
              title={t.tooltips.reset || 'Restablecer o limpiar filtros'}
              aria-label={t.tooltips.reset || 'Restablecer o limpiar filtros'}
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

      {/* Expandable Body */}
      {isExpanded && (
        <div className="p-5 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-6 animate-in fade-in duration-200 rounded-b-2xl">
          
          {/* ========================================================================= */}
          {/* GRUPO 1: UBICACIÓN GEOGRÁFICA Y BÚSQUEDA                                 */}
          {/* ========================================================================= */}
          <div className="bg-white dark:bg-slate-800/90 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-700/60">
              <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  {t.groups.geoOnly || 'Ubicación Geográfica'}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t.groups.geoOnlyDesc || 'Filtra comercios por provincia, municipio o reparto'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Búsqueda por texto */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Search className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>{t.labels.store || 'Buscar tienda'}</span>
                </label>
                <input
                  type="text"
                  value={filters.searchQuery}
                  onChange={(e) => handleUpdate('searchQuery', e.target.value)}
                  placeholder={t.searchStoresPlaceholder || 'Nombre, eslogan, municipio o reparto...'}
                  title="Buscar por nombre, eslogan o dirección"
                  aria-label="Buscar por nombre, eslogan o dirección"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 outline-none"
                />
              </div>

              {/* Provincias */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>{t.labels.province || 'Provincias'}</span>
                  </span>
                  {isProvinceDisabled && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold truncate max-w-[170px]" title={getGeoDisabledReason('province')}>
                      {getGeoDisabledReason('province')}
                    </span>
                  )}
                </label>
                <SearchableMultiSelect
                  options={provinceOptions}
                  values={filters.provinces || []}
                  onChange={(values) => handleUpdate('provinces', values)}
                  placeholder={isProvinceDisabled ? 'Deshabilitado (filtro superior activo)' : (t.placeholders.allProvinces || 'Todas las provincias')}
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
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold truncate max-w-[170px]" title={getGeoDisabledReason('municipality')}>
                      {getGeoDisabledReason('municipality')}
                    </span>
                  )}
                </label>
                <SearchableMultiSelect
                  options={municipalityOptions}
                  values={filters.municipalities || []}
                  onChange={(values) => handleUpdate('municipalities', values)}
                  placeholder={
                    isMunicipalityDisabled
                      ? 'Deshabilitado (filtro superior activo)'
                      : municipalityOptions.length === 0
                      ? (t.placeholders.noMunicipalities || 'Sin municipios disponibles')
                      : (t.placeholders.allMunicipalities || 'Todos los municipios')
                  }
                  allLabel={t.placeholders.allMunicipalities || 'Todos los municipios'}
                  searchPlaceholder={t.placeholders.selectMunicipality || 'Buscar municipio...'}
                  disabled={isMunicipalityDisabled || municipalityOptions.length === 0}
                />
              </div>

              {/* Repartos */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>{t.labels.neighborhood || 'Repartos / Localidades'}</span>
                </label>
                <SearchableMultiSelect
                  options={repartoOptions}
                  values={filters.repartos || []}
                  onChange={(values) => handleUpdate('repartos', values)}
                  placeholder={
                    repartoOptions.length === 0
                      ? (t.placeholders.noRepartos || 'Sin repartos disponibles')
                      : (t.placeholders.allNeighborhoods || 'Todos los repartos')
                  }
                  allLabel={t.placeholders.allNeighborhoods || 'Todos los repartos'}
                  searchPlaceholder={t.placeholders.selectNeighborhood || 'Buscar reparto...'}
                  disabled={repartoOptions.length === 0}
                />
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* GRUPO 2: FORMAS DE PAGO Y ENTREGA                                         */}
          {/* ========================================================================= */}
          <div className="bg-white dark:bg-slate-800/90 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-700/60">
              <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <CreditCard className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  {t.groups.publicationAndPayment || 'Tipo de Oferta, Pagos y Entrega'}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t.groups.publicationAndPaymentDesc || 'Filtra opciones de pago aceptadas y modalidades de mensajería'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tipo de Pago */}
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

              {/* Mensajería */}
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

        </div>
      )}
    </div>
  );
};
