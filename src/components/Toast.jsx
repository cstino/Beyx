import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useToastStore } from '../store/useToastStore';

export function ToastContainer() {
  const { toasts, remove } = useToastStore();

  return (
    <div className="fixed top-24 left-0 right-0 z-[100] px-6 pointer-events-none flex flex-col gap-3">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className="pointer-events-auto w-full max-w-sm mx-auto"
          >
            <ToastItem toast={toast} onRemove={() => remove(toast.id)} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onRemove }) {
  const config = {
    success: {
      bg: 'from-[#10B981] to-[#059669]',
      icon: CheckCircle2,
      shadow: 'shadow-[#10B981]/20',
      label: 'Successo'
    },
    error: {
      bg: 'from-[#EF4444] to-[#DC2626]',
      icon: AlertCircle,
      shadow: 'shadow-[#EF4444]/20',
      label: 'Errore'
    },
    info: {
      bg: 'from-[#3B82F6] to-[#2563EB]',
      icon: Info,
      shadow: 'shadow-[#3B82F6]/20',
      label: 'Info'
    }
  };

  const { bg, icon: Icon, shadow, label } = config[toast.type] || config.info;

  // Safari Mobile fix styles
  const safariFix = {
    WebkitMaskImage: '-webkit-radial-gradient(white, black)',
    transform: 'translateZ(0)',
  };

  return (
    <div 
      className={`relative overflow-hidden rounded-[20px] p-[1px] bg-gradient-to-br ${bg} ${shadow} shadow-xl`}
      style={safariFix}
    >
      <div className="bg-[#0A0A1A] rounded-[19px] p-4 flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${bg} flex items-center justify-center text-white flex-shrink-0`}>
           <Icon size={20} strokeWidth={2.5} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-0.5">{label}</div>
          <p className="text-white text-xs font-bold leading-tight">{toast.message}</p>
        </div>

        <button 
          onClick={onRemove}
          className="w-8 h-8 rounded-full hover:bg-white/5 flex items-center justify-center text-white/20 transition-colors"
        >
          <X size={16} />
        </button>

        {/* Progress Bar Background */}
        <motion.div 
           initial={{ width: '100%' }}
           animate={{ width: '0%' }}
           transition={{ duration: 4, ease: 'linear' }}
           className="absolute bottom-0 left-0 h-[2px] bg-white/20"
        />
      </div>
    </div>
  );
}
