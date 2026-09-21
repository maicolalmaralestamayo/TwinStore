import React from 'react';
import { Product, Store, CurrencyDisplayMode, CartItem } from '../../types';
import { ThemeImage } from '../common/ThemeImage';
import {
  formatNumberWithDots,
  getProductPricesInAllowedCurrencies,
  generateWhatsAppOrderUrl,
} from '../../lib/utils';
import { getStorePaymentMethodsForCurrency } from '../../lib/cartUtils';
import { MessageCircle, CreditCard } from 'lucide-react';
import { CartQuantityControl } from '../common/CartQuantityControl';
import { interfaz } from '../../data/interfaz';

interface ProductTableViewProps {
  products: Product[];
  stores: Store[];
  currencyMode: CurrencyDisplayMode;
  onSelectProduct: (product: Product) => void;
  onSelectStore?: (store: Store) => void;
  onAddToCart?: (product: Product, quantity?: number) => void;
  onUpdateQuantity?: (productId: string, quantity: number) => void;
  onRemoveFromCart?: (productId: string) => void;
  cartItems?: CartItem[];
}

export const ProductTableView: React.FC<ProductTableViewProps> = ({
  products,
  stores,
  onSelectProduct,
  onAddToCart,
  onUpdateQuantity,
  onRemoveFromCart,
  cartItems = [],
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <th className="py-3.5 px-4 w-28">Foto</th>
              <th className="py-3.5 px-4 min-w-[260px]">Producto & Descripción</th>
              <th className="py-3.5 px-4 min-w-[180px]">Precios</th>
              <th className="py-3.5 px-4 text-right min-w-[240px]">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
            {products.map((product) => {
              const store = stores.find((s) => s.id === product.storeId);
              const pricesInCurrencies = getProductPricesInAllowedCurrencies(product, store);
              const primaryItem = pricesInCurrencies[0] || {
                currency: product.currency || 'USD',
                amount: product.price !== undefined && product.price !== null ? product.price : (product.priceUSD || 0),
                rate: 1,
                isOriginal: true,
              };
              const alternateItem = pricesInCurrencies.find((p) => !p.isOriginal);

              const existingCartItem = cartItems.find((ci) => ci.productId === product.id);
              const cartQuantity = existingCartItem?.quantity || 0;

              const handleRemove = () => {
                if (onRemoveFromCart) {
                  onRemoveFromCart(product.id);
                } else if (onUpdateQuantity) {
                  onUpdateQuantity(product.id, 0);
                }
              };

              const handleQuantityChange = (newQty: number) => {
                if (cartQuantity === 0 && newQty > 0 && onAddToCart) {
                  onAddToCart(product, newQty);
                  return;
                }
                if (newQty <= 0) {
                  handleRemove();
                  return;
                }
                if (onUpdateQuantity) {
                  onUpdateQuantity(product.id, newQty);
                } else if (onAddToCart) {
                  const diff = newQty - cartQuantity;
                  if (diff > 0) onAddToCart(product, diff);
                }
              };

              const handleWhatsAppClick = (e: React.MouseEvent) => {
                e.stopPropagation();
                if (!store) return;
                const url = generateWhatsAppOrderUrl(product, store);
                window.open(url, '_blank', 'noopener,noreferrer');
              };

              return (
                <tr
                  key={product.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                  onClick={() => onSelectProduct(product)}
                >
                  {/* 1. Foto principal con badges (tasa y código) */}
                  <td className="py-3 px-4 align-middle">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                      <ThemeImage
                        src={product.imageUrl}
                        alt={product.title}
                        fallbackType="product"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {/* Badge de Tasa / Moneda */}
                      <div className="absolute top-1 left-1 z-10">
                        {alternateItem ? (
                          <div className="bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-xs text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-xs border border-white/10 font-mono">
                            1 {primaryItem.currency} x {formatNumberWithDots(alternateItem.rate)} {alternateItem.currency}
                          </div>
                        ) : (
                          <div className="bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-xs text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-xs border border-white/10 font-mono uppercase">
                            {primaryItem.currency}
                          </div>
                        )}
                      </div>
                      {/* Badge de Código */}
                      {product.code && (
                        <div className="absolute bottom-1 left-1 z-10">
                          <span className="bg-indigo-600/95 text-white px-1.5 py-0.2 rounded-full text-[8px] font-mono font-bold shadow-xs">
                            {product.code}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* 2. Nombre / Título y Descripción */}
                  <td className="py-3 px-4 align-middle">
                    <div className="space-y-1 max-w-lg">
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-sm leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                        {product.title}
                      </h3>
                      {product.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* 3. Precios (Moneda original y moneda equivalente permitida) & Formas de pago */}
                  <td className="py-3 px-4 align-middle whitespace-nowrap">
                    <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700 inline-flex flex-col gap-1 min-w-[150px]">
                      <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100">
                        {formatNumberWithDots(primaryItem.amount)} {primaryItem.currency}
                      </span>
                      {alternateItem ? (
                        <span className="text-xs sm:text-sm font-black text-indigo-700 dark:text-indigo-400 font-mono">
                          {formatNumberWithDots(alternateItem.amount)} {alternateItem.currency}
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-400">
                          Solo {primaryItem.currency}
                        </span>
                      )}
                      {store && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 pt-0.5 border-t border-slate-200/60 dark:border-slate-700/60">
                          <span>
                            {getStorePaymentMethodsForCurrency(store, primaryItem.currency)
                              .map((m) => m.name)
                              .join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* 4. Botones y opciones de acción (Carrito y WhatsApp) */}
                  <td className="py-3 px-4 text-right align-middle whitespace-nowrap">
                    <div
                      className="inline-flex items-center justify-end gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {(onAddToCart || onUpdateQuantity) && (
                        <CartQuantityControl
                          quantity={cartQuantity}
                          onUpdateQuantity={handleQuantityChange}
                          onRemove={handleRemove}
                          size="sm"
                          addLabel="Añadir"
                          allowDeleteAtOne={true}
                          showAddButtonWhenZero={true}
                          showRemoveButton={true}
                        />
                      )}

                      <button
                        type="button"
                        onClick={handleWhatsAppClick}
                        className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold py-2 px-3 rounded-xl transition-all shadow-xs text-xs cursor-pointer select-none"
                        title={`${interfaz.productCard.contactAriaLabel} ${product.title}`}
                        aria-label={`${interfaz.productCard.contactAriaLabel} ${product.title}`}
                      >
                        <MessageCircle className="w-3.5 h-3.5 shrink-0 fill-current" />
                        <span>{interfaz.productCard.contactButton}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
