import { create } from 'zustand';

export const useToastStore = create((set) => ({
  toasts: [],
  
  show: (message, type = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }]
    }));

    // Auto-remove after 4 seconds
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id)
      }));
    }, 4000);
  },

  success: (msg) => useToastStore.getState().show(msg, 'success'),
  error: (msg) => useToastStore.getState().show(msg, 'error'),
  info: (msg) => useToastStore.getState().show(msg, 'info'),
  
  remove: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id)
  })),
}));
