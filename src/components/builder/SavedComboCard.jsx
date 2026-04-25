import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

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

export function SavedComboCard({ combo, onClick }) {
  if (!combo) return null;
  
  const accentColor = TYPE_COLORS[combo.combo_type] ?? '#4361EE';
  const typeLabel = TYPE_LABELS[combo.combo_type] ?? 'COMBO';

  // Compose the full name
  const composedName = [
    combo.blade?.name,
    combo.ratchet?.name,
    combo.bit?.name,
  ].filter(Boolean).join(' ');

  return (
    <motion.button
      onClick={() => onClick(combo)}
      whileTap={{ scale: 0.98 }}
      className="w-full bg-[#12122A] rounded-[24px] overflow-hidden border border-white/5
        hover:border-white/15 transition-all text-left group shadow-lg"
      style={{ borderLeft: `6px solid ${accentColor}` }}
    >
      {/* Top row: badge + name */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
            <span
            className="text-[8px] font-black tracking-[0.2em] px-2 py-0.5 rounded-full"
            style={{
                color: accentColor,
                background: `${accentColor}15`,
                border: `1px solid ${accentColor}30`,
            }}
            >
            {typeLabel}
            </span>
            <div className="text-white font-black text-lg tracking-tighter truncate uppercase italic">
            {composedName || combo.name}
            </div>
        </div>
        <ChevronRight size={18} className="text-white/20 group-hover:text-white/50 transition-colors" strokeWidth={3} />
      </div>

      {/* Visual Parts Grid (with Images!) */}
      <div className="px-5 pb-5 grid grid-cols-3 gap-3">
        <VisualChip label="BLADE"   img={combo.blade?.image_url}   />
        <VisualChip label="RATCHET" img={combo.ratchet?.image_url} />
        <VisualChip label="BIT"     img={combo.bit?.image_url}     />
      </div>

      {/* Score bar */}
      {combo.overall_score != null && (
        <div className="px-5 py-2.5 bg-white/[0.03] border-t border-white/5 flex items-center justify-between">
             <div className="flex-1 h-1 bg-white/5 rounded-full mr-4 max-w-[100px] overflow-hidden">
                <div 
                    className="h-full rounded-full" 
                    style={{ 
                        width: `${(combo.overall_score / 10) * 100}%`,
                        background: accentColor 
                    }} 
                />
             </div>
             <div className="text-white font-black text-sm tabular-nums" style={{ color: accentColor }}>
                {combo.overall_score.toFixed(1)} <span className="text-[10px] opacity-40 ml-0.5 whitespace-nowrap uppercase tracking-widest font-black">Score</span>
             </div>
        </div>
      )}
    </motion.button>
  );
}

function VisualChip({ label, img }) {
  return (
    <div className="bg-[#0A0A1A] rounded-2xl p-2 border border-white/5 flex flex-col items-center gap-1.5 aspect-square justify-center shadow-inner">
      <div className="text-[7px] text-white/30 font-black tracking-[0.2em] uppercase">
        {label}
      </div>
      <div className="w-10 h-10 flex items-center justify-center">
        {img ? (
            <img src={img} alt={label} className="w-full h-full object-contain drop-shadow-glow" />
        ) : (
            <div className="w-4 h-4 rounded-full bg-white/5" />
        )}
      </div>
    </div>
  );
}
