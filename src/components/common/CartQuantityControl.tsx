import React, { useState, useEffect } from 'react';
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';

export interface CartQuantityControlProps {
  quantity: number;
  onUpdateQuantity: (newQuantity: number) => void;
  onIncrement?: () => void;
  onDecrement?: () => void;
  onRemove?: () => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showAddButtonWhenZero?: boolean;
  showRemoveButton?: boolean;
  addLabel?: string;
  className?: string;
  allowDeleteAtOne?: boolean;
}

/**
 * Control unificado de cantidad para Carrito, Card, Tabla y Modal.
 * Incluye botón de decremento, input para editar directamente la cantidad, botón de incremento,
 * y botoncito para quitar el producto de forma completa.
 */
export const CartQuantityControl: React.FC<CartQuantityControlProps> = ({
  quantity,
  onUpdateQuantity,
  onIncrement,
  onDecrement,
  onRemove,
  min = 0,
  max = 9999,
  size = 'md',
  showAddButtonWhenZero = true,
  showRemoveButton = true,
  addLabel = 'Añadir',
  className = '',
  allowDeleteAtOne = false,
}) => {
  const [inputValue, setInputValue] = useState<string>(String(quantity));

  // Sync internal text with incoming prop
  useEffect(() => {
    setInputValue(String(quantity));
  }, [quantity]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const commitValue = () => {
    const parsed = parseInt(inputValue.trim(), 10);
    if (isNaN(parsed) || parsed < min) {
      onUpdateQuantity(min);
      setInputValue(String(min));
    } else if (parsed > max) {
      onUpdateQuantity(max);
      setInputValue(String(max));
    } else {
      onUpdateQuantity(parsed);
      setInputValue(String(parsed));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  const handleMinusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDecrement) {
      onDecrement();
    } else {
      const next = Math.max(min, quantity - 1);
      onUpdateQuantity(next);
    }
  };

  const handlePlusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onIncrement) {
      onIncrement();
    } else {
      const next = Math.min(max, quantity + 1);
      onUpdateQuantity(next);
    }
  };

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove();
    } else {
      onUpdateQuantity(0);
    }
  };

  const handleInitialAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateQuantity(1);
  };

  // If quantity is 0 and configured to show the Add button
  if (quantity === 0 && showAddButtonWhenZero) {
    const btnPadding =
      size === 'sm'
        ? 'py-1.5 px-3 text-xs gap-1.5'
        : size === 'lg'
        ? 'py-2.5 px-4 text-sm gap-2'
        : 'py-2 px-3.5 text-xs sm:text-sm gap-2';

    return (
      <button
        type="button"
        onClick={handleInitialAdd}
        title="Añadir al carrito"
        className={`inline-flex items-center justify-center font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-xs transition-all transform active:scale-95 cursor-pointer select-none ${btnPadding} ${className}`}
      >
        <ShoppingCart className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        <span>{addLabel}</span>
      </button>
    );
  }

  // Sizing configurations
  const btnDimensions =
    size === 'sm'
      ? 'w-7 h-7 text-xs'
      : size === 'lg'
      ? 'w-9 h-9 text-sm'
      : 'w-8 h-8 text-xs';

  const inputDimensions =
    size === 'sm'
      ? 'w-9 h-7 text-xs'
      : size === 'lg'
      ? 'w-13 h-9 text-sm'
      : 'w-11 h-8 text-xs sm:text-sm';

  const iconSize = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5';

  return (
    <div
      className={`inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs select-none ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Decrement button (Izquierda: Decrementar) */}
      <button
        type="button"
        onClick={handleMinusClick}
        title={quantity === 1 && allowDeleteAtOne ? 'Decrementar (quitar del carrito)' : 'Decrementar cantidad'}
        aria-label="Decrementar cantidad"
        className={`${btnDimensions} rounded-lg flex items-center justify-center font-bold bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 active:bg-slate-200 dark:active:bg-slate-700 transition-colors border border-slate-200/80 dark:border-slate-700 shadow-2xs cursor-pointer`}
      >
        <Minus className={`${iconSize} ${quantity === 1 && allowDeleteAtOne ? 'text-rose-600 dark:text-rose-400' : ''}`} />
      </button>

      {/* Direct editable quantity input - Perfectly centered */}
      <div className="relative flex items-center justify-center">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={commitValue}
          onKeyDown={handleKeyDown}
          title="Editar directamente la cantidad"
          aria-label="Cantidad"
          className={`${inputDimensions} text-center font-black font-mono text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all p-0 m-0 leading-none flex items-center justify-center`}
        />
      </div>

      {/* Increment button (Derecha: Aumentar) */}
      <button
        type="button"
        onClick={handlePlusClick}
        disabled={quantity >= max}
        title="Aumentar cantidad"
        aria-label="Aumentar cantidad"
        className={`${btnDimensions} rounded-lg flex items-center justify-center font-bold bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 active:bg-slate-200 dark:active:bg-slate-700 disabled:opacity-40 transition-colors border border-slate-200/80 dark:border-slate-700 shadow-2xs cursor-pointer`}
      >
        <Plus className={iconSize} />
      </button>

      {/* Botón para quitar el producto por completo del carrito */}
      {showRemoveButton && (
        <button
          type="button"
          onClick={handleRemoveClick}
          title="Quitar producto completamente del carrito"
          aria-label="Quitar producto completamente del carrito"
          className={`${btnDimensions} rounded-lg flex items-center justify-center font-bold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 active:bg-rose-200 dark:active:bg-rose-800 transition-colors border border-rose-200/80 dark:border-rose-900/60 shadow-2xs cursor-pointer ml-0.5`}
        >
          <Trash2 className={iconSize} />
        </button>
      )}
    </div>
  );
};
