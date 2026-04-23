import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Zap, Shield, Star, Target, Info, Save, RotateCcw, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useBuilderStore } from '../store/useBuilderStore';
import PartCard from '../components/PartCard';
import ComboResultDrawer from '../components/ComboResultDrawer';

const statColors = {
  attack: '#ef4444',
  defense: '#3b82f6',
  stamina: '#22c55e',
  burst: '#eab308',
  mobility: '#a855f7'
};

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
    <div className="max-w-4xl mx-auto pb-24 min-h-screen">
      {/* Dynamic Selection Header */}
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl pt-6 pb-6 px-4 mb-4 border-b border-white/5">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1">
            <h1 className="text-2xl font-black uppercase tracking-tighter leading-none">Combo Builder</h1>
            <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mt-1">
              {!blade ? 'Seleziona Blade' : !ratchet ? 'Scegli Ratchet' : !bit ? 'Ultimo tocco: Bit' : 'Analisi Completa'}
            </p>
          </div>
          <button onClick={reset} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 active:scale-95">
            <RotateCcw size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Selection Progress Mini-display */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { part: blade, label: 'Blade', type: 'blades' },
            { part: ratchet, label: 'Ratchet', type: 'ratchets' },
            { part: bit, label: 'Bit', type: 'bits' }
          ].map((item, idx) => (
            <button 
              key={idx}
              onClick={() => setActiveTab(item.type)}
              className={`p-2 rounded-xl border text-left transition-all ${
                activeTab === item.type 
                  ? 'bg-primary/20 border-primary/50 ring-2 ring-primary/20' 
                  : 'bg-white/5 border-white/5 opacity-60'
              }`}
            >
              <span className="text-[7px] uppercase font-black text-slate-500 block leading-none mb-1">{item.label}</span>
              <span className="text-[10px] font-black truncate block">
                {item.part ? item.part.name : '---'}
              </span>
            </button>
          ))}
        </div>

        {/* Categories Tabs (Pinned below progress) */}
        <div className="flex gap-2 p-1 bg-white/5 rounded-xl mt-6 border border-white/5">
          {['blades', 'ratchets', 'bits'].map((type) => (
            <button
              key={type}
              onClick={() => setActiveTab(type)}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                activeTab === type ? 'bg-primary text-white shadow-glow-primary' : 'text-slate-500'
              }`}
            >
              {type.slice(0, -1)}
            </button>
          ))}
        </div>
      </header>

      {/* Selector Content */}
      <div className="px-4">

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

      {/* Result Analysis Modal */}
      <ComboResultDrawer 
        combo={{ blade, ratchet, bit }}
        score={score}
        onClose={() => select('bit', null)} // Unselect bit to close analysis and keep building
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}
