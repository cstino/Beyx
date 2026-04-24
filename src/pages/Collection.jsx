import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Package, Check, Plus, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import PartCard from '../components/PartCard';
import PartDetailDrawer from '../components/PartDetailDrawer';

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
    // Note: for ratchets, type might be null, we handle it
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
      setActiveType(type);
      setSelectedPart(found);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-32">
      {/* Search & Tabs Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md pt-6 pb-4 px-4 border-b border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black uppercase tracking-tighter">Inventario Parti</h1>
          <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
            <Package size={14} className="text-primary" />
            <span className="text-[10px] font-black">{collection.size} / {parts.blades.length + parts.ratchets.length + parts.bits.length}</span>
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
              className="input-field pl-12 bg-white/5"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`p-3 rounded-xl border transition-all ${
              showFilters 
                ? 'bg-primary border-primary text-white shadow-glow-primary' 
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
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                activeType === type ? 'bg-primary text-white shadow-glow-primary' : 'text-slate-500'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* --- Advanced Filters Bar (Collapsible) --- */}
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-3 pb-2 pt-1 overflow-hidden"
            >
              {/* Tier Filter */}
              <div className="flex gap-2 min-w-max px-1 overflow-x-auto no-scrollbar">
                <span className="text-[8px] font-black uppercase text-white/20 self-center mr-1">Tier:</span>
                {['All', 'S', 'A', 'B', 'C'].map(t => (
                  <button 
                    key={t}
                    onClick={() => setFilterTier(t)}
                    className={`px-3 py-1 rounded-full text-[9px] font-black border transition-all ${
                      filterTier === t 
                        ? 'bg-white text-black border-white' 
                        : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Type Filter */}
              <div className="flex gap-2 min-w-max px-1 overflow-x-auto no-scrollbar">
                <span className="text-[8px] font-black uppercase text-white/20 self-center mr-1">Type:</span>
                {['All', 'Attack', 'Defense', 'Stamina', 'Balance'].map(t => (
                  <button 
                    key={t}
                    onClick={() => setFilterType(t)}
                    className={`px-3 py-1 rounded-full text-[9px] font-black border transition-all ${
                      filterType === t 
                        ? 'bg-white text-black border-white' 
                        : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Owned Filter */}
              <div className="flex gap-2 min-w-max px-1 overflow-x-auto no-scrollbar">
                <span className="text-[8px] font-black uppercase text-white/20 self-center mr-1">Coll:</span>
                {['All', 'Owned', 'Missing'].map(t => (
                  <button 
                    key={t}
                    onClick={() => setFilterOwned(t)}
                    className={`px-3 py-1 rounded-full text-[9px] font-black border transition-all ${
                      filterOwned === t 
                        ? 'bg-white text-black border-white' 
                        : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Grid Content */}
      <div className="p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-4">
            <Loader2 className="animate-spin text-primary" size={32} />
            <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Sincronizzazione Database...</p>
          </div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-2 gap-4"
          >
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
                    className={collection.has(part.id) ? 'border-primary/40' : 'border-white/5'}
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
    </div>
  );
}
