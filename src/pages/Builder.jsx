import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Zap, Shield, Star, Target, Info, Save, RotateCcw, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useBuilderStore } from '../store/useBuilderStore';
import PartCard from '../components/PartCard';

const archetypes = [
  { id: 'Attack', icon: Zap, color: 'text-accent', bg: 'bg-accent/10' },
  { id: 'Defense', icon: Shield, color: 'text-green-500', bg: 'bg-green-500/10' },
  { id: 'Stamina', icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  { id: 'Balance', icon: Target, color: 'text-primary', bg: 'bg-primary/10' },
];

export default function Builder() {
  const { blade, ratchet, bit, archetype, select, setArchetype, reset, getScore } = useBuilderStore();
  const [parts, setParts] = useState({ blades: [], ratchets: [], bits: [] });
  const [activeTab, setActiveTab] = useState('blades');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchParts() {
      const [b, r, bt] = await Promise.all([
        supabase.from('blades').select('*').order('name'),
        supabase.from('ratchets').select('*').order('name'),
        supabase.from('bits').select('*').order('name'),
      ]);
      setParts({ blades: b.data || [], ratchets: r.data || [], bits: bt.data || [] });
      setLoading(false);
    }
    fetchParts();
  }, []);

  const score = useMemo(() => getScore(), [blade, ratchet, bit, archetype]);

  const handleSave = async () => {
    if (!blade || !ratchet || !bit) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('combos').insert({
        user_id: user.id,
        name: `${blade.name} ${ratchet.name}${bit.name}`,
        blade_id: blade.id,
        ratchet_id: ratchet.id,
        bit_id: bit.id,
      });
      if (error) throw error;
      alert('Combo salvata con successo!');
    } catch (err) {
      alert('Errore nel salvataggio: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-24">
      {/* Header with Stats Display */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md pt-4 pb-6 px-4 mb-6 border-b border-white/5">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black uppercase tracking-tighter">Combo Builder</h1>
          <button onClick={reset} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
            <RotateCcw size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-6">
          {archetypes.map((arch) => (
            <button
              key={arch.id}
              onClick={() => setArchetype(arch.id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                archetype === arch.id 
                  ? `border-white/20 ${arch.bg} shadow-glow-${arch.id.toLowerCase()}` 
                  : 'border-transparent bg-white/5 opacity-50'
              }`}
            >
              <arch.icon size={18} className={arch.color} />
              <span className="text-[10px] font-black uppercase">{arch.id}</span>
            </button>
          ))}
        </div>

        {/* Score Panel */}
        <AnimatePresence mode="wait">
          {score ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card overflow-hidden"
            >
              <div className="flex items-center">
                <div className="p-4 bg-primary/20 border-r border-white/10 flex flex-col items-center justify-center min-w-[100px]">
                  <span className="text-[10px] uppercase font-bold text-primary/80">Score</span>
                  <span className="text-4xl font-black">{score.overall}</span>
                </div>
                <div className="flex-1 p-4 grid grid-cols-5 gap-2">
                  {Object.entries(score.breakdown).map(([stat, val]) => (
                    <div key={stat} className="flex flex-col gap-1">
                      <div className="h-12 w-full bg-white/5 rounded-md relative flex items-end overflow-hidden">
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${val}%` }}
                          className={`w-full ${stat === 'attack' ? 'bg-accent' : stat === 'defense' ? 'bg-green-500' : 'bg-primary'}`}
                        />
                      </div>
                      <span className="text-[8px] uppercase font-black text-center opacity-60 truncate">{stat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="glass-card p-6 flex flex-col items-center justify-center border-dashed border-white/10 opacity-50">
              <Info className="mb-2 text-primary" />
              <p className="text-xs uppercase font-bold tracking-widest">Seleziona 3 parti per calcolare lo score</p>
            </div>
          )}
        </AnimatePresence>
      </header>

      {/* Selector Tabs */}
      <div className="px-4">
        <div className="flex gap-2 p-1 bg-white/5 rounded-xl mb-4">
          {['blades', 'ratchets', 'bits'].map((type) => (
            <button
              key={type}
              onClick={() => setActiveTab(type)}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${
                activeTab === type ? 'bg-white/10 text-white shadow-lg' : 'text-slate-500'
              }`}
            >
              {type.slice(0, -1)}
            </button>
          ))}
        </div>

        {/* Part List with Virtualization */}
        <div className="min-h-[400px]">
          {loading ? (
            <div className="flex justify-center p-12">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {parts[activeTab].map((p) => {
                const isSelected = (activeTab === 'blades' && blade?.id === p.id) ||
                                 (activeTab === 'ratchets' && ratchet?.id === p.id) ||
                                 (activeTab === 'bits' && bit?.id === p.id);
                return (
                  <PartCard 
                    key={p.id} 
                    part={p} 
                    owned={true}
                    onClick={() => select(activeTab.slice(0, -1), p)}
                    className={isSelected ? 'border-primary ring-2 ring-primary/20 scale-[1.02]' : ''}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Floating Save Button */}
      <AnimatePresence>
        {blade && ratchet && bit && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-24 left-0 right-0 px-4 z-40"
          >
            <button 
              disabled={saving}
              onClick={handleSave}
              className="w-full btn-primary py-4 flex items-center justify-center gap-2 shadow-2xl shadow-primary/40"
            >
              {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={20} />}
              <span className="uppercase font-black tracking-widest">Salva Combo</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
