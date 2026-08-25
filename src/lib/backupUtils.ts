import {
  Store,
  Product,
  GeoProvince,
  DepartmentCategory,
  TagGroup,
  MarketplaceConfig,
} from '../types';
import { downloadJsonFile } from './utils';

export interface FullMarketplaceBackup {
  version: string;
  timestamp: string;
  stores: Store[];
  products: Product[];
  geoCatalog?: GeoProvince[];
  departmentsCatalog?: DepartmentCategory[];
  tagsCatalog?: TagGroup[];
  marketplaceConfig?: MarketplaceConfig;
}

// --- Helper: Convert Array of Rows to CSV String ---
function arrayToCsv(headers: string[], rows: (string | number | boolean)[][]): string {
  const escapeCsvCell = (cell: any): string => {
    if (cell === null || cell === undefined) return '""';
    const str = String(cell).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerLine = headers.map(escapeCsvCell).join(',');
  const dataLines = rows.map((row) => row.map(escapeCsvCell).join(','));
  return [headerLine, ...dataLines].join('\n');
}

// --- Helper: Parse CSV String to Rows ---
export function parseCsvRows(csvText: string): string[][] {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);
  return lines.map((line) => {
    const result: string[] = [];
    let currentCell = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          currentCell += '"';
          i++; // Skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(currentCell.trim());
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    result.push(currentCell.trim());
    return result;
  });
}

// --- Helper: Trigger File Download ---
function triggerDownload(content: string, filename: string, mimeType = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// --- EXPORT FUNCTIONS ---

// 1. Export Complete JSON Backup
export function exportFullJsonBackup(
  stores: Store[],
  products: Product[],
  geoCatalog: GeoProvince[],
  departmentsCatalog: DepartmentCategory[],
  tagsCatalog: TagGroup[],
  marketplaceConfig: MarketplaceConfig
) {
  const backupData: FullMarketplaceBackup = {
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    stores,
    products,
    geoCatalog,
    departmentsCatalog,
    tagsCatalog,
    marketplaceConfig,
  };
  downloadJsonFile(
    backupData,
    `MercadoCuba_RespaldoTotal_${new Date().toISOString().slice(0, 10)}.json`
  );
}

// 2. Export Stores CSV
export function exportStoresCsv(stores: Store[]) {
  const headers = [
    'id',
    'name',
    'slogan',
    'description',
    'whatsappPhone',
    'location',
    'usdToCupRate',
    'deliveryAvailable',
    'active',
    'rating',
    'createdAt',
  ];
  const rows = stores.map((s) => [
    s.id,
    s.name,
    s.slogan || '',
    s.description || '',
    s.whatsappPhone,
    s.location || '',
    s.usdToCupRate,
    s.deliveryAvailable,
    s.active,
    s.rating || 5.0,
    s.createdAt || '',
  ]);
  const csvStr = arrayToCsv(headers, rows);
  triggerDownload(csvStr, `Tiendas_${new Date().toISOString().slice(0, 10)}.csv`);
}

// 3. Export Products CSV
export function exportProductsCsv(products: Product[]) {
  const headers = [
    'id',
    'storeId',
    'title',
    'description',
    'priceUSD',
    'category',
    'subcategory',
    'imageUrl',
    'isAvailable',
    'isService',
    'deliveryAvailable',
    'featured',
    'tags',
    'createdAt',
  ];
  const rows = products.map((p) => [
    p.id,
    p.storeId,
    p.title,
    p.description || '',
    p.priceUSD,
    p.category,
    p.subcategory || '',
    p.imageUrl || '',
    p.isAvailable,
    p.isService || false,
    p.deliveryAvailable,
    p.featured || false,
    Array.isArray(p.tags) ? p.tags.join(';') : '',
    p.createdAt || '',
  ]);
  const csvStr = arrayToCsv(headers, rows);
  triggerDownload(csvStr, `Productos_${new Date().toISOString().slice(0, 10)}.csv`);
}

// 4. Export Geo Catalog CSV (Provincias, Municipios, Repartos)
export function exportGeoCatalogCsv(geoCatalog: GeoProvince[]) {
  const headers = [
    'provinceId',
    'provinceName',
    'municipalityId',
    'municipalityName',
    'repartoId',
    'repartoName',
  ];
  const rows: string[][] = [];

  geoCatalog.forEach((p) => {
    if (p.municipalities && p.municipalities.length > 0) {
      p.municipalities.forEach((m) => {
        if (m.repartos && m.repartos.length > 0) {
          m.repartos.forEach((r) => {
            rows.push([p.id, p.name, m.id, m.name, r.id, r.name]);
          });
        } else {
          rows.push([p.id, p.name, m.id, m.name, '', '']);
        }
      });
    } else {
      rows.push([p.id, p.name, '', '', '', '']);
    }
  });

  const csvStr = arrayToCsv(headers, rows);
  triggerDownload(csvStr, `Geografia_Cuba_${new Date().toISOString().slice(0, 10)}.csv`);
}

// 5. Export Departments CSV (Departamentos & Subdepartamentos)
export function exportDepartmentsCsv(departmentsCatalog: DepartmentCategory[]) {
  const headers = [
    'departmentId',
    'departmentName',
    'departmentDescription',
    'iconName',
    'subcategoryId',
    'subcategoryName',
  ];
  const rows: string[][] = [];

  departmentsCatalog.forEach((dept) => {
    if (dept.subcategories && dept.subcategories.length > 0) {
      dept.subcategories.forEach((sub) => {
        rows.push([
          dept.id,
          dept.name,
          dept.description || '',
          dept.iconName || '',
          sub.id,
          sub.name,
        ]);
      });
    } else {
      rows.push([dept.id, dept.name, dept.description || '', dept.iconName || '', '', '']);
    }
  });

  const csvStr = arrayToCsv(headers, rows);
  triggerDownload(csvStr, `Departamentos_${new Date().toISOString().slice(0, 10)}.csv`);
}

// 6. Export Tags CSV (Superetiquetas & Etiquetas)
export function exportTagsCsv(tagsCatalog: TagGroup[]) {
  const headers = ['tagGroupId', 'tagGroupName', 'tagGroupDescription', 'tagId', 'tagName'];
  const rows: string[][] = [];

  tagsCatalog.forEach((group) => {
    if (group.tags && group.tags.length > 0) {
      group.tags.forEach((tag) => {
        rows.push([group.id, group.name, group.description || '', tag.id, tag.name]);
      });
    } else {
      rows.push([group.id, group.name, group.description || '', '', '']);
    }
  });

  const csvStr = arrayToCsv(headers, rows);
  triggerDownload(csvStr, `Etiquetas_${new Date().toISOString().slice(0, 10)}.csv`);
}

// 7. Export Marketplace Config CSV
export function exportConfigCsv(config: MarketplaceConfig) {
  const headers = ['Key', 'Value'];
  const rows = [
    ['name', config.name],
    ['slogan', config.slogan],
    ['logoUrl', config.logoUrl],
    ['defaultStoreLogoUrl', config.defaultStoreLogoUrl || ''],
    ['defaultProductImageUrl', config.defaultProductImageUrl || ''],
    ['bannerUrl', config.bannerUrl || ''],
    ['bannerTitle', config.bannerTitle || ''],
    ['bannerSubtitle', config.bannerSubtitle || ''],
    ['primaryColor', config.primaryColor],
    ['secondaryColor', config.secondaryColor],
    ['accentColor', config.accentColor || ''],
    ['whatsapp', config.socialLinks?.whatsapp || ''],
    ['telegram', config.socialLinks?.telegram || ''],
    ['instagram', config.socialLinks?.instagram || ''],
    ['facebook', config.socialLinks?.facebook || ''],
  ];
  const csvStr = arrayToCsv(headers, rows);
  triggerDownload(csvStr, `Configuracion_${new Date().toISOString().slice(0, 10)}.csv`);
}

// --- IMPORT PARSERS ---

export interface ImportedCsvResult {
  type: 'stores' | 'products' | 'geo' | 'departments' | 'tags' | 'config' | 'unknown';
  stores?: Store[];
  products?: Product[];
  geoCatalog?: GeoProvince[];
  departmentsCatalog?: DepartmentCategory[];
  tagsCatalog?: TagGroup[];
  configPatch?: Partial<MarketplaceConfig>;
  error?: string;
}

export function parseAndImportAnyCsv(csvContent: string): ImportedCsvResult {
  const rows = parseCsvRows(csvContent);
  if (rows.length < 2) {
    return { type: 'unknown', error: 'El archivo CSV está vacío o no tiene encabezados.' };
  }

  const header = rows[0].map((h) => h.toLowerCase());

  // 1. Detect Stores CSV
  if (header.includes('usdtorate') || header.includes('usdtocuprate') || (header.includes('whatsappphone') && header.includes('slogan'))) {
    const stores: Store[] = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r[1]) continue;
      stores.push({
        id: r[0] || `store_csv_${Date.now()}_${i}`,
        name: r[1],
        slogan: r[2] || '',
        description: r[3] || '',
        whatsappPhone: r[4] || '+53 50000000',
        location: r[5] || 'La Habana',
        usdToCupRate: Number(r[6]) || 335,
        deliveryAvailable: r[7] === 'true' || r[7] === '1',
        active: r[8] !== 'false' && r[8] !== '0',
        rating: Number(r[9]) || 5.0,
        createdAt: r[10] || new Date().toISOString(),
      });
    }
    return { type: 'stores', stores };
  }

  // 2. Detect Products CSV
  if (header.includes('priceusd') || header.includes('storeid')) {
    const products: Product[] = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r[2]) continue; // title missing
      products.push({
        id: r[0] || `prod_csv_${Date.now()}_${i}`,
        storeId: r[1] || 'store-1',
        title: r[2],
        description: r[3] || '',
        priceUSD: Number(r[4]) || 0,
        category: r[5] || 'Alimentos y Combos',
        subcategory: r[6] || '',
        imageUrl: r[7] || '',
        isAvailable: r[8] !== 'false' && r[8] !== '0',
        isService: r[9] === 'true' || r[9] === '1',
        deliveryAvailable: r[10] === 'true' || r[10] === '1',
        featured: r[11] === 'true' || r[11] === '1',
        tags: r[12] ? r[12].split(/;|,/).map((t) => t.trim()).filter(Boolean) : [],
        createdAt: r[13] || new Date().toISOString(),
      });
    }
    return { type: 'products', products };
  }

  // 3. Detect Geo Catalog CSV
  if (header.includes('provincename') || header.includes('municipalityname') || header.includes('repartoname')) {
    const provincesMap = new Map<string, GeoProvince>();

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const provId = r[0] || `prov_${i}`;
      const provName = r[1];
      const munId = r[2];
      const munName = r[3];
      const repId = r[4];
      const repName = r[5];

      if (!provName) continue;

      if (!provincesMap.has(provId)) {
        provincesMap.set(provId, { id: provId, name: provName, municipalities: [] });
      }
      const prov = provincesMap.get(provId)!;

      if (munName) {
        let mun = prov.municipalities.find((m) => m.id === munId || m.name === munName);
        if (!mun) {
          mun = { id: munId || `mun_${i}`, name: munName, repartos: [] };
          prov.municipalities.push(mun);
        }

        if (repName) {
          if (!mun.repartos.some((rep) => rep.name === repName)) {
            mun.repartos.push({ id: repId || `rep_${i}`, name: repName });
          }
        }
      }
    }
    return { type: 'geo', geoCatalog: Array.from(provincesMap.values()) };
  }

  // 4. Detect Departments CSV
  if (header.includes('departmentname') || header.includes('subcategoryname')) {
    const deptsMap = new Map<string, DepartmentCategory>();

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const deptId = r[0] || `dept_${i}`;
      const deptName = r[1];
      const deptDesc = r[2];
      const iconName = r[3];
      const subId = r[4];
      const subName = r[5];

      if (!deptName) continue;

      if (!deptsMap.has(deptId)) {
        deptsMap.set(deptId, {
          id: deptId,
          name: deptName,
          description: deptDesc,
          iconName: iconName,
          subcategories: [],
        });
      }
      const dept = deptsMap.get(deptId)!;

      if (subName) {
        if (!dept.subcategories.some((s) => s.name === subName)) {
          dept.subcategories.push({ id: subId || `sub_${i}`, name: subName });
        }
      }
    }
    return { type: 'departments', departmentsCatalog: Array.from(deptsMap.values()) };
  }

  // 5. Detect Tags CSV
  if (header.includes('taggroupname') || header.includes('tagname')) {
    const groupsMap = new Map<string, TagGroup>();

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const groupId = r[0] || `tg_${i}`;
      const groupName = r[1];
      const groupDesc = r[2];
      const tagId = r[3];
      const tagName = r[4];

      if (!groupName) continue;

      if (!groupsMap.has(groupId)) {
        groupsMap.set(groupId, {
          id: groupId,
          name: groupName,
          description: groupDesc,
          tags: [],
        });
      }
      const group = groupsMap.get(groupId)!;

      if (tagName) {
        if (!group.tags.some((t) => t.name === tagName)) {
          group.tags.push({ id: tagId || `tag_${i}`, name: tagName });
        }
      }
    }
    return { type: 'tags', tagsCatalog: Array.from(groupsMap.values()) };
  }

  // 6. Detect Config CSV (Key, Value)
  if (header.includes('key') && header.includes('value')) {
    const patch: Partial<MarketplaceConfig> = {};
    const socialLinks: any = {};

    for (let i = 1; i < rows.length; i++) {
      const k = rows[i][0];
      const v = rows[i][1];
      if (!k) continue;

      if (['whatsapp', 'telegram', 'instagram', 'facebook'].includes(k)) {
        socialLinks[k] = v;
      } else {
        (patch as any)[k] = v;
      }
    }
    if (Object.keys(socialLinks).length > 0) {
      patch.socialLinks = socialLinks;
    }
    return { type: 'config', configPatch: patch };
  }

  return { type: 'unknown', error: 'No se reconoció la estructura del archivo CSV.' };
}
