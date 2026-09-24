import React, { createContext, useContext, useState, useEffect } from 'react';

export interface HeaderNavOption {
  id: string;
  label: string;
  icon?: any;
  badge?: string;
  count?: number;
}

export interface HeaderActionsConfig {
  optionsTitle?: string;
  options?: HeaderNavOption[];
  activeOptionId?: string;
  onSelectOption?: (id: string) => void;
  hasSearch?: boolean;
  searchPlaceholder?: string;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

interface HeaderActionsContextType {
  config: HeaderActionsConfig | null;
  setHeaderActions: (config: HeaderActionsConfig | null) => void;
  isOptionsDrawerOpen: boolean;
  setOptionsDrawerOpen: (open: boolean) => void;
  isSearchExpanded: boolean;
  setSearchExpanded: (expanded: boolean) => void;
}

const HeaderActionsContext = createContext<HeaderActionsContextType | undefined>(undefined);

export const HeaderActionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<HeaderActionsConfig | null>(null);
  const [isOptionsDrawerOpen, setOptionsDrawerOpen] = useState(false);
  const [isSearchExpanded, setSearchExpanded] = useState(false);

  // Prevent background scroll when curtain drawer is open (Apple standard)
  useEffect(() => {
    if (isOptionsDrawerOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOptionsDrawerOpen]);

  return (
    <HeaderActionsContext.Provider
      value={{
        config,
        setHeaderActions: setConfig,
        isOptionsDrawerOpen,
        setOptionsDrawerOpen,
        isSearchExpanded,
        setSearchExpanded
      }}
    >
      {children}
    </HeaderActionsContext.Provider>
  );
};

export const useHeaderActions = (): HeaderActionsContextType => {
  const context = useContext(HeaderActionsContext);
  if (!context) {
    throw new Error('useHeaderActions must be used within a HeaderActionsProvider');
  }
  return context;
};
