import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Zap, Shield, Target, Gauge, Move, Trophy } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useToastStore } from '../store/useToastStore';

export function ExpertReviewModal({ isOpen, onClose, combo, onSaved }) {
  const toast = useToastStore();
  const [rating, setRating] = useState(combo?.user_rating || 5.0);
  const [notes, setNotes] = useState(combo?.user_notes || '');
  const [stats, setStats] = useState(combo?.user_stats || {
    attack: 50, defense: 50, stamina: 50, burst: 50, mobility: 50
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (combo) {
      setRating(combo.user_rating || 5.0);
      setNotes(combo.user_notes || '');
      setStats(combo.user_stats || {
        attack: 50, defense: 50, stamina: 50, burst: 50, mobility: 50
      });
    }
  }, [combo]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('combos')
      .update({
        user_rating: rating,
        user_notes: notes,
        user_stats: stats
      })
      .eq('id', combo.id);

    if (error) {
      toast.error('Errore durante il salvataggio');
    } else {
      toast.success('Analisi salvata!');
      onSaved();
      onClose();
    }
    setSaving(false);
  };

  const updateStat = (key, val) => {
    setStats(prev => ({ ...prev, [key]: parseInt(val) }));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#0A0A1A]/80 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          className="relative w-full max-w-lg bg-[#12122A] rounded-[32px] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-white/5">
            <div>
               <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">Analisi Esperta</h2>
               <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">Valutazione sul Campo</p>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8">
            {/* Rating 1-10 Slider */}
            <section className="bg-white/5 p-6 rounded-[24px] border border-white/5">
               <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4 block flex items-center gap-2">
                 <Trophy size={14} /> Punteggio Combo (1-10)
               </label>
               <div className="flex flex-col items-center gap-4">
                 <div className="text-4xl font-black text-white italic tracking-tighter">
                   {Number(rating).toFixed(1)}
                 </div>
                 <input 
                   type="range" min="1.0" max="10.0" step="0.1"
                   value={rating}
                   onChange={(e) => setRating(parseFloat(e.target.value))}
                   className="w-full h-2 bg-white/5 rounded-full appearance-none accent-primary"
                 />
                 <div className="w-full flex justify-between text-[8px] font-black text-white/20 uppercase tracking-widest">
                    <span>Base</span>
                    <span>Pro</span>
                    <span>Elite</span>
                 </div>
               </div>
            </section>

            {/* Performance Stats */}
            <section className="space-y-6">
               <label className="text-[10px] font-black text-[#4361EE] uppercase tracking-[0.2em] mb-2 block">Dinamiche Performance</label>
               {[
                 { key: 'attack', label: 'Attacco', icon: Zap, color: 'text-primary' },
                 { key: 'defense', label: 'Difesa', icon: Shield, color: 'text-blue-400' },
                 { key: 'stamina', label: 'Resistenza', icon: Gauge, color: 'text-green-400' },
                 { key: 'burst', label: 'Burst', icon: Target, color: 'text-orange-400' },
                 { key: 'mobility', label: 'Mobilità', icon: Move, color: 'text-purple-400' },
               ].map(stat => (
                 <div key={stat.key} className="space-y-2">
                   <div className="flex justify-between items-center px-1">
                      <div className="flex items-center gap-2">
                         <stat.icon size={14} className={stat.color} />
                         <span className="text-[10px] font-bold text-white/60 uppercase">{stat.label}</span>
                      </div>
                      <span className="text-xs font-black text-white">{stats[stat.key]}</span>
                   </div>
                   <input 
                     type="range" min="0" max="100" 
                     value={stats[stat.key]}
                     onChange={(e) => updateStat(stat.key, e.target.value)}
                     className="w-full h-1.5 bg-white/5 rounded-full appearance-none accent-primary"
                   />
                 </div>
               ))}
            </section>

            {/* Notes */}
            <section>
               <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-4 block">Verdetto Tecnico</label>
               <textarea 
                 value={notes}
                 onChange={(e) => setNotes(e.target.value)}
                 placeholder="Descrivi come si comporta il Bey in arena..."
                 className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm font-medium outline-none focus:border-primary/30 h-32 resize-none"
               />
            </section>
          </div>

          {/* Footer Actions */}
          <div className="p-6 bg-[#0A0A1A]/50 border-t border-white/5">
             <button 
               onClick={handleSave}
               disabled={saving}
               className="w-full py-5 bg-primary text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-glow-primary flex items-center justify-center gap-3 disabled:opacity-50"
             >
               {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
               Salva Analisi
             </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
