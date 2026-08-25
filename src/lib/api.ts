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
