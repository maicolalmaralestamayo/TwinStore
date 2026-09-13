import React, { useState, useEffect, useMemo } from 'react';
import {
  Store,
  StoreAddress,
  StorePaymentOptions,
  MarketplaceConfig,
  PaymentMethodItem,
  DeliveryMethodItem,
} from '../../types';
import { ThemeImage } from '../common/ThemeImage';
import {
  INITIAL_GEO_CATALOG,
  INITIAL_PAYMENT_METHODS_CATALOG,
  INITIAL_DELIVERY_METHODS_CATALOG,
} from '../../data/initialData';
import {
  Plus,
  Edit2,
  Trash2,
  X,
  MapPin,
  Truck,
  CreditCard,
  Upload,
  Check,
  Search,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
} from 'lucide-react';
import { getStoreLogoUrl } from '../../lib/utils';
import { ImageGalleryUploader } from '../common/ImageGalleryUploader';
import { SearchableSelect } from '../common/SearchableSelect';

interface StoreManagerProps {
  stores: Store[];
  marketplaceConfig?: MarketplaceConfig;
  onAddStore: (store: Omit<Store, 'id' | 'createdAt'>) => void;
  onUpdateStore: (store: Store) => void;
  onDeleteStore: (storeId: string) => void;
  onUpdateAllStoresRate?: (newRate: number) => void;
  onShowToast: (title: string, desc?: string, type?: 'success' | 'info' | 'error') => void;
}

const ITEMS_PER_PAGE = 10;

export const StoreManager: React.FC<StoreManagerProps> = ({
  stores,
  marketplaceConfig,
  onAddStore,
  onUpdateStore,
  onDeleteStore,
  onUpdateAllStoresRate,
  onShowToast,
}) => {
  const geoCatalog = marketplaceConfig?.geoCatalog || INITIAL_GEO_CATALOG;
  const paymentMethodsCatalog =
    marketplaceConfig?.paymentMethodsCatalog && marketplaceConfig.paymentMethodsCatalog.length > 0
      ? marketplaceConfig.paymentMethodsCatalog
      : INITIAL_PAYMENT_METHODS_CATALOG;
  const deliveryMethodsCatalog =
    marketplaceConfig?.deliveryMethodsCatalog && marketplaceConfig.deliveryMethodsCatalog.length > 0
      ? marketplaceConfig.deliveryMethodsCatalog
      : INITIAL_DELIVERY_METHODS_CATALOG;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'address' | 'payment'>('general');

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [bulkRateInput, setBulkRateInput] = useState<number>(675);

  // Form State - General
  const [name, setName] = useState('');
  const [slogan, setSlogan] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('+5354292049');
  const [usdToCupRate, setUsdToCupRate] = useState<number>(675);
  const [active, setActive] = useState(true);

  // Form State - Address
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [building, setBuilding] = useState('');
  const [apartment, setApartment] = useState('');
  const [crossStreet1, setCrossStreet1] = useState('');
  const [crossStreet2, setCrossStreet2] = useState('');
  const [neighborhood, setNeighborhood] = useState('Zamora');
  const [municipality, setMunicipality] = useState('Marianao');
  const [province, setProvince] = useState('La Habana');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');

  // Form State - Dynamic Delivery & Payment Nomenclators
  const [deliveryMethodIds, setDeliveryMethodIds] = useState<string[]>(['dm-mensajeria', 'dm-recogida']);
  const [paymentMethodIds, setPaymentMethodIds] = useState<string[]>(['pm-efectivo', 'pm-transferencia']);
  const [deliveryAvailable, setDeliveryAvailable] = useState(true);
  const [transferAccepted, setTransferAccepted] = useState(true);
  const [transferFeePercentage, setTransferFeePercentage] = useState<number>(10);

  const toggleDeliveryMethod = (id: string) => {
    setDeliveryMethodIds((prev) => {
      const next = prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id];
      setDeliveryAvailable(
        next.includes('dm-mensajeria') || next.some((item) => item.toLowerCase().includes('mensajeria'))
      );
      return next;
    });
  };

  const togglePaymentMethod = (id: string) => {
    setPaymentMethodIds((prev) => {
      const next = prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id];
      setTransferAccepted(
        next.includes('pm-transferencia') || next.some((item) => item.toLowerCase().includes('transfer'))
      );
      return next;
    });
  };

  // Reset page on filter search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Rate metrics calculation
  const activeStoresList = useMemo(() => stores.filter((s) => s.active), [stores]);
  const ratesList = useMemo(
    () => activeStoresList.map((s) => s.usdToCupRate).filter(Boolean),
    [activeStoresList]
  );
  const avgRate = useMemo(
    () => (ratesList.length > 0 ? Math.round(ratesList.reduce((a, b) => a + b, 0) / ratesList.length) : 675),
    [ratesList]
  );
  const minRate = useMemo(() => (ratesList.length > 0 ? Math.min(...ratesList) : 675), [ratesList]);
  const maxRate = useMemo(() => (ratesList.length > 0 ? Math.max(...ratesList) : 675), [ratesList]);

  // Dependent location lists for modal
  const selectedProvObj =
    geoCatalog.find((p) => p.name === province) || geoCatalog[0];
  const municipalitiesList = selectedProvObj?.municipalities || [];
  const selectedMunObj =
    municipalitiesList.find((m) => m.name === municipality) ||
    municipalitiesList[0];
  const repartosList = selectedMunObj?.repartos || [];

  const handleProvinceChange = (newProvinceName: string) => {
    setProvince(newProvinceName);
    const newProvObj =
      geoCatalog.find((p) => p.name === newProvinceName) || geoCatalog[0];
    const newMunObj = newProvObj?.municipalities[0];
    if (newMunObj) {
      setMunicipality(newMunObj.name);
      const newRepObj = newMunObj.repartos[0];
      setNeighborhood(newRepObj ? newRepObj.name : '');
    } else {
      setMunicipality('');
      setNeighborhood('');
    }
  };

  const handleMunicipalityChange = (newMunName: string) => {
    setMunicipality(newMunName);
    const newMunObj =
      municipalitiesList.find((m) => m.name === newMunName) ||
      municipalitiesList[0];
    const newRepObj = newMunObj?.repartos[0];
    setNeighborhood(newRepObj ? newRepObj.name : '');
  };

  const openNewModal = () => {
    setEditingStore(null);
    setActiveTab('general');
    setName('');
    setSlogan('');
    setLogoUrl('');
    setImages([]);
    setNewImageUrl('');
    setWhatsappPhone('+5354292049');
    setUsdToCupRate(675);
    setActive(true);

    setStreet('');
    setNumber('');
    setBuilding('');
    setApartment('');
    setCrossStreet1('');
    setCrossStreet2('');
    setProvince('La Habana');
    setMunicipality('Marianao');
    setNeighborhood('Zamora');
    setGoogleMapsUrl('');

    setDeliveryMethodIds(['dm-mensajeria', 'dm-recogida']);
    setDeliveryAvailable(true);
    setPaymentMethodIds(['pm-efectivo', 'pm-transferencia']);
    setTransferAccepted(true);
    setTransferFeePercentage(10);

    setIsModalOpen(true);
  };

  const openEditModal = (store: Store) => {
    setEditingStore(store);
    setActiveTab('general');
    setName(store.name || '');
    setSlogan(store.slogan || '');
    const mainLogo = store.logoUrl || '';
    const initialImgs = store.images && store.images.length > 0 ? store.images : (mainLogo ? [mainLogo] : []);
    setLogoUrl(mainLogo);
    setImages(initialImgs);
    setNewImageUrl('');
    setWhatsappPhone(store.whatsappPhone || '');
    setUsdToCupRate(store.usdToCupRate || 335);
    setActive(store.active);

    const addr = store.address || ({} as StoreAddress);
    setStreet(addr.street || '');
    setNumber(addr.number || '');
    setBuilding(addr.building || '');
    setApartment(addr.apartment || '');
    setCrossStreet1(addr.crossStreet1 || '');
    setCrossStreet2(addr.crossStreet2 || '');

    const provName = addr.province || geoCatalog[0]?.name || '';
    const provObj =
      geoCatalog.find((p) => p.name === provName) || geoCatalog[0];
    const munName =
      addr.municipality || provObj?.municipalities[0]?.name || '';
    const munObj =
      provObj?.municipalities.find((m) => m.name === munName) ||
      provObj?.municipalities[0];
    const repName = addr.neighborhood || munObj?.repartos[0]?.name || '';

    setProvince(provName);
    setMunicipality(munName);
    setNeighborhood(repName);
    setGoogleMapsUrl(addr.googleMapsUrl || '');

    const defaultDeliv =
      store.deliveryMethodIds && store.deliveryMethodIds.length > 0
        ? store.deliveryMethodIds
        : store.deliveryAvailable !== false
        ? ['dm-mensajeria', 'dm-recogida']
        : ['dm-recogida'];
    setDeliveryMethodIds(defaultDeliv);
    setDeliveryAvailable(
      store.deliveryAvailable !== undefined
        ? store.deliveryAvailable
        : defaultDeliv.includes('dm-mensajeria')
    );

    const pay = store.paymentOptions || ({} as StorePaymentOptions);
    const defaultPay =
      store.paymentMethodIds && store.paymentMethodIds.length > 0
        ? store.paymentMethodIds
        : pay.transferAccepted !== false
        ? ['pm-efectivo', 'pm-transferencia']
        : ['pm-efectivo'];
    setPaymentMethodIds(defaultPay);
    setTransferAccepted(
      pay.transferAccepted !== undefined
        ? pay.transferAccepted
        : defaultPay.includes('pm-transferencia')
    );
    setTransferFeePercentage(pay.transferFeePercentage || 0);

    setIsModalOpen(true);
  };

  const handleUploadLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      onShowToast('Imagen muy grande', 'Tamaño máximo 3MB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setImages((prev) => [...prev, result]);
        if (!logoUrl) {
          setLogoUrl(result);
        }
        onShowToast('Imagen cargada', 'Se añadió el archivo a la galería de la tienda');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddImageUrl = () => {
    if (!newImageUrl.trim()) return;
    setImages((prev) => [...prev, newImageUrl.trim()]);
    if (!logoUrl) {
      setLogoUrl(newImageUrl.trim());
    }
    setNewImageUrl('');
    onShowToast('Imagen Agregada', 'Se añadió la URL a la galería de la tienda');
  };

  const handleRemoveImage = (imgToRemove: string) => {
    const updated = images.filter((i) => i !== imgToRemove);
    setImages(updated);
    if (logoUrl === imgToRemove) {
      setLogoUrl(updated[0] || '');
    }
  };

  const handleSetMainImage = (mainImg: string) => {
    setLogoUrl(mainImg);
    onShowToast('Logo Principal', 'Se estableció el logo / imagen principal de la tienda');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalName = name.trim() || 'TwinStore';
    const finalSlogan = slogan.trim() || '...más cerca de ti';
    const finalPhone = whatsappPhone.trim() || '+5354292049';
    const finalStreet = street.trim() || '122-A';
    const finalNumber = number.trim() || '3521 Altos';
    const finalBuilding = building.trim() || 'Corona';
    const finalApartment = apartment.trim() || '6';
    const finalCross1 = crossStreet1.trim() || '35';
    const finalCross2 = crossStreet2.trim() || '37';
    const finalProv = province.trim() || 'La Habana';
    const finalMun = municipality.trim() || 'Marianao';
    const finalRep = neighborhood.trim() || 'Zamora';
    const finalMapsUrl = googleMapsUrl.trim() || 'https://maps.app.goo.gl/AMR1nYyYXtXH2H6BA';

    const formattedLocation = `${finalRep ? `${finalRep}, ` : ''}${finalMun} - ${finalProv}`;

    const normalizedAddress: StoreAddress = {
      street: finalStreet,
      number: finalNumber,
      building: finalBuilding,
      apartment: finalApartment,
      crossStreet1: finalCross1,
      crossStreet2: finalCross2,
      neighborhood: finalRep,
      municipality: finalMun,
      province: finalProv,
      googleMapsUrl: finalMapsUrl,
    };

    const normalizedPayment: StorePaymentOptions = {
      transferAccepted,
      transferFeePercentage: transferAccepted ? Number(transferFeePercentage) || 10 : 0,
      acceptedCurrencies: ['USD', 'CUP'],
      notes: '',
    };

    const finalMainLogo = logoUrl || images[0] || '';
    const finalGallery = images.length > 0 ? images : (finalMainLogo ? [finalMainLogo] : []);

    if (editingStore) {
      onUpdateStore({
        ...editingStore,
        name: finalName,
        slogan: finalSlogan,
        logoUrl: finalMainLogo,
        images: finalGallery,
        description: finalSlogan,
        whatsappPhone: finalPhone,
        location: formattedLocation,
        address: normalizedAddress,
        usdToCupRate: Number(usdToCupRate) || 675,
        deliveryAvailable,
        paymentOptions: normalizedPayment,
        paymentMethodIds,
        deliveryMethodIds,
        badge: editingStore.badge || 'Verificada',
        active,
      });
      onShowToast('Tienda guardada', `Se actualizó "${finalName}"`);
    } else {
      onAddStore({
        name: finalName,
        slogan: finalSlogan,
        logoUrl: finalMainLogo,
        images: finalGallery,
        description: finalSlogan,
        whatsappPhone: finalPhone,
        location: formattedLocation,
        address: normalizedAddress,
        usdToCupRate: Number(usdToCupRate) || 675,
        deliveryAvailable,
        paymentOptions: normalizedPayment,
        paymentMethodIds,
        deliveryMethodIds,
        badge: 'Verificada',
        active,
        rating: 4.8,
      });
      onShowToast('Tienda agregada', `Se registró "${finalName}"`);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (store: Store) => {
    if (window.confirm(`¿Seguro que deseas eliminar "${store.name}"?`)) {
      onDeleteStore(store.id);
      onShowToast('Tienda eliminada', `"${store.name}" fue borrada`);
    }
  };

  const handleApplyBulkRate = () => {
    if (!bulkRateInput || bulkRateInput <= 0) {
      onShowToast('Tasa inválida', 'Ingresa un valor numérico válido', 'error');
      return;
    }
    if (onUpdateAllStoresRate) {
      onUpdateAllStoresRate(Number(bulkRateInput));
      onShowToast(
        'Tasa masiva actualizada',
        `Se asignó ${bulkRateInput} CUP/USD a todas las tiendas`
      );
    }
  };

  // Inline Location Combo handler for a row (Provincia, Municipio y Reparto)
  const handleInlineLocationChange = (
    store: Store,
    newProv: string,
    newMun: string,
    newRep?: string
  ) => {
    const provObj = geoCatalog.find((p) => p.name === newProv) || geoCatalog[0];
    const availableMuns = provObj?.municipalities || [];
    const validMun = availableMuns.some((m) => m.name === newMun)
      ? newMun
      : availableMuns[0]?.name || '';
    const munObj = availableMuns.find((m) => m.name === validMun);
    const availableReps = munObj?.repartos || [];
    const validRep =
      newRep !== undefined
        ? availableReps.some((r) => r.name === newRep)
          ? newRep
          : ''
        : store.address?.neighborhood || '';

    const currentAddr = store.address || ({} as StoreAddress);
    const updatedAddr: StoreAddress = {
      ...currentAddr,
      province: newProv,
      municipality: validMun,
      neighborhood: validRep,
    };
    const newLocation = validRep
      ? `${validRep}, ${validMun} - ${newProv}`
      : `${validMun} - ${newProv}`;

    onUpdateStore({
      ...store,
      province: newProv,
      municipality: validMun,
      reparto: validRep,
      location: newLocation,
      address: updatedAddr,
    });
    onShowToast('Ubicación actualizada', `"${store.name}" ahora está en ${newLocation}`);
  };

  const handleToggleStoreDeliveryMethod = (store: Store, methodId: string) => {
    const current =
      store.deliveryMethodIds && store.deliveryMethodIds.length > 0
        ? store.deliveryMethodIds
        : store.deliveryAvailable
        ? ['dm-mensajeria', 'dm-recogida']
        : ['dm-recogida'];
    const updated = current.includes(methodId)
      ? current.filter((id) => id !== methodId)
      : [...current, methodId];
    const hasCourier =
      updated.includes('dm-mensajeria') ||
      updated.some((id) => id.toLowerCase().includes('mensajeria'));
    onUpdateStore({
      ...store,
      deliveryMethodIds: updated,
      deliveryAvailable: hasCourier,
    });
  };

  const handleToggleStorePaymentMethod = (store: Store, methodId: string) => {
    const current =
      store.paymentMethodIds && store.paymentMethodIds.length > 0
        ? store.paymentMethodIds
        : store.paymentOptions?.transferAccepted
        ? ['pm-efectivo', 'pm-transferencia']
        : ['pm-efectivo'];
    const updated = current.includes(methodId)
      ? current.filter((id) => id !== methodId)
      : [...current, methodId];
    const hasTransfer =
      updated.includes('pm-transferencia') ||
      updated.some((id) => id.toLowerCase().includes('transfer'));
    const pay = store.paymentOptions || {
      acceptedCurrencies: ['USD', 'CUP'],
      transferFeePercentage: 10,
      transferAccepted: true,
    };
    onUpdateStore({
      ...store,
      paymentMethodIds: updated,
      paymentOptions: {
        ...pay,
        transferAccepted: hasTransfer,
      },
    });
  };

  const filteredStores = useMemo(() => {
    return stores.filter((store) => {
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      const addr = store.address;
      const locStr = addr
        ? `${addr.province || ''} ${addr.municipality || ''} ${addr.neighborhood || ''}`.toLowerCase()
        : store.location.toLowerCase();
      return (
        store.name.toLowerCase().includes(q) ||
        store.slogan?.toLowerCase().includes(q) ||
        locStr.includes(q)
      );
    });
  }, [stores, searchTerm]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredStores.length / ITEMS_PER_PAGE) || 1;
  const currentStores = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredStores.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredStores, currentPage]);

  const startItem = filteredStores.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, filteredStores.length);

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h3 className="text-xl font-extrabold text-gray-900">Tiendas y Proveedores</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Administra comercios, contactos, ubicación y tasas de cambio con edición en línea.
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva</span>
        </button>
      </div>

      {/* Bulk Rate Assignment Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-slate-700 font-bold">Asignación Masiva de Tasa:</span>
          <span className="text-slate-400 text-[11px] font-normal hidden sm:inline">
            (Aplica esta tasa en CUP por cada USD a todas las tiendas registradas)
          </span>
        </div>

        {/* Quick Bulk Rate Assign */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-slate-500 font-medium shrink-0">Tasa Global:</span>
          <input
            type="number"
            value={bulkRateInput}
            onChange={(e) => setBulkRateInput(Number(e.target.value))}
            className="w-20 px-2.5 py-1.5 rounded-xl border border-slate-300 font-bold text-center text-xs outline-none focus:border-indigo-500"
            placeholder="675"
          />
          <button
            onClick={handleApplyBulkRate}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all shrink-0 cursor-pointer"
          >
            Aplicar a todas
          </button>
        </div>
      </div>

      {/* Search / Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar tienda por nombre, eslogan o ubicación (provincia, municipio, reparto)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-emerald-500 outline-none"
          />
        </div>
        <span className="text-xs text-gray-500 font-semibold shrink-0">
          Mostrando {filteredStores.length} de {stores.length} tiendas
        </span>
      </div>

      {/* Tabular list of existing stores */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-600">
                <th className="py-3.5 px-4">Tienda</th>
                <th className="py-3.5 px-4">Ubicación</th>
                <th className="py-3.5 px-4">Tasa</th>
                <th className="py-3.5 px-4">Recogida y Entrega</th>
                <th className="py-3.5 px-4">Métodos de Pago</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {currentStores.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500 text-sm italic">
                    No se encontraron tiendas que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                currentStores.map((store) => {
                  const addr = store.address || ({} as StoreAddress);
                  const storeProv = addr.province || geoCatalog[0]?.name || '';
                  const provObj = geoCatalog.find((p) => p.name === storeProv) || geoCatalog[0];
                  const availableMuns = provObj?.municipalities || [];
                  const storeMun = addr.municipality || availableMuns[0]?.name || '';
                  const munObj = availableMuns.find((m) => m.name === storeMun);
                  const availableReps = munObj?.repartos || [];
                  const storeRep = addr.neighborhood || '';

                  const isTransferAccepted = !!store.paymentOptions?.transferAccepted;

                  return (
                    <tr key={store.id} className="hover:bg-gray-50/80 transition-colors">
                      {/* Nombre & Eslogan - Editable Text inputs */}
                      <td className="py-3 px-4 min-w-[220px]">
                        <div className="flex items-center gap-3">
                          <ThemeImage
                            src={getStoreLogoUrl(store, marketplaceConfig?.defaultStoreLogoUrl)}
                            alt={store.name}
                            fallbackType="store"
                            className="w-10 h-10 rounded-xl object-cover border border-gray-200 shrink-0 bg-white"
                          />
                          <div className="flex-1 space-y-1">
                            <input
                              type="text"
                              value={store.name}
                              onChange={(e) => onUpdateStore({ ...store, name: e.target.value })}
                              className="font-bold text-gray-900 bg-transparent hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-emerald-500 rounded-md px-2 py-0.5 border border-transparent focus:border-emerald-400 text-sm outline-none w-full transition-all"
                              title="Toca para editar el nombre"
                            />
                            <input
                              type="text"
                              value={store.slogan || ''}
                              onChange={(e) => onUpdateStore({ ...store, slogan: e.target.value, description: e.target.value })}
                              placeholder="Sin eslogan..."
                              className="text-xs text-emerald-700 font-medium italic bg-transparent hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-emerald-500 rounded-md px-2 py-0.5 border border-transparent focus:border-emerald-400 outline-none w-full transition-all"
                              title="Toca para editar el eslogan"
                            />
                          </div>
                        </div>
                      </td>

                      {/* Ubicación (Provincia, Municipio y Reparto Combo Dropdowns) */}
                      <td className="py-3 px-4 min-w-[220px]">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <select
                              value={storeProv}
                              onChange={(e) => handleInlineLocationChange(store, e.target.value, storeMun, storeRep)}
                              className="w-full px-2 py-1 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-800 focus:border-indigo-500 outline-none cursor-pointer"
                            >
                              {geoCatalog.map((p) => (
                                <option key={p.id} value={p.name}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="pl-5">
                            <select
                              value={storeMun}
                              onChange={(e) => handleInlineLocationChange(store, storeProv, e.target.value, storeRep)}
                              className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-700 focus:border-emerald-500 outline-none cursor-pointer"
                            >
                              {availableMuns.map((m) => (
                                <option key={m.id} value={m.name}>
                                  {m.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="pl-5">
                            <select
                              value={storeRep}
                              onChange={(e) => handleInlineLocationChange(store, storeProv, storeMun, e.target.value)}
                              className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-medium text-slate-600 focus:border-emerald-500 outline-none cursor-pointer"
                            >
                              <option value="">-- Reparto --</option>
                              {availableReps.map((r) => (
                                <option key={r.id} value={r.name}>
                                  {r.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </td>

                      {/* Tasa USD / CUP - Inline Numeric Input */}
                      <td className="py-3 px-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200">
                          <span className="text-xs font-bold text-emerald-900 shrink-0">1 USD =</span>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={store.usdToCupRate || 335}
                            onChange={(e) =>
                              onUpdateStore({
                                ...store,
                                usdToCupRate: Number(e.target.value) || 1,
                              })
                            }
                            className="w-16 px-1.5 py-0.5 rounded-lg border border-emerald-300 bg-white text-center font-black text-xs text-emerald-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                            title="Toca para cambiar tasa CUP"
                          />
                          <span className="text-xs font-bold text-emerald-900 shrink-0">CUP</span>
                        </div>
                      </td>

                      {/* Recogida y Entrega - Nomenclador Dinámico con Badges interactivos */}
                      <td className="py-3 px-4 min-w-[190px]">
                        <div className="flex flex-wrap gap-1.5 max-w-xs">
                          {deliveryMethodsCatalog.map((dm) => {
                            const storeDelivIds =
                              store.deliveryMethodIds && store.deliveryMethodIds.length > 0
                                ? store.deliveryMethodIds
                                : store.deliveryAvailable
                                ? ['dm-mensajeria', 'dm-recogida']
                                : ['dm-recogida'];
                            const isSelected = storeDelivIds.includes(dm.id);

                            return (
                              <button
                                key={dm.id}
                                type="button"
                                onClick={() => handleToggleStoreDeliveryMethod(store, dm.id)}
                                title={`${isSelected ? 'Desactivar' : 'Activar'} ${dm.name}: ${dm.description || ''}`}
                                className={`inline-flex items-center px-2 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100 shadow-2xs'
                                    : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100 opacity-60 hover:opacity-100'
                                }`}
                              >
                                <span className="truncate max-w-[110px]">{dm.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </td>

                      {/* Métodos de Pago - Nomenclador Dinámico con Badges interactivos */}
                      <td className="py-3 px-4 min-w-[210px]">
                        <div className="flex flex-wrap gap-1.5 max-w-xs">
                          {paymentMethodsCatalog.map((pm) => {
                            const storePayIds =
                              store.paymentMethodIds && store.paymentMethodIds.length > 0
                                ? store.paymentMethodIds
                                : store.paymentOptions?.transferAccepted
                                ? ['pm-efectivo', 'pm-transferencia']
                                : ['pm-efectivo'];
                            const isSelected = storePayIds.includes(pm.id);
                            const isTransfer =
                              pm.id === 'pm-transferencia' || pm.id.toLowerCase().includes('transfer');
                            const fee = store.paymentOptions?.transferFeePercentage || 0;

                            return (
                              <button
                                key={pm.id}
                                type="button"
                                onClick={() => handleToggleStorePaymentMethod(store, pm.id)}
                                title={`${isSelected ? 'Desactivar' : 'Activar'} ${pm.name}: ${pm.description || ''}`}
                                className={`inline-flex items-center px-2 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                                  isSelected
                                    ? isTransfer
                                      ? 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100 shadow-2xs'
                                      : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 shadow-2xs'
                                    : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100 opacity-60 hover:opacity-100'
                                }`}
                              >
                                <span className="truncate max-w-[100px]">{pm.name}</span>
                                {isSelected && isTransfer && fee > 0 && (
                                  <span className="text-[10px] font-mono text-purple-600">({fee}%)</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </td>

                      {/* Estado Activa / Inactiva - Toggle Switch Interruptor */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input
                              type="checkbox"
                              checked={store.active}
                              onChange={() =>
                                onUpdateStore({
                                  ...store,
                                  active: !store.active,
                                })
                              }
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                          </label>
                          <span
                            className={`text-xs font-bold ${
                              store.active ? 'text-emerald-800' : 'text-gray-500'
                            }`}
                          >
                            {store.active ? 'Activa' : 'Inactiva'}
                          </span>
                        </div>
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(store)}
                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-emerald-50 text-gray-600 hover:text-emerald-700 transition-colors cursor-pointer"
                            title="Editar en modal completo"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(store)}
                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-rose-50 text-gray-600 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Eliminar tienda"
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

        {/* Pagination Footer */}
        {filteredStores.length > 0 && (
          <div className="bg-gray-50/80 px-4 py-3.5 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold text-gray-600">
            <div>
              Mostrando <span className="font-bold text-gray-900">{startItem}</span> - <span className="font-bold text-gray-900">{endItem}</span> de <span className="font-bold text-gray-900">{filteredStores.length}</span> tiendas (Página <span className="font-bold text-emerald-700">{currentPage}</span> de {totalPages})
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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

      {/* Modal Editor */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="relative bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-gray-900">
                  {editingStore ? 'Editar Tienda' : 'Nueva Tienda'}
                </h3>
                <p className="text-xs text-gray-500">
                  Ficha pública y datos de contacto
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 bg-white px-6 gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('general')}
                className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
                  activeTab === 'general'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                1. General
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('address')}
                className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
                  activeTab === 'address'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                2. Dirección
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('payment')}
                className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
                  activeTab === 'payment'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                3. Pagos y Mensajería
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* TAB 1: GENERAL */}
              {activeTab === 'general' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                        Nombre
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="TwinStore"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                        Eslogan
                      </label>
                      <input
                        type="text"
                        value={slogan}
                        onChange={(e) => setSlogan(e.target.value)}
                        placeholder="...más cerca de ti"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Image Gallery Selection for Store */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <ImageGalleryUploader
                      images={images}
                      mainImage={logoUrl}
                      onImagesChange={(newImgs, newMain) => {
                        setImages(newImgs);
                        setLogoUrl(newMain);
                      }}
                      label="Fotos e Imágenes de la Tienda"
                      description="Sube una o varias fotos locales. La primera o la seleccionada con estrella se mostrará como principal."
                      fallbackType="store"
                    />
                  </div>

                  {/* WhatsApp Phone & Exchange rate */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                        WhatsApp
                      </label>
                      <input
                        type="text"
                        value={whatsappPhone}
                        onChange={(e) => setWhatsappPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-emerald-500 outline-none font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                        Tasa USD
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={usdToCupRate}
                        onChange={(e) => setUsdToCupRate(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-bold text-gray-900 focus:border-emerald-500 outline-none"
                        required
                      />
                    </div>
                  </div>

                  {/* Active Toggle */}
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={(e) => setActive(e.target.checked)}
                      id="activeStore"
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                    />
                    <label
                      htmlFor="activeStore"
                      className="text-sm font-semibold text-gray-700 cursor-pointer"
                    >
                      Tienda activa en el marketplace
                    </label>
                  </div>
                </div>
              )}

              {/* TAB 2: ADDRESS */}
              {activeTab === 'address' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                        Calle
                      </label>
                      <input
                        type="text"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        placeholder="122-A"
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                        Número
                      </label>
                      <input
                        type="text"
                        value={number}
                        onChange={(e) => setNumber(e.target.value)}
                        placeholder="3521 Altos"
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm focus:border-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                        Edificio
                      </label>
                      <input
                        type="text"
                        value={building}
                        onChange={(e) => setBuilding(e.target.value)}
                        placeholder="Corona"
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                        Apto / Piso
                      </label>
                      <input
                        type="text"
                        value={apartment}
                        onChange={(e) => setApartment(e.target.value)}
                        placeholder="6"
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm focus:border-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                        Entrecalle 1
                      </label>
                      <input
                        type="text"
                        value={crossStreet1}
                        onChange={(e) => setCrossStreet1(e.target.value)}
                        placeholder="35"
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                        Entrecalle 2
                      </label>
                      <input
                        type="text"
                        value={crossStreet2}
                        onChange={(e) => setCrossStreet2(e.target.value)}
                        placeholder="37"
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm focus:border-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Dependent Province, Municipality, Neighborhood selects */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                        Provincia
                      </label>
                      <SearchableSelect
                        options={geoCatalog.map((prov) => ({
                          value: prov.name,
                          label: prov.name,
                          sublabel: `${prov.municipalities?.length || 0} municipios`,
                        }))}
                        value={province}
                        onChange={(val) => handleProvinceChange(val || '')}
                        searchPlaceholder="Buscar provincia..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                        Municipio
                      </label>
                      <SearchableSelect
                        options={municipalitiesList.map((mun) => ({
                          value: mun.name,
                          label: mun.name,
                          sublabel: `${mun.repartos?.length || 0} repartos`,
                        }))}
                        value={municipality}
                        onChange={(val) => handleMunicipalityChange(val || '')}
                        searchPlaceholder="Buscar municipio..."
                        disabled={municipalitiesList.length === 0}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                        Reparto / Barrio
                      </label>
                      <SearchableSelect
                        options={[
                          { value: '', label: '-- Sin reparto / Barrio --' },
                          ...repartosList.map((rep) => ({
                            value: rep.name,
                            label: rep.name,
                          })),
                        ]}
                        value={neighborhood}
                        onChange={(val) => setNeighborhood(val || '')}
                        searchPlaceholder="Buscar reparto..."
                      />
                    </div>
                  </div>

                  {/* Google Maps URL */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                      Google Maps
                    </label>
                    <input
                      type="url"
                      value={googleMapsUrl}
                      onChange={(e) => setGoogleMapsUrl(e.target.value)}
                      placeholder="https://maps.app.goo.gl/AMR1nYyYXtXH2H6BA"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-emerald-500 outline-none font-mono text-xs"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: PAYMENTS & DELIVERY (NOMENCLADORES DINÁMICOS) */}
              {activeTab === 'payment' && (
                <div className="space-y-6">
                  {/* Recogida y Entrega - Nomenclador */}
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <Truck className="w-4 h-4 text-blue-600" />
                        <span>Métodos de Recogida y Entrega</span>
                      </h4>
                      <p className="text-xs text-gray-500">
                        Selecciona los tipos de entrega y recogida que ofrece esta tienda física u online.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {deliveryMethodsCatalog.map((dm) => {
                        const isChecked = deliveryMethodIds.includes(dm.id);

                        return (
                          <div
                            key={dm.id}
                            onClick={() => toggleDeliveryMethod(dm.id)}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                              isChecked
                                ? 'bg-blue-50/70 border-blue-300 shadow-xs'
                                : 'bg-gray-50/70 border-gray-200 hover:bg-gray-100/60'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div>
                                <h5 className="text-sm font-bold text-gray-900">{dm.name}</h5>
                                {dm.description && (
                                  <p className="text-[11px] text-gray-500 line-clamp-1">{dm.description}</p>
                                )}
                              </div>
                            </div>

                            <label className="relative inline-flex items-center cursor-pointer pointer-events-none">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Métodos de Pago - Nomenclador */}
                  <div className="space-y-3 pt-4 border-t border-gray-200/80">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-purple-600" />
                        <span>Métodos de Pago Aceptados</span>
                      </h4>
                      <p className="text-xs text-gray-500">
                        Configura las formas de pago que la tienda admite en sus ventas y pedidos.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {paymentMethodsCatalog.map((pm) => {
                        const isChecked = paymentMethodIds.includes(pm.id);

                        return (
                          <div
                            key={pm.id}
                            onClick={() => togglePaymentMethod(pm.id)}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                              isChecked
                                ? 'bg-purple-50/70 border-purple-300 shadow-xs'
                                : 'bg-gray-50/70 border-gray-200 hover:bg-gray-100/60'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div>
                                <h5 className="text-sm font-bold text-gray-900">{pm.name}</h5>
                                {pm.description && (
                                  <p className="text-[11px] text-gray-500 line-clamp-1">{pm.description}</p>
                                )}
                              </div>
                            </div>

                            <label className="relative inline-flex items-center cursor-pointer pointer-events-none">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                            </label>
                          </div>
                        );
                      })}
                    </div>

                    {/* Comisión por transferencia si aplica */}
                    {paymentMethodIds.some(
                      (id) => id === 'pm-transferencia' || id.toLowerCase().includes('transfer')
                    ) && (
                      <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3">
                        <div>
                          <label className="block text-xs font-bold uppercase text-purple-900 mb-0.5">
                            Recargo / Comisión por Transferencia (%)
                          </label>
                          <p className="text-xs text-purple-700">
                            Porcentaje adicional que aplica la tienda en pagos electrónicos (ej: EnZona, Transfermóvil).
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <input
                            type="number"
                            min="0"
                            max="50"
                            step="0.5"
                            value={transferFeePercentage}
                            onChange={(e) => setTransferFeePercentage(Number(e.target.value))}
                            className="w-20 px-3 py-2 rounded-xl border border-purple-300 bg-white text-center text-sm font-black text-purple-900 focus:border-purple-600 outline-none"
                          />
                          <span className="text-xs font-bold text-purple-900">%</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Bottom save bar */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md cursor-pointer inline-flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
