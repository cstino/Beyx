import React from 'react';
import { motion } from 'framer-motion';

export function StatCard({ label, value, total, subtitle, accentColor, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className="bg-[#11112B] border border-white/5 rounded-[22px] p-5 flex flex-col items-start relative overflow-hidden group w-full text-left transition-colors hover:bg-[#16163A]"
    >
      {/* Visual Accent Line */}
      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: accentColor }} />
      
      <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.1em] mb-1">{label}</span>
      
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-black tracking-tighter text-white leading-none">{value}</span>
        {total && (
          <span className="text-[11px] font-bold text-white/20 tracking-tighter">/{total}</span>
        )}
      </div>
      
      <span className="text-[9px] font-black text-white/30 uppercase tracking-tighter mt-2">{subtitle}</span>
      
      {/* Subtle Glow Overlay */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none" 
        style={{ background: `linear-gradient(45deg, ${accentColor}, transparent)` }}
      />
    </motion.button>
  );
}
