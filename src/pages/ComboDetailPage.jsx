import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Edit2, Shield, Zap, Target, ArrowRight, Star, Quote, Plus } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import StatRadar from '../components/StatRadar';
import { PageContainer } from '../components/PageContainer';
import PartDetailDrawer from '../components/PartDetailDrawer';
import { ExpertReviewModal } from '../components/ExpertReviewModal';

export default function ComboDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [combo, setCombo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePart, setActivePart] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  useEffect(() => {
    fetchCombo();
  }, [id]);

  async function fetchCombo() {
    const { data, error } = await supabase
      .from('combos')
      .select(`
        *,
        blade:blade_id(*),
        ratchet:ratchet_id(*),
        bit:bit_id(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching combo:', error);
      navigate('/');
      return;
    }
    setCombo(data);
    setLoading(false);
  }

  const theoreticalStats = useMemo(() => {
    if (!combo) return null;
    const b = combo.blade.stats || {};
    const bt = combo.bit.stats || { attack: 10, defense: 10, stamina: 10, burst: 10, mobility: 10 };
    return {
      attack:   (b.attack || 0) + (bt.attack || 0),
      defense:  (b.defense || 0) + (bt.defense || 0),
      stamina:  (b.stamina || 0) + (bt.stamina || 0),
      burst:    (b.burst || 0) + (bt.burst || 0),
      mobility: (b.mobility || 0) + (bt.mobility || 0),
    };
  }, [combo]);

  // If user hasn't evaluated yet, this will be null/empty
  const userStats = combo?.user_stats;

  if (loading) return (
    <div className="min-h-screen bg-[#0A0A1A] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#E94560] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <PageContainer className="pb-32">
      {/* Header with Fixed Button and Truncated Title */}
      <div className="px-6 py-6 flex items-center justify-between gap-4 sticky top-0 bg-[#0A0A1A]/80 backdrop-blur-xl z-30 border-b border-white/5">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <button 
            onClick={() => navigate('/builder?view=saved')} 
            className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 border border-white/5 flex-shrink-0"
          >
            <ChevronLeft size={22} />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
               <div className="w-1.5 h-1.5 rounded-full bg-primary" />
               <span className="text-[10px] font-black text-primary uppercase tracking-widest">{combo.combo_type || 'Balance'}</span>
            </div>
            <h1 className="text-xl font-black text-white italic uppercase tracking-tighter leading-tight truncate">
              {combo.name}
            </h1>
          </div>
        </div>
        
        <button 
          onClick={() => setReviewModalOpen(true)}
          className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(233,69,96,0.1)] flex-shrink-0 active:scale-90 transition-all"
        >
          <Edit2 size={20} />
        </button>
      </div>

      <div className="px-5 space-y-8 mt-6">
        
        {/* App Analysis Card */}
        <section className="bg-[#12122A] rounded-[32px] p-6 border border-white/5 shadow-2xl relative overflow-hidden">
           <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-[#4361EE]/10 flex items-center justify-center text-[#4361EE]">
                   <Shield size={18} />
                 </div>
                 <h2 className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em]">Analisi Teorica App</h2>
              </div>
              <div className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-white/60">
                 {combo.blade.weight + 5}g
              </div>
           </div>

           <div className="h-64 mb-8">
             <StatRadar stats={theoreticalStats} color="#4361EE" />
           </div>

           <div className="grid grid-cols-2 gap-8 pt-6 border-t border-white/5">
              <div className="text-center">
                 <div className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Base OVR</div>
                 <div className="text-2xl font-black text-white italic leading-none">5.9</div>
              </div>
              <div className="text-center">
                 <div className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Type</div>
                 <div className="text-lg font-black text-primary italic uppercase leading-none">{combo.combo_type || 'Balance'}</div>
              </div>
           </div>
        </section>

        {/* User Evaluation Card - Conditional Content */}
        <section className="bg-gradient-to-br from-[#1A1A3A] to-[#11112B] rounded-[32px] p-6 border border-white/5 shadow-2xl relative overflow-hidden">
           <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Zap size={18} />
              </div>
              <h2 className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em]">Valutazione sul Campo</h2>
           </div>

           {userStats ? (
             <>
               <div className="h-64 mb-8">
                 <StatRadar stats={userStats} color="#E94560" />
               </div>

               {combo.user_notes && (
                 <div className="mt-8 p-5 bg-white/5 rounded-2xl border-l-4 border-primary italic">
                    <Quote size={16} className="text-primary/20 mb-2" />
                    <p className="text-white/60 text-xs font-medium leading-relaxed">{combo.user_notes}</p>
                 </div>
               )}

               <div className="flex items-center justify-center gap-1 mt-6">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} className={i < (combo.user_rating || 0) ? "text-[#F5A623] fill-[#F5A623]" : "text-white/10"} />
                  ))}
               </div>
             </>
           ) : (
             <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center border border-primary/20 animate-pulse">
                   <Plus size={32} className="text-primary/40" />
                </div>
                <div className="space-y-2">
                   <h3 className="text-white font-black uppercase text-sm italic tracking-tight">Nessuna Analisi di Campo</h3>
                   <p className="text-white/30 text-[10px] font-medium leading-relaxed px-8">Inserisci le tue statistiche reali per personalizzare l'analisi della combo.</p>
                </div>
                <button 
                  onClick={() => setReviewModalOpen(true)}
                  className="px-6 py-4 bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-glow-primary active:scale-95 transition-all w-full max-w-[240px]"
                >
                  Valuta Ora
                </button>
             </div>
           )}
        </section>

        {/* Components List - Interactive */}
        <section className="space-y-4">
           <div className="flex items-center gap-2 mb-2">
              <div className="w-[3px] h-3 bg-white/20" />
              <h2 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Configurazione</h2>
           </div>

           {[
             { label: 'Blade', part: combo.blade },
             { label: 'Ratchet', part: combo.ratchet },
             { label: 'Bit', part: combo.bit },
           ].map((item, i) => (
             <button 
               key={i}
               onClick={() => setActivePart(item.part)}
               className="w-full flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all active:scale-[0.98]"
             >
                <div className="flex items-center gap-5">
                   <div className="w-12 h-12 rounded-xl bg-[#0A0A1A] p-2 border border-white/10 overflow-hidden">
                      <img src={item.part.image_url} alt={item.part.name} className="w-full h-full object-contain" />
                   </div>
                   <div className="text-left">
                      <div className="text-[10px] font-black text-white/20 uppercase tracking-widest">{item.label}</div>
                      <div className="text-sm font-black text-white italic uppercase tracking-tight truncate max-w-[160px]">{item.part.name}</div>
                   </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/20">
                   <ChevronRight size={16} />
                </div>
             </button>
           ))}
        </section>
      </div>

      <PartDetailDrawer 
        part={activePart} 
        onClose={() => setActivePart(null)} 
      />

      <ExpertReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        combo={combo}
        onSaved={fetchCombo}
      />
    </PageContainer>
  );
}
