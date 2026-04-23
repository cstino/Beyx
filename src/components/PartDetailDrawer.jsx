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

const archetypeColors = {
  Attack: '#F43F5E',
  Defense: '#3B82F6',
  Stamina: '#22C55E',
  Balance: '#A855F7',
};

export default function PartDetailDrawer({ part: initialPart, onClose, onUpdate }) {
  const [activePart, setActivePart] = useState(initialPart);
  const [variants, setVariants] = useState([]);
  const [owned, setOwned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    setActivePart(initialPart);
  }, [initialPart]);

  useEffect(() => {
    if (!activePart) return;

    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user.id);
      
      // Check ownership of active variant
      const { data: ownership } = await supabase
        .from('user_collections')
        .select('id')
        .eq('user_id', user.id)
        .eq('part_id', activePart.id)
        .maybeSingle();
      
      setOwned(!!ownership);

      // Fetch other variants (same name, different ID)
      const tableName = activePart.kind === 'ratchet' ? 'ratchets' : activePart.kind === 'bit' ? 'bits' : 'blades';
      const { data: others } = await supabase
        .from(tableName)
        .select('*')
        .eq('name', activePart.name);
      
      setVariants(others || []);
    }
    fetchData();
  }, [activePart]);

  const handleToggle = async () => {
    if (!userId || loading) return;
    setLoading(true);

    try {
      if (owned) {
        await supabase.from('user_collections').delete().eq('user_id', userId).eq('part_id', activePart.id);
        setOwned(false);
      } else {
        await supabase.from('user_collections').insert({
          user_id: userId,
          part_id: activePart.id,
          part_type: activePart.kind || 'blade'
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

  const stats = activePart?.stats || { attack: 50, defense: 50, stamina: 50, burst: 50, mobility: 50 };
  
  // Find dominant stat for radar color
  const dominantStat = Object.entries(stats).reduce((a, b) => a[1] > b[1] ? a : b)[0];
  const accentColor = statColors[dominantStat] || statColors.attack;

  return (
    <AnimatePresence>
      {activePart && (
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
              <div className="flex flex-col items-center text-center mb-6 pt-4">
                <motion.div 
                  key={activePart.image_url}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-48 h-48 mb-6 drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                >
                  <PartImage src={activePart.image_url} name={activePart.name} type={activePart.kind} />
                </motion.div>
                
                <h2 className="text-3xl font-black uppercase tracking-tighter mb-1">{activePart.name}</h2>
                <p 
                  className="text-[10px] font-black uppercase tracking-[0.2em]"
                  style={{ color: activePart.kind === 'blade' ? archetypeColors[activePart.type] : accentColor }}
                >
                  {activePart.type || activePart.kind} COMPONENT
                </p>
                
                <div className="flex gap-2 mt-4">
                  <TierBadge tier={activePart.tier} />
                  <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg flex items-center gap-2 text-[10px] font-black uppercase">
                    <Weight size={14} className="text-slate-400" />
                    {activePart.weight || '35.0'}g
                  </div>
                  <div className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-lg text-primary text-[10px] font-black uppercase">
                    {activePart.release_code || 'BX-00'}
                  </div>
                </div>

                {/* Stock Combo Section (New) */}
                {activePart.kind === 'blade' && (activePart.stock_ratchet || activePart.stock_bit) && (
                  <div className="w-full mt-8 p-4 bg-primary/5 border border-primary/20 rounded-2xl flex flex-col gap-3">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                       <Layers size={14} /> Combo Originale (Stock)
                    </h4>
                    <div className="flex justify-around items-center gap-4">
                      <div className="flex flex-col items-center">
                        <span className="text-[8px] text-slate-500 uppercase font-bold mb-1">Ratchet</span>
                        <span className="text-xs font-black text-white">{activePart.stock_ratchet || '---'}</span>
                      </div>
                      <div className="w-px h-8 bg-white/10" />
                      <div className="flex flex-col items-center">
                        <span className="text-[8px] text-slate-500 uppercase font-bold mb-1">Bit</span>
                        <span className="text-xs font-black text-white">{activePart.stock_bit || '---'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Variants Section */}
              {variants.length > 1 && (
                <div className="mb-10">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 px-2">Color Variants / Special Editions</p>
                  <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide px-1">
                    {variants.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => setActivePart({ ...v, kind: activePart.kind })}
                        className={`w-16 h-16 rounded-2xl border-2 flex-shrink-0 transition-all p-1 bg-white/5 ${
                          activePart.id === v.id ? 'border-primary ring-4 ring-primary/20 scale-110' : 'border-white/5 opacity-40 hover:opacity-100'
                        }`}
                      >
                        <PartImage src={v.image_url} name={v.name} type={activePart.kind} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

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
                  {activePart.description || "Componente di alta ingegneria progettato per eccellere nelle competizioni professionali."}
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
