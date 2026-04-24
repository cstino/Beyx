import React, { useState, useEffect } from 'react';
import { Package, Plus, Check, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

export function DeckSelector({ onConfirm }) {
  const [decks, setDecks] = useState([]);
  const [combos, setCombos] = useState([]);
  const [selectedMyDeck, setSelectedMyDeck] = useState(null);
  const [selectedOppDeck, setSelectedOppDeck] = useState(null); // Optional for guests
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: d } = await supabase.from('decks').select('*');
    const { data: c } = await supabase.from('combos').select('id, name, combo_type');
    setDecks(d ?? []);
    setCombos(c ?? []);
    setLoading(false);
  }

  const canProceed = selectedMyDeck !== null;

  return (
    <div className="space-y-6">
      <div className="text-white/60 text-sm font-medium">
        Seleziona il tuo Deck per il 3v3
      </div>

      <div className="grid grid-cols-1 gap-3">
        {decks.map(deck => {
          const isSelected = selectedMyDeck?.id === deck.id;
          return (
            <button
              key={deck.id}
              onClick={() => setSelectedMyDeck(isSelected ? null : deck)}
              className={`p-5 rounded-3xl border-2 transition-all text-left relative overflow-hidden
                ${isSelected ? 'bg-primary/10 border-primary shadow-glow-primary' : 'bg-[#12122A] border-white/5 opacity-60 hover:opacity-100'}`}
            >
              <div className="text-white font-black text-sm uppercase tracking-widest mb-3">{deck.name}</div>
              <div className="flex gap-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <Package size={14} className="text-white/20" />
                  </div>
                ))}
              </div>
              {isSelected && (
                <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check size={14} strokeWidth={4} />
                </div>
              )}
            </button>
          );
        })}

        <button className="p-5 rounded-3xl border-2 border-dashed border-white/5 flex flex-col items-center justify-center gap-2 opacity-30 hover:opacity-50 transition-opacity">
          <Plus size={24} />
          <span className="text-[10px] font-black uppercase tracking-widest">Crea Nuovo Deck</span>
        </button>
      </div>

      <div className="pt-8">
        <button
          onClick={() => onConfirm(selectedMyDeck, null)}
          disabled={!canProceed}
          className="w-full py-5 rounded-2xl font-black text-[11px] tracking-[0.2em] text-white disabled:opacity-50 shadow-xl uppercase"
          style={{ background: 'linear-gradient(135deg, #E94560, #C9304A)' }}
        >
          Vai all'Arena 3v3
        </button>
      </div>
    </div>
  );
}
