import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface JourneyStep {
  id: string;
  materialId: string;
  location: string;
  status: 'completed' | 'in_progress' | 'pending';
  timestamp: string;
  recoveryRate?: number;
  notes?: string;
  createdAt: string;
}

export interface Material {
  id: string;
  name: string;
  type: string;
  quantity: number;
  unit: string;
  journey: JourneyStep[];
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  recoveryRate: number;
  processingTime: number;
  costPerTon: number;
  qualityScore: number;
  carbonFootprint: number;
  capacity: number;
  reliability: number;
  createdAt: string;
  updatedAt: string;
}

export interface Quote {
  id: string;
  supplierId: string;
  materialType: string;
  quantity: number;
  deliveryDate: string;
  requirements?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

interface SupplyChainState {
  materials: Material[];
  suppliers: Supplier[];
  quotes: Quote[];
  isLoading: boolean;
  error: string | null;
  fetchMaterials: () => Promise<void>;
  fetchSuppliers: () => Promise<void>;
  fetchQuotes: () => Promise<void>;
  addMaterial: (material: Omit<Material, 'id' | 'journey' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateMaterial: (id: string, data: Partial<Material>) => Promise<void>;
  addJourneyStep: (materialId: string, step: Omit<JourneyStep, 'id' | 'materialId' | 'createdAt'>) => Promise<void>;
  updateJourneyStep: (stepId: string, data: Partial<JourneyStep>) => Promise<void>;
  requestQuote: (quote: Omit<Quote, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateQuote: (quoteId: string, data: Partial<Quote>) => Promise<void>;
}

export const useSupplyChainStore = create<SupplyChainState>((set, get) => ({
  materials: [],
  suppliers: [],
  quotes: [],
  isLoading: false,
  error: null,

  fetchMaterials: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: materials, error } = await supabase
        .from('materials')
        .select('*, journey:material_journey(*)');

      if (error) throw error;
      set({ materials });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchSuppliers: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: suppliers, error } = await supabase
        .from('suppliers')
        .select('*');

      if (error) throw error;
      set({ suppliers });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchQuotes: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: quotes, error } = await supabase
        .from('quotes')
        .select('*');

      if (error) throw error;
      set({ quotes });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  addMaterial: async (material) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('materials')
        .insert([material])
        .select()
        .single();

      if (error) throw error;
      set((state) => ({
        materials: [...state.materials, { ...data, journey: [] }],
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  updateMaterial: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('materials')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      set((state) => ({
        materials: state.materials.map((m) =>
          m.id === id ? { ...m, ...data } : m
        ),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  addJourneyStep: async (materialId, step) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('material_journey')
        .insert([{ ...step, material_id: materialId }])
        .select()
        .single();

      if (error) throw error;
      set((state) => ({
        materials: state.materials.map((m) =>
          m.id === materialId
            ? { ...m, journey: [...m.journey, data] }
            : m
        ),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  updateJourneyStep: async (stepId, data) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('material_journey')
        .update(data)
        .eq('id', stepId);

      if (error) throw error;
      set((state) => ({
        materials: state.materials.map((m) => ({
          ...m,
          journey: m.journey.map((j) =>
            j.id === stepId ? { ...j, ...data } : j
          ),
        })),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  requestQuote: async (quote) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('quotes')
        .insert([{ ...quote, status: 'pending' }])
        .select()
        .single();

      if (error) throw error;
      set((state) => ({
        quotes: [...state.quotes, data],
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  updateQuote: async (quoteId, data) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('quotes')
        .update(data)
        .eq('id', quoteId);

      if (error) throw error;
      set((state) => ({
        quotes: state.quotes.map((q) =>
          q.id === quoteId ? { ...q, ...data } : q
        ),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },
})); 