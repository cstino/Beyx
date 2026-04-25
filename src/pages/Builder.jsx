import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, ChevronRight, Search, Trash2, ArrowUpDown, Filter } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useBuilderStore } from '../store/useBuilderStore';
import PartCard from '../components/PartCard';
import ComboResultDrawer from '../components/ComboResultDrawer';
import { useSearchParams, useNavigate } from 'react-router-dom';
import StatRadar from '../components/StatRadar';
import { SavedComboCard } from '../components/builder/SavedComboCard';
import { PageContainer } from '../components/PageContainer';
import { useToastStore } from '../store/useToastStore';

const TYPES = ['ALL', 'ATTACK', 'DEFENSE', 'STAMINA', 'BALANCE'];

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
  
  // Sorting & Filtering state for saved combos
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' or 'asc'
  const [filterType, setFilterType] = useState('ALL');

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

  // Combined Filtering and Sorting logic
  const filteredAndSortedCombos = useMemo(() => {
    let result = [...savedCombos];

    // 1. Filter by Type
    if (filterType !== 'ALL') {
      result = result.filter(c => {
        const stats = c.user_stats || {};
        const type = determineType(stats, c.combo_type);
        return type.toUpperCase() === filterType;
      });
    }

    // 2. Sort by Rating
    return result.sort((a, b) => {
      const valA = a.user_rating || 0;
      const valB = b.user_rating || 0;
      return sortOrder === 'desc' ? valB - valA : valA - valB;
    });
  }, [savedCombos, sortOrder, filterType]);

  const score = useMemo(() => getScore(), [blade, ratchet, bit, archetype]);

  const handleSave = async () => {
    if (!blade || !ratchet || !bit) return;
    const toast = useToastStore.getState();
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.from('combos').insert({
        user_id: user.id,
        name: `${blade.name} ${ratchet.name}${bit.name}`,
        blade_id: blade.id,
        ratchet_id: ratchet.id,
        bit_id: bit.id,
        combo_type: blade.type 
      }).select('*, blade:blades(*), ratchet:ratchets(*), bit:bits(*)').single();
      
      if (error) throw error;
      setSavedCombos([data, ...savedCombos]);
      setView('saved');
      toast.success('Combo registrata nell\'Arena!');
    } catch (err) {
      toast.error('Registrazione fallita: ' + err.message);
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
      {/* 1. View Toggle Header */}
      <header className="sticky top-0 z-30 bg-[#0A0A1A] border-b border-white/5 pt-4 pb-4">
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
          {/* BUILDER VIEW CONTENT... */}
          <div className="sticky top-[73px] z-20 bg-[#0A0A1A] px-4 pt-4 pb-6 border-b border-white/5 shadow-lg">
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
        <div className="px-4 mt-6">
          {/* Filtering & Sorting Controls */}
          <div className="mb-8 space-y-4">
             <div className="flex items-center justify-between px-1">
                <h2 className="text-[11px] font-black text-white/30 uppercase tracking-[0.3em]">
                   VISTA FILTRATA ({filteredAndSortedCombos.length})
                </h2>
                <button 
                   onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                   className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10 text-[8px] font-black text-white/50 active:scale-95 transition-all"
                >
                   <ArrowUpDown size={12} /> {sortOrder === 'desc' ? 'VOTO HIGH' : 'VOTO LOW'}
                </button>
             </div>
             
             <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 px-1">
                {TYPES.map(type => (
                   <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border whitespace-nowrap ${
                         filterType === type 
                           ? 'bg-[#E94560] border-[#E94560] text-white shadow-glow-primary' 
                           : 'bg-white/5 border-white/5 text-white/40'
                      }`}
                   >
                      {type}
                   </button>
                ))}
             </div>
          </div>
          
          <div className="space-y-3 pb-20">
            {filteredAndSortedCombos.length === 0 ? (
                <div className="py-20 text-center bg-[#12122A] rounded-3xl border border-dashed border-white/10 mx-2">
                   <p className="text-xs text-white/30 font-black uppercase tracking-[0.2em] leading-relaxed">
                       Nessuna combo trovata.<br/>{filterType !== 'ALL' ? 'Prova con un altro filtro.' : 'Crea subito la prima!'}
                   </p>
                </div>
            ) : (
                filteredAndSortedCombos.map(c => (
                <SavedComboCard 
                    key={c.id} 
                    combo={c} 
                    onClick={(combo) => navigate(`/combo/${combo.id}`)} 
                />
                ))
            )}
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

/**
 * Logic to determine the Bey type based on its highest stat
 */
function determineType(stats, defaultType) {
  if (!stats || Object.keys(stats).length === 0) return defaultType || 'balance';
  const { attack, defense, stamina } = stats;
  const max = Math.max(attack || 0, defense || 0, stamina || 0);
  if (max < 40) return 'balance';
  if (attack === max) return 'attack';
  if (defense === max) return 'defense';
  if (stamina === max) return 'stamina';
  return 'balance';
}
