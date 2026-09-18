import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { InterfazType, DEFAULT_INTERFAZ, setLiveInterfaz, getLiveInterfaz } from '../data/interfaz';

interface InterfazContextValue {
  interfaz: InterfazType;
  updateText: (path: string, value: string) => void;
  updateSection: (section: string, values: Record<string, any>) => void;
  setAllTexts: (newTexts: Record<string, any>) => void;
  resetToDefault: () => void;
}

const InterfazContext = createContext<InterfazContextValue | null>(null);

interface InterfazProviderProps {
  children: React.ReactNode;
  initialTexts?: Record<string, any>;
}

export const InterfazProvider: React.FC<InterfazProviderProps> = ({ children, initialTexts }) => {
  const [texts, setTexts] = useState<Record<string, any>>(() => {
    if (initialTexts && Object.keys(initialTexts).length > 0) {
      setLiveInterfaz(initialTexts);
      return getLiveInterfaz();
    }
    return getLiveInterfaz();
  });

  // Keep in-memory proxy and active state synchronized whenever initialTexts changes (e.g. from SQLite config load)
  useEffect(() => {
    if (initialTexts && Object.keys(initialTexts).length > 0) {
      setLiveInterfaz(initialTexts);
      setTexts({ ...getLiveInterfaz() });
    }
  }, [initialTexts]);

  const updateText = (path: string, value: string) => {
    setTexts((prev) => {
      const cloned = JSON.parse(JSON.stringify(prev));
      const parts = path.split('.');
      let current = cloned;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) current[parts[i]] = {};
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = value;
      setLiveInterfaz(cloned);
      return cloned;
    });
  };

  const updateSection = (section: string, values: Record<string, any>) => {
    setTexts((prev) => {
      const cloned = JSON.parse(JSON.stringify(prev));
      cloned[section] = {
        ...(cloned[section] || {}),
        ...values,
      };
      setLiveInterfaz(cloned);
      return cloned;
    });
  };

  const setAllTexts = (newTexts: Record<string, any>) => {
    setLiveInterfaz(newTexts);
    setTexts({ ...getLiveInterfaz() });
  };

  const resetToDefault = () => {
    const factory = JSON.parse(JSON.stringify(DEFAULT_INTERFAZ));
    setLiveInterfaz(factory);
    setTexts(factory);
  };

  const contextValue = useMemo<InterfazContextValue>(() => {
    return {
      interfaz: texts as InterfazType,
      updateText,
      updateSection,
      setAllTexts,
      resetToDefault,
    };
  }, [texts]);

  return (
    <InterfazContext.Provider value={contextValue}>
      {children}
    </InterfazContext.Provider>
  );
};

export function useInterfaz(): InterfazContextValue {
  const ctx = useContext(InterfazContext);
  if (!ctx) {
    // Fallback if accessed outside provider
    return {
      interfaz: getLiveInterfaz(),
      updateText: () => {},
      updateSection: () => {},
      setAllTexts: () => {},
      resetToDefault: () => {},
    };
  }
  return ctx;
}
