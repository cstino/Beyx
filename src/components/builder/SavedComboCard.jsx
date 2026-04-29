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

export function SavedComboCard({ combo, onClick, onDelete }) {
  if (!combo) return null;
  
  const stats = combo.user_stats || {};
  const currentType = determineType(stats, combo.combo_type);
  const accentColor = TYPE_COLORS[currentType] ?? '#4361EE';
  const typeLabel = TYPE_LABELS[currentType] ?? 'COMBO';

  const composedName = [
    combo.blade?.name,
    combo.ratchet?.name,
    combo.bit?.name,
  ].filter(Boolean).join(' ');

  return (
    <motion.div 
      className="relative group"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
       <motion.button
         onClick={() => onClick(combo)}
         whileTap={{ scale: 0.98 }}
         className="w-full bg-[#12122A] rounded-[32px] overflow-hidden border border-white/5
           hover:border-white/10 transition-all text-left shadow-xl p-5"
         style={{ borderTop: `4px solid ${accentColor}` }}
       >
         {/* Top: Name & Info */}
         <div className="flex items-start justify-between mb-4">
           <div className="flex-1 min-w-0 pr-8">
             <div className="flex items-center gap-2 mb-1.5">
               <span
                 className="text-[7px] font-black tracking-[0.2em] px-2 py-0.5 rounded-md uppercase"
                 style={{
                   color: accentColor,
                   background: `${accentColor}15`,
                   border: `1px solid ${accentColor}30`,
                 }}
               >
                 {typeLabel}
               </span>
               {combo.user_rating && (
                   <div className="flex items-center gap-1 px-2 py-0.5 bg-[#F5A623]/10 border border-[#F5A623]/20 rounded-md">
                       <Star size={8} className="text-[#F5A623] fill-[#F5A623]" />
                       <span className="text-[8px] font-black text-[#F5A623]">{combo.user_rating}</span>
                   </div>
               )}
               <div className="flex items-center gap-1 px-2 py-0.5 bg-white/5 border border-white/10 rounded-md">
                  <Trophy size={8} className="text-white/40" />
                  <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Stats Ready</span>
               </div>
             </div>
             <h3 className="text-white font-black text-sm tracking-tight leading-tight uppercase italic font-createfuture truncate">
               {composedName || combo.name}
             </h3>
           </div>
         </div>

         {/* Center Content: Large Blade + Vertical Parts */}
         <div className="flex items-stretch gap-4 h-48">
           {/* Left: Large Blade */}
           <div className="flex-[0.7] bg-gradient-to-br from-white/5 to-transparent rounded-2xl border border-white/5 flex items-center justify-center p-5 relative overflow-hidden group-hover:from-white/10 transition-all">
             <div className="absolute inset-0 bg-primary/5 blur-2xl rounded-full scale-75" />
             <img 
               src={combo.blade?.image_url} 
               alt="blade" 
               className="w-full h-full object-contain relative z-10 drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover:rotate-12 group-hover:scale-105" 
             />
           </div>

           {/* Right: Vertical Ratchet & Bit (Stretched to match height) */}
           <div className="flex-[0.3] flex flex-col gap-3">
             <div className="flex-1 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-center p-3 group-hover:bg-white/10 transition-all">
               <img src={combo.ratchet?.image_url} alt="ratchet" className="w-2/3 h-2/3 object-contain drop-shadow-md" />
             </div>
             <div className="flex-1 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-center p-3 group-hover:bg-white/10 transition-all">
               <img src={combo.bit?.image_url} alt="bit" className="w-2/3 h-2/3 object-contain drop-shadow-md" />
             </div>
           </div>
         </div>

       </motion.button>

       {/* Floating Delete Action */}
       <button 
         onClick={(e) => {
           e.stopPropagation();
           onDelete(combo);
         }}
         className="absolute right-4 top-4 w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 active:scale-90 transition-all opacity-40 hover:opacity-100 hover:bg-red-500 hover:text-white shadow-lg"
       >
         <Trash2 size={14} />
       </button>
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
  
  // Weights (if values are closer than 10%, it's Balance)
  const max = Math.max(attack || 0, defense || 0, stamina || 0);
  
  if (max < 40) return 'balance';
  
  if (attack === max) return 'attack';
  if (defense === max) return 'defense';
  if (stamina === max) return 'stamina';
  
  return 'balance';
}
