import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Check } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/useAuthStore';

export function DeckPicker({ match, onChange, onStart }) {
  const userId = useAuthStore(s => s.user?.id);
  const [myDecks, setMyDecks] = useState([]);
  const [oppDecks, setOppDecks] = useState([]);
  const [activeSide, setActiveSide] = useState('p1');
  const [showCreateCombo, setShowCreateCombo] = useState(false);

  useEffect(() => {
    // Fetch my saved decks (combos grouped as decks)
    supabase.from('decks')
      .select(`*, combo1:combo1_id(id, name, blade:blade_id(name), ratchet:ratchet_id(name), bit:bit_id(name)),
                   combo2:combo2_id(id, name, blade:blade_id(name), ratchet:ratchet_id(name), bit:bit_id(name)),
                   combo3:combo3_id(id, name, blade:blade_id(name), ratchet:ratchet_id(name), bit:bit_id(name))`)
      .eq('user_id', userId)
      .then(({ data }) => setMyDecks(data ?? []));

    // Fetch opponent's decks if registered user
    if (match.player2.user_id) {
      supabase.from('decks')
        .select(`*, combo1:combo1_id(id, name, blade:blade_id(name), ratchet:ratchet_id(name), bit:bit_id(name)),
                     combo2:combo2_id(id, name, blade:blade_id(name), ratchet:ratchet_id(name), bit:bit_id(name)),
                     combo3:combo3_id(id, name, blade:blade_id(name), ratchet:ratchet_id(name), bit:bit_id(name))`)
        .eq('user_id', match.player2.user_id)
        .then(({ data }) => setOppDecks(data ?? []));
    }
  }, [userId, match.player2.user_id]);

  const decks = activeSide === 'p1' ? myDecks : oppDecks;
  const selectedId = activeSide === 'p1' ? match.p1_deck_id : match.p2_deck_id;

  function selectDeck(deckId) {
    const key = activeSide === 'p1' ? 'p1_deck_id' : 'p2_deck_id';
    onChange({ ...match, [key]: deckId });
  }

  // For 1v1, show single combo selection instead of full deck
  const is1v1 = match.format === '1v1';

  return (
    <div>
      <div className="text-white/60 text-sm mb-4">
        {is1v1
          ? 'Seleziona la combo per ogni giocatore (opzionale)'
          : 'Seleziona il deck per ogni giocatore'}
      </div>

      {/* Side toggle */}
      <div className="flex gap-2 mb-4 p-1 bg-[#12122A] rounded-xl">
        <button
          onClick={() => setActiveSide('p1')}
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors
            ${activeSide === 'p1' ? 'bg-[#E94560] text-white' : 'text-white/50'}`}
        >
          TU
        </button>
        <button
          onClick={() => setActiveSide('p2')}
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors
            ${activeSide === 'p2' ? 'bg-[#4361EE] text-white' : 'text-white/50'}`}
        >
          AVVERSARIO
        </button>
      </div>

      {/* Deck list */}
      <div className="space-y-2 mb-4">
        {decks.map(deck => {
          const selected = selectedId === deck.id;
          return (
            <button
              key={deck.id}
              onClick={() => selectDeck(deck.id)}
              className={`w-full p-3 rounded-xl border text-left transition-colors
                ${selected
                  ? 'bg-white/5 border-[#E94560]/50'
                  : 'bg-[#12122A] border-white/5 hover:border-white/15'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-white font-bold text-sm">{deck.name}</div>
                {selected && <Check size={16} className="text-[#E94560]" />}
              </div>
              <div className="flex gap-2">
                {[deck.combo1, deck.combo2, deck.combo3].map((c, i) => c && (
                  <div key={i} className="flex-1 bg-[#0A0A1A] rounded-lg px-2 py-1.5">
                    <div className="text-[8px] text-white/40 font-bold tracking-wider">
                      COMBO {i + 1}
                    </div>
                    <div className="text-white text-[10px] font-bold truncate">
                      {[c.blade?.name, c.ratchet?.name, c.bit?.name].filter(Boolean).join(' ')}
                    </div>
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Create new / skip */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <button
          onClick={() => setShowCreateCombo(true)}
          className="py-3 rounded-xl bg-white/5 border border-white/10 text-white/70
            text-xs font-bold flex items-center justify-center gap-2"
        >
          <Plus size={14} />
          CREA NUOVA
        </button>
        <button
          onClick={() => {
            if (activeSide === 'p1') setActiveSide('p2');
          }}
          className="py-3 rounded-xl bg-white/5 border border-white/10 text-white/50
            text-xs font-bold"
        >
          SKIP
        </button>
      </div>

      {/* Start match button */}
      <motion.button
        onClick={onStart}
        whileTap={{ scale: 0.97 }}
        className="w-full py-4 rounded-xl font-bold tracking-wider text-white
          flex items-center justify-center gap-2"
        style={{
          background: 'linear-gradient(135deg, #E94560, #C9304A)',
          boxShadow: '0 4px 20px -4px rgba(233,69,96,0.5)',
        }}
      >
        INIZIA MATCH
      </motion.button>
    </div>
  );
}
