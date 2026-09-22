export type CategoryType =
  | 'Alimentos y Combos'
  | 'Electrodomésticos y Hogar'
  | 'Ropa y Calzado'
  | 'Ferretería y Construcción'
  | 'Motos y Repuestos'
  | 'Celulares y Electrónica'
  | 'Servicios Profesionales'
  | 'Belleza y Salud'
  | 'Hogar y Decoración'
  | 'Otros';

export interface StoreAddress {
  street: string; // calle
  number: string; // número
  building?: string; // edificio
  apartment?: string; // apartamento
  crossStreet1?: string; // entrecalle 1
  crossStreet2?: string; // entrecalle 2
  neighborhood?: string; // reparto
  municipality: string; // municipio
  province: string; // provincia
  googleMapsUrl?: string; // link de google maps
  codigoPostal?: string; // Código postal
}

export interface StorePaymentOptions {
  transferAccepted: boolean; // si acepta pagos por transferencia
  transferFeePercentage?: number; // comisión por dicho pago (ej: 0%, 5%)
  acceptedCurrencies: string[]; // si acepta pago en otras monedas (ej: ['USD', 'EUR', 'GBP'])
  notes?: string;
}

export interface StoreExchangeRate {
  id: string; // ID único del registro de tasa de cambio
  storeId?: string; // Llave foránea de la tienda (tabla relacionada 1:N)
  fromCurrency: string; // Primera moneda / origen (llave del nomenclador tipos de moneda, ej: "USD")
  toCurrency: string; // Segunda moneda / destino (llave del nomenclador tipos de moneda, ej: "EUR")
  rate: number; // Tasa de cambio de la tienda: 1 fromCurrency = rate toCurrency (ej: 0.92)
}

export interface GlobalExchangeRate {
  id: string; // ID único del nomenclador de tasas globales
  fromCurrency: string; // Primera moneda / origen (llave del nomenclador tipos de moneda, ej: "USD")
  toCurrency: string; // Segunda moneda / destino (llave del nomenclador tipos de moneda, ej: "EUR")
  rate: number; // Tasa de cambio global
  description?: string; // Nota descriptiva opcional
}

export interface ProductAllowedExchangeRate {
  id: string; // ID único del enlace
  productId: string; // Llave foránea del producto
  storeId: string; // Llave foránea de la tienda
  exchangeRateId: string; // Llave foránea de la tasa de cambio de la tienda permitida
}

export interface CurrencyItem {
  id: string; // e.g. "curr-usd", "curr-eur", "curr-gbp"
  code: string; // e.g. "USD", "EUR", "GBP"
  name: string; // e.g. "Dólar Estadounidense", "Euro", "Libra Esterlina"
  symbol: string; // e.g. "$", "€", "£"
  description?: string;
  active?: boolean;
}

export interface StoreCurrencyPaymentMethod {
  id: string; // ID único del enlace relacional
  storeId?: string; // Llave foránea de la tienda
  currency: string; // Moneda asociada (llave del nomenclador de monedas, ej: 'USD', 'EUR')
  paymentMethodId: string; // ID del tipo de pago aceptado para esta moneda (ej: 'pm-efectivo', 'pm-transferencia')
  notes?: string; // Nota descriptiva opcional (ej: 'Solo efectivo en billetes', 'Transferencia bancaria')
}

export interface StoreRatePaymentMethod {
  id: string; // ID único del registro relacional
  storeId?: string; // Llave foránea de la tienda
  exchangeRateId: string; // Llave foránea de la tasa de cambio de la tienda
  paymentMethodId: string; // ID del tipo de pago aceptado (ej: 'pm-efectivo', 'pm-transferencia')
  gravamen: number; // Porcentaje de gravamen para este tipo de pago en esta tasa (ej: 0 para efectivo, 2 para transferencia)
  notes?: string; // Nota descriptiva opcional
}

export interface Store {
  id: string;
  name: string;
  logoUrl?: string; // Main image / logo URL
  images?: string[]; // Gallery of multiple store photos
  slogan?: string;
  description: string;
  whatsappPhone: string; // e.g. "+1 5550000000"
  location: string; // e.g. "Sede Central", "Distrito Norte"
  address?: StoreAddress; // Normalized relational address structure
  provincia_id?: number; // Llave foránea de provincias
  municipio_id?: number; // Llave foránea de municipios
  reparto_id?: number; // Llave foránea de repartos
  codigo_postal?: string; // Código postal normalizado
  exchangeRates?: StoreExchangeRate[]; // Tabla de tasas de cambio relacionadas (1 a muchos con la tienda)
  ratePaymentMethods?: StoreRatePaymentMethod[]; // Tabla relacional: Tasas de cambio ↔ Tipos de pago aceptados y gravamen (ej: tasa 1 USD a EUR 0.92 -> efectivo 0% gravamen, transferencia 2% gravamen)
  usdToCupRate?: number; // Compatibilidad de acceso rápido
  baseCurrency?: string; // Compatibilidad
  secondaryCurrency?: string; // Compatibilidad
  deliveryAvailable?: boolean; // si tiene o no la opción de mensajería (domicilio)
  paymentOptions?: StorePaymentOptions; // opciones de pago por transferencia y otras monedas
  currencyPaymentMethods?: StoreCurrencyPaymentMethod[]; // Tabla relacional: Moneda ↔ Formas de pago aceptadas en esta tienda
  paymentMethodIds?: string[]; // IDs de Tipos de Pago del nomenclador asociados a esta tienda (ej: ["pm-efectivo", "pm-transferencia"])
  deliveryMethodIds?: string[]; // IDs de Tipos de Recogida / Entrega del nomenclador asociados a esta tienda (ej: ["dm-mensajeria", "dm-recogida"])
  paymentPlatformIds?: string[]; // IDs de Plataformas de Pago del nomenclador asociadas a esta tienda (ej: ["pp-banmet", "pp-zelle", "pp-paypal", "pp-clasica"])
  active: boolean;
  rating?: number;
  badge?: string; // e.g. "Envío Rápido", "Tienda Verificada"
  createdAt: string;
}

export interface SubcategoryItem {
  id: string;
  name: string;
  description?: string;
}

export interface DepartmentCategory {
  id: string;
  name: string; // Departamento Principal (1er Escalón)
  description?: string;
  iconName?: string;
  subcategories: SubcategoryItem[]; // Subcategorías / Etiquetas (2do Escalón)
}

// --- 2-LEVEL TAGGING SYSTEM (ETIQUETADO DE 2 NIVELES) ---
export interface TagItem {
  id: string;
  name: string; // 2do Nivel: e.g. "Rojo", "Azul", "Blanco", "Negro", "Invierno", "Verano", "Otoño"
}

export interface TagGroup {
  id: string;
  name: string; // 1er Nivel: e.g. "Color", "Estaciones", "Garantía", "Talla"
  description?: string;
  tags: TagItem[]; // 2do Nivel de etiquetas
}

export interface ProductTagSelection {
  group: string; // 1er Nivel: e.g. "Color"
  value: string; // 2do Nivel: e.g. "Rojo"
  groupId?: string;
  groupName?: string;
  tagId?: string;
  tagName?: string;
}

// --- NOMENCLATORS (NOMENCLADORES DINÁMICOS DEL MODELO DE NEGOCIO) ---
export interface NomenclatorItem {
  id: string;
  name: string;
  description?: string;
  iconName?: string;
  active?: boolean;
  gravamen?: number; // Porcentaje de gravamen o comisión (%) aplicable a métodos de pago (ej: 0, 5, 10)
}

export type ProductTypeItem = NomenclatorItem;
export type PaymentMethodItem = NomenclatorItem;
export type DeliveryMethodItem = NomenclatorItem;
export type PaymentPlatformItem = NomenclatorItem;

export interface Product {
  id: string;
  code: string; // Código único alfanumérico en toda la base de datos (ej: "PRD-001")
  storeId: string;
  title: string;
  description: string;
  price?: number; // Precio en la moneda asignada al producto
  priceUSD: number; // Base price in USD (compatibilidad con cálculos previos)
  currency?: string; // Moneda en la que está expresado el precio (llave del nomenclador, ej: 'USD', 'EUR')
  allowedExchangeRateIds?: string[]; // IDs de las tasas de la tienda permitidas para cobro de este producto (relación N:M)
  category?: CategoryType | string; // Departamento Principal (1er Escalón, opcional)
  departmentId?: string; // ID del Departamento
  subcategory?: string; // Subcategoría (2do Escalón, opcional) ej: "Plomería", "Carnes"
  subcategoryId?: string; // ID de la Subcategoría
  imageUrl: string; // Main primary image URL
  images?: string[]; // Multiple images for gallery
  isAvailable: boolean; // Activo en el marketplace (true = activo, false = desactivado)
  deliveryAvailable?: boolean; // Derivado de la tienda
  featured?: boolean;
  tags: string[];
  tagSelections?: ProductTagSelection[]; // Selecciones del sistema de etiquetado de 2 niveles
  createdAt: string;

  // Relaciones dinámicas con Nomencladores de Negocio:
  // (Solamente se relaciona con Producto el Tipo de Producto. Formas de Pago y Recogida se relacionan con la Tienda)
  productTypeId?: string; // ID del Tipo de Oferta (ej: "pt-producto", "pt-servicio", "pt-alquiler", "pt-digital")
  productType?: string; // Nombre del Tipo de Oferta (ej: "Productos Físicos", "Servicios Profesionales")
  paymentMethodIds?: string[]; // Deprecated / compatibilidad: El tipo de pago se define a nivel de Tienda (Store)
  deliveryMethodIds?: string[]; // Deprecated / compatibilidad: El tipo de recogida se define a nivel de Tienda (Store)
}

export interface CategoryItem {
  id: CategoryType;
  name: string;
  iconName: string; // lucide icon name reference
  description: string;
}

export type CurrencyDisplayMode = 'BOTH' | 'SECONDARY' | 'PRIMARY' | 'CUP' | 'USD';

export type PriceFilterCurrency = string; // 'USD' | 'EUR' | dinámico

export interface FilterState {
  searchQuery: string;
  code?: string; // Búsqueda específica por código único de producto
  storeIds: string[]; // empty = all stores selected
  storeCurrencies?: string[]; // Monedas de tienda (ej: ['USD', 'EUR'])
  currencies?: string[]; // Filtrar por moneda(s) nativa(s) del producto (ej: ['USD', 'EUR'])
  categories: string[]; // empty = all categories/departments selected
  subcategories: string[]; // empty = all subcategories selected
  tagGroups: string[]; // empty = all supertags selected
  tagValues: string[]; // empty = all tags selected
  provinces: string[]; // empty = all provinces selected
  municipalities: string[]; // empty = all municipalities selected
  repartos: string[]; // empty = all repartos selected
  productTypes?: string[]; // IDs o nombres del nomenclador de tipos de producto, empty = all
  itemTypes?: string[]; // 'product' | 'service', empty = all (compatibilidad)
  paymentMethods?: string[]; // IDs o nombres del nomenclador de tipos de pago, empty = all
  deliveryMethods?: string[]; // IDs o nombres del nomenclador de tipos de recogida/entrega, empty = all
  priceCurrency: PriceFilterCurrency; // Moneda de referencia para el rango de precios ('USD' | 'EUR')
  minPrice: number | '';
  maxPrice: number | '';
  deliveryOnly?: boolean; // Legacy/convenience
  transferOnly?: boolean; // Legacy/convenience
  serviceOnly?: boolean; // Legacy/convenience
  // Optional backwards-compatibility fields
  includeProducts?: boolean;
  includeServices?: boolean;
  category?: string;
  subcategory?: string;
  storeId?: string;
  province?: string;
  municipality?: string;
  reparto?: string;
  tagGroup?: string;
  tagValue?: string;
  availabilityOnly?: boolean;
  location?: string;
  sortBy?: 'featured' | 'price_asc' | 'price_desc' | 'newest' | 'name_asc';
}

export interface StoreFilterState {
  searchQuery: string;
  currencies?: string[]; // Monedas aceptadas por la tienda (ej: ['USD', 'EUR'])
  provinces: string[]; // empty = all provinces selected
  municipalities: string[]; // empty = all municipalities selected
  repartos: string[]; // empty = all repartos selected
  paymentMethods?: string[]; // 'transfer' | 'cash' o IDs del nomenclador, empty = all
  deliveryMethods?: string[]; // 'delivery' | 'pickup', empty = all
  paymentPlatforms?: string[]; // IDs de plataformas de pago del nomenclador (ej: Banco Metropolitano, Zelle, PayPal)
  deliveryOnly?: boolean;
  transferOnly?: boolean;
  // Optional backwards-compatibility fields
  province?: string;
  municipality?: string;
  reparto?: string;
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: 'success' | 'info' | 'error';
}

export interface AdminAuthSession {
  isAuthenticated: boolean;
  role: 'admin' | 'guest';
}

export interface GeoReparto {
  id: string;
  name: string;
}

export interface GeoMunicipality {
  id: string;
  name: string;
  codigo_postal?: string;
  codigoPostal?: string;
  repartos: GeoReparto[];
}

export interface GeoProvince {
  id: string;
  name: string;
  municipalities: GeoMunicipality[];
}

// ============================================================
// Modelos Canónicos SQLite Estrictos (Fase 1: Catálogos y Geografía)
// ============================================================
export interface DbProvincia {
  id: number;
  provincia: string;
  descripcion: string | null;
}

export interface DbMoneda {
  id: number;
  moneda: string;
  abreviatura: string;
  descripcion: string | null;
}

export interface DbDepartamento {
  id: number;
  departamento: string;
  descripcion: string | null;
}

export interface DbEtiqueta {
  id: number;
  etiqueta: string;
  descripcion: string | null;
}

export interface DbTipoOferta {
  id: number;
  oferta: string;
  descripcion: string | null;
}

export interface DbTipoPago {
  id: number;
  pago: string;
  descripcion: string | null;
}

export interface DbTipoRecogida {
  id: number;
  recogida: string;
  descripcion: string | null;
}

export interface DbMunicipio {
  id: number;
  municipio: string;
  descripcion: string | null;
  provincia_id: number | null;
  codigo_postal: string;
}

export interface DbReparto {
  id: number;
  reparto: string;
  descripcion: string | null;
  municipio_id: number | null;
}

export interface DbSubetiqueta {
  id: number;
  subetiqueta: string;
  descripcion: string | null;
  etiqueta_id: number | null;
}

export interface DbSubdepartamento {
  id: number;
  subdepartamento: string;
  descripcion: string | null;
  departamento_id: number | null;
}

export interface DbCatalogosResponse {
  provincias: DbProvincia[];
  municipios: DbMunicipio[];
  repartos: DbReparto[];
  monedas: DbMoneda[];
  departamentos: DbDepartamento[];
  subdepartamentos: DbSubdepartamento[];
  etiquetas: DbEtiqueta[];
  subetiquetas: DbSubetiqueta[];
  tipo_ofertas: DbTipoOferta[];
  tipo_pagos: DbTipoPago[];
  tipo_recogidas: DbTipoRecogida[];
}

export interface MarketplaceSocialLinks {
  whatsapp?: string;
  telegram?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string; // X
  linkedin?: string;
}

export type ThemePreference = 'system' | 'light' | 'dark';

export interface MarketplaceConfig {
  name: string;
  slogan: string;
  logoUrl: string;
  defaultStoreLogoUrl: string; // Imagen por defecto para las tiendas que no se les declare una imagen
  defaultProductImageUrl: string; // Imagen por defecto para productos o servicios sin imagen
  bannerUrl?: string; // Imagen principal del portal o banner
  bannerTitle?: string; // Título visible en el banner principal
  bannerSubtitle?: string; // Subtítulo o descripción visible en el banner principal
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  socialLinks?: MarketplaceSocialLinks;
  geoCatalog: GeoProvince[]; // Catálogo relacional: Provincia -> Municipios -> Repartos
  departmentsCatalog?: DepartmentCategory[]; // Clasificación de productos en 2 escalones (Departamentos -> Subcategorías)
  tagsCatalog?: TagGroup[]; // Sistema de etiquetado de 2 niveles (Grupos -> Etiquetas)
  productTypesCatalog?: ProductTypeItem[]; // Nomenclador dinámico de Tipos de Producto / Oferta (ej: Físicos, Servicios, Alquileres)
  paymentMethodsCatalog?: PaymentMethodItem[]; // Nomenclador dinámico de Tipos de Pago (ej: Efectivo, Transferencia, Zelle)
  paymentPlatformsCatalog?: PaymentPlatformItem[]; // Nomenclador global de Plataformas de Pago (ej: Banco Metropolitano, Zelle, PayPal, Clásica)
  deliveryMethodsCatalog?: DeliveryMethodItem[]; // Nomenclador dinámico de Tipos de Recogida / Entrega (ej: Mensajería, Recogida en Local)
  currenciesCatalog?: CurrencyItem[]; // Nomenclador dinámico de Tipos de Moneda (USD, EUR, GBP, etc.)
  baseCurrency?: string; // Moneda base global del marketplace (ej: 'USD')
  secondaryCurrency?: string; // Moneda secundaria global del marketplace (ej: 'EUR')
  globalExchangeRate?: number; // Tasa de cambio global para tiendas con la combinación base/secundaria
  globalExchangeRates?: GlobalExchangeRate[]; // Nomenclador de tasas de cambio globales del marketplace
  uiTexts?: Record<string, any>; // Textos de la interfaz gestionados y persistidos en la base de datos
}

export interface CartItem {
  productId: string;
  quantity: number;
  addedAt?: string;
  paymentCurrency?: string; // Moneda de pago para este producto (por defecto la primera que tenga configurada la tienda)
  paymentMethodId?: string; // Forma de pago elegida
  deliveryMethodId?: string; // Forma de recogida/entrega elegida
}

export interface StoreCartPreferences {
  selectedCurrency: string; // Moneda de pago seleccionada para la tienda (ej: 'USD', 'EUR')
  selectedPaymentMethodId?: string; // Forma de pago elegida
  selectedDeliveryMethodId?: string; // Forma de entrega/recogida elegida
  notes?: string;
}

