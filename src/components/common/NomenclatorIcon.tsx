import React from 'react';
import {
  ShoppingBag,
  Wrench,
  Truck,
  Store,
  CreditCard,
  DollarSign,
  Coins,
  Package,
  MapPin,
  Sparkles,
  Layers,
  Tag,
  Briefcase,
  Percent,
  CheckCircle,
  Home,
  Car,
  Gift,
  FileText,
  Smartphone,
  Zap,
  Clock,
  ShieldCheck,
  Building,
  Heart,
  Boxes,
  HelpCircle,
  LucideIcon,
} from 'lucide-react';

export const NOMENCLATOR_ICON_MAP: Record<string, LucideIcon> = {
  ShoppingBag,
  Wrench,
  Truck,
  Store,
  CreditCard,
  DollarSign,
  Coins,
  Package,
  MapPin,
  Sparkles,
  Layers,
  Tag,
  Briefcase,
  Percent,
  CheckCircle,
  Home,
  Car,
  Gift,
  FileText,
  Smartphone,
  Zap,
  Clock,
  ShieldCheck,
  Building,
  Heart,
  Boxes,
};

export const AVAILABLE_NOMENCLATOR_ICONS = Object.keys(NOMENCLATOR_ICON_MAP);

interface NomenclatorIconProps {
  name?: string;
  className?: string;
}

export const NomenclatorIcon: React.FC<NomenclatorIconProps> = ({
  name,
  className = 'w-4 h-4',
}) => {
  if (!name) {
    return <Tag className={className} />;
  }

  const normalized = name.trim();
  const IconComponent = NOMENCLATOR_ICON_MAP[normalized] || Tag;

  return <IconComponent className={className} />;
};
