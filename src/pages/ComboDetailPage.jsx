import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Trash2, Gauge, Scale, Edit2, Save, X, Microscope, Swords } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import StatRadar from '../components/StatRadar';
import { PageContainer } from '../components/PageContainer';
import { motion, AnimatePresence } from 'framer-motion';
import PartDetailDrawer from '../components/PartDetailDrawer';

const TYPE_COLORS = {
  attack: '#E94560', defense: '#4361EE',
  stamina: '#F5A623', balance: '#A855F7',
};

export default function ComboDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [combo, setCombo] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editedStats, setEditedStats] = useState({});
  const [editedNotes, setEditedNotes] = useState('');
  const [editedRating, setEditedRating] = useState(5);
  const [saving, setSaving] = useState(false);

  // Part Detail state
  const [selectedPart, setSelectedPart] = useState(null);

  useEffect(() => {
    fetchCombo();
  }, [id]);

  async function fetchCombo() {
    const { data, error } = await supabase.from('combos')
      .select(`
        *,
        blade:blade_id(*),
        ratchet:ratchet_id(*),
        bit:bit_id(*)
      `)
      .eq('id', id)
      .single();
    
    if (error || !data) {
      navigate('/builder?view=saved');
      return;
    }
    setCombo(data);
    setEditedStats(data.user_stats || computeFinalStats(data));
    setEditedNotes(data.notes || '');
    setEditedRating(data.user_rating || 5);
    setLoading(false);
  }

  if (loading || !combo) return (
    <div className="min-h-screen bg-[#0A0A1A] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#E94560] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const accentColor = TYPE_COLORS[combo.combo_type?.toLowerCase()] ?? '#4361EE';
  const baseStats = computeFinalStats(combo);
  const totalWeight = (combo.blade?.weight ?? 0) + (combo.ratchet?.weight ?? 0) + (combo.bit?.weight ?? 0);

  async function handleSaveReview() {
    setSaving(true);
    const { error } = await supabase.from('combos')
      .update({
        user_stats: editedStats,
        notes: editedNotes,
        user_rating: editedRating
      })
      .eq('id', id);

    if (!error) {
      await fetchCombo();
      setIsEditing(false);
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm('Eliminare questo combo?')) return;
    await supabase.from('combos').delete().eq('id', id);
    navigate('/builder?view=saved');
  }

  return (
    <PageContainer className="pt-6 relative pb-20">
      {/* Header */}
      <div className="px-4 mb-8 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-3 rounded-2xl bg-white/5 text-white/50 transition-all active:scale-95">
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1">
            <div className="text-[10px] font-black tracking-[0.3em] uppercase mb-1 flex items-center gap-2" style={{ color: accentColor }}>
                <span className="w-2 h-2 rounded-full" style={{ background: accentColor }} />
                {combo.combo_type || 'Custom'}
            </div>
            <h1 className="text-2xl font-black uppercase text-white tracking-tighter italic truncate">
                {combo.blade?.name} {combo.ratchet?.name}{combo.bit?.name}
            </h1>
        </div>
        <button onClick={() => setIsEditing(true)} className="p-3 rounded-2xl bg-[#4361EE]/10 text-[#4361EE] border border-[#4361EE]/20 active:scale-95">
          <Edit2 size={20} />
        </button>
      </div>

      <div className="px-4 space-y-6">
        {/* 1. APP ANALYSIS SECTION */}
        <section className="bg-[#12122A] rounded-[32px] p-6 border border-white/5 overflow-hidden">
            <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-2">
                  <Microscope size={16} className="text-[#4361EE]" />
                  <span className="text-[10px] font-black text-white/40 tracking-[0.2em] uppercase">Analisi Teorica App</span>
               </div>
               <div className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-black text-white italic">
                  {totalWeight.toFixed(1)}g
               </div>
            </div>
            <div className="flex justify-center mb-6">
               <StatRadar stats={baseStats} color="#4361EE" />
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/5">
                <div className="text-center">
                    <div className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">BASE OVR</div>
                    <div className="text-xl font-black text-white">{(Object.values(baseStats).reduce((a,b)=>a+b,0)/50).toFixed(1)}</div>
                </div>
                <div className="text-center">
                    <div className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">TYPE</div>
                    <div className="text-xl font-black uppercase italic" style={{ color: accentColor }}>{combo.combo_type || '---'}</div>
                </div>
            </div>
        </section>

        {/* 2. USER EVALUATION SECTION */}
        <section className={`rounded-[32px] p-6 border transition-all ${combo.user_stats ? 'bg-[#1A1A3A] border-[#E94560]/20 shadow-2xl' : 'bg-white/[0.02] border-white/5'}`}>
            <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-2">
                  <Swords size={16} className="text-[#E94560]" />
                  <span className="text-[10px] font-black text-white/40 tracking-[0.2em] uppercase">Valutazione sul Campo</span>
               </div>
               {combo.user_rating && (
                  <div className="px-3 py-1 bg-[#E94560] rounded-full text-[11px] font-black text-white">
                     {combo.user_rating} / 10
                  </div>
               )}
            </div>

            {combo.user_stats ? (
                <>
                    <div className="flex justify-center mb-6">
                       <StatRadar stats={combo.user_stats} color="#E94560" />
                    </div>
                    {combo.notes && (
                        <div className="mt-4 p-4 bg-black/20 rounded-2xl border border-white/5">
                           <div className="text-[8px] font-black text-[#E94560] tracking-widest uppercase mb-2">NOTE TATTICHE</div>
                           <p className="text-xs text-white/60 italic leading-relaxed">{combo.notes}</p>
                        </div>
                    )}
                </>
            ) : (
                <div className="py-10 text-center">
                    <button onClick={() => setIsEditing(true)} className="px-6 py-3 rounded-xl bg-white/5 text-[10px] font-black text-white/40 uppercase tracking-widest hover:bg-white/10 transition-all">
                       Inserisci tua analisi
                    </button>
                    <p className="text-[8px] font-black text-white/10 uppercase tracking-widest mt-4">Nessun dato registrato</p>
                </div>
            )}
        </section>

        {/* 3. PARTS BREAKDOWN */}
        <div className="space-y-3 pt-4">
            <h3 className="text-[10px] font-black text-white/20 tracking-[0.3em] uppercase pl-1 mb-4">COMPONENT BREAKDOWN</h3>
            <PartRow label="BLADE" part={combo.blade} onClick={() => setSelectedPart(combo.blade)} />
            <PartRow label="RATCHET" part={combo.ratchet} onClick={() => setSelectedPart(combo.ratchet)} />
            <PartRow label="BIT" part={combo.bit} onClick={() => setSelectedPart(combo.bit)} />
        </div>

        {/* Delete Zone */}
        <div className="px-4 py-12 opacity-30 hover:opacity-100 transition-opacity">
           <button onClick={handleDelete} className="w-full py-4 rounded-2xl border border-white/5 text-xs font-black tracking-widest text-red-500/50 uppercase flex items-center justify-center gap-3">
              <Trash2 size={16} /> ELIMINA CONFIGURAZIONE
           </button>
        </div>
      </div>

      <PartDetailDrawer 
        part={selectedPart}
        onClose={() => setSelectedPart(null)}
      />

      {/* EDIT MODAL OVERLAY */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center px-2">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditing(false)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="relative w-full max-w-lg bg-[#12122A] rounded-t-[40px] border-t border-white/10 p-8 flex flex-col h-[90vh] overflow-y-auto no-scrollbar shadow-2xl">
               <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-8" />
               <div className="flex items-center justify-between mb-10">
                  <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Analisi Expert</h2>
                  <button onClick={() => setIsEditing(false)} className="p-3 bg-white/5 rounded-2xl text-white/40"><X size={20}/></button>
               </div>

               {/* Rating Select */}
               <div className="mb-10 text-center bg-white/[0.03] p-6 rounded-3xl border border-white/5">
                  <div className="text-[10px] font-black text-white/20 tracking-[0.3em] uppercase mb-4">Voto Complessivo (1-10)</div>
                  <div className="flex justify-center gap-2 overflow-x-auto no-scrollbar pb-2">
                     {[...Array(10)].map((_, i) => (
                        <button key={i} onClick={() => setEditedRating(i + 1)} className={`min-w-[40px] h-10 rounded-xl font-black text-sm transition-all ${editedRating === i + 1 ? 'bg-[#E94560] text-white scale-110 shadow-glow-primary' : 'bg-white/5 text-white/30'}`}>
                           {i + 1}
                        </button>
                     ))}
                  </div>
               </div>

               {/* Stats Sliders */}
               <div className="space-y-8 mb-12">
                  <div className="text-[10px] font-black text-[#E94560] tracking-[0.3em] uppercase mb-6 flex items-center gap-2">
                     <div className="w-4 h-[1px] bg-[#E94560]" /> Performance Reale
                  </div>
                  {['attack', 'defense', 'stamina', 'burst', 'mobility'].map(key => (
                     <div key={key}>
                        <div className="flex justify-between items-center mb-4">
                           <span className="text-[11px] font-black text-white/40 uppercase tracking-widest">{key}</span>
                           <span className="text-sm font-black text-[#E94560] italic">{editedStats[key] || 50}</span>
                        </div>
                        <input type="range" min="0" max="100" step="1" value={editedStats[key] || 50} onChange={e => setEditedStats({...editedStats, [key]: parseInt(e.target.value)})} className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-[#E94560]" />
                     </div>
                  ))}
               </div>

               {/* Notes Textarea */}
               <div className="mb-12">
                  <div className="text-[10px] font-black text-white/20 tracking-[0.3em] uppercase mb-4">Note Tattiche</div>
                  <textarea value={editedNotes} onChange={e => setEditedNotes(e.target.value)} placeholder="Scrivi qui i segreti di questa combo..." className="w-full h-32 bg-white/5 border border-white/5 rounded-3xl p-6 text-sm text-white/70 outline-none focus:border-[#4361EE]/30 transition-all font-medium resize-none shadow-inner" />
               </div>

               <button onClick={handleSaveReview} disabled={saving} className="w-full py-5 bg-[#E94560] rounded-[24px] text-white font-black text-xs tracking-[0.2em] uppercase shadow-glow-primary transition-transform active:scale-95 disabled:opacity-50">
                  {saving ? 'Registrazione...' : 'Salva Valutazione'}
               </button>
               <div className="h-10" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
}

function PartRow({ label, part, onClick }) {
  if (!part) return null;
  const partType = part.type?.toLowerCase();
  const typeColor = TYPE_COLORS[partType] || 'rgba(255,255,255,0.2)';

  return (
    <button 
      onClick={onClick}
      className="w-full bg-[#12122A] rounded-3xl p-5 flex items-center gap-5 border border-white/5 transition-all hover:bg-[#1A1A3A] text-left active:scale-[0.98]"
    >
      <div className="w-16 h-16 rounded-2xl bg-[#0A0A1A] flex items-center justify-center border border-white/5 overflow-hidden">
        <img src={part.image_url} alt={part.name} className="w-12 h-12 object-contain" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[9px] text-white/30 font-black tracking-[0.3em] uppercase mb-1">{label}</div>
        <div className="text-white font-black text-base truncate uppercase italic tracking-tight mb-1">{part.name}</div>
        
        <div className="flex items-center gap-1.5">
           <div className="w-1.5 h-1.5 rounded-full" style={{ background: typeColor }} />
           <span className="text-[9px] font-black uppercase tracking-widest italic" style={{ color: typeColor }}>
              {part.type || (part.height ? `${part.height} HEIGHT` : 'CLASSIC')}
           </span>
        </div>
      </div>
      <ChevronRight size={18} className="text-white/10" />
    </button>
  );
}

function computeFinalStats(combo) {
  const b = combo.blade?.stats ?? {};
  const r = combo.ratchet?.stat_modifiers ?? {};
  const t = combo.bit?.stats ?? {}; // Map to correct bits stats col if exists
  const val = (v) => (v ?? 50);
  const clamp = v => Math.max(0, Math.min(100, v));

  return {
    attack:  clamp(val(b.attack)  + (r.attack ?? 0)  + (t.attack ?? 0)),
    defense: clamp(val(b.defense) + (r.defense ?? 0) + (t.defense ?? 0)),
    stamina: clamp(val(b.stamina) + (r.stamina ?? 0) + (t.stamina ?? 0)),
    burst:   clamp(val(b.burst||b.burst_resistance)   + (r.burst_resistance ?? 0) + (t.burst_resistance ?? 0)),
    mobility: clamp(val(b.mobility||b.dash_performance) + (r.dash_performance ?? 0) + (t.dash_performance ?? 0)),
  };
}
