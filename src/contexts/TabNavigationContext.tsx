import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

type TabId = 'home' | 'explore' | 'live' | 'active' | 'stream';

interface TabNavigationContextValue {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  navigateTo: (tab: TabId) => void;
}

const TabNavigationContext = createContext<TabNavigationContextValue | null>(null);

export const useTabNavigation = (): TabNavigationContextValue => {
  const context = useContext(TabNavigationContext);
  if (!context) {
    return { activeTab: 'home', setActiveTab: () => {}, navigateTo: () => {} };
  }
  return context;
};

interface TabNavigationProviderProps {
  children: ReactNode;
  initialTab?: TabId;
}

export const TabNavigationProvider: React.FC<TabNavigationProviderProps> = ({ children, initialTab = 'home' }) => {
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  const navigateTo = useCallback((tab: TabId) => {
    setActiveTab(tab);
  }, []);

  return (
    <TabNavigationContext.Provider value={{ activeTab, setActiveTab, navigateTo }}>
      {children}
    </TabNavigationContext.Provider>
  );
};
