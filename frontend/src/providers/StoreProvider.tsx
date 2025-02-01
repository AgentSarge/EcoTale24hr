import React, { createContext, useContext, ReactNode } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useEcoStore } from '../stores/ecoStore';
import { useCompanyStore } from '../stores/companyStore';

interface StoreContextType {
  auth: ReturnType<typeof useAuthStore>;
  eco: ReturnType<typeof useEcoStore>;
  company: ReturnType<typeof useCompanyStore>;
}

const StoreContext = createContext<StoreContextType | null>(null);

interface StoreProviderProps {
  children: ReactNode;
}

export const StoreProvider: React.FC<StoreProviderProps> = ({ children }) => {
  const auth = useAuthStore();
  const eco = useEcoStore();
  const company = useCompanyStore();

  return (
    <StoreContext.Provider value={{ auth, eco, company }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}; 