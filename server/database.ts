import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import {
  INITIAL_STORES,
  INITIAL_PRODUCTS,
  INITIAL_MARKETPLACE_CONFIG,
} from '../src/data/initialData';
import { DEFAULT_INTERFAZ } from '../src/data/defaultInterfaz';
import {
  Store,
  Product,
  MarketplaceConfig,
  StoreExchangeRate,
  DbProvincia,
  DbMunicipio,
  DbReparto,
  DbMoneda,
  DbDepartamento,
  DbSubdepartamento,
  DbEtiqueta,
  DbSubetiqueta,
  DbTipoOferta,
  DbTipoPago,
  DbTipoRecogida,
  DbCatalogosResponse,
  GeoProvince,
  DepartmentCategory,
  TagGroup,
  CurrencyItem,
  ProductTypeItem,
  PaymentMethodItem,
  DeliveryMethodItem,
  StoreAddress,
  StoreRatePaymentMethod,
  StoreCurrencyPaymentMethod,
} from '../src/types';

let dbInstance: Database | null = null;
const DB_FILE_PATH = path.join(process.cwd(), 'twinstore.sqlite');
const OLD_DB_FILE_PATH = path.join(process.cwd(), 'mercadocuba.sqlite');

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE_PATH);
      dbInstance = new SQL.Database(fileBuffer);
    } catch (err) {
      console.error('Error reading existing twinstore.sqlite file, creating new:', err);
      dbInstance = new SQL.Database();
    }
  } else if (fs.existsSync(OLD_DB_FILE_PATH)) {
    try {
      console.log('Migrating existing mercadocuba.sqlite to twinstore.sqlite...');
      const fileBuffer = fs.readFileSync(OLD_DB_FILE_PATH);
      dbInstance = new SQL.Database(fileBuffer);
    } catch (err) {
      console.error('Error migrating old SQLite file, creating new:', err);
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
  }

  initTables(dbInstance);
  seedIfEmpty(dbInstance);
  persistDb();

  return dbInstance;
}

export function persistDb() {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE_PATH, buffer);
  } catch (err) {
    console.error('Failed to save SQLite file:', err);
  }
}

function initTables(db: Database) {
  // Enforce foreign keys
  try {
    db.run("PRAGMA foreign_keys = ON;");
  } catch (e) {}

  db.run(`
    -- ============================================================
    -- Catálogos base (Fase 1)
    -- ============================================================
    CREATE TABLE IF NOT EXISTS provincias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provincia TEXT NOT NULL,
      descripcion TEXT DEFAULT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS provincias_provincia_IDX   ON provincias (provincia);
    CREATE UNIQUE INDEX IF NOT EXISTS provincias_descripcion_IDX ON provincias (descripcion);

    CREATE TABLE IF NOT EXISTS monedas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      moneda TEXT NOT NULL,
      abreviatura TEXT NOT NULL,
      descripcion TEXT DEFAULT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS monedas_moneda_IDX      ON monedas (moneda);
    CREATE UNIQUE INDEX IF NOT EXISTS monedas_abreviatura_IDX ON monedas (abreviatura);
    CREATE UNIQUE INDEX IF NOT EXISTS monedas_descripcion_IDX ON monedas (descripcion);

    CREATE TABLE IF NOT EXISTS departamentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      departamento TEXT NOT NULL,
      descripcion TEXT DEFAULT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS departamentos_departamento_IDX ON departamentos (departamento);
    CREATE UNIQUE INDEX IF NOT EXISTS departamentos_descripcion_IDX  ON departamentos (descripcion);

    CREATE TABLE IF NOT EXISTS etiquetas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      etiqueta TEXT NOT NULL,
      descripcion TEXT DEFAULT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS etiquetas_etiqueta_IDX ON etiquetas (etiqueta);

    CREATE TABLE IF NOT EXISTS tipo_ofertas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      oferta TEXT NOT NULL,
      descripcion TEXT DEFAULT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS tipo_ofertas_oferta_IDX      ON tipo_ofertas (oferta);
    CREATE UNIQUE INDEX IF NOT EXISTS tipo_ofertas_descripcion_IDX ON tipo_ofertas (descripcion);

    CREATE TABLE IF NOT EXISTS tipo_pagos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pago TEXT NOT NULL,
      descripcion TEXT DEFAULT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS tipo_pagos_pago_IDX        ON tipo_pagos (pago);
    CREATE UNIQUE INDEX IF NOT EXISTS tipo_pagos_descripcion_IDX ON tipo_pagos (descripcion);

    CREATE TABLE IF NOT EXISTS tipo_recogidas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recogida TEXT NOT NULL,
      descripcion TEXT DEFAULT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS tipo_recogidas_recogida_IDX ON tipo_recogidas (recogida);

    -- ============================================================
    -- Geografía (Fase 1)
    -- ============================================================
    CREATE TABLE IF NOT EXISTS municipios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      municipio TEXT NOT NULL,
      descripcion TEXT DEFAULT NULL,
      provincia_id INTEGER DEFAULT NULL,
      codigo_postal TEXT NOT NULL,
      CONSTRAINT municipios_provincias_FK FOREIGN KEY (provincia_id)
        REFERENCES provincias(id) ON DELETE RESTRICT ON UPDATE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS municipios_municipio_IDX ON municipios (municipio, provincia_id);
    CREATE INDEX IF NOT EXISTS idx_municipios_provincia ON municipios (provincia_id);

    CREATE TABLE IF NOT EXISTS repartos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reparto TEXT NOT NULL,
      descripcion TEXT DEFAULT NULL,
      municipio_id INTEGER DEFAULT NULL,
      CONSTRAINT repartos_municipios_FK FOREIGN KEY (municipio_id)
        REFERENCES municipios(id) ON DELETE RESTRICT ON UPDATE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS repartos_reparto_IDX ON repartos (reparto, municipio_id);
    CREATE INDEX IF NOT EXISTS idx_repartos_municipio ON repartos (municipio_id);

    -- ============================================================
    -- Subcatálogos (Fase 1)
    -- ============================================================
    CREATE TABLE IF NOT EXISTS subetiquetas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subetiqueta TEXT NOT NULL,
      descripcion TEXT DEFAULT NULL,
      etiqueta_id INTEGER DEFAULT NULL,
      CONSTRAINT subetiquetas_etiquetas_FK FOREIGN KEY (etiqueta_id)
        REFERENCES etiquetas(id) ON DELETE RESTRICT ON UPDATE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS subetiquetas_subetiqueta_IDX
      ON subetiquetas (subetiqueta, etiqueta_id);
    CREATE INDEX IF NOT EXISTS idx_subetiquetas_etiqueta ON subetiquetas (etiqueta_id);

    CREATE TABLE IF NOT EXISTS subdepartamentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subdepartamento TEXT NOT NULL,
      descripcion TEXT DEFAULT NULL,
      departamento_id INTEGER DEFAULT NULL,
      CONSTRAINT subdepartamentos_departamentos_FK FOREIGN KEY (departamento_id)
        REFERENCES departamentos(id) ON DELETE RESTRICT ON UPDATE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS subdepartamentos_subdepartamento_IDX
      ON subdepartamentos (subdepartamento, departamento_id);
    CREATE INDEX IF NOT EXISTS idx_subdepartamentos_departamento
      ON subdepartamentos (departamento_id);

    CREATE TABLE IF NOT EXISTS stores (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      logoUrl TEXT,
      images TEXT,
      slogan TEXT,
      description TEXT,
      whatsappPhone TEXT,
      location TEXT,
      address_street TEXT,
      address_number TEXT,
      address_building TEXT,
      address_apartment TEXT,
      address_crossStreet1 TEXT,
      address_crossStreet2 TEXT,
      address_neighborhood TEXT,
      address_municipality TEXT,
      address_province TEXT,
      address_googleMapsUrl TEXT,
      provincia_id INTEGER,
      municipio_id INTEGER,
      reparto_id INTEGER,
      codigo_postal TEXT,
      usdToCupRate REAL NOT NULL DEFAULT 330,
      deliveryAvailable INTEGER NOT NULL DEFAULT 0,
      paymentOptions_transferAccepted INTEGER NOT NULL DEFAULT 0,
      paymentOptions_transferFeePercentage REAL DEFAULT 0,
      paymentOptions_acceptedCurrencies TEXT,
      paymentOptions_notes TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      rating REAL DEFAULT 5.0,
      badge TEXT,
      paymentMethodIds TEXT,
      deliveryMethodIds TEXT,
      paymentPlatformIds TEXT,
      ratePaymentMethods TEXT,
      currencyPaymentMethods TEXT,
      exchangeRates TEXT,
      createdAt TEXT,
      FOREIGN KEY (provincia_id) REFERENCES provincias(id),
      FOREIGN KEY (municipio_id) REFERENCES municipios(id),
      FOREIGN KEY (reparto_id) REFERENCES repartos(id)
    );

    CREATE TABLE IF NOT EXISTS store_rate_payment_methods (
      id TEXT PRIMARY KEY,
      storeId TEXT NOT NULL,
      exchangeRateId TEXT NOT NULL,
      paymentMethodId TEXT NOT NULL,
      gravamen REAL DEFAULT 0.00,
      notes TEXT,
      FOREIGN KEY (storeId) REFERENCES stores(id) ON DELETE CASCADE,
      FOREIGN KEY (exchangeRateId) REFERENCES store_exchange_rates(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS store_currency_payment_methods (
      id TEXT PRIMARY KEY,
      storeId TEXT NOT NULL,
      currency TEXT NOT NULL,
      paymentMethodId TEXT NOT NULL,
      notes TEXT,
      FOREIGN KEY (storeId) REFERENCES stores(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS store_payment_platforms (
      storeId TEXT NOT NULL,
      paymentPlatformId TEXT NOT NULL,
      PRIMARY KEY (storeId, paymentPlatformId),
      FOREIGN KEY (storeId) REFERENCES stores(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS store_delivery_methods (
      storeId TEXT NOT NULL,
      deliveryMethodId TEXT NOT NULL,
      PRIMARY KEY (storeId, deliveryMethodId),
      FOREIGN KEY (storeId) REFERENCES stores(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS store_payment_methods (
      storeId TEXT NOT NULL,
      paymentMethodId TEXT NOT NULL,
      PRIMARY KEY (storeId, paymentMethodId),
      FOREIGN KEY (storeId) REFERENCES stores(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS store_exchange_rates (
      id TEXT PRIMARY KEY,
      storeId TEXT NOT NULL,
      fromCurrency TEXT NOT NULL,
      toCurrency TEXT NOT NULL,
      rate REAL NOT NULL,
      FOREIGN KEY (storeId) REFERENCES stores(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS global_exchange_rates (
      id TEXT PRIMARY KEY,
      fromCurrency TEXT NOT NULL,
      toCurrency TEXT NOT NULL,
      rate REAL NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS product_allowed_exchange_rates (
      id TEXT PRIMARY KEY,
      productId TEXT NOT NULL,
      storeId TEXT NOT NULL,
      exchangeRateId TEXT NOT NULL,
      FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      code TEXT,
      storeId TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL DEFAULT 0,
      priceUSD REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      allowedExchangeRateIds TEXT,
      category TEXT NOT NULL,
      subcategory TEXT,
      imageUrl TEXT,
      images TEXT,
      isAvailable INTEGER NOT NULL DEFAULT 1,
      isService INTEGER NOT NULL DEFAULT 0,
      deliveryAvailable INTEGER NOT NULL DEFAULT 0,
      featured INTEGER NOT NULL DEFAULT 0,
      tags TEXT,
      tagSelections TEXT,
      productTypeId TEXT,
      productType TEXT,
      paymentMethodIds TEXT,
      deliveryMethodIds TEXT,
      createdAt TEXT,
      FOREIGN KEY (storeId) REFERENCES stores(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS marketplace_config (
      id TEXT PRIMARY KEY DEFAULT 'default',
      name TEXT,
      slogan TEXT,
      logoUrl TEXT,
      defaultStoreLogoUrl TEXT,
      defaultProductImageUrl TEXT,
      bannerUrl TEXT,
      bannerTitle TEXT,
      bannerSubtitle TEXT,
      primaryColor TEXT,
      secondaryColor TEXT,
      accentColor TEXT,
      socialLinks TEXT,
      geoCatalog TEXT,
      departmentsCatalog TEXT,
      tagsCatalog TEXT,
      productTypesCatalog TEXT,
      paymentMethodsCatalog TEXT,
      deliveryMethodsCatalog TEXT,
      currenciesCatalog TEXT,
      globalExchangeRates TEXT,
      uiTexts TEXT
    );

    CREATE TABLE IF NOT EXISTS ui_texts (
      id TEXT PRIMARY KEY DEFAULT 'default',
      content TEXT,
      updatedAt TEXT
    );
  `);

  // Safe migration for existing SQLite files
  try { db.run("ALTER TABLE stores ADD COLUMN paymentMethodIds TEXT;"); } catch (e) {}
  try { db.run("ALTER TABLE stores ADD COLUMN deliveryMethodIds TEXT;"); } catch (e) {}
  try { db.run("ALTER TABLE stores ADD COLUMN exchangeRates TEXT;"); } catch (e) {}
  try { db.run("ALTER TABLE stores ADD COLUMN provincia_id INTEGER REFERENCES provincias(id);"); } catch (e) {}
  try { db.run("ALTER TABLE stores ADD COLUMN municipio_id INTEGER REFERENCES municipios(id);"); } catch (e) {}
  try { db.run("ALTER TABLE stores ADD COLUMN reparto_id INTEGER REFERENCES repartos(id);"); } catch (e) {}
  try { db.run("ALTER TABLE stores ADD COLUMN codigo_postal TEXT;"); } catch (e) {}
  try { db.run("ALTER TABLE stores ADD COLUMN paymentPlatformIds TEXT;"); } catch (e) {}
  try { db.run("ALTER TABLE stores ADD COLUMN ratePaymentMethods TEXT;"); } catch (e) {}
  try { db.run("ALTER TABLE stores ADD COLUMN currencyPaymentMethods TEXT;"); } catch (e) {}
  try { db.run("ALTER TABLE products ADD COLUMN code TEXT;"); } catch (e) {}
  try { db.run("ALTER TABLE products ADD COLUMN price REAL;"); } catch (e) {}
  try { db.run("ALTER TABLE products ADD COLUMN currency TEXT DEFAULT 'USD';"); } catch (e) {}
  try { db.run("ALTER TABLE products ADD COLUMN allowedExchangeRateIds TEXT;"); } catch (e) {}
  try { db.run("ALTER TABLE products ADD COLUMN productTypeId TEXT;"); } catch (e) {}
  try { db.run("ALTER TABLE products ADD COLUMN productType TEXT;"); } catch (e) {}
  try { db.run("ALTER TABLE products ADD COLUMN paymentMethodIds TEXT;"); } catch (e) {}
  try { db.run("ALTER TABLE products ADD COLUMN deliveryMethodIds TEXT;"); } catch (e) {}
  try { db.run("ALTER TABLE marketplace_config ADD COLUMN productTypesCatalog TEXT;"); } catch (e) {}
  try { db.run("ALTER TABLE marketplace_config ADD COLUMN paymentMethodsCatalog TEXT;"); } catch (e) {}
  try { db.run("ALTER TABLE marketplace_config ADD COLUMN deliveryMethodsCatalog TEXT;"); } catch (e) {}
  try { db.run("ALTER TABLE marketplace_config ADD COLUMN currenciesCatalog TEXT;"); } catch (e) {}
  try { db.run("ALTER TABLE marketplace_config ADD COLUMN globalExchangeRates TEXT;"); } catch (e) {}
  try { db.run("ALTER TABLE marketplace_config ADD COLUMN uiTexts TEXT;"); } catch (e) {}
  try { db.run("CREATE UNIQUE INDEX IF NOT EXISTS idx_products_code ON products(code);"); } catch (e) {}
  try { db.run("CREATE INDEX IF NOT EXISTS idx_store_rates_storeId ON store_exchange_rates(storeId);"); } catch (e) {}
  try { db.run("CREATE INDEX IF NOT EXISTS idx_prod_rates_productId ON product_allowed_exchange_rates(productId);"); } catch (e) {}
  try { db.run("CREATE INDEX IF NOT EXISTS idx_stores_provincia ON stores(provincia_id);"); } catch (e) {}
  try { db.run("CREATE INDEX IF NOT EXISTS idx_stores_municipio ON stores(municipio_id);"); } catch (e) {}
  try { db.run("CREATE INDEX IF NOT EXISTS idx_stores_reparto ON stores(reparto_id);"); } catch (e) {}
  try { db.run("CREATE INDEX IF NOT EXISTS idx_store_pay_plat_store ON store_payment_platforms(storeId);"); } catch (e) {}
  try { db.run("CREATE INDEX IF NOT EXISTS idx_store_deliv_meth_store ON store_delivery_methods(storeId);"); } catch (e) {}
  try { db.run("CREATE INDEX IF NOT EXISTS idx_store_pay_meth_store ON store_payment_methods(storeId);"); } catch (e) {}
  try { db.run("CREATE INDEX IF NOT EXISTS idx_store_rate_pay_store ON store_rate_payment_methods(storeId);"); } catch (e) {}
  try { db.run("CREATE INDEX IF NOT EXISTS idx_store_curr_pay_store ON store_currency_payment_methods(storeId);"); } catch (e) {}

  // Backfill Phase 2: Relational location FKs and junction tables for existing stores
  try {
    const storeRows = db.exec("SELECT id, address_province, address_municipality, address_neighborhood, paymentMethodIds, deliveryMethodIds, paymentPlatformIds, deliveryAvailable, paymentOptions_transferAccepted FROM stores");
    if (storeRows[0]?.values && storeRows[0].values.length > 0) {
      for (const row of storeRows[0].values) {
        const [sid, prov, mun, rep, pmStr, dmStr, platStr, delivAvail, transfAcc] = row;
        const locationFks = resolveStoreLocationFks(db, {
          province: String(prov || ''),
          municipality: String(mun || ''),
          neighborhood: String(rep || ''),
          street: '',
          number: ''
        });

        db.run(
          "UPDATE stores SET provincia_id = $pId, municipio_id = $mId, reparto_id = $rId, codigo_postal = $cp WHERE id = $id",
          {
            "$pId": locationFks.provincia_id,
            "$mId": locationFks.municipio_id,
            "$rId": locationFks.reparto_id,
            "$cp": locationFks.codigo_postal,
            "$id": sid
          }
        );

        // Junction: delivery methods
        const dmCheck = db.exec(`SELECT COUNT(*) FROM store_delivery_methods WHERE storeId = '${String(sid).replace(/'/g, "''")}'`);
        if ((dmCheck[0]?.values?.[0]?.[0] as number || 0) === 0) {
          let dms: string[] = [];
          try { if (dmStr) dms = JSON.parse(String(dmStr)); } catch (e) {}
          if (!dms || dms.length === 0) {
            dms = delivAvail ? ['dm-mensajeria', 'dm-recogida'] : ['dm-recogida'];
          }
          for (const dm of dms) {
            db.run("INSERT OR IGNORE INTO store_delivery_methods (storeId, deliveryMethodId) VALUES ($storeId, $dm)", {
              "$storeId": sid,
              "$dm": dm
            });
          }
        }

        // Junction: payment methods
        const pmCheck = db.exec(`SELECT COUNT(*) FROM store_payment_methods WHERE storeId = '${String(sid).replace(/'/g, "''")}'`);
        if ((pmCheck[0]?.values?.[0]?.[0] as number || 0) === 0) {
          let pms: string[] = [];
          try { if (pmStr) pms = JSON.parse(String(pmStr)); } catch (e) {}
          if (!pms || pms.length === 0) {
            pms = transfAcc ? ['pm-efectivo', 'pm-transferencia'] : ['pm-efectivo'];
          }
          for (const pm of pms) {
            db.run("INSERT OR IGNORE INTO store_payment_methods (storeId, paymentMethodId) VALUES ($storeId, $pm)", {
              "$storeId": sid,
              "$pm": pm
            });
          }
        }

        // Junction: payment platforms
        const platCheck = db.exec(`SELECT COUNT(*) FROM store_payment_platforms WHERE storeId = '${String(sid).replace(/'/g, "''")}'`);
        if ((platCheck[0]?.values?.[0]?.[0] as number || 0) === 0) {
          let plats: string[] = [];
          try { if (platStr) plats = JSON.parse(String(platStr)); } catch (e) {}
          if (!plats || plats.length === 0) {
            plats = transfAcc ? ['pp-banmet', 'pp-zelle', 'pp-paypal', 'pp-clasica'] : [];
          }
          for (const plat of plats) {
            db.run("INSERT OR IGNORE INTO store_payment_platforms (storeId, paymentPlatformId) VALUES ($storeId, $plat)", {
              "$storeId": sid,
              "$plat": plat
            });
          }
        }
      }
    }
  } catch (e) {
    console.error('Error backfilling store relational references:', e);
  }

  // Backfill any products that have null or empty codes
  try {
    const missingRes = db.exec("SELECT id FROM products WHERE code IS NULL OR code = ''");
    if (missingRes[0]?.values && missingRes[0].values.length > 0) {
      missingRes[0].values.forEach((row, idx) => {
        const prodId = row[0];
        const newCode = `PRD-${String(idx + 1).padStart(3, '0')}`;
        db.run("UPDATE products SET code = $code WHERE id = $id", { "$code": newCode, "$id": prodId });
      });
    }
  } catch (e) {}

  // Backfill or seed uiTexts in SQLite if missing or empty
  try {
    const configRes = db.exec("SELECT uiTexts FROM marketplace_config WHERE id = 'default'");
    const currentUi = configRes[0]?.values?.[0]?.[0];
    if (!currentUi || currentUi === '' || currentUi === 'null') {
      const defaultSerialized = JSON.stringify(DEFAULT_INTERFAZ);
      db.run("UPDATE marketplace_config SET uiTexts = $uiTexts WHERE id = 'default'", {
        "$uiTexts": defaultSerialized
      });
      db.run("INSERT OR REPLACE INTO ui_texts (id, content, updatedAt) VALUES ('default', $content, $updatedAt)", {
        "$content": defaultSerialized,
        "$updatedAt": new Date().toISOString()
      });
    }
  } catch (e) {}
}

export function seedCatalogosIfEmpty(db: Database) {
  try {
    const provCheck = db.exec("SELECT COUNT(*) as cnt FROM provincias");
    const provCount = (provCheck[0]?.values[0]?.[0] as number) || 0;

    if (provCount === 0) {
      console.log('🌱 Seeding strict SQLite Phase 1 catalogs and geography...');

      // 1. Provincias
      const provincias = [
        { id: 1, provincia: 'La Habana', descripcion: 'Capital y principal centro comercial' },
        { id: 2, provincia: 'Región Metropolitana', descripcion: 'Zona metropolitana principal' },
        { id: 3, provincia: 'Región Norte', descripcion: 'Zona norte y costera' },
        { id: 4, provincia: 'Región Sur', descripcion: 'Zona sur' },
      ];
      for (const p of provincias) {
        db.run(
          "INSERT OR IGNORE INTO provincias (id, provincia, descripcion) VALUES ($id, $provincia, $descripcion)",
          { "$id": p.id, "$provincia": p.provincia, "$descripcion": p.descripcion }
        );
      }

      // 2. Municipios (con codigo_postal NOT NULL)
      const municipios = [
        // La Habana (id: 1)
        { id: 1, municipio: 'Plaza de la Revolución', descripcion: 'Municipio céntrico comercial y cultural', provincia_id: 1, codigo_postal: '10400' },
        { id: 2, municipio: 'Playa', descripcion: 'Municipio costero residencial y diplomático', provincia_id: 1, codigo_postal: '11300' },
        { id: 3, municipio: 'Habana Vieja', descripcion: 'Casco histórico patrimonio de la humanidad', provincia_id: 1, codigo_postal: '10100' },
        { id: 4, municipio: 'Centro Habana', descripcion: 'Zona de alta densidad y actividad comercial', provincia_id: 1, codigo_postal: '10200' },
        { id: 5, municipio: 'Diez de Octubre', descripcion: 'Municipio tradicional y residencial', provincia_id: 1, codigo_postal: '10700' },
        // Región Metropolitana (id: 2)
        { id: 6, municipio: 'Distrito Centro', descripcion: 'Núcleo administrativo y comercial metropolitano', provincia_id: 2, codigo_postal: '10100' },
        { id: 7, municipio: 'Distrito Norte', descripcion: 'Sector norte metropolitano', provincia_id: 2, codigo_postal: '10200' },
        { id: 8, municipio: 'Distrito Sur', descripcion: 'Sector sur metropolitano', provincia_id: 2, codigo_postal: '10300' },
        { id: 9, municipio: 'Distrito Este', descripcion: 'Sector este y puerto metropolitano', provincia_id: 2, codigo_postal: '10400' },
        { id: 10, municipio: 'Distrito Oeste', descripcion: 'Sector oeste y jardines metropolitanos', provincia_id: 2, codigo_postal: '10500' },
        // Región Norte (id: 3)
        { id: 11, municipio: 'Ciudad Norte', descripcion: 'Centro urbano e industrial', provincia_id: 3, codigo_postal: '20100' },
        { id: 12, municipio: 'Costa Dorada', descripcion: 'Franja costera y boulevard turístico', provincia_id: 3, codigo_postal: '20200' },
        // Región Sur (id: 4)
        { id: 13, municipio: 'Ciudad del Sol', descripcion: 'Centro histórico y paseo sur', provincia_id: 4, codigo_postal: '30100' },
      ];
      for (const m of municipios) {
        db.run(
          "INSERT OR IGNORE INTO municipios (id, municipio, descripcion, provincia_id, codigo_postal) VALUES ($id, $municipio, $descripcion, $provincia_id, $codigo_postal)",
          { "$id": m.id, "$municipio": m.municipio, "$descripcion": m.descripcion, "$provincia_id": m.provincia_id, "$codigo_postal": m.codigo_postal }
        );
      }

      // 3. Repartos
      const repartos = [
        { id: 1, reparto: 'Vedado', descripcion: 'Barrio céntrico y cultural', municipio_id: 1 },
        { id: 2, reparto: 'Nuevo Vedado', descripcion: 'Zona residencial', municipio_id: 1 },
        { id: 3, reparto: 'Miramar', descripcion: 'Avenida 5ta y sector comercial', municipio_id: 2 },
        { id: 4, reparto: 'Flores', descripcion: 'Zona residencial costera', municipio_id: 2 },
        { id: 5, reparto: 'Siboney', descripcion: 'Zona residencial oeste', municipio_id: 2 },
        { id: 6, reparto: 'Centro Histórico', descripcion: 'Plazas coloniales', municipio_id: 3 },
        { id: 7, reparto: 'San Isidro', descripcion: 'Distrito de arte y diseño', municipio_id: 3 },
        { id: 8, reparto: 'Jesús María', descripcion: 'Zona portuaria histórica', municipio_id: 3 },
        { id: 9, reparto: 'Cayo Hueso', descripcion: 'Callejón de Hamel y parque', municipio_id: 4 },
        { id: 10, reparto: 'Colón', descripcion: 'Zona central comercial', municipio_id: 4 },
        { id: 11, reparto: 'Dragones', descripcion: 'Barrio chino y bulevar', municipio_id: 4 },
        { id: 12, reparto: 'Santos Suárez', descripcion: 'Barrio residencial', municipio_id: 5 },
        { id: 13, reparto: 'La Víbora', descripcion: 'Zona alta y comercial', municipio_id: 5 },
        { id: 14, reparto: 'Luyanó', descripcion: 'Zona mixta', municipio_id: 5 },
        // Distrito Centro
        { id: 15, reparto: 'Centro Histórico', descripcion: 'Casco histórico metropolitano', municipio_id: 6 },
        { id: 16, reparto: 'Zona Comercial', descripcion: 'Avenidas y tiendas principales', municipio_id: 6 },
        { id: 17, reparto: 'Distrito Financiero', descripcion: 'Banca y corporativos', municipio_id: 6 },
        { id: 18, reparto: 'Parque Central', descripcion: 'Paseo central', municipio_id: 6 },
        // Distrito Norte
        { id: 19, reparto: 'Valle Alto', descripcion: 'Zona residencial norte', municipio_id: 7 },
        { id: 20, reparto: 'Los Pinos', descripcion: 'Residencial campestre', municipio_id: 7 },
        { id: 21, reparto: 'Colinas del Norte', descripcion: 'Alturas norteñas', municipio_id: 7 },
        // Distrito Sur
        { id: 22, reparto: 'Mirador', descripcion: 'Mirador panorámico', municipio_id: 8 },
        { id: 23, reparto: 'Residencial Sur', descripcion: 'Urbanización sur', municipio_id: 8 },
        { id: 24, reparto: 'Praderas', descripcion: 'Zona abierta', municipio_id: 8 },
        // Distrito Este
        { id: 25, reparto: 'Costa Este', descripcion: 'Costa y muelles', municipio_id: 9 },
        { id: 26, reparto: 'El Puerto', descripcion: 'Actividad portuaria', municipio_id: 9 },
        // Distrito Oeste
        { id: 27, reparto: 'Jardines del Sol', descripcion: 'Zona ajardinada', municipio_id: 10 },
        { id: 28, reparto: 'La Alameda', descripcion: 'Paseo arbolado', municipio_id: 10 },
        // Ciudad Norte
        { id: 29, reparto: 'Centro Urbano', descripcion: 'Núcleo de ciudad norte', municipio_id: 11 },
        { id: 30, reparto: 'Zona Industrial', descripcion: 'Complejo fabril y logístico', municipio_id: 11 },
        // Costa Dorada
        { id: 31, reparto: 'Sector Costero', descripcion: 'Playa y malecón', municipio_id: 12 },
        { id: 32, reparto: 'El Boulevard', descripcion: 'Avenida gastronómica y compras', municipio_id: 12 },
        // Ciudad del Sol
        { id: 33, reparto: 'Centro Histórico', descripcion: 'Plaza mayor', municipio_id: 13 },
        { id: 34, reparto: 'Paseo de la Alameda', descripcion: 'Paseo colonial', municipio_id: 13 },
      ];
      for (const r of repartos) {
        db.run(
          "INSERT OR IGNORE INTO repartos (id, reparto, descripcion, municipio_id) VALUES ($id, $reparto, $descripcion, $municipio_id)",
          { "$id": r.id, "$reparto": r.reparto, "$descripcion": r.descripcion, "$municipio_id": r.municipio_id }
        );
      }

      // 4. Monedas
      const monedas = [
        { id: 1, moneda: 'Dólar Estadounidense', abreviatura: 'USD', descripcion: 'Moneda de referencia comercial internacional' },
        { id: 2, moneda: 'Euro', abreviatura: 'EUR', descripcion: 'Moneda oficial de la Unión Europea' },
        { id: 3, moneda: 'Peso Cubano', abreviatura: 'CUP', descripcion: 'Moneda nacional de curso legal' },
        { id: 4, moneda: 'Peso Mexicano', abreviatura: 'MXN', descripcion: 'Moneda de curso legal de México' },
        { id: 5, moneda: 'Peso Colombiano', abreviatura: 'COP', descripcion: 'Moneda de curso legal de Colombia' },
      ];
      for (const mon of monedas) {
        db.run(
          "INSERT OR IGNORE INTO monedas (id, moneda, abreviatura, descripcion) VALUES ($id, $moneda, $abreviatura, $descripcion)",
          { "$id": mon.id, "$moneda": mon.moneda, "$abreviatura": mon.abreviatura, "$descripcion": mon.descripcion }
        );
      }

      // 5. Departamentos
      const departamentos = [
        { id: 1, departamento: 'Alimentos y Combos', descripcion: 'Productos alimenticios, combos cárnicos, granos y enlatados' },
        { id: 2, departamento: 'Ferretería y Construcción', descripcion: 'Herramientas, materiales eléctricos y pinturas' },
        { id: 3, departamento: 'Motos y Repuestos', descripcion: 'Motos eléctricas, baterías de litio y piezas' },
        { id: 4, departamento: 'Celulares y Electrónica', descripcion: 'Teléfonos inteligentes y tecnología' },
        { id: 5, departamento: 'Belleza y Salud', descripcion: 'Cuidado personal y perfumería' },
        { id: 6, departamento: 'Servicios Profesionales', descripcion: 'Servicios técnicos y transportación' },
      ];
      for (const dep of departamentos) {
        db.run(
          "INSERT OR IGNORE INTO departamentos (id, departamento, descripcion) VALUES ($id, $departamento, $descripcion)",
          { "$id": dep.id, "$departamento": dep.departamento, "$descripcion": dep.descripcion }
        );
      }

      // 6. Subdepartamentos
      const subdepartamentos = [
        // Alimentos y Combos (1)
        { id: 1, subdepartamento: 'Carnes y Embutidos', descripcion: 'Carnes de res, cerdo, pollo y embutidos', departamento_id: 1 },
        { id: 2, subdepartamento: 'Pescados y Mariscos', descripcion: 'Pescados frescos, mariscos y conservas', departamento_id: 1 },
        { id: 3, subdepartamento: 'Granos y Cereales', descripcion: 'Arroz, frijoles y cereales', departamento_id: 1 },
        { id: 4, subdepartamento: 'Salsas y Condimentos', descripcion: 'Especias, mayonesa, kétchup y salsas', departamento_id: 1 },
        { id: 5, subdepartamento: 'Pastas y Enlatados', descripcion: 'Espaguetis, conservas y puré', departamento_id: 1 },
        { id: 6, subdepartamento: 'Lácteos y Quesos', descripcion: 'Leche, mantequilla y quesos', departamento_id: 1 },
        { id: 7, subdepartamento: 'Aceites y Mantecas', descripcion: 'Aceite vegetal y manteca', departamento_id: 1 },
        { id: 8, subdepartamento: 'Bebidas y Licores', descripcion: 'Refrescos, cervezas, rones y vinos', departamento_id: 1 },
        // Ferretería y Construcción (2)
        { id: 9, subdepartamento: 'Herramientas Manuales', descripcion: 'Martillos, pinzas, destornilladores', departamento_id: 2 },
        { id: 10, subdepartamento: 'Herramientas Eléctricas', descripcion: 'Taladros, pulidoras y sierras', departamento_id: 2 },
        { id: 11, subdepartamento: 'Pinturas e Impermeabilizantes', descripcion: 'Pinturas vinil, esmalte y selladores', departamento_id: 2 },
        { id: 12, subdepartamento: 'Fontanería y Tuberías', descripcion: 'Llaves, tubos PVC y accesorios', departamento_id: 2 },
        { id: 13, subdepartamento: 'Materiales Eléctricos', descripcion: 'Cables, breakers, tomacorrientes', departamento_id: 2 },
        { id: 14, subdepartamento: 'Cerraduras y Candados', descripcion: 'Cerraduras pomo, de sobreponer y candados', departamento_id: 2 },
        // Motos y Repuestos (3)
        { id: 15, subdepartamento: 'Baterías de Litio / Gel', descripcion: 'Baterías de litio 72V, 60V y gel', departamento_id: 3 },
        { id: 16, subdepartamento: 'Neumáticos y Cámaras', descripcion: 'Neumáticos sin cámara y tubulares', departamento_id: 3 },
        { id: 17, subdepartamento: 'Piezas Eléctricas y Mandos', descripcion: 'Cajas reguladoras, aceleradores y luces', departamento_id: 3 },
        { id: 18, subdepartamento: 'Accesorios y Cascos', descripcion: 'Cascos de protección, alarmas y espejos', departamento_id: 3 },
        // Celulares y Electrónica (4)
        { id: 19, subdepartamento: 'Teléfonos Inteligentes', descripcion: 'Smartphones Android e iOS', departamento_id: 4 },
        { id: 20, subdepartamento: 'Cargadores y Cables', descripcion: 'Cargadores rápidos, Tipo C y Lightning', departamento_id: 4 },
        { id: 21, subdepartamento: 'Audio y Audífonos', descripcion: 'Audífonos Bluetooth y bocinas inalámbricas', departamento_id: 4 },
        { id: 22, subdepartamento: 'Fundas y Protectores', descripcion: 'Covers y vidrios templados', departamento_id: 4 },
        // Belleza y Salud (5)
        { id: 23, subdepartamento: 'Capilar y Queratinas', descripcion: 'Champú, tintes y tratamientos', departamento_id: 5 },
        { id: 24, subdepartamento: 'Perfumería y Colonias', descripcion: 'Fragancias de caballero y dama', departamento_id: 5 },
        { id: 25, subdepartamento: 'Maquillaje y Rostro', descripcion: 'Bases, labiales y máscaras', departamento_id: 5 },
        { id: 26, subdepartamento: 'Medicamentos e Higiene', descripcion: 'Higiene personal y bienestar', departamento_id: 5 },
        // Servicios Profesionales (6)
        { id: 27, subdepartamento: 'Mantenimiento y Taller', descripcion: 'Reparaciones mecánicas y electrónicas', departamento_id: 6 },
        { id: 28, subdepartamento: 'Transportación y Envíos', descripcion: 'Fletes y mensajería urbana', departamento_id: 6 },
        { id: 29, subdepartamento: 'Reparaciones del Hogar', descripcion: 'Plomería, albañilería y electricidad residencial', departamento_id: 6 },
      ];
      for (const sub of subdepartamentos) {
        db.run(
          "INSERT OR IGNORE INTO subdepartamentos (id, subdepartamento, descripcion, departamento_id) VALUES ($id, $subdepartamento, $descripcion, $departamento_id)",
          { "$id": sub.id, "$subdepartamento": sub.subdepartamento, "$descripcion": sub.descripcion, "$departamento_id": sub.departamento_id }
        );
      }

      // 7. Etiquetas
      const etiquetas = [
        { id: 1, etiqueta: 'Color', descripcion: 'Color principal o variantes de color disponibles' },
        { id: 2, etiqueta: 'Estaciones', descripcion: 'Temporada o estación ideal del año' },
        { id: 3, etiqueta: 'Estado / Condición', descripcion: 'Condición del producto o artículo' },
        { id: 4, etiqueta: 'Garantía', descripcion: 'Tiempo de garantía respaldada por el vendedor' },
      ];
      for (const et of etiquetas) {
        db.run(
          "INSERT OR IGNORE INTO etiquetas (id, etiqueta, descripcion) VALUES ($id, $etiqueta, $descripcion)",
          { "$id": et.id, "$etiqueta": et.etiqueta, "$descripcion": et.descripcion }
        );
      }

      // 8. Subetiquetas
      const subetiquetas = [
        // Color (1)
        { id: 1, subetiqueta: 'Rojo', descripcion: 'Color rojo', etiqueta_id: 1 },
        { id: 2, subetiqueta: 'Azul', descripcion: 'Color azul', etiqueta_id: 1 },
        { id: 3, subetiqueta: 'Blanco', descripcion: 'Color blanco', etiqueta_id: 1 },
        { id: 4, subetiqueta: 'Negro', descripcion: 'Color negro', etiqueta_id: 1 },
        { id: 5, subetiqueta: 'Verde', descripcion: 'Color verde', etiqueta_id: 1 },
        { id: 6, subetiqueta: 'Amarillo', descripcion: 'Color amarillo', etiqueta_id: 1 },
        { id: 7, subetiqueta: 'Gris', descripcion: 'Color gris', etiqueta_id: 1 },
        // Estaciones (2)
        { id: 8, subetiqueta: 'Invierno', descripcion: 'Temporada de invierno', etiqueta_id: 2 },
        { id: 9, subetiqueta: 'Verano', descripcion: 'Temporada de verano', etiqueta_id: 2 },
        { id: 10, subetiqueta: 'Otoño', descripcion: 'Temporada de otoño', etiqueta_id: 2 },
        { id: 11, subetiqueta: 'Primavera', descripcion: 'Temporada de primavera', etiqueta_id: 2 },
        // Estado / Condición (3)
        { id: 12, subetiqueta: 'Nuevo Sello', descripcion: 'Completamente nuevo en caja sellada', etiqueta_id: 3 },
        { id: 13, subetiqueta: 'Seminuevo', descripcion: 'Poco uso en óptimas condiciones', etiqueta_id: 3 },
        { id: 14, subetiqueta: 'Reacondicionado', descripcion: 'Revisado y certificado por técnico', etiqueta_id: 3 },
        // Garantía (4)
        { id: 15, subetiqueta: '1 Mes', descripcion: '30 días de cobertura directa', etiqueta_id: 4 },
        { id: 16, subetiqueta: '3 Meses', descripcion: '90 días de garantía directa', etiqueta_id: 4 },
        { id: 17, subetiqueta: '6 Meses', descripcion: 'Medio año de garantía', etiqueta_id: 4 },
        { id: 18, subetiqueta: '1 Año', descripcion: 'Garantía anual extendida', etiqueta_id: 4 },
      ];
      for (const se of subetiquetas) {
        db.run(
          "INSERT OR IGNORE INTO subetiquetas (id, subetiqueta, descripcion, etiqueta_id) VALUES ($id, $subetiqueta, $descripcion, $etiqueta_id)",
          { "$id": se.id, "$subetiqueta": se.subetiqueta, "$descripcion": se.descripcion, "$etiqueta_id": se.etiqueta_id }
        );
      }

      // 9. Tipo de Ofertas
      const tipoOfertas = [
        { id: 1, oferta: 'Productos Físicos', descripcion: 'Artículos físicos, bienes tangibles, alimentos, electrodomésticos y equipos' },
        { id: 2, oferta: 'Servicios Profesionales', descripcion: 'Servicios técnicos, reparaciones, mantenimiento, consultoría y oficios' },
        { id: 3, oferta: 'Alquileres y Rentas', descripcion: 'Renta de viviendas, autos, equipos para eventos, herramientas y trajes' },
        { id: 4, oferta: 'Digital y Recargas', descripcion: 'Cuentas streaming, licencias, cursos online, diseño gráfico y recargas' },
      ];
      for (const to of tipoOfertas) {
        db.run(
          "INSERT OR IGNORE INTO tipo_ofertas (id, oferta, descripcion) VALUES ($id, $oferta, $descripcion)",
          { "$id": to.id, "$oferta": to.oferta, "$descripcion": to.descripcion }
        );
      }

      // 10. Tipo de Pagos
      const tipoPagos = [
        { id: 1, pago: 'Efectivo', descripcion: 'Pago directo en efectivo en tienda o contra entrega' },
        { id: 2, pago: 'Transferencia Bancaria', descripcion: 'Transferencia bancaria directa, SPEI o banca electrónica' },
        { id: 3, pago: 'Transferencia Internacional / Digital', descripcion: 'Zelle, transferencia internacional, tarjeta de crédito o débito' },
        { id: 4, pago: 'Criptomonedas', descripcion: 'Pagos mediante USDT, Bitcoin u otras criptomonedas' },
      ];
      for (const tp of tipoPagos) {
        db.run(
          "INSERT OR IGNORE INTO tipo_pagos (id, pago, descripcion) VALUES ($id, $pago, $descripcion)",
          { "$id": tp.id, "$pago": tp.pago, "$descripcion": tp.descripcion }
        );
      }

      // 11. Tipo de Recogidas
      const tipoRecogidas = [
        { id: 1, recogida: 'Mensajería a Domicilio', descripcion: 'Entrega directa hasta la puerta del cliente con mensajero' },
        { id: 2, recogida: 'Recogida en Tienda / Local', descripcion: 'El cliente retira personalmente su compra en la sede o local de la tienda' },
        { id: 3, recogida: 'Punto de Encuentro', descripcion: 'Entrega acordada en un punto de referencia céntrico (plaza, centro comercial, etc.)' },
        { id: 4, recogida: 'Envío Nacional / Regional', descripcion: 'Envíos a otras ciudades o regiones por paquetería express' },
      ];
      for (const tr of tipoRecogidas) {
        db.run(
          "INSERT OR IGNORE INTO tipo_recogidas (id, recogida, descripcion) VALUES ($id, $recogida, $descripcion)",
          { "$id": tr.id, "$recogida": tr.recogida, "$descripcion": tr.descripcion }
        );
      }
    }
  } catch (e) {
    console.error('Error seeding Phase 1 catalogs:', e);
  }
}

export function getCatalogosFromDb(db: Database): DbCatalogosResponse {
  const queryTable = (tableName: string) => {
    try {
      const res = db.exec(`SELECT * FROM ${tableName} ORDER BY id ASC`);
      if (!res[0] || !res[0].values) return [];
      const cols = res[0].columns;
      return res[0].values.map((row) => {
        const obj: any = {};
        cols.forEach((col, idx) => {
          obj[col] = row[idx];
        });
        return obj;
      });
    } catch (e) {
      console.error(`Error querying table ${tableName}:`, e);
      return [];
    }
  };

  return {
    provincias: queryTable('provincias'),
    municipios: queryTable('municipios'),
    repartos: queryTable('repartos'),
    monedas: queryTable('monedas'),
    departamentos: queryTable('departamentos'),
    subdepartamentos: queryTable('subdepartamentos'),
    etiquetas: queryTable('etiquetas'),
    subetiquetas: queryTable('subetiquetas'),
    tipo_ofertas: queryTable('tipo_ofertas'),
    tipo_pagos: queryTable('tipo_pagos'),
    tipo_recogidas: queryTable('tipo_recogidas'),
  };
}

export function buildHierarchicalCatalogsFromDb(catalogos: DbCatalogosResponse): {
  geoCatalog: GeoProvince[];
  departmentsCatalog: DepartmentCategory[];
  tagsCatalog: TagGroup[];
  currenciesCatalog: CurrencyItem[];
  productTypesCatalog: ProductTypeItem[];
  paymentMethodsCatalog: PaymentMethodItem[];
  deliveryMethodsCatalog: DeliveryMethodItem[];
} {
  // 1. Geo Catalog: Provincias -> Municipios (con codigo_postal) -> Repartos
  const geoCatalog: GeoProvince[] = catalogos.provincias.map((prov) => {
    const provMunicipios = catalogos.municipios
      .filter((m) => m.provincia_id === prov.id)
      .map((mun) => {
        const munRepartos = catalogos.repartos
          .filter((r) => r.municipio_id === mun.id)
          .map((rep) => ({
            id: `rep-${rep.id}`,
            name: rep.reparto,
          }));

        return {
          id: `mun-${mun.id}`,
          name: mun.municipio,
          codigo_postal: mun.codigo_postal,
          codigoPostal: mun.codigo_postal,
          repartos: munRepartos,
        };
      });

    return {
      id: `prov-${prov.id}`,
      name: prov.provincia,
      municipalities: provMunicipios,
    };
  });

  // 2. Departments Catalog: Departamentos -> Subdepartamentos
  const departmentsCatalog: DepartmentCategory[] = catalogos.departamentos.map((dep) => {
    const subs = catalogos.subdepartamentos
      .filter((s) => s.departamento_id === dep.id)
      .map((sub) => ({
        id: `sub-${sub.id}`,
        name: sub.subdepartamento,
        description: sub.descripcion || '',
      }));

    return {
      id: `dep-${dep.id}`,
      name: dep.departamento,
      description: dep.descripcion || '',
      subcategories: subs,
    };
  });

  // 3. Tags Catalog: Etiquetas -> Subetiquetas
  const tagsCatalog: TagGroup[] = catalogos.etiquetas.map((et) => {
    const tags = catalogos.subetiquetas
      .filter((se) => se.etiqueta_id === et.id)
      .map((sub) => ({
        id: `tag-${sub.id}`,
        name: sub.subetiqueta,
        description: sub.descripcion || '',
      }));

    return {
      id: `tg-${et.id}`,
      name: et.etiqueta,
      description: et.descripcion || '',
      tags,
    };
  });

  // 4. Currencies Catalog: Monedas
  const currenciesCatalog: CurrencyItem[] = catalogos.monedas.map((m) => {
    const isEur = m.abreviatura.toUpperCase() === 'EUR';
    return {
      id: `curr-${m.abreviatura.toLowerCase()}`,
      code: m.abreviatura.toUpperCase(),
      name: m.moneda,
      symbol: isEur ? '€' : '$',
      description: m.descripcion || '',
      active: true,
    };
  });

  // 5. Product Types: Tipo de Ofertas
  const productTypesCatalog: ProductTypeItem[] = catalogos.tipo_ofertas.map((to) => ({
    id: `pt-${to.id}`,
    name: to.oferta,
    description: to.descripcion || '',
    active: true,
  }));

  // 6. Payment Methods: Tipo de Pagos
  const paymentMethodsCatalog: PaymentMethodItem[] = catalogos.tipo_pagos.map((tp) => ({
    id: `pm-${tp.id}`,
    name: tp.pago,
    description: tp.descripcion || '',
    active: true,
  }));

  // 7. Delivery Methods: Tipo de Recogidas
  const deliveryMethodsCatalog: DeliveryMethodItem[] = catalogos.tipo_recogidas.map((tr) => ({
    id: `dm-${tr.id}`,
    name: tr.recogida,
    description: tr.descripcion || '',
    active: true,
  }));

  return {
    geoCatalog,
    departmentsCatalog,
    tagsCatalog,
    currenciesCatalog,
    productTypesCatalog,
    paymentMethodsCatalog,
    deliveryMethodsCatalog,
  };
}

function seedIfEmpty(db: Database) {
  // Always ensure canonical Phase 1 catalogs and geography tables are populated
  seedCatalogosIfEmpty(db);

  const storeCheck = db.exec("SELECT COUNT(*) as cnt FROM stores");
  const storeCount = storeCheck[0]?.values[0]?.[0] as number || 0;

  if (storeCount === 0) {
    console.log('🌱 Seeding SQLite database with initial stores and products...');

    // Seed Config
    saveConfigToDb(db, INITIAL_MARKETPLACE_CONFIG);

    // Seed Stores
    for (const st of INITIAL_STORES) {
      saveStoreToDb(db, st);
    }

    // Seed Products
    for (const pr of INITIAL_PRODUCTS) {
      saveProductToDb(db, pr);
    }
  }
}

// Helper SQL Mappers
export function resolveStoreLocationFks(
  db: Database,
  address?: StoreAddress
): {
  provincia_id: number | null;
  municipio_id: number | null;
  reparto_id: number | null;
  codigo_postal: string | null;
} {
  if (!address) {
    return { provincia_id: null, municipio_id: null, reparto_id: null, codigo_postal: null };
  }

  let provincia_id: number | null = null;
  let municipio_id: number | null = null;
  let reparto_id: number | null = null;
  let codigo_postal: string | null = null;

  const prov = (address.province || '').trim().toLowerCase();
  const munRaw = (address.municipality || '').trim();
  const munNorm = munRaw.toLowerCase().includes('habana vieja') ? 'habana vieja' : munRaw.toLowerCase();
  const repRaw = (address.neighborhood || '').trim();
  const repNorm = repRaw.toLowerCase() === 'el vedado' ? 'vedado' : repRaw.toLowerCase();

  if (prov) {
    try {
      const pRes = db.exec(`SELECT id FROM provincias WHERE LOWER(TRIM(provincia)) = '${prov.replace(/'/g, "''")}' LIMIT 1`);
      if (pRes[0]?.values?.[0]?.[0]) {
        provincia_id = Number(pRes[0].values[0][0]);
      }
    } catch (e) {}
  }

  if (munNorm) {
    try {
      let mSql = `SELECT id, codigo_postal, provincia_id FROM municipios WHERE LOWER(TRIM(municipio)) = '${munNorm.replace(/'/g, "''")}'`;
      if (provincia_id !== null) {
        mSql += ` AND provincia_id = ${provincia_id}`;
      }
      mSql += ` LIMIT 1`;
      const mRes = db.exec(mSql);
      if (mRes[0]?.values?.[0]) {
        municipio_id = Number(mRes[0].values[0][0]);
        codigo_postal = String(mRes[0].values[0][1] || '');
        if (provincia_id === null && mRes[0].values[0][2]) {
          provincia_id = Number(mRes[0].values[0][2]);
        }
      }
    } catch (e) {}
  }

  if (repNorm) {
    try {
      let rSql = `SELECT id, municipio_id FROM repartos WHERE LOWER(TRIM(reparto)) = '${repNorm.replace(/'/g, "''")}'`;
      if (municipio_id !== null) {
        rSql += ` AND municipio_id = ${municipio_id}`;
      }
      rSql += ` LIMIT 1`;
      const rRes = db.exec(rSql);
      if (rRes[0]?.values?.[0]) {
        reparto_id = Number(rRes[0].values[0][0]);
      }
    } catch (e) {}
  }

  if (!codigo_postal && address.codigoPostal) {
    codigo_postal = address.codigoPostal;
  }

  return { provincia_id, municipio_id, reparto_id, codigo_postal };
}

export function saveStoreToDb(db: Database, store: Store) {
  const defaultPaymentIds = store.paymentOptions?.transferAccepted
    ? ['pm-efectivo', 'pm-transferencia']
    : ['pm-efectivo'];
  const defaultDeliveryIds = store.deliveryAvailable
    ? ['dm-mensajeria', 'dm-recogida']
    : ['dm-recogida'];
  const effectivePaymentMethods = (store.paymentMethodIds && store.paymentMethodIds.length > 0)
    ? store.paymentMethodIds
    : defaultPaymentIds;
  const effectiveDeliveryMethods = (store.deliveryMethodIds && store.deliveryMethodIds.length > 0)
    ? store.deliveryMethodIds
    : defaultDeliveryIds;
  const effectivePaymentPlatforms = (store.paymentPlatformIds && store.paymentPlatformIds.length > 0)
    ? store.paymentPlatformIds
    : (store.paymentOptions?.transferAccepted ? ['pp-banmet', 'pp-zelle', 'pp-paypal', 'pp-clasica'] : []);

  let effectiveRates: StoreExchangeRate[] = Array.isArray(store.exchangeRates) && store.exchangeRates.length > 0
    ? store.exchangeRates
    : (INITIAL_STORES.find(s => s.id === store.id)?.exchangeRates || [
        {
          id: `rate-${store.id}-USD-EUR`,
          storeId: store.id,
          fromCurrency: 'USD',
          toCurrency: 'EUR',
          rate: 0.92,
        },
      ]);

  // Ensure storeId is set on each rate
  effectiveRates = effectiveRates.map((r) => ({
    ...r,
    storeId: store.id,
  }));

  // Resolve relational location foreign keys (provincia_id, municipio_id, reparto_id, codigo_postal)
  const locationFks = resolveStoreLocationFks(db, store.address);

  const sql = `
    INSERT OR REPLACE INTO stores (
      id, name, logoUrl, images, slogan, description, whatsappPhone, location,
      address_street, address_number, address_building, address_apartment,
      address_crossStreet1, address_crossStreet2, address_neighborhood,
      address_municipality, address_province, address_googleMapsUrl,
      provincia_id, municipio_id, reparto_id, codigo_postal,
      usdToCupRate, deliveryAvailable, paymentOptions_transferAccepted,
      paymentOptions_transferFeePercentage, paymentOptions_acceptedCurrencies,
      paymentOptions_notes, active, rating, badge,
      paymentMethodIds, deliveryMethodIds, paymentPlatformIds,
      ratePaymentMethods, currencyPaymentMethods,
      exchangeRates, createdAt
    ) VALUES (
      $id, $name, $logoUrl, $images, $slogan, $description, $whatsappPhone, $location,
      $address_street, $address_number, $address_building, $address_apartment,
      $address_crossStreet1, $address_crossStreet2, $address_neighborhood,
      $address_municipality, $address_province, $address_googleMapsUrl,
      $provincia_id, $municipio_id, $reparto_id, $codigo_postal,
      $usdToCupRate, $deliveryAvailable, $paymentOptions_transferAccepted,
      $paymentOptions_transferFeePercentage, $paymentOptions_acceptedCurrencies,
      $paymentOptions_notes, $active, $rating, $badge,
      $paymentMethodIds, $deliveryMethodIds, $paymentPlatformIds,
      $ratePaymentMethods, $currencyPaymentMethods,
      $exchangeRates, $createdAt
    )
  `;

  const params = {
    '$id': store.id,
    '$name': store.name,
    '$logoUrl': store.logoUrl || '',
    '$images': JSON.stringify(store.images || []),
    '$slogan': store.slogan || '',
    '$description': store.description || '',
    '$whatsappPhone': store.whatsappPhone || '',
    '$location': store.location || '',
    '$address_street': store.address?.street || '',
    '$address_number': store.address?.number || '',
    '$address_building': store.address?.building || '',
    '$address_apartment': store.address?.apartment || '',
    '$address_crossStreet1': store.address?.crossStreet1 || '',
    '$address_crossStreet2': store.address?.crossStreet2 || '',
    '$address_neighborhood': store.address?.neighborhood || '',
    '$address_municipality': store.address?.municipality || '',
    '$address_province': store.address?.province || '',
    '$address_googleMapsUrl': store.address?.googleMapsUrl || '',
    '$provincia_id': locationFks.provincia_id,
    '$municipio_id': locationFks.municipio_id,
    '$reparto_id': locationFks.reparto_id,
    '$codigo_postal': locationFks.codigo_postal,
    '$usdToCupRate': store.usdToCupRate || 0,
    '$deliveryAvailable': store.deliveryAvailable ? 1 : 0,
    '$paymentOptions_transferAccepted': store.paymentOptions?.transferAccepted ? 1 : 0,
    '$paymentOptions_transferFeePercentage': store.paymentOptions?.transferFeePercentage || 0,
    '$paymentOptions_acceptedCurrencies': JSON.stringify(store.paymentOptions?.acceptedCurrencies || []),
    '$paymentOptions_notes': store.paymentOptions?.notes || '',
    '$active': store.active ? 1 : 0,
    '$rating': store.rating || 5,
    '$badge': store.badge || '',
    '$paymentMethodIds': JSON.stringify(effectivePaymentMethods),
    '$deliveryMethodIds': JSON.stringify(effectiveDeliveryMethods),
    '$paymentPlatformIds': JSON.stringify(effectivePaymentPlatforms),
    '$ratePaymentMethods': JSON.stringify(store.ratePaymentMethods || []),
    '$currencyPaymentMethods': JSON.stringify(store.currencyPaymentMethods || []),
    '$exchangeRates': JSON.stringify(effectiveRates),
    '$createdAt': store.createdAt || new Date().toISOString()
  };

  db.run(sql, params);

  // Sync to normalized relational table store_exchange_rates (1 to Many)
  try {
    db.run("DELETE FROM store_exchange_rates WHERE storeId = $storeId", { "$storeId": store.id });
    for (const r of effectiveRates) {
      const rId = r.id || `rate-${store.id}-${r.fromCurrency}-${r.toCurrency}-${Math.random().toString(36).slice(2, 7)}`;
      db.run(
        `INSERT OR REPLACE INTO store_exchange_rates (id, storeId, fromCurrency, toCurrency, rate)
         VALUES ($id, $storeId, $fromCurrency, $toCurrency, $rate)`,
        {
          "$id": rId,
          "$storeId": store.id,
          "$fromCurrency": r.fromCurrency,
          "$toCurrency": r.toCurrency,
          "$rate": Number(r.rate) || 1,
        }
      );
    }
  } catch (e) {
    console.error('Error syncing store_exchange_rates table:', e);
  }

  // Sync to junction table store_delivery_methods
  try {
    db.run("DELETE FROM store_delivery_methods WHERE storeId = $storeId", { "$storeId": store.id });
    for (const dm of effectiveDeliveryMethods) {
      db.run(
        "INSERT OR IGNORE INTO store_delivery_methods (storeId, deliveryMethodId) VALUES ($storeId, $dm)",
        { "$storeId": store.id, "$dm": dm }
      );
    }
  } catch (e) {
    console.error('Error syncing store_delivery_methods:', e);
  }

  // Sync to junction table store_payment_methods
  try {
    db.run("DELETE FROM store_payment_methods WHERE storeId = $storeId", { "$storeId": store.id });
    for (const pm of effectivePaymentMethods) {
      db.run(
        "INSERT OR IGNORE INTO store_payment_methods (storeId, paymentMethodId) VALUES ($storeId, $pm)",
        { "$storeId": store.id, "$pm": pm }
      );
    }
  } catch (e) {
    console.error('Error syncing store_payment_methods:', e);
  }

  // Sync to junction table store_payment_platforms
  try {
    db.run("DELETE FROM store_payment_platforms WHERE storeId = $storeId", { "$storeId": store.id });
    for (const plat of effectivePaymentPlatforms) {
      db.run(
        "INSERT OR IGNORE INTO store_payment_platforms (storeId, paymentPlatformId) VALUES ($storeId, $plat)",
        { "$storeId": store.id, "$plat": plat }
      );
    }
  } catch (e) {
    console.error('Error syncing store_payment_platforms:', e);
  }

  // Sync to relational table store_rate_payment_methods
  try {
    db.run("DELETE FROM store_rate_payment_methods WHERE storeId = $storeId", { "$storeId": store.id });
    if (store.ratePaymentMethods && store.ratePaymentMethods.length > 0) {
      for (const rpm of store.ratePaymentMethods) {
        const rpmId = rpm.id || `rpm-${store.id}-${rpm.paymentMethodId}-${Math.random().toString(36).slice(2, 7)}`;
        db.run(
          `INSERT OR REPLACE INTO store_rate_payment_methods (id, storeId, exchangeRateId, paymentMethodId, gravamen, notes)
           VALUES ($id, $storeId, $exchangeRateId, $paymentMethodId, $gravamen, $notes)`,
          {
            "$id": rpmId,
            "$storeId": store.id,
            "$exchangeRateId": rpm.exchangeRateId,
            "$paymentMethodId": rpm.paymentMethodId,
            "$gravamen": Number(rpm.gravamen) || 0,
            "$notes": rpm.notes || '',
          }
        );
      }
    }
  } catch (e) {
    console.error('Error syncing store_rate_payment_methods:', e);
  }

  // Sync to relational table store_currency_payment_methods
  try {
    db.run("DELETE FROM store_currency_payment_methods WHERE storeId = $storeId", { "$storeId": store.id });
    if (store.currencyPaymentMethods && store.currencyPaymentMethods.length > 0) {
      for (const cpm of store.currencyPaymentMethods) {
        const cpmId = cpm.id || `cpm-${store.id}-${cpm.currency}-${cpm.paymentMethodId}-${Math.random().toString(36).slice(2, 7)}`;
        db.run(
          `INSERT OR REPLACE INTO store_currency_payment_methods (id, storeId, currency, paymentMethodId, notes)
           VALUES ($id, $storeId, $currency, $paymentMethodId, $notes)`,
          {
            "$id": cpmId,
            "$storeId": store.id,
            "$currency": cpm.currency,
            "$paymentMethodId": cpm.paymentMethodId,
            "$notes": cpm.notes || '',
          }
        );
      }
    }
  } catch (e) {
    console.error('Error syncing store_currency_payment_methods:', e);
  }
}

export function rowToStore(row: any[], columns?: string[]): Store {
  const getCol = (name: string, fallbackIdx: number) => {
    if (columns && Array.isArray(columns) && columns.length > 0) {
      const idx = columns.indexOf(name);
      if (idx !== -1) return row[idx];
    }
    return row[fallbackIdx];
  };

  const id = getCol('id', 0);
  const name = getCol('name', 1);
  const logoUrl = getCol('logoUrl', 2);
  const imagesStr = getCol('images', 3);
  const slogan = getCol('slogan', 4);
  const description = getCol('description', 5);
  const whatsappPhone = getCol('whatsappPhone', 6);
  const location = getCol('location', 7);
  const address_street = getCol('address_street', 8);
  const address_number = getCol('address_number', 9);
  const address_building = getCol('address_building', 10);
  const address_apartment = getCol('address_apartment', 11);
  const address_crossStreet1 = getCol('address_crossStreet1', 12);
  const address_crossStreet2 = getCol('address_crossStreet2', 13);
  const address_neighborhood = getCol('address_neighborhood', 14);
  const address_municipality = getCol('address_municipality', 15);
  const address_province = getCol('address_province', 16);
  const address_googleMapsUrl = getCol('address_googleMapsUrl', 17);
  const provincia_id = getCol('provincia_id', -1);
  const municipio_id = getCol('municipio_id', -1);
  const reparto_id = getCol('reparto_id', -1);
  const codigo_postal = getCol('codigo_postal', -1);
  const usdToCupRate = getCol('usdToCupRate', 18);
  const deliveryAvailable = getCol('deliveryAvailable', 19);
  const paymentOptions_transferAccepted = getCol('paymentOptions_transferAccepted', 20);
  const paymentOptions_transferFeePercentage = getCol('paymentOptions_transferFeePercentage', 21);
  const paymentOptions_acceptedCurrencies = getCol('paymentOptions_acceptedCurrencies', 22);
  const paymentOptions_notes = getCol('paymentOptions_notes', 23);
  const active = getCol('active', 24);
  const rating = getCol('rating', 25);
  const badge = getCol('badge', 26);
  const paymentMethodIdsStr = getCol('paymentMethodIds', 27);
  const deliveryMethodIdsStr = getCol('deliveryMethodIds', 28);
  const paymentPlatformIdsStr = getCol('paymentPlatformIds', -1);
  const ratePaymentMethodsStr = getCol('ratePaymentMethods', -1);
  const currencyPaymentMethodsStr = getCol('currencyPaymentMethods', -1);
  const exchangeRatesStr = getCol('exchangeRates', 29);
  const createdAt = getCol('createdAt', 30);

  let acceptedCurrencies: string[] = ['USD', 'EUR'];
  try {
    if (paymentOptions_acceptedCurrencies) {
      acceptedCurrencies = JSON.parse(paymentOptions_acceptedCurrencies);
    }
  } catch (e) {}

  let images: string[] = [];
  try {
    if (imagesStr) {
      images = JSON.parse(imagesStr);
    }
  } catch (e) {}

  const isDeliveryAvailable = Boolean(deliveryAvailable);
  const isTransferAccepted = Boolean(paymentOptions_transferAccepted);

  let paymentMethodIds: string[] = isTransferAccepted ? ['pm-efectivo', 'pm-transferencia'] : ['pm-efectivo'];
  try {
    if (paymentMethodIdsStr) {
      const parsed = JSON.parse(paymentMethodIdsStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        paymentMethodIds = parsed;
      }
    }
  } catch (e) {}

  let deliveryMethodIds: string[] = isDeliveryAvailable ? ['dm-mensajeria', 'dm-recogida'] : ['dm-recogida'];
  try {
    if (deliveryMethodIdsStr) {
      const parsed = JSON.parse(deliveryMethodIdsStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        deliveryMethodIds = parsed;
      }
    }
  } catch (e) {}

  let paymentPlatformIds: string[] = isTransferAccepted ? ['pp-banmet', 'pp-zelle', 'pp-paypal', 'pp-clasica'] : [];
  try {
    if (paymentPlatformIdsStr) {
      const parsed = JSON.parse(paymentPlatformIdsStr);
      if (Array.isArray(parsed)) {
        paymentPlatformIds = parsed;
      }
    }
  } catch (e) {}

  let ratePaymentMethods: StoreRatePaymentMethod[] = [];
  try {
    if (ratePaymentMethodsStr) {
      const parsed = JSON.parse(ratePaymentMethodsStr);
      if (Array.isArray(parsed)) {
        ratePaymentMethods = parsed;
      }
    }
  } catch (e) {}

  let currencyPaymentMethods: StoreCurrencyPaymentMethod[] = [];
  try {
    if (currencyPaymentMethodsStr) {
      const parsed = JSON.parse(currencyPaymentMethodsStr);
      if (Array.isArray(parsed)) {
        currencyPaymentMethods = parsed;
      }
    }
  } catch (e) {}

  let exchangeRates: StoreExchangeRate[] = [];
  try {
    if (exchangeRatesStr) {
      const parsed = JSON.parse(exchangeRatesStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        exchangeRates = parsed;
      }
    }
  } catch (e) {}

  if (exchangeRates.length === 0) {
    const defaultMatch = INITIAL_STORES.find((s) => s.id === id);
    exchangeRates = defaultMatch?.exchangeRates || [
      {
        id: `rate-${id}-USD-EUR`,
        storeId: String(id),
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        rate: 0.92,
      },
    ];
  }

  return {
    id: String(id),
    name: String(name || ''),
    logoUrl: String(logoUrl || ''),
    images: Array.isArray(images) && images.length > 0 ? images : (logoUrl ? [String(logoUrl)] : []),
    slogan: String(slogan || ''),
    description: String(description || ''),
    whatsappPhone: String(whatsappPhone || ''),
    location: String(location || ''),
    address: {
      street: String(address_street || ''),
      number: String(address_number || ''),
      building: String(address_building || ''),
      apartment: String(address_apartment || ''),
      crossStreet1: String(address_crossStreet1 || ''),
      crossStreet2: String(address_crossStreet2 || ''),
      neighborhood: String(address_neighborhood || ''),
      municipality: String(address_municipality || ''),
      province: String(address_province || ''),
      googleMapsUrl: String(address_googleMapsUrl || ''),
      codigoPostal: codigo_postal ? String(codigo_postal) : undefined,
    },
    provincia_id: provincia_id !== null && provincia_id !== undefined ? Number(provincia_id) : undefined,
    municipio_id: municipio_id !== null && municipio_id !== undefined ? Number(municipio_id) : undefined,
    reparto_id: reparto_id !== null && reparto_id !== undefined ? Number(reparto_id) : undefined,
    codigo_postal: codigo_postal ? String(codigo_postal) : undefined,
    exchangeRates,
    ratePaymentMethods,
    currencyPaymentMethods,
    paymentPlatformIds,
    usdToCupRate: Number(usdToCupRate) || 0,
    deliveryAvailable: isDeliveryAvailable,
    paymentOptions: {
      transferAccepted: isTransferAccepted,
      transferFeePercentage: Number(paymentOptions_transferFeePercentage) || 0,
      acceptedCurrencies,
      notes: String(paymentOptions_notes || ''),
    },
    paymentMethodIds,
    deliveryMethodIds,
    active: Boolean(active),
    rating: Number(rating) || 5,
    badge: String(badge || ''),
    createdAt: String(createdAt || ''),
  };
}

export function getStoresFromDb(db: Database): Store[] {
  try {
    const storeRes = db.exec("SELECT * FROM stores ORDER BY name ASC");
    if (!storeRes[0] || !storeRes[0].values) return [];

    const columns = storeRes[0].columns;
    const rows = storeRes[0].values;

    // Helper map for exchange rates by storeId
    const ratesByStore: Record<string, StoreExchangeRate[]> = {};
    try {
      const ratesRes = db.exec("SELECT id, storeId, fromCurrency, toCurrency, rate FROM store_exchange_rates");
      if (ratesRes[0]?.values) {
        for (const [rId, sId, fromC, toC, rateVal] of ratesRes[0].values) {
          const storeId = String(sId);
          if (!ratesByStore[storeId]) ratesByStore[storeId] = [];
          ratesByStore[storeId].push({
            id: String(rId),
            storeId,
            fromCurrency: String(fromC),
            toCurrency: String(toC),
            rate: Number(rateVal) || 1,
          });
        }
      }
    } catch (e) {}

    // Helper map for payment platforms by storeId
    const platformsByStore: Record<string, string[]> = {};
    try {
      const platRes = db.exec("SELECT storeId, paymentPlatformId FROM store_payment_platforms");
      if (platRes[0]?.values) {
        for (const [sId, pId] of platRes[0].values) {
          const storeId = String(sId);
          if (!platformsByStore[storeId]) platformsByStore[storeId] = [];
          platformsByStore[storeId].push(String(pId));
        }
      }
    } catch (e) {}

    // Helper map for delivery methods by storeId
    const deliveryMethodsByStore: Record<string, string[]> = {};
    try {
      const dmRes = db.exec("SELECT storeId, deliveryMethodId FROM store_delivery_methods");
      if (dmRes[0]?.values) {
        for (const [sId, dId] of dmRes[0].values) {
          const storeId = String(sId);
          if (!deliveryMethodsByStore[storeId]) deliveryMethodsByStore[storeId] = [];
          deliveryMethodsByStore[storeId].push(String(dId));
        }
      }
    } catch (e) {}

    // Helper map for payment methods by storeId
    const paymentMethodsByStore: Record<string, string[]> = {};
    try {
      const pmRes = db.exec("SELECT storeId, paymentMethodId FROM store_payment_methods");
      if (pmRes[0]?.values) {
        for (const [sId, pId] of pmRes[0].values) {
          const storeId = String(sId);
          if (!paymentMethodsByStore[storeId]) paymentMethodsByStore[storeId] = [];
          paymentMethodsByStore[storeId].push(String(pId));
        }
      }
    } catch (e) {}

    // Helper map for rate payment methods by storeId
    const ratePaymentMethodsByStore: Record<string, StoreRatePaymentMethod[]> = {};
    try {
      const rpmRes = db.exec("SELECT id, storeId, exchangeRateId, paymentMethodId, gravamen, notes FROM store_rate_payment_methods");
      if (rpmRes[0]?.values) {
        for (const [rId, sId, eId, pId, grav, nts] of rpmRes[0].values) {
          const storeId = String(sId);
          if (!ratePaymentMethodsByStore[storeId]) ratePaymentMethodsByStore[storeId] = [];
          ratePaymentMethodsByStore[storeId].push({
            id: String(rId),
            storeId,
            exchangeRateId: String(eId),
            paymentMethodId: String(pId),
            gravamen: Number(grav) || 0,
            notes: String(nts || ''),
          });
        }
      }
    } catch (e) {}

    // Helper map for currency payment methods by storeId
    const currencyPaymentMethodsByStore: Record<string, StoreCurrencyPaymentMethod[]> = {};
    try {
      const cpmRes = db.exec("SELECT id, storeId, currency, paymentMethodId, notes FROM store_currency_payment_methods");
      if (cpmRes[0]?.values) {
        for (const [cId, sId, curr, pId, nts] of cpmRes[0].values) {
          const storeId = String(sId);
          if (!currencyPaymentMethodsByStore[storeId]) currencyPaymentMethodsByStore[storeId] = [];
          currencyPaymentMethodsByStore[storeId].push({
            id: String(cId),
            storeId,
            currency: String(curr),
            paymentMethodId: String(pId),
            notes: String(nts || ''),
          });
        }
      }
    } catch (e) {}

    return rows.map((row) => {
      const store = rowToStore(row, columns);
      const storeId = store.id;

      if (ratesByStore[storeId] && ratesByStore[storeId].length > 0) {
        store.exchangeRates = ratesByStore[storeId];
      }
      if (platformsByStore[storeId] && platformsByStore[storeId].length > 0) {
        store.paymentPlatformIds = platformsByStore[storeId];
      }
      if (deliveryMethodsByStore[storeId] && deliveryMethodsByStore[storeId].length > 0) {
        store.deliveryMethodIds = deliveryMethodsByStore[storeId];
      }
      if (paymentMethodsByStore[storeId] && paymentMethodsByStore[storeId].length > 0) {
        store.paymentMethodIds = paymentMethodsByStore[storeId];
      }
      if (ratePaymentMethodsByStore[storeId] && ratePaymentMethodsByStore[storeId].length > 0) {
        store.ratePaymentMethods = ratePaymentMethodsByStore[storeId];
      }
      if (currencyPaymentMethodsByStore[storeId] && currencyPaymentMethodsByStore[storeId].length > 0) {
        store.currencyPaymentMethods = currencyPaymentMethodsByStore[storeId];
      }

      return store;
    });
  } catch (err) {
    console.error('Error fetching stores from DB:', err);
    return [];
  }
}

export function saveProductToDb(db: Database, product: Product) {
  let productCode = (product.code || '').trim().toUpperCase();
  if (!productCode) {
    try {
      const countRes = db.exec("SELECT COUNT(*) FROM products");
      const count = (countRes[0]?.values[0]?.[0] as number) || 0;
      productCode = `PRD-${String(count + 1).padStart(3, '0')}`;
    } catch (e) {
      productCode = `PRD-${Date.now().toString().slice(-4)}`;
    }
  }

  const effectiveCurrency = (product.currency || 'USD').toUpperCase();
  const effectivePrice = Number(product.price !== undefined && product.price !== null ? product.price : product.priceUSD) || 0;
  const effectivePriceUSD = Number(product.priceUSD !== undefined && product.priceUSD !== null ? product.priceUSD : effectivePrice) || 0;
  const allowedRateIds = Array.isArray(product.allowedExchangeRateIds) ? product.allowedExchangeRateIds : [];

  const sql = `
    INSERT OR REPLACE INTO products (
      id, code, storeId, title, description, price, priceUSD, currency, allowedExchangeRateIds,
      category, subcategory, imageUrl, images, isAvailable, isService, deliveryAvailable, featured,
      tags, tagSelections, productTypeId, productType, paymentMethodIds, deliveryMethodIds, createdAt
    ) VALUES (
      $id, $code, $storeId, $title, $description, $price, $priceUSD, $currency, $allowedExchangeRateIds,
      $category, $subcategory, $imageUrl, $images, $isAvailable, $isService, $deliveryAvailable, $featured,
      $tags, $tagSelections, $productTypeId, $productType, $paymentMethodIds, $deliveryMethodIds, $createdAt
    )
  `;

  const isServ = product.productTypeId === 'pt-servicio' || (product.productType || '').toLowerCase().includes('servicio');

  const params = {
    '$id': product.id,
    '$code': productCode,
    '$storeId': product.storeId,
    '$title': product.title,
    '$description': product.description || '',
    '$price': effectivePrice,
    '$priceUSD': effectivePriceUSD,
    '$currency': effectiveCurrency,
    '$allowedExchangeRateIds': JSON.stringify(allowedRateIds),
    '$category': product.category || '',
    '$subcategory': product.subcategory || '',
    '$imageUrl': product.imageUrl || '',
    '$images': JSON.stringify(product.images || []),
    '$isAvailable': product.isAvailable !== false ? 1 : 0,
    '$isService': isServ ? 1 : 0,
    '$deliveryAvailable': product.deliveryAvailable ? 1 : 0,
    '$featured': product.featured ? 1 : 0,
    '$tags': JSON.stringify(product.tags || []),
    '$tagSelections': JSON.stringify(product.tagSelections || []),
    '$productTypeId': product.productTypeId || (isServ ? 'pt-servicio' : 'pt-producto'),
    '$productType': product.productType || (isServ ? 'Servicios Profesionales' : 'Productos Físicos'),
    '$paymentMethodIds': JSON.stringify(product.paymentMethodIds || []),
    '$deliveryMethodIds': JSON.stringify(product.deliveryMethodIds || []),
    '$createdAt': product.createdAt || new Date().toISOString()
  };

  db.run(sql, params);

  // Sync to normalized relational table product_allowed_exchange_rates (Many to Many / Allowed Rates)
  try {
    db.run("DELETE FROM product_allowed_exchange_rates WHERE productId = $productId", { "$productId": product.id });
    for (const rateId of allowedRateIds) {
      const linkId = `link-${product.id}-${rateId}`;
      db.run(
        `INSERT OR REPLACE INTO product_allowed_exchange_rates (id, productId, storeId, exchangeRateId)
         VALUES ($id, $productId, $storeId, $exchangeRateId)`,
        {
          "$id": linkId,
          "$productId": product.id,
          "$storeId": product.storeId,
          "$exchangeRateId": rateId,
        }
      );
    }
  } catch (e) {
    console.error('Error syncing product_allowed_exchange_rates table:', e);
  }
}

export function rowToProduct(row: any[], columns?: string[]): Product {
  const getCol = (name: string, fallbackIdx: number) => {
    if (columns && Array.isArray(columns) && columns.length > 0) {
      const idx = columns.indexOf(name);
      if (idx !== -1) return row[idx];
    }
    return row[fallbackIdx];
  };

  const id = getCol('id', 0);
  const codeVal = getCol('code', -1);
  const storeId = getCol('storeId', 1);
  const title = getCol('title', 2);
  const description = getCol('description', 3);
  const priceUSD = getCol('priceUSD', 4);
  const category = getCol('category', 5);
  const subcategory = getCol('subcategory', 6);
  const imageUrl = getCol('imageUrl', 7);
  const imagesStr = getCol('images', 8);
  const isAvailable = getCol('isAvailable', 9);
  const isService = getCol('isService', 10);
  const deliveryAvailable = getCol('deliveryAvailable', 11);
  const featured = getCol('featured', 12);
  const tagsStr = getCol('tags', 13);
  const tagSelectionsStr = getCol('tagSelections', 14);
  const productTypeId = getCol('productTypeId', 15);
  const productType = getCol('productType', 16);
  const paymentMethodIdsStr = getCol('paymentMethodIds', 17);
  const deliveryMethodIdsStr = getCol('deliveryMethodIds', 18);
  const createdAt = getCol('createdAt', 19);

  // New currency & price columns
  const priceVal = getCol('price', -1);
  const currencyVal = getCol('currency', -1);
  const allowedExchangeRateIdsStr = getCol('allowedExchangeRateIds', -1);

  let tags: string[] = [];
  try {
    if (tagsStr) tags = JSON.parse(tagsStr);
  } catch (e) {}

  let tagSelections: any[] = [];
  try {
    if (tagSelectionsStr) tagSelections = JSON.parse(tagSelectionsStr);
  } catch (e) {}

  let paymentMethodIds: string[] = [];
  try {
    if (paymentMethodIdsStr) paymentMethodIds = JSON.parse(paymentMethodIdsStr);
  } catch (e) {}

  let deliveryMethodIds: string[] = [];
  try {
    if (deliveryMethodIdsStr) deliveryMethodIds = JSON.parse(deliveryMethodIdsStr);
  } catch (e) {}

  let images: string[] = [];
  try {
    if (imagesStr) images = JSON.parse(imagesStr);
  } catch (e) {}

  let allowedExchangeRateIds: string[] = [];
  try {
    if (allowedExchangeRateIdsStr) allowedExchangeRateIds = JSON.parse(allowedExchangeRateIdsStr);
  } catch (e) {}

  const isServ = Boolean(isService) || String(productTypeId) === 'pt-servicio';
  const deliveryAvailableBool = Boolean(deliveryAvailable);

  const finalCode = String(codeVal || (id ? `PRD-${String(id).replace(/\D/g, '').padStart(3, '0') || '001'}` : 'PRD-001'));
  const effectiveCurrency = String(currencyVal || 'USD').toUpperCase();
  const effectivePrice = Number(priceVal !== undefined && priceVal !== null ? priceVal : priceUSD) || 0;
  const effectivePriceUSD = Number(priceUSD !== undefined && priceUSD !== null ? priceUSD : effectivePrice) || 0;

  return {
    id: String(id),
    code: finalCode,
    storeId: String(storeId),
    title: String(title || ''),
    description: String(description || ''),
    price: effectivePrice,
    priceUSD: effectivePriceUSD,
    currency: effectiveCurrency,
    allowedExchangeRateIds,
    category: String(category || ''),
    subcategory: String(subcategory || ''),
    imageUrl: String(imageUrl || ''),
    images: Array.isArray(images) && images.length > 0 ? images : (imageUrl ? [String(imageUrl)] : []),
    isAvailable: Boolean(isAvailable),
    deliveryAvailable: deliveryAvailableBool,
    featured: Boolean(featured),
    tags,
    tagSelections,
    productTypeId: String(productTypeId || (isServ ? 'pt-servicio' : 'pt-producto')),
    productType: String(productType || (isServ ? 'Servicios Profesionales' : 'Productos Físicos')),
    paymentMethodIds: Array.isArray(paymentMethodIds) && paymentMethodIds.length > 0 ? paymentMethodIds : ['pm-efectivo', 'pm-transferencia'],
    deliveryMethodIds: Array.isArray(deliveryMethodIds) && deliveryMethodIds.length > 0 ? deliveryMethodIds : (deliveryAvailableBool ? ['dm-mensajeria', 'dm-recogida'] : ['dm-recogida']),
    createdAt: String(createdAt || ''),
  };
}

export function saveConfigToDb(db: Database, config: MarketplaceConfig) {
  const sql = `
    INSERT OR REPLACE INTO marketplace_config (
      id, name, slogan, logoUrl, defaultStoreLogoUrl, defaultProductImageUrl,
      bannerUrl, bannerTitle, bannerSubtitle, primaryColor, secondaryColor,
      accentColor, socialLinks, geoCatalog, departmentsCatalog, tagsCatalog,
      productTypesCatalog, paymentMethodsCatalog, deliveryMethodsCatalog,
      currenciesCatalog, globalExchangeRates, uiTexts
    ) VALUES (
      'default', $name, $slogan, $logoUrl, $defaultStoreLogoUrl, $defaultProductImageUrl,
      $bannerUrl, $bannerTitle, $bannerSubtitle, $primaryColor, $secondaryColor,
      $accentColor, $socialLinks, $geoCatalog, $departmentsCatalog, $tagsCatalog,
      $productTypesCatalog, $paymentMethodsCatalog, $deliveryMethodsCatalog,
      $currenciesCatalog, $globalExchangeRates, $uiTexts
    )
  `;

  const params = {
    '$name': config.name || 'TwinStore',
    '$slogan': config.slogan || '',
    '$logoUrl': config.logoUrl || '',
    '$defaultStoreLogoUrl': config.defaultStoreLogoUrl || '',
    '$defaultProductImageUrl': config.defaultProductImageUrl || '',
    '$bannerUrl': config.bannerUrl || '',
    '$bannerTitle': config.bannerTitle || '',
    '$bannerSubtitle': config.bannerSubtitle || '',
    '$primaryColor': config.primaryColor || '#4f46e5',
    '$secondaryColor': config.secondaryColor || '#0284c7',
    '$accentColor': config.accentColor || '#10b981',
    '$socialLinks': JSON.stringify(config.socialLinks || {}),
    '$geoCatalog': JSON.stringify(config.geoCatalog || []),
    '$departmentsCatalog': JSON.stringify(config.departmentsCatalog || []),
    '$tagsCatalog': JSON.stringify(config.tagsCatalog || []),
    '$productTypesCatalog': JSON.stringify(config.productTypesCatalog || []),
    '$paymentMethodsCatalog': JSON.stringify(config.paymentMethodsCatalog || []),
    '$deliveryMethodsCatalog': JSON.stringify(config.deliveryMethodsCatalog || []),
    '$currenciesCatalog': JSON.stringify(config.currenciesCatalog || []),
    '$globalExchangeRates': JSON.stringify(config.globalExchangeRates || []),
    '$uiTexts': JSON.stringify(config.uiTexts || DEFAULT_INTERFAZ)
  };

  db.run(sql, params);

  // Sync to ui_texts table as well
  try {
    const serializedUi = JSON.stringify(config.uiTexts || DEFAULT_INTERFAZ);
    db.run(
      "INSERT OR REPLACE INTO ui_texts (id, content, updatedAt) VALUES ('default', $content, $updatedAt)",
      {
        "$content": serializedUi,
        "$updatedAt": new Date().toISOString()
      }
    );
  } catch (e) {}

  // Sync to normalized relational table global_exchange_rates
  try {
    db.run("DELETE FROM global_exchange_rates");
    if (Array.isArray(config.globalExchangeRates)) {
      for (const gr of config.globalExchangeRates) {
        const grId = gr.id || `rate-global-${gr.fromCurrency}-${gr.toCurrency}-${Math.random().toString(36).slice(2, 7)}`;
        db.run(
          `INSERT OR REPLACE INTO global_exchange_rates (id, fromCurrency, toCurrency, rate, description)
           VALUES ($id, $fromCurrency, $toCurrency, $rate, $description)`,
          {
            "$id": grId,
            "$fromCurrency": gr.fromCurrency,
            "$toCurrency": gr.toCurrency,
            "$rate": Number(gr.rate) || 1,
            "$description": gr.description || '',
          }
        );
      }
    }
  } catch (e) {
    console.error('Error syncing global_exchange_rates table:', e);
  }
}

export function rowToConfig(row: any[], columns?: string[]): MarketplaceConfig {
  let uiTextsStr: string | undefined;
  if (columns && Array.isArray(columns)) {
    const uiIdx = columns.indexOf('uiTexts');
    if (uiIdx !== -1) uiTextsStr = row[uiIdx];
  }
  if (uiTextsStr === undefined) {
    if (row.length >= 22) {
      uiTextsStr = row[21];
    } else if (row.length === 21) {
      uiTextsStr = row[20];
    }
  }

  const [
    id, name, slogan, logoUrl, defaultStoreLogoUrl, defaultProductImageUrl,
    bannerUrl, bannerTitle, bannerSubtitle, primaryColor, secondaryColor,
    accentColor, socialLinksStr, geoCatalogStr, departmentsCatalogStr, tagsCatalogStr,
    productTypesCatalogStr, paymentMethodsCatalogStr, deliveryMethodsCatalogStr,
    currenciesCatalogStr, globalExchangeRatesStr, rawUiTextsStr
  ] = row;

  if (!uiTextsStr && rawUiTextsStr) {
    uiTextsStr = rawUiTextsStr;
  }

  let socialLinks = INITIAL_MARKETPLACE_CONFIG.socialLinks;
  try { if (socialLinksStr) socialLinks = JSON.parse(socialLinksStr); } catch (e) {}

  let geoCatalog = INITIAL_MARKETPLACE_CONFIG.geoCatalog;
  try { if (geoCatalogStr) geoCatalog = JSON.parse(geoCatalogStr); } catch (e) {}

  let departmentsCatalog = INITIAL_MARKETPLACE_CONFIG.departmentsCatalog;
  try { if (departmentsCatalogStr) departmentsCatalog = JSON.parse(departmentsCatalogStr); } catch (e) {}

  let tagsCatalog = INITIAL_MARKETPLACE_CONFIG.tagsCatalog;
  try { if (tagsCatalogStr) tagsCatalog = JSON.parse(tagsCatalogStr); } catch (e) {}

  let productTypesCatalog = INITIAL_MARKETPLACE_CONFIG.productTypesCatalog;
  try { if (productTypesCatalogStr) productTypesCatalog = JSON.parse(productTypesCatalogStr); } catch (e) {}

  let paymentMethodsCatalog = INITIAL_MARKETPLACE_CONFIG.paymentMethodsCatalog;
  try { if (paymentMethodsCatalogStr) paymentMethodsCatalog = JSON.parse(paymentMethodsCatalogStr); } catch (e) {}

  let deliveryMethodsCatalog = INITIAL_MARKETPLACE_CONFIG.deliveryMethodsCatalog;
  try { if (deliveryMethodsCatalogStr) deliveryMethodsCatalog = JSON.parse(deliveryMethodsCatalogStr); } catch (e) {}

  let currenciesCatalog = INITIAL_MARKETPLACE_CONFIG.currenciesCatalog;
  try { if (currenciesCatalogStr) currenciesCatalog = JSON.parse(currenciesCatalogStr); } catch (e) {}

  let globalExchangeRates = INITIAL_MARKETPLACE_CONFIG.globalExchangeRates;
  try { if (globalExchangeRatesStr) globalExchangeRates = JSON.parse(globalExchangeRatesStr); } catch (e) {}

  let uiTexts = INITIAL_MARKETPLACE_CONFIG.uiTexts || DEFAULT_INTERFAZ;
  try {
    if (uiTextsStr) {
      uiTexts = JSON.parse(uiTextsStr);
    }
  } catch (e) {}

  return {
    name: String(name || 'TwinStore'),
    slogan: String(slogan || ''),
    logoUrl: String(logoUrl || ''),
    defaultStoreLogoUrl: String(defaultStoreLogoUrl || ''),
    defaultProductImageUrl: String(defaultProductImageUrl || ''),
    bannerUrl: String(bannerUrl || ''),
    bannerTitle: String(bannerTitle || ''),
    bannerSubtitle: String(bannerSubtitle || ''),
    primaryColor: String(primaryColor || '#4f46e5'),
    secondaryColor: String(secondaryColor || '#0284c7'),
    accentColor: String(accentColor || '#10b981'),
    socialLinks,
    geoCatalog,
    departmentsCatalog,
    tagsCatalog,
    productTypesCatalog,
    paymentMethodsCatalog,
    deliveryMethodsCatalog,
    currenciesCatalog,
    globalExchangeRates,
    uiTexts,
  };
}
