import React, { useState } from 'react';
import { Store, Product, CategoryItem, MarketplaceConfig } from '../../types';
import { StoreManager } from './StoreManager';
import { ProductManager } from './ProductManager';
import { GlobalConfigManager } from './GlobalConfigManager';
import { AdminPasswordModal } from './AdminPasswordModal';
import {
  exportFullJsonBackup,
  exportStoresCsv,
  exportProductsCsv,
  exportGeoCatalogCsv,
  exportDepartmentsCsv,
  exportTagsCsv,
  exportConfigCsv,
  exportProductTypesCsv,
  exportPaymentMethodsCsv,
  exportPaymentPlatformsCsv,
  exportDeliveryMethodsCsv,
  parseAndImportAnyCsv,
  FullMarketplaceBackup,
} from '../../lib/backupUtils';
import { interfaz } from '../../data/interfaz';
import {
  ShieldCheck,
  Store as StoreIcon,
  ShoppingBag,
  Database,
  LogOut,
  Download,
  Upload,
  RefreshCw,
  TrendingUp,
  MapPin,
  FolderTree,
  Tag,
  Settings,
  FileText,
  CreditCard,
  Truck,
  Layers,
} from 'lucide-react';

interface AdminDashboardProps {
  stores: Store[];
  products: Product[];
  categories: CategoryItem[];
  marketplaceConfig?: MarketplaceConfig;
  onUpdateMarketplaceConfig?: (newConfig: MarketplaceConfig) => void;
  onUpdateStoreRate: (storeId: string, newRate: number) => void;
  onUpdateAllStoresRate: (newRate: number) => void;
  onAddStore: (store: Omit<Store, 'id' | 'createdAt'>) => void;
  onUpdateStore: (store: Store) => void;
  onDeleteStore: (storeId: string) => void;
  onAddProduct: (product: Omit<Product, 'id' | 'createdAt'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onLogout: () => void;
  onRestoreDefaults: () => void;
  onImportData: (stores: Store[], products: Product[]) => void;
  onShowToast: (title: string, desc?: string, type?: 'success' | 'info' | 'error') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  stores,
  products,
  categories,
  marketplaceConfig,
  onUpdateMarketplaceConfig,
  onUpdateStoreRate,
  onUpdateAllStoresRate,
  onAddStore,
  onUpdateStore,
  onDeleteStore,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onLogout,
  onRestoreDefaults,
  onImportData,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'config' | 'stores' | 'products' | 'backup'>('config');
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const handleExportBackup = () => {
    if (marketplaceConfig) {
      exportFullJsonBackup(
        stores,
        products,
        marketplaceConfig.geoCatalog || [],
        marketplaceConfig.departmentsCatalog || [],
        marketplaceConfig.tagsCatalog || [],
        marketplaceConfig,
        marketplaceConfig.productTypesCatalog,
        marketplaceConfig.paymentMethodsCatalog,
        marketplaceConfig.deliveryMethodsCatalog,
        marketplaceConfig.paymentPlatformsCatalog
      );
      onShowToast('Respaldo Total Descargado', 'Copia completa guardada como archivo JSON');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content) as FullMarketplaceBackup;

        if (Array.isArray(parsed.stores) && Array.isArray(parsed.products)) {
          onImportData(parsed.stores, parsed.products);

          if (marketplaceConfig && onUpdateMarketplaceConfig) {
            const updatedConfig = {
              ...marketplaceConfig,
              ...(parsed.marketplaceConfig || {}),
              geoCatalog: parsed.geoCatalog || marketplaceConfig.geoCatalog,
              departmentsCatalog: parsed.departmentsCatalog || marketplaceConfig.departmentsCatalog,
              tagsCatalog: parsed.tagsCatalog || marketplaceConfig.tagsCatalog,
              productTypesCatalog: parsed.productTypesCatalog || marketplaceConfig.productTypesCatalog,
              paymentMethodsCatalog: parsed.paymentMethodsCatalog || marketplaceConfig.paymentMethodsCatalog,
              deliveryMethodsCatalog: parsed.deliveryMethodsCatalog || marketplaceConfig.deliveryMethodsCatalog,
              paymentPlatformsCatalog: parsed.paymentPlatformsCatalog || marketplaceConfig.paymentPlatformsCatalog,
            };
            onUpdateMarketplaceConfig(updatedConfig);
          }

          onShowToast('¡Respaldo Total Importado!', 'Se restauraron tiendas, productos, geografía, departamentos, nomencladores y configuraciones', 'success');
        } else {
          onShowToast('Archivo inválido', 'El archivo no tiene la estructura de respaldo requerida', 'error');
        }
      } catch (err) {
        onShowToast('Error de lectura', 'No se pudo procesar el archivo JSON', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleAnyCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const result = parseAndImportAnyCsv(content);

        if (result.type === 'stores' && result.stores) {
          onImportData([...stores, ...result.stores], products);
          onShowToast('CSV de Tiendas cargado', `Se importaron ${result.stores.length} tiendas correctamente`, 'success');
        } else if (result.type === 'products' && result.products) {
          onImportData(stores, [...products, ...result.products]);
          onShowToast('CSV de Productos cargado', `Se importaron ${result.products.length} productos correctamente`, 'success');
        } else if (result.type === 'geo' && result.geoCatalog && marketplaceConfig && onUpdateMarketplaceConfig) {
          onUpdateMarketplaceConfig({ ...marketplaceConfig, geoCatalog: result.geoCatalog });
          onShowToast('CSV de Geografía cargado', `Se importaron ${result.geoCatalog.length} provincias con sus municipios y repartos`, 'success');
        } else if (result.type === 'departments' && result.departmentsCatalog && marketplaceConfig && onUpdateMarketplaceConfig) {
          onUpdateMarketplaceConfig({ ...marketplaceConfig, departmentsCatalog: result.departmentsCatalog });
          onShowToast('CSV de Departamentos cargado', `Se importaron ${result.departmentsCatalog.length} departamentos y subdepartamentos`, 'success');
        } else if (result.type === 'tags' && result.tagsCatalog && marketplaceConfig && onUpdateMarketplaceConfig) {
          onUpdateMarketplaceConfig({ ...marketplaceConfig, tagsCatalog: result.tagsCatalog });
          onShowToast('CSV de Etiquetas cargado', `Se importaron ${result.tagsCatalog.length} superetiquetas y etiquetas`, 'success');
        } else if (result.type === 'paymentPlatforms' && result.paymentPlatformsCatalog && marketplaceConfig && onUpdateMarketplaceConfig) {
          onUpdateMarketplaceConfig({ ...marketplaceConfig, paymentPlatformsCatalog: result.paymentPlatformsCatalog });
          onShowToast('CSV de Plataformas de Pago cargado', `Se importaron ${result.paymentPlatformsCatalog.length} plataformas de pago`, 'success');
        } else if (result.type === 'paymentMethods' && result.paymentMethodsCatalog && marketplaceConfig && onUpdateMarketplaceConfig) {
          onUpdateMarketplaceConfig({ ...marketplaceConfig, paymentMethodsCatalog: result.paymentMethodsCatalog });
          onShowToast('CSV de Tipos de Pago cargado', `Se importaron ${result.paymentMethodsCatalog.length} tipos de pago`, 'success');
        } else if (result.type === 'productTypes' && result.productTypesCatalog && marketplaceConfig && onUpdateMarketplaceConfig) {
          onUpdateMarketplaceConfig({ ...marketplaceConfig, productTypesCatalog: result.productTypesCatalog });
          onShowToast('CSV de Tipos de Oferta cargado', `Se importaron ${result.productTypesCatalog.length} tipos de oferta`, 'success');
        } else if (result.type === 'deliveryMethods' && result.deliveryMethodsCatalog && marketplaceConfig && onUpdateMarketplaceConfig) {
          onUpdateMarketplaceConfig({ ...marketplaceConfig, deliveryMethodsCatalog: result.deliveryMethodsCatalog });
          onShowToast('CSV de Tipos de Recogida cargado', `Se importaron ${result.deliveryMethodsCatalog.length} tipos de recogida`, 'success');
        } else if (result.type === 'config' && result.configPatch && marketplaceConfig && onUpdateMarketplaceConfig) {
          onUpdateMarketplaceConfig({ ...marketplaceConfig, ...result.configPatch });
          onShowToast('CSV de Configuración cargado', 'Se actualizaron las variables de configuración del marketplace', 'success');
        } else {
          onShowToast('Error al leer CSV', result.error || 'No se reconoció el tipo de CSV', 'error');
        }
      } catch (err) {
        onShowToast('Error de procesamiento', 'No se pudo leer el archivo CSV', 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Top Admin Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                {interfaz.admin.portalTitle}
              </h1>
              <span className="text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-md">
                {interfaz.admin.roleOwner}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {interfaz.admin.portalSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 text-xs sm:text-sm font-bold transition-all border border-slate-200 cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            <span>{interfaz.admin.topButtons.changePassword}</span>
          </button>
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 text-xs sm:text-sm font-bold transition-all border border-slate-200 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{interfaz.admin.topButtons.logout}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('config')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'config'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>{interfaz.admin.tabs.general}</span>
        </button>

        <button
          onClick={() => setActiveTab('stores')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'stores'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
          title={interfaz.admin.storesManager.title}
          aria-label={interfaz.admin.storesManager.title}
        >
          <StoreIcon className="w-4 h-4 text-indigo-400" />
          <span>{interfaz.admin.tabs.stores} ({stores.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'products'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
          title={interfaz.admin.productsManager.title}
          aria-label={interfaz.admin.productsManager.title}
        >
          <ShoppingBag className="w-4 h-4 text-indigo-400" />
          <span>{interfaz.admin.tabs.products} ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'backup'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>{interfaz.admin.tabs.backup}</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'config' && marketplaceConfig && onUpdateMarketplaceConfig && (
        <GlobalConfigManager
          config={marketplaceConfig}
          onUpdateConfig={onUpdateMarketplaceConfig}
          onShowToast={onShowToast}
          stores={stores}
          onUpdateStores={(updatedStores) => {
            updatedStores.forEach((s) => onUpdateStore(s));
          }}
        />
      )}

      {activeTab === 'stores' && (
        <StoreManager
          stores={stores}
          marketplaceConfig={marketplaceConfig}
          onAddStore={onAddStore}
          onUpdateStore={onUpdateStore}
          onDeleteStore={onDeleteStore}
          onUpdateAllStoresRate={onUpdateAllStoresRate}
          onShowToast={onShowToast}
        />
      )}

      {activeTab === 'products' && (
        <ProductManager
          products={products}
          stores={stores}
          categories={categories}
          departmentsCatalog={marketplaceConfig?.departmentsCatalog}
          tagsCatalog={marketplaceConfig?.tagsCatalog}
          productTypesCatalog={marketplaceConfig?.productTypesCatalog}
          paymentMethodsCatalog={marketplaceConfig?.paymentMethodsCatalog}
          deliveryMethodsCatalog={marketplaceConfig?.deliveryMethodsCatalog}
          marketplaceConfig={marketplaceConfig}
          onAddProduct={onAddProduct}
          onUpdateProduct={onUpdateProduct}
          onDeleteProduct={onDeleteProduct}
          onShowToast={onShowToast}
        />
      )}

      {activeTab === 'backup' && (
        <div className="bg-white rounded-3xl p-8 border border-gray-200 space-y-8">
          <div>
            <h3 className="text-xl font-black text-gray-900">
              {interfaz.admin.backup.title}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {interfaz.admin.backup.subtitle}
            </p>
          </div>

          {/* Section 1: Export Respaldo (JSON & CSV) */}
          <div className="space-y-4">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Download className="w-4 h-4 text-emerald-600" />
              <span>{interfaz.admin.backup.exportSection.title}</span>
            </h4>
            
            {/* Unified Full Backup JSON Card */}
            <div className="border border-emerald-300 rounded-2xl p-5 bg-emerald-50/40 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h5 className="font-extrabold text-slate-900 text-base">{interfaz.admin.backup.exportSection.fullBackupTitle}</h5>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {interfaz.admin.backup.exportSection.fullBackupDesc}
                  </p>
                </div>
              </div>
              <button
                onClick={handleExportBackup}
                className="w-full sm:w-auto py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-all shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{interfaz.admin.backup.exportSection.fullBackupBtn}</span>
              </button>
            </div>

            {/* Word .DOCX Database Dictionary Document */}
            <div className="border border-blue-300 rounded-2xl p-5 bg-blue-50/40 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h5 className="font-extrabold text-slate-900 text-base">Diccionario de Datos y Modelo de BD (.docx)</h5>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Descarga el documento de Word oficial con la descripción tabla por tabla (campos, tipos, PK, FK, obligatoriedad) y el esquema de relaciones con políticas de eliminación y actualización en cascada.
                  </p>
                </div>
              </div>
              <a
                href="/api/docs/download-db-schema"
                download="Diccionario_Datos_Estructura_BD_TwinStore.docx"
                onClick={() => {
                  onShowToast('Descargando Documento Word (.docx)', 'Diccionario de Datos y Modelo Relacional');
                }}
                className="w-full sm:w-auto py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-all shrink-0 cursor-pointer text-center no-underline"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Word .DOCX</span>
              </a>
            </div>

            {/* Individual Table CSV Exporters */}
            <h5 className="text-xs font-bold text-slate-600 pt-2">{interfaz.admin.backup.exportSection.csvSubheading}</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* Stores CSV */}
              <div className="border border-indigo-200 rounded-2xl p-4 flex flex-col justify-between gap-3 bg-indigo-50/20 hover:border-indigo-300 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <StoreIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h6 className="font-bold text-slate-900 text-xs">{interfaz.admin.tabs.stores}</h6>
                    <p className="text-[11px] text-slate-500">{stores.length} {interfaz.admin.backup.exportSection.recordsLabel}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    exportStoresCsv(stores);
                    onShowToast('CSV de Tiendas generado', 'Tabla de tiendas descargada correctamente');
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{interfaz.admin.backup.exportSection.storesCsv}</span>
                </button>
              </div>

              {/* Products CSV */}
              <div className="border border-blue-200 rounded-2xl p-4 flex flex-col justify-between gap-3 bg-blue-50/20 hover:border-blue-300 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <h6 className="font-bold text-slate-900 text-xs">{interfaz.admin.tabs.products}</h6>
                    <p className="text-[11px] text-slate-500">{products.length} {interfaz.admin.backup.exportSection.recordsLabel}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    exportProductsCsv(products);
                    onShowToast('CSV de Productos generado', 'Tabla de productos descargada correctamente');
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{interfaz.admin.backup.exportSection.productsCsv}</span>
                </button>
              </div>

              {/* Geo Catalog CSV */}
              <div className="border border-amber-200 rounded-2xl p-4 flex flex-col justify-between gap-3 bg-amber-50/20 hover:border-amber-300 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h6 className="font-bold text-slate-900 text-xs">Tabla: Geografía</h6>
                    <p className="text-[11px] text-slate-500">Provincias, Municipios & Repartos</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (marketplaceConfig?.geoCatalog) {
                      exportGeoCatalogCsv(marketplaceConfig.geoCatalog);
                      onShowToast('CSV de Geografía generado', 'Tabla de geografía descargada correctamente');
                    }
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{interfaz.admin.backup.exportSection.geoCsv}</span>
                </button>
              </div>

              {/* Departments CSV */}
              <div className="border border-purple-200 rounded-2xl p-4 flex flex-col justify-between gap-3 bg-purple-50/20 hover:border-purple-300 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                    <FolderTree className="w-4 h-4" />
                  </div>
                  <div>
                    <h6 className="font-bold text-slate-900 text-xs">Tabla: Departamentos</h6>
                    <p className="text-[11px] text-slate-500">Deptos & Subdepartamentos</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (marketplaceConfig?.departmentsCatalog) {
                      exportDepartmentsCsv(marketplaceConfig.departmentsCatalog);
                      onShowToast('CSV de Departamentos generado', 'Tabla de departamentos descargada');
                    }
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{interfaz.admin.backup.exportSection.deptsCsv}</span>
                </button>
              </div>

              {/* Tags CSV */}
              <div className="border border-rose-200 rounded-2xl p-4 flex flex-col justify-between gap-3 bg-rose-50/20 hover:border-rose-300 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <h6 className="font-bold text-slate-900 text-xs">Tabla: Etiquetas</h6>
                    <p className="text-[11px] text-slate-500">Superetiquetas & Tags</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (marketplaceConfig?.tagsCatalog) {
                      exportTagsCsv(marketplaceConfig.tagsCatalog);
                      onShowToast('CSV de Etiquetas generado', 'Tabla de etiquetas descargada');
                    }
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{interfaz.admin.backup.exportSection.tagsCsv}</span>
                </button>
              </div>

              {/* Plataformas de Pago CSV */}
              <div className="border border-emerald-200 rounded-2xl p-4 flex flex-col justify-between gap-3 bg-emerald-50/20 hover:border-emerald-300 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h6 className="font-bold text-slate-900 text-xs">Tabla: Plataformas de Pago</h6>
                    <p className="text-[11px] text-slate-500">B. Metropolitano, Zelle, PayPal...</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (marketplaceConfig?.paymentPlatformsCatalog) {
                      exportPaymentPlatformsCsv(marketplaceConfig.paymentPlatformsCatalog);
                      onShowToast('CSV de Plataformas de Pago generado', 'Tabla de plataformas de pago descargada');
                    }
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Plataformas CSV</span>
                </button>
              </div>

              {/* Tipos de Oferta CSV */}
              <div className="border border-indigo-200 rounded-2xl p-4 flex flex-col justify-between gap-3 bg-indigo-50/20 hover:border-indigo-300 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h6 className="font-bold text-slate-900 text-xs">Tabla: Tipos de Oferta</h6>
                    <p className="text-[11px] text-slate-500">Productos, Servicios, Alquileres...</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (marketplaceConfig?.productTypesCatalog) {
                      exportProductTypesCsv(marketplaceConfig.productTypesCatalog);
                      onShowToast('CSV de Tipos de Oferta generado', 'Tabla de tipos de oferta descargada');
                    }
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Ofertas CSV</span>
                </button>
              </div>

              {/* Tipos de Pago CSV */}
              <div className="border border-violet-200 rounded-2xl p-4 flex flex-col justify-between gap-3 bg-violet-50/20 hover:border-violet-300 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h6 className="font-bold text-slate-900 text-xs">Tabla: Tipos de Pago</h6>
                    <p className="text-[11px] text-slate-500">Efectivo, Transferencia, Cripto...</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (marketplaceConfig?.paymentMethodsCatalog) {
                      exportPaymentMethodsCsv(marketplaceConfig.paymentMethodsCatalog);
                      onShowToast('CSV de Tipos de Pago generado', 'Tabla de tipos de pago descargada');
                    }
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Tipos Pago CSV</span>
                </button>
              </div>

              {/* Tipos de Recogida CSV */}
              <div className="border border-sky-200 rounded-2xl p-4 flex flex-col justify-between gap-3 bg-sky-50/20 hover:border-sky-300 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <h6 className="font-bold text-slate-900 text-xs">Tabla: Tipos de Recogida</h6>
                    <p className="text-[11px] text-slate-500">Mensajería, Retiro en tienda...</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (marketplaceConfig?.deliveryMethodsCatalog) {
                      exportDeliveryMethodsCsv(marketplaceConfig.deliveryMethodsCatalog);
                      onShowToast('CSV de Tipos de Recogida generado', 'Tabla de tipos de recogida descargada');
                    }
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Recogida CSV</span>
                </button>
              </div>

              {/* Config CSV */}
              <div className="border border-slate-200 rounded-2xl p-4 flex flex-col justify-between gap-3 bg-slate-50 hover:border-slate-300 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div>
                    <h6 className="font-bold text-slate-900 text-xs">Tabla: Configuración</h6>
                    <p className="text-[11px] text-slate-500">Variables Globales</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (marketplaceConfig) {
                      exportConfigCsv(marketplaceConfig);
                      onShowToast('CSV de Configuración generado', 'Configuración general descargada');
                    }
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{interfaz.admin.backup.exportSection.configCsv}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Import / Cargar Respaldo (JSON & CSV) */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Upload className="w-4 h-4 text-blue-600" />
              <span>{interfaz.admin.backup.importSection.title}</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Import JSON */}
              <div className="border border-gray-200 rounded-2xl p-5 flex flex-col justify-between gap-4 bg-gray-50/60">
                <div>
                  <h5 className="font-bold text-gray-900 text-sm">{interfaz.admin.backup.importSection.jsonTitle}</h5>
                  <p className="text-xs text-gray-500 mt-1">
                    {interfaz.admin.backup.importSection.jsonDesc}
                  </p>
                </div>
                <label className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>{interfaz.admin.backup.importSection.jsonBtn}</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Import CSV Intelligent */}
              <div className="border border-gray-200 rounded-2xl p-5 flex flex-col justify-between gap-4 bg-gray-50/60">
                <div>
                  <h5 className="font-bold text-gray-900 text-sm">{interfaz.admin.backup.importSection.csvTitle}</h5>
                  <p className="text-xs text-gray-500 mt-1">
                    {interfaz.admin.backup.importSection.csvDesc}
                  </p>
                </div>
                <label className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>{interfaz.admin.backup.importSection.csvBtn}</span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleAnyCsvUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Restore Seed Demo */}
              <div className="border border-amber-200 rounded-2xl p-5 flex flex-col justify-between gap-4 bg-amber-50/40">
                <div>
                  <h5 className="font-bold text-gray-900 text-sm">{interfaz.admin.backup.importSection.demoTitle}</h5>
                  <p className="text-xs text-gray-600 mt-1">
                    {interfaz.admin.backup.importSection.demoDesc}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        interfaz.admin.backup.importSection.confirmRestore
                      )
                    ) {
                      onRestoreDefaults();
                      onShowToast('¡Datos restaurados!', 'El catálogo volvió a los datos de demostración');
                    }
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>{interfaz.admin.backup.importSection.demoBtn}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AdminPasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onShowToast={onShowToast}
      />
    </div>
  );
};
