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

import { useSearchParams } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import StatRadar from '../components/StatRadar';

export default function Builder() {
  const [searchParams] = useSearchParams();
  const { blade, ratchet, bit, archetype, select, setArchetype, reset, getScore } = useBuilderStore();
  const [parts, setParts] = useState({ blades: [], ratchets: [], bits: [] });
  const [activeTab, setActiveTab] = useState('blades');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // View state: 'build' or 'saved'
  const initialView = searchParams.get('view') === 'saved' ? 'saved' : 'build';
  const [view, setView] = useState(initialView);
  const [savedCombos, setSavedCombos] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      const [b, r, bt, sc] = await Promise.all([
        supabase.from('blades').select('*').order('name'),
        supabase.from('ratchets').select('*').order('name'),
        supabase.from('bits').select('*').order('name'),
        supabase.from('combos').select('*, blade:blades(*), ratchet:ratchets(*), bit:bits(*)').eq('user_id', user.id).order('created_at', { ascending: false })
      ]);
      
      setParts({ blades: b.data || [], ratchets: r.data || [], bits: bt.data || [] });
      setSavedCombos(sc.data || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  const score = useMemo(() => getScore(), [blade, ratchet, bit, archetype]);

  const handleSave = async () => {
    if (!blade || !ratchet || !bit) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.from('combos').insert({
        user_id: user.id,
        name: `${blade.name} ${ratchet.name}${bit.name}`,
        blade_id: blade.id,
        ratchet_id: ratchet.id,
        bit_id: bit.id,
      }).select('*, blade:blades(*), ratchet:ratchets(*), bit:bits(*)').single();
      
      if (error) throw error;
      setSavedCombos([data, ...savedCombos]);
      alert('Combo salvata!');
      setView('saved');
    } catch (err) {
      alert('Errore: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Eliminare questa combo?')) return;
    const { error } = await supabase.from('combos').delete().eq('id', id);
    if (!error) setSavedCombos(savedCombos.filter(c => c.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto pb-32 min-h-screen">
      {/* Top View Toggle */}
      <div className="flex gap-2 mx-4 mt-6 p-1 bg-[#12122A] rounded-xl border border-white/5">
        <button
          onClick={() => setView('build')}
          className={`flex-1 py-3 text-[10px] font-black tracking-widest rounded-lg transition-all ${
            view === 'build' ? 'bg-[#E94560] text-white shadow-glow-primary' : 'text-slate-500'
          }`}
        >
          BUILDER
        </button>
        <button
          onClick={() => setView('saved')}
          className={`flex-1 py-3 text-[10px] font-black tracking-widest rounded-lg transition-all ${
            view === 'saved' ? 'bg-[#E94560] text-white shadow-glow-primary' : 'text-slate-500'
          }`}
        >
          SAVED
        </button>
      </div>

      {view === 'build' ? (
        <>
          {/* Dynamic Selection Header */}
          <header className="sticky top-[80px] z-30 bg-[#0A0A1A]/90 backdrop-blur-xl pt-6 pb-6 px-4 mb-4 border-b border-white/5">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1">
                <h1 className="text-2xl font-black uppercase tracking-tighter leading-none">Crea Combo</h1>
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

            {/* Categories Tabs */}
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

          <div className="px-4">
            <div className="grid grid-cols-2 gap-4">
              {parts[activeTab].map((p) => (
                <PartCard 
                  key={p.id} 
                  part={p} 
                  owned={true}
                  onClick={() => select(activeTab.slice(0, -1), p)}
                  className={((activeTab === 'blades' && blade?.id === p.id) || (activeTab === 'ratchets' && ratchet?.id === p.id) || (activeTab === 'bits' && bit?.id === p.id)) ? 'border-primary ring-2 ring-primary/20 scale-[1.02]' : ''}
                />
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="px-4 mt-8 space-y-4">
          <h2 className="text-xl font-black uppercase tracking-tight px-1">Le Tue Configurazioni</h2>
          {savedCombos.length === 0 ? (
            <div className="p-12 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
              <p className="text-sm text-slate-500 font-bold uppercase tracking-widest leading-loose">
                Non hai ancora salvato<br/>nessuna combo.
              </p>
            </div>
          ) : (
            savedCombos.map(c => (
              <div key={c.id} className="bg-[#12122A] p-5 rounded-3xl border border-white/5 flex gap-5 items-center group relative overflow-hidden">
                <div className="w-20 h-20 flex-shrink-0">
                  <StatRadar stats={c.blade?.stats || {}} color="#E94560" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <h3 className="font-black uppercase tracking-tighter truncate leading-none mb-2">{c.name}</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[8px] font-black px-2 py-1 bg-white/5 rounded-md text-slate-400 uppercase tracking-widest">{c.ratchet?.name}</span>
                    <span className="text-[8px] font-black px-2 py-1 bg-white/5 rounded-md text-slate-400 uppercase tracking-widest">{c.bit?.name}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="p-3 bg-red-500/10 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      <ComboResultDrawer 
        combo={{ blade, ratchet, bit }}
        score={score}
        onClose={() => select('bit', null)}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}
