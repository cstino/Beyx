import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export function ComboPicker({ battle, onChange, onNext }) {
  const [myCombos, setMyCombos] = useState([]);
  const [oppCombos, setOppCombos] = useState([]);
  const [activeSide, setActiveSide] = useState('p1');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCombos();
  }, [battle.player1.user_id, battle.player2.user_id]);

  async function fetchCombos() {
    setLoading(true);
    // My combos
    const { data: mine } = await supabase.from('combos').select('id, name, combo_type, overall_score')
      .eq('user_id', battle.player1.user_id);
    setMyCombos(mine ?? []);

    // Opponent's combos (only if they're a registered user)
    if (battle.player2.user_id) {
      const { data: opp } = await supabase.from('combos').select('id, name, combo_type, overall_score')
        .eq('user_id', battle.player2.user_id);
      setOppCombos(opp ?? []);
    }
    setLoading(false);
  }

  const combos = activeSide === 'p1' ? myCombos : oppCombos;
  const selectedId = activeSide === 'p1'
    ? battle.player1.combo_id
    : battle.player2.combo_id;

  function select(comboId) {
    const key = activeSide === 'p1' ? 'player1' : 'player2';
    onChange({
      ...battle,
      [key]: { ...battle[key], combo_id: comboId },
    });
  }

  return (
    <div className="space-y-6">
      <div className="text-white/60 text-sm font-medium">
        Quali Beyblade state usando?
      </div>

      {/* Side toggle */}
      <div className="flex gap-2 p-1 bg-white/5 rounded-2xl">
        <button
          onClick={() => setActiveSide('p1')}
          className={`flex-1 py-3 rounded-xl text-xs font-black tracking-widest transition-all
            ${activeSide === 'p1' ? 'bg-[#E94560] text-white shadow-glow-primary' : 'text-white/30'}`}
        >
          TU
        </button>
        <button
          onClick={() => setActiveSide('p2')}
          className={`flex-1 py-3 rounded-xl text-xs font-black tracking-widest transition-all
            ${activeSide === 'p2' ? 'bg-[#4361EE] text-white shadow-[0_0_20px_rgba(67,97,238,0.3)]' : 'text-white/30'}`}
        >
          {battle.player2.user_id ? 'AVVERSARIO' : 'OSPITE'}
        </button>
      </div>

      <div className="space-y-2 max-h-[350px] overflow-y-auto no-scrollbar pr-2">
        {loading ? (
          <div className="py-10 text-center text-white/20 text-xs font-bold uppercase tracking-widest animate-pulse">Caricamento combo...</div>
        ) : combos.length === 0 ? (
          <div className="py-12 border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center opacity-30">
            <span className="text-[10px] font-black uppercase tracking-widest">Nessun combo trovato</span>
          </div>
        ) : (
          combos.map(c => {
            const selected = selectedId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => select(c.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all
                  ${selected
                    ? `bg-white/5 ${activeSide === 'p1' ? 'border-[#E94560]/50' : 'border-[#4361EE]/50'}`
                    : 'bg-[#12122A] border-white/5 hover:border-white/15'}`}
              >
                <div className="flex-1 text-left">
                  <div className="text-white font-black text-sm tracking-tight uppercase">{c.name}</div>
                  <div className="text-white/30 text-[9px] font-bold uppercase tracking-[0.1em] mt-1">
                    {c.combo_type} · Score {c.overall_score}
                  </div>
                </div>
                {selected && (
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 ${activeSide === 'p1' ? 'bg-[#E94560] border-[#E94560]' : 'bg-[#4361EE] border-[#4361EE]'}`}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4">
        <button
          onClick={onNext}
          className="py-4 rounded-2xl font-black text-[10px] tracking-[0.2em] text-white/40 bg-white/5 border border-white/5 hover:border-white/10 uppercase"
        >
          Skip
        </button>
        <button
          onClick={onNext}
          className="py-4 rounded-2xl font-black text-[10px] tracking-[0.2em] text-white uppercase shadow-lg"
          style={{ background: 'linear-gradient(135deg, #E94560, #C9304A)' }}
        >
          Continua
        </button>
      </div>
    </div>
  );
}
