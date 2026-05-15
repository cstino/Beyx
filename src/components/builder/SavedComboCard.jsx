import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Star, Trash2, Trophy } from 'lucide-react';

const TYPE_COLORS = {
  attack:  '#E94560',
  defense: '#4361EE',
  stamina: '#F5A623',
  balance: '#A855F7',
};

const TYPE_LABELS = {
  attack:  'ATTACK',
  defense: 'DEFENSE',
  stamina: 'STAMINA',
  balance: 'BALANCE',
};

export function SavedComboCard({ combo, onClick, onDelete, hideActions, compactLayout }) {
  if (!combo) return null;
  
  const stats = combo.user_stats || {};
  const currentType = determineType(stats, combo.combo_type);
  const accentColor = TYPE_COLORS[currentType] ?? '#4361EE';
  const typeLabel = TYPE_LABELS[currentType] ?? 'COMBO';

  return (
    <motion.div 
      className="relative h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
       <motion.button
         onClick={() => onClick(combo)}
         whileTap={{ scale: 0.97 }}
         className={`w-full h-full bg-gradient-to-b from-[#1A1A3A] to-[#12122A] rounded-[32px] overflow-hidden border border-white/10 hover:border-white/20 transition-all text-left shadow-2xl flex flex-col relative group`}
       >
         {/* Top Glow Accent */}
         <div 
           className="absolute top-0 left-0 right-0 h-1" 
           style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }}
         />

         {/* Card Header: Type & Rating */}
         <div className="p-3 pb-0 flex items-center justify-between relative z-10">
           <div className="flex items-center gap-1.5">
             <div 
               className="px-2 py-0.5 rounded-full text-[7px] font-black tracking-widest border"
               style={{ 
                 color: accentColor, 
                 background: `${accentColor}10`, 
                 borderColor: `${accentColor}30` 
               }}
             >
               {typeLabel}
             </div>
             {combo.user_rating && (
               <div className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-[7px] font-black text-yellow-500">
                 <Star size={7} className="fill-yellow-500" />
                 <span>{combo.user_rating}</span>
               </div>
             )}
           </div>

           {!hideActions && onDelete && (
             <motion.button 
               whileHover={{ scale: 1.1, backgroundColor: '#EF4444' }}
               whileTap={{ scale: 0.9 }}
               onClick={(e) => {
                 e.stopPropagation();
                 onDelete(combo);
               }}
               className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
             >
               <Trash2 size={10} />
             </motion.button>
           )}
         </div>

         {/* Content Body */}
         <div className="p-3 flex flex-col flex-1">
           {/* Combo Name */}
           <div className="mb-3 overflow-hidden">
             <h3 className="text-[13px] font-black text-white italic tracking-tight uppercase font-createfuture leading-none truncate transition-colors">
               {combo.blade?.name}
             </h3>
             <p className="text-[9px] font-black text-white/30 uppercase tracking-widest leading-none mt-1.5 truncate">
               {combo.ratchet?.name} {combo.bit?.name}
             </p>
           </div>

           {/* Hero Section: Blade with Halo */}
           <div className="relative flex-1 min-h-[110px] flex items-center justify-center mb-3">
             {/* Dynamic Halo */}
             <div 
               className="absolute w-24 h-24 blur-2xl opacity-20 rounded-full transition-opacity group-hover:opacity-40"
               style={{ background: accentColor }}
             />
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_0%,transparent_70%)]" />
             
             <motion.img 
               src={combo.override_image_url || combo.blade?.image_url} 
               alt="blade" 
               className="w-[85%] h-[85%] object-contain relative z-10 drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]"
               whileHover={{ rotate: 10, scale: 1.05 }}
               transition={{ type: 'spring', stiffness: 200 }}
             />
           </div>

           {/* Specs/Parts Column (Vertical Stack for 2-col layout) */}
           <div className="flex flex-col gap-1.5 mt-auto">
             <div className="bg-white/5 rounded-xl p-1.5 border border-white/5 flex items-center gap-2 group-hover:bg-white/10 transition-colors">
               <div className="w-7 h-7 rounded-lg bg-black/40 p-1 flex items-center justify-center border border-white/5 flex-shrink-0">
                 <img src={combo.ratchet?.image_url} className="w-full h-full object-contain" alt="" />
               </div>
               <div className="flex-1 min-w-0">
                 <div className="text-[6px] font-black text-white/30 uppercase tracking-widest leading-none mb-0.5">Ratchet</div>
                 <div className="text-[9px] font-black text-white uppercase truncate leading-none">{combo.ratchet?.name}</div>
               </div>
             </div>
             <div className="bg-white/5 rounded-xl p-1.5 border border-white/5 flex items-center gap-2 group-hover:bg-white/10 transition-colors">
               <div className="w-7 h-7 rounded-lg bg-black/40 p-1 flex items-center justify-center border border-white/5 flex-shrink-0">
                 <img src={combo.bit?.image_url} className="w-full h-full object-contain" alt="" />
               </div>
               <div className="flex-1 min-w-0">
                 <div className="text-[6px] font-black text-white/30 uppercase tracking-widest leading-none mb-0.5">Bit</div>
                 <div className="text-[9px] font-black text-white uppercase truncate leading-none">{combo.bit?.name}</div>
               </div>
             </div>
           </div>
         </div>

       </motion.button>
    </motion.div>
  );
}

function CompactChip({ img }) {
  return (
    <div className="w-10 h-10 bg-[#0A0A1A] rounded-xl border border-white/5 flex items-center justify-center shadow-inner overflow-hidden">
      {img ? (
          <img src={img} alt="part" className="w-7 h-7 object-contain drop-shadow-md" />
      ) : (
          <div className="w-2 h-2 rounded-full bg-white/5" />
      )}
    </div>
  );
}

/**
 * Logic to determine the Bey type based on its highest stat
 */
function determineType(stats, defaultType) {
  if (!stats || Object.keys(stats).length === 0) return defaultType?.toLowerCase() || 'balance';
  
  const { attack, defense, stamina } = stats;
  
  // If stats are completely balanced/default, fallback to original type
  if ((!attack && !defense && !stamina) || (attack === defense && defense === stamina)) {
    return defaultType?.toLowerCase() || 'balance';
  }
  
  const max = Math.max(attack || 0, defense || 0, stamina || 0);
  if (max < 40) return defaultType?.toLowerCase() || 'balance';
  
  // Must be strictly greater to override the official type
  if (attack === max && attack > defense && attack > stamina) return 'attack';
  if (defense === max && defense > attack && defense > stamina) return 'defense';
  if (stamina === max && stamina > attack && stamina > defense) return 'stamina';
  
  return defaultType?.toLowerCase() || 'balance';
}
