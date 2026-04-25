import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Package, Check, Plus, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import PartCard from '../components/PartCard';
import PartDetailDrawer from '../components/PartDetailDrawer';
import { PageContainer } from '../components/PageContainer';

export default function Collection() {
  const [parts, setParts] = useState({ blades: [], ratchets: [], bits: [] });
  const [collection, setCollection] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState('blades');
  const [selectedPart, setSelectedPart] = useState(null);
  const [filterTier, setFilterTier] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [filterOwned, setFilterOwned] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser();
    
    const [b, r, bt, coll] = await Promise.all([
      supabase.from('blades').select('*').order('name'),
      supabase.from('ratchets').select('*').order('name'),
      supabase.from('bits').select('*').order('name'),
      supabase.from('user_collections').select('part_id').eq('user_id', user.id)
    ]);

    setParts({ 
      blades: (b.data || []).map(p => ({ ...p, kind: 'blade' })), 
      ratchets: (r.data || []).map(p => ({ ...p, kind: 'ratchet' })), 
      bits: (bt.data || []).map(p => ({ ...p, kind: 'bit' })) 
    });
    setCollection(new Set(coll.data?.map(c => c.part_id)));
    setLoading(false);
  }

  const filteredParts = parts[activeType].filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchTier = filterTier === 'All' || p.tier === filterTier;
    const matchType = filterType === 'All' || p.type === filterType;
    const isOwned = collection.has(p.id);
    const matchOwned = filterOwned === 'All' || 
                      (filterOwned === 'Owned' && isOwned) || 
                      (filterOwned === 'Missing' && !isOwned);

    return matchSearch && matchTier && matchType && matchOwned;
  });
  
  const handleNavigatePart = (name, type) => {
    if (!name || name === '---') return;
    const found = parts[type].find(p => p.name.toLowerCase() === name.toLowerCase());
    if (found) {
      setActiveTabFromType(type);
      setSelectedPart(found);
    }
  };

  const setActiveTabFromType = (type) => {
    if (type === 'blade') setActiveType('blades');
    if (type === 'ratchet') setActiveType('ratchets');
    if (type === 'bit') setActiveType('bits');
  };

  return (
    <PageContainer>
      {/* Search & Tabs Header - Sticky below Layout header */}
      <header 
        className="sticky top-0 z-30 bg-[#0A0A1A] border-b border-white/5 space-y-4 pt-6 pb-6 px-4 shadow-lg"
      >
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black uppercase tracking-tighter italic">Inventario</h1>
          <div className="flex items-center gap-2 px-3 py-1 bg-[#4361EE]/10 rounded-full border border-[#4361EE]/20">
            <Package size={14} className="text-[#4361EE]" />
            <span className="text-[10px] font-black text-white">
                {collection.size} <span className="opacity-30">/ {parts.blades.length + parts.ratchets.length + parts.bits.length}</span>
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Cerca parte..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-12 bg-white/5 border border-white/5 rounded-xl pl-12 text-sm font-bold text-white placeholder:text-slate-600 focus:border-[#4361EE]/50 transition-all outline-none"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`p-3 rounded-xl border transition-all ${
              showFilters 
                ? 'bg-[#4361EE] border-[#4361EE] text-white shadow-glow-primary' 
                : 'bg-white/5 border-white/5 text-slate-400'
            }`}
          >
            <Filter size={20} />
          </button>
        </div>

        <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
          {['blades', 'ratchets', 'bits'].map((type) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                activeType === type ? 'bg-[#4361EE] text-white shadow-glow-primary' : 'text-slate-500'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-4 pb-2 pt-2 overflow-hidden border-t border-white/5"
            >
              {/* Filter groups ... (similar to before but cleaner) */}
              <div className="flex flex-col gap-3">
                 <FilterGroup label="Tier" items={['All', 'S', 'A', 'B', 'C']} active={filterTier} onChange={setFilterTier} />
                 <FilterGroup label="Type" items={['All', 'Attack', 'Defense', 'Stamina', 'Balance']} active={filterType} onChange={setFilterType} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Grid Content */}
      <div className="p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-4">
            <Loader2 className="animate-spin text-[#4361EE]" size={32} />
            <p className="text-[10px] font-black uppercase tracking-widest opacity-30">Caricamento...</p>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-2 gap-4">
            <AnimatePresence mode='popLayout'>
              {filteredParts.map((part) => (
                <motion.div
                  key={part.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <PartCard 
                    part={part} 
                    owned={collection.has(part.id)}
                    onClick={() => setSelectedPart(part)}
                    className={collection.has(part.id) ? 'border-[#4361EE]/40' : 'border-white/5'}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <PartDetailDrawer 
        part={selectedPart} 
        onClose={() => setSelectedPart(null)}
        onUpdate={fetchData}
        onNavigate={handleNavigatePart}
      />
    </PageContainer>
  );
}

function FilterGroup({ label, items, active, onChange }) {
    return (
        <div className="flex gap-2 min-w-max px-1 overflow-x-auto no-scrollbar items-center">
            <span className="text-[8px] font-black uppercase text-white/20 w-8">{label}:</span>
            {items.map(t => (
                <button 
                key={t}
                onClick={() => onChange(t)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black border transition-all ${
                    active === t 
                    ? 'bg-white text-black border-white' 
                    : 'bg-white/5 border-white/5 text-white/30 hover:bg-white/10'
                }`}
                >
                {t}
                </button>
            ))}
        </div>
    )
}
