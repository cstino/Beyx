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

    setParts({ blades: b.data || [], ratchets: r.data || [], bits: bt.data || [] });
    setCollection(new Set(coll.data?.map(c => c.part_id)));
    setLoading(false);
  }

  const filteredParts = parts[activeType].filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

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

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Cerca parte..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-12 bg-white/5"
          />
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
      />
    </div>
  );
}
