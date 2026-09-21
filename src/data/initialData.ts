import {
  Store,
  Product,
  CategoryItem,
  CategoryType,
  MarketplaceConfig,
  GeoProvince,
  DepartmentCategory,
  TagGroup,
  ProductTypeItem,
  PaymentMethodItem,
  PaymentPlatformItem,
  DeliveryMethodItem,
  CurrencyItem,
  StoreExchangeRate,
} from '../types';
import { DEFAULT_INTERFAZ } from './defaultInterfaz';

export const INITIAL_CURRENCIES_CATALOG: CurrencyItem[] = [
  {
    id: 'curr-usd',
    code: 'USD',
    name: 'Dólar Estadounidense',
    symbol: '$',
    description: 'Moneda de referencia comercial internacional',
    active: true,
  },
  {
    id: 'curr-eur',
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    description: 'Moneda oficial de la Unión Europea',
    active: true,
  },
  {
    id: 'curr-mxn',
    code: 'MXN',
    name: 'Peso Mexicano',
    symbol: '$',
    description: 'Moneda de curso legal de México',
    active: true,
  },
  {
    id: 'curr-cop',
    code: 'COP',
    name: 'Peso Colombiano',
    symbol: '$',
    description: 'Moneda de curso legal de Colombia',
    active: true,
  },
];

export const INITIAL_PRODUCT_TYPES_CATALOG: ProductTypeItem[] = [
  {
    id: 'pt-producto',
    name: 'Productos Físicos',
    description: 'Artículos físicos, bienes tangibles, alimentos, electrodomésticos y equipos',
  },
  {
    id: 'pt-servicio',
    name: 'Servicios Profesionales',
    description: 'Servicios técnicos, reparaciones, mantenimiento, consultoría y oficios',
  },
  {
    id: 'pt-alquiler',
    name: 'Alquileres y Rentas',
    description: 'Renta de viviendas, autos, equipos para eventos, herramientas y trajes',
  },
  {
    id: 'pt-digital',
    name: 'Digital y Recargas',
    description: 'Cuentas streaming, licencias, cursos online, diseño gráfico y recargas',
  },
];

export const INITIAL_PAYMENT_METHODS_CATALOG: PaymentMethodItem[] = [
  {
    id: 'pm-efectivo',
    name: 'Efectivo',
    description: 'Pago directo en efectivo en tienda o contra entrega',
    gravamen: 0,
  },
  {
    id: 'pm-transferencia',
    name: 'Transferencia Bancaria',
    description: 'Transferencia bancaria directa, SPEI o banca electrónica',
    gravamen: 2,
  },
  {
    id: 'pm-moneda-ext',
    name: 'Transferencia Internacional / Digital',
    description: 'Zelle, transferencia internacional, tarjeta de crédito o débito',
    gravamen: 0,
  },
  {
    id: 'pm-cripto',
    name: 'Criptomonedas',
    description: 'Pagos mediante USDT, Bitcoin u otras criptomonedas',
    gravamen: 1.5,
  },
];

export const INITIAL_PAYMENT_PLATFORMS_CATALOG: PaymentPlatformItem[] = [
  {
    id: 'pp-banmet',
    name: 'Banco Metropolitano',
    description: 'Banca y transferencias en Banco Metropolitano (Cuba - CUP / USD)',
    iconName: 'Building2',
    active: true,
  },
  {
    id: 'pp-zelle',
    name: 'Zelle',
    description: 'Transferencias directas entre cuentas en EE.UU. (USD)',
    iconName: 'Smartphone',
    active: true,
  },
  {
    id: 'pp-paypal',
    name: 'PayPal',
    description: 'Pagos y envíos internacionales digitales con protección (USD / EUR)',
    iconName: 'Globe',
    active: true,
  },
  {
    id: 'pp-clasica',
    name: 'Tarjeta Clásica',
    description: 'Tarjeta prepagada en USD para compras y consumos (Fincimex)',
    iconName: 'CreditCard',
    active: true,
  },
  {
    id: 'pp-bpa',
    name: 'BPA (Banco Popular de Ahorro)',
    description: 'Transferencias y banca electrónica BPA (CUP / USD)',
    iconName: 'Building2',
    active: true,
  },
  {
    id: 'pp-bandec',
    name: 'BANDEC',
    description: 'Banco de Crédito y Comercio (CUP / USD)',
    iconName: 'Building2',
    active: true,
  },
  {
    id: 'pp-tropipay',
    name: 'TropiPay',
    description: 'Billetera electrónica internacional para transferencias y cobros (EUR / USD)',
    iconName: 'Wallet',
    active: true,
  },
  {
    id: 'pp-transfermovil',
    name: 'Transfermóvil',
    description: 'Plataforma oficial cubana de pagos móviles por banca electrónica',
    iconName: 'Smartphone',
    active: true,
  },
  {
    id: 'pp-enzona',
    name: 'EnZona',
    description: 'Pasarela cubana de comercio electrónico y pagos por código QR',
    iconName: 'QrCode',
    active: true,
  },
];

export const INITIAL_DELIVERY_METHODS_CATALOG: DeliveryMethodItem[] = [
  {
    id: 'dm-mensajeria',
    name: 'Mensajería a Domicilio',
    description: 'Entrega directa hasta la puerta del cliente con mensajero',
  },
  {
    id: 'dm-recogida',
    name: 'Recogida en Tienda / Local',
    description: 'El cliente retira personalmente su compra en la sede o local de la tienda',
  },
  {
    id: 'dm-punto-encuentro',
    name: 'Punto de Encuentro',
    description: 'Entrega acordada en un punto de referencia céntrico (plaza, centro comercial, etc.)',
  },
  {
    id: 'dm-envio-nacional',
    name: 'Envío Nacional / Regional',
    description: 'Envíos a otras ciudades o regiones por paquetería express',
  },
];

export const INITIAL_TAGS_CATALOG: TagGroup[] = [
  {
    id: 'tg-color',
    name: 'Color',
    description: 'Color principal o variantes de color disponibles',
    tags: [
      { id: 'tag-rojo', name: 'Rojo' },
      { id: 'tag-azul', name: 'Azul' },
      { id: 'tag-blanco', name: 'Blanco' },
      { id: 'tag-negro', name: 'Negro' },
      { id: 'tag-verde', name: 'Verde' },
      { id: 'tag-amarillo', name: 'Amarillo' },
      { id: 'tag-gris', name: 'Gris' },
    ],
  },
  {
    id: 'tg-estaciones',
    name: 'Estaciones',
    description: 'Temporada o estación ideal del año',
    tags: [
      { id: 'tag-invierno', name: 'Invierno' },
      { id: 'tag-verano', name: 'Verano' },
      { id: 'tag-otono', name: 'Otoño' },
      { id: 'tag-primavera', name: 'Primavera' },
    ],
  },
  {
    id: 'tg-estado',
    name: 'Estado / Condición',
    description: 'Condición del producto o artículo',
    tags: [
      { id: 'tag-nuevo', name: 'Nuevo Sello' },
      { id: 'tag-seminuevo', name: 'Seminuevo' },
      { id: 'tag-reacondicionado', name: 'Reacondicionado' },
    ],
  },
  {
    id: 'tg-garantia',
    name: 'Garantía',
    description: 'Tiempo de garantía respaldada por el vendedor',
    tags: [
      { id: 'tag-1mes', name: '1 Mes' },
      { id: 'tag-3meses', name: '3 Meses' },
      { id: 'tag-6meses', name: '6 Meses' },
      { id: 'tag-1ano', name: '1 Año' },
    ],
  },
];

export const INITIAL_DEPARTMENT_CATALOG: DepartmentCategory[] = [
  {
    id: 'dept-alimentos',
    name: 'Alimentos y Combos',
    description: 'Productos alimenticios, combos cárnicos, granos y enlatados',
    iconName: 'ShoppingBag',
    subcategories: [
      { id: 'sub-carnes', name: 'Carnes y Embutidos' },
      { id: 'sub-pescados', name: 'Pescados y Mariscos' },
      { id: 'sub-granos', name: 'Granos y Cereales' },
      { id: 'sub-salsas', name: 'Salsas y Condimentos' },
      { id: 'sub-pastas', name: 'Pastas y Enlatados' },
      { id: 'sub-lacteos', name: 'Lácteos y Quesos' },
      { id: 'sub-aceites', name: 'Aceites y Mantecas' },
      { id: 'sub-bebidas', name: 'Bebidas y Licores' },
    ],
  },
  {
    id: 'dept-ferreteria',
    name: 'Ferretería y Construcción',
    description: 'Herramientas, plomería, electricidad, albañilería y materiales',
    iconName: 'Wrench',
    subcategories: [
      { id: 'sub-plomeria', name: 'Plomería y Tuberías' },
      { id: 'sub-herramientas', name: 'Herramientas Manuales' },
      { id: 'sub-electricas', name: 'Herramientas Eléctricas' },
      { id: 'sub-albanileria', name: 'Albañilería y Cemento' },
      { id: 'sub-electricidad', name: 'Electricidad e Iluminación' },
      { id: 'sub-pinturas', name: 'Pinturas y Selladores' },
    ],
  },
  {
    id: 'dept-electro',
    name: 'Electrodomésticos y Hogar',
    description: 'Equipos para el hogar, cocina, refrigeración y climatización',
    iconName: 'Tv',
    subcategories: [
      { id: 'sub-cocina', name: 'Cocina y Olla Reina' },
      { id: 'sub-clima', name: 'Climatización y Ventiladores' },
      { id: 'sub-refrig', name: 'Refrigeración y Freezer' },
      { id: 'sub-bombas', name: 'Bombas de Agua e Inversores' },
      { id: 'sub-muebles', name: 'Muebles y Colchones' },
    ],
  },
  {
    id: 'dept-ropa',
    name: 'Ropa y Calzado',
    description: 'Moda masculina, femenina, infantil y calzado deportivo',
    iconName: 'Shirt',
    subcategories: [
      { id: 'sub-calzado-dep', name: 'Calzado Deportivo' },
      { id: 'sub-calzado-form', name: 'Calzado Formal y Chancletas' },
      { id: 'sub-ropa-masc', name: 'Ropa Masculina' },
      { id: 'sub-ropa-fem', name: 'Ropa Femenina' },
      { id: 'sub-ropa-inf', name: 'Ropa Infantil' },
    ],
  },
  {
    id: 'dept-motos',
    name: 'Motos y Repuestos',
    description: 'Motos eléctricas, baterías de litio, neumáticos y piezas',
    iconName: 'Zap',
    subcategories: [
      { id: 'sub-baterias', name: 'Baterías de Litio / Gel' },
      { id: 'sub-neumaticos', name: 'Neumáticos y Cámaras' },
      { id: 'sub-piezas-elec', name: 'Piezas Eléctricas y Mandos' },
      { id: 'sub-cascos', name: 'Accesorios y Cascos' },
    ],
  },
  {
    id: 'dept-celulares',
    name: 'Celulares y Electrónica',
    description: 'Teléfonos móviles, accesorios, audífonos y tecnología',
    iconName: 'Smartphone',
    subcategories: [
      { id: 'sub-smartphones', name: 'Teléfonos Inteligentes' },
      { id: 'sub-cargadores', name: 'Cargadores y Cables' },
      { id: 'sub-audifonos', name: 'Audio y Audífonos' },
      { id: 'sub-fundas', name: 'Fundas y Protectores' },
    ],
  },
  {
    id: 'dept-belleza',
    name: 'Belleza y Salud',
    description: 'Productos cosméticos, cuidado capilar, perfumería e higiene',
    iconName: 'Sparkles',
    subcategories: [
      { id: 'sub-capilar', name: 'Capilar y Queratinas' },
      { id: 'sub-perfumes', name: 'Perfumería y Colonias' },
      { id: 'sub-maquillaje', name: 'Maquillaje y Rostro' },
      { id: 'sub-higiene', name: 'Medicamentos e Higiene' },
    ],
  },
  {
    id: 'dept-servicios',
    name: 'Servicios Profesionales',
    description: 'Taller de reparación, transportación, trámites y servicios técnicos',
    iconName: 'Briefcase',
    subcategories: [
      { id: 'sub-taller', name: 'Mantenimiento y Taller' },
      { id: 'sub-envios', name: 'Transportación y Envíos' },
      { id: 'sub-hogar-serv', name: 'Reparaciones del Hogar' },
    ],
  },
];

export const INITIAL_GEO_CATALOG: GeoProvince[] = [
  {
    id: 'prov-metro',
    name: 'Región Metropolitana',
    municipalities: [
      {
        id: 'mun-centro',
        name: 'Distrito Centro',
        repartos: [
          { id: 'rep-historico', name: 'Centro Histórico' },
          { id: 'rep-comercial', name: 'Zona Comercial' },
          { id: 'rep-financiero', name: 'Distrito Financiero' },
          { id: 'rep-parque', name: 'Parque Central' },
        ],
      },
      {
        id: 'mun-norte',
        name: 'Distrito Norte',
        repartos: [
          { id: 'rep-norte-1', name: 'Valle Alto' },
          { id: 'rep-norte-2', name: 'Los Pinos' },
          { id: 'rep-norte-3', name: 'Colinas del Norte' },
        ],
      },
      {
        id: 'mun-sur',
        name: 'Distrito Sur',
        repartos: [
          { id: 'rep-sur-1', name: 'Mirador' },
          { id: 'rep-sur-2', name: 'Residencial Sur' },
          { id: 'rep-sur-3', name: 'Praderas' },
        ],
      },
      {
        id: 'mun-este',
        name: 'Distrito Este',
        repartos: [
          { id: 'rep-este-1', name: 'Costa Este' },
          { id: 'rep-este-2', name: 'El Puerto' },
        ],
      },
      {
        id: 'mun-oeste',
        name: 'Distrito Oeste',
        repartos: [
          { id: 'rep-oeste-1', name: 'Jardines del Sol' },
          { id: 'rep-oeste-2', name: 'La Alameda' },
        ],
      },
    ],
  },
  {
    id: 'prov-norte',
    name: 'Región Norte',
    municipalities: [
      {
        id: 'mun-rn-1',
        name: 'Ciudad Norte',
        repartos: [
          { id: 'rep-rn-centro', name: 'Centro Urbano' },
          { id: 'rep-rn-ind', name: 'Zona Industrial' },
        ],
      },
      {
        id: 'mun-rn-2',
        name: 'Costa Dorada',
        repartos: [
          { id: 'rep-cd-playa', name: 'Sector Costero' },
          { id: 'rep-cd-boulevard', name: 'El Boulevard' },
        ],
      },
    ],
  },
  {
    id: 'prov-sur',
    name: 'Región Sur',
    municipalities: [
      {
        id: 'mun-rs-1',
        name: 'Ciudad del Sol',
        repartos: [
          { id: 'rep-rs-centro', name: 'Centro Histórico' },
          { id: 'rep-rs-alameda', name: 'Paseo de la Alameda' },
        ],
      },
    ],
  },
];

export const INITIAL_MARKETPLACE_CONFIG: MarketplaceConfig = {
  name: 'Marketplace',
  slogan: 'Conecta directo con tiendas y proveedores • Múltiples Monedas y Tasas de Cambio en Vivo',
  logoUrl: 'local:logo', // Tienda fusionada con celular
  defaultStoreLogoUrl: 'local:store', // Establecimiento con toldo
  defaultProductImageUrl: 'local:product', // Bolsa de compras
  bannerUrl: 'local:banner', // Cajas estibadas
  bannerTitle: 'Compra directo a tiendas y proveedores por WhatsApp',
  bannerSubtitle: 'Sin pasarelas de pago ni intermediarios. Explora productos y servicios de múltiples proveedores, compara precios en diversas monedas con tasas de cambio en tiempo real y coordina tu compra con un solo clic.',
  primaryColor: '#4f46e5', // indigo-600
  secondaryColor: '#0284c7', // sky-600
  accentColor: '#10b981', // emerald-500
  socialLinks: {
    whatsapp: '+1 555 123 4567',
    telegram: 'https://t.me/marketplacedemo',
    instagram: 'https://instagram.com/marketplacedemo',
    facebook: 'https://facebook.com/marketplacedemo',
    twitter: 'https://x.com/marketplacedemo',
    linkedin: '',
  },
  geoCatalog: INITIAL_GEO_CATALOG,
  departmentsCatalog: INITIAL_DEPARTMENT_CATALOG,
  tagsCatalog: INITIAL_TAGS_CATALOG,
  productTypesCatalog: INITIAL_PRODUCT_TYPES_CATALOG,
  paymentMethodsCatalog: INITIAL_PAYMENT_METHODS_CATALOG,
  paymentPlatformsCatalog: INITIAL_PAYMENT_PLATFORMS_CATALOG,
  deliveryMethodsCatalog: INITIAL_DELIVERY_METHODS_CATALOG,
  currenciesCatalog: INITIAL_CURRENCIES_CATALOG,
  baseCurrency: 'USD',
  secondaryCurrency: 'EUR',
  globalExchangeRate: 0.92,
  globalExchangeRates: [
    { id: 'rate-usd-eur', fromCurrency: 'USD', toCurrency: 'EUR', rate: 0.92 },
  ],
  uiTexts: DEFAULT_INTERFAZ,
};


export const PRESET_MARKETPLACE_LOGOS = [
  { label: 'Ícono Por Defecto (Tienda + Celular)', url: 'local:logo' },
  { label: 'Emblema Comercio Digital', url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=300&q=80' },
  { label: 'Logo Tienda Digital / Carrito', url: 'https://images.unsplash.com/photo-1556742049-0a67d55febc4?auto=format&fit=crop&w=300&q=80' },
  { label: 'Emblema Sol y Palma', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=300&q=80' },
  { label: 'Bolsa de Compras Express', url: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=300&q=80' },
  { label: 'Sello Comercio Internacional', url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80' },
];

export const PRESET_BRAND_COLORS = [
  { label: 'Indigo Corporativo (Por Defecto)', primary: '#4f46e5', secondary: '#0284c7' },
  { label: 'Verde Esmeralda / Naturaleza', primary: '#16a34a', secondary: '#15803d' },
  { label: 'Rojo Coral / Dinámico', primary: '#e11d48', secondary: '#f97316' },
  { label: 'Azul Océano / Elegante', primary: '#0284c7', secondary: '#0d9488' },
  { label: 'Ámbar Dorado / Comercial', primary: '#d97706', secondary: '#b45309' },
  { label: 'Púrpura Vibrante / Moderno', primary: '#7c3aed', secondary: '#db2777' },
  { label: 'Gris Ejecutivo / Oscuro', primary: '#1e293b', secondary: '#475569' },
];

export const INITIAL_CATEGORIES: CategoryItem[] = [
  {
    id: 'Alimentos y Combos',
    name: 'Alimentos y Combos',
    iconName: 'ShoppingBag',
    description: 'Combos de cárnicos, abarrotes, lácteos y productos frescos para el hogar'
  },
  {
    id: 'Electrodomésticos y Hogar',
    name: 'Electrodomésticos y Hogar',
    iconName: 'Tv',
    description: 'Refrigeradores, ventiladores recargables, cocinas eléctricas, ollas reina y TV'
  },
  {
    id: 'Celulares y Electrónica',
    name: 'Celulares y Electrónica',
    iconName: 'Smartphone',
    description: 'Smartphones, cargadores solares, powerbanks, inversores de corriente y baterías'
  },
  {
    id: 'Motos y Repuestos',
    name: 'Motos y Repuestos',
    iconName: 'Bike',
    description: 'Motos eléctricas, baterías de litio, neumáticos, gomas y repuestos mecánicos'
  },
  {
    id: 'Ropa y Calzado',
    name: 'Ropa y Calzado',
    iconName: 'Shirt',
    description: 'Ropa importada, tenis de marca, calzado cómodo y accesorios de vestir'
  },
  {
    id: 'Ferretería y Construcción',
    name: 'Ferretería y Construcción',
    iconName: 'Wrench',
    description: 'Herramientas, turbinas de agua, pintura, cables eléctricos y herrajes'
  },
  {
    id: 'Servicios Profesionales',
    name: 'Servicios Profesionales',
    iconName: 'Briefcase',
    description: 'Reparación de electrodomésticos, plomería, informática, electricidad y trámites'
  },
  {
    id: 'Belleza y Salud',
    name: 'Belleza y Salud',
    iconName: 'Sparkles',
    description: 'Perfumes, queratinas, maquillaje, cosméticos y artículos de cuidado personal'
  },
  {
    id: 'Hogar y Decoración',
    name: 'Hogar y Decoración',
    iconName: 'Home',
    description: 'Muebles, colchones, lámparas LED recargables y artículos de cocina'
  },
  {
    id: 'Otros',
    name: 'Otros Productos',
    iconName: 'Package',
    description: 'Artículos diversos y ofertas generales'
  }
];

export const INITIAL_STORES: Store[] = [
  {
    id: 'store-1',
    name: 'Habana Combos & Agro',
    logoUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
    slogan: 'Del agro a la puerta de tu casa en menos de 24 horas',
    description: 'Entrega rápida en toda La Habana de combos de comida, cárnicos frescos, lácteos y abarrotes. Calidad garantizada.',
    whatsappPhone: '+5352345678',
    location: 'La Habana - Vedado',
    address: {
      street: 'Calle 23',
      number: '#458',
      building: 'Edif. Girón',
      apartment: 'Apto 4B',
      crossStreet1: 'Entre H y I',
      crossStreet2: 'I',
      neighborhood: 'El Vedado',
      municipality: 'Plaza de la Revolución',
      province: 'La Habana',
      googleMapsUrl: 'https://maps.google.com/?q=Calle+23+y+H+Vedado+La+Habana',
    },
    usdToCupRate: 530, // 1 USD = 530 CUP
    baseCurrency: 'USD',
    secondaryCurrency: 'CUP',
    exchangeRates: [
      { id: 'rate-s1-usd-cup', fromCurrency: 'USD', toCurrency: 'CUP', rate: 530 },
      { id: 'rate-s1-eur-cup', fromCurrency: 'EUR', toCurrency: 'CUP', rate: 560 },
    ],
    ratePaymentMethods: [
      {
        id: 'rpm-s1-usdcup-cash',
        storeId: 'store-1',
        exchangeRateId: 'rate-s1-usd-cup',
        paymentMethodId: 'pm-efectivo',
        gravamen: 0,
        notes: 'Efectivo en mano sin recargo (0% gravamen)',
      },
      {
        id: 'rpm-s1-usdcup-transf',
        storeId: 'store-1',
        exchangeRateId: 'rate-s1-usd-cup',
        paymentMethodId: 'pm-transferencia',
        gravamen: 10,
        notes: 'Transferencia bancaria (+10% gravamen)',
      },
      {
        id: 'rpm-s1-eurcup-cash',
        storeId: 'store-1',
        exchangeRateId: 'rate-s1-eur-cup',
        paymentMethodId: 'pm-efectivo',
        gravamen: 0,
        notes: 'Efectivo Euros',
      },
      {
        id: 'rpm-s1-eurcup-transf',
        storeId: 'store-1',
        exchangeRateId: 'rate-s1-eur-cup',
        paymentMethodId: 'pm-transferencia',
        gravamen: 10,
        notes: 'Transferencia bancaria (+10% gravamen)',
      },
    ],
    deliveryAvailable: true,
    paymentPlatformIds: ['pp-banmet', 'pp-zelle', 'pp-clasica', 'pp-transfermovil'],
    paymentOptions: {
      transferAccepted: true,
      transferFeePercentage: 0,
      acceptedCurrencies: ['USD', 'CUP', 'MLC', 'Zelle'],
      notes: 'Transferencias en EEUU vía Zelle sin comisión adicional.',
    },
    active: true,
    rating: 4.9,
    badge: 'Envío Domicilio',
    createdAt: '2026-07-15'
  },
  {
    id: 'store-2',
    name: 'TecnoCuba Importaciones',
    logoUrl: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=400&q=80',
    slogan: 'Tecnología solar e inteligente para cada hogar cubano',
    description: 'Especialistas en electrónica para Cuba: teléfonos, ventiladores recargables con panel solar, power stations e inversores.',
    whatsappPhone: '+5354112233',
    location: 'La Habana - Playa',
    address: {
      street: 'Av. 3ra',
      number: '#4208',
      building: '',
      apartment: 'Planta Baja',
      crossStreet1: 'Calle 42',
      crossStreet2: 'Calle 44',
      neighborhood: 'Miramar',
      municipality: 'Playa',
      province: 'La Habana',
      googleMapsUrl: 'https://maps.google.com/?q=Miramar+Playa+La+Habana',
    },
    usdToCupRate: 340, // 1 USD = 340 CUP
    deliveryAvailable: true,
    paymentOptions: {
      transferAccepted: true,
      transferFeePercentage: 5,
      acceptedCurrencies: ['USD', 'CUP', 'EUR', 'USDT'],
      notes: 'Aceptamos criptomonedas y transferencias internacionales (+5% comisión).',
    },
    active: true,
    rating: 4.8,
    badge: 'Tienda Verificada',
    createdAt: '2026-07-10'
  },
  {
    id: 'store-3',
    name: 'El Taller Eléctrico & Piezas',
    logoUrl: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=400&q=80',
    slogan: 'Tu moto siempre en movimiento con respaldo técnico',
    description: 'Todo en motos eléctricas, baterías de litio 72V, gomas, cargadores rápidos y servicios de reparación garantizados.',
    whatsappPhone: '+5353889900',
    location: 'Santa Clara - Villa Clara',
    address: {
      street: 'Carretera Central',
      number: '#102',
      building: 'Local 2',
      apartment: '',
      crossStreet1: 'San Miguel',
      crossStreet2: 'Aleman',
      neighborhood: 'Condado',
      municipality: 'Santa Clara',
      province: 'Villa Clara',
      googleMapsUrl: 'https://maps.google.com/?q=Santa+Clara+Villa+Clara',
    },
    usdToCupRate: 325, // 1 USD = 325 CUP
    deliveryAvailable: false,
    paymentOptions: {
      transferAccepted: true,
      transferFeePercentage: 0,
      acceptedCurrencies: ['CUP', 'USD'],
      notes: 'Pago en efectivo o transferencia CUP al cambio del día.',
    },
    active: true,
    rating: 4.7,
    badge: 'Garantía Técnica',
    createdAt: '2026-07-18'
  },
  {
    id: 'store-4',
    name: 'Boutique Sol & Caribe',
    logoUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400&q=80',
    slogan: 'Estilo internacional, perfumes y calzado de marca original',
    description: 'Moda importada, calzado deportivo de primera, perfumes y cosmética original. Hacemos envíos a Santiago de Cuba y Holguín.',
    whatsappPhone: '+5355667788',
    location: 'Santiago de Cuba',
    address: {
      street: 'Enramadas',
      number: '#315',
      building: '',
      apartment: '2do Piso',
      crossStreet1: 'San Pedro',
      crossStreet2: 'Santo Tomás',
      neighborhood: 'Centro Histórico',
      municipality: 'Santiago de Cuba',
      province: 'Santiago de Cuba',
      googleMapsUrl: 'https://maps.google.com/?q=Enramadas+Santiago+de+Cuba',
    },
    usdToCupRate: 330, // 1 USD = 330 CUP
    deliveryAvailable: true,
    paymentOptions: {
      transferAccepted: true,
      transferFeePercentage: 3,
      acceptedCurrencies: ['USD', 'CUP', 'EUR'],
      notes: 'Aceptamos transferencias y efectivo USD/CUP.',
    },
    active: true,
    rating: 4.9,
    badge: 'Original 100%',
    createdAt: '2026-07-20'
  },
  {
    id: 'store-5',
    name: 'Ferretería & Muebles Habana',
    logoUrl: 'https://images.unsplash.com/photo-1581783898377-1c85bf937427?auto=format&fit=crop&w=400&q=80',
    slogan: 'Soluciones duraderas para la construcción y el confort de tu hogar',
    description: 'Turbinas de agua, cables eléctricos de cobre, herramientas profesionales y muebles para el hogar. Trato directo.',
    whatsappPhone: '+5356778899',
    location: 'La Habana - Diez de Octubre',
    address: {
      street: 'Calzada de Diez de Octubre',
      number: '#1204',
      building: '',
      apartment: '',
      crossStreet1: 'Concepción',
      crossStreet2: 'Serrano',
      neighborhood: 'Santos Suárez',
      municipality: 'Diez de Octubre',
      province: 'La Habana',
      googleMapsUrl: 'https://maps.google.com/?q=Santos+Suarez+Diez+de+Octubre+La+Habana',
    },
    usdToCupRate: 338, // 1 USD = 338 CUP
    deliveryAvailable: true,
    paymentOptions: {
      transferAccepted: false,
      transferFeePercentage: 0,
      acceptedCurrencies: ['USD', 'CUP'],
      notes: 'Solo pago contra entrega al momento de recibir.',
    },
    active: true,
    rating: 4.8,
    badge: 'Ferretería Completa',
    createdAt: '2026-07-22'
  },
  {
    id: 'store-6',
    name: 'ElectroHogar San Isidro',
    logoUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80',
    slogan: 'Climatización, televisores y cocinas para la familia',
    description: 'Equipos para el hogar importados, ventiladores, split de aire acondicionado y ollas eléctricas.',
    whatsappPhone: '+5357889900',
    location: 'La Habana - La Habana Vieja',
    address: {
      street: 'Compostela',
      number: '#512',
      building: '',
      apartment: '',
      crossStreet1: 'Luz',
      crossStreet2: 'Acosta',
      neighborhood: 'San Isidro',
      municipality: 'La Habana Vieja',
      province: 'La Habana',
      googleMapsUrl: '',
    },
    usdToCupRate: 336,
    deliveryAvailable: true,
    paymentOptions: {
      transferAccepted: true,
      transferFeePercentage: 2,
      acceptedCurrencies: ['USD', 'CUP'],
      notes: 'Transferencias rápidas.',
    },
    active: true,
    rating: 4.7,
    badge: 'Hogar & Confort',
    createdAt: '2026-07-23'
  },
  {
    id: 'store-7',
    name: 'AgroMercado El Cotorro',
    logoUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
    slogan: 'Productos frescos del campo directamente a tu mesa',
    description: 'Combos cárnicos, viandas, hortalizas, frijoles y enlatados al por mayor y al detalle.',
    whatsappPhone: '+5358990011',
    location: 'La Habana - Cotorro',
    address: {
      street: 'Calle 101',
      number: '#20',
      building: '',
      apartment: '',
      crossStreet1: '20',
      crossStreet2: '22',
      neighborhood: 'Lotería',
      municipality: 'Cotorro',
      province: 'La Habana',
      googleMapsUrl: '',
    },
    usdToCupRate: 332,
    deliveryAvailable: true,
    paymentOptions: {
      transferAccepted: true,
      transferFeePercentage: 0,
      acceptedCurrencies: ['USD', 'CUP'],
      notes: 'Envío expreso en La Habana.',
    },
    active: true,
    rating: 4.9,
    badge: 'Frescura Garantizada',
    createdAt: '2026-07-24'
  },
  {
    id: 'store-8',
    name: 'Repuestos y Motos Camagüey',
    logoUrl: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=400&q=80',
    slogan: 'Líderes en repuestos de motos eléctricas y gel en el centro de Cuba',
    description: 'Gomas, frenos, bandas, cadenas, baterías y cargadores para todas las marcas.',
    whatsappPhone: '+5359001122',
    location: 'Camagüey - Camagüey',
    address: {
      street: 'Av. de la Libertad',
      number: '#88',
      building: '',
      apartment: '',
      crossStreet1: 'Caridad',
      crossStreet2: 'República',
      neighborhood: 'La Caridad',
      municipality: 'Camagüey',
      province: 'Camagüey',
      googleMapsUrl: '',
    },
    usdToCupRate: 328,
    deliveryAvailable: false,
    paymentOptions: {
      transferAccepted: true,
      transferFeePercentage: 0,
      acceptedCurrencies: ['USD', 'CUP'],
      notes: '',
    },
    active: true,
    rating: 4.6,
    badge: 'Especialista en Motos',
    createdAt: '2026-07-25'
  },
  {
    id: 'store-9',
    name: 'Zapatería & Confecciones Varadero',
    logoUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400&q=80',
    slogan: 'Moda playera, tenis importados y calzado de vestir',
    description: 'Chancletas, sandalias, zapatillas deportivas y vestidos frescos de verano.',
    whatsappPhone: '+5350112233',
    location: 'Matanzas - Cárdenas',
    address: {
      street: 'Primera Avenida',
      number: '#42',
      building: '',
      apartment: '',
      crossStreet1: 'Calle 42',
      crossStreet2: 'Calle 43',
      neighborhood: 'Varadero',
      municipality: 'Cárdenas',
      province: 'Matanzas',
      googleMapsUrl: '',
    },
    usdToCupRate: 335,
    deliveryAvailable: true,
    paymentOptions: {
      transferAccepted: true,
      transferFeePercentage: 0,
      acceptedCurrencies: ['USD', 'CUP'],
      notes: '',
    },
    active: true,
    rating: 4.8,
    badge: 'Moda Importada',
    createdAt: '2026-07-26'
  },
  {
    id: 'store-10',
    name: 'Multiservicios Holguín',
    logoUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80',
    slogan: 'Taller de reparación de celulares, laptops y electrodomésticos',
    description: 'Servicio técnico especializado con repuestos originales y garantía por escrito.',
    whatsappPhone: '+5351223344',
    location: 'Holguín - Holguín',
    address: {
      street: 'Maceo',
      number: '#120',
      building: '',
      apartment: '',
      crossStreet1: 'Aricochea',
      crossStreet2: 'Cables',
      neighborhood: 'Centro',
      municipality: 'Holguín',
      province: 'Holguín',
      googleMapsUrl: '',
    },
    usdToCupRate: 327,
    deliveryAvailable: true,
    paymentOptions: {
      transferAccepted: true,
      transferFeePercentage: 0,
      acceptedCurrencies: ['USD', 'CUP'],
      notes: '',
    },
    active: true,
    rating: 4.9,
    badge: 'Servicio Técnico',
    createdAt: '2026-07-27'
  },
  {
    id: 'store-11',
    name: 'Mundo Celular & Solar',
    logoUrl: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=400&q=80',
    slogan: 'Accesorios móviles, powerbanks y luces LED solares',
    description: 'Cargadores para autos, cables tipo C, estuches, micas de cristal y lámparas solares.',
    whatsappPhone: '+5352334455',
    location: 'La Habana - Playa',
    address: {
      street: 'Calle 60',
      number: '#112',
      building: '',
      apartment: '',
      crossStreet1: '1ra',
      crossStreet2: '3ra',
      neighborhood: 'Miramar',
      municipality: 'Playa',
      province: 'La Habana',
      googleMapsUrl: '',
    },
    usdToCupRate: 337,
    deliveryAvailable: true,
    paymentOptions: {
      transferAccepted: true,
      transferFeePercentage: 0,
      acceptedCurrencies: ['USD', 'CUP'],
      notes: '',
    },
    active: true,
    rating: 4.8,
    badge: 'Accesorios',
    createdAt: '2026-07-28'
  },
  {
    id: 'store-12',
    name: 'Servicios de Plomería & Gas Habana',
    logoUrl: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=400&q=80',
    slogan: 'Instalaciones hidráulicas, plomería de emergencia y gas',
    description: 'Reparación de tubos, colocación de tanques de agua, bombas automáticas y presurizadores.',
    whatsappPhone: '+5353445566',
    location: 'La Habana - Plaza de la Revolución',
    address: {
      street: 'Calle L',
      number: '#250',
      building: '',
      apartment: '',
      crossStreet1: '17',
      crossStreet2: '19',
      neighborhood: 'El Vedado',
      municipality: 'Plaza de la Revolución',
      province: 'La Habana',
      googleMapsUrl: '',
    },
    usdToCupRate: 335,
    deliveryAvailable: true,
    paymentOptions: {
      transferAccepted: true,
      transferFeePercentage: 0,
      acceptedCurrencies: ['USD', 'CUP'],
      notes: '',
    },
    active: true,
    rating: 5.0,
    badge: 'Plomería 24H',
    createdAt: '2026-07-29'
  },
  {
    id: 'store-13',
    name: 'ElectroMáx Habana',
    logoUrl: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=400&q=80',
    slogan: 'Venta de electrodomésticos y tecnología (Desconectada)',
    description: 'Tienda temporalmente fuera de línea. Gran variedad de ollas multipropósito, batidoras y freidoras de aire.',
    whatsappPhone: '+5352998877',
    location: 'La Habana - Diez de Octubre',
    address: {
      street: 'Calle Santa Catalina',
      number: '#412',
      building: '',
      apartment: '',
      crossStreet1: 'General Lee',
      crossStreet2: 'Saco',
      neighborhood: 'Santos Suárez',
      municipality: 'Diez de Octubre',
      province: 'La Habana',
      googleMapsUrl: '',
    },
    usdToCupRate: 670,
    deliveryAvailable: true,
    paymentOptions: {
      transferAccepted: true,
      transferFeePercentage: 10,
      acceptedCurrencies: ['USD', 'CUP'],
      notes: '',
    },
    active: false,
    rating: 4.6,
    badge: 'Inactiva',
    createdAt: '2026-08-01'
  }
].map((s: any): Store => {
  const storeRates = s.exchangeRates && s.exchangeRates.length > 0
    ? s.exchangeRates
    : [
        {
          id: `rate-${s.id}-usd-eur`,
          storeId: s.id,
          fromCurrency: 'USD',
          toCurrency: 'EUR',
          rate: s.usdToCupRate || 0.92,
        },
      ];

  const hasTransfer = Boolean(s.paymentOptions?.transferAccepted);
  const explicitCpm = s.currencyPaymentMethods && s.currencyPaymentMethods.length > 0
    ? s.currencyPaymentMethods
    : [
        // USD: Efectivo
        {
          id: `cpm-${s.id}-usd-cash`,
          storeId: s.id,
          currency: 'USD',
          paymentMethodId: 'pm-efectivo',
          notes: 'Pago en mano en local o entrega',
        },
        // USD: Transferencia
        ...(hasTransfer
          ? [
              {
                id: `cpm-${s.id}-usd-transf`,
                storeId: s.id,
                currency: 'USD',
                paymentMethodId: 'pm-transferencia',
                notes: 'Transferencia bancaria o digital',
              },
            ]
          : []),
        // EUR
        ...(s.paymentOptions?.acceptedCurrencies?.includes('EUR')
          ? [
              {
                id: `cpm-${s.id}-eur-cash`,
                storeId: s.id,
                currency: 'EUR',
                paymentMethodId: 'pm-efectivo',
                notes: 'Pago en mano en Euros',
              },
            ]
          : []),
      ];

  const derivedPayIds = Array.from(new Set(explicitCpm.map((item: any) => item.paymentMethodId)));

  return {
    ...s,
    exchangeRates: storeRates,
    usdToCupRate: s.usdToCupRate || (storeRates[0]?.rate || 1),
    currencyPaymentMethods: explicitCpm,
    paymentMethodIds: s.paymentMethodIds && s.paymentMethodIds.length > 0 ? s.paymentMethodIds : derivedPayIds,
  };
});

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    code: 'PRD-001',
    storeId: 'store-1',
    title: 'Combo Familiar Premium #1 (Cerdo, Queso y Aceite)',
    description: 'Incluye: 10 lb de carne de cerdo limpia, 5 lb de jamón cocido, 1 barra de queso Gouda importado (3 kg), 2 botellas de aceite vegetal de 1 L y paquete de leche en polvo de 1 kg. Entrega incluida en zona céntrica.',
    priceUSD: 78,
    category: 'Alimentos y Combos',
    subcategory: 'Carnes y Embutidos',
    imageUrl: 'https://images.unsplash.com/photo-1506484381205-f7945653044d?auto=format&fit=crop&w=700&q=80',
    isAvailable: true,
    productTypeId: 'pt-producto',
    productType: 'Productos Físicos',
    deliveryAvailable: true,
    featured: true,
    tagSelections: [
      { groupId: 'tg-estado', groupName: 'Estado / Condición', tagId: 'tag-nuevo', tagName: 'Nuevo Sello', group: 'Estado / Condición', value: 'Nuevo Sello' },
      { groupId: 'tg-estaciones', groupName: 'Estaciones', tagId: 'tag-verano', tagName: 'Verano', group: 'Estaciones', value: 'Verano' },
    ],
    tags: ['combo', 'cerdo', 'queso', 'aceite', 'leche', 'alimentos', 'Nuevo Sello', 'Verano'],
    createdAt: '2026-07-25'
  },
  {
    id: 'prod-2',
    code: 'PRD-002',
    storeId: 'store-1',
    title: 'Caja de Pollo Importado (15 kg / 33 libras)',
    description: 'Caja sellada de cuartos de pollo importado de primera calidad (33 lb aprox). Ideal para consumo familiar o negocios particulares. Listo para entregar hoy en La Habana.',
    priceUSD: 42,
    category: 'Alimentos y Combos',
    subcategory: 'Carnes y Embutidos',
    imageUrl: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=700&q=80',
    isAvailable: true,
    productTypeId: 'pt-producto',
    productType: 'Productos Físicos',
    deliveryAvailable: true,
    featured: true,
    tagSelections: [
      { groupId: 'tg-estado', groupName: 'Estado / Condición', tagId: 'tag-nuevo', tagName: 'Nuevo Sello', group: 'Estado / Condición', value: 'Nuevo Sello' }
    ],
    tags: ['pollo', 'caja', 'carne', 'congelado', 'habana', 'Nuevo Sello'],
    createdAt: '2026-07-26'
  },
  {
    id: 'prod-3',
    code: 'PRD-003',
    storeId: 'store-2',
    title: 'Ventilador Recargable 16" con Panel Solar + Bombillos LED',
    description: 'Ventilador de 16 pulgadas con batería de litio integrada de 12,000 mAh. Incluye panel solar impermeable, 2 bombillos LED externos y puerto USB para cargar teléfonos celulares. Autonomía de 8 a 12 horas.',
    priceUSD: 65,
    category: 'Electrodomésticos y Hogar',
    subcategory: 'Climatización y Ventiladores',
    imageUrl: 'https://images.unsplash.com/photo-1558611848-73f7eb4001a1?auto=format&fit=crop&w=700&q=80',
    isAvailable: true,
    productTypeId: 'pt-producto',
    productType: 'Productos Físicos',
    deliveryAvailable: true,
    featured: true,
    tagSelections: [
      { groupId: 'tg-color', groupName: 'Color', tagId: 'tag-blanco', tagName: 'Blanco', group: 'Color', value: 'Blanco' },
      { groupId: 'tg-estaciones', groupName: 'Estaciones', tagId: 'tag-verano', tagName: 'Verano', group: 'Estaciones', value: 'Verano' },
      { groupId: 'tg-garantia', groupName: 'Garantía', tagId: 'tag-3meses', tagName: '3 Meses', group: 'Garantía', value: '3 Meses' },
      { groupId: 'tg-estado', groupName: 'Estado / Condición', tagId: 'tag-nuevo', tagName: 'Nuevo Sello', group: 'Estado / Condición', value: 'Nuevo Sello' }
    ],
    tags: ['ventilador', 'recargable', 'solar', 'led', 'bateria', 'apagon', 'Blanco', 'Verano', '3 Meses', 'Nuevo Sello'],
    createdAt: '2026-07-27'
  },
  {
    id: 'prod-4',
    code: 'PRD-004',
    storeId: 'store-2',
    title: 'Inversor de Corriente 1000W Onda Pura + Cargador Inteligente',
    description: 'Inversor inteligente para encender televisor, ventiladores, laptop e iluminación durante cortes de energía. Compatible con baterías de 12V. Protección contra sobrecarga y cortocircuito.',
    priceUSD: 115,
    category: 'Electrodomésticos y Hogar',
    subcategory: 'Bombas de Agua e Inversores',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=700&q=80',
    isAvailable: true,
    productTypeId: 'pt-producto',
    productType: 'Productos Físicos',
    deliveryAvailable: true,
    featured: false,
    tagSelections: [
      { groupId: 'tg-color', groupName: 'Color', tagId: 'tag-negro', tagName: 'Negro', group: 'Color', value: 'Negro' },
      { groupId: 'tg-garantia', groupName: 'Garantía', tagId: 'tag-6meses', tagName: '6 Meses', group: 'Garantía', value: '6 Meses' },
      { groupId: 'tg-estado', groupName: 'Estado / Condición', tagId: 'tag-nuevo', tagName: 'Nuevo Sello', group: 'Estado / Condición', value: 'Nuevo Sello' }
    ],
    tags: ['inversor', 'bateria', 'corriente', 'energia', '1000w', 'Negro', '6 Meses', 'Nuevo Sello'],
    createdAt: '2026-07-28'
  },
  {
    id: 'prod-5',
    code: 'PRD-005',
    storeId: 'store-2',
    title: 'Samsung Galaxy A55 5G (8GB RAM / 256GB / Sellado)',
    description: 'Teléfono nuevo sellado con garantía de la tienda. Pantalla Super AMOLED 120Hz, cámara de 50MP y batería de 5000 mAh. Liberado para todas las redes en Cuba (Cubacel 4G/LTE).',
    priceUSD: 310,
    category: 'Celulares y Electrónica',
    subcategory: 'Teléfonos Inteligentes',
    imageUrl: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=700&q=80',
    isAvailable: true,
    productTypeId: 'pt-producto',
    productType: 'Productos Físicos',
    deliveryAvailable: true,
    featured: true,
    tagSelections: [
      { groupId: 'tg-color', groupName: 'Color', tagId: 'tag-azul', tagName: 'Azul', group: 'Color', value: 'Azul' },
      { groupId: 'tg-estado', groupName: 'Estado / Condición', tagId: 'tag-nuevo', tagName: 'Nuevo Sello', group: 'Estado / Condición', value: 'Nuevo Sello' },
      { groupId: 'tg-garantia', groupName: 'Garantía', tagId: 'tag-1ano', tagName: '1 Año', group: 'Garantía', value: '1 Año' }
    ],
    tags: ['samsung', 'celular', 'smartphone', 'a55', '5g', 'cubacel', 'Azul', 'Nuevo Sello', '1 Año'],
    createdAt: '2026-07-29'
  },
  {
    id: 'prod-6',
    code: 'PRD-006',
    storeId: 'store-3',
    title: 'Batería de Litio para Moto Eléctrica 72V 45Ah (Garantía 1 Año)',
    description: 'Batería de litio de alta calidad con celdas importadas. Brinda hasta 90 km de autonomía reales por carga. Incluye cargador rápido inteligente y cajuela de aluminio.',
    priceUSD: 520,
    category: 'Motos y Repuestos',
    subcategory: 'Baterías de Litio / Gel',
    imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=700&q=80',
    isAvailable: true,
    productTypeId: 'pt-producto',
    productType: 'Productos Físicos',
    deliveryAvailable: false,
    featured: true,
    tagSelections: [
      { groupId: 'tg-color', groupName: 'Color', tagId: 'tag-gris', tagName: 'Gris', group: 'Color', value: 'Gris' },
      { groupId: 'tg-garantia', groupName: 'Garantía', tagId: 'tag-1ano', tagName: '1 Año', group: 'Garantía', value: '1 Año' },
      { groupId: 'tg-estado', groupName: 'Estado / Condición', tagId: 'tag-nuevo', tagName: 'Nuevo Sello', group: 'Estado / Condición', value: 'Nuevo Sello' }
    ],
    tags: ['bateria', 'litio', '72v', 'moto', 'autonomia', 'repuestos', 'Gris', '1 Año', 'Nuevo Sello'],
    createdAt: '2026-07-30'
  },
  {
    id: 'prod-7',
    code: 'PRD-007',
    storeId: 'store-3',
    title: 'Servicio de Reparación y Mantenimiento de Motos Eléctricas',
    description: 'Diagnóstico electrónico, cambio de rodamientos, reparación de centralita (controlador), frenos y mantenimiento integral de su moto eléctrica en Santa Clara. Atendemos a domicilio.',
    priceUSD: 15,
    category: 'Servicios Profesionales',
    subcategory: 'Mantenimiento y Taller',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=700&q=80',
    isAvailable: true,
    productTypeId: 'pt-servicio',
    productType: 'Servicios Profesionales',
    deliveryAvailable: true,
    featured: false,
    tagSelections: [
      { groupId: 'tg-garantia', groupName: 'Garantía', tagId: 'tag-1mes', tagName: '1 Mes', group: 'Garantía', value: '1 Mes' }
    ],
    tags: ['servicio', 'taller', 'reparacion', 'moto', 'mantenimiento', '1 Mes'],
    createdAt: '2026-07-28'
  },
  {
    id: 'prod-8',
    code: 'PRD-008',
    storeId: 'store-4',
    title: 'Tenis Deportivo Nike Air Max 270 (Tallas 38 a 44)',
    description: 'Calzado 100% original con amortiguación de aire visible. Ideal para caminar largas distancias y deportes. Consultar color y número exacto por WhatsApp.',
    priceUSD: 75,
    category: 'Ropa y Calzado',
    subcategory: 'Calzado Deportivo',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=700&q=80',
    isAvailable: true,
    productTypeId: 'pt-producto',
    productType: 'Productos Físicos',
    deliveryAvailable: true,
    featured: false,
    tagSelections: [
      { groupId: 'tg-color', groupName: 'Color', tagId: 'tag-negro', tagName: 'Negro', group: 'Color', value: 'Negro' },
      { groupId: 'tg-color', groupName: 'Color', tagId: 'tag-rojo', tagName: 'Rojo', group: 'Color', value: 'Rojo' },
      { groupId: 'tg-estaciones', groupName: 'Estaciones', tagId: 'tag-verano', tagName: 'Verano', group: 'Estaciones', value: 'Verano' },
      { groupId: 'tg-estado', groupName: 'Estado / Condición', tagId: 'tag-nuevo', tagName: 'Nuevo Sello', group: 'Estado / Condición', value: 'Nuevo Sello' }
    ],
    tags: ['tenis', 'nike', 'calzado', 'zapatillas', 'moda', 'Negro', 'Rojo', 'Verano', 'Nuevo Sello'],
    createdAt: '2026-07-29'
  },
  {
    id: 'prod-9',
    code: 'PRD-009',
    storeId: 'store-4',
    title: 'Kit de Belleza y Queratina Brasileña Profesional (1 Litro)',
    description: 'Tratamiento alisador profesional anti-frizz libre de formol + shampoo sin sal + mascarilla hidratante. Rinde para más de 12 aplicaciones.',
    priceUSD: 38,
    category: 'Belleza y Salud',
    subcategory: 'Capilar y Queratinas',
    imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=700&q=80',
    isAvailable: true,
    productTypeId: 'pt-producto',
    productType: 'Productos Físicos',
    deliveryAvailable: true,
    featured: false,
    tagSelections: [
      { groupId: 'tg-estado', groupName: 'Estado / Condición', tagId: 'tag-nuevo', tagName: 'Nuevo Sello', group: 'Estado / Condición', value: 'Nuevo Sello' },
      { groupId: 'tg-estaciones', groupName: 'Estaciones', tagId: 'tag-verano', tagName: 'Verano', group: 'Estaciones', value: 'Verano' }
    ],
    tags: ['queratina', 'belleza', 'cabello', 'shampoo', 'cosmeticos', 'Nuevo Sello', 'Verano'],
    createdAt: '2026-07-30'
  },
  {
    id: 'prod-10',
    code: 'PRD-010',
    storeId: 'store-5',
    title: 'Turbina de Agua 1/2 HP de Cobre (Silenciosa y Potente)',
    description: 'Bomba de agua eléctrica 110V/220V con bobinado 100% de cobre. Sube agua con excelente presión hasta 3er piso sin problemas. Garantía de 6 meses.',
    priceUSD: 55,
    category: 'Ferretería y Construcción',
    subcategory: 'Plomería y Tuberías',
    imageUrl: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=700&q=80',
    isAvailable: true,
    productTypeId: 'pt-producto',
    productType: 'Productos Físicos',
    deliveryAvailable: true,
    featured: true,
    tagSelections: [
      { groupId: 'tg-color', groupName: 'Color', tagId: 'tag-azul', tagName: 'Azul', group: 'Color', value: 'Azul' },
      { groupId: 'tg-garantia', groupName: 'Garantía', tagId: 'tag-6meses', tagName: '6 Meses', group: 'Garantía', value: '6 Meses' },
      { groupId: 'tg-estado', groupName: 'Estado / Condición', tagId: 'tag-nuevo', tagName: 'Nuevo Sello', group: 'Estado / Condición', value: 'Nuevo Sello' }
    ],
    tags: ['turbina', 'agua', 'cobre', 'bomba', 'ferreteria', 'Azul', '6 Meses', 'Nuevo Sello'],
    createdAt: '2026-07-31'
  },
  {
    id: 'prod-11',
    code: 'PRD-011',
    storeId: 'store-5',
    title: 'Rollo de Cable Eléctrico #10 y #12 de Cobre (100 metros)',
    description: 'Rollo de cable eléctrico AWG marca importada para instalaciones residenciales. Aislamiento termo-resistente de alta seguridad. Consultar calibre por WhatsApp.',
    priceUSD: 60,
    category: 'Ferretería y Construcción',
    subcategory: 'Electricidad e Iluminación',
    imageUrl: 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?auto=format&fit=crop&w=700&q=80',
    isAvailable: true,
    productTypeId: 'pt-producto',
    productType: 'Productos Físicos',
    deliveryAvailable: true,
    featured: false,
    tagSelections: [
      { groupId: 'tg-color', groupName: 'Color', tagId: 'tag-rojo', tagName: 'Rojo', group: 'Color', value: 'Rojo' },
      { groupId: 'tg-estado', groupName: 'Estado / Condición', tagId: 'tag-nuevo', tagName: 'Nuevo Sello', group: 'Estado / Condición', value: 'Nuevo Sello' }
    ],
    tags: ['cable', 'cobre', 'electricidad', 'rollo', 'construccion', 'Rojo', 'Nuevo Sello'],
    createdAt: '2026-07-31'
  },
  {
    id: 'prod-12',
    code: 'PRD-012',
    storeId: 'store-1',
    title: 'Olla Reina Eléctrica Multifunción 6 Litros (Acero Inoxidable)',
    description: 'Olla a presión eléctrica programable de 6 litros. Cocina frijoles, carne de cerdo, arroz y guisos en tiempo récord ahorrando corriente. Fácil limpieza.',
    priceUSD: 54,
    category: 'Electrodomésticos y Hogar',
    subcategory: 'Cocina y Olla Reina',
    imageUrl: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=700&q=80',
    isAvailable: true,
    productTypeId: 'pt-producto',
    productType: 'Productos Físicos',
    deliveryAvailable: true,
    featured: false,
    tagSelections: [
      { groupId: 'tg-color', groupName: 'Color', tagId: 'tag-gris', tagName: 'Gris', group: 'Color', value: 'Gris' },
      { groupId: 'tg-garantia', groupName: 'Garantía', tagId: 'tag-3meses', tagName: '3 Meses', group: 'Garantía', value: '3 Meses' },
      { groupId: 'tg-estado', groupName: 'Estado / Condición', tagId: 'tag-nuevo', tagName: 'Nuevo Sello', group: 'Estado / Condición', value: 'Nuevo Sello' }
    ],
    tags: ['olla', 'reina', 'electrica', 'cocina', 'acero', 'Gris', '3 Meses', 'Nuevo Sello'],
    createdAt: '2026-07-31'
  },
  {
    id: 'prod-13',
    code: 'PRD-013',
    storeId: 'store-6',
    title: 'Televisor Smart LED 43" 4K UHD con Control de Voz y Wi-Fi',
    description: 'Televisor inteligente de 43 pulgadas con entrada HDMI, USB y sistema para instalar aplicaciones de streaming.',
    priceUSD: 285,
    category: 'Electrodomésticos y Hogar',
    subcategory: 'Climatización y Ventiladores',
    imageUrl: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=700&q=80',
    isAvailable: true,
    productTypeId: 'pt-producto',
    productType: 'Productos Físicos',
    deliveryAvailable: true,
    featured: true,
    tagSelections: [
      { groupId: 'tg-color', groupName: 'Color', tagId: 'tag-negro', tagName: 'Negro', group: 'Color', value: 'Negro' },
      { groupId: 'tg-garantia', groupName: 'Garantía', tagId: 'tag-1ano', tagName: '1 Año', group: 'Garantía', value: '1 Año' },
      { groupId: 'tg-estado', groupName: 'Estado / Condición', tagId: 'tag-nuevo', tagName: 'Nuevo Sello', group: 'Estado / Condición', value: 'Nuevo Sello' }
    ],
    tags: ['tv', 'televisor', 'smart', '4k', 'electrodomesticos', 'Negro', '1 Año', 'Nuevo Sello'],
    createdAt: '2026-08-01'
  },
  {
    id: 'prod-14',
    code: 'PRD-014',
    storeId: 'store-8',
    title: 'Bicicleta Eléctrica Plegable 36V 250W con Pedaleo Asistido',
    description: 'Ideal para la ciudad, autonomía de 45 km por carga, velocidad máxima 30 km/h y batería removible.',
    priceUSD: 410,
    category: 'Motos y Repuestos',
    subcategory: 'Baterías de Litio / Gel',
    imageUrl: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=700&q=80',
    isAvailable: true,
    productTypeId: 'pt-producto',
    productType: 'Productos Físicos',
    deliveryAvailable: false,
    featured: true,
    tagSelections: [
      { groupId: 'tg-color', groupName: 'Color', tagId: 'tag-blanco', tagName: 'Blanco', group: 'Color', value: 'Blanco' },
      { groupId: 'tg-garantia', groupName: 'Garantía', tagId: 'tag-6meses', tagName: '6 Meses', group: 'Garantía', value: '6 Meses' },
      { groupId: 'tg-estado', groupName: 'Estado / Condición', tagId: 'tag-nuevo', tagName: 'Nuevo Sello', group: 'Estado / Condición', value: 'Nuevo Sello' }
    ],
    tags: ['bicicleta', 'electrica', '36v', 'plegable', 'movilidad', 'Blanco', '6 Meses', 'Nuevo Sello'],
    createdAt: '2026-08-02'
  },
  {
    id: 'prod-15',
    code: 'PRD-015',
    storeId: 'store-7',
    title: 'Combo AgroEspecial (15 lb Carne Cerdo + 10 lb Frijol Negro + 2L Aceite)',
    description: 'Súper combo fresco del campo: banda de cerdo magra de 15 lb, frijol negro limpio y 2 litros de aceite vegetal.',
    priceUSD: 68,
    category: 'Alimentos y Combos',
    subcategory: 'Carnes y Embutidos',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=700&q=80',
    isAvailable: true,
    productTypeId: 'pt-producto',
    productType: 'Productos Físicos',
    deliveryAvailable: true,
    featured: true,
    tagSelections: [
      { groupId: 'tg-estado', groupName: 'Estado / Condición', tagId: 'tag-nuevo', tagName: 'Nuevo Sello', group: 'Estado / Condición', value: 'Nuevo Sello' }
    ],
    tags: ['combo', 'cerdo', 'frijol', 'agro', 'habana', 'Nuevo Sello'],
    createdAt: '2026-08-03'
  },
  {
    id: 'prod-16',
    code: 'PRD-016',
    storeId: 'store-12',
    title: 'Servicio de Instalación de Tanques de Agua y Presurizadores',
    description: 'Servicio técnico a domicilio para montaje de tanques elevados, redes PEX, cobre y tuberías hidráulicas.',
    priceUSD: 25,
    category: 'Servicios Profesionales',
    subcategory: 'Reparaciones del Hogar',
    imageUrl: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=700&q=80',
    isAvailable: true,
    productTypeId: 'pt-servicio',
    productType: 'Servicios Profesionales',
    deliveryAvailable: true,
    featured: false,
    tagSelections: [
      { groupId: 'tg-garantia', groupName: 'Garantía', tagId: 'tag-3meses', tagName: '3 Meses', group: 'Garantía', value: '3 Meses' }
    ],
    tags: ['servicio', 'plomeria', 'tanque', 'agua', 'instalacion', '3 Meses'],
    createdAt: '2026-08-04'
  },
  {
    id: 'prod-17',
    code: 'PRD-017',
    storeId: 'store-11',
    title: 'Servicio de Mantenimiento y Reparación de PC y Laptops a Domicilio',
    description: 'Diagnóstico técnico, limpieza de componentes, cambio de pasta térmica, instalación de SSD y formateo con respaldo de información.',
    priceUSD: 20,
    category: 'Servicios Profesionales',
    subcategory: 'Mantenimiento y Taller',
    imageUrl: 'https://images.unsplash.com/photo-1588702547919-26089e690ecc?auto=format&fit=crop&w=700&q=80',
    isAvailable: true,
    productTypeId: 'pt-servicio',
    productType: 'Servicios Profesionales',
    deliveryAvailable: true,
    featured: true,
    tagSelections: [
      { groupId: 'tg-garantia', groupName: 'Garantía', tagId: 'tag-1mes', tagName: '1 Mes', group: 'Garantía', value: '1 Mes' }
    ],
    tags: ['servicio', 'mantenimiento', 'laptop', 'computadora', 'tecnico', '1 Mes'],
    createdAt: '2026-08-05'
  },
  {
    id: 'prod-18',
    code: 'PRD-018',
    storeId: 'store-10',
    title: 'Servicio de Transportación y Mudanzas en La Habana y Provincias',
    description: 'Flete en camioneta cerrada con personal capacitado para carga y descarga de electrodomésticos, muebles y paquetería.',
    priceUSD: 45,
    category: 'Servicios Profesionales',
    subcategory: 'Transportación y Envíos',
    imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=700&q=80',
    isAvailable: true,
    productTypeId: 'pt-servicio',
    productType: 'Servicios Profesionales',
    deliveryAvailable: true,
    featured: false,
    tagSelections: [
      { groupId: 'tg-garantia', groupName: 'Garantía', tagId: 'tag-1mes', tagName: '1 Mes', group: 'Garantía', value: '1 Mes' }
    ],
    tags: ['servicio', 'mudanza', 'flete', 'transporte', 'envios', '1 Mes'],
    createdAt: '2026-08-05'
  },
  {
    id: 'prod-19',
    code: 'PRD-019',
    storeId: 'store-8',
    title: 'Moto Eléctrica Águila 72V 35Ah Batería Litio con Alarma Digital',
    description: 'Moto eléctrica de alta autonomía (hasta 90 km por carga), motor brushless de 2000W, frenos de disco y pantalla digital.',
    priceUSD: 1250,
    category: 'Motos y Repuestos',
    subcategory: 'Baterías de Litio / Gel',
    imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=700&q=80',
    isAvailable: true,
    productTypeId: 'pt-producto',
    productType: 'Productos Físicos',
    deliveryAvailable: true,
    featured: true,
    tagSelections: [
      { groupId: 'tg-color', groupName: 'Color', tagId: 'tag-azul', tagName: 'Azul', group: 'Color', value: 'Azul' },
      { groupId: 'tg-color', groupName: 'Color', tagId: 'tag-negro', tagName: 'Negro', group: 'Color', value: 'Negro' },
      { groupId: 'tg-garantia', groupName: 'Garantía', tagId: 'tag-1ano', tagName: '1 Año', group: 'Garantía', value: '1 Año' },
      { groupId: 'tg-estado', groupName: 'Estado / Condición', tagId: 'tag-nuevo', tagName: 'Nuevo Sello', group: 'Estado / Condición', value: 'Nuevo Sello' }
    ],
    tags: ['moto', 'electrica', '72v', 'litio', 'movilidad', 'Azul', 'Negro', '1 Año', 'Nuevo Sello'],
    createdAt: '2026-08-05'
  },
  {
    id: 'prod-20',
    code: 'PRD-020',
    storeId: 'store-4',
    title: 'Combo Higiene y Limpieza Profunda del Hogar (4 Productos 1L)',
    description: 'Pack de detergente líquido concentrado, cloro perfumado, desengrasante multiusos y suavizante de telas.',
    priceUSD: 22,
    category: 'Belleza y Salud',
    subcategory: 'Medicamentos e Higiene',
    imageUrl: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=700&q=80',
    isAvailable: true,
    productTypeId: 'pt-producto',
    productType: 'Productos Físicos',
    deliveryAvailable: true,
    featured: false,
    tagSelections: [
      { groupId: 'tg-estado', groupName: 'Estado / Condición', tagId: 'tag-nuevo', tagName: 'Nuevo Sello', group: 'Estado / Condición', value: 'Nuevo Sello' }
    ],
    tags: ['limpieza', 'detergente', 'combo', 'higiene', 'hogar', 'Nuevo Sello'],
    createdAt: '2026-08-06'
  },
  {
    id: 'prod-21',
    code: 'PRD-021',
    storeId: 'store-12',
    title: 'Servicio de Mantenimiento y Carga de Gas para Split / Aire Acondicionado',
    description: 'Limpieza con hidrolavadora de consola y condensador, revisión eléctrica, sellado de fugas y recarga de refrigerante R410/R22.',
    priceUSD: 30,
    category: 'Servicios Profesionales',
    subcategory: 'Reparaciones del Hogar',
    imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=700&q=80',
    isAvailable: true,
    productTypeId: 'pt-servicio',
    productType: 'Servicios Profesionales',
    deliveryAvailable: true,
    featured: true,
    tagSelections: [
      { groupId: 'tg-garantia', groupName: 'Garantía', tagId: 'tag-1mes', tagName: '1 Mes', group: 'Garantía', value: '1 Mes' }
    ],
    tags: ['servicio', 'split', 'climatizacion', 'mantenimiento', 'aire', '1 Mes'],
    createdAt: '2026-08-06'
  },
  {
    id: 'prod-22',
    code: 'PRD-022',
    storeId: 'store-9',
    title: 'Juego de Muebles para Sala 3 Piezas Tapizado en Tejido Anti-Manchas',
    description: 'Incluye sofá de 3 plazas y 2 sillones individuales con espuma de alta densidad y estructura de madera preciosa tratada.',
    priceUSD: 320,
    category: 'Electrodomésticos y Hogar',
    subcategory: 'Muebles y Colchones',
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=700&q=80',
    isAvailable: true,
    productTypeId: 'pt-producto',
    productType: 'Productos Físicos',
    deliveryAvailable: true,
    featured: false,
    tagSelections: [
      { groupId: 'tg-color', groupName: 'Color', tagId: 'tag-gris', tagName: 'Gris', group: 'Color', value: 'Gris' },
      { groupId: 'tg-estado', groupName: 'Estado / Condición', tagId: 'tag-nuevo', tagName: 'Nuevo Sello', group: 'Estado / Condición', value: 'Nuevo Sello' },
      { groupId: 'tg-garantia', groupName: 'Garantía', tagId: 'tag-6meses', tagName: '6 Meses', group: 'Garantía', value: '6 Meses' }
    ],
    tags: ['muebles', 'sala', 'sofa', 'hogar', 'confort', 'Gris', 'Nuevo Sello', '6 Meses'],
    createdAt: '2026-08-06'
  },
  {
    id: 'prod-23',
    code: 'PRD-023',
    storeId: 'store-13',
    title: 'Freidora de Aire Digital 5.5L de Alta Potencia 1800W',
    description: 'Cocina sin aceite con panel táctil y 8 programas preestablecidos de cocción rápida.',
    priceUSD: 75,
    category: 'Electrodomésticos y Hogar',
    subcategory: 'Cocina y Olla Reina',
    imageUrl: 'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=700&q=80',
    isAvailable: true,
    productTypeId: 'pt-producto',
    productType: 'Productos Físicos',
    deliveryAvailable: true,
    featured: false,
    tagSelections: [
      { groupId: 'tg-color', groupName: 'Color', tagId: 'tag-negro', tagName: 'Negro', group: 'Color', value: 'Negro' },
      { groupId: 'tg-garantia', groupName: 'Garantía', tagId: 'tag-3meses', tagName: '3 Meses', group: 'Garantía', value: '3 Meses' },
      { groupId: 'tg-estado', groupName: 'Estado / Condición', tagId: 'tag-nuevo', tagName: 'Nuevo Sello', group: 'Estado / Condición', value: 'Nuevo Sello' }
    ],
    tags: ['freidora', 'aire', 'cocina', 'electrodomesticos', 'Negro', '3 Meses', 'Nuevo Sello'],
    createdAt: '2026-08-06'
  },
  {
    id: 'prod-24',
    code: 'PRD-024',
    storeId: 'store-13',
    title: 'Batidora de Mano Multinivel con Varilla de Acero Inoxidable',
    description: 'Incluye vaso medidor, picadora y batidor de varillas para repostería y salsas.',
    priceUSD: 35,
    category: 'Electrodomésticos y Hogar',
    subcategory: 'Cocina y Olla Reina',
    imageUrl: 'https://images.unsplash.com/photo-1578643463396-0997cb5328c1?auto=format&fit=crop&w=700&q=80',
    isAvailable: true,
    productTypeId: 'pt-producto',
    productType: 'Productos Físicos',
    deliveryAvailable: true,
    featured: false,
    tagSelections: [
      { groupId: 'tg-color', groupName: 'Color', tagId: 'tag-blanco', tagName: 'Blanco', group: 'Color', value: 'Blanco' },
      { groupId: 'tg-garantia', groupName: 'Garantía', tagId: 'tag-3meses', tagName: '3 Meses', group: 'Garantía', value: '3 Meses' },
      { groupId: 'tg-estado', groupName: 'Estado / Condición', tagId: 'tag-nuevo', tagName: 'Nuevo Sello', group: 'Estado / Condición', value: 'Nuevo Sello' }
    ],
    tags: ['batidora', 'cocina', 'electrodomesticos', 'Blanco', '3 Meses', 'Nuevo Sello'],
    createdAt: '2026-08-06'
  }
].map((p: any, idx: number): Product => {
  const { isService, ...rest } = p;
  const isServ = isService || p.productTypeId === 'pt-servicio' || (p.productType || '').toLowerCase().includes('servicio');
  const priceVal = p.price !== undefined && p.price !== null ? p.price : p.priceUSD;
  const currVal = p.currency || 'USD';
  return {
    ...rest,
    code: p.code || `PRD-${String(idx + 1).padStart(3, '0')}`,
    price: priceVal,
    priceUSD: p.priceUSD !== undefined && p.priceUSD !== null ? p.priceUSD : priceVal,
    currency: currVal,
    allowedExchangeRateIds: p.allowedExchangeRateIds || [`rate-${p.storeId}-usd-eur`],
    productTypeId: p.productTypeId || (isServ ? 'pt-servicio' : 'pt-producto'),
    productType: p.productType || (isServ ? 'Servicios Profesionales' : 'Productos Físicos'),
    paymentMethodIds: p.paymentMethodIds || ['pm-efectivo', 'pm-transferencia'],
    deliveryMethodIds: p.deliveryMethodIds || (p.deliveryAvailable ? ['dm-mensajeria', 'dm-recogida'] : ['dm-recogida']),
  };
});

export const PRESET_LOGOS = [
  { label: 'Tienda de Alimentos / Agro', url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80' },
  { label: 'Electrónica y Tecnología', url: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=400&q=80' },
  { label: 'Motos y Taller Técnico', url: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=400&q=80' },
  { label: 'Moda y Ropa', url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400&q=80' },
  { label: 'Ferretería y Herramientas', url: 'https://images.unsplash.com/photo-1581783898377-1c85bf937427?auto=format&fit=crop&w=400&q=80' },
  { label: 'Hogar y Decoración', url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80' },
  { label: 'Belleza y Cosmética', url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80' }
];

export const PRESET_PRODUCT_IMAGES = [
  { label: 'Combo de Alimentos', url: 'https://images.unsplash.com/photo-1506484381205-f7945653044d?auto=format&fit=crop&w=700&q=80' },
  { label: 'Caja de Pollo / Cárnicos', url: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=700&q=80' },
  { label: 'Ventilador Recargable Solar', url: 'https://images.unsplash.com/photo-1558611848-73f7eb4001a1?auto=format&fit=crop&w=700&q=80' },
  { label: 'Inversor / Energía', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=700&q=80' },
  { label: 'Teléfono Celular', url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=700&q=80' },
  { label: 'Batería de Moto Eléctrica', url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=700&q=80' },
  { label: 'Calzado Deportivo', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=700&q=80' },
  { label: 'Herramientas / Turbinas', url: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=700&q=80' },
  { label: 'Electrodoméstico de Cocina', url: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=700&q=80' },
  { label: 'Cosméticos y Belleza', url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=700&q=80' }
];
