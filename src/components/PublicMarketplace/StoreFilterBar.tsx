import React from 'react';
import { StoreFilterState, GeoProvince } from '../../types';
import { INITIAL_GEO_CATALOG } from '../../data/initialData';
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

interface StoreFilterBarProps {
  geoCatalog?: GeoProvince[];
  filters: StoreFilterState;
  onFilterChange: (filters: StoreFilterState) => void;
  onReset: () => void;
  totalResults: number;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

export const StoreFilterBar: React.FC<StoreFilterBarProps> = ({
  geoCatalog,
  filters,
  onFilterChange,
  onReset,
  totalResults,
  isExpanded,
  onToggleExpanded,
}) => {
  const effectiveGeoCatalog =
    geoCatalog && geoCatalog.length > 0 ? geoCatalog : INITIAL_GEO_CATALOG;

  // Province options
  const provinceOptions = effectiveGeoCatalog.map((p) => ({
    value: p.name,
    label: p.name,
    sublabel: `${p.municipalities?.length || 0} municipios`,
  }));

  // Selected provinces list
  const selectedProvincesList =
    filters.provinces && filters.provinces.length > 0
      ? effectiveGeoCatalog.filter((p) => filters.provinces.includes(p.name))
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
          filters.municipalities.includes(m.name)
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
          title={isExpanded ? 'Plegar filtros' : 'Desplegar filtros'}
          aria-label={isExpanded ? 'Plegar filtros' : 'Desplegar filtros'}
          className="flex items-center gap-3 text-left group cursor-pointer focus:outline-none flex-1 min-w-0"
        >
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
            <Filter className="w-4 h-4" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-slate-900 dark:text-white text-sm sm:text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-none">
                Filtrado de Tiendas y proveedores
              </h3>
              {hasActiveFilters && (
                <span className="bg-slate-100 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-slate-200 dark:border-slate-700 text-[11px] font-extrabold px-2 py-0.5 rounded-full">
                  {activeFiltersCount} activo{activeFiltersCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Encontradas: <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{totalResults}</strong> tiendas y proveedores activos{' '}
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
              title="Restablecer o limpiar filtros"
              aria-label="Restablecer o limpiar filtros"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Búsqueda por texto */}
            <div className="sm:col-span-2 md:col-span-1 lg:col-span-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Search className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Buscar tienda o proveedor</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={filters.searchQuery}
                  onChange={(e) => handleUpdate('searchQuery', e.target.value)}
                  placeholder="Nombre, eslogan o calle..."
                  title="Buscar por nombre, eslogan o dirección"
                  aria-label="Buscar por nombre, eslogan o dirección"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            {/* Provincias */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Provincias</span>
              </label>
              <SearchableMultiSelect
                options={provinceOptions}
                values={filters.provinces || []}
                onChange={(values) => handleUpdate('provinces', values)}
                placeholder="Todas las provincias"
                allLabel="Todas las provincias"
                searchPlaceholder="Buscar provincia..."
              />
            </div>

            {/* Municipios */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Municipios</span>
              </label>
              <SearchableMultiSelect
                options={municipalityOptions}
                values={filters.municipalities || []}
                onChange={(values) => handleUpdate('municipalities', values)}
                placeholder="Todos los municipios"
                allLabel="Todos los municipios"
                searchPlaceholder="Buscar municipio..."
                disabled={municipalityOptions.length === 0}
              />
            </div>

            {/* Repartos */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Repartos / Localidades</span>
              </label>
              <SearchableMultiSelect
                options={repartoOptions}
                values={filters.repartos || []}
                onChange={(values) => handleUpdate('repartos', values)}
                placeholder="Todos los repartos"
                allLabel="Todos los repartos"
                searchPlaceholder="Buscar reparto..."
                disabled={repartoOptions.length === 0}
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
            <div className="sm:col-span-2 md:col-span-1 lg:col-span-1">
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
          </div>
        </div>
      )}
    </div>
  );
};
