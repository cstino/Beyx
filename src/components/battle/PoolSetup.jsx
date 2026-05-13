import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import { motion } from 'framer-motion';
import { Check, Shield, Sword, Wind } from 'lucide-react';
import { SavedComboCard } from '../builder/SavedComboCard';

export function PoolSetup({ tournament, onComplete }) {
  const { user } = useAuthStore();
  const [combos, setCombos] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  const deckSize = tournament.battle_type === '3v3' ? 3 : 1;
  const targetCount = tournament.max_participants * deckSize;

  useEffect(() => {
    async function fetchCombos() {
      const { data } = await supabase.from('combos').select(`
        *,
        blade:blade_id(*),
        ratchet:ratchet_id(*),
        bit:bit_id(*)
      `).eq('user_id', user.id).order('created_at', { ascending: false });
      
      setCombos(data || []);
      
      // Se avevamo già salvato una pool, ripristiniamola
      if (tournament.structure?.pool) {
        setSelectedIds(new Set(tournament.structure.pool.map(c => c.id)));
      }
      setLoading(false);
    }
    fetchCombos();
  }, [user.id, tournament.structure?.pool]);

  const toggleSelection = (comboId) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(comboId)) {
      newSet.delete(comboId);
    } else {
      newSet.add(comboId);
    }
    setSelectedIds(newSet);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === combos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(combos.map(c => c.id)));
    }
  };

  const handleConfirm = () => {
    if (selectedIds.size < targetCount) {
      useToastStore.getState().error(`Devi selezionare almeno ${targetCount} Beyblade.`);
      return;
    }
    const poolCombos = combos.filter(c => selectedIds.has(c.id));
    onComplete(poolCombos);
  };

  const stats = useMemo(() => {
    let attack = 0, defense = 0, stamina = 0;
    combos.filter(c => selectedIds.has(c.id)).forEach(c => {
      const type = (c.combo_type || 'balance').toLowerCase();
      if (type === 'attack') attack++;
      else if (type === 'defense') defense++;
      else stamina++; // Stamina/Balance grouped
    });
    return { attack, defense, stamina };
  }, [selectedIds, combos]);

  if (loading) return <div className="text-center text-white/50 py-10 font-bold uppercase text-[10px]">Caricamento Collezione...</div>;

  const isReady = selectedIds.size >= targetCount;

  return (
    <div className="space-y-6">
      <div className="bg-[#12122A] p-6 rounded-[32px] border border-[#4361EE]/30 shadow-[0_0_20px_rgba(67,97,238,0.1)]">
        <h3 className="text-xl font-black text-white italic uppercase tracking-tighter mb-2">Componi la Pool</h3>
        <p className="text-xs text-white/50 font-medium mb-6">
          Seleziona almeno {targetCount} Beyblade dalla tua collezione per metterli in palio nella pool.
          (Modalità: {tournament.assignment_mode?.toUpperCase()})
        </p>

        {/* Progress & Stats */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          <div className="p-3 bg-white/5 rounded-2xl flex flex-col items-center justify-center border border-white/10">
            <div className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Totale</div>
            <div className={`text-xl font-black ${isReady ? 'text-green-400' : 'text-primary'}`}>
              {selectedIds.size} <span className="text-sm text-white/30">/ min {targetCount}</span>
            </div>
          </div>
          <div className="p-3 bg-red-500/10 rounded-2xl flex flex-col items-center justify-center border border-red-500/20">
            <Sword size={16} className="text-red-500 mb-1" />
            <div className="text-lg font-black text-white">{stats.attack}</div>
          </div>
          <div className="p-3 bg-blue-500/10 rounded-2xl flex flex-col items-center justify-center border border-blue-500/20">
            <Shield size={16} className="text-blue-500 mb-1" />
            <div className="text-lg font-black text-white">{stats.defense}</div>
          </div>
          <div className="p-3 bg-green-500/10 rounded-2xl flex flex-col items-center justify-center border border-green-500/20">
            <Wind size={16} className="text-green-500 mb-1" />
            <div className="text-lg font-black text-white">{stats.stamina}</div>
          </div>
        </div>

        <button
          onClick={handleConfirm}
          disabled={!isReady}
          className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all ${
            isReady 
              ? 'bg-[#4361EE] text-white shadow-[0_0_20px_rgba(67,97,238,0.4)] hover:bg-[#324fcf]' 
              : 'bg-white/5 text-white/20'
          }`}
        >
          {isReady ? `Conferma Pool (${selectedIds.size} Bey)` : `Seleziona almeno ${targetCount - selectedIds.size} Bey`}
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between px-2">
          <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest">La tua Collezione ({combos.length})</h4>
          {combos.length > 0 && (
            <button
              onClick={handleSelectAll}
              className="text-[10px] font-black text-[#4361EE] hover:text-[#324fcf] uppercase tracking-widest transition-colors py-1"
            >
              {selectedIds.size === combos.length ? 'Deseleziona Tutto' : 'Seleziona Tutto'}
            </button>
          )}
        </div>
        <div className="max-h-[500px] overflow-y-auto no-scrollbar grid grid-cols-2 gap-2.5 pr-1">
          {combos.map(c => {
            const isSelected = selectedIds.has(c.id);
            return (
              <div 
                key={c.id} 
                onClick={() => toggleSelection(c.id)}
                className="relative cursor-pointer transition-all active:scale-95 h-full"
              >
                <div className={`h-full transition-all ${isSelected ? 'ring-2 ring-[#4361EE] rounded-[24px] scale-[0.98]' : 'opacity-70 hover:opacity-100'}`}>
                  <SavedComboCard combo={c} onClick={() => {}} hideActions compactLayout />
                </div>
                {isSelected && (
                  <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-[#4361EE] rounded-full flex items-center justify-center shadow-lg border-2 border-[#0A0A1A] z-20">
                    <Check size={12} className="text-white" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
