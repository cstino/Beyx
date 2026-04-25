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
  attack:  'ATT',
  defense: 'DEF',
  stamina: 'STA',
  balance: 'BAL',
};

export function SavedComboCard({ combo, onClick }) {
  const accentColor = TYPE_COLORS[combo.combo_type] ?? '#4361EE';
  const typeLabel = TYPE_LABELS[combo.combo_type] ?? '???';

  // Compose the full name from selected parts
  const composedName = [
    combo.blade?.name,
    combo.ratchet?.name,
    combo.bit?.name,
  ].filter(Boolean).join(' ');

  return (
    <motion.button
      onClick={() => onClick(combo)}
      whileTap={{ scale: 0.98 }}
      className="w-full bg-[#12122A] rounded-2xl overflow-hidden border border-white/5
        hover:border-white/15 transition-all text-left group"
      style={{ borderLeft: `4px solid ${accentColor}` }}
    >
      {/* Top row: type badge + name + chevron */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-2">
        <span
          className="text-[9px] font-extrabold tracking-[0.15em] px-2 py-0.5 rounded-md"
          style={{
            color: accentColor,
            background: `${accentColor}15`,
            border: `1px solid ${accentColor}30`,
          }}
        >
          {typeLabel}
        </span>
        <div className="text-white font-black text-lg flex-1 truncate uppercase tracking-tight italic">
          {composedName || combo.name}
        </div>
        <ChevronRight size={18} className="text-white/20 group-hover:text-white/50 transition-colors" strokeWidth={3} />
      </div>

      {/* Part chips row */}
      <div className="px-4 pb-4 flex gap-2">
        <PartChip label="BLADE"   value={combo.blade?.name}   />
        <PartChip label="RATCHET" value={combo.ratchet?.name} />
        <PartChip label="BIT"     value={combo.bit?.name}     />
      </div>

      {/* Score footer */}
      {combo.overall_score != null && (
        <div className="px-4 py-2.5 bg-white/[0.02] border-t border-white/5
          flex items-center justify-between">
          <div className="text-[9px] text-white/40 font-black tracking-[0.2em] uppercase">
            Performance Score
          </div>
          <div className="text-white font-black text-base tabular-nums"
            style={{ 
               color: accentColor,
               textShadow: `0 0 10px ${accentColor}40`
            }}>
            {combo.overall_score.toFixed(1)}
          </div>
        </div>
      )}
    </motion.button>
  );
}

function PartChip({ label, value }) {
  return (
    <div className="flex-1 bg-[#0A0A1A] rounded-xl px-2.5 py-2.5 border border-white/5 shadow-inner">
      <div className="text-[8px] text-white/30 font-black tracking-[0.2em] mb-1">
        {label}
      </div>
      <div className="text-white text-[11px] font-bold truncate tracking-tight">
        {value || '—'}
      </div>
    </div>
  );
}
