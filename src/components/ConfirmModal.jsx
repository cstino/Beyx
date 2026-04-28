import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

export function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Sei sicuro?", 
  message = "Questa azione non può essere annullata.",
  confirmLabel = "Conferma",
  cancelLabel = "Annulla",
  variant = "danger" // "danger" | "primary"
}) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#0A0A1A]/90 backdrop-blur-md"
        />
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-sm bg-[#12122A] rounded-[32px] border border-white/10 shadow-2xl overflow-hidden p-8 text-center"
        >
          {/* Icon */}
          <div className={`w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center border
            ${variant === 'danger' 
              ? 'bg-red-500/10 border-red-500/20 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.1)]' 
              : 'bg-primary/10 border-primary/20 text-primary shadow-[0_0_20px_rgba(67,97,238,0.1)]'
            }`}
          >
            <AlertTriangle size={32} />
          </div>

          <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-2">
            {title}
          </h3>
          <p className="text-sm font-medium text-white/40 leading-relaxed mb-10">
            {message}
          </p>

          <div className="flex flex-col gap-3">
            <button 
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95
                ${variant === 'danger' ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-primary text-white shadow-primary/20'}
              `}
            >
              {confirmLabel}
            </button>
            <button 
              onClick={onClose}
              className="w-full py-4 bg-white/5 text-white/40 text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl border border-white/5 hover:bg-white/10 transition-all"
            >
              {cancelLabel}
            </button>
          </div>

          {/* Close button top right */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/20 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
