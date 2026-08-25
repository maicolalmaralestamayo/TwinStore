import React, { useState, useRef, useEffect } from 'react';
import { ThemePreference } from '../../types';
import { Sun, Moon, Laptop, ChevronDown, Check } from 'lucide-react';

interface ThemeSelectorProps {
  theme: ThemePreference;
  resolvedTheme: 'light' | 'dark';
  onThemeChange: (theme: ThemePreference) => void;
  compact?: boolean;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  theme,
  resolvedTheme,
  onThemeChange,
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const options: { value: ThemePreference; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      value: 'system',
      label: 'Sistema',
      icon: <Laptop className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />,
      desc: 'Sigue el tema del sistema operativo',
    },
    {
      value: 'light',
      label: 'Claro',
      icon: <Sun className="w-4 h-4 text-amber-500" />,
      desc: 'Tema claro brillante',
    },
    {
      value: 'dark',
      label: 'Oscuro',
      icon: <Moon className="w-4 h-4 text-indigo-400" />,
      desc: 'Tema oscuro para menor fatiga visual',
    },
  ];

  const currentOption = options.find((o) => o.value === theme) || options[0];

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title={`Tema actual: ${currentOption.label} (${resolvedTheme === 'dark' ? 'Oscuro activo' : 'Claro activo'})`}
        aria-label="Cambiar tema de la aplicación"
        className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <span className="flex items-center justify-center shrink-0">
          {resolvedTheme === 'dark' ? (
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-amber-500" />
          )}
        </span>
        {!compact && (
          <span className="hidden xl:inline capitalize font-semibold">
            {theme === 'system' ? 'Auto' : currentOption.label}
          </span>
        )}
        <ChevronDown className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 z-50 mt-1.5 w-52 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
              Preferencia de Tema
            </span>
          </div>

          <div className="p-1 space-y-0.5">
            {options.map((opt) => {
              const isSelected = theme === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onThemeChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="shrink-0">{opt.icon}</div>
                    <div className="truncate">
                      <div className="font-bold flex items-center gap-1.5">
                        <span>{opt.label}</span>
                        {opt.value === 'system' && (
                          <span className="text-[9px] font-normal px-1 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            Por defecto
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-400 truncate">
                        {opt.desc}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 ml-1.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
