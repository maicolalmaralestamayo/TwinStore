import React, { useMemo, useState } from 'react';
import {
  Store,
  Product,
  CartItem,
  StoreCartPreferences,
  MarketplaceConfig,
} from '../../types';
import {
  calculateStoreCartGroup,
  generateStoreCartWhatsAppUrl,
  generateStoreCartWhatsAppMessage,
  generateMarketplaceOwnerWhatsAppUrl,
  generateMarketplaceConsolidatedWhatsAppMessage,
  getStoreAcceptedCurrencies,
  getStorePaymentMethods,
  getStoreDeliveryMethods,
  StoreCurrencySubtotal,
} from '../../lib/cartUtils';
import { formatNumberWithDots } from '../../lib/utils';
import { CartQuantityControl } from '../common/CartQuantityControl';
import {
  X,
  ShoppingCart,
  Trash2,
  MessageCircle,
  Copy,
  Check,
  Store as StoreIcon,
  ShoppingBag,
  Info,
  Layers,
} from 'lucide-react';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  stores: Store[];
  products: Product[];
  marketplaceConfig: MarketplaceConfig;
  storePreferences: Record<string, StoreCartPreferences>;
  onUpdateQuantity: (productId: string, newQuantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onUpdateStorePreferences: (storeId: string, prefs: Partial<StoreCartPreferences>) => void;
  onUpdateItemPreferences?: (productId: string, prefs: Partial<CartItem>) => void;
  onShowToast: (title: string, description?: string, type?: 'success' | 'info' | 'error') => void;
  onSelectStore?: (store: Store) => void;
}

export const CartModal: React.FC<CartModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  stores,
  products,
  marketplaceConfig,
  storePreferences,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onUpdateStorePreferences,
  onUpdateItemPreferences,
  onShowToast,
  onSelectStore,
}) => {
  const [copiedStoreId, setCopiedStoreId] = useState<string | null>(null);
  const [copiedMaster, setCopiedMaster] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  // Group cart items by store
  const storeGroups = useMemo(() => {
    const map = new Map<string, { store: Store; items: CartItem[] }>();

    cartItems.forEach((ci) => {
      const product = products.find((p) => p.id === ci.productId);
      if (!product) return;

      const store = stores.find((s) => s.id === product.storeId);
      if (!store) return;

      if (!map.has(store.id)) {
        map.set(store.id, { store, items: [] });
      }
      map.get(store.id)!.items.push(ci);
    });

    return Array.from(map.values());
  }, [cartItems, stores, products]);

  // Calculate totals and grouping for each store
  const storeCalculations = useMemo(() => {
    return storeGroups.map((grp) => {
      const prefs = storePreferences[grp.store.id];
      return calculateStoreCartGroup(
        grp.store,
        grp.items,
        products,
        prefs,
        marketplaceConfig.paymentMethodsCatalog,
        marketplaceConfig.deliveryMethodsCatalog
      );
    });
  }, [storeGroups, products, storePreferences, marketplaceConfig]);

  // Overall totals grouped by payment currency across all stores
  const grandCurrencyTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    storeCalculations.forEach((calc) => {
      (Object.values(calc.currencySubtotals) as StoreCurrencySubtotal[]).forEach((sub) => {
        totals[sub.currency] =
          Math.round(((totals[sub.currency] || 0) + sub.finalSubtotal) * 100) / 100;
      });
    });
    return totals;
  }, [storeCalculations]);

  const totalItemsCount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const handleCopyStoreOrder = (calc: typeof storeCalculations[0]) => {
    const text = generateStoreCartWhatsAppMessage(calc, marketplaceConfig);
    navigator.clipboard.writeText(text);
    setCopiedStoreId(calc.store.id);
    onShowToast(
      '¡Pedido Copiado!',
      `Texto del pedido para ${calc.store.name} copiado al portapapeles`,
      'success'
    );
    setTimeout(() => setCopiedStoreId(null), 2500);
  };

  const handleCopyMasterOrder = () => {
    const text = generateMarketplaceConsolidatedWhatsAppMessage(
      storeCalculations,
      marketplaceConfig
    );
    navigator.clipboard.writeText(text);
    setCopiedMaster(true);
    onShowToast(
      '¡Pedido Consolidado Copiado!',
      'Texto del pedido para el Administrador copiado al portapapeles',
      'success'
    );
    setTimeout(() => setCopiedMaster(false), 2500);
  };

  const handleItemPreferenceChange = (productId: string, prefs: Partial<CartItem>) => {
    if (onUpdateItemPreferences) {
      onUpdateItemPreferences(productId, prefs);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================================================= */}
        {/* MODAL HEADER */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-2xs">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Carrito de Compras
                </h2>
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-indigo-600 text-white shadow-2xs inline-flex items-center justify-center text-center leading-none">
                  {totalItemsCount} {totalItemsCount === 1 ? 'artículo' : 'artículos'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Detalle tabular por tienda y productos con monedas y formas de pago
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {cartItems.length > 0 && (
              confirmClear ? (
                <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/60 p-1 rounded-xl border border-rose-200 dark:border-rose-900/60">
                  <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 px-1.5">
                    ¿Vaciar todo?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onClearCart();
                      setConfirmClear(false);
                      onShowToast('Carrito vaciado', 'Se eliminaron todos los artículos', 'info');
                    }}
                    className="text-xs font-extrabold bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded-lg transition-colors cursor-pointer shadow-2xs"
                    title="Confirmar vaciar carrito"
                  >
                    Sí, vaciar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                    title="Cancelar"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 px-3 py-1.5 rounded-xl transition-colors cursor-pointer border border-rose-200 dark:border-rose-900/50"
                  title="Vaciar todos los artículos del carrito"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Vaciar</span>
                </button>
              )
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MODAL BODY */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {storeCalculations.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 dark:text-slate-500">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Tu carrito está vacío
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Explora el catálogo de productos y servicios del marketplace y agrégalos a tu carrito para realizar pedidos directos por WhatsApp.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md transition-all cursor-pointer"
              >
                <span>Explorar Productos</span>
              </button>
            </div>
          ) : (
            storeCalculations.map((calc) => {
              const { store, items, currencySubtotals, exchangeRatesText } = calc;
              const storeCurrencies = getStoreAcceptedCurrencies(store);
              const storePaymentMethods = getStorePaymentMethods(
                store,
                marketplaceConfig.paymentMethodsCatalog
              );
              const storeDeliveryMethods = getStoreDeliveryMethods(
                store,
                marketplaceConfig.deliveryMethodsCatalog
              );
              const storeWhatsAppUrl = generateStoreCartWhatsAppUrl(calc, marketplaceConfig);

              return (
                <div
                  key={store.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden"
                >
                  {/* ========================================================================= */}
                  {/* TIENDA: SOLO UNA LÍNEA (Nombre, Tasas y Botón WhatsApp) */}
                  {/* ========================================================================= */}
                  <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                    {/* Left: Name and Rates used */}
                    <div className="flex flex-wrap items-center gap-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => onSelectStore?.(store)}
                        className="font-black text-slate-900 dark:text-white text-sm hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate text-left cursor-pointer"
                        title="Ver detalles de la tienda"
                      >
                        {store.name}
                      </button>

                      {/* Tasas utilizadas por el usuario en su compra */}
                      {calc.usedExchangeRatesText ? (
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 shrink-0 shadow-2xs">
                          <span className="font-bold text-slate-500 dark:text-slate-400">Tasas utilizadas:</span>
                          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{calc.usedExchangeRatesText}</span>
                        </span>
                      ) : null}
                    </div>

                    {/* Right: Store WhatsApp Contact Button */}
                    <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                      <button
                        type="button"
                        onClick={() => handleCopyStoreOrder(calc)}
                        title="Copiar texto del pedido de esta tienda"
                        className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 text-xs flex items-center gap-1 cursor-pointer"
                      >
                        {copiedStoreId === store.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-indigo-600" />
                        )}
                        <span className="hidden sm:inline text-[11px] font-bold">
                          {copiedStoreId === store.id ? '¡Copiado!' : 'Copiar'}
                        </span>
                      </button>

                      <a
                        href={storeWhatsAppUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs py-1.5 px-3 rounded-lg shadow-2xs transition-all cursor-pointer select-none"
                        title={`Pedir a ${store.name} por WhatsApp`}
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-current" />
                        <span>Pedir a Tienda</span>
                      </a>
                    </div>
                  </div>

                  {/* ========================================================================= */}
                  {/* TABULAR PRODUCT LIST */}
                  {/* ========================================================================= */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-800/40 text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                          <th className="py-2.5 px-3">Producto</th>
                          <th className="py-2.5 px-3 text-center">Cantidad</th>
                          <th className="py-2.5 px-3">Precio Base</th>
                          <th className="py-2.5 px-3">Moneda Pago</th>
                          <th className="py-2.5 px-3">Precio a Pagar</th>
                          <th className="py-2.5 px-3">Forma de Pago</th>
                          <th className="py-2.5 px-3">Recogida / Entrega</th>
                          <th className="py-2.5 px-2 text-center w-8"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {items.map((item) => {
                          const { product, cartItem } = item;
                          const code = product.code || product.id.slice(0, 6).toUpperCase();

                          return (
                            <tr
                              key={product.id}
                              className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                            >
                              {/* 1. Producto (Imagen, Código, Descripción) */}
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-2.5 min-w-[180px]">
                                  {product.imageUrl ? (
                                    <img
                                      src={product.imageUrl}
                                      alt={product.title}
                                      className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                                      <ShoppingBag className="w-5 h-5" />
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                                        {code}
                                      </span>
                                    </div>
                                    <p className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]" title={product.title}>
                                      {product.title}
                                    </p>
                                    {product.unit && (
                                      <p className="text-[10px] text-slate-400 dark:text-slate-500">
                                        Unidad: {product.unit}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* 2. Cantidad (Control unificado con incremento, decremento, edición directa y quitar producto) */}
                              <td className="py-2.5 px-3 text-center">
                                <div className="inline-flex justify-center">
                                  <CartQuantityControl
                                    quantity={cartItem.quantity}
                                    onUpdateQuantity={(q) => onUpdateQuantity(product.id, q)}
                                    onRemove={() => onRemoveItem(product.id)}
                                    size="sm"
                                    allowDeleteAtOne={true}
                                    showRemoveButton={true}
                                  />
                                </div>
                              </td>

                              {/* 3. Precio Base original */}
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                                  {formatNumberWithDots(item.originalPrice)} {item.originalCurrency}
                                </span>
                              </td>

                              {/* 4. Tipo de Moneda de Pago (Selector con monedas configuradas por la tienda) */}
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <select
                                  value={item.paymentCurrency}
                                  onChange={(e) =>
                                    handleItemPreferenceChange(product.id, {
                                      paymentCurrency: e.target.value,
                                    })
                                  }
                                  className="text-xs font-bold font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg px-2 py-1 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                                  title="Moneda de pago para este artículo"
                                >
                                  {storeCurrencies.map((curr) => (
                                    <option key={curr} value={curr}>
                                      {curr}
                                    </option>
                                  ))}
                                </select>
                              </td>

                              {/* 5. Precio a Pagar (Unitario y total con tasa entera) */}
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <div>
                                  <span className="font-mono font-black text-indigo-700 dark:text-indigo-400">
                                    {formatNumberWithDots(item.lineTotal)} {item.paymentCurrency}
                                  </span>
                                  {cartItem.quantity > 1 && (
                                    <p className="text-[10px] text-slate-400 font-mono">
                                      ({formatNumberWithDots(item.unitPrice)} c/u)
                                    </p>
                                  )}
                                </div>
                              </td>

                              {/* 6. Forma de Pago */}
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <select
                                  value={item.paymentMethod.id}
                                  onChange={(e) =>
                                    handleItemPreferenceChange(product.id, {
                                      paymentMethodId: e.target.value,
                                    })
                                  }
                                  className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg px-2 py-1 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden cursor-pointer max-w-[130px]"
                                  title="Forma de pago"
                                >
                                  {storePaymentMethods.map((pm) => (
                                    <option key={pm.id} value={pm.id}>
                                      {pm.name} {pm.gravamen > 0 ? `(+${pm.gravamen}%)` : ''}
                                    </option>
                                  ))}
                                </select>
                              </td>

                              {/* 7. Recogida / Entrega */}
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <select
                                  value={item.deliveryMethod.id}
                                  onChange={(e) =>
                                    handleItemPreferenceChange(product.id, {
                                      deliveryMethodId: e.target.value,
                                    })
                                  }
                                  className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg px-2 py-1 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden cursor-pointer max-w-[140px]"
                                  title="Modalidad de entrega / recogida"
                                >
                                  {storeDeliveryMethods.map((dm) => (
                                    <option key={dm.id} value={dm.id}>
                                      {dm.name}
                                    </option>
                                  ))}
                                </select>
                              </td>

                              {/* 8. Botón Quitar de forma completa */}
                              <td className="py-2.5 px-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => onRemoveItem(product.id)}
                                  className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 bg-rose-50/60 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border border-rose-200/60 dark:border-rose-900/60 transition-colors cursor-pointer"
                                  title="Quitar este producto por completo del carrito"
                                  aria-label="Quitar producto completamente"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* ========================================================================= */}
                  {/* SUBTOTALES DE LA TIENDA POR TIPOS DE MONEDAS */}
                  {/* ========================================================================= */}
                  <div className="px-4 py-2.5 bg-slate-50/90 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-bold">
                      <Layers className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Subtotales de {store.name} por moneda:</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {(Object.values(currencySubtotals) as StoreCurrencySubtotal[]).map((sub) => (
                        <div
                          key={sub.currency}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono shadow-2xs"
                        >
                          <span className="text-slate-500 dark:text-slate-400 text-[11px] font-bold">
                            {sub.currency}:
                          </span>
                          <span className="font-black text-slate-900 dark:text-white text-xs">
                            {formatNumberWithDots(sub.finalSubtotal)} {sub.currency}
                          </span>
                          {sub.gravamenTotal > 0 && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-sans">
                              (incl. grav.)
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ========================================================================= */}
        {/* MODAL FOOTER: TOTALES GENERALES DESGLOSADOS POR MONEDA & CONTACTO MASTER */}
        {/* ========================================================================= */}
        {storeCalculations.length > 0 && (
          <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
            {/* Totales consolidados desglosados por tipo de moneda */}
            <div className="w-full sm:w-auto space-y-1">
              <span className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                Total General a Pagar (Desglosado por Monedas):
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {Object.entries(grandCurrencyTotals).map(([curr, sum]) => (
                  <div
                    key={curr}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800"
                  >
                    <span className="text-xs text-slate-600 dark:text-slate-300 font-bold">
                      Total {curr}:
                    </span>
                    <span className="text-base font-black text-indigo-700 dark:text-indigo-300 font-mono">
                      {formatNumberWithDots(Number(sum))} {curr}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Master Actions to Marketplace Owner (SEO) */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleCopyMasterOrder}
                className="bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold py-2.5 px-3.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700 text-xs shadow-2xs cursor-pointer"
                title="Copiar texto del pedido consolidado para el administrador"
              >
                {copiedMaster ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4 text-indigo-600" />
                )}
                <span className="font-bold">
                  {copiedMaster ? '¡Copiado!' : 'Copiar Pedido'}
                </span>
              </button>

              <a
                href={generateMarketplaceOwnerWhatsAppUrl(storeCalculations, marketplaceConfig)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-initial bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-black py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md text-xs sm:text-sm cursor-pointer"
                title="Contactar al dueño del marketplace con el pedido consolidado"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>Contactar Dueño Marketplace</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
