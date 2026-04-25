import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Search, Save, X, Settings, Shield, Zap, Target, ArrowUpRight } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { PageContainer } from '../components/PageContainer';
import { useToastStore } from '../store/useToastStore';

const TABS = [
  { id: 'blades', label: 'Blades', icon: Shield },
  { id: 'ratchets', label: 'Ratchets', icon: Settings },
  { id: 'bits', label: 'Bits', icon: Target },
];

export default function Admin() {
  const [activeTab, setActiveTab] = useState('blades');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingItem, setEditingItem] = useState(null); // null means list view, {} means new, {data} means editing

  useEffect(() => {
    fetchItems();
  }, [activeTab]);

  async function fetchItems() {
    setLoading(true);
    const { data } = await supabase.from(activeTab).select('*').order('name');
    setItems(data || []);
    setLoading(false);
  }

  async function handleDelete(id) {
    const toast = useToastStore.getState();
    if (!window.confirm('Sei sicuro di voler eliminare questo componente?')) return;
    const { error } = await supabase.from(activeTab).delete().eq('id', id);
    if (!error) {
      toast.success('Componente eliminato');
      fetchItems();
    } else {
      toast.error('Errore: ' + error.message);
    }
  }

  async function handleSave(formData) {
    const toast = useToastStore.getState();
    const table = activeTab;
    const isEditing = !!editingItem.id;
    
    const { error } = isEditing 
      ? await supabase.from(table).update(formData).eq('id', editingItem.id)
      : await supabase.from(table).insert([formData]);

    if (!error) {
      setEditingItem(null);
      fetchItems();
      toast.success(isEditing ? 'Componente aggiornato' : 'Nuovo componente aggiunto');
    } else {
      toast.error('Salvataggio negato: ' + error.message);
    }
  }

  const filteredItems = items.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase()) || 
    i.release_code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageContainer className="px-4 pt-6">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-[3px] h-5 bg-[#F5A623]" />
          <div className="text-[11px] font-black text-white tracking-[0.2em] uppercase">Control Center</div>
        </div>
        <div className="flex justify-between items-end">
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">Admin Panel</h1>
          <button 
            onClick={() => setEditingItem({})}
            className="w-12 h-12 rounded-2xl bg-[#F5A623] shadow-lg shadow-[#F5A623]/20 flex items-center justify-center text-[#0A0A1A]"
          >
            <Plus size={24} strokeWidth={3} />
          </button>
        </div>
      </div>

      {editingItem ? (
        <PartForm 
          type={activeTab} 
          initialData={editingItem} 
          onSave={handleSave} 
          onCancel={() => setEditingItem(null)} 
        />
      ) : (
        <>
          {/* Tabs */}
          <div className="flex bg-white/5 rounded-2xl p-1 mb-6 border border-white/5">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest flex items-center justify-center gap-2 transition-all ${
                    activeTab === tab.id ? 'bg-[#F5A623] text-[#0A0A1A] shadow-glow-primary' : 'text-white/30'
                  }`}
                >
                  <Icon size={14} /> {tab.label.toUpperCase()}
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
            <input
              type="text"
              placeholder={`Cerca ${activeTab}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white text-sm font-bold outline-none focus:border-[#F5A623]/30 transition-all"
            />
          </div>

          {/* List */}
          <div className="space-y-3 pb-32">
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="h-24 bg-white/5 rounded-3xl animate-pulse" />)
            ) : filteredItems.map(item => (
              <div 
                key={item.id}
                className="bg-[#12122A] p-4 rounded-3xl border border-white/5 flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/10 p-2">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-contain" />
                    ) : (
                      <Settings className="text-white/10" size={24} />
                    )}
                  </div>
                  <div>
                    <h3 className="text-white font-black uppercase text-sm italic">{item.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{item.release_code || 'Speciale'}</span>
                      <div className="w-1 h-1 rounded-full bg-white/10" />
                      <span className="text-[9px] font-bold text-[#F5A623] uppercase">{item.type || activeTab.slice(0, -1)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setEditingItem(item)}
                    className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:bg-[#F5A623]/10 hover:text-[#F5A623] transition-all"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/10 hover:bg-red-500/10 hover:text-red-500 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </PageContainer>
  );
}

function PartForm({ type, initialData, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    release_code: '',
    image_url: '',
    type: 'Attack',
    weight: 35.0,
    sides: 3,
    height: 60,
    tip_shape: '',
    stats: { attack: 50, defense: 50, stamina: 50, burst: 50, mobility: 50 },
    ...initialData
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleStatChange = (stat, value) => {
    setFormData(prev => ({
      ...prev,
      stats: { ...prev.stats, [stat]: parseInt(value) }
    }));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-40"
    >
      <div className="flex items-center justify-between sticky top-0 py-2 bg-[#0A0A1A] z-20">
        <h2 className="text-xl font-black text-white italic uppercase">{initialData.id ? 'Modifica' : 'Nuovo'} {type.slice(0, -1)}</h2>
        <button onClick={onCancel} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40"><X /></button>
      </div>

      <div className="space-y-4">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-white/30 uppercase tracking-widest pl-1">Nome</label>
            <input 
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-[#F5A623]/30"
              value={formData.name}
              onChange={e => handleChange('name', e.target.value)}
              placeholder="es. Dran Sword"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-white/30 uppercase tracking-widest pl-1">Codice</label>
            <input 
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-[#F5A623]/30"
              value={formData.release_code}
              onChange={e => handleChange('release_code', e.target.value)}
              placeholder="es. BX-01"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[9px] font-black text-white/30 uppercase tracking-widest pl-1">URL Immagine</label>
          <input 
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-[#F5A623]/30"
            value={formData.image_url}
            onChange={e => handleChange('image_url', e.target.value)}
            placeholder="URL immagine componente..."
          />
        </div>

        {/* Type Specific Fields */}
        {type === 'blades' && (
          <>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className="text-[9px] font-black text-white/30 uppercase tracking-widest pl-1">Tipo</label>
                  <select 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none appearance-none"
                    value={formData.type}
                    onChange={e => handleChange('type', e.target.value)}
                  >
                    <option value="Attack">Attack</option>
                    <option value="Defense">Defense</option>
                    <option value="Stamina">Stamina</option>
                    <option value="Balance">Balance</option>
                  </select>
               </div>
               <div className="space-y-2">
                  <label className="text-[9px] font-black text-white/30 uppercase tracking-widest pl-1">Peso (g)</label>
                  <input 
                    type="number" step="0.1"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none"
                    value={formData.weight}
                    onChange={e => handleChange('weight', parseFloat(e.target.value))}
                  />
               </div>
            </div>
            {/* Stats Editor for Blades */}
            <div className="p-4 rounded-3xl bg-white/5 border border-white/5 space-y-4">
               <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block text-center mb-2">Statistiche Performance</label>
               {['attack', 'defense', 'stamina', 'burst', 'mobility'].map(stat => (
                 <div key={stat} className="flex items-center gap-4">
                    <span className="text-[9px] font-black uppercase text-white/40 w-16">{stat}</span>
                    <input 
                      type="range" min="0" max="120"
                      className="flex-1 accent-[#F5A623]"
                      value={formData.stats?.[stat] || 0}
                      onChange={e => handleStatChange(stat, e.target.value)}
                    />
                    <span className="text-xs font-black text-[#F5A623] w-8">{formData.stats?.[stat] || 0}</span>
                 </div>
               ))}
            </div>
          </>
        )}

        {type === 'ratchets' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-white/30 uppercase tracking-widest pl-1">Lati</label>
              <input 
                type="number"
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none"
                value={formData.sides}
                onChange={e => handleChange('sides', parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-white/30 uppercase tracking-widest pl-1">Altezza</label>
              <input 
                type="number"
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none"
                value={formData.height}
                onChange={e => handleChange('height', parseInt(e.target.value))}
              />
            </div>
          </div>
        )}

        {type === 'bits' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-white/30 uppercase tracking-widest pl-1">Tipo Bit</label>
              <select 
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none appearance-none"
                value={formData.type}
                onChange={e => handleChange('type', e.target.value)}
              >
                <option value="Attack">Attack</option>
                <option value="Defense">Defense</option>
                <option value="Stamina">Stamina</option>
                <option value="Balance">Balance</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-white/30 uppercase tracking-widest pl-1">Forma Punta</label>
              <input 
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none"
                value={formData.tip_shape}
                onChange={e => handleChange('tip_shape', e.target.value)}
                placeholder="es. Flat, Orb..."
              />
            </div>
          </div>
        )}
      </div>

      <div className="sticky bottom-8 left-0 right-0 px-2">
        <button 
          onClick={() => {
            // Cleanup data before save
            const finalData = { ...formData };
            if (type === 'blades') { delete finalData.sides; delete finalData.height; delete finalData.tip_shape; }
            if (type === 'ratchets') { delete finalData.weight; delete finalData.type; delete finalData.stats; delete finalData.tip_shape; }
            if (type === 'bits') { delete finalData.weight; delete finalData.sides; delete finalData.height; delete finalData.stats; }
            onSave(finalData);
          }}
          className="w-full py-5 rounded-[22px] bg-[#F5A623] text-[#0A0A1A] font-black text-xs tracking-[0.2em] uppercase shadow-lg shadow-[#F5A623]/20 flex items-center justify-center gap-3"
        >
          <Save size={18} /> Salva Componente
        </button>
      </div>
    </motion.div>
  );
}
