import React from 'react';
import { Shield, Coffee } from 'lucide-react';

export function OfficialToggle({ isOfficial, onChange, canBeOfficial = true, reason = '' }) {
  return (
    <div className="bg-[#12122A] rounded-xl p-3 border border-white/5">
      <div className="text-[10px] font-bold text-white/50 tracking-[0.15em] mb-3">
        TIPO BATTAGLIA
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => canBeOfficial && onChange(true)}
          disabled={!canBeOfficial}
          className={`p-3 rounded-lg border transition-all flex flex-col items-center justify-center
            ${isOfficial && canBeOfficial
              ? 'bg-[#E94560]/15 border-[#E94560]/50 shadow-[0_0_15px_rgba(233,69,96,0.1)]'
              : 'bg-white/5 border-white/10 opacity-60'}
            ${!canBeOfficial ? 'grayscale cursor-not-allowed' : ''}`}
        >
          <Shield size={18}
            className={isOfficial && canBeOfficial ? 'text-[#E94560]' : 'text-white/40'} />
          <div className={`text-[10px] font-black mt-2 tracking-wider
            ${isOfficial && canBeOfficial ? 'text-white' : 'text-white/50'}`}>
            UFFICIALE
          </div>
          <div className="text-[8px] text-white/30 mt-0.5 font-bold">
            VALE PER ELO
          </div>
        </button>

        <button
          onClick={() => onChange(false)}
          className={`p-3 rounded-lg border transition-all flex flex-col items-center justify-center
            ${!isOfficial
              ? 'bg-[#4361EE]/15 border-[#4361EE]/50 shadow-[0_0_15px_rgba(67,97,238,0.1)]'
              : 'bg-white/5 border-white/10 opacity-60'}`}
        >
          <Coffee size={18}
            className={!isOfficial ? 'text-[#4361EE]' : 'text-white/40'} />
          <div className={`text-[10px] font-black mt-2 tracking-wider
            ${!isOfficial ? 'text-white' : 'text-white/50'}`}>
            AMICHEVOLE
          </div>
          <div className="text-[8px] text-white/30 mt-0.5 font-bold">
            SOLO STATS
          </div>
        </button>
      </div>

      {!canBeOfficial && reason && (
        <div className="text-[9px] text-[#F5A623] mt-3 leading-tight font-bold bg-[#F5A623]/5 p-2 rounded-lg border border-[#F5A623]/10">
          ⚠️ {reason}
        </div>
      )}
    </div>
  );
}
