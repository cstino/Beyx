import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Trophy, Shield, Info, Check, Plus, X } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useToastStore } from '../../store/useToastStore';

export default function TournamentJoinPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const setHeader = useUIStore(s => s.setHeader);
  const clearHeader = useUIStore(s => s.clearHeader);
  
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [existingReg, setExistingReg] = useState(null);

  // Data for selection
  const [blades, setBlades] = useState([]);
  const [ratchets, setRatchets] = useState([]);
  const [bits, setBits] = useState([]);

  // Selection state
  const [deck, setDeck] = useState([]); // [{ blade_id, is_stock, ratchet_id, bit_id }]
  const [selectedDeckId, setSelectedDeckId] = useState(null);
  const [myCombos, setMyCombos] = useState([]);
  const [myDecks, setMyDecks] = useState([]);
  const [activeSlot, setActiveSlot] = useState(null);

  useEffect(() => {
    setHeader('TORNEO', '/battle');
    return () => clearHeader();
  }, []);

  useEffect(() => {
    fetchTournament();
    fetchParts();
    if (user) {
      fetchSaved();
      checkExistingRegistration();
    }
  }, [id, user]);

  async function checkExistingRegistration() {
    const { data } = await supabase
      .from('tournament_registrations')
      .select('*')
      .eq('tournament_id', id)
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (data) {
      setExistingReg(data);
      // Solo se il deck è già presente consideriamo l'iscrizione "completata"
      if (data.deck_config) {
        setDone(true);
      }
    }
  }

  async function fetchTournament() {
    const { data } = await supabase.from('tournaments').select('*').eq('id', id).single();
    setTournament(data);
    if (data) {
      const count = data.battle_type === '3v3' ? 3 : 1;
      setDeck(Array(count).fill({ blade_id: '', is_stock: true, ratchet_id: '', bit_id: '' }));
    }
    setLoading(false);
  }

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
      .eq('user_id', user.id);
    setMyCombos(combos || []);

    const { data: decks } = await supabase
      .from('decks')
      .select(`*, 
        combo1:combo1_id(*, blade:blade_id(*), ratchet:ratchet_id(*), bit:bit_id(*)),
        combo2:combo2_id(*, blade:blade_id(*), ratchet:ratchet_id(*), bit:bit_id(*)),
        combo3:combo3_id(*, blade:blade_id(*), ratchet:ratchet_id(*), bit:bit_id(*))`)
      .eq('user_id', user.id);
    setMyDecks(decks || []);
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
  };

  const applySavedDeck = (savedDeck) => {
    setSelectedDeckId(savedDeck.id);
    const newDeck = [];
    if (savedDeck.combo1) newDeck.push({ blade_id: savedDeck.combo1.blade_id, is_stock: savedDeck.combo1.is_stock ?? false, ratchet_id: savedDeck.combo1.ratchet_id || '', bit_id: savedDeck.combo1.bit_id || '' });
    if (savedDeck.combo2) newDeck.push({ blade_id: savedDeck.combo2.blade_id, is_stock: savedDeck.combo2.is_stock ?? false, ratchet_id: savedDeck.combo2.ratchet_id || '', bit_id: savedDeck.combo2.bit_id || '' });
    if (savedDeck.combo3) newDeck.push({ blade_id: savedDeck.combo3.blade_id, is_stock: savedDeck.combo3.is_stock ?? false, ratchet_id: savedDeck.combo3.ratchet_id || '', bit_id: savedDeck.combo3.bit_id || '' });
    
    // Fill remaining if needed
    const targetCount = tournament?.battle_type === '3v3' ? 3 : 1;
    while (newDeck.length < targetCount) {
      newDeck.push({ blade_id: '', is_stock: true, ratchet_id: '', bit_id: '' });
    }
    setDeck(newDeck.slice(0, targetCount));
  };

  const updateBey = (index, field, value) => {
    setSelectedDeckId(null); // Reset saved deck selection if manual edit occurs
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
  };

  async function handleSubmit() {
    if (!user) return;
    setSubmitting(true);
    
    const { error } = await supabase.from('tournament_registrations').upsert({
      ...(existingReg ? { id: existingReg.id } : {}),
      tournament_id: id,
      user_id: user.id,
      deck_id: selectedDeckId,
      deck_config: { beys: deck },
      status: (tournament?.registration_mode === 'manual') ? 'approved' : 'pending'
    });

    setSubmitting(false);
    if (error) {
      console.error("Registration Error:", error);
      useToastStore.getState().error("Errore durante l'invio: " + error.message);
    } else {
      useToastStore.getState().success("Iscrizione confermata!");
      setDone(true);
    }
  }

  if (loading) return <div className="min-h-screen bg-[#0A0A1A] flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  if (done) {
    const isApproved = existingReg?.status === 'approved';
    const isRejected = existingReg?.status === 'rejected';

    return (
      <div className="min-h-screen bg-[#0A0A1A] flex flex-col items-center justify-center p-6 text-center">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 
          ${isApproved ? 'bg-green-500/20 text-green-500' : isRejected ? 'bg-red-500/20 text-red-500' : 'bg-primary/20 text-primary'}`}>
          {isApproved ? <Trophy size={40} /> : isRejected ? <X size={40} /> : <Check size={40} />}
        </div>
        <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter">
          {isApproved ? 'Sei nel Tabellone!' : isRejected ? 'Candidatura Rifiutata' : 'Richiesta Inviata!'}
        </h1>
        <p className="text-white/40 mt-4 text-sm font-medium">
          {isApproved ? 'Preparati alla battaglia. Il torneo inizierà a breve.' : 
           isRejected ? 'Purtroppo non sei stato ammesso a questo torneo.' : 
           "L'admin del torneo sta revisionando la tua iscrizione.\nTi verrà comunicato se sarai ammesso al tabellone."}
        </p>
        <button onClick={() => navigate('/battle')} className="mt-10 px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-white uppercase tracking-[0.2em]">Torna all'Arena</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A1A] pb-32 pt-4">
      {/* Tournament Info Header */}
      <div className="px-6 mb-6">
          <div className="text-[10px] font-black text-primary tracking-[0.2em] uppercase mb-1">Registrazione</div>
          <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">{tournament?.name}</h1>
      </div>

      <div className="px-6 space-y-8">
        <div className="p-5 rounded-3xl bg-primary/5 border border-primary/20 flex items-start gap-4">
           <Info className="text-primary mt-0.5 shrink-0" size={18} />
           <p className="text-xs text-white/60 font-medium leading-relaxed">{tournament?.description || 'Nessuna descrizione particolare fornita.'}</p>
        </div>

        <div className="space-y-6">
           <h3 className="text-[11px] font-black text-white/40 tracking-widest uppercase pl-1">Il Tuo Deck ({tournament?.battle_type})</h3>
           
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
                        className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${bey.is_stock ? 'bg-primary text-white' : 'text-white/20'}`}
                      >Stock</button>
                      <button 
                        onClick={() => updateBey(i, 'is_stock', false)}
                        className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${!bey.is_stock ? 'bg-[#4361EE] text-white' : 'text-white/20'}`}
                      >Custom</button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Blade</label>
                    
                    <div className="space-y-2">
                       <div className="relative">
                          <button 
                            onClick={() => {
                              const el = document.getElementById(`dropdown-${i}`);
                              el.classList.toggle('hidden');
                            }}
                            className="w-full h-16 bg-white/5 rounded-2xl px-5 flex items-center justify-between border border-white/5 hover:border-white/20 transition-all outline-none"
                          >
                             <div className="flex items-center gap-3">
                                {bey.blade_id ? (
                                  <>
                                    <img 
                                      src={blades.find(b => b.id === bey.blade_id)?.image_url} 
                                      className="w-10 h-10 object-contain drop-shadow-glow" 
                                      alt="blade"
                                    />
                                    <span className="text-white font-black uppercase text-sm truncate">
                                      {blades.find(b => b.id === bey.blade_id)?.name}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-white/20 font-black uppercase text-sm italic">Seleziona Blade...</span>
                                )}
                             </div>
                             <Plus size={16} className="text-white/20" />
                          </button>

                          <div 
                            id={`dropdown-${i}`}
                            className="hidden absolute top-full left-0 right-0 mt-2 bg-[#12122A] border border-white/10 rounded-3xl shadow-2xl z-50 max-h-[300px] overflow-y-auto no-scrollbar backdrop-blur-3xl"
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
                                     <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center p-2">
                                        <img src={b.image_url} className="w-full h-full object-contain" alt={b.name} />
                                     </div>
                                     <div>
                                        <div className="text-xs font-black text-white uppercase italic">{b.name}</div>
                                        <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{b.type}</div>
                                     </div>
                                  </div>
                                  {bey.blade_id === b.id && <Check size={16} className="text-primary" />}
                               </button>
                             ))}
                          </div>
                       </div>
                    </div>
                  </div>

                  {!bey.is_stock && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="grid grid-cols-2 gap-3">
                       <div className="space-y-1.5">
                         <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Ratchet</label>
                         <select 
                           value={bey.ratchet_id}
                           onChange={(e) => updateBey(i, 'ratchet_id', e.target.value)}
                           className="w-full h-12 bg-white/5 rounded-2xl px-3 text-white font-bold uppercase text-[11px] border border-white/5 outline-none"
                         >
                           <option value="">Ratchet...</option>
                           {ratchets.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                         </select>
                       </div>
                       <div className="space-y-1.5">
                         <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Bit</label>
                         <select 
                           value={bey.bit_id}
                           onChange={(e) => updateBey(i, 'bit_id', e.target.value)}
                           className="w-full h-12 bg-white/5 rounded-2xl px-3 text-white font-bold uppercase text-[11px] border border-white/5 outline-none"
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

        {/* Combo Selection Modal/Overlay */}
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
                  <button onClick={() => setActiveSlot(null)} className="p-2 text-white/40">Chiudi</button>
                </div>
                
                <div className="space-y-3">
                  {myCombos.length === 0 ? (
                    <div className="py-12 text-center text-white/20 font-bold uppercase text-xs border-2 border-dashed border-white/5 rounded-3xl">
                      Nessuna combo salvata nel Builder
                    </div>
                  ) : myCombos.map(c => (
                    <button 
                      key={c.id} 
                      onClick={() => {
                        applySavedCombo(activeSlot, c);
                        setActiveSlot(null);
                      }}
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

        <button 
          onClick={handleSubmit}
          disabled={submitting || deck.some(b => !b.blade_id)}
          className="w-full py-5 bg-primary rounded-[22px] text-white font-black uppercase text-[11px] tracking-[0.3em] shadow-glow-primary disabled:opacity-20 flex items-center justify-center gap-3"
        >
          {submitting ? 'Invio in corso...' : 'Invia Candidatura'}
        </button>
      </div>
    </div>
  );
}
