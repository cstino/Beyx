import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Trophy, Shield, Info, Check, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function TournamentJoinPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Data for selection
  const [blades, setBlades] = useState([]);
  const [ratchets, setRatchets] = useState([]);
  const [bits, setBits] = useState([]);

  // Selection state
  const [deck, setDeck] = useState([]); // [{ blade_id, is_stock, ratchet_id, bit_id }]

  useEffect(() => {
    fetchTournament();
    fetchParts();
  }, [id]);

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
  };

  async function handleSubmit() {
    if (!user) return;
    setSubmitting(true);
    
    const { error } = await supabase.from('tournament_registrations').insert({
      tournament_id: id,
      user_id: user.id,
      deck_config: { beys: deck },
      status: 'pending'
    });

    setSubmitting(false);
    if (!error) setDone(true);
  }

  if (loading) return <div className="min-h-screen bg-[#0A0A1A] flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  if (done) {
    return (
      <div className="min-h-screen bg-[#0A0A1A] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 mb-6">
          <Check size={40} />
        </div>
        <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter">Richiesta Inviata!</h1>
        <p className="text-white/40 mt-4 text-sm font-medium">L'admin del torneo sta revisionando la tua iscrizione.<br/>Ti verrà comunicato se sarai ammesso al tabellone.</p>
        <button onClick={() => navigate('/battle')} className="mt-10 px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-white uppercase tracking-[0.2em]">Torna all'Arena</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A1A] pb-32">
      {/* Header */}
      <div className="px-6 pt-10 pb-6 flex items-center gap-4 sticky top-0 bg-[#0A0A1A]/80 backdrop-blur-xl z-30">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 border border-white/5">
          <ChevronLeft size={22} />
        </button>
        <div>
          <div className="text-[10px] font-black text-primary tracking-[0.2em] uppercase">Registrazione</div>
          <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">{tournament?.name}</h1>
        </div>
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
