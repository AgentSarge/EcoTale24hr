import { useStore } from '../providers/StoreProvider';

interface EcoStore {
  saveOnboardingData: (data: any) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

interface AuthStore {
  session: any;
  isLoading: boolean;
  error: Error | null;
}

interface CompanyStore {
  data: any;
  isLoading: boolean;
  error: Error | null;
}

export const useAppStore = () => {
  const store = useStore();
  return {
    auth: store.auth as AuthStore,
    eco: store.eco as EcoStore,
    company: store.company as CompanyStore,
    
    // Computed properties
    isAuthenticated: !!store.auth.session,
    isLoading: store.auth.isLoading || store.eco.isLoading || store.company.isLoading,
    hasError: !!store.auth.error || !!store.eco.error,
    
    // Helper methods
    clearErrors: () => {
      store.auth.error = null;
      store.eco.error = null;
    }
  };
}; 