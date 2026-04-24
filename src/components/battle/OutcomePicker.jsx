import React from 'react';
import { Zap, Target, Infinity as InfIcon, Wind, MinusCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const WIN_TYPES = [
  { key: 'burst',       label: 'Burst Finish',   points: 2, icon: Zap,     color: '#E94560', desc: 'Esplosione del Bey' },
  { key: 'xtreme',      label: 'Xtreme Finish',  points: 3, icon: Target,  color: '#F5A623', desc: 'Fuoriuscita Xtreme line' },
  { key: 'ko',          label: 'Over Finish',    points: 2, icon: Wind,    color: '#4361EE', desc: 'Fuoriuscita tasche' },
  { key: 'spin_finish', label: 'Spin Finish',    points: 1, icon: InfIcon, color: '#00D68F', desc: 'Rotazione residua' },
];

export function OutcomePicker({ battle, onChange, onNext }) {
  const setWinner = (side) => onChange({ ...battle, winner_side: side });
  const setWinType = (type) => onChange({ ...battle, win_type: type });
  
  const canProceed = battle.winner_side === 'draw' || (battle.winner_side && battle.win_type);

  const p1Label = battle.player1.user_id ? 'TU' : (battle.player1.guest_name || 'P1');
  const p2Label = battle.player2.guest_name || 'AVVERSARIO';

  return (
    <div className="space-y-8">
      {/* Winner selector */}
      <div className="space-y-4">
        <div className="text-white/60 text-sm font-medium text-center italic opacity-50">
          Chi ha vinto il round?
        </div>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setWinner('p1')}
            className={`py-6 rounded-2xl border-2 transition-all font-black text-xs tracking-widest
              ${battle.winner_side === 'p1'
                ? 'bg-[#E94560] border-[#E94560] text-white shadow-glow-primary'
                : 'bg-[#12122A] border-white/5 text-white/40'}`}
          >
            <div className="flex flex-col items-center gap-2">
              <span className="text-lg">🔥</span>
              {p1Label}
            </div>
          </button>

          <button
            onClick={() => setWinner('draw')}
            className={`py-6 rounded-2xl border-2 transition-all font-black text-[10px] tracking-widest
              ${battle.winner_side === 'draw'
                ? 'bg-white/20 border-white/40 text-white'
                : 'bg-[#12122A] border-white/5 text-white/20'}`}
          >
            <div className="flex flex-col items-center gap-2">
              <MinusCircle size={20} />
              PAREGGIO
            </div>
          </button>

          <button
            onClick={() => setWinner('p2')}
            className={`py-6 rounded-2xl border-2 transition-all font-black text-xs tracking-widest
              ${battle.winner_side === 'p2'
                ? 'bg-[#4361EE] border-[#4361EE] text-white shadow-[0_0_20px_rgba(67,97,238,0.3)]'
                : 'bg-[#12122A] border-white/5 text-white/40'}`}
          >
            <div className="flex flex-col items-center gap-2">
              <span className="text-lg">❄️</span>
              {p2Label}
            </div>
          </button>
        </div>
      </div>

      {/* Win type grid */}
      <AnimatePresence>
        {battle.winner_side && battle.winner_side !== 'draw' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="space-y-4"
          >
            <div className="text-white/60 text-sm font-medium text-center italic opacity-50">
              Metodo di vittoria
            </div>
            <div className="grid grid-cols-2 gap-3">
              {WIN_TYPES.map(wt => {
                const Icon = wt.icon;
                const selected = battle.win_type === wt.key;
                return (
                  <button
                    key={wt.key}
                    onClick={() => setWinType(wt.key)}
                    className={`p-4 rounded-2xl border-2 transition-all text-left relative overflow-hidden
                      ${selected ? '' : 'border-white/5 bg-[#12122A] opacity-60 hover:opacity-100'}`}
                    style={selected ? {
                      background: `${wt.color}15`,
                      borderColor: wt.color,
                      boxShadow: `inset 0 0 20px ${wt.color}10`
                    } : undefined}
                  >
                    <Icon size={22} style={{ color: wt.color }} strokeWidth={2.5} />
                    <div className="text-white font-black text-xs mt-3 tracking-tight">{wt.label}</div>
                    <div className="text-white/30 text-[9px] font-bold uppercase mt-1">+{wt.points} PUNTI</div>
                    
                    {selected && (
                      <motion.div 
                        layoutId="win-active-dot"
                        className="absolute top-3 right-3 w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: wt.color }}
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </motion.div>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={onNext}
        disabled={!canProceed}
        className="w-full py-4 rounded-2xl font-black tracking-[0.1em] text-white transition-all disabled:opacity-30 disabled:grayscale"
        style={{ 
          background: 'linear-gradient(135deg, #E94560, #C9304A)',
          boxShadow: canProceed ? '0 10px 25px -10px rgba(233,69,96,0.6)' : 'none',
        }}
      >
        CONFERMA RISULTATO
      </button>
    </div>
  );
}
