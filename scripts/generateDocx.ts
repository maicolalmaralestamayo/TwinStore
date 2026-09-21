import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  HeadingLevel,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
  Header,
  Footer,
  PageNumber,
} from "docx";
import fs from "fs";
import path from "path";

// Color constants for professional layout
const COLOR_PRIMARY = "1E3A8A"; // Dark Blue
const COLOR_SECONDARY = "0284C7"; // Light Blue
const COLOR_BG_HEADER = "F1F5F9"; // Slate 100
const COLOR_BG_ALT = "F8FAFC"; // Slate 50
const COLOR_TEXT_DARK = "0F172A"; // Slate 900
const COLOR_TEXT_MUTED = "475569"; // Slate 600
const COLOR_BORDER = "CBD5E1"; // Slate 300
const COLOR_PK = "DC2626"; // Red for PK
const COLOR_FK = "2563EB"; // Blue for FK

interface FieldSpec {
  name: string;
  type: string;
  isPk: boolean;
  isFk: boolean;
  fkRef?: string;
  requiredOrDefault: string;
  description: string;
}

interface TableSpec {
  tableName: string;
  logicalName: string;
  description: string;
  fields: FieldSpec[];
}

const tablesData: TableSpec[] = [
  {
    tableName: "stores",
    logicalName: "Tiendas / Comercios",
    description: "Almacena los datos maestros de cada comercio, negocio o vendedor registrado en el marketplace.",
    fields: [
      { name: "id", type: "VARCHAR(50) / TEXT", isPk: true, isFk: false, requiredOrDefault: "OBLIGATORIO (NOT NULL)", description: "Identificador único alfanumérico de la tienda (ej. 'store-1')." },
      { name: "name", type: "VARCHAR(150) / TEXT", isPk: false, isFk: false, requiredOrDefault: "OBLIGATORIO", description: "Nombre comercial o razón social de la tienda." },
      { name: "slogan", type: "VARCHAR(255) / TEXT", isPk: false, isFk: false, requiredOrDefault: "OPCIONAL (NULL)", description: "Lema o frase distintiva de la tienda." },
      { name: "description", type: "TEXT", isPk: false, isFk: false, requiredOrDefault: "OBLIGATORIO", description: "Descripción detallada de las actividades y catálogo de la tienda." },
      { name: "logoUrl", type: "VARCHAR(500) / TEXT", isPk: false, isFk: false, requiredOrDefault: "DEFAULT: defaultStoreLogoUrl", description: "URL del logotipo principal o imagen de perfil." },
      { name: "images", type: "TEXT (JSON Array)", isPk: false, isFk: false, requiredOrDefault: "DEFAULT: '[]'", description: "Galería de imágenes o fotos de la tienda en formato JSON." },
      { name: "whatsappPhone", type: "VARCHAR(50) / TEXT", isPk: false, isFk: false, requiredOrDefault: "OBLIGATORIO", description: "Número de teléfono para contacto directo y pedidos por WhatsApp." },
      { name: "location", type: "VARCHAR(150) / TEXT", isPk: false, isFk: false, requiredOrDefault: "OPCIONAL", description: "Ubicación o referencia general (ej. 'Sede Central', 'Distrito Norte')." },
      { name: "address_street", type: "VARCHAR(150) / TEXT", isPk: false, isFk: false, requiredOrDefault: "OPCIONAL", description: "Calle donde radica la tienda." },
      { name: "address_number", type: "VARCHAR(50) / TEXT", isPk: false, isFk: false, requiredOrDefault: "OPCIONAL", description: "Número del inmueble o local." },
      { name: "address_building", type: "VARCHAR(100) / TEXT", isPk: false, isFk: false, requiredOrDefault: "OPCIONAL", description: "Edificio o complejo habitacional." },
      { name: "address_apartment", type: "VARCHAR(50) / TEXT", isPk: false, isFk: false, requiredOrDefault: "OPCIONAL", description: "Número de apartamento o local interior." },
      { name: "address_crossStreet1", type: "VARCHAR(100) / TEXT", isPk: false, isFk: false, requiredOrDefault: "OPCIONAL", description: "Primera entrecalle limítrofe." },
      { name: "address_crossStreet2", type: "VARCHAR(100) / TEXT", isPk: false, isFk: false, requiredOrDefault: "OPCIONAL", description: "Segunda entrecalle limítrofe." },
      { name: "address_neighborhood", type: "VARCHAR(100) / TEXT", isPk: false, isFk: true, fkRef: "geo_repartos(name)", requiredOrDefault: "OPCIONAL", description: "Reparto o barrio donde radica la tienda." },
      { name: "address_municipality", type: "VARCHAR(100) / TEXT", isPk: false, isFk: true, fkRef: "geo_municipalities(name)", requiredOrDefault: "OBLIGATORIO", description: "Municipio geográfico donde se ubica el negocio." },
      { name: "address_province", type: "VARCHAR(100) / TEXT", isPk: false, isFk: true, fkRef: "geo_provinces(name)", requiredOrDefault: "OBLIGATORIO", description: "Provincia geográfica donde radica la tienda." },
      { name: "address_googleMapsUrl", type: "VARCHAR(500) / TEXT", isPk: false, isFk: false, requiredOrDefault: "OPCIONAL", description: "Enlace web de ubicación en Google Maps." },
      { name: "usdToCupRate", type: "REAL / DECIMAL(10,2)", isPk: false, isFk: false, requiredOrDefault: "DEFAULT: 330.00", description: "Tasa de cambio de referencia USD a CUP para compatibilidad." },
      { name: "deliveryAvailable", type: "INTEGER / BOOLEAN", isPk: false, isFk: false, requiredOrDefault: "DEFAULT: 1 (TRUE)", description: "Indica si la tienda dispone de servicio de entrega a domicilio." },
      { name: "paymentOptions_transferAccepted", type: "INTEGER / BOOLEAN", isPk: false, isFk: false, requiredOrDefault: "DEFAULT: 1 (TRUE)", description: "Indica si el negocio acepta transferencias electrónicas." },
      { name: "paymentOptions_transferFeePercentage", type: "REAL / DECIMAL(5,2)", isPk: false, isFk: false, requiredOrDefault: "DEFAULT: 0.00", description: "Porcentaje de comisión o gravamen por transferencias bancarias." },
      { name: "paymentOptions_acceptedCurrencies", type: "TEXT (JSON Array)", isPk: false, isFk: false, requiredOrDefault: "DEFAULT: '[]'", description: "Lista de códigos de moneda aceptadas por la tienda." },
      { name: "paymentOptions_notes", type: "TEXT", isPk: false, isFk: false, requiredOrDefault: "OPCIONAL", description: "Instrucciones generales de pago provistas por la tienda." },
      { name: "paymentMethodIds", type: "TEXT (JSON Array)", isPk: false, isFk: true, fkRef: "nomenclador_payment_methods(id)", requiredOrDefault: "DEFAULT: '[]'", description: "Tipos de pago aceptados (efectivo, transferencia, etc.)." },
      { name: "deliveryMethodIds", type: "TEXT (JSON Array)", isPk: false, isFk: true, fkRef: "nomenclador_delivery_methods(id)", requiredOrDefault: "DEFAULT: '[]'", description: "Modalidades de recogida y entrega de la tienda." },
      { name: "paymentPlatformIds", type: "TEXT (JSON Array)", isPk: false, isFk: true, fkRef: "nomenclador_payment_platforms(id)", requiredOrDefault: "DEFAULT: '[]'", description: "Plataformas de pago aceptadas (Banco Metropolitano, Zelle, PayPal, etc.)." },
      { name: "exchangeRates", type: "TEXT (JSON Array)", isPk: false, isFk: false, requiredOrDefault: "DEFAULT: '[]'", description: "Serialización embebida de tasas de cambio de la tienda." },
      { name: "active", type: "INTEGER / BOOLEAN", isPk: false, isFk: false, requiredOrDefault: "DEFAULT: 1 (TRUE)", description: "Estado activo o suspendido de la tienda en el portal." },
      { name: "rating", type: "REAL / DECIMAL(3,2)", isPk: false, isFk: false, requiredOrDefault: "DEFAULT: 5.0", description: "Puntuación o reputación promedio de la tienda." },
      { name: "badge", type: "VARCHAR(100) / TEXT", isPk: false, isFk: false, requiredOrDefault: "OPCIONAL", description: "Insignia de confianza o distinción (ej. 'Tienda Oficial', 'Verificada')." },
      { name: "createdAt", type: "VARCHAR(50) / TIMESTAMP", isPk: false, isFk: false, requiredOrDefault: "DEFAULT: CURRENT_TIMESTAMP", description: "Fecha y hora de creación y registro de la tienda." },
    ],
  },
  {
    tableName: "products",
    logicalName: "Productos y Ofertas",
    description: "Catálogo de artículos, ofertas, servicios o alquileres publicados por las tiendas.",
    fields: [
      { name: "id", type: "VARCHAR(50) / TEXT", isPk: true, isFk: false, requiredOrDefault: "OBLIGATORIO (NOT NULL)", description: "Identificador único del producto (ej. 'prod-1')." },
      { name: "code", type: "VARCHAR(50) / TEXT", isPk: false, isFk: false, requiredOrDefault: "OBLIGATORIO (UNIQUE)", description: "Código alfanumérico único en toda la base de datos (ej. 'PRD-001')." },
      { name: "storeId", type: "VARCHAR(50) / TEXT", isPk: false, isFk: true, fkRef: "stores(id)", requiredOrDefault: "OBLIGATORIO", description: "Tienda propietaria y responsable de la publicación del producto." },
      { name: "title", type: "VARCHAR(200) / TEXT", isPk: false, isFk: false, requiredOrDefault: "OBLIGATORIO", description: "Nombre descriptivo del producto u oferta." },
      { name: "description", type: "TEXT", isPk: false, isFk: false, requiredOrDefault: "OBLIGATORIO", description: "Descripción completa, detalles técnicos y características." },
      { name: "price", type: "REAL / DECIMAL(12,2)", isPk: false, isFk: false, requiredOrDefault: "DEFAULT: 0.00", description: "Precio expresado en la moneda asignada al producto." },
      { name: "priceUSD", type: "REAL / DECIMAL(12,2)", isPk: false, isFk: false, requiredOrDefault: "DEFAULT: 0.00", description: "Precio de referencia en USD para conversiones del catálogo." },
      { name: "currency", type: "VARCHAR(10) / TEXT", isPk: false, isFk: true, fkRef: "currencies(code)", requiredOrDefault: "DEFAULT: 'USD'", description: "Moneda en la que se fijó el precio original del producto." },
      { name: "productTypeId", type: "VARCHAR(50) / TEXT", isPk: false, isFk: true, fkRef: "nomenclador_product_types(id)", requiredOrDefault: "OBLIGATORIO", description: "Tipo de oferta del nomenclador (Físico, Servicio, Alquiler, Digital)." },
      { name: "productType", type: "VARCHAR(100) / TEXT", isPk: false, isFk: false, requiredOrDefault: "OPCIONAL", description: "Nombre textual denormalizado del tipo de oferta para alto rendimiento." },
      { name: "allowedExchangeRateIds", type: "TEXT (JSON Array)", isPk: false, isFk: true, fkRef: "store_exchange_rates(id)", requiredOrDefault: "DEFAULT: '[]'", description: "Tasas de cambio de la tienda permitidas para liquidar este producto." },
      { name: "category", type: "VARCHAR(100) / TEXT", isPk: false, isFk: false, requiredOrDefault: "OPCIONAL", description: "Categoría o departamento principal de clasificación." },
      { name: "departmentId", type: "VARCHAR(50) / TEXT", isPk: false, isFk: true, fkRef: "departments(id)", requiredOrDefault: "OPCIONAL", description: "Identificador del departamento jerárquico (Nivel 1)." },
      { name: "subcategory", type: "VARCHAR(100) / TEXT", isPk: false, isFk: false, requiredOrDefault: "OPCIONAL", description: "Subcategoría de clasificación (Nivel 2)." },
      { name: "subcategoryId", type: "VARCHAR(50) / TEXT", isPk: false, isFk: true, fkRef: "subcategories(id)", requiredOrDefault: "OPCIONAL", description: "Identificador de la subcategoría asignada." },
      { name: "imageUrl", type: "VARCHAR(500) / TEXT", isPk: false, isFk: false, requiredOrDefault: "DEFAULT: defaultProductImageUrl", description: "URL de la imagen principal de portada del producto." },
      { name: "images", type: "TEXT (JSON Array)", isPk: false, isFk: false, requiredOrDefault: "DEFAULT: '[]'", description: "Galería de imágenes adicionales del producto en formato JSON." },
      { name: "isAvailable", type: "INTEGER / BOOLEAN", isPk: false, isFk: false, requiredOrDefault: "DEFAULT: 1 (TRUE)", description: "Disponibilidad activa en el marketplace (1 = visible, 0 = oculto)." },
      { name: "isService", type: "INTEGER / BOOLEAN", isPk: false, isFk: false, requiredOrDefault: "DEFAULT: 0 (FALSE)", description: "Bandera indicadora si la oferta es un servicio." },
      { name: "deliveryAvailable", type: "INTEGER / BOOLEAN", isPk: false, isFk: false, requiredOrDefault: "DEFAULT: 0 (FALSE)", description: "Si aplica o no envío a domicilio para este producto." },
      { name: "featured", type: "INTEGER / BOOLEAN", isPk: false, isFk: false, requiredOrDefault: "DEFAULT: 0 (FALSE)", description: "Marca de producto destacado en portada o carrusel." },
      { name: "tags", type: "TEXT (JSON Array)", isPk: false, isFk: false, requiredOrDefault: "DEFAULT: '[]'", description: "Lista de etiquetas de búsqueda rápida." },
      { name: "tagSelections", type: "TEXT (JSON Array)", isPk: false, isFk: false, requiredOrDefault: "DEFAULT: '[]'", description: "Estructura relacional de etiquetas de 2 niveles asignadas al producto." },
      { name: "createdAt", type: "VARCHAR(50) / TIMESTAMP", isPk: false, isFk: false, requiredOrDefault: "DEFAULT: CURRENT_TIMESTAMP", description: "Fecha y hora de creación y registro del producto." },
    ],
  },
  {
    tableName: "store_exchange_rates",
    logicalName: "Tasas de Cambio de Tienda",
    description: "Tasas de cambio personalizadas definidas individualmente por cada tienda para conversiones financieras.",
    fields: [
      { name: "id", type: "VARCHAR(50) / TEXT", isPk: true, isFk: false, requiredOrDefault: "OBLIGATORIO (NOT NULL)", description: "Identificador único del registro de tasa de cambio." },
      { name: "storeId", type: "VARCHAR(50) / TEXT", isPk: false, isFk: true, fkRef: "stores(id)", requiredOrDefault: "OBLIGATORIO", description: "Tienda a la que pertenece y aplica la tasa de cambio." },
      { name: "fromCurrency", type: "VARCHAR(10) / TEXT", isPk: false, isFk: true, fkRef: "currencies(code)", requiredOrDefault: "OBLIGATORIO", description: "Moneda de origen de la tasa (ej. 'USD')." },
      { name: "toCurrency", type: "VARCHAR(10) / TEXT", isPk: false, isFk: true, fkRef: "currencies(code)", requiredOrDefault: "OBLIGATORIO", description: "Moneda de destino o liquidación (ej. 'EUR', 'CUP')." },
      { name: "rate", type: "REAL / DECIMAL(12,4)", isPk: false, isFk: false, requiredOrDefault: "OBLIGATORIO", description: "Valor de conversión: 1 fromCurrency = rate toCurrency." },
    ],
  },
  {
    tableName: "store_rate_payment_methods",
    logicalName: "Métodos de Pago por Tasa de Cambio",
    description: "Relaciona cada tasa de cambio con las formas de pago aceptadas y su correspondiente porcentaje de gravamen.",
    fields: [
      { name: "id", type: "VARCHAR(50) / TEXT", isPk: true, isFk: false, requiredOrDefault: "OBLIGATORIO (NOT NULL)", description: "Identificador único de la regla relacional tasa-método." },
      { name: "storeId", type: "VARCHAR(50) / TEXT", isPk: false, isFk: true, fkRef: "stores(id)", requiredOrDefault: "OBLIGATORIO", description: "Tienda donde aplica la regla de cobro." },
      { name: "exchangeRateId", type: "VARCHAR(50) / TEXT", isPk: false, isFk: true, fkRef: "store_exchange_rates(id)", requiredOrDefault: "OBLIGATORIO", description: "Tasa de cambio específica a la que se vincula el método." },
      { name: "paymentMethodId", type: "VARCHAR(50) / TEXT", isPk: false, isFk: true, fkRef: "nomenclador_payment_methods(id)", requiredOrDefault: "OBLIGATORIO", description: "Tipo de pago admitido para esta tasa (efectivo, transferencia, etc.)." },
      { name: "gravamen", type: "REAL / DECIMAL(5,2)", isPk: false, isFk: false, requiredOrDefault: "DEFAULT: 0.00", description: "Porcentaje de recargo o gravamen adicional para este método de pago." },
      { name: "notes", type: "VARCHAR(255) / TEXT", isPk: false, isFk: false, requiredOrDefault: "OPCIONAL", description: "Condiciones o especificaciones particulares del cobro." },
    ],
  },
  {
    tableName: "store_currency_payment_methods",
    logicalName: "Monedas y Métodos de Pago Directos de Tienda",
    description: "Matriz que define para cada tienda qué monedas acepta y bajo qué modalidades de pago.",
    fields: [
      { name: "id", type: "VARCHAR(50) / TEXT", isPk: true, isFk: false, requiredOrDefault: "OBLIGATORIO (NOT NULL)", description: "Identificador único del registro relacional moneda-pago." },
      { name: "storeId", type: "VARCHAR(50) / TEXT", isPk: false, isFk: true, fkRef: "stores(id)", requiredOrDefault: "OBLIGATORIO", description: "Tienda a la cual pertenece la configuración." },
      { name: "currency", type: "VARCHAR(10) / TEXT", isPk: false, isFk: true, fkRef: "currencies(code)", requiredOrDefault: "OBLIGATORIO", description: "Código de la divisa admitida (ej. 'USD', 'EUR', 'CUP')." },
      { name: "paymentMethodId", type: "VARCHAR(50) / TEXT", isPk: false, isFk: true, fkRef: "nomenclador_payment_methods(id)", requiredOrDefault: "OBLIGATORIO", description: "Método de pago admitido en dicha divisa." },
      { name: "notes", type: "VARCHAR(255) / TEXT", isPk: false, isFk: false, requiredOrDefault: "OPCIONAL", description: "Notas adicionales (ej. 'Solo billetes en buen estado')." },
    ],
  },
  {
    tableName: "store_payment_platforms",
    logicalName: "Tienda ↔ Plataformas de Pago (Relación N:M)",
    description: "Tabla de unión que vincula qué plataformas financieras específicas acepta cada tienda (Banco Metropolitano, Zelle, PayPal, etc.).",
    fields: [
      { name: "storeId", type: "VARCHAR(50) / TEXT", isPk: true, isFk: true, fkRef: "stores(id)", requiredOrDefault: "OBLIGATORIO (PK COMPUESTA)", description: "Identificador de la tienda vinculada." },
      { name: "paymentPlatformId", type: "VARCHAR(50) / TEXT", isPk: true, isFk: true, fkRef: "nomenclador_payment_platforms(id)", requiredOrDefault: "OBLIGATORIO (PK COMPUESTA)", description: "Identificador de la plataforma de pago habilitada." },
    ],
  },
  {
    tableName: "store_delivery_methods",
    logicalName: "Tienda ↔ Métodos de Recogida/Entrega (Relación N:M)",
    description: "Tabla de unión que asocia las opciones de entrega y retiro ofrecidas por cada tienda.",
    fields: [
      { name: "storeId", type: "VARCHAR(50) / TEXT", isPk: true, isFk: true, fkRef: "stores(id)", requiredOrDefault: "OBLIGATORIO (PK COMPUESTA)", description: "Identificador de la tienda." },
      { name: "deliveryMethodId", type: "VARCHAR(50) / TEXT", isPk: true, isFk: true, fkRef: "nomenclador_delivery_methods(id)", requiredOrDefault: "OBLIGATORIO (PK COMPUESTA)", description: "Identificador de la opción de entrega o retiro admitida." },
    ],
  },
  {
    tableName: "product_allowed_exchange_rates",
    logicalName: "Producto ↔ Tasas Permitidas (Relación N:M)",
    description: "Tabla de unión que define qué tasas de cambio de la tienda aplican específicamente a un producto.",
    fields: [
      { name: "id", type: "VARCHAR(50) / TEXT", isPk: true, isFk: false, requiredOrDefault: "OBLIGATORIO (NOT NULL)", description: "Identificador único del registro de autorización de tasa." },
      { name: "productId", type: "VARCHAR(50) / TEXT", isPk: false, isFk: true, fkRef: "products(id)", requiredOrDefault: "OBLIGATORIO", description: "Producto al que se autoriza la tasa." },
      { name: "storeId", type: "VARCHAR(50) / TEXT", isPk: false, isFk: true, fkRef: "stores(id)", requiredOrDefault: "OBLIGATORIO", description: "Tienda emisora de la tasa." },
      { name: "exchangeRateId", type: "VARCHAR(50) / TEXT", isPk: false, isFk: true, fkRef: "store_exchange_rates(id)", requiredOrDefault: "OBLIGATORIO", description: "Tasa de cambio de la tienda autorizada para la compra." },
    ],
  },
  {
    tableName: "nomenclador_payment_platforms",
    logicalName: "Nomenclador Global: Plataformas de Pago",
    description: "Catálogo centralizado de bancos, billeteras digitales y pasarelas de pago disponibles en el sistema.",
    fields: [
      { name: "id", type: "VARCHAR(50) / TEXT", isPk: true, isFk: false, requiredOrDefault: "OBLIGATORIO (NOT NULL)", description: "Identificador único de la plataforma (ej. 'pp-banmet', 'pp-zelle', 'pp-paypal')." },
      { name: "name", type: "VARCHAR(100) / TEXT", isPk: false, isFk: false, requiredOrDefault: "OBLIGATORIO", description: "Nombre visible de la entidad o pasarela financiera." },
      { name: "description", type: "VARCHAR(255) / TEXT", isPk: false, isFk: false, requiredOrDefault: "OPCIONAL", description: "Descripción de monedas y operatividad de la plataforma." },
      { name: "iconName", type: "VARCHAR(50) / TEXT", isPk: false, isFk: false, requiredOrDefault: "OPCIONAL", description: "Nombre del icono representativo en la interfaz." },
      { name: "active", type: "INTEGER / BOOLEAN", isPk: false, isFk: false, requiredOrDefault: "DEFAULT: 1 (TRUE)", description: "Estado de disponibilidad global para ser seleccionada por tiendas." },
    ],
  },
  {
    tableName: "nomenclador_payment_methods",
    logicalName: "Nomenclador Global: Tipos de Pago",
    description: "Catálogo maestro de modalidades de pago reconocidas por el marketplace (Efectivo, Transferencia, etc.).",
    fields: [
      { name: "id", type: "VARCHAR(50) / TEXT", isPk: true, isFk: false, requiredOrDefault: "OBLIGATORIO (NOT NULL)", description: "Identificador único del método (ej. 'pm-efectivo', 'pm-transferencia')." },
      { name: "name", type: "VARCHAR(100) / TEXT", isPk: false, isFk: false, requiredOrDefault: "OBLIGATORIO", description: "Nombre del método de pago." },
      { name: "description", type: "VARCHAR(255) / TEXT", isPk: false, isFk: false, requiredOrDefault: "OPCIONAL", description: "Descripción y alcance de la modalidad de pago." },
      { name: "iconName", type: "VARCHAR(50) / TEXT", isPk: false, isFk: false, requiredOrDefault: "OPCIONAL", description: "Nombre del icono gráfico." },
      { name: "active", type: "INTEGER / BOOLEAN", isPk: false, isFk: false, requiredOrDefault: "DEFAULT: 1 (TRUE)", description: "Disponibilidad activa en el sistema." },
      { name: "gravamen", type: "REAL / DECIMAL(5,2)", isPk: false, isFk: false, requiredOrDefault: "DEFAULT: 0.00", description: "Porcentaje de gravamen base sugerido por el marketplace." },
    ],
  },
  {
    tableName: "nomenclador_product_types",
    logicalName: "Nomenclador Global: Tipos de Oferta",
    description: "Catálogo maestro que clasifica las ofertas según su naturaleza comercial (Productos, Servicios, Alquileres, Digitales).",
    fields: [
      { name: "id", type: "VARCHAR(50) / TEXT", isPk: true, isFk: false, requiredOrDefault: "OBLIGATORIO (NOT NULL)", description: "Identificador del tipo de oferta (ej. 'pt-producto', 'pt-servicio', 'pt-alquiler')." },
      { name: "name", type: "VARCHAR(100) / TEXT", isPk: false, isFk: false, requiredOrDefault: "OBLIGATORIO", description: "Nombre formal del tipo de oferta." },
      { name: "description", type: "VARCHAR(255) / TEXT", isPk: false, isFk: false, requiredOrDefault: "OPCIONAL", description: "Descripción comercial y alcance." },
      { name: "iconName", type: "VARCHAR(50) / TEXT", isPk: false, isFk: false, requiredOrDefault: "OPCIONAL", description: "Icono distintivo para tarjetas y filtros." },
      { name: "active", type: "INTEGER / BOOLEAN", isPk: false, isFk: false, requiredOrDefault: "DEFAULT: 1 (TRUE)", description: "Estado activo en el marketplace." },
    ],
  },
  {
    tableName: "nomenclador_delivery_methods",
    logicalName: "Nomenclador Global: Tipos de Recogida / Entrega",
    description: "Catálogo de formas de distribución física y retiro disponibles para las tiendas.",
    fields: [
      { name: "id", type: "VARCHAR(50) / TEXT", isPk: true, isFk: false, requiredOrDefault: "OBLIGATORIO (NOT NULL)", description: "Identificador del método de entrega (ej. 'dm-mensajeria', 'dm-recogida')." },
      { name: "name", type: "VARCHAR(100) / TEXT", isPk: false, isFk: false, requiredOrDefault: "OBLIGATORIO", description: "Nombre de la modalidad (ej. 'Mensajería a Domicilio', 'Retiro en Tienda')." },
      { name: "description", type: "VARCHAR(255) / TEXT", isPk: false, isFk: false, requiredOrDefault: "OPCIONAL", description: "Detalles logísticos." },
      { name: "iconName", type: "VARCHAR(50) / TEXT", isPk: false, isFk: false, requiredOrDefault: "OPCIONAL", description: "Icono ilustrativo." },
      { name: "active", type: "INTEGER / BOOLEAN", isPk: false, isFk: false, requiredOrDefault: "DEFAULT: 1 (TRUE)", description: "Estado activo." },
    ],
  },
  {
    tableName: "currencies",
    logicalName: "Catálogo Global de Divisas / Monedas",
    description: "Maestro de monedas reconocidas para fijación de precios, cotizaciones y pagos en el sistema.",
    fields: [
      { name: "code", type: "VARCHAR(10) / TEXT", isPk: true, isFk: false, requiredOrDefault: "OBLIGATORIO (NOT NULL)", description: "Código internacional ISO de la divisa (ej. 'USD', 'EUR', 'CUP', 'GBP')." },
      { name: "id", type: "VARCHAR(50) / TEXT", isPk: false, isFk: false, requiredOrDefault: "OBLIGATORIO", description: "Identificador correlativo del catálogo (ej. 'curr-usd')." },
      { name: "name", type: "VARCHAR(100) / TEXT", isPk: false, isFk: false, requiredOrDefault: "OBLIGATORIO", description: "Nombre completo de la moneda." },
      { name: "symbol", type: "VARCHAR(10) / TEXT", isPk: false, isFk: false, requiredOrDefault: "OBLIGATORIO", description: "Símbolo gráfico representativo ($, €, £, etc.)." },
      { name: "description", type: "VARCHAR(255) / TEXT", isPk: false, isFk: false, requiredOrDefault: "OPCIONAL", description: "Notas adicionales sobre la divisa." },
      { name: "active", type: "INTEGER / BOOLEAN", isPk: false, isFk: false, requiredOrDefault: "DEFAULT: 1 (TRUE)", description: "Estado de habilitación de la divisa en el marketplace." },
    ],
  },
  {
    tableName: "global_exchange_rates",
    logicalName: "Tasas de Cambio Globales de Referencia",
    description: "Tasas macroeconómicas de cambio globales sugeridas como referencia para tiendas.",
    fields: [
      { name: "id", type: "VARCHAR(50) / TEXT", isPk: true, isFk: false, requiredOrDefault: "OBLIGATORIO (NOT NULL)", description: "Identificador único del registro de tasa global." },
      { name: "fromCurrency", type: "VARCHAR(10) / TEXT", isPk: false, isFk: true, fkRef: "currencies(code)", requiredOrDefault: "OBLIGATORIO", description: "Moneda de origen de la tasa global." },
      { name: "toCurrency", type: "VARCHAR(10) / TEXT", isPk: false, isFk: true, fkRef: "currencies(code)", requiredOrDefault: "OBLIGATORIO", description: "Moneda de destino de la tasa global." },
      { name: "rate", type: "REAL / DECIMAL(12,4)", isPk: false, isFk: false, requiredOrDefault: "OBLIGATORIO", description: "Valor de conversión macroeconómica del sistema." },
      { name: "description", type: "TEXT", isPk: false, isFk: false, requiredOrDefault: "OPCIONAL", description: "Explicación o fuente de referencia de la tasa." },
    ],
  },
  {
    tableName: "departments",
    logicalName: "Departamentos (Categorías Nivel 1)",
    description: "Primer escalón de clasificación general de productos del marketplace.",
    fields: [
      { name: "id", type: "VARCHAR(50) / TEXT", isPk: true, isFk: false, requiredOrDefault: "OBLIGATORIO (NOT NULL)", description: "Identificador del departamento (ej. 'dept-alimentos')." },
      { name: "name", type: "VARCHAR(100) / TEXT", isPk: false, isFk: false, requiredOrDefault: "OBLIGATORIO", description: "Nombre del departamento principal." },
      { name: "description", type: "VARCHAR(255) / TEXT", isPk: false, isFk: false, requiredOrDefault: "OPCIONAL", description: "Descripción del tipo de artículos agrupados." },
      { name: "iconName", type: "VARCHAR(50) / TEXT", isPk: false, isFk: false, requiredOrDefault: "OPCIONAL", description: "Icono distintivo en la barra y menú de navegación." },
    ],
  },
  {
    tableName: "subcategories",
    logicalName: "Subcategorías (Categorías Nivel 2)",
    description: "Segundo escalón de clasificación jerárquica de productos subordinado a un departamento.",
    fields: [
      { name: "id", type: "VARCHAR(50) / TEXT", isPk: true, isFk: false, requiredOrDefault: "OBLIGATORIO (NOT NULL)", description: "Identificador de la subcategoría (ej. 'sub-carnes')." },
      { name: "departmentId", type: "VARCHAR(50) / TEXT", isPk: false, isFk: true, fkRef: "departments(id)", requiredOrDefault: "OBLIGATORIO", description: "Departamento padre al cual pertenece." },
      { name: "name", type: "VARCHAR(100) / TEXT", isPk: false, isFk: false, requiredOrDefault: "OBLIGATORIO", description: "Nombre específico de la subcategoría." },
      { name: "description", type: "VARCHAR(255) / TEXT", isPk: false, isFk: false, requiredOrDefault: "OPCIONAL", description: "Descripción del nicho de productos." },
    ],
  },
  {
    tableName: "tag_groups",
    logicalName: "Super-Etiquetas (Grupos de Etiquetas Nivel 1)",
    description: "Primer nivel del sistema de etiquetado dimensional (ej. 'Color', 'Talla', 'Estilo', 'Garantía').",
    fields: [
      { name: "id", type: "VARCHAR(50) / TEXT", isPk: true, isFk: false, requiredOrDefault: "OBLIGATORIO (NOT NULL)", description: "Identificador del grupo de etiquetas (ej. 'group-color')." },
      { name: "name", type: "VARCHAR(100) / TEXT", isPk: false, isFk: false, requiredOrDefault: "OBLIGATORIO", description: "Nombre del atributo o dimensión de clasificación." },
      { name: "description", type: "VARCHAR(255) / TEXT", isPk: false, isFk: false, requiredOrDefault: "OPCIONAL", description: "Descripción del propósito del grupo." },
    ],
  },
  {
    tableName: "tags",
    logicalName: "Etiquetas de Valor (Etiquetas Nivel 2)",
    description: "Segundo nivel del sistema de etiquetado con los valores concretos dentro de un grupo.",
    fields: [
      { name: "id", type: "VARCHAR(50) / TEXT", isPk: true, isFk: false, requiredOrDefault: "OBLIGATORIO (NOT NULL)", description: "Identificador de la etiqueta (ej. 'tag-rojo', 'tag-xl')." },
      { name: "tagGroupId", type: "VARCHAR(50) / TEXT", isPk: false, isFk: true, fkRef: "tag_groups(id)", requiredOrDefault: "OBLIGATORIO", description: "Grupo o super-etiqueta padre a la que pertenece." },
      { name: "name", type: "VARCHAR(100) / TEXT", isPk: false, isFk: false, requiredOrDefault: "OBLIGATORIO", description: "Valor o etiqueta puntual." },
    ],
  },
  {
    tableName: "geo_provinces",
    logicalName: "Catálogo Geográfico: Provincias (Nivel 1)",
    description: "División territorial de primer nivel (ej. La Habana, Matanzas, Villa Clara).",
    fields: [
      { name: "id", type: "VARCHAR(50) / TEXT", isPk: true, isFk: false, requiredOrDefault: "OBLIGATORIO (NOT NULL)", description: "Identificador único de la provincia (ej. 'prov-lha')." },
      { name: "name", type: "VARCHAR(100) / TEXT", isPk: false, isFk: false, requiredOrDefault: "OBLIGATORIO (UNIQUE)", description: "Nombre oficial de la provincia." },
    ],
  },
  {
    tableName: "geo_municipalities",
    logicalName: "Catálogo Geográfico: Municipios (Nivel 2)",
    description: "División territorial de segundo nivel vinculada a su provincia correspondiente.",
    fields: [
      { name: "id", type: "VARCHAR(50) / TEXT", isPk: true, isFk: false, requiredOrDefault: "OBLIGATORIO (NOT NULL)", description: "Identificador del municipio (ej. 'mun-playa')." },
      { name: "provinceId", type: "VARCHAR(50) / TEXT", isPk: false, isFk: true, fkRef: "geo_provinces(id)", requiredOrDefault: "OBLIGATORIO", description: "Provincia a la que se subordina administrativamente." },
      { name: "name", type: "VARCHAR(100) / TEXT", isPk: false, isFk: false, requiredOrDefault: "OBLIGATORIO", description: "Nombre del municipio." },
    ],
  },
  {
    tableName: "geo_repartos",
    logicalName: "Catálogo Geográfico: Repartos / Barrios (Nivel 3)",
    description: "División geográfica de tercer nivel para precisión en envíos y cobertura de mensajería.",
    fields: [
      { name: "id", type: "VARCHAR(50) / TEXT", isPk: true, isFk: false, requiredOrDefault: "OBLIGATORIO (NOT NULL)", description: "Identificador del reparto o zona (ej. 'rep-miramar')." },
      { name: "municipalityId", type: "VARCHAR(50) / TEXT", isPk: false, isFk: true, fkRef: "geo_municipalities(id)", requiredOrDefault: "OBLIGATORIO", description: "Municipio al que pertenece el reparto." },
      { name: "name", type: "VARCHAR(100) / TEXT", isPk: false, isFk: false, requiredOrDefault: "OBLIGATORIO", description: "Nombre del reparto o localidad." },
    ],
  },
  {
    tableName: "marketplace_config",
    logicalName: "Configuración General del Marketplace",
    description: "Tabla de registro único (Singleton) que almacena la identidad, marca y ajustes globales.",
    fields: [
      { name: "id", type: "VARCHAR(50) / TEXT", isPk: true, isFk: false, requiredOrDefault: "DEFAULT: 'default'", description: "Identificador único del registro de configuración del sistema." },
      { name: "name", type: "VARCHAR(150) / TEXT", isPk: false, isFk: false, requiredOrDefault: "DEFAULT: 'TwinStore'", description: "Nombre comercial del portal o marketplace." },
      { name: "slogan", type: "VARCHAR(255) / TEXT", isPk: false, isFk: false, requiredOrDefault: "DEFAULT: Slogan del portal", description: "Lema institucional del marketplace." },
      { name: "logoUrl", type: "VARCHAR(500) / TEXT", isPk: false, isFk: false, requiredOrDefault: "OBLIGATORIO", description: "URL del imagotipo oficial del marketplace." },
      { name: "defaultStoreLogoUrl", type: "VARCHAR(500) / TEXT", isPk: false, isFk: false, requiredOrDefault: "OBLIGATORIO", description: "Imagen por defecto asignada a tiendas sin logotipo propio." },
      { name: "defaultProductImageUrl", type: "VARCHAR(500) / TEXT", isPk: false, isFk: false, requiredOrDefault: "OBLIGATORIO", description: "Imagen por defecto asignada a productos u ofertas sin foto." },
      { name: "bannerUrl", type: "VARCHAR(500) / TEXT", isPk: false, isFk: false, requiredOrDefault: "OPCIONAL", description: "URL de la imagen de fondo del hero banner principal." },
      { name: "bannerTitle", type: "VARCHAR(200) / TEXT", isPk: false, isFk: false, requiredOrDefault: "OPCIONAL", description: "Título visible en el banner central de la portada." },
      { name: "bannerSubtitle", type: "TEXT", isPk: false, isFk: false, requiredOrDefault: "OPCIONAL", description: "Subtítulo o texto explicativo del banner." },
      { name: "primaryColor", type: "VARCHAR(20) / TEXT", isPk: false, isFk: false, requiredOrDefault: "DEFAULT: '#2563EB'", description: "Color primario HEX de la identidad gráfica." },
      { name: "secondaryColor", type: "VARCHAR(20) / TEXT", isPk: false, isFk: false, requiredOrDefault: "DEFAULT: '#475569'", description: "Color secundario HEX." },
      { name: "accentColor", type: "VARCHAR(20) / TEXT", isPk: false, isFk: false, requiredOrDefault: "DEFAULT: '#10B981'", description: "Color de acento HEX para llamados a la acción." },
      { name: "baseCurrency", type: "VARCHAR(10) / TEXT", isPk: false, isFk: true, fkRef: "currencies(code)", requiredOrDefault: "DEFAULT: 'USD'", description: "Moneda de referencia base en todo el portal." },
      { name: "secondaryCurrency", type: "VARCHAR(10) / TEXT", isPk: false, isFk: true, fkRef: "currencies(code)", requiredOrDefault: "DEFAULT: 'EUR'", description: "Moneda secundaria global del sistema." },
      { name: "uiTexts", type: "TEXT (JSON Object)", isPk: false, isFk: false, requiredOrDefault: "DEFAULT: '{}'", description: "Diccionario de textos dinámicos de la interfaz de usuario." },
    ],
  },
  {
    tableName: "ui_texts",
    logicalName: "Textos Dinámicos de la Interfaz (I18N / Personalización)",
    description: "Almacena los textos, etiquetas y mensajes de la interfaz parametrizados por los administradores.",
    fields: [
      { name: "id", type: "VARCHAR(50) / TEXT", isPk: true, isFk: false, requiredOrDefault: "DEFAULT: 'default'", description: "Identificador del registro de textos." },
      { name: "content", type: "TEXT (JSON Object)", isPk: false, isFk: false, requiredOrDefault: "OBLIGATORIO", description: "Estructura JSON completa con los textos de navegación, botones y avisos." },
      { name: "updatedAt", type: "VARCHAR(50) / TIMESTAMP", isPk: false, isFk: false, requiredOrDefault: "DEFAULT: CURRENT_TIMESTAMP", description: "Fecha y hora de la última modificación." },
    ],
  },
];

interface RelationSpec {
  parentTable: string;
  childTable: string;
  fkField: string;
  cardinality: string;
  onDelete: string;
  onUpdate: string;
  justification: string;
}

const relationsData: RelationSpec[] = [
  {
    parentTable: "stores",
    childTable: "products",
    fkField: "products.storeId -> stores.id",
    cardinality: "1 : N (Uno a Muchos)",
    onDelete: "CASCADE (Eliminación en cascada)",
    onUpdate: "CASCADE (Actualización en cascada)",
    justification: "Si una tienda es dada de baja o eliminada del sistema, todos sus productos y ofertas dejan de existir y se eliminan automáticamente para evitar productos huérfanos sin comercio responsable.",
  },
  {
    parentTable: "stores",
    childTable: "store_exchange_rates",
    fkField: "store_exchange_rates.storeId -> stores.id",
    cardinality: "1 : N (Uno a Muchos)",
    onDelete: "CASCADE (Eliminación en cascada)",
    onUpdate: "CASCADE (Actualización en cascada)",
    justification: "Las tasas de cambio son configuraciones privadas y exclusivas de cada tienda; al eliminarse la tienda, sus tasas desaparecen.",
  },
  {
    parentTable: "stores",
    childTable: "store_rate_payment_methods",
    fkField: "store_rate_payment_methods.storeId -> stores.id",
    cardinality: "1 : N (Uno a Muchos)",
    onDelete: "CASCADE (Eliminación en cascada)",
    onUpdate: "CASCADE (Actualización en cascada)",
    justification: "Las reglas de gravamen y métodos vinculados a la tienda se purgan en cascada con la tienda.",
  },
  {
    parentTable: "stores",
    childTable: "store_currency_payment_methods",
    fkField: "store_currency_payment_methods.storeId -> stores.id",
    cardinality: "1 : N (Uno a Muchos)",
    onDelete: "CASCADE (Eliminación en cascada)",
    onUpdate: "CASCADE (Actualización en cascada)",
    justification: "Las combinaciones de moneda y forma de pago configuradas por la tienda se eliminan junto con ella.",
  },
  {
    parentTable: "stores",
    childTable: "store_payment_platforms",
    fkField: "store_payment_platforms.storeId -> stores.id",
    cardinality: "1 : N (Relación N:M)",
    onDelete: "CASCADE (Eliminación en cascada)",
    onUpdate: "CASCADE (Actualización en cascada)",
    justification: "Se eliminan las asociaciones entre la tienda y las plataformas bancarias aceptadas.",
  },
  {
    parentTable: "stores",
    childTable: "store_delivery_methods",
    fkField: "store_delivery_methods.storeId -> stores.id",
    cardinality: "1 : N (Relación N:M)",
    onDelete: "CASCADE (Eliminación en cascada)",
    onUpdate: "CASCADE (Actualización en cascada)",
    justification: "Se eliminan las asociaciones de las opciones de entrega configuradas para esa tienda.",
  },
  {
    parentTable: "store_exchange_rates",
    childTable: "store_rate_payment_methods",
    fkField: "store_rate_payment_methods.exchangeRateId -> store_exchange_rates.id",
    cardinality: "1 : N (Uno a Muchos)",
    onDelete: "CASCADE (Eliminación en cascada)",
    onUpdate: "CASCADE (Actualización en cascada)",
    justification: "Si se elimina una tasa de cambio de la tienda, todas las reglas de métodos de pago y gravamen asociadas a dicha tasa se eliminan automáticamente.",
  },
  {
    parentTable: "store_exchange_rates",
    childTable: "product_allowed_exchange_rates",
    fkField: "product_allowed_exchange_rates.exchangeRateId -> store_exchange_rates.id",
    cardinality: "1 : N (Uno a Muchos)",
    onDelete: "CASCADE (Eliminación en cascada)",
    onUpdate: "CASCADE (Actualización en cascada)",
    justification: "Si la tienda elimina una tasa de cambio, los productos ya no pueden tenerla como opción permitida de cobro.",
  },
  {
    parentTable: "products",
    childTable: "product_allowed_exchange_rates",
    fkField: "product_allowed_exchange_rates.productId -> products.id",
    cardinality: "1 : N (Uno a Muchos)",
    onDelete: "CASCADE (Eliminación en cascada)",
    onUpdate: "CASCADE (Actualización en cascada)",
    justification: "Al eliminarse un producto se eliminan sus permisos de tasas asociadas.",
  },
  {
    parentTable: "nomenclador_product_types",
    childTable: "products",
    fkField: "products.productTypeId -> nomenclador_product_types.id",
    cardinality: "1 : N (Uno a Muchos)",
    onDelete: "RESTRICT (Restricción estricta)",
    onUpdate: "CASCADE (Actualización en cascada)",
    justification: "No se puede eliminar un tipo de oferta si existen productos o servicios activos asociados a él. Protege la integridad del catálogo comercial.",
  },
  {
    parentTable: "currencies",
    childTable: "products",
    fkField: "products.currency -> currencies.code",
    cardinality: "1 : N (Uno a Muchos)",
    onDelete: "RESTRICT (Restricción estricta)",
    onUpdate: "CASCADE (Actualización en cascada)",
    justification: "No se puede eliminar una divisa si hay productos publicados cuyo precio está fijado en ella.",
  },
  {
    parentTable: "currencies",
    childTable: "store_exchange_rates",
    fkField: "store_exchange_rates.fromCurrency / toCurrency -> currencies.code",
    cardinality: "1 : N (Uno a Muchos)",
    onDelete: "RESTRICT (Restricción estricta)",
    onUpdate: "CASCADE (Actualización en cascada)",
    justification: "No se puede eliminar una moneda si existen tiendas con tasas de cambio que la utilicen como origen o destino.",
  },
  {
    parentTable: "nomenclador_payment_platforms",
    childTable: "store_payment_platforms",
    fkField: "store_payment_platforms.paymentPlatformId -> nomenclador_payment_platforms.id",
    cardinality: "1 : N (Relación N:M)",
    onDelete: "CASCADE (Eliminación en cascada)",
    onUpdate: "CASCADE (Actualización en cascada)",
    justification: "Si se elimina una plataforma de pago del catálogo maestro, se remueve automáticamente de la lista de selección de las tiendas que la tenían asignada.",
  },
  {
    parentTable: "nomenclador_payment_methods",
    childTable: "store_rate_payment_methods",
    fkField: "store_rate_payment_methods.paymentMethodId -> nomenclador_payment_methods.id",
    cardinality: "1 : N (Uno a Muchos)",
    onDelete: "CASCADE (Eliminación en cascada)",
    onUpdate: "CASCADE (Actualización en cascada)",
    justification: "Si se elimina un tipo de pago maestro, se eliminan sus configuraciones de gravamen vinculadas.",
  },
  {
    parentTable: "nomenclador_delivery_methods",
    childTable: "store_delivery_methods",
    fkField: "store_delivery_methods.deliveryMethodId -> nomenclador_delivery_methods.id",
    cardinality: "1 : N (Relación N:M)",
    onDelete: "CASCADE (Eliminación en cascada)",
    onUpdate: "CASCADE (Actualización en cascada)",
    justification: "Si se suprime una modalidad de entrega global, se desenlaza de las tiendas que la ofrecían.",
  },
  {
    parentTable: "departments",
    childTable: "subcategories",
    fkField: "subcategories.departmentId -> departments.id",
    cardinality: "1 : N (Uno a Muchos)",
    onDelete: "CASCADE (Eliminación en cascada)",
    onUpdate: "CASCADE (Actualización en cascada)",
    justification: "Al eliminar un departamento principal (Nivel 1), todas sus subcategorías subordinadas (Nivel 2) se eliminan en cascada.",
  },
  {
    parentTable: "departments",
    childTable: "products",
    fkField: "products.departmentId -> departments.id",
    cardinality: "1 : N (Uno a Muchos)",
    onDelete: "SET NULL (Establecer a nulo)",
    onUpdate: "CASCADE (Actualización en cascada)",
    justification: "Si se elimina un departamento, los productos existentes no deben borrarse; su campo de departamento se reasigna a NULL y quedan en categoría 'General / Otros'.",
  },
  {
    parentTable: "subcategories",
    childTable: "products",
    fkField: "products.subcategoryId -> subcategories.id",
    cardinality: "1 : N (Uno a Muchos)",
    onDelete: "SET NULL (Establecer a nulo)",
    onUpdate: "CASCADE (Actualización en cascada)",
    justification: "Si se elimina una subcategoría puntual, los productos conservan su departamento padre y el subcategoryId pasa a NULL.",
  },
  {
    parentTable: "tag_groups",
    childTable: "tags",
    fkField: "tags.tagGroupId -> tag_groups.id",
    cardinality: "1 : N (Uno a Muchos)",
    onDelete: "CASCADE (Eliminación en cascada)",
    onUpdate: "CASCADE (Actualización en cascada)",
    justification: "Al eliminar un grupo de etiquetas (Super-Etiqueta, ej. 'Color'), todas las etiquetas individuales de dicho grupo ('Rojo', 'Azul') se eliminan en cascada.",
  },
  {
    parentTable: "geo_provinces",
    childTable: "geo_municipalities",
    fkField: "geo_municipalities.provinceId -> geo_provinces.id",
    cardinality: "1 : N (Uno a Muchos)",
    onDelete: "CASCADE (Eliminación en cascada)",
    onUpdate: "CASCADE (Actualización en cascada)",
    justification: "Integridad territorial: Al suprimirse una provincia se eliminan sus municipios dependientes.",
  },
  {
    parentTable: "geo_municipalities",
    childTable: "geo_repartos",
    fkField: "geo_repartos.municipalityId -> geo_municipalities.id",
    cardinality: "1 : N (Uno a Muchos)",
    onDelete: "CASCADE (Eliminación en cascada)",
    onUpdate: "CASCADE (Actualización en cascada)",
    justification: "Integridad territorial: Al eliminarse un municipio se eliminan sus repartos.",
  },
  {
    parentTable: "geo_provinces / geo_municipalities",
    childTable: "stores",
    fkField: "stores.address_province / address_municipality -> geo_provinces / geo_municipalities",
    cardinality: "1 : N (Uno a Muchos)",
    onDelete: "RESTRICT (Restricción estricta)",
    onUpdate: "CASCADE (Actualización en cascada)",
    justification: "No se permite eliminar una provincia o municipio geográfico si existen tiendas registradas y activas en esa localidad.",
  },
];

function createTableCell(
  text: string,
  options: {
    isHeader?: boolean;
    bold?: boolean;
    color?: string;
    widthPercent?: number;
    alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
    bgColor?: string;
  } = {}
): TableCell {
  const { isHeader = false, bold = false, color = COLOR_TEXT_DARK, widthPercent, alignment = AlignmentType.LEFT, bgColor } = options;

  return new TableCell({
    width: widthPercent ? { size: widthPercent, type: WidthType.PERCENTAGE } : undefined,
    shading: bgColor ? { fill: bgColor, type: ShadingType.CLEAR } : isHeader ? { fill: COLOR_BG_HEADER, type: ShadingType.CLEAR } : undefined,
    margins: {
      top: 120,
      bottom: 120,
      left: 150,
      right: 150,
    },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      left: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
    },
    children: [
      new Paragraph({
        alignment,
        children: [
          new TextRun({
            text,
            bold: isHeader || bold,
            size: isHeader ? 19 : 17,
            color: isHeader ? COLOR_PRIMARY : color,
            font: "Segoe UI",
          }),
        ],
      }),
    ],
  });
}

function createTableDoc(tableSpec: TableSpec): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];

  // Table Title
  elements.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 300, after: 100 },
      children: [
        new TextRun({
          text: `Tabla: ${tableSpec.tableName}`,
          bold: true,
          size: 24,
          color: COLOR_PRIMARY,
          font: "Segoe UI",
        }),
        new TextRun({
          text: `  [${tableSpec.logicalName}]`,
          size: 20,
          color: COLOR_SECONDARY,
          font: "Segoe UI",
        }),
      ],
    })
  );

  // Table Description
  elements.push(
    new Paragraph({
      spacing: { before: 50, after: 150 },
      children: [
        new TextRun({
          text: "Propósito: ",
          bold: true,
          size: 18,
          color: COLOR_TEXT_MUTED,
          font: "Segoe UI",
        }),
        new TextRun({
          text: tableSpec.description,
          italics: true,
          size: 18,
          color: COLOR_TEXT_DARK,
          font: "Segoe UI",
        }),
      ],
    })
  );

  // Table header row
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      createTableCell("Nombre del Campo", { isHeader: true, widthPercent: 20 }),
      createTableCell("Tipo de Datos", { isHeader: true, widthPercent: 18 }),
      createTableCell("PK", { isHeader: true, widthPercent: 7, alignment: AlignmentType.CENTER }),
      createTableCell("FK", { isHeader: true, widthPercent: 15, alignment: AlignmentType.CENTER }),
      createTableCell("Obligatorio / Default", { isHeader: true, widthPercent: 18 }),
      createTableCell("Descripción / Regla", { isHeader: true, widthPercent: 22 }),
    ],
  });

  const bodyRows = tableSpec.fields.map((field, idx) => {
    const bgColor = idx % 2 === 1 ? COLOR_BG_ALT : "FFFFFF";
    const pkText = field.isPk ? "SÍ (PK)" : "No";
    const pkColor = field.isPk ? COLOR_PK : COLOR_TEXT_MUTED;
    const fkText = field.isFk ? `SÍ\n-> ${field.fkRef || ""}` : "No";
    const fkColor = field.isFk ? COLOR_FK : COLOR_TEXT_MUTED;

    return new TableRow({
      children: [
        createTableCell(field.name, { bold: field.isPk, color: field.isPk ? COLOR_PK : COLOR_TEXT_DARK, bgColor }),
        createTableCell(field.type, { bgColor, color: "0369A1" }),
        createTableCell(pkText, { bold: field.isPk, color: pkColor, alignment: AlignmentType.CENTER, bgColor }),
        createTableCell(fkText, { bold: field.isFk, color: fkColor, alignment: AlignmentType.CENTER, bgColor }),
        createTableCell(field.requiredOrDefault, { bgColor, color: field.requiredOrDefault.includes("OBLIGATORIO") ? "B91C1C" : "047857" }),
        createTableCell(field.description, { bgColor }),
      ],
    });
  });

  const wordTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...bodyRows],
  });

  elements.push(wordTable);
  elements.push(new Paragraph({ spacing: { after: 200 }, children: [] }));

  return elements;
}

function createRelationsSection(): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];

  elements.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 150 },
      children: [
        new TextRun({
          text: "2. Esquema y Políticas de Relación entre Tablas",
          bold: true,
          size: 28,
          color: COLOR_PRIMARY,
          font: "Segoe UI",
        }),
      ],
    })
  );

  elements.push(
    new Paragraph({
      spacing: { before: 50, after: 150 },
      children: [
        new TextRun({
          text:
            "A continuación se detalla la matriz integral de relaciones relacionales de la base de datos de TwinStore Marketplace. Para cada vínculo foráneo se especifican la cardinalidad, la regla de eliminación en cascada (ON DELETE), la regla de actualización en cascada (ON UPDATE) y la fundamentación técnica y de negocio que garantiza la integridad referencial y evita registros huérfanos o inconsistencias contables.",
          size: 19,
          color: COLOR_TEXT_DARK,
          font: "Segoe UI",
        }),
      ],
    })
  );

  // Relationships Table Header
  const relHeaderRow = new TableRow({
    tableHeader: true,
    children: [
      createTableCell("Tabla Origen (Padre)", { isHeader: true, widthPercent: 15 }),
      createTableCell("Tabla Destino (Hijo / FK)", { isHeader: true, widthPercent: 20 }),
      createTableCell("Cardinalidad", { isHeader: true, widthPercent: 12 }),
      createTableCell("ON DELETE (Eliminación)", { isHeader: true, widthPercent: 15 }),
      createTableCell("ON UPDATE (Actualización)", { isHeader: true, widthPercent: 13 }),
      createTableCell("Justificación de Negocio / Integridad", { isHeader: true, widthPercent: 25 }),
    ],
  });

  const relBodyRows = relationsData.map((rel, idx) => {
    const bgColor = idx % 2 === 1 ? COLOR_BG_ALT : "FFFFFF";
    const onDeleteColor = rel.onDelete.includes("CASCADE")
      ? "DC2626"
      : rel.onDelete.includes("RESTRICT")
      ? "D97706"
      : "2563EB";

    return new TableRow({
      children: [
        createTableCell(rel.parentTable, { bold: true, color: COLOR_PRIMARY, bgColor }),
        createTableCell(`${rel.childTable}\n(${rel.fkField})`, { bold: false, color: "0369A1", bgColor }),
        createTableCell(rel.cardinality, { alignment: AlignmentType.CENTER, bgColor }),
        createTableCell(rel.onDelete, { bold: true, color: onDeleteColor, bgColor }),
        createTableCell(rel.onUpdate, { bold: true, color: "047857", bgColor }),
        createTableCell(rel.justification, { bgColor }),
      ],
    });
  });

  const relTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [relHeaderRow, ...relBodyRows],
  });

  elements.push(relTable);

  // Summary and Referential Integrity Policy Notes
  elements.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 300, after: 100 },
      children: [
        new TextRun({
          text: "3. Principios de Integridad Referencial Implementados",
          bold: true,
          size: 24,
          color: COLOR_PRIMARY,
          font: "Segoe UI",
        }),
      ],
    })
  );

  const principles = [
    {
      title: "1. Aislamiento y Ciclo de Vida del Comercio (CASCADE en Tienda): ",
      desc: "Las tiendas son entidades soberanas. Cuando una tienda es eliminada definitivamente, todos sus productos, tasas privadas, métodos financieros y enlaces se purgan en cascada (ON DELETE CASCADE) para preservar la limpieza de datos en el sistema.",
    },
    {
      title: "2. Preservación del Catálogo de Productos (SET NULL en Departamentos): ",
      desc: "Si un administrador reorganiza la arquitectura departamental y elimina un departamento o subcategoría, los productos no son eliminados. Su campo clave foránea se establece en NULL (ON DELETE SET NULL), garantizando que el inventario y las ofertas comerciales sigan existiendo.",
    },
    {
      title: "3. Blindaje de Catálogos Maestros (RESTRICT en Divisas y Tipos de Oferta): ",
      desc: "No se puede eliminar una divisa del nomenclador global si existen productos publicados con precios fijados en ella o tasas activas. De igual manera, se restringe la eliminación de un Tipo de Oferta (ON DELETE RESTRICT) si existen productos asignados a dicha tipología.",
    },
    {
      title: "4. Propagación Universal de Actualizaciones (ON UPDATE CASCADE): ",
      desc: "Todas las claves foráneas tienen configurada la política ON UPDATE CASCADE. Cualquier renombramiento de códigos clave (ej. códigos ISO de divisas, códigos alfanuméricos de productos o identificadores de tiendas) se propaga instantáneamente a todas las tablas secundarias sin romper ningún enlace.",
    },
  ];

  principles.forEach((p) => {
    elements.push(
      new Paragraph({
        spacing: { before: 100, after: 100 },
        children: [
          new TextRun({ text: p.title, bold: true, color: COLOR_PRIMARY, size: 18, font: "Segoe UI" }),
          new TextRun({ text: p.desc, color: COLOR_TEXT_DARK, size: 18, font: "Segoe UI" }),
        ],
      })
    );
  });

  return elements;
}

export async function generateDatabaseDocumentationDocx(): Promise<string> {
  const doc = new Document({
    title: "Diccionario de Datos y Estructura de BD - TwinStore Marketplace",
    description: "Especificación técnica exhaustiva del modelo de base de datos relacional, tablas, campos, claves y políticas de cascada.",
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1000,
              bottom: 1000,
              left: 1000,
              right: 1000,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: "TwinStore Marketplace | Diccionario de Datos y Modelo de BD",
                    size: 16,
                    color: COLOR_TEXT_MUTED,
                    font: "Segoe UI",
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: "Documentación Técnica Confidencial | Página ",
                    size: 16,
                    color: COLOR_TEXT_MUTED,
                    font: "Segoe UI",
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 16,
                    color: COLOR_TEXT_MUTED,
                    font: "Segoe UI",
                  }),
                  new TextRun({
                    text: " de ",
                    size: 16,
                    color: COLOR_TEXT_MUTED,
                    font: "Segoe UI",
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 16,
                    color: COLOR_TEXT_MUTED,
                    font: "Segoe UI",
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // Document Header / Title Cover Block
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 100 },
            children: [
              new TextRun({
                text: "TWINSTORE MARKETPLACE",
                bold: true,
                size: 38,
                color: COLOR_PRIMARY,
                font: "Segoe UI",
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 50, after: 200 },
            children: [
              new TextRun({
                text: "DICCIONARIO DE DATOS Y ESPECIFICACIÓN DE BASE DE DATOS RELACIONAL",
                bold: true,
                size: 24,
                color: COLOR_SECONDARY,
                font: "Segoe UI",
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 300 },
            children: [
              new TextRun({
                text: `Generado el: ${new Date().toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })} | Versión de Esquema: 2.2.0`,
                italics: true,
                size: 18,
                color: COLOR_TEXT_MUTED,
                font: "Segoe UI",
              }),
            ],
          }),

          // Introduction
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 150 },
            children: [
              new TextRun({
                text: "1. Diccionario de Datos: Especificación Tabla por Tabla",
                bold: true,
                size: 28,
                color: COLOR_PRIMARY,
                font: "Segoe UI",
              }),
            ],
          }),
          new Paragraph({
            spacing: { before: 50, after: 250 },
            children: [
              new TextRun({
                text:
                  "El presente documento detalla la estructura formal de base de datos de TwinStore Marketplace. Se documentan cada una de las tablas del modelo relacional con sus campos, tipos de datos nativos SQL y TypeScript, claves primarias (PK), claves foráneas (FK) con sus referencias, obligatoriedad, valores predeterminados y reglas de negocio asociadas.",
                size: 19,
                color: COLOR_TEXT_DARK,
                font: "Segoe UI",
              }),
            ],
          }),

          // Append each table
          ...tablesData.flatMap((tbl) => createTableDoc(tbl)),

          // Append Relations and Cascade Policies
          ...createRelationsSection(),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outputDir = path.join(process.cwd(), "public", "docs");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, "Diccionario_Datos_Estructura_BD_TwinStore.docx");
  fs.writeFileSync(outputPath, buffer);
  console.log(`Documento DOCX generado con éxito en: ${outputPath}`);
  return outputPath;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateDatabaseDocumentationDocx()
    .then((path) => console.log("Finalizado:", path))
    .catch((err) => console.error("Error generando DOCX:", err));
}
