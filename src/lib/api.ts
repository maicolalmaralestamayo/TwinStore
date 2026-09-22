import { Store, Product, MarketplaceConfig } from '../types';

export async function fetchStoresApi(): Promise<Store[]> {
  try {
    const res = await fetch('/api/stores');
    if (!res.ok) throw new Error('Error de red al obtener tiendas');
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn('Fallback a almacenamiento local para tiendas:', e);
    return [];
  }
}

export async function saveStoreApi(store: Store): Promise<boolean> {
  try {
    const res = await fetch('/api/stores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(store),
    });
    return res.ok;
  } catch (e) {
    console.warn('Error guardando tienda en SQLite:', e);
    return false;
  }
}

export async function deleteStoreApi(storeId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/stores/${storeId}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (e) {
    console.warn('Error eliminando tienda en SQLite:', e);
    return false;
  }
}

export async function fetchProductsApi(): Promise<Product[]> {
  try {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error('Error de red al obtener productos');
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn('Fallback a almacenamiento local para productos:', e);
    return [];
  }
}

export async function saveProductApi(product: Product): Promise<boolean> {
  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    return res.ok;
  } catch (e) {
    console.warn('Error guardando producto en SQLite:', e);
    return false;
  }
}

export async function deleteProductApi(productId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/products/${productId}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (e) {
    console.warn('Error eliminando producto en SQLite:', e);
    return false;
  }
}

export async function fetchConfigApi(): Promise<MarketplaceConfig | null> {
  try {
    const res = await fetch('/api/config');
    if (!res.ok) throw new Error('Error de red al obtener configuración');
    const data = await res.json();
    return data && data.name ? data : null;
  } catch (e) {
    console.warn('Fallback a configuración local:', e);
    return null;
  }
}

export async function saveConfigApi(config: MarketplaceConfig): Promise<boolean> {
  try {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return res.ok;
  } catch (e) {
    console.warn('Error guardando configuración en SQLite:', e);
    return false;
  }
}

export async function restoreDbApi(data: { stores?: Store[]; products?: Product[]; config?: MarketplaceConfig }): Promise<boolean> {
  try {
    const res = await fetch('/api/db/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.ok;
  } catch (e) {
    console.warn('Error restaurando base de datos SQLite:', e);
    return false;
  }
}

export async function fetchInterfazApi(): Promise<Record<string, any> | null> {
  try {
    const res = await fetch('/api/interfaz');
    if (!res.ok) throw new Error('Error de red al obtener interfaz');
    const data = await res.json();
    return data && typeof data === 'object' ? data : null;
  } catch (e) {
    console.warn('Fallback a interfaz local:', e);
    return null;
  }
}

export async function saveInterfazApi(texts: Record<string, any>): Promise<boolean> {
  try {
    const res = await fetch('/api/interfaz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(texts),
    });
    return res.ok;
  } catch (e) {
    console.warn('Error guardando interfaz en SQLite:', e);
    return false;
  }
}

export interface CatalogosApiResponse {
  success: boolean;
  raw: any;
  hierarchical: {
    geoCatalog: any[];
    departmentsCatalog: any[];
    tagsCatalog: any[];
    currenciesCatalog: any[];
    productTypesCatalog: any[];
    paymentMethodsCatalog: any[];
    deliveryMethodsCatalog: any[];
  };
}

export async function fetchCatalogosApi(): Promise<CatalogosApiResponse | null> {
  try {
    const res = await fetch('/api/catalogos');
    if (!res.ok) throw new Error('Error al obtener catálogos de SQLite');
    const data = await res.json();
    return data;
  } catch (e) {
    console.warn('Fallback o error al obtener catálogos relacionales de SQLite:', e);
    return null;
  }
}

export async function syncCatalogosApi(): Promise<CatalogosApiResponse | null> {
  try {
    const res = await fetch('/api/catalogos/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Error al sincronizar catálogos');
    return await res.json();
  } catch (e) {
    console.warn('Error al sincronizar catálogos:', e);
    return null;
  }
}

