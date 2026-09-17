import React from 'react';
import { Product, Store, CurrencyDisplayMode } from '../../types';
import { ThemeImage } from '../common/ThemeImage';
import {
  formatNumberWithDots,
  getProductPricesInAllowedCurrencies,
  generateWhatsAppOrderUrl,
} from '../../lib/utils';
import {
  MessageCircle,
} from 'lucide-react';
import { CartQuantityControl } from '../common/CartQuantityControl';
import { interfaz } from '../../data/interfaz';

interface ProductCardProps {
  product: Product;
  store?: Store;
  currencyMode: CurrencyDisplayMode;
  onSelectProduct: (product: Product) => void;
  onAddToCart?: (product: Product, quantity?: number) => void;
  onUpdateQuantity?: (productId: string, quantity: number) => void;
  onRemoveFromCart?: (productId: string) => void;
  cartQuantity?: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  store,
  onSelectProduct,
  onAddToCart,
  onUpdateQuantity,
  onRemoveFromCart,
  cartQuantity = 0,
}) => {
  // Product currency and prices in allowed currencies for this specific product
  const pricesInCurrencies = getProductPricesInAllowedCurrencies(product, store);
  const primaryItem = pricesInCurrencies[0] || {
    currency: product.currency || 'USD',
    amount: product.price !== undefined && product.price !== null ? product.price : (product.priceUSD || 0),
    rate: 1,
    isOriginal: true,
  };
  const alternateItem = pricesInCurrencies.find((p) => !p.isOriginal);

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
      if (diff > 0) {
        onAddToCart(product, diff);
      }
    }
  };

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!store) return;
    const url = generateWhatsAppOrderUrl(product, store);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      onClick={() => onSelectProduct(product)}
      className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden cursor-pointer relative"
    >
      {/* 1. Foto principal del producto o servicio */}
      <div className="relative h-48 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <ThemeImage
          src={product.imageUrl}
          alt={product.title}
          fallbackType="product"
          className="w-full h-full"
          imgClassName="group-hover:scale-105 transition-transform duration-500"
        />

        {/* Badges: Tasa o Moneda del Producto + Código único */}
        <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 items-start">
          {alternateItem ? (
            <div className="bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs border border-white/10 font-mono">
              1 {primaryItem.currency} x {formatNumberWithDots(alternateItem.rate)} {alternateItem.currency}
            </div>
          ) : (
            <div className="bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs border border-white/10 font-mono uppercase">
              {primaryItem.currency}
            </div>
          )}

          {product.code && (
            <span className="inline-flex items-center gap-1 bg-indigo-600/95 text-white px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shadow-xs">
              {product.code}
            </span>
          )}
        </div>
      </div>

      {/* Card body content */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div className="space-y-2.5">
          {/* 2. Nombre del producto o servicio */}
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
            {product.title}
          </h3>

          {/* 3. Descripción del producto o servicio */}
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          {/* 4. Precios: Moneda del producto y moneda equivalente permitida (si existe) */}
          <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-2">
            <span className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
              {formatNumberWithDots(primaryItem.amount)} {primaryItem.currency}
            </span>
            {alternateItem ? (
              <span className="text-sm sm:text-base font-black text-indigo-700 dark:text-indigo-400 font-mono">
                {formatNumberWithDots(alternateItem.amount)} {alternateItem.currency}
              </span>
            ) : (
              <span className="text-xs font-semibold text-slate-400">
                Solo {primaryItem.currency}
              </span>
            )}
          </div>
        </div>

        {/* 5. Botones de Acción: Control de Cantidad y Contactar */}
        <div className="pt-2 flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
          {(onAddToCart || onUpdateQuantity) && (
            <div className="w-full flex items-center justify-center">
              <CartQuantityControl
                quantity={cartQuantity}
                onUpdateQuantity={handleQuantityChange}
                onRemove={handleRemove}
                size="md"
                addLabel="Añadir"
                allowDeleteAtOne={true}
                showAddButtonWhenZero={true}
                showRemoveButton={true}
                className="w-full justify-center"
              />
            </div>
          )}

          <button
            type="button"
            onClick={handleWhatsAppClick}
            className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs text-xs cursor-pointer select-none"
            title={`${interfaz.productCard.contactAriaLabel} ${product.title}`}
            aria-label={`${interfaz.productCard.contactAriaLabel} ${product.title}`}
          >
            <MessageCircle className="w-3.5 h-3.5 shrink-0 fill-current" />
            <span className="truncate">{interfaz.productCard.contactButton}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
