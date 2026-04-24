import { create } from 'zustand';

// Simple store to track global UI state, like whether a modal is open
export const useUIStore = create((set) => ({
  modalOpen: false,
  setModalOpen: (open) => set({ modalOpen: open }),
}));
