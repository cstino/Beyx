import React from 'react';
import { TrendingUp } from 'lucide-react';

export function PrimaryCTA({ label, onClick }) {
  return (
    <button 
      onClick={onClick} 
      className="w-full py-6 rounded-[28px] bg-gradient-to-r from-[#E94560] via-[#FF5F6D] to-[#FF7E5F] flex items-center justify-center gap-4 shadow-[0_20px_50px_rgba(233,69,96,0.35)] active:scale-95 transition-all border border-white/5"
    >
       <TrendingUp size={24} className="text-white" />
       <span className="text-lg font-black uppercase tracking-[0.1em] text-white underline decoration-white/20 underline-offset-4 decoration-2">{label}</span>
    </button>
  );
}
