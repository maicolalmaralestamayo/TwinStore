import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X, CheckSquare, Square } from 'lucide-react';
import { SelectOption } from './SearchableSelect';
import { interfaz } from '../../data/interfaz';

interface SearchableMultiSelectProps {
  options: SelectOption[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  allLabel?: string;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
}

export const SearchableMultiSelect: React.FC<SearchableMultiSelectProps> = ({
  options,
  values = [],
  onChange,
  placeholder = interfaz.common.searchableMultiSelect.selectOption,
  searchPlaceholder = interfaz.common.searchableMultiSelect.searchPlaceholder,
  allLabel = interfaz.common.searchableMultiSelect.allLabel,
  disabled = false,
  className = '',
  icon,
  size = 'sm',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
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

  // Reset search input on open (without auto-focusing to avoid triggering mobile keyboards)
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  const filteredOptions = options.filter((opt) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const matchesLabel = opt.label.toLowerCase().includes(term);
    const matchesSublabel = opt.sublabel
      ? opt.sublabel.toLowerCase().includes(term)
      : false;
    return matchesLabel || matchesSublabel;
  });

  const handleToggle = (val: string) => {
    if (values.includes(val)) {
      onChange(values.filter((v) => v !== val));
    } else {
      onChange([...values, val]);
    }
  };

  const handleSelectAllFiltered = () => {
    const newValues = Array.from(
      new Set([...values, ...filteredOptions.map((o) => o.value)])
    );
    onChange(newValues);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  // Label to show inside trigger button
  const getTriggerDisplay = () => {
    if (values.length === 0) {
      return (
        <span className="text-slate-600 truncate font-semibold">
          {allLabel || placeholder}
        </span>
      );
    }

    if (values.length === 1) {
      const selectedItem = options.find((o) => o.value === values[0]);
      return (
        <span className="truncate text-slate-900 font-bold">
          {selectedItem ? selectedItem.label : values[0]}
        </span>
      );
    }

    if (values.length === options.length && options.length > 0) {
      return (
        <span className="text-indigo-800 font-bold truncate">
          {interfaz.common.searchableMultiSelect.allLabel} ({options.length})
        </span>
      );
    }

    return (
      <div className="flex items-center gap-1.5 truncate">
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 text-[10px] font-extrabold shrink-0 border border-indigo-200 dark:border-indigo-800">
          {values.length} {interfaz.common.searchableMultiSelect.selectedLabel}
        </span>
        <span className="truncate text-slate-800 dark:text-slate-200 text-xs font-semibold">
          {options
            .filter((o) => values.includes(o.value))
            .slice(0, 2)
            .map((o) => o.label)
            .join(', ')}
          {values.length > 2 ? ` +${values.length - 2}` : ''}
        </span>
      </div>
    );
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed disabled:opacity-70 text-slate-800 dark:text-slate-100 text-left font-semibold transition-all cursor-pointer focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 ${
          size === 'sm' ? 'px-3 py-2 text-xs' : 'px-3.5 py-2.5 text-sm'
        } ${isOpen ? 'bg-white dark:bg-slate-800 border-indigo-500 ring-2 ring-indigo-100 dark:ring-indigo-900' : ''}`}
      >
        <div className="flex items-center gap-2 truncate min-w-0 flex-1">
          {icon && <span className="shrink-0 text-slate-500 dark:text-slate-400">{icon}</span>}
          {getTriggerDisplay()}
        </div>

        <div className="flex items-center gap-1 shrink-0 text-slate-400 dark:text-slate-500">
          {values.length > 0 && !disabled && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                handleClearAll();
              }}
              className="p-0.5 hover:text-rose-600 dark:hover:text-rose-400 rounded-md transition-colors"
              title={interfaz.common.searchableMultiSelect.clearSelectionsTooltip}
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute z-[100] mt-1.5 w-full min-w-[240px] max-w-md bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Search text input */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0 ml-1" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent border-none text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Quick Actions (Select all / Deselect all / Selected Count) */}
          <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
            <span>
              {values.length === 0 ? (
                interfaz.common.searchableMultiSelect.allSelectedDefault
              ) : (
                <strong className="text-indigo-700 dark:text-indigo-400 font-bold">
                  {values.length} de {options.length} {interfaz.common.searchableMultiSelect.chosenOf}
                </strong>
              )}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-bold hover:underline cursor-pointer"
              >
                {interfaz.common.searchableMultiSelect.allLabel}
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 font-bold hover:underline cursor-pointer"
              >
                {interfaz.common.searchableMultiSelect.clearAll}
              </button>
            </div>
          </div>

          {/* Options List with Checkboxes */}
          <div
            className="max-h-60 overflow-y-auto overscroll-contain p-1 space-y-0.5"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#cbd5e1 transparent',
            }}
          >
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400 dark:text-slate-500">
                {interfaz.common.searchableMultiSelect.noResults}
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = values.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={option.disabled}
                    onClick={() => handleToggle(option.value)}
                    className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-900 dark:text-indigo-200 font-bold'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    } ${option.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                      <span className="shrink-0 text-indigo-600 dark:text-indigo-400">
                        {isSelected ? (
                          <CheckSquare className="w-3.5 h-3.5 fill-indigo-600 dark:fill-indigo-500 text-white" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
                        )}
                      </span>

                      {option.icon && (
                        <span className="shrink-0">{option.icon}</span>
                      )}

                      <div className="truncate">
                        <span className="truncate">{option.label}</span>
                        {option.sublabel && (
                          <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-normal truncate">
                            {option.sublabel}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Bottom done bar */}
          <div className="p-1.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex justify-end">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold cursor-pointer transition-colors shadow-xs"
            >
              {interfaz.common.searchableMultiSelect.doneBtn}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
