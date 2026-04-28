import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, X } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/useAuthStore';

export function DeckPicker({ match, onChange, onStart }) {
  const userId = useAuthStore(s => s.user?.id);
  
  // Data for selection
  const [blades, setBlades] = useState([]);
  const [ratchets, setRatchets] = useState([]);
  const [bits, setBits] = useState([]);
  const [myCombos, setMyCombos] = useState([]);

  // Selection state
  const [deck, setDeck] = useState([]); // [{ blade_id, is_stock, ratchet_id, bit_id }]
  const [activeSlot, setActiveSlot] = useState(null);

  useEffect(() => {
    fetchParts();
    if (userId) {
      fetchSaved();
    }
  }, [userId]);

  useEffect(() => {
    // Initialize deck slots based on format
    const count = match.format === '3v3' ? 3 : 1; 
    setDeck(Array(count).fill({ blade_id: '', is_stock: true, ratchet_id: '', bit_id: '' }));
  }, [match.format]);

  async function fetchParts() {
    const [b, r, t] = await Promise.all([
      supabase.from('blades').select('*').order('name'),
      supabase.from('ratchets').select('*').order('name'),
      supabase.from('bits').select('*').order('name')
    ]);
    setBlades(b.data || []);
    setRatchets(r.data || []);
    setBits(t.data || []);
  }

  async function fetchSaved() {
    const { data: combos } = await supabase
      .from('combos')
      .select('*, blade:blade_id(*), ratchet:ratchet_id(*), bit:bit_id(*)')
      .eq('user_id', userId);
    setMyCombos(combos || []);
  }

  const applySavedCombo = (index, combo) => {
    const newDeck = [...deck];
    newDeck[index] = {
      blade_id: combo.blade_id,
      is_stock: combo.is_stock ?? false,
      ratchet_id: combo.ratchet_id || '',
      bit_id: combo.bit_id || ''
    };
    setDeck(newDeck);
    updateMatch(newDeck);
  };

  const updateBey = (index, field, value) => {
    const newDeck = [...deck];
    let updatedBey = { ...newDeck[index], [field]: value };

    // Auto-fill Ratchet & Bit when switching to Custom or changing Blade in Custom mode
    if ((field === 'is_stock' && value === false) || (field === 'blade_id' && updatedBey.is_stock === false)) {
      const selectedBlade = blades.find(b => b.id === (field === 'blade_id' ? value : updatedBey.blade_id));
      if (selectedBlade) {
        if (selectedBlade.stock_ratchet) {
          const matchR = ratchets.find(r => r.name.toLowerCase() === selectedBlade.stock_ratchet.toLowerCase());
          if (matchR) updatedBey.ratchet_id = matchR.id;
        }
        if (selectedBlade.stock_bit) {
          const matchB = bits.find(b => b.name.toLowerCase() === selectedBlade.stock_bit.toLowerCase());
          if (matchB) updatedBey.bit_id = matchB.id;
        }
      }
    }

    newDeck[index] = updatedBey;
    setDeck(newDeck);
    updateMatch(newDeck);
  };

  function updateMatch(currentDeck) {
    // For simplicity, we store the deck config in p1_deck_id or as a new metadata field if we had one
    // But since NewMatchPage expect a deck_id, we'll keep the current structure but pass the config
    onChange({ ...match, p1_deck_config: { beys: currentDeck } });
  }

  const isInvitation = !!match.player2.user_id;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-[3px] h-3 bg-primary" />
        <div className="text-[10px] font-black text-white/40 tracking-[0.2em] uppercase">
          Il Tuo Bey ({match.format})
        </div>
      </div>

      <div className="space-y-6">
        {deck.map((bey, i) => (
          <div key={i} className="p-6 rounded-[32px] bg-[#12122A] border border-white/5 space-y-5">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-black text-white/20 uppercase tracking-widest">Beyblade {i+1}</div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setActiveSlot(i)}
                  className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-[8px] font-black text-primary uppercase tracking-wider"
                >
                  Usa Salvata
                </button>
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                  <button 
                    onClick={() => updateBey(i, 'is_stock', true)}
                    className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${bey.is_stock ? 'bg-primary text-white shadow-glow-primary-sm' : 'text-white/20'}`}
                  >Stock</button>
                  <button 
                    onClick={() => updateBey(i, 'is_stock', false)}
                    className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${!bey.is_stock ? 'bg-[#4361EE] text-white shadow-glow-blue-sm' : 'text-white/20'}`}
                  >Custom</button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Blade Picker */}
              <div className="relative">
                <button 
                  onClick={() => {
                    const el = document.getElementById(`dropdown-${i}`);
                    el.classList.toggle('hidden');
                  }}
                  className="w-full h-16 bg-white/5 rounded-2xl px-5 flex items-center justify-between border border-white/5 hover:border-white/20 transition-all"
                >
                  <div className="flex items-center gap-3">
                    {bey.blade_id ? (
                      <>
                        <img 
                          src={blades.find(b => b.id === bey.blade_id)?.image_url} 
                          className="w-10 h-10 object-contain drop-shadow-lg" 
                          alt="" 
                        />
                        <span className="text-white font-black uppercase text-xs truncate">
                          {blades.find(b => b.id === bey.blade_id)?.name}
                        </span>
                      </>
                    ) : (
                      <span className="text-white/20 font-black uppercase text-xs italic">Seleziona Blade...</span>
                    )}
                  </div>
                  <Plus size={14} className="text-white/20" />
                </button>

                <div 
                  id={`dropdown-${i}`}
                  className="hidden absolute top-full left-0 right-0 mt-2 bg-[#12122A] border border-white/10 rounded-3xl shadow-2xl z-50 max-h-[250px] overflow-y-auto no-scrollbar backdrop-blur-3xl"
                >
                  {blades.map(b => (
                    <button
                      key={b.id}
                      onClick={() => {
                        updateBey(i, 'blade_id', b.id);
                        document.getElementById(`dropdown-${i}`).classList.add('hidden');
                      }}
                      className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-all text-left border-b border-white/[0.02] last:border-0"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center p-2">
                          <img src={b.image_url} className="w-full h-full object-contain" alt="" />
                        </div>
                        <div className="text-xs font-black text-white uppercase italic">{b.name}</div>
                      </div>
                      {bey.blade_id === b.id && <Check size={14} className="text-primary" />}
                    </button>
                  ))}
                </div>
              </div>

              {!bey.is_stock && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-white/30 uppercase tracking-widest ml-1">Ratchet</label>
                    <select 
                      value={bey.ratchet_id}
                      onChange={(e) => updateBey(i, 'ratchet_id', e.target.value)}
                      className="w-full h-12 bg-white/5 rounded-xl px-3 text-white font-bold uppercase text-[10px] border border-white/5 outline-none"
                    >
                      <option value="">Ratchet...</option>
                      {ratchets.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-white/30 uppercase tracking-widest ml-1">Bit</label>
                    <select 
                      value={bey.bit_id}
                      onChange={(e) => updateBey(i, 'bit_id', e.target.value)}
                      className="w-full h-12 bg-white/5 rounded-xl px-3 text-white font-bold uppercase text-[10px] border border-white/5 outline-none"
                    >
                      <option value="">Bit...</option>
                      {bits.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4">
        <motion.button
          onClick={onStart}
          disabled={deck.some(b => !b.blade_id)}
          whileTap={{ scale: 0.97 }}
          className={`w-full py-5 rounded-[24px] font-black uppercase tracking-[0.2em] text-sm text-white transition-all shadow-xl disabled:opacity-30
            ${isInvitation ? 'bg-primary shadow-glow-primary' : 'bg-gradient-to-r from-primary to-[#4361EE]'}`}
        >
          {isInvitation ? 'Invia Sfida' : 'Inizia Match'}
        </motion.button>
      </div>

      {/* Saved Combos Modal */}
      <AnimatePresence>
        {activeSlot !== null && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setActiveSlot(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="fixed bottom-0 left-0 right-0 bg-[#0A0A1A] border-t border-white/10 rounded-t-[32px] z-[101] p-6 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">Le Tue Combo</h2>
                <button onClick={() => setActiveSlot(null)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40"><X size={20} /></button>
              </div>
              
              <div className="space-y-3">
                {myCombos.length === 0 ? (
                  <div className="py-12 text-center text-white/20 font-bold uppercase text-xs border-2 border-dashed border-white/5 rounded-3xl">
                    Nessuna combo salvata nel Builder
                  </div>
                ) : myCombos.map(c => (
                  <button 
                    key={c.id} 
                    onClick={() => { applySavedCombo(activeSlot, c); setActiveSlot(null); }}
                    className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-left hover:bg-primary/5 hover:border-primary/20 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <img src={c.blade?.image_url} className="w-12 h-12 object-contain" alt="" />
                      <div>
                        <div className="text-sm font-black text-white uppercase italic">{c.name || c.blade?.name}</div>
                        <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{c.ratchet?.name} {c.bit?.name}</div>
                      </div>
                    </div>
                    <Plus size={20} className="text-primary" />
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
