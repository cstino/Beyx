import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, ChevronRight, Search, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useBuilderStore } from '../store/useBuilderStore';
import PartCard from '../components/PartCard';
import ComboResultDrawer from '../components/ComboResultDrawer';
import { useSearchParams, useNavigate } from 'react-router-dom';
import StatRadar from '../components/StatRadar';
import { SavedComboCard } from '../components/builder/SavedComboCard';
import { PageContainer } from '../components/PageContainer';

export default function Builder() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { blade, ratchet, bit, archetype, select, setArchetype, reset, getScore } = useBuilderStore();
  
  const [parts, setParts] = useState({ blades: [], ratchets: [], bits: [] });
  const [ownedIds, setOwnedIds] = useState(new Set());
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
      if (!user) return;

      const [b, r, bt, sc, coll] = await Promise.all([
        supabase.from('blades').select('*').order('name'),
        supabase.from('ratchets').select('*').order('name'),
        supabase.from('bits').select('*').order('name'),
        supabase.from('combos').select(`
          *,
          blade:blade_id(*),
          ratchet:ratchet_id(*),
          bit:bit_id(*)
        `).eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('user_collections').select('part_id').eq('user_id', user.id)
      ]);
      
      setParts({ blades: b.data || [], ratchets: r.data || [], bits: bt.data || [] });
      setSavedCombos(sc.data || []);
      setOwnedIds(new Set((coll.data ?? []).map(c => c.part_id)));
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
        combo_type: blade.type // Default to blade type
      }).select('*, blade:blades(*), ratchet:ratchets(*), bit:bits(*)').single();
      
      if (error) throw error;
      setSavedCombos([data, ...savedCombos]);
      setView('saved');
    } catch (err) {
      alert('Errore: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0A0A1A] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#E94560] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <PageContainer>
      {/* 
          1. View Toggle Header 
          Sticks below the global Layout header (approx 56px height)
      */}
      <header 
        className="sticky top-0 z-30 bg-[#0A0A1A] border-b border-white/5 pt-4 pb-4"
      >
        <div className="px-4">
          <div className="flex gap-2 p-1 bg-[#12122A] rounded-xl border border-white/5">
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
        </div>
      </header>

      {view === 'build' ? (
        <>
          {/* 2. Selection Tracker (Sticky below the toggle) */}
          <div 
            className="sticky top-[73px] z-20 bg-[#0A0A1A] px-4 pt-4 pb-6 border-b border-white/5 shadow-lg"
          >
            <div className="flex items-center gap-4 mb-5">
              <div className="flex-1">
                <h1 className="text-2xl font-black uppercase tracking-tighter leading-none text-white italic">Crea Combo</h1>
                <p className="text-[10px] font-bold text-[#4361EE] uppercase tracking-[0.2em] mt-2">
                  {!blade ? 'Seleziona Blade' : !ratchet ? 'Scegli Ratchet' : !bit ? 'Ultimo tocco: Bit' : 'Analisi Finita'}
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
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    activeTab === item.type 
                      ? 'bg-[#4361EE]/10 border-[#4361EE]/50 ring-1 ring-[#4361EE]/20' 
                      : 'bg-white/5 border-white/5 opacity-60'
                  }`}
                >
                  <span className="text-[8px] uppercase font-black text-slate-500 block leading-none mb-1.5">{item.label}</span>
                  <span className="text-[11px] font-black truncate block text-white uppercase italic">
                    {item.part ? item.part.name : '---'}
                  </span>
                </button>
              ))}
            </div>

            {/* Sub-Tabs (Blade/Ratchet/Bit) switcher */}
            <div className="flex gap-1 mt-6 p-1 bg-[#12122A] rounded-xl border border-white/5">
              {['blades', 'ratchets', 'bits'].map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveTab(type)}
                  className={`flex-1 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${
                    activeTab === type ? 'bg-[#4361EE] text-white shadow-glow-primary' : 'text-white/30'
                  }`}
                >
                  {type.slice(0, -1)}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Scrollable Grid Area */}
          <div className="px-4 py-3">
            <div className="grid grid-cols-2 gap-4 mt-2">
              {parts[activeTab].map((p) => (
                <PartCard 
                  key={p.id} 
                  part={p} 
                  owned={ownedIds.has(p.id)}
                  onClick={() => select(activeTab.slice(0, -1), p)}
                  className={((activeTab === 'blades' && blade?.id === p.id) || (activeTab === 'ratchets' && ratchet?.id === p.id) || (activeTab === 'bits' && bit?.id === p.id)) ? 'ring-2 ring-[#4361EE] border-[#4361EE]' : ''}
                />
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="px-4 mt-8 space-y-4">
          <div className="p-1">
             <h2 className="text-[11px] font-black text-white/30 uppercase tracking-[0.3em] mb-6">
                LE TUE CONFIGURAZIONI ({savedCombos.length})
             </h2>
             <div className="space-y-4">
                {savedCombos.length === 0 ? (
                    <div className="py-20 text-center bg-[#12122A] rounded-3xl border border-dashed border-white/10 mx-2">
                    <p className="text-xs text-white/30 font-black uppercase tracking-[0.2em] leading-relaxed">
                        Nessuna combo salvata.<br/>Inizia a creare nell'arena!
                    </p>
                    </div>
                ) : (
                    savedCombos.map(c => (
                    <SavedComboCard 
                        key={c.id} 
                        combo={c} 
                        onClick={(combo) => navigate(`/combo/${combo.id}`)} 
                    />
                    ))
                )}
             </div>
          </div>
        </div>
      )}

      <ComboResultDrawer 
        combo={{ blade, ratchet, bit }}
        score={score}
        onClose={() => select('bit', null)}
        onSave={handleSave}
        saving={saving}
      />
    </PageContainer>
  );
}
