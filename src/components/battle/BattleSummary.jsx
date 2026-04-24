import React from 'react';
import { ShieldCheck, Trophy, Info } from 'lucide-react';
import { motion } from 'framer-motion';

export function BattleSummary({ battle, onSave }) {
  const p1Label = battle.player1.user_id ? 'TU' : (battle.player1.guest_name || 'P1');
  const p2Label = battle.player2.guest_name || 'AVVERSARIO';

  return (
    <div className="space-y-8">
      <div className="text-white/60 text-sm font-medium text-center italic opacity-50">
        Pronto a pubblicare il risultato?
      </div>

      <div className="relative p-6 rounded-3xl bg-[#12122A] border border-white/5 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />

        <div className="flex items-center justify-between relative z-10">
          {/* Player 1 */}
          <div className="text-center w-24">
            <div className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center font-black text-xl mb-2
              ${battle.winner_side === 'p1' ? 'bg-primary text-white shadow-glow-primary' : 'bg-white/5 text-white/20'}`}>
              P1
            </div>
            <div className="text-[10px] font-black text-white/60 truncate uppercase tracking-tighter">
              {p1Label}
            </div>
          </div>

          {/* VS & Result */}
          <div className="flex flex-col items-center">
            <div className="text-white font-black text-3xl italic tracking-tighter mb-1 select-none opacity-10">VS</div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-primary tracking-[0.2em] uppercase mb-1">Risultato</span>
              <div className="text-white font-black text-xl uppercase tracking-tight">
                {battle.winner_side === 'draw' ? 'Pareggio' : 
                 battle.winner_side === 'p1' ? 'Vittoria P1' : 'Vittoria P2'}
              </div>
            </div>
          </div>

          {/* Player 2 */}
          <div className="text-center w-24">
            <div className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center font-black text-xl mb-2
              ${battle.winner_side === 'p2' ? 'bg-[#4361EE] text-white shadow-[0_0_20px_rgba(67,97,238,0.3)]' : 'bg-white/5 text-white/20'}`}>
              P2
            </div>
            <div className="text-[10px] font-black text-white/60 truncate uppercase tracking-tighter">
              {p2Label}
            </div>
          </div>
        </div>

        {/* Win details */}
        {battle.winner_side !== 'draw' && (
          <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-around text-center">
            <div>
              <div className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-1">Win Type</div>
              <div className="text-white font-black text-xs uppercase tracking-widest">{battle.win_type?.replace('_', ' ')}</div>
            </div>
            <div>
              <div className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-1">XP Bonus</div>
              <div className="text-primary font-black text-xs uppercase tracking-widest">+30 XP</div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/10">
          <Info size={18} className="text-primary flex-shrink-0 mt-0.5" />
          <p className="text-white/40 text-[10px] leading-relaxed font-bold uppercase tracking-wide">
            Registrando questa battaglia guadagnerai punti esperienza e sbloccherai achievement. I dati verranno salvati nel tuo storico competitivo.
          </p>
        </div>

        <button
          onClick={onSave}
          className="w-full py-5 rounded-2xl font-black tracking-[0.2em] text-white transition-all shadow-xl flex items-center justify-center gap-3"
          style={{ background: 'linear-gradient(135deg, #E94560, #C9304A)' }}
        >
          <Trophy size={20} strokeWidth={3} />
          PUBBLICA RISULTATO
        </button>
      </div>
    </div>
  );
}
