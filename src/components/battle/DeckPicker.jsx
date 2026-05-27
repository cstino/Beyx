import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, X } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/useAuthStore';

export function DeckPicker({ match, onChange, onStart, isPlayer2 = false }) {
  const userId = useAuthStore(s => s.user?.id);
  
  // Data for selection
  const [blades, setBlades] = useState([]);
  const [ratchets, setRatchets] = useState([]);
  const [bits, setBits] = useState([]);
  const [myCombos, setMyCombos] = useState([]);

  // Selection state
  const [deck, setDeck] = useState([]); // [{ blade_id, is_stock, ratchet_id, bit_id }]
  const [activeSlot, setActiveSlot] = useState(null);
  const [openDropdownSlot, setOpenDropdownSlot] = useState(null);
  const [bladeSearch, setBladeSearch] = useState('');

  useEffect(() => {
    fetchParts();
    if (userId) {
      fetchSaved();
    }
  }, [userId]);

  useEffect(() => {
    // Initialize deck slots based on extended roster format
    const starters = match.starter_beys_count || (match.format?.includes('3v3') ? 3 : 1);
    const reserves = match.reserve_beys_count || 0;
    const totalCount = starters + reserves;
    setDeck(Array(totalCount).fill({ blade_id: '', is_stock: true, ratchet_id: '', bit_id: '' }));
  }, [match.format, match.starter_beys_count, match.reserve_beys_count]);

  async function fetchParts() {
    const [b, r, t] = await Promise.all([
      supabase.from('blades').select('*').order('name'),
      supabase.from('ratchets').select('*').order('name'),
      supabase.from('bits').select('*').order('name')
    ]);
    const resolvedBlades = (b.data || []).map(blade => {
      if (blade.active_variant_index != null && Array.isArray(blade.variants) && blade.variants[blade.active_variant_index]?.image_url) {
        return { ...blade, image_url: blade.variants[blade.active_variant_index].image_url };
      }
      return blade;
    });
    setBlades(resolvedBlades);
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
      id: combo.id,
      blade_id: combo.blade_id,
      is_stock: combo.is_stock ?? false,
      ratchet_id: combo.ratchet_id || '',
      bit_id: combo.bit_id || '',
      override_image_url: combo.override_image_url
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
    const configField = isPlayer2 ? 'p2_deck_config' : 'p1_deck_config';
    onChange({ ...match, [configField]: { beys: currentDeck } });
  }

  const isInvitation = !!match.player2.user_id;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-[3px] h-3 bg-primary" />
        <div className="text-[10px] font-black text-white/40 tracking-[0.2em] uppercase">
          Il Tuo Roster ({match.format})
        </div>
      </div>

      <div className="space-y-6">
        {deck.map((bey, i) => {
          const isReserve = i >= (match.starter_beys_count || (match.format?.includes('3v3') ? 3 : 1));
          return (
          <div key={i} style={{ zIndex: 50 - i }} className={`p-6 rounded-[32px] bg-[#12122A] border space-y-5 relative ${isReserve ? 'border-[#4361EE]/20' : 'border-white/5'}`}>
            {isReserve && <div className="absolute top-0 right-0 left-0 h-1 bg-[#4361EE]/20 rounded-t-[32px]" />}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="text-[10px] font-black text-white/40 uppercase tracking-widest">Beyblade {i+1}</div>
                {isReserve && (
                  <span className="text-[8px] font-black text-[#4361EE] bg-[#4361EE]/10 px-2 py-0.5 rounded-md border border-[#4361EE]/20 uppercase">
                    Riserva
                  </span>
                )}
              </div>
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
                <div 
                  onClick={() => {
                    if (openDropdownSlot !== i) {
                      setOpenDropdownSlot(i);
                      setBladeSearch('');
                    }
                  }}
                  className="w-full h-16 bg-white/5 rounded-2xl px-5 flex items-center justify-between border border-white/5 hover:border-white/20 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 w-full mr-2">
                    {bey.blade_id && openDropdownSlot !== i ? (
                      <>
                        <img 
                          src={bey.override_image_url || blades.find(b => b.id === bey.blade_id)?.image_url} 
                          className="w-10 h-10 object-contain drop-shadow-lg shrink-0" 
                          alt="" 
                        />
                        <span className="text-white font-black uppercase text-xs truncate">
                          {blades.find(b => b.id === bey.blade_id)?.name}
                        </span>
                      </>
                    ) : openDropdownSlot === i ? (
                      <input
                        type="text"
                        autoFocus
                        value={bladeSearch}
                        onChange={(e) => setBladeSearch(e.target.value)}
                        placeholder="Cerca blade..."
                        className="bg-transparent text-white font-black uppercase text-xs w-full outline-none placeholder-white/20"
                      />
                    ) : (
                      <span className="text-white/20 font-black uppercase text-xs italic">Seleziona Blade...</span>
                    )}
                  </div>
                  {openDropdownSlot === i ? (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenDropdownSlot(null);
                      }}
                      className="text-white/40 hover:text-white p-1"
                    >
                      <X size={14} />
                    </button>
                  ) : (
                    <Plus size={14} className="text-white/20 shrink-0" />
                  )}
                </div>

                {openDropdownSlot === i && (
                  <>
                    <div 
                      onClick={() => setOpenDropdownSlot(null)} 
                      className="fixed inset-0 z-40"
                    />
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#12122A] border border-white/10 rounded-3xl shadow-2xl z-50 max-h-[250px] overflow-y-auto no-scrollbar backdrop-blur-3xl">
                      {blades
                        .filter(b => b.name.toLowerCase().includes(bladeSearch.toLowerCase()))
                        .map(b => (
                          <button
                            key={b.id}
                            onClick={() => {
                              updateBey(i, 'blade_id', b.id);
                              setOpenDropdownSlot(null);
                            }}
                            className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-all text-left border-b border-white/[0.02] last:border-0"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center p-2 shrink-0">
                                <img src={b.image_url} className="w-full h-full object-contain" alt="" />
                              </div>
                              <div className="text-xs font-black text-white uppercase italic">{b.name}</div>
                            </div>
                            {bey.blade_id === b.id && <Check size={14} className="text-primary shrink-0" />}
                          </button>
                        ))}
                      {blades.filter(b => b.name.toLowerCase().includes(bladeSearch.toLowerCase())).length === 0 && (
                        <div className="p-4 text-center text-xs font-bold text-white/20 uppercase">
                          Nessuna blade trovata
                        </div>
                      )}
                    </div>
                  </>
                )}
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
          );
        })}
      </div>

      <div className="pt-4">
        <motion.button
          onClick={onStart}
          disabled={deck.some(b => !b.blade_id)}
          whileTap={{ scale: 0.97 }}
          className={`w-full py-5 rounded-[24px] font-black uppercase tracking-[0.2em] text-sm text-white transition-all shadow-xl disabled:opacity-30
            ${isInvitation ? 'bg-primary shadow-glow-primary' : 'bg-gradient-to-r from-primary to-[#4361EE]'}`}
        >
          {isPlayer2 ? 'Inizia Battaglia' : isInvitation ? 'Invia Sfida' : 'Inizia Match'}
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
                      <img src={c.override_image_url || c.blade?.image_url} className="w-12 h-12 object-contain" alt="" />
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
