import { DEFAULT_INTERFAZ, InterfazType } from './defaultInterfaz';

export type { InterfazType };
export { DEFAULT_INTERFAZ };

// Copia mutable en memoria de los textos activos sincronizados con la Base de Datos SQLite
let activeTexts: Record<string, any> = JSON.parse(JSON.stringify(DEFAULT_INTERFAZ));

// Función auxiliar recursiva para mezclar profundamente textos sin perder campos no editados
function deepMergeTexts(target: Record<string, any>, source: Record<string, any>): Record<string, any> {
  if (!source || typeof source !== 'object') return target;
  for (const key of Object.keys(source)) {
    if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key] || typeof target[key] !== 'object' || Array.isArray(target[key])) {
        target[key] = {};
      }
      deepMergeTexts(target[key], source[key]);
    } else if (source[key] !== undefined) {
      target[key] = source[key];
    }
  }
  return target;
}

// Actualiza los textos activos en memoria desde la base de datos o configuración
export function setLiveInterfaz(newTexts?: Record<string, any> | null) {
  if (!newTexts || typeof newTexts !== 'object' || Object.keys(newTexts).length === 0) return;
  deepMergeTexts(activeTexts, newTexts);
}

// Obtiene los textos activos en memoria
export function getLiveInterfaz(): InterfazType {
  return activeTexts as InterfazType;
}

// Restablece los textos a los predeterminados de fábrica
export function resetLiveInterfaz() {
  activeTexts = JSON.parse(JSON.stringify(DEFAULT_INTERFAZ));
}

// Proxy transparente para que cualquier módulo que importe 'interfaz' obtenga siempre los valores actuales de la BD
export const interfaz: InterfazType = new Proxy({} as any, {
  get(_target, prop: string) {
    return activeTexts[prop];
  },
  set(_target, prop: string, value: any) {
    activeTexts[prop] = value;
    return true;
  },
  has(_target, prop: string) {
    return prop in activeTexts;
  },
  ownKeys(_target) {
    return Reflect.ownKeys(activeTexts);
  },
  getOwnPropertyDescriptor(_target, prop: string) {
    return Object.getOwnPropertyDescriptor(activeTexts, prop);
  }
}) as InterfazType;

export default interfaz;

