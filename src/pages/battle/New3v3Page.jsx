import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DeckSelector } from '../../components/battle/DeckSelector';
import { Match3v3Tracker } from '../../components/battle/Match3v3Tracker';
import { OfficialToggle } from '../../components/battle/OfficialToggle';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/useAuthStore';

export default function New3v3Page() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stage, setStage] = useState('decks'); // 'decks' | 'playing' | 'done'
  const [myDeck, setMyDeck] = useState(null);
  const [oppDeck, setOppDeck] = useState(null);
  const [isOfficial, setIsOfficial] = useState(false);

  async function handleMatchComplete(results) {
    const tournamentId = crypto.randomUUID(); // Mock tournament link for group
    
    // Save all battles in the match
    const battlesToSave = results.map(res => ({
      format:              '3v3',
      player1_user_id:     user?.id,
      player2_user_id:     oppDeck?.user_id,
      player2_guest_name:  oppDeck ? null : 'Avversario',
      winner_side:         res.winner_side,
      win_type:            res.win_type,
      points_p1:           res.winner_side === 'p1' ? res.points : 0,
      points_p2:           res.winner_side === 'p2' ? res.points : 0,
      is_official:         isOfficial,
      created_by:          user?.id,
    }));

    const { error } = await supabase.from('battles').insert(battlesToSave);
    
    if (error) {
      console.error('Error saving 3v3 battles:', error);
    }
    
    setStage('done');
  }

  const prev = () => {
    if (stage === 'decks') navigate(-1);
    else if (stage === 'playing') setStage('decks');
  };

  return (
    <div className="min-h-screen bg-[#0A0A1A] pb-32 flex flex-col">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={prev} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 border border-white/5 active:scale-90 transition-all">
            <ChevronLeft size={22} />
          </button>
          <div>
            <div className="text-[10px] font-black text-[#4361EE] tracking-[0.2em] uppercase">
              {stage === 'decks' ? 'Configurazione' : 'In Corso'}
            </div>
            <div className="text-white font-black text-xl uppercase tracking-tight italic">
              Sfida Team 3v3
            </div>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-[#4361EE]/10 flex items-center justify-center text-[#4361EE] border border-[#4361EE]/20">
          <Users size={20} />
        </div>
      </div>

      <div className="px-6- flex-1 px-6">
        {stage === 'decks' && (
          <div className="space-y-8">
            <DeckSelector
              onConfirm={(my, opp) => {
                setMyDeck(my);
                setOppDeck(opp);
                setStage('playing');
              }}
            />
            <OfficialToggle 
              isOfficial={isOfficial}
              canBeOfficial={user?.id && oppDeck?.user_id}
              reason={!(user?.id && oppDeck?.user_id) ? "Seleziona deck associati a utenti registrati per match ufficiali" : ""}
              onChange={setIsOfficial}
            />
          </div>
        )}
        
        {stage === 'playing' && (
          <Match3v3Tracker
            myDeck={myDeck}
            oppDeck={oppDeck}
            onComplete={handleMatchComplete}
          />
        )}

        {stage === 'done' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="text-[#00D68F] font-black text-xs tracking-widest uppercase mb-4">Salvataggio Completato</div>
            <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-8 leading-none">
              Match Registrato <br/> con Successo
            </h1>
            <button 
              onClick={() => navigate('/battle')}
              className="px-8 py-4 rounded-2xl bg-white/5 text-white font-black text-[10px] tracking-widest uppercase border border-white/10"
            >
              Torna alla Battle Arena
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
