import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Trash2, Gauge, Scale, Cpu } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import StatRadar from '../components/StatRadar';
import { PageContainer } from '../components/PageContainer';
import { motion } from 'framer-motion';

const TYPE_COLORS = {
  attack: '#E94560', defense: '#4361EE',
  stamina: '#F5A623', balance: '#A855F7',
};

export default function ComboDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [combo, setCombo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCombo() {
      const { data, error } = await supabase.from('combos')
        .select(`
          *,
          blade:blade_id(*),
          ratchet:ratchet_id(*),
          bit:bit_id(*)
        `)
        .eq('id', id)
        .single();
      
      if (error || !data) {
        navigate('/builder?view=saved');
        return;
      }
      setCombo(data);
      setLoading(false);
    }
    fetchCombo();
  }, [id, navigate]);

  if (loading || !combo) return (
    <div className="min-h-screen bg-[#0A0A1A] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#E94560] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const accentColor = TYPE_COLORS[combo.combo_type] ?? '#4361EE';
  const composedName = [
    combo.blade?.name, combo.ratchet?.name, combo.bit?.name,
  ].filter(Boolean).join(' ');

  // Compute final stats (blade base + ratchet/bit modifiers)
  const finalStats = computeFinalStats(combo);
  const totalWeight = (combo.blade?.weight ?? 0)
                    + (combo.ratchet?.weight ?? 0)
                    + (combo.bit?.weight ?? 0);

  async function handleDelete() {
    if (!confirm('Eliminare questo combo?')) return;
    await supabase.from('combos').delete().eq('id', id);
    navigate('/builder?view=saved');
  }

  return (
    <PageContainer>
      {/* Header with back button */}
      <div className="px-4 mb-8 flex items-center gap-4">
        <button onClick={() => navigate(-1)}
          className="p-3 rounded-2xl bg-white/5 text-white/50 border border-white/5 active:scale-95 transition-all">
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-black tracking-[0.3em] uppercase mb-1 flex items-center gap-2"
            style={{ color: accentColor }}>
            <span className="w-2 h-2 rounded-full" style={{ background: accentColor }} />
            {combo.combo_type}
          </div>
          <h1 className="text-2xl font-black uppercase text-white tracking-tighter italic truncate">
            {composedName || combo.name}
          </h1>
        </div>
        <button onClick={handleDelete}
          className="p-3 rounded-2xl bg-red-500/10 text-red-500/70 border border-red-500/10 hover:bg-red-500/20 transition-all">
          <Trash2 size={20} />
        </button>
      </div>

      {/* Radar chart Display */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 bg-[#12122A] rounded-[32px] p-8 mb-6 flex justify-center border border-white/5 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
        <StatRadar stats={finalStats} color={accentColor} size={280} />
      </motion.div>

      {/* Primary Attributes Grid */}
      <div className="grid grid-cols-2 gap-3 mx-4 mb-8">
        <MetaTile icon={<Gauge size={14} />} label="OVERALL"
          value={combo.overall_score?.toFixed(1) ?? '—'}
          accent={accentColor} />
        <MetaTile icon={<Scale size={14} />} label="WEIGHT"
          value={`${totalWeight.toFixed(1)}g`}
          accent={accentColor} />
      </div>

      {/* Detailed Part breakdown */}
      <div className="mx-4 space-y-3 mb-10">
        <h3 className="text-[10px] font-black text-white/30 tracking-[0.3em] uppercase pl-1 mb-4">Specifiche Componenti</h3>
        <PartRow label="BLADE"   part={combo.blade} type="attack" />
        <PartRow label="RATCHET" part={combo.ratchet} type="defense" />
        <PartRow label="BIT"     part={combo.bit} type="stamina" />
      </div>
    </PageContainer>
  );
}

function MetaTile({ icon, label, value, accent }) {
  return (
    <div className="bg-[#12122A] rounded-2xl p-4 border border-white/5"
      style={{ borderLeft: `4px solid ${accent}` }}>
      <div className="flex items-center gap-2 mb-2 opacity-40" style={{ color: accent }}>
        {icon}
        <div className="text-[9px] font-black tracking-[0.2em] uppercase">{label}</div>
      </div>
      <div className="text-white font-black text-2xl tabular-nums tracking-tighter">{value}</div>
    </div>
  );
}

function PartRow({ label, part, type }) {
  if (!part) return null;
  return (
    <div className="bg-[#12122A] rounded-2xl p-4 flex items-center gap-4 border border-white/5">
      <div className="w-14 h-14 rounded-xl bg-[#0A0A1A] flex items-center justify-center border border-white/5 flex-shrink-0">
        {part.image_url ? (
          <img src={part.image_url} alt={part.name}
            className="w-10 h-10 object-contain drop-shadow-glow" />
        ) : (
          <Cpu className="text-white/10" size={24} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[8px] text-white/30 font-black tracking-[0.3em] uppercase mb-1">
          {label}
        </div>
        <div className="text-white font-black text-base truncate uppercase italic tracking-tight">{part.name}</div>
      </div>
      <ChevronRight size={16} className="text-white/10" />
    </div>
  );
}

function computeFinalStats(combo) {
  const b = combo.blade?.attributes ?? {};
  const r = combo.ratchet?.stat_modifiers ?? {};
  const t = combo.bit?.stat_modifiers ?? {};
  const clamp = v => Math.max(1, Math.min(10, v));

  return {
    attack:           clamp((b.attack ?? 5) + (r.attack ?? 0) + (t.attack ?? 0)),
    defense:          clamp((b.defense ?? 5) + (r.defense ?? 0) + (t.defense ?? 0)),
    stamina:          clamp((b.stamina ?? 5) + (r.stamina ?? 0) + (t.stamina ?? 0)),
    burst_resistance: clamp((b.burst_resistance ?? 5)
                           + (r.burst_resistance ?? 0)
                           + (t.burst_resistance ?? 0)),
    dash_performance: clamp((b.dash_performance ?? 5)
                           + (r.dash_performance ?? 0)
                           + (t.dash_performance ?? 0)),
  };
}
