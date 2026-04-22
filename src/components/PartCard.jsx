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

export default function PartCard({ part, owned = false, onClick }) {
  const { name, type, tier, stats, image_url } = part;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "glass-card p-4 flex flex-col gap-4 cursor-pointer relative group transition-all duration-300",
        !owned && "opacity-60 grayscale hover:grayscale-0 hover:opacity-100"
      )}
    >
      {/* Tier Badge */}
      <div className={cn(
        "absolute top-3 right-3 w-8 h-8 rounded-full border-2 flex items-center justify-center font-black text-xs bg-background/80 backdrop-blur-md z-20 transition-all group-hover:scale-110",
        tierColors[tier] || tierColors.C
      )}>
        {tier}
      </div>

      {/* Part Image with Placeholder Fallback */}
      <div className="aspect-square w-full">
        <PartImage 
          src={image_url} 
          name={name} 
          type={type} 
        />
      </div>


      <div>
        <h3 className="text-lg uppercase leading-tight">{name}</h3>
        <p className="text-[10px] text-slate-500 uppercase tracking-widest">{type}</p>
      </div>

      {/* Mini Stats Bar */}
      <div className="flex gap-2">
        {Object.entries(stats).map(([key, value]) => (
          <div key={key} className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-1000",
                key === 'attack' ? 'bg-accent' : key === 'defense' ? 'bg-primary' : 'bg-gold'
              )}
              style={{ width: `${(value / 100) * 100}%` }}
            />
          </div>
        ))}
      </div>

      {!owned && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-[2px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="bg-white text-background px-3 py-1 rounded-full text-xs font-bold uppercase tracking-tighter">
            Aggiungi alla Collezione
          </span>
        </div>
      )}
    </motion.div>
  );
}
