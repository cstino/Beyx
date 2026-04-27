import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Swords } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PlayerPicker } from '../../components/battle/PlayerPicker';
import { ComboPicker } from '../../components/battle/ComboPicker';
import { OutcomePicker } from '../../components/battle/OutcomePicker';
import { BattleSummary } from '../../components/battle/BattleSummary';
import { OfficialToggle } from '../../components/battle/OfficialToggle';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/useAuthStore';

const STEPS = ['players', 'combos', 'outcome', 'confirm'];

export default function New1v1Page() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [step, setStep] = useState(0);
  const [battle, setBattle] = useState({
    player1: { user_id: user?.id, guest_name: null, combo_id: null },
    player2: { user_id: null, guest_name: null, combo_id: null },
    winner_side: null,     // 'p1' | 'p2' | 'draw'
    win_type: null,        // 'burst' | 'ko' | 'spin_finish' | 'xtreme'
    is_official: false,
    notes: '',
  });

  const next = () => setStep(s => Math.min(STEPS.length - 1, s + 1));
  const prev = () => (step === 0 ? navigate(-1) : setStep(s => s - 1));

  async function handleSave() {
    const points = computePoints(battle.win_type);
    const { error } = await supabase.from('battles').insert({
      format:              '1v1',
      player1_user_id:     battle.player1.user_id,
      player1_guest_name:  battle.player1.guest_name,
      player1_combo_id:    battle.player1.combo_id,
      player2_user_id:     battle.player2.user_id,
      player2_guest_name:  battle.player2.guest_name,
      player2_combo_id:    battle.player2.combo_id,
      winner_side:         battle.winner_side,
      win_type:            battle.win_type,
      points_p1:           battle.winner_side === 'p1' ? points : 0,
      points_p2:           battle.winner_side === 'p2' ? points : 0,
      is_official:         battle.is_official,
      notes:               battle.notes,
      created_by:          user?.id,
    });

    if (error) {
      console.error('Error saving battle:', error);
      alert('Errore durante il salvataggio. Riprova.');
      return;
    }
    navigate('/battle');
  }

  function computePoints(winType) {
    switch (winType) {
      case 'burst':       return 2;
      case 'ko':          return 2;
      case 'xtreme':      return 3;
      case 'spin_finish': return 1;
      default:            return 0;
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A1A] pb-24 flex flex-col">
      {/* Header with back + step indicator */}
      <div className="px-6 pt-8 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={prev} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 border border-white/5 active:scale-90 transition-all">
            <ChevronLeft size={22} />
          </button>
          <div>
            <div className="text-[10px] font-black text-primary tracking-[0.2em] uppercase">
              Step {step + 1} / {STEPS.length}
            </div>
            <div className="text-white font-black text-xl uppercase tracking-tight">
              {['Avversario', 'Scegli Combo', 'Risultato', 'Riepilogo'][step]}
            </div>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
          <Swords size={20} />
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-6 mb-8">
        <div className="h-1 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #4361EE, #E94560)' }}
            animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            transition={{ duration: 0.5, ease: "circOut" }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="px-6 flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "circOut" }}
          >
            {step === 0 && (
              <div className="space-y-6">
                <PlayerPicker
                  battle={battle}
                  onChange={setBattle}
                  onNext={next}
                />
                
                <OfficialToggle 
                  isOfficial={battle.is_official}
                  canBeOfficial={battle.player1.user_id && battle.player2.user_id}
                  reason={!(battle.player1.user_id && battle.player2.user_id) ? "Entrambi i player devono essere registrati per match ufficiali" : ""}
                  onChange={(val) => setBattle(prev => ({ ...prev, is_official: val }))}
                />
              </div>
            )}
            {step === 1 && (
              <ComboPicker
                battle={battle}
                onChange={setBattle}
                onNext={next}
              />
            )}
            {step === 2 && (
              <OutcomePicker
                battle={battle}
                onChange={setBattle}
                onNext={next}
              />
            )}
            {step === 3 && (
              <BattleSummary
                battle={battle}
                onSave={handleSave}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
