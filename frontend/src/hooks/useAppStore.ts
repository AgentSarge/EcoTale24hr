import { useStore } from '../providers/StoreProvider';

export const useAppStore = () => {
  const store = useStore();
  return {
    auth: store.auth,
    eco: store.eco,
    company: store.company,
    
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