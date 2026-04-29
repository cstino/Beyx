import { create } from 'zustand';

// Simple store to track global UI state and navigation context
export const useUIStore = create((set) => ({
  modalOpen: false,
  headerTitle: null,
  backPath: null,
  backAction: null,
  
  setModalOpen: (open) => set({ modalOpen: open }),
  setHeader: (title, back, action = null) => set({ 
    headerTitle: title, 
    backPath: back, 
    backAction: action 
  }),
  clearHeader: () => set({ headerTitle: null, backPath: null, backAction: null }),
}));
