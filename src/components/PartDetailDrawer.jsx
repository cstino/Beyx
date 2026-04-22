import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Weight, Layers, ShieldCheck, Zap, Star, Target, Info } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import PartImage from './PartImage';
import StatRadar from './StatRadar';
import TierBadge from './TierBadge';

const statColors = {
  attack: '#F43F5E', // Red
  defense: '#3B82F6', // Blue
  stamina: '#22C55E', // Green
  burst: '#EAB308',   // Yellow
  mobility: '#A855F7', // Purple
};

export default function PartDetailDrawer({ part, onClose, onUpdate }) {
  const [owned, setOwned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    if (!part) return;

    async function checkOwnership() {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user.id);
      
      const { data } = await supabase
        .from('user_collections')
        .select('id')
        .eq('user_id', user.id)
        .eq('part_id', part.id)
        .maybeSingle();
      
      setOwned(!!data);
    }
    checkOwnership();
  }, [part]);

  const handleToggle = async () => {
    if (!userId || loading) return;
    setLoading(true);

    try {
      if (owned) {
        await supabase.from('user_collections').delete().eq('user_id', userId).eq('part_id', part.id);
        setOwned(false);
      } else {
        await supabase.from('user_collections').insert({
          user_id: userId,
          part_id: part.id,
          part_type: part.part_type || 'blade'
        });
        setOwned(true);
      }
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const stats = part?.stats || { attack: 50, defense: 50, stamina: 50, burst: 50, mobility: 50 };
  
  // Find dominant stat for radar color
  const dominantStat = Object.entries(stats).reduce((a, b) => a[1] > b[1] ? a : b)[0];
  const accentColor = statColors[dominantStat] || statColors.attack;

  return (
    <AnimatePresence>
      {part && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[101] bg-surface rounded-t-[2.5rem] border-t border-white/10 overflow-hidden max-h-[95vh] flex flex-col"
          >
            <div className="w-full flex justify-center py-4 relative">
              <div className="w-12 h-1.5 bg-white/10 rounded-full" />
              <button 
                onClick={onClose} 
                className="absolute right-6 top-3 p-2 bg-white/5 rounded-full text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-24">
              {/* Central Header */}
              <div className="flex flex-col items-center text-center mb-10 pt-4">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-48 h-48 mb-6 drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                >
                  <PartImage src={part.image_url} name={part.name} type={part.type} />
                </motion.div>
                
                <h2 className="text-3xl font-black uppercase tracking-tighter mb-1">{part.name}</h2>
                <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">{part.type} COMPONENT</p>
                
                <div className="flex gap-2 mt-6">
                  <TierBadge tier={part.tier} />
                  <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg flex items-center gap-2 text-[10px] font-black uppercase">
                    <Weight size={14} className="text-slate-400" />
                    {part.weight || '35.0'}g
                  </div>
                </div>
              </div>

              {/* Stats Visualization */}
              <div className="flex flex-col items-center gap-10 mb-12">
                <StatRadar stats={stats} color={accentColor} />
                
                <div className="w-full grid grid-cols-1 gap-3">
                  {Object.entries(stats).map(([key, val]) => (
                    <div key={key} className="glass-card p-4 border-white/[0.03]">
                       <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statColors[key] }} />
                             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{key}</span>
                          </div>
                          <span className="text-sm font-black">{val}</span>
                       </div>
                       <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${val}%` }}
                            className="h-full"
                            style={{ backgroundColor: statColors[key] }}
                          />
                       </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-4 mb-12 bg-white/5 p-6 rounded-3xl border border-white/5">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Info size={14} /> Analisi Tecnica
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed italic opacity-80">
                  {part.description || "Componente di alta ingegneria progettato per eccellere nelle competizioni professionali."}
                </p>
              </div>

              {/* Action Button */}
              <button
                onClick={handleToggle}
                disabled={loading}
                className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${
                  owned 
                    ? 'bg-red-500/10 border border-red-500/20 text-red-500' 
                    : 'text-white shadow-glow-primary hover:scale-[1.02]'
                }`}
                style={!owned ? { backgroundColor: accentColor } : {}}
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : owned ? (
                  <><Trash2 size={20} /> Rimuovi dalla Collezione</>
                ) : (
                  <><Plus size={20} /> Aggiungi alla Collezione</>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
