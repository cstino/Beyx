import { create } from 'zustand';

// Simple store to track global UI state and navigation context
export const useUIStore = create((set) => ({
  modalOpen: false,
  headerTitle: null,
  backPath: null,
  
  setModalOpen: (open) => set({ modalOpen: open }),
  setHeader: (title, back) => set({ headerTitle: title, backPath: back }),
  clearHeader: () => set({ headerTitle: null, backPath: null }),
}));
