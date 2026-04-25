import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Star } from 'lucide-react';

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
  
  // Determine dynamic type based on user stats or base stats
  const stats = combo.user_stats || {};
  const currentType = determineType(stats, combo.combo_type);
  const accentColor = TYPE_COLORS[currentType] ?? '#4361EE';
  const typeLabel = TYPE_LABELS[currentType] ?? 'COMBO';

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
      className="w-full bg-[#12122A] rounded-[22px] overflow-hidden border border-white/5
        hover:border-white/15 transition-all text-left group shadow-lg"
      style={{ borderLeft: `5px solid ${accentColor}` }}
    >
      <div className="flex items-center">
        {/* Left: Metadata & Name */}
        <div className="flex-1 px-4 py-3 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="text-[7px] font-black tracking-[0.2em] px-2 py-0.5 rounded-md"
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
          </div>
          <div className="text-white font-black text-base tracking-tighter truncate uppercase italic">
            {composedName || combo.name}
          </div>
        </div>

        {/* Right: Compact Parts Icons */}
        <div className="flex items-center gap-1.5 px-4">
            <CompactChip img={combo.blade?.image_url} />
            <CompactChip img={combo.ratchet?.image_url} />
            <CompactChip img={combo.bit?.image_url} />
            <ChevronRight size={16} className="text-white/10 group-hover:text-white/30 ml-1 transition-colors" />
        </div>
      </div>
    </motion.button>
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
