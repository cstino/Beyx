import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, Target, Star, Check, Heart, ChevronRight } from 'lucide-react';
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

export default function PartCard({ part, owned = false, wishlisted = false, onClick, className }) {
  const [variantIdx, setVariantIdx] = React.useState(0);
  
  // Combine main image with variants
  const allVariants = React.useMemo(() => {
    const base = { image_url: part.image_url, release_code: part.release_code, isBase: true };
    const others = (part.variants || []).map(v => ({ ...v, isBase: false }));
    return [base, ...others];
  }, [part]);

  const currentVariant = allVariants[variantIdx] || allVariants[0];
  const { name, type, tier, kind } = part;
  const image_url = currentVariant.image_url;

  const handleNext = (e) => {
    e.stopPropagation();
    setVariantIdx((prev) => (prev + 1) % allVariants.length);
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    setVariantIdx((prev) => (prev - 1 + allVariants.length) % allVariants.length);
  };

  const handleDragEnd = (e, { offset, velocity }) => {
    if (allVariants.length <= 1) return;
    
    const swipeThreshold = 50;
    const velocityThreshold = 500;
    
    if (Math.abs(offset.x) > swipeThreshold || Math.abs(velocity.x) > velocityThreshold) {
      if (offset.x > 0) {
        handlePrev(e);
      } else {
        handleNext(e);
      }
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick({ ...part, image_url: currentVariant.image_url, release_code: currentVariant.release_code })}
      className={cn(
        "glass-card p-4 flex flex-col gap-3 cursor-pointer relative group transition-all duration-300 overflow-hidden",
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

      {/* Part Image Section */}
      <div className="aspect-square w-full flex items-center justify-center p-2 bg-transparent relative touch-pan-y">
        {allVariants.length > 1 && (
          <>
            <button 
              onClick={handlePrev}
              className="absolute left-0 z-30 p-1.5 bg-black/40 hover:bg-black/60 rounded-full text-white/70 hover:text-white transition-all opacity-0 group-hover:opacity-100 hidden md:flex"
            >
              <ChevronRight className="rotate-180" size={14} />
            </button>
            <button 
              onClick={handleNext}
              className="absolute right-0 z-30 p-1.5 bg-black/40 hover:bg-black/60 rounded-full text-white/70 hover:text-white transition-all opacity-0 group-hover:opacity-100 hidden md:flex"
            >
              <ChevronRight size={14} />
            </button>
            
            {/* Variant Dots */}
            <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-1.5 z-30">
              {allVariants.map((_, i) => (
                <motion.div 
                  key={i} 
                  animate={{ 
                    width: i === variantIdx ? 12 : 4,
                    backgroundColor: i === variantIdx ? '#4361EE' : 'rgba(255,255,255,0.2)'
                  }}
                  className="h-1 rounded-full" 
                />
              ))}
            </div>
          </>
        )}

        <motion.div
          key={image_url}
          drag={allVariants.length > 1 ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
        >
          <PartImage 
            src={image_url} 
            name={name} 
            type={kind} 
            className="w-full h-full object-contain pointer-events-none drop-shadow-[0_10px_15px_rgba(0,0,0,0.4)]"
          />
        </motion.div>
      </div>

      <div className="flex flex-col">
        <div className={cn("flex items-center gap-1.5 mb-1.5", (!wishlisted || owned) ? "invisible" : "")}>
          <Heart size={10} className="text-[#4361EE] fill-[#4361EE]" />
          <span className="text-[8px] font-black uppercase text-[#4361EE] tracking-widest">Wishlist</span>
        </div>
        <h3 className="text-sm uppercase font-black tracking-tight leading-tight group-hover:text-primary transition-colors truncate">{name}</h3>
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
          {currentVariant.release_code || 'PROMO'}
        </span>
      </div>


      {owned && (
        <div className="absolute top-2 left-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(34,197,94,0.4)] border border-green-400/50 z-20">
          <Check size={12} className="text-white" strokeWidth={4} />
        </div>
      )}
    </motion.div>
  );
}
