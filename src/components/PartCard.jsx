import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, Target, Star } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import PartImage from './PartImage';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const tierColors = {
  S: 'text-yellow-400 border-yellow-400/50 shadow-[0_0_15px_rgba(250,204,21,0.3)]',
  A: 'text-primary border-primary/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]',
  B: 'text-purple-400 border-purple-500/50',
  C: 'text-slate-400 border-slate-500/50',
};

const archetypeColors = {
  Attack: 'text-[#F43F5E]',
  Defense: 'text-[#3B82F6]',
  Stamina: 'text-[#22C55E]',
  Balance: 'text-[#A855F7]',
};

export default function PartCard({ part, owned = false, onClick, className }) {
  const { name, type, tier, image_url, kind } = part;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "glass-card p-4 flex flex-col gap-3 cursor-pointer relative group transition-all duration-300",
        className
      )}
    >
      {/* Tier Badge */}
      <div className={cn(
        "absolute top-2 right-2 w-7 h-7 rounded-full border flex items-center justify-center font-black text-[10px] bg-background/80 backdrop-blur-md z-20 transition-all group-hover:scale-110",
        tierColors[tier] || tierColors.C
      )}>
        {tier || 'C'}
      </div>

      {/* Part Image */}
      <div className="aspect-square w-full flex items-center justify-center p-2 bg-transparent">
        <PartImage 
          src={image_url} 
          name={name} 
          type={kind} 
          className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
        />
      </div>

      <div>
        <h3 className="text-sm uppercase font-black tracking-tight leading-tight group-hover:text-primary transition-colors">{name}</h3>
        <p className={cn(
          "text-[9px] uppercase tracking-widest font-black mt-1",
          archetypeColors[type] || 'text-slate-500'
        )}>
          {type || kind}
        </p>
      </div>

      {/* Release Code Badge */}
      <div className="absolute bottom-4 right-4 opacity-40 group-hover:opacity-100 transition-opacity">
        <span className="text-[8px] font-black tracking-widest text-slate-400 border border-white/10 px-1.5 py-0.5 rounded uppercase bg-white/5">
          {part.release_code || 'PROMO'}
        </span>
      </div>

      {!owned && (
        <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-white/5 rounded-md border border-white/5">
          <span className="text-[7px] font-black uppercase text-white/30 tracking-tighter">Missing</span>
        </div>
      )}
    </motion.div>
  );
}
