import React, { useState, useEffect, useMemo } from 'react';
import {
  Store,
  StoreAddress,
  StorePaymentOptions,
  MarketplaceConfig,
  PaymentMethodItem,
  DeliveryMethodItem,
  StoreExchangeRate,
  CurrencyItem,
  StoreFilterState,
  StoreCurrencyPaymentMethod,
  StoreRatePaymentMethod,
} from '../../types';
import { ThemeImage } from '../common/ThemeImage';
import {
  INITIAL_GEO_CATALOG,
  INITIAL_PAYMENT_METHODS_CATALOG,
  INITIAL_DELIVERY_METHODS_CATALOG,
  INITIAL_CURRENCIES_CATALOG,
  INITIAL_PAYMENT_PLATFORMS_CATALOG,
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
  Coins,
  ArrowRightLeft,
  DollarSign,
  Banknote,
  Layers,
  Sparkles,
  Globe,
  Store as StoreIcon,
} from 'lucide-react';
import { getStoreLogoUrl } from '../../lib/utils';
import { getStoreCurrencyPaymentMethods } from '../../lib/cartUtils';
import { ImageGalleryUploader } from '../common/ImageGalleryUploader';
import { SearchableSelect } from '../common/SearchableSelect';
import { SearchableMultiSelect } from '../common/SearchableMultiSelect';
import { StoreFilterBar } from '../PublicMarketplace/StoreFilterBar';

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
  const currenciesCatalog =
    marketplaceConfig?.currenciesCatalog && marketplaceConfig.currenciesCatalog.length > 0
      ? marketplaceConfig.currenciesCatalog
      : INITIAL_CURRENCIES_CATALOG;
  const paymentPlatformsCatalog =
    marketplaceConfig?.paymentPlatformsCatalog && marketplaceConfig.paymentPlatformsCatalog.length > 0
      ? marketplaceConfig.paymentPlatformsCatalog
      : INITIAL_PAYMENT_PLATFORMS_CATALOG;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'address' | 'delivery' | 'rates'>('general');

  const [storeFilters, setStoreFilters] = useState<StoreFilterState>(DEFAULT_STORE_FILTERS);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Form State - Currency & Exchange Rates
  const [baseCurrency, setBaseCurrency] = useState<string>('USD');
  const [secondaryCurrency, setSecondaryCurrency] = useState<string>('EUR');
  const [exchangeRates, setExchangeRates] = useState<StoreExchangeRate[]>([]);
  const [newRateFrom, setNewRateFrom] = useState<string>('USD');
  const [newRateTo, setNewRateTo] = useState<string>('EUR');
  const [newRateValue, setNewRateValue] = useState<number | ''>(0.92);

  // Form State - General
  const [name, setName] = useState('');
  const [slogan, setSlogan] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [usdToCupRate, setUsdToCupRate] = useState<number>(1);
  const [active, setActive] = useState(true);

  // Form State - Address
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [building, setBuilding] = useState('');
  const [apartment, setApartment] = useState('');
  const [crossStreet1, setCrossStreet1] = useState('');
  const [crossStreet2, setCrossStreet2] = useState('');
  const initialProv = marketplaceConfig?.geoCatalog?.[0]?.name || INITIAL_GEO_CATALOG?.[0]?.name || '';
  const initialMun = marketplaceConfig?.geoCatalog?.[0]?.municipalities?.[0]?.name || INITIAL_GEO_CATALOG?.[0]?.municipalities?.[0]?.name || '';
  const initialRep = marketplaceConfig?.geoCatalog?.[0]?.municipalities?.[0]?.repartos?.[0]?.name || INITIAL_GEO_CATALOG?.[0]?.municipalities?.[0]?.repartos?.[0]?.name || '';
  const [neighborhood, setNeighborhood] = useState(initialRep);
  const [municipality, setMunicipality] = useState(initialMun);
  const [province, setProvince] = useState(initialProv);
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');

  // Form State - Dynamic Delivery & Payment Nomenclators
  const [deliveryMethodIds, setDeliveryMethodIds] = useState<string[]>(['dm-mensajeria', 'dm-recogida']);
  const [paymentMethodIds, setPaymentMethodIds] = useState<string[]>(['pm-efectivo', 'pm-transferencia']);
  const [paymentPlatformIds, setPaymentPlatformIds] = useState<string[]>([
    'pp-banmet',
    'pp-zelle',
    'pp-paypal',
    'pp-clasica',
  ]);
  const [deliveryAvailable, setDeliveryAvailable] = useState(true);
  const [transferAccepted, setTransferAccepted] = useState(true);
  const [transferFeePercentage, setTransferFeePercentage] = useState<number>(10);

  // Form State - Relational Currency ↔ Payment Methods
  const [currencyPaymentMethods, setCurrencyPaymentMethods] = useState<StoreCurrencyPaymentMethod[]>([]);
  const [newCpmCurrency, setNewCpmCurrency] = useState<string>('USD');
  const [newCpmPaymentMethodId, setNewCpmPaymentMethodId] = useState<string>('pm-efectivo');
  const [newCpmNotes, setNewCpmNotes] = useState<string>('');

  // Form State - Relational Exchange Rate ↔ Accepted Payment Methods (con Gravamen)
  const [ratePaymentMethods, setRatePaymentMethods] = useState<StoreRatePaymentMethod[]>([]);
  const [newRpmExchangeRateId, setNewRpmExchangeRateId] = useState<string>('');
  const [newRpmPaymentMethodId, setNewRpmPaymentMethodId] = useState<string>('pm-efectivo');
  const [newRpmGravamen, setNewRpmGravamen] = useState<number>(0);
  const [newRpmNotes, setNewRpmNotes] = useState<string>('');
  const [rateAddForms, setRateAddForms] = useState<
    Record<string, { paymentMethodId: string; gravamen: number; notes: string }>
  >({});

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

  const handleAddCpm = () => {
    if (!newCpmCurrency || !newCpmPaymentMethodId) return;
    const exists = currencyPaymentMethods.some(
      (cpm) => cpm.currency === newCpmCurrency && cpm.paymentMethodId === newCpmPaymentMethodId
    );
    if (exists) {
      onShowToast('Relación ya existe', `Ya está configurado ${newCpmCurrency} con esta forma de pago`, 'info');
      return;
    }
    const newEntry: StoreCurrencyPaymentMethod = {
      id: `cpm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      storeId: editingStore?.id,
      currency: newCpmCurrency,
      paymentMethodId: newCpmPaymentMethodId,
      notes: newCpmNotes.trim() || undefined,
    };
    const updated = [...currencyPaymentMethods, newEntry];
    setCurrencyPaymentMethods(updated);
    setPaymentMethodIds((prev) => Array.from(new Set([...prev, newCpmPaymentMethodId])));
    setNewCpmNotes('');
    onShowToast('Vínculo agregado', `${newCpmCurrency} asociado con forma de pago`);
  };

  const handleRemoveCpm = (id: string) => {
    const updated = currencyPaymentMethods.filter((c) => c.id !== id);
    setCurrencyPaymentMethods(updated);
    const remainingPmIds = Array.from(new Set(updated.map((c) => c.paymentMethodId)));
    setPaymentMethodIds(remainingPmIds);
    setTransferAccepted(remainingPmIds.includes('pm-transferencia'));
  };

  const handleUpdateCpmNote = (id: string, notes: string) => {
    setCurrencyPaymentMethods((prev) =>
      prev.map((c) => (c.id === id ? { ...c, notes } : c))
    );
  };

  const handleApplyCashOnlyPreset = () => {
    const acceptedCurrs = exchangeRates.length > 0
      ? Array.from(new Set(exchangeRates.flatMap((r) => [r.fromCurrency, r.toCurrency])))
      : [baseCurrency || 'USD'];
    const preset: StoreCurrencyPaymentMethod[] = acceptedCurrs.map((curr) => ({
      id: `cpm-cash-${curr}-${Date.now()}`,
      currency: curr,
      paymentMethodId: 'pm-efectivo',
      notes: 'Solo pago en mano al recibir',
    }));
    setCurrencyPaymentMethods(preset);
    setPaymentMethodIds(['pm-efectivo']);
    setTransferAccepted(false);
    onShowToast('Solo Efectivo', 'Se configuró cobro en mano');
  };

  // Agregar tipo de pago directamente a una tasa específica desde la tabla
  const handleAddPaymentToRate = (rateId: string) => {
    const defaultPmId = paymentMethodsCatalog[0]?.id || 'pm-efectivo';
    const formData = rateAddForms[rateId] || {
      paymentMethodId: defaultPmId,
      gravamen: 0,
      notes: '',
    };
    if (!formData.paymentMethodId) {
      onShowToast('Selecciona forma de pago', 'Debes elegir qué forma de pago agregar', 'error');
      return;
    }
    const exists = ratePaymentMethods.some(
      (rpm) => rpm.exchangeRateId === rateId && rpm.paymentMethodId === formData.paymentMethodId
    );
    if (exists) {
      onShowToast(
        'Ya existe',
        'Esta forma de pago ya está agregada a esta tasa. Puedes editar su gravamen o notas en la tabla.',
        'info'
      );
      return;
    }
    const targetRate = exchangeRates.find((r) => r.id === rateId);
    const pm = paymentMethodsCatalog.find((p) => p.id === formData.paymentMethodId);
    const newEntry: StoreRatePaymentMethod = {
      id: `rpm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      storeId: editingStore?.id,
      exchangeRateId: rateId,
      paymentMethodId: formData.paymentMethodId,
      gravamen: Number(formData.gravamen) || 0,
      notes: formData.notes?.trim() || undefined,
    };
    setRatePaymentMethods((prev) => [...prev, newEntry]);
    setRateAddForms((prev) => ({
      ...prev,
      [rateId]: {
        ...formData,
        notes: '',
      },
    }));
    onShowToast(
      'Tipo de pago agregado',
      `${pm?.name || formData.paymentMethodId} vinculado a 1 ${targetRate?.fromCurrency} = ${targetRate?.rate} ${targetRate?.toCurrency} con ${formData.gravamen}% gravamen`
    );
  };

  // Handlers para la tabla relacional Tasa ↔ Tipos de Pago Aceptados (con Gravamen)
  const handleAddRatePaymentMethod = () => {
    const targetRateId = newRpmExchangeRateId || exchangeRates[0]?.id;
    if (!targetRateId) {
      onShowToast('Sin tasa seleccionada', 'Primero registra o selecciona una tasa de cambio', 'error');
      return;
    }
    if (!newRpmPaymentMethodId) {
      onShowToast('Selecciona forma de pago', 'Debes elegir qué forma de pago asociar', 'error');
      return;
    }
    const exists = ratePaymentMethods.some(
      (rpm) => rpm.exchangeRateId === targetRateId && rpm.paymentMethodId === newRpmPaymentMethodId
    );
    if (exists) {
      onShowToast('Relación ya existe', 'Esta forma de pago ya está asociada a esta tasa. Puedes editar su gravamen o notas.', 'info');
      return;
    }
    const targetRate = exchangeRates.find((r) => r.id === targetRateId);
    const newEntry: StoreRatePaymentMethod = {
      id: `rpm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      storeId: editingStore?.id,
      exchangeRateId: targetRateId,
      paymentMethodId: newRpmPaymentMethodId,
      gravamen: Number(newRpmGravamen) || 0,
      notes: newRpmNotes.trim() || undefined,
    };
    setRatePaymentMethods((prev) => [...prev, newEntry]);
    setNewRpmNotes('');
    onShowToast(
      'Tipo de pago asociado',
      `Asociado a ${targetRate ? `${targetRate.fromCurrency} → ${targetRate.toCurrency}` : 'tasa'} con ${newRpmGravamen}% gravamen`
    );
  };

  const handleRemoveRatePaymentMethod = (id: string) => {
    setRatePaymentMethods((prev) => prev.filter((rpm) => rpm.id !== id));
  };

  const handleUpdateRpmGravamen = (id: string, gravamen: number) => {
    setRatePaymentMethods((prev) =>
      prev.map((rpm) => (rpm.id === id ? { ...rpm, gravamen } : rpm))
    );
  };

  const handleUpdateRpmNotes = (id: string, notes: string) => {
    setRatePaymentMethods((prev) =>
      prev.map((rpm) => (rpm.id === id ? { ...rpm, notes } : rpm))
    );
  };

  const handleApplyDefaultRatePayments = () => {
    if (exchangeRates.length === 0) {
      onShowToast('Sin tasas', 'Primero crea al menos una tasa de cambio', 'info');
      return;
    }
    const newRpms: StoreRatePaymentMethod[] = [];
    exchangeRates.forEach((rate, idx) => {
      newRpms.push({
        id: `rpm-auto-${rate.id}-cash-${Date.now()}-${idx}`,
        storeId: editingStore?.id,
        exchangeRateId: rate.id,
        paymentMethodId: 'pm-efectivo',
        gravamen: 0,
        notes: 'Efectivo cero gravamen (0%)',
      });
      newRpms.push({
        id: `rpm-auto-${rate.id}-transf-${Date.now()}-${idx}`,
        storeId: editingStore?.id,
        exchangeRateId: rate.id,
        paymentMethodId: 'pm-transferencia',
        gravamen: 10,
        notes: 'Transferencia 10% de gravamen (+10%)',
      });
    });
    setRatePaymentMethods(newRpms);
    onShowToast(
      'Regla aplicada',
      'Efectivo 0% gravamen y Transferencia 10% gravamen configurados para todas las tasas'
    );
  };

  // Reset page on filter search
  useEffect(() => {
    setCurrentPage(1);
  }, [storeFilters]);

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
    const defaultStoreLogo = marketplaceConfig?.defaultStoreLogoUrl || 'local:store';
    setLogoUrl(defaultStoreLogo);
    setImages([]);
    setNewImageUrl('');
    setWhatsappPhone('');

    const defaultBase = marketplaceConfig?.baseCurrency || 'USD';
    const defaultSec = marketplaceConfig?.secondaryCurrency !== undefined ? marketplaceConfig.secondaryCurrency : 'EUR';
    const defaultRate = marketplaceConfig?.globalExchangeRate || 1;

    setBaseCurrency(defaultBase);
    setSecondaryCurrency(defaultSec);
    const defaultRateId = `rate-new-${defaultBase}-${defaultSec}`;
    if (defaultSec) {
      setExchangeRates([
        {
          id: defaultRateId,
          fromCurrency: defaultBase,
          toCurrency: defaultSec,
          rate: defaultRate,
        },
      ]);
      setRatePaymentMethods([
        {
          id: `rpm-new-cash-${Date.now()}`,
          exchangeRateId: defaultRateId,
          paymentMethodId: 'pm-efectivo',
          gravamen: 0,
          notes: 'Efectivo (0% gravamen)',
        },
        {
          id: `rpm-new-transf-${Date.now()}`,
          exchangeRateId: defaultRateId,
          paymentMethodId: 'pm-transferencia',
          gravamen: 10,
          notes: 'Transferencia (10% gravamen)',
        },
      ]);
      setNewRpmExchangeRateId(defaultRateId);
    } else {
      setExchangeRates([]);
      setRatePaymentMethods([]);
      setNewRpmExchangeRateId('');
    }
    setNewRpmPaymentMethodId('pm-efectivo');
    setNewRpmGravamen(0);
    setNewRpmNotes('');
    setNewRateFrom(defaultBase);
    setNewRateTo(defaultSec || 'EUR');
    setNewRateValue(defaultRate > 1 ? defaultRate : '');
    setUsdToCupRate(defaultRate);
    setActive(true);

    setStreet('');
    setNumber('');
    setBuilding('');
    setApartment('');
    setCrossStreet1('');
    setCrossStreet2('');
    const firstProv = geoCatalog?.[0];
    const firstMun = firstProv?.municipalities?.[0];
    const firstRep = firstMun?.repartos?.[0];
    setProvince(firstProv?.name || '');
    setMunicipality(firstMun?.name || '');
    setNeighborhood(firstRep?.name || '');
    setGoogleMapsUrl('');

    setDeliveryMethodIds(['dm-mensajeria', 'dm-recogida']);
    setDeliveryAvailable(true);
    setPaymentMethodIds(['pm-efectivo', 'pm-transferencia']);
    setPaymentPlatformIds(
      paymentPlatformsCatalog.length > 0
        ? paymentPlatformsCatalog.map((p) => p.id)
        : ['pp-banmet', 'pp-zelle', 'pp-paypal', 'pp-clasica']
    );
    setTransferAccepted(true);
    setTransferFeePercentage(10);
    setCurrencyPaymentMethods([]);
    setNewCpmCurrency(defaultBase);
    setNewCpmPaymentMethodId('pm-efectivo');
    setNewCpmNotes('');

    setIsModalOpen(true);
  };

  const openEditModal = (store: Store) => {
    setEditingStore(store);
    setActiveTab('general');
    setName(store.name || '');
    setSlogan(store.slogan || '');
    const defaultStoreLogo = marketplaceConfig?.defaultStoreLogoUrl || 'local:store';
    const mainLogo = store.logoUrl || defaultStoreLogo;
    const initialImgs = store.images && store.images.length > 0 ? store.images : (mainLogo ? [mainLogo] : []);
    setLogoUrl(mainLogo);
    setImages(initialImgs);
    setNewImageUrl('');
    setWhatsappPhone(store.whatsappPhone || '');
    setUsdToCupRate(store.usdToCupRate || 1);
    setActive(store.active);

    const sBase = store.baseCurrency || 'USD';
    const sSec = store.secondaryCurrency !== undefined ? store.secondaryCurrency : (sBase === 'USD' ? 'EUR' : '');
    setBaseCurrency(sBase);
    setSecondaryCurrency(sSec);

    let ratesList = store.exchangeRates ? [...store.exchangeRates] : [];
    if (sSec && !ratesList.some((r) => r.fromCurrency === sBase && r.toCurrency === sSec)) {
      ratesList.push({
        id: `rate-${store.id}-${sBase}-${sSec}`,
        fromCurrency: sBase,
        toCurrency: sSec,
        rate: store.usdToCupRate || 1,
      });
    }
    setExchangeRates(ratesList);
    setNewRateFrom(sBase);
    setNewRateTo(sSec || 'EUR');
    setNewRateValue(store.usdToCupRate || 1);

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
    setPaymentPlatformIds(
      store.paymentPlatformIds && store.paymentPlatformIds.length > 0
        ? store.paymentPlatformIds
        : paymentPlatformsCatalog.length > 0
        ? paymentPlatformsCatalog.map((p) => p.id)
        : ['pp-banmet', 'pp-zelle', 'pp-paypal', 'pp-clasica']
    );
    setTransferAccepted(
      pay.transferAccepted !== undefined
        ? pay.transferAccepted
        : defaultPay.includes('pm-transferencia')
    );
    setTransferFeePercentage(pay.transferFeePercentage || 0);

    const storeCpms = getStoreCurrencyPaymentMethods(store);
    setCurrencyPaymentMethods(storeCpms);
    setNewCpmCurrency(store.baseCurrency || 'USD');
    setNewCpmPaymentMethodId(defaultPay[0] || 'pm-efectivo');
    setNewCpmNotes('');

    // Cargar o inicializar relación de tipos de pagos aceptados por tasa (con gravamen)
    let initialRpms = store.ratePaymentMethods ? [...store.ratePaymentMethods] : [];
    if (initialRpms.length === 0 && ratesList.length > 0) {
      ratesList.forEach((r, idx) => {
        initialRpms.push({
          id: `rpm-init-${r.id}-cash-${idx}`,
          storeId: store.id,
          exchangeRateId: r.id,
          paymentMethodId: 'pm-efectivo',
          gravamen: 0,
          notes: 'Efectivo cero gravamen (0%)',
        });
        initialRpms.push({
          id: `rpm-init-${r.id}-transf-${idx}`,
          storeId: store.id,
          exchangeRateId: r.id,
          paymentMethodId: 'pm-transferencia',
          gravamen: store.paymentOptions?.transferFeePercentage ?? 10,
          notes: `Transferencia (+${store.paymentOptions?.transferFeePercentage ?? 10}% gravamen)`,
        });
      });
    }
    setRatePaymentMethods(initialRpms);
    setNewRpmExchangeRateId(ratesList[0]?.id || '');
    setNewRpmPaymentMethodId('pm-efectivo');
    setNewRpmGravamen(0);
    setNewRpmNotes('');

    setIsModalOpen(true);
  };

  const handleFetchFromGlobalConfig = () => {
    if (!newRateFrom || !newRateTo) {
      onShowToast('Selecciona monedas', 'Selecciona primero las dos monedas', 'info');
      return;
    }
    if (newRateFrom === newRateTo) {
      setNewRateValue(1);
      onShowToast('Misma moneda', `La tasa de cambio entre ${newRateFrom} y ${newRateTo} es 1`, 'info');
      return;
    }

    const globalList = marketplaceConfig?.globalExchangeRates || [];
    // 1. Coincidencia directa en globalExchangeRates
    const direct = globalList.find(
      (r) => r.fromCurrency === newRateFrom && r.toCurrency === newRateTo
    );
    if (direct && direct.rate > 0) {
      setNewRateValue(direct.rate);
      onShowToast(
        'Tasa global obtenida',
        `1 ${newRateFrom} = ${direct.rate} ${newRateTo} (tomada de la configuración global)`
      );
      return;
    }

    // 2. Coincidencia inversa en globalExchangeRates
    const inverse = globalList.find(
      (r) => r.fromCurrency === newRateTo && r.toCurrency === newRateFrom
    );
    if (inverse && inverse.rate > 0) {
      const invVal = Number((1 / inverse.rate).toFixed(6));
      setNewRateValue(invVal);
      onShowToast(
        'Tasa global calculada (inversa)',
        `1 ${newRateFrom} = ${invVal} ${newRateTo} (inversa de 1 ${newRateTo} = ${inverse.rate} ${newRateFrom})`
      );
      return;
    }

    // 3. Coincidencia con tasa base / secundaria del marketplace
    const base = marketplaceConfig?.baseCurrency || 'USD';
    const sec = marketplaceConfig?.secondaryCurrency;
    const gRate = marketplaceConfig?.globalExchangeRate;

    if (gRate && gRate > 0) {
      if (newRateFrom === base && newRateTo === sec) {
        setNewRateValue(gRate);
        onShowToast(
          'Tasa global obtenida',
          `1 ${newRateFrom} = ${gRate} ${newRateTo} (tasa base del marketplace)`
        );
        return;
      }
      if (sec && newRateFrom === sec && newRateTo === base) {
        const invVal = Number((1 / gRate).toFixed(6));
        setNewRateValue(invVal);
        onShowToast(
          'Tasa global calculada (inversa)',
          `1 ${newRateFrom} = ${invVal} ${newRateTo} (inversa de la tasa base global)`
        );
        return;
      }
    }

    onShowToast(
      'Sin tasa global',
      `No se encontró una tasa global configurada para ${newRateFrom} → ${newRateTo}`,
      'info'
    );
  };

  const handleAddStoreRate = () => {
    if (!newRateFrom || !newRateTo || !newRateValue || Number(newRateValue) <= 0) {
      onShowToast('Datos incompletos', 'Selecciona las dos monedas e indica una tasa mayor a 0', 'error');
      return;
    }
    if (newRateFrom === newRateTo) {
      onShowToast('Monedas iguales', 'La moneda origen y destino deben ser distintas', 'error');
      return;
    }
    const val = Number(newRateValue);
    const existingIndex = exchangeRates.findIndex(
      (r) => r.fromCurrency === newRateFrom && r.toCurrency === newRateTo
    );
    if (existingIndex >= 0) {
      const updated = [...exchangeRates];
      updated[existingIndex].rate = val;
      setExchangeRates(updated);
      onShowToast('Tasa actualizada', `1 ${newRateFrom} = ${val} ${newRateTo}`);
    } else {
      const newRateId = `rate-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const newRateItem: StoreExchangeRate = {
        id: newRateId,
        storeId: editingStore?.id,
        fromCurrency: newRateFrom,
        toCurrency: newRateTo,
        rate: val,
      };
      setExchangeRates([...exchangeRates, newRateItem]);
      onShowToast(
        'Tasa agregada',
        `1 ${newRateFrom} = ${val} ${newRateTo}. Lista abajo en la tabla para agregar tipos de pago y gravámenes.`
      );
    }
  };

  const handleRemoveStoreRate = (rateId: string) => {
    setExchangeRates((prev) => prev.filter((r) => r.id !== rateId));
    setRatePaymentMethods((prev) => prev.filter((rpm) => rpm.exchangeRateId !== rateId));
    if (newRpmExchangeRateId === rateId) {
      const remaining = exchangeRates.filter((r) => r.id !== rateId);
      setNewRpmExchangeRateId(remaining[0]?.id || '');
    }
  };

  const handleUpdateStoreRate = (rateId: string, newRate: number) => {
    setExchangeRates((prev) =>
      prev.map((r) => (r.id === rateId ? { ...r, rate: newRate } : r))
    );
  };

  const handleImportMarketplaceRates = () => {
    const globalRates = marketplaceConfig?.globalExchangeRates || [];
    if (globalRates.length === 0) {
      onShowToast(
        'Sin tasas globales',
        'El marketplace no tiene tasas globales configuradas en la Configuración General',
        'info'
      );
      return;
    }
    let updatedCount = 0;
    const updated = [...exchangeRates];
    for (const gr of globalRates) {
      const existingIdx = updated.findIndex(
        (r) => r.fromCurrency === gr.fromCurrency && r.toCurrency === gr.toCurrency
      );
      if (existingIdx === -1) {
        updated.push({
          id: `rate-${editingStore?.id || 'new'}-${gr.fromCurrency}-${gr.toCurrency}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          storeId: editingStore?.id,
          fromCurrency: gr.fromCurrency,
          toCurrency: gr.toCurrency,
          rate: gr.rate,
        });
        updatedCount++;
      } else {
        if (updated[existingIdx].rate !== gr.rate) {
          updated[existingIdx].rate = gr.rate;
          updatedCount++;
        }
      }
    }
    setExchangeRates(updated);
    if (updatedCount > 0) {
      onShowToast('Tasas actualizadas', `Se copiaron/actualizaron ${updatedCount} tasas globales en esta tienda`);
    } else {
      onShowToast('Tasas al día', 'Esta tienda ya tiene los mismos valores que las tasas globales del marketplace', 'info');
    }
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

    const finalName = name.trim() || 'Nueva Tienda';
    const finalSlogan = slogan.trim();
    const finalPhone = whatsappPhone.trim();
    const finalStreet = street.trim();
    const finalNumber = number.trim();
    const finalBuilding = building.trim();
    const finalApartment = apartment.trim();
    const finalCross1 = crossStreet1.trim();
    const finalCross2 = crossStreet2.trim();
    const finalProv = province.trim() || geoCatalog[0]?.name || '';
    const finalMun = municipality.trim() || geoCatalog[0]?.municipalities[0]?.name || '';
    const finalRep = neighborhood.trim() || geoCatalog[0]?.municipalities[0]?.repartos[0]?.name || '';
    const finalMapsUrl = googleMapsUrl.trim();

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

    const derivedPaymentMethodIds = Array.from(
      new Set(currencyPaymentMethods.map((cpm) => cpm.paymentMethodId))
    );
    const finalPaymentMethodIds =
      derivedPaymentMethodIds.length > 0 ? derivedPaymentMethodIds : paymentMethodIds;
    const hasTransferInCpms = finalPaymentMethodIds.some(
      (id) => id === 'pm-transferencia' || id.toLowerCase().includes('transfer')
    );
    const acceptedCurrenciesList = Array.from(
      new Set([
        ...currencyPaymentMethods.map((cpm) => cpm.currency),
        baseCurrency || 'USD',
        secondaryCurrency || 'EUR',
      ])
    ).filter(Boolean);

    const normalizedPayment: StorePaymentOptions = {
      transferAccepted: hasTransferInCpms,
      transferFeePercentage: hasTransferInCpms ? Number(transferFeePercentage) || 10 : 0,
      acceptedCurrencies: acceptedCurrenciesList,
      notes: '',
    };

    const defaultStoreLogo = marketplaceConfig?.defaultStoreLogoUrl || 'local:store';
    const finalMainLogo =
      (logoUrl && logoUrl.trim() !== '')
        ? logoUrl.trim()
        : images[0] || defaultStoreLogo;
    const finalGallery = images.length > 0 ? images : [finalMainLogo];

    const finalRates = [...exchangeRates];
    const primaryRateItem = finalRates.find(
      (r) => r.fromCurrency === (baseCurrency || 'USD') && r.toCurrency === secondaryCurrency
    ) || finalRates[0];
    const primaryRateNum = primaryRateItem ? primaryRateItem.rate : (Number(usdToCupRate) || 1);

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
        baseCurrency: baseCurrency || 'USD',
        secondaryCurrency: secondaryCurrency || undefined,
        exchangeRates: finalRates,
        usdToCupRate: primaryRateNum,
        deliveryAvailable,
        paymentOptions: normalizedPayment,
        paymentMethodIds: finalPaymentMethodIds,
        paymentPlatformIds: paymentPlatformIds,
        deliveryMethodIds,
        currencyPaymentMethods,
        ratePaymentMethods,
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
        baseCurrency,
        secondaryCurrency: secondaryCurrency || undefined,
        exchangeRates: finalRates,
        usdToCupRate: primaryRateNum,
        deliveryAvailable,
        paymentOptions: normalizedPayment,
        paymentMethodIds: finalPaymentMethodIds,
        paymentPlatformIds: paymentPlatformIds,
        deliveryMethodIds,
        currencyPaymentMethods,
        ratePaymentMethods,
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
      acceptedCurrencies: [store.baseCurrency || 'USD', store.secondaryCurrency || 'EUR'].filter(Boolean),
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
    return stores.filter((s) => {
      if (storeFilters.searchQuery?.trim()) {
        const q = storeFilters.searchQuery.toLowerCase().trim();
        const matchesName = s.name.toLowerCase().includes(q);
        const matchesSlogan = (s.slogan || '').toLowerCase().includes(q);
        const matchesDesc = (s.description || '').toLowerCase().includes(q);
        const matchesLoc = (s.location || '').toLowerCase().includes(q);
        const addr = s.address;
        const locStr = addr
          ? `${addr.province || ''} ${addr.municipality || ''} ${addr.neighborhood || ''}`.toLowerCase()
          : '';
        if (!matchesName && !matchesSlogan && !matchesDesc && !matchesLoc && !locStr.includes(q)) {
          return false;
        }
      }

      const sProv = s.address?.province || (s as any).province || '';
      const sMun = s.address?.municipality || (s as any).municipality || '';
      const sRep = s.address?.neighborhood || (s as any).reparto || '';

      if (storeFilters.provinces && storeFilters.provinces.length > 0) {
        if (!storeFilters.provinces.includes(sProv)) return false;
      }
      if (storeFilters.municipalities && storeFilters.municipalities.length > 0) {
        if (!storeFilters.municipalities.includes(sMun)) return false;
      }
      if (storeFilters.repartos && storeFilters.repartos.length > 0) {
        if (!storeFilters.repartos.includes(sRep)) return false;
      }

      if (storeFilters.deliveryMethods && storeFilters.deliveryMethods.length > 0) {
        const storeDelivIds: string[] =
          s.deliveryMethodIds && s.deliveryMethodIds.length > 0
            ? s.deliveryMethodIds
            : s.deliveryAvailable
            ? ['dm-mensajeria', 'dm-recogida']
            : ['dm-recogida'];
        const matchesDeliv = storeFilters.deliveryMethods.some((id) =>
          storeDelivIds.includes(id)
        );
        if (!matchesDeliv) return false;
      } else if (storeFilters.deliveryOnly && !s.deliveryAvailable) {
        return false;
      }

      if (storeFilters.paymentMethods && storeFilters.paymentMethods.length > 0) {
        const storePayIds: string[] =
          s.paymentMethodIds && s.paymentMethodIds.length > 0
            ? s.paymentMethodIds
            : s.paymentOptions?.transferAccepted
            ? ['pm-efectivo', 'pm-transferencia']
            : ['pm-efectivo'];
        const matchesPay = storeFilters.paymentMethods.some((id) =>
          storePayIds.includes(id)
        );
        if (!matchesPay) return false;
      } else if (storeFilters.transferOnly && !s.paymentOptions?.transferAccepted) {
        return false;
      }

      return true;
    });
  }, [stores, storeFilters]);

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

      {/* Filter Bar (Same filter system as Public Marketplace User View) */}
      <StoreFilterBar
        geoCatalog={geoCatalog}
        paymentMethodsCatalog={paymentMethodsCatalog}
        deliveryMethodsCatalog={deliveryMethodsCatalog}
        filters={storeFilters}
        onFilterChange={setStoreFilters}
        onReset={() => setStoreFilters(DEFAULT_STORE_FILTERS)}
        totalResults={filteredStores.length}
        isExpanded={isFilterExpanded}
        onToggleExpanded={() => setIsFilterExpanded((prev) => !prev)}
      />

      {/* Tabular list of existing stores */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-600">
                <th className="py-3.5 px-4">Tienda</th>
                <th className="py-3.5 px-4">Ubicación</th>
                <th className="py-3.5 px-4">Moneda y Tasas</th>
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
                          <div>
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

                      {/* Monedas y Tasas de Cambio */}
                      <td className="py-3 px-4 min-w-[170px]">
                        <div className="space-y-1.5">
                          {store.exchangeRates && store.exchangeRates.length > 0 ? (
                            <div className="space-y-1">
                              {store.exchangeRates.map((r, idx) => (
                                <div
                                  key={r.id || idx}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs"
                                >
                                  <span className="font-mono font-bold text-emerald-950">
                                    1 {r.fromCurrency} =
                                  </span>
                                  <input
                                    type="number"
                                    min="0.0001"
                                    step="any"
                                    value={r.rate}
                                    onChange={(e) => {
                                      const newRateVal = Number(e.target.value) || 1;
                                      const updatedRates = (store.exchangeRates || []).map((existing) =>
                                        existing.id === r.id ? { ...existing, rate: newRateVal } : existing
                                      );
                                      onUpdateStore({
                                        ...store,
                                        exchangeRates: updatedRates,
                                        usdToCupRate: idx === 0 ? newRateVal : store.usdToCupRate,
                                      });
                                    }}
                                    className="w-14 px-1 py-0.5 rounded border border-emerald-300 bg-white text-center font-black text-xs text-emerald-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                                    title="Modificar tasa para esta tienda"
                                  />
                                  <span className="font-mono font-bold text-emerald-800">
                                    {r.toCurrency}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[11px] text-slate-500 italic">
                                {store.acceptedCurrencies && store.acceptedCurrencies.length > 0
                                  ? store.acceptedCurrencies.join(', ')
                                  : 'Sin tasas configuradas'}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Recogida y Entrega - Combobox MultiSelect como en filtros */}
                      <td className="py-3 px-4 min-w-[210px]">
                        <SearchableMultiSelect
                          options={deliveryMethodsCatalog.map((dm) => ({
                            value: dm.id,
                            label: dm.name,
                            sublabel: dm.description,
                          }))}
                          values={
                            store.deliveryMethodIds && store.deliveryMethodIds.length > 0
                              ? store.deliveryMethodIds
                              : store.deliveryAvailable
                              ? ['dm-mensajeria', 'dm-recogida']
                              : ['dm-recogida']
                          }
                          onChange={(newIds) => {
                            const hasDelivery =
                              newIds.includes('dm-mensajeria') ||
                              newIds.some((id) => id.toLowerCase().includes('delivery') || id.toLowerCase().includes('mensajer'));
                            onUpdateStore({
                              ...store,
                              deliveryMethodIds: newIds,
                              deliveryAvailable: hasDelivery,
                            });
                          }}
                          placeholder="Métodos de entrega..."
                          allLabel="Todos activos"
                          size="sm"
                        />
                      </td>

                      {/* Métodos de Pago - Combobox MultiSelect como en filtros */}
                      <td className="py-3 px-4 min-w-[220px]">
                        <SearchableMultiSelect
                          options={paymentMethodsCatalog.map((pm) => ({
                            value: pm.id,
                            label: pm.name,
                            sublabel: pm.description,
                          }))}
                          values={
                            store.paymentMethodIds && store.paymentMethodIds.length > 0
                              ? store.paymentMethodIds
                              : store.paymentOptions?.transferAccepted
                              ? ['pm-efectivo', 'pm-transferencia']
                              : ['pm-efectivo']
                          }
                          onChange={(newIds) => {
                            const hasTransfer =
                              newIds.includes('pm-transferencia') ||
                              newIds.some((id) => id.toLowerCase().includes('transfer'));
                            const pay = store.paymentOptions || {
                              acceptedCurrencies: [store.baseCurrency || 'USD', store.secondaryCurrency || 'EUR'].filter(Boolean),
                              transferFeePercentage: 10,
                              transferAccepted: true,
                            };
                            onUpdateStore({
                              ...store,
                              paymentMethodIds: newIds,
                              paymentOptions: {
                                ...pay,
                                transferAccepted: hasTransfer,
                              },
                            });
                          }}
                          placeholder="Métodos de pago..."
                          allLabel="Todos activos"
                          size="sm"
                        />

                        {/* Relación Moneda ↔ Pago configurada */}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {getStoreCurrencyPaymentMethods(store).map((cpm) => {
                            const pm = paymentMethodsCatalog.find((p) => p.id === cpm.paymentMethodId);
                            const isCash = cpm.paymentMethodId.toLowerCase().includes('efectivo');
                            return (
                              <span
                                key={cpm.id || `${cpm.currency}-${cpm.paymentMethodId}`}
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                                  isCash
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-purple-50 text-purple-800 border-purple-200'
                                }`}
                                title={`${cpm.currency}: ${pm?.name || cpm.paymentMethodId}${cpm.notes ? ` (${cpm.notes})` : ''}`}
                              >
                                <span className="font-extrabold">{cpm.currency}:</span>
                                <span>{pm?.name || cpm.paymentMethodId}</span>
                              </span>
                            );
                          })}
                        </div>

                        {/* Plataformas de Pago Aceptadas */}
                        {store.paymentPlatformIds && store.paymentPlatformIds.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {store.paymentPlatformIds.map((ppId) => {
                              const pp = paymentPlatformsCatalog.find((p) => p.id === ppId);
                              return (
                                <span
                                  key={ppId}
                                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"
                                  title={`Plataforma: ${pp?.name || ppId}`}
                                >
                                  {pp?.name || ppId}
                                </span>
                              );
                            })}
                          </div>
                        )}
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
            <div className="flex flex-wrap items-center border-b border-gray-200 bg-white px-6 py-2.5 gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('general')}
                className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'general'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                <StoreIcon className="w-4 h-4" />
                <span>General</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('address')}
                className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'address'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span>Dirección</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('delivery')}
                className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'delivery'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>Recogida y Plataformas</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('rates')}
                className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'rates'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                <Coins className="w-4 h-4" />
                <span>Monedas, Pagos y Tasas</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* TAB 1: GENERAL */}
              {activeTab === 'general' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
                    <StoreIcon className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-sm font-bold text-gray-900">Identidad y Datos Principales</h4>
                  </div>
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

                  {/* WhatsApp Phone & Estado */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                        WhatsApp de Contacto
                      </label>
                      <input
                        type="text"
                        value={whatsappPhone}
                        onChange={(e) => setWhatsappPhone(e.target.value)}
                        placeholder="+53 52000000"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-emerald-500 outline-none font-mono"
                        required
                      />
                    </div>

                    <div className="pt-4">
                      <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50/70 hover:bg-gray-100/60 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={(e) => setActive(e.target.checked)}
                          id="activeStore"
                          className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                        />
                        <div>
                          <span className="text-sm font-bold text-gray-900 block">Tienda Activa</span>
                          <span className="text-[11px] text-gray-500">Visible en el catálogo público</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ADDRESS */}
              {activeTab === 'address' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-sm font-bold text-gray-900">Ubicación Geográfica y Dirección</h4>
                  </div>
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

              {/* TAB 3: RECOGIDA Y ENTREGA */}
              {activeTab === 'delivery' && (
                <div className="space-y-6">
                  {/* Recogida y Entrega - Nomenclador */}
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <Truck className="w-4 h-4 text-emerald-600" />
                        <span>Métodos de Recogida y Entrega</span>
                      </h4>
                      <p className="text-xs text-gray-500">
                        Selecciona los tipos de entrega y recogida que ofrece esta tienda a sus clientes.
                      </p>
                    </div>

                    <SearchableMultiSelect
                      options={deliveryMethodsCatalog.map((dm) => ({
                        value: dm.id,
                        label: dm.name,
                        sublabel: dm.description,
                      }))}
                      values={deliveryMethodIds}
                      onChange={(newIds) => setDeliveryMethodIds(newIds)}
                      placeholder="Seleccionar métodos de recogida y entrega..."
                      allLabel="Todos los métodos activos"
                    />
                  </div>

                  {/* Plataformas de Pago Aceptadas - Nomenclador */}
                  <div className="space-y-3 pt-4 border-t border-gray-200">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-emerald-600" />
                        <span>Plataformas de Pago Aceptadas</span>
                      </h4>
                      <p className="text-xs text-gray-500">
                        Selecciona desde cuáles entidades bancarias, pasarelas o plataformas acepta pagos esta tienda (ej. Banco Metropolitano, Zelle, PayPal, Tarjeta Clásica).
                      </p>
                    </div>

                    <SearchableMultiSelect
                      options={paymentPlatformsCatalog.map((pp) => ({
                        value: pp.id,
                        label: pp.name,
                        sublabel: pp.description,
                      }))}
                      values={paymentPlatformIds}
                      onChange={(newIds) => setPaymentPlatformIds(newIds)}
                      placeholder="Seleccionar plataformas de pago..."
                      allLabel="Todas las plataformas aceptadas"
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: STORE EXCHANGE RATES AND PAYMENT METHODS WITH GRAVAMEN */}
              {activeTab === 'rates' && (
                <div className="space-y-6">
                  {/* Encabezado */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <Coins className="w-4 h-4 text-emerald-600" />
                        <span>Monedas, Pagos y Tasas de la Tienda</span>
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Agrega las tasas de cambio de la tienda y vincula a cada una los tipos de pago aceptados con sus respectivos gravámenes.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleImportMarketplaceRates}
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-2xs"
                      title="Copiar todas las tasas globales configuradas en el marketplace"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>Copiar Todas las Tasas Globales</span>
                    </button>
                  </div>

                  {/* FORMULARIO: DOS SELECTORES DE MONEDAS, UNA CAJA DE TEXTO Y DOS BOTONES */}
                  <div className="bg-slate-50/90 p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Plus className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Definir Tasa de Cambio</span>
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        1 {newRateFrom} = {newRateValue !== '' ? newRateValue : '?'} {newRateTo}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                      {/* 1er Selector de Moneda */}
                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          1ª Moneda (Origen)
                        </label>
                        <select
                          value={newRateFrom}
                          onChange={(e) => setNewRateFrom(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-900 outline-none focus:border-emerald-500 shadow-2xs"
                        >
                          {currenciesCatalog
                            .filter((c) => c.active !== false)
                            .map((c) => (
                              <option key={c.id} value={c.code}>
                                {c.code} - {c.name} ({c.symbol})
                              </option>
                            ))}
                        </select>
                      </div>

                      {/* 2do Selector de Moneda */}
                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          2ª Moneda (Destino)
                        </label>
                        <select
                          value={newRateTo}
                          onChange={(e) => setNewRateTo(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-900 outline-none focus:border-emerald-500 shadow-2xs"
                        >
                          {currenciesCatalog
                            .filter((c) => c.active !== false && c.code !== newRateFrom)
                            .map((c) => (
                              <option key={c.id} value={c.code}>
                                {c.code} - {c.name} ({c.symbol})
                              </option>
                            ))}
                        </select>
                      </div>

                      {/* Caja de texto para la tasa */}
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Tasa
                        </label>
                        <input
                          type="number"
                          min="0.000001"
                          step="any"
                          value={newRateValue}
                          onChange={(e) =>
                            setNewRateValue(e.target.value === '' ? '' : Number(e.target.value))
                          }
                          placeholder="ej. 530"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold font-mono text-slate-900 outline-none focus:border-emerald-500 shadow-2xs"
                        />
                      </div>

                      {/* Dos botones: Adicionar Tasa y Tomar de la Configuración Global */}
                      <div className="sm:col-span-4 flex flex-col sm:flex-row gap-2">
                        <button
                          type="button"
                          onClick={handleAddStoreRate}
                          className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
                          title="Añadir esta tasa a la tabla inferior"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Adicionar Tasa</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleFetchFromGlobalConfig}
                          className="flex-1 py-2 px-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs shrink-0 text-center"
                          title="Obtener la tasa configurada globalmente para este par de monedas"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>Tomar de Global</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* TABLA DE TASAS QUE LAS LISTA ABAJO Y PERMITE AGREGAR TIPOS DE PAGO CON GRAVAMEN */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                        <Layers className="w-4 h-4 text-emerald-600" />
                        <span>Tabla de Tasas y Tipos de Pago Aceptados ({exchangeRates.length})</span>
                      </h5>
                      <span className="text-[11px] text-slate-500">
                        Cada tasa lista sus tipos de pago aceptados y su gravamen (%)
                      </span>
                    </div>

                    {exchangeRates.length === 0 ? (
                      <div className="p-8 rounded-2xl border-2 border-dashed border-slate-200 text-center space-y-2 bg-slate-50/50">
                        <Coins className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="text-xs font-bold text-slate-600">
                          No hay tasas añadidas en esta tienda.
                        </p>
                        <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                          Usa los selectores de arriba para definir las monedas, escribe la tasa (o pulsa "Tomar de Global") y presiona "Adicionar Tasa".
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {exchangeRates.map((rateItem, rIdx) => {
                          const associatedRpms = ratePaymentMethods.filter(
                            (rpm) => rpm.exchangeRateId === rateItem.id
                          );
                          const addForm = rateAddForms[rateItem.id] || {
                            paymentMethodId: paymentMethodsCatalog[0]?.id || 'pm-efectivo',
                            gravamen: 0,
                            notes: '',
                          };

                          return (
                            <div
                              key={rateItem.id}
                              className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs transition-all hover:border-slate-300"
                            >
                              {/* Header de la Tasa en la Tabla */}
                              <div className="p-3.5 bg-slate-50/90 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <span className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white font-bold text-[10px] uppercase tracking-wider">
                                    Tasa {rIdx + 1}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-black text-sm text-slate-900">
                                      1 {rateItem.fromCurrency}
                                    </span>
                                    <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="font-mono font-black text-sm text-indigo-700">
                                      {rateItem.rate} {rateItem.toCurrency}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Valor:</span>
                                    <input
                                      type="number"
                                      min="0.000001"
                                      step="any"
                                      value={rateItem.rate}
                                      onChange={(e) =>
                                        handleUpdateStoreRate(rateItem.id, Number(e.target.value) || 1)
                                      }
                                      className="w-20 text-center font-mono font-black text-xs text-slate-900 outline-none"
                                    />
                                    <span className="text-[10px] font-bold text-slate-400">{rateItem.toCurrency}</span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleRemoveStoreRate(rateItem.id)}
                                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                    title="Eliminar tasa"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              {/* Tipos de Pago de la Tasa */}
                              <div className="p-3.5 space-y-3">
                                <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                                  <span className="flex items-center gap-1.5">
                                    <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Tipos de pago aceptados para esta tasa ({associatedRpms.length}):</span>
                                  </span>
                                </div>

                                {/* Tabla/Lista de Tipos de Pago para esta tasa */}
                                {associatedRpms.length === 0 ? (
                                  <div className="p-3 rounded-xl bg-amber-50/60 border border-dashed border-amber-200 text-amber-800 text-xs">
                                    Aún no hay tipos de pago asociados a esta tasa. Agrega uno usando el formulario inferior.
                                  </div>
                                ) : (
                                  <div className="overflow-x-auto rounded-xl border border-slate-100">
                                    <table className="w-full text-left text-xs">
                                      <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-100">
                                        <tr>
                                          <th className="py-2 px-3">Tipo de Pago</th>
                                          <th className="py-2 px-3 text-center">Gravamen</th>
                                          <th className="py-2 px-3">Notas / Condiciones</th>
                                          <th className="py-2 px-3 text-right">Acción</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {associatedRpms.map((rpm) => {
                                          const pmObj = paymentMethodsCatalog.find(
                                            (p) => p.id === rpm.paymentMethodId
                                          );
                                          return (
                                            <tr key={rpm.id} className="hover:bg-slate-50/50">
                                              <td className="py-2 px-3 font-bold text-slate-800">
                                                <div className="flex items-center gap-1.5">
                                                  <CreditCard className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                                  <span>{pmObj?.name || rpm.paymentMethodId}</span>
                                                </div>
                                              </td>
                                              <td className="py-2 px-3 text-center">
                                                <div className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5">
                                                  <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="0.5"
                                                    value={rpm.gravamen ?? 0}
                                                    onChange={(e) =>
                                                      handleUpdateRpmGravamen(rpm.id, Number(e.target.value) || 0)
                                                    }
                                                    className="w-12 text-center font-mono font-black text-xs text-slate-900 outline-none bg-transparent"
                                                  />
                                                  <span className="text-[11px] font-bold text-slate-500">%</span>
                                                </div>
                                              </td>
                                              <td className="py-2 px-3">
                                                <input
                                                  type="text"
                                                  value={rpm.notes || ''}
                                                  onChange={(e) => handleUpdateRpmNotes(rpm.id, e.target.value)}
                                                  placeholder="Sin condición adicional"
                                                  className="w-full px-2 py-1 rounded-lg border border-transparent hover:border-slate-200 focus:border-emerald-500 bg-transparent text-xs text-slate-700 outline-none"
                                                />
                                              </td>
                                              <td className="py-2 px-3 text-right">
                                                <button
                                                  type="button"
                                                  onClick={() => handleRemoveRatePaymentMethod(rpm.id)}
                                                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                                  title="Eliminar forma de pago de esta tasa"
                                                >
                                                  <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                )}

                                {/* Formulario para agregar tipo de pago a esta tasa */}
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                                  <div className="sm:col-span-4">
                                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                                      Forma de Pago
                                    </label>
                                    <select
                                      value={addForm.paymentMethodId}
                                      onChange={(e) => {
                                        const pmId = e.target.value;
                                        setRateAddForms((prev) => ({
                                          ...prev,
                                          [rateItem.id]: {
                                            ...addForm,
                                            paymentMethodId: pmId,
                                            gravamen: pmId === 'pm-efectivo' ? 0 : (pmId === 'pm-transferencia' ? 10 : addForm.gravamen),
                                          },
                                        }));
                                      }}
                                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
                                    >
                                      {paymentMethodsCatalog.map((pm) => (
                                        <option key={pm.id} value={pm.id}>
                                          {pm.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  <div className="sm:col-span-3">
                                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                                      Gravamen (%)
                                    </label>
                                    <div className="relative">
                                      <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.5"
                                        value={addForm.gravamen}
                                        onChange={(e) =>
                                          setRateAddForms((prev) => ({
                                            ...prev,
                                            [rateItem.id]: {
                                              ...addForm,
                                              gravamen: Number(e.target.value) || 0,
                                            },
                                          }))
                                        }
                                        className="w-full px-2.5 py-1.5 pr-6 rounded-lg border border-slate-300 bg-white text-xs font-mono font-bold text-slate-900 outline-none focus:border-emerald-500 text-center"
                                      />
                                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                                    </div>
                                  </div>

                                  <div className="sm:col-span-3">
                                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                                      Condición (Opcional)
                                    </label>
                                    <input
                                      type="text"
                                      value={addForm.notes}
                                      onChange={(e) =>
                                        setRateAddForms((prev) => ({
                                          ...prev,
                                          [rateItem.id]: {
                                            ...addForm,
                                            notes: e.target.value,
                                          },
                                        }))
                                      }
                                      placeholder="ej. Billetes limpios..."
                                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-800 outline-none focus:border-emerald-500"
                                    />
                                  </div>

                                  <div className="sm:col-span-2">
                                    <button
                                      type="button"
                                      onClick={() => handleAddPaymentToRate(rateItem.id)}
                                      className="w-full py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      <span>Agregar</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
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
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm cursor-pointer inline-flex items-center justify-center gap-1.5"
                >
                  <X className="w-4 h-4" />
                  <span>Cancelar</span>
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
