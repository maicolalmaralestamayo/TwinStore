import React, { useState, useMemo } from 'react';
import { DEFAULT_INTERFAZ } from '../../data/defaultInterfaz';
import {
  Type,
  Search,
  Save,
  RotateCcw,
  Check,
  Globe,
  Sliders,
  Store,
  Package,
  ShoppingCart,
  Shield,
  Layers,
  FileText,
  ChevronDown,
  ChevronRight,
  Filter,
  Download,
  Upload,
  Sparkles,
  AlertCircle
} from 'lucide-react';

interface UiTextsManagerProps {
  initialTexts?: Record<string, any>;
  onSave: (newTexts: Record<string, any>) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

interface SectionMeta {
  key: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SECTIONS_META: SectionMeta[] = [
  { key: 'header', label: 'Cabecera y Navegación', description: 'Títulos, botones y badges de la barra superior', icon: Globe },
  { key: 'subviews', label: 'Vistas Principales', description: 'Títulos de Catálogo de Productos y Directorio de Tiendas', icon: Layers },
  { key: 'filters', label: 'Filtros y Búsqueda', description: 'Barra de búsqueda, selectores, ordenamientos y etiquetas', icon: Filter },
  { key: 'productCard', label: 'Tarjetas de Producto', description: 'Precios, disponibilidad, botón de añadir y detalles', icon: Package },
  { key: 'storeCard', label: 'Tarjetas de Tienda', description: 'Badges de verificación, ubicación, tasas y contacto', icon: Store },
  { key: 'productDetail', label: 'Detalle de Producto (Modal)', description: 'Textos del modal ampliado con galería y especificaciones', icon: FileText },
  { key: 'storeDetail', label: 'Perfil de Tienda (Modal)', description: 'Información completa del comercio y sus ofertas', icon: Store },
  { key: 'storeDirectory', label: 'Directorio de Comercios', description: 'Búsqueda avanzada de comercios y estadísticas', icon: Store },
  { key: 'cart', label: 'Carrito de Compras', description: 'Resumen, checkout por WhatsApp, selector de moneda', icon: ShoppingCart },
  { key: 'pagination', label: 'Paginación', description: 'Textos de anterior, siguiente y contador de páginas', icon: Sliders },
  { key: 'adminLogin', label: 'Acceso CEO / Admin', description: 'Formulario de inicio de sesión de administradores', icon: Shield },
  { key: 'footer', label: 'Pie de Página', description: 'Enlaces, derechos reservados y notas del marketplace', icon: FileText },
  { key: 'toasts', label: 'Notificaciones y Alertas', description: 'Mensajes de éxito, advertencia o error del sistema', icon: AlertCircle },
];

export const UiTextsManager: React.FC<UiTextsManagerProps> = ({
  initialTexts,
  onSave,
  onShowToast,
}) => {
  // Merge initialTexts with DEFAULT_INTERFAZ to ensure all keys exist
  const [texts, setTexts] = useState<Record<string, any>>(() => {
    const base = JSON.parse(JSON.stringify(DEFAULT_INTERFAZ));
    if (initialTexts && typeof initialTexts === 'object') {
      for (const section in initialTexts) {
        if (typeof initialTexts[section] === 'object' && initialTexts[section] !== null) {
          base[section] = { ...(base[section] || {}), ...initialTexts[section] };
        } else {
          base[section] = initialTexts[section];
        }
      }
    }
    return base;
  });

  const [activeSection, setActiveSection] = useState<string>('header');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    header: true,
  });

  // Handle single string value update
  const handleValueChange = (sectionKey: string, itemKey: string, newValue: string) => {
    setTexts((prev) => {
      const updated = { ...prev };
      if (!updated[sectionKey]) updated[sectionKey] = {};
      updated[sectionKey] = {
        ...updated[sectionKey],
        [itemKey]: newValue,
      };
      return updated;
    });
    setHasChanges(true);
  };

  // Handle saving to SQLite
  const handleSave = () => {
    onSave(texts);
    setHasChanges(false);
    onShowToast('Textos de la interfaz guardados correctamente en la Base de Datos SQLite.', 'success');
  };

  // Reset to default factory texts
  const handleReset = () => {
    if (window.confirm('¿Seguro que deseas restablecer todos los textos de la interfaz a los valores iniciales predeterminados?')) {
      const defaults = JSON.parse(JSON.stringify(DEFAULT_INTERFAZ));
      setTexts(defaults);
      setHasChanges(true);
      onShowToast('Textos restablecidos a los valores por defecto. Guarda los cambios para persistir en la BD.', 'info');
    }
  };

  // Search filter matches across all sections
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.toLowerCase().trim();
    const matches: Array<{
      sectionKey: string;
      sectionLabel: string;
      items: Array<{ key: string; value: string }>;
    }> = [];

    for (const [sectionKey, sectionObj] of Object.entries(texts)) {
      if (typeof sectionObj !== 'object' || sectionObj === null) continue;
      const matchingItems: Array<{ key: string; value: string }> = [];

      for (const [key, value] of Object.entries(sectionObj)) {
        if (typeof value === 'string') {
          if (key.toLowerCase().includes(query) || value.toLowerCase().includes(query)) {
            matchingItems.push({ key, value });
          }
        }
      }

      if (matchingItems.length > 0) {
        const meta = SECTIONS_META.find((m) => m.key === sectionKey);
        matches.push({
          sectionKey,
          sectionLabel: meta ? meta.label : sectionKey,
          items: matchingItems,
        });
      }
    }
    return matches;
  }, [texts, searchQuery]);

  // Export as JSON backup
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(texts, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `interfaz_textos_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    onShowToast('Archivo JSON de textos descargado.', 'info');
  };

  // Import JSON backup
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (typeof parsed === 'object' && parsed !== null) {
          setTexts(parsed);
          setHasChanges(true);
          onShowToast('Textos importados correctamente. Haz clic en Guardar para persistirlos en la BD.', 'success');
        }
      } catch (err) {
        onShowToast('El archivo JSON no tiene un formato válido.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Get current active section entries
  const currentSectionData = (texts[activeSection] && typeof texts[activeSection] === 'object')
    ? texts[activeSection]
    : {};
  const currentMeta = SECTIONS_META.find((m) => m.key === activeSection) || {
    key: activeSection,
    label: activeSection,
    description: 'Textos de la sección seleccionada',
    icon: FileText,
  };
  const IconComponent = currentMeta.icon;

  return (
    <div id="ui-texts-manager-container" className="space-y-6">
      {/* Top Banner & Control Actions */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Type className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Gestión de Textos de la Interfaz
            </h2>
          </div>
          <p className="text-sm text-slate-500 max-w-2xl">
            Todos los textos, etiquetas, títulos y avisos están centralizados en la Base de Datos SQLite. 
            Cualquier cambio se guarda permanentemente y se refleja en tiempo real en todo el marketplace.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <label className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer transition-colors flex items-center gap-1.5 shadow-2xs">
            <Upload className="w-3.5 h-3.5" />
            <span>Importar JSON</span>
            <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
          </label>

          <button
            type="button"
            onClick={handleExportJson}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
            title="Descargar copia de seguridad de textos"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
            title="Restablecer textos a configuración por defecto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Por Defecto</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-xs ${
              hasChanges
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-indigo-200'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>{hasChanges ? 'Guardar Cambios en BD' : 'Guardado'}</span>
          </button>
        </div>
      </div>

      {/* Real-Time Live Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar cualquier texto, palabra clave o identificador en toda la interfaz..."
            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* IF SEARCH IS ACTIVE: Display all matches grouped by section */}
      {filteredSections !== null ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 px-1">
            <span>Resultados de búsqueda para: "{searchQuery}"</span>
            <span>{filteredSections.reduce((acc, s) => acc + s.items.length, 0)} coincidencia(s)</span>
          </div>

          {filteredSections.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">No se encontraron textos que coincidan con la búsqueda.</p>
            </div>
          ) : (
            filteredSections.map((sec) => (
              <div key={sec.sectionKey} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                    {sec.sectionLabel}
                  </span>
                  <span className="text-xs text-slate-400">({sec.sectionKey})</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sec.items.map((item) => (
                    <div key={item.key} className="space-y-1.5 p-3 rounded-xl bg-slate-50/70 border border-slate-200/60">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 font-mono">
                          {item.key}
                        </label>
                      </div>
                      <input
                        type="text"
                        value={item.value}
                        onChange={(e) => handleValueChange(sec.sectionKey, item.key, e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* STANDARD VIEW: Section tabs on left, inputs on right */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Section Navigation Sidebar */}
          <div className="lg:col-span-4 space-y-1.5 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              Secciones de la Interfaz
            </div>
            {SECTIONS_META.map((meta) => {
              const Icon = meta.icon;
              const isActive = activeSection === meta.key;
              const count = texts[meta.key] && typeof texts[meta.key] === 'object'
                ? Object.keys(texts[meta.key]).length
                : 0;

              return (
                <button
                  key={meta.key}
                  type="button"
                  onClick={() => setActiveSection(meta.key)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{meta.label}</span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${
                      isActive ? 'bg-indigo-700/50 text-indigo-100' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Section Key-Value Editor */}
          <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                  <IconComponent className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{currentMeta.label}</h3>
                  <p className="text-xs text-slate-500">{currentMeta.description}</p>
                </div>
              </div>
              <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">
                clave: {currentMeta.key}
              </span>
            </div>

            {Object.keys(currentSectionData).length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                No hay claves definidas en esta sección.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(currentSectionData).map(([itemKey, itemVal]) => {
                  if (typeof itemVal !== 'string') return null;
                  const defaultValue = (DEFAULT_INTERFAZ as any)[activeSection]?.[itemKey] || '';
                  const isModified = itemVal !== defaultValue;

                  return (
                    <div
                      key={itemKey}
                      className={`p-3.5 rounded-xl border transition-all space-y-2 ${
                        isModified
                          ? 'bg-amber-50/30 border-amber-200/70'
                          : 'bg-slate-50/60 border-slate-200/60 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 font-mono truncate" title={itemKey}>
                          {itemKey}
                        </label>
                        {isModified && (
                          <span className="text-[10px] font-semibold text-amber-600 bg-amber-100/70 px-1.5 py-0.5 rounded-md">
                            Editado
                          </span>
                        )}
                      </div>

                      <input
                        type="text"
                        value={itemVal}
                        onChange={(e) => handleValueChange(activeSection, itemKey, e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                      />

                      {defaultValue && isModified && (
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="truncate max-w-[200px]" title={defaultValue}>
                            Original: {defaultValue}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleValueChange(activeSection, itemKey, defaultValue)}
                            className="text-indigo-600 hover:text-indigo-800 font-semibold"
                          >
                            Restaurar
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom Save Bar for convenience */}
            <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Los cambios se guardan directamente en SQLite al pulsar Guardar.</span>
              </div>
              <button
                type="button"
                onClick={handleSave}
                disabled={!hasChanges}
                className={`px-5 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-xs ${
                  hasChanges
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-indigo-200'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Save className="w-4 h-4" />
                <span>Guardar Cambios</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
