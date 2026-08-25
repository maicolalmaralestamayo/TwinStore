import React from 'react';
import { Product, Store, CurrencyDisplayMode } from '../../types';
import { ThemeImage } from '../common/ThemeImage';
import {
  formatNumberWithDots,
  calculateCUP,
  generateWhatsAppOrderUrl,
} from '../../lib/utils';
import {
  MessageCircle,
  Briefcase,
  FolderTree,
} from 'lucide-react';

interface ProductCardProps {
  product: Product;
  store?: Store;
  currencyMode: CurrencyDisplayMode;
  onSelectProduct: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  store,
  onSelectProduct,
}) => {
  const usdRate = store?.usdToCupRate || 330;
  const cupPrice = calculateCUP(product.priceUSD, usdRate);

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!store) return;
    const url = generateWhatsAppOrderUrl(product, store);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      onClick={() => onSelectProduct(product)}
      className="group bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden cursor-pointer relative"
    >
      {/* 1. Foto principal del producto o servicio */}
      <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
        <ThemeImage
          src={product.imageUrl}
          alt={product.title}
          fallbackType="product"
          className="w-full h-full"
          imgClassName="group-hover:scale-105 transition-transform duration-500"
        />

        {/* Badges: Tasa (1 USD x 328 CUP) + Badge Servicio */}
        <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 items-start">
          <div className="bg-slate-900/90 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs border border-white/10 font-mono">
            1 USD x {formatNumberWithDots(usdRate)} CUP
          </div>

          {product.isService && (
            <span className="inline-flex items-center gap-1 bg-purple-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs">
              <Briefcase className="w-2.5 h-2.5" />
              Servicio
            </span>
          )}
        </div>
      </div>

      {/* Card body content */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div className="space-y-2.5">
          {/* 2. Nombre del producto o servicio */}
          <h3 className="font-extrabold text-slate-900 text-base leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2">
            {product.title}
          </h3>

          {/* 3. Descripción del producto o servicio */}
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          {/* 4. Precios en USD y CUP sin la conjunción "y" con separadores de puntos de tres en tres */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between gap-2">
            <span className="text-sm sm:text-base font-black text-slate-900">
              {formatNumberWithDots(product.priceUSD)} USD
            </span>
            <span className="text-sm sm:text-base font-black text-indigo-700 font-mono">
              {formatNumberWithDots(cupPrice)} CUP
            </span>
          </div>
        </div>

        {/* 5. Botón minimalista con el ícono de whatsapp y solamente el texto Contactar */}
        <div className="pt-2">
          <button
            onClick={handleWhatsAppClick}
            className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs text-xs sm:text-sm cursor-pointer"
            title="Contactar por WhatsApp"
          >
            <MessageCircle className="w-4 h-4 shrink-0 fill-current" />
            <span>Contactar</span>
          </button>
        </div>
      </div>
    </div>
  );
};


