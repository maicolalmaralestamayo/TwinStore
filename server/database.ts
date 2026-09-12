import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import {
  INITIAL_STORES,
  INITIAL_PRODUCTS,
  INITIAL_MARKETPLACE_CONFIG,
} from '../src/data/initialData';
import { Store, Product, MarketplaceConfig } from '../src/types';

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
  db.run(`
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
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      code TEXT,
      storeId TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      priceUSD REAL NOT NULL,
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
      deliveryMethodsCatalog TEXT
    );
  `);

  // Safe migration for existing SQLite files
  try { db.run("ALTER TABLE stores ADD COLUMN paymentMethodIds TEXT;"); } catch (e) {}
  try { db.run("ALTER TABLE stores ADD COLUMN deliveryMethodIds TEXT;"); } catch (e) {}
  try { db.run("ALTER TABLE products ADD COLUMN code TEXT;"); } catch (e) {}
  try { db.run("ALTER TABLE products ADD COLUMN productTypeId TEXT;"); } catch (e) {}
  try { db.run("ALTER TABLE products ADD COLUMN productType TEXT;"); } catch (e) {}
  try { db.run("ALTER TABLE products ADD COLUMN paymentMethodIds TEXT;"); } catch (e) {}
  try { db.run("ALTER TABLE products ADD COLUMN deliveryMethodIds TEXT;"); } catch (e) {}
  try { db.run("ALTER TABLE marketplace_config ADD COLUMN productTypesCatalog TEXT;"); } catch (e) {}
  try { db.run("ALTER TABLE marketplace_config ADD COLUMN paymentMethodsCatalog TEXT;"); } catch (e) {}
  try { db.run("ALTER TABLE marketplace_config ADD COLUMN deliveryMethodsCatalog TEXT;"); } catch (e) {}
  try { db.run("CREATE UNIQUE INDEX IF NOT EXISTS idx_products_code ON products(code);"); } catch (e) {}

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
}

function seedIfEmpty(db: Database) {
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
export function saveStoreToDb(db: Database, store: Store) {
  const defaultPaymentIds = store.paymentOptions?.transferAccepted
    ? ['pm-efectivo', 'pm-transferencia']
    : ['pm-efectivo'];
  const defaultDeliveryIds = store.deliveryAvailable
    ? ['dm-mensajeria', 'dm-recogida']
    : ['dm-recogida'];

  const sql = `
    INSERT OR REPLACE INTO stores (
      id, name, logoUrl, images, slogan, description, whatsappPhone, location,
      address_street, address_number, address_building, address_apartment,
      address_crossStreet1, address_crossStreet2, address_neighborhood,
      address_municipality, address_province, address_googleMapsUrl,
      usdToCupRate, deliveryAvailable, paymentOptions_transferAccepted,
      paymentOptions_transferFeePercentage, paymentOptions_acceptedCurrencies,
      paymentOptions_notes, active, rating, badge, paymentMethodIds, deliveryMethodIds, createdAt
    ) VALUES (
      $id, $name, $logoUrl, $images, $slogan, $description, $whatsappPhone, $location,
      $address_street, $address_number, $address_building, $address_apartment,
      $address_crossStreet1, $address_crossStreet2, $address_neighborhood,
      $address_municipality, $address_province, $address_googleMapsUrl,
      $usdToCupRate, $deliveryAvailable, $paymentOptions_transferAccepted,
      $paymentOptions_transferFeePercentage, $paymentOptions_acceptedCurrencies,
      $paymentOptions_notes, $active, $rating, $badge, $paymentMethodIds, $deliveryMethodIds, $createdAt
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
    '$usdToCupRate': store.usdToCupRate || 330,
    '$deliveryAvailable': store.deliveryAvailable ? 1 : 0,
    '$paymentOptions_transferAccepted': store.paymentOptions?.transferAccepted ? 1 : 0,
    '$paymentOptions_transferFeePercentage': store.paymentOptions?.transferFeePercentage || 0,
    '$paymentOptions_acceptedCurrencies': JSON.stringify(store.paymentOptions?.acceptedCurrencies || []),
    '$paymentOptions_notes': store.paymentOptions?.notes || '',
    '$active': store.active ? 1 : 0,
    '$rating': store.rating || 5,
    '$badge': store.badge || '',
    '$paymentMethodIds': JSON.stringify(store.paymentMethodIds || defaultPaymentIds),
    '$deliveryMethodIds': JSON.stringify(store.deliveryMethodIds || defaultDeliveryIds),
    '$createdAt': store.createdAt || new Date().toISOString()
  };

  db.run(sql, params);
}

export function rowToStore(row: any[]): Store {
  const [
    id, name, logoUrl, imagesStr, slogan, description, whatsappPhone, location,
    address_street, address_number, address_building, address_apartment,
    address_crossStreet1, address_crossStreet2, address_neighborhood,
    address_municipality, address_province, address_googleMapsUrl,
    usdToCupRate, deliveryAvailable, paymentOptions_transferAccepted,
    paymentOptions_transferFeePercentage, paymentOptions_acceptedCurrencies,
    paymentOptions_notes, active, rating, badge, paymentMethodIdsStr, deliveryMethodIdsStr, createdAt
  ] = row;

  let acceptedCurrencies: string[] = ['USD', 'CUP'];
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
    },
    usdToCupRate: Number(usdToCupRate) || 330,
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

  const sql = `
    INSERT OR REPLACE INTO products (
      id, code, storeId, title, description, priceUSD, category, subcategory,
      imageUrl, images, isAvailable, isService, deliveryAvailable, featured,
      tags, tagSelections, productTypeId, productType, paymentMethodIds, deliveryMethodIds, createdAt
    ) VALUES (
      $id, $code, $storeId, $title, $description, $priceUSD, $category, $subcategory,
      $imageUrl, $images, $isAvailable, $isService, $deliveryAvailable, $featured,
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
    '$priceUSD': product.priceUSD,
    '$category': product.category,
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

  const isServ = Boolean(isService) || String(productTypeId) === 'pt-servicio';
  const deliveryAvailableBool = Boolean(deliveryAvailable);

  const finalCode = String(codeVal || (id ? `PRD-${String(id).replace(/\D/g, '').padStart(3, '0') || '001'}` : 'PRD-001'));

  return {
    id: String(id),
    code: finalCode,
    storeId: String(storeId),
    title: String(title || ''),
    description: String(description || ''),
    priceUSD: Number(priceUSD) || 0,
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
      productTypesCatalog, paymentMethodsCatalog, deliveryMethodsCatalog
    ) VALUES (
      'default', $name, $slogan, $logoUrl, $defaultStoreLogoUrl, $defaultProductImageUrl,
      $bannerUrl, $bannerTitle, $bannerSubtitle, $primaryColor, $secondaryColor,
      $accentColor, $socialLinks, $geoCatalog, $departmentsCatalog, $tagsCatalog,
      $productTypesCatalog, $paymentMethodsCatalog, $deliveryMethodsCatalog
    )
  `;

  const params = {
    '$name': config.name || 'MercadoCuba',
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
    '$deliveryMethodsCatalog': JSON.stringify(config.deliveryMethodsCatalog || [])
  };

  db.run(sql, params);
}

export function rowToConfig(row: any[]): MarketplaceConfig {
  const [
    id, name, slogan, logoUrl, defaultStoreLogoUrl, defaultProductImageUrl,
    bannerUrl, bannerTitle, bannerSubtitle, primaryColor, secondaryColor,
    accentColor, socialLinksStr, geoCatalogStr, departmentsCatalogStr, tagsCatalogStr,
    productTypesCatalogStr, paymentMethodsCatalogStr, deliveryMethodsCatalogStr
  ] = row;

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

  return {
    name: String(name || 'MercadoCuba'),
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
  };
}
