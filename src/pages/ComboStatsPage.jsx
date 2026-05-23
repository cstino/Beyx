import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { TrendingUp, Zap, Target, Flame, RotateCcw, Shield, Sword, Wind, Trophy, Swords, Skull, Palette, Check } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { PageContainer } from '../components/PageContainer';
import { useUIStore } from '../store/useUIStore';
import { useAuthStore } from '../store/useAuthStore';

const TYPE_COLORS = {
  Attack: { hex: '#ef4444', icon: Zap },
  Defense: { hex: '#3b82f6', icon: Shield },
  Stamina: { hex: '#22c55e', icon: Wind },
  Balance: { hex: '#eab308', icon: Sword },
};

const STAT_CARDS = [
  { key: 'points', label: 'Punti', color: '#9b59b6', icon: Trophy },
  { key: 'wins', label: 'Vittorie', color: '#22c55e', icon: Swords },
  { key: 'losses', label: 'Sconfitte', color: '#ef4444', icon: Skull },
  { key: 'winRate', label: 'Win Rate', color: '#3b82f6', icon: TrendingUp, suffix: '%' },
];

const BAR_COLORS = {
  extreme: { hex: '#F5A623', glow: '#FFD166' },
  ko: { hex: '#4361EE', glow: '#8194FF' },
  burst: { hex: '#E94560', glow: '#FF6B81' },
  spin: { hex: '#00D68F', glow: '#3DFFBF' },
};

const BAR_ICONS = {
  extreme: Flame,
  ko: Target,
  burst: Zap,
  spin: RotateCcw,
};

function StatCard({ label, value, color, icon: Icon, suffix, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 overflow-hidden"
      style={{ borderTopColor: color, borderTopWidth: 2 }}
    >
      <div className="p-3 flex flex-col items-center gap-1">
        <Icon size={16} style={{ color }} />
        <CountUp
          end={value}
          suffix={suffix || ''}
          duration={1.5}
          delay={index * 0.1}
          className="text-lg font-black text-white font-createfuture"
        />
        <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">{label}</span>
      </div>
    </motion.div>
  );
}

function CometBar({ label, count, max, color, glowColor, index, totalLabel }) {
  const Icon = BAR_ICONS[label.toLowerCase()] || Flame;
  const pct = max > 0 ? (count / max) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="flex items-center gap-2"
    >
      <Icon size={14} style={{ color }} className="shrink-0" />
      <span className="text-[9px] font-black text-white/50 uppercase w-12 shrink-0">{label}</span>
      <div className="flex-1 relative h-3">
        <div className="absolute inset-0 bg-white/10 rounded-full" />
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: `linear-gradient(to right, ${color}cc, ${glowColor})`,
            boxShadow: `0 0 8px ${glowColor}66`,
          }}
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.3 + index * 0.08, ease: 'easeOut' }}
        />
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full blur-[2px]"
          style={{
            backgroundColor: glowColor,
            boxShadow: `0 0 10px ${glowColor}`,
          }}
          initial={{ left: 0, opacity: 0 }}
          whileInView={{ left: `calc(${pct}% - 5px)`, opacity: pct > 0 ? 1 : 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.3 + index * 0.08, ease: 'easeOut' }}
        />
      </div>
      <span className="text-[10px] font-black text-white/60 tabular-nums w-5 text-right">{count}</span>
    </motion.div>
  );
}

function WinRateDonut({ value, color, glowColor }) {
  const r = 58;
  const circumference = 2 * Math.PI * r;
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[156px] h-[156px]">
        <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
          <defs>
            <linearGradient id="donutGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={color} />
              <stop offset="100%" stopColor={glowColor} />
            </linearGradient>
            <filter id="donutGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle
            cx="70"
            cy="70"
            r={r}
            fill="none"
            stroke="white"
            strokeOpacity="0.08"
            strokeWidth="10"
          />
          <circle
            cx="70"
            cy="70"
            r={r}
            fill="none"
            stroke="url(#donutGradient)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={animated ? circumference * (1 - value / 100) : circumference}
            filter="url(#donutGlow)"
            style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <CountUp
            end={value}
            suffix="%"
            decimals={1}
            duration={1.5}
            delay={0.5}
            className="text-2xl font-black text-white font-createfuture"
          />
          <span className="text-[8px] font-black text-white/30 uppercase tracking-widest mt-0.5">WIN RATE</span>
        </div>
      </div>
      <div
        className="absolute w-[156px] h-[156px] rounded-full blur-xl opacity-20 pointer-events-none"
        style={{ background: `conic-gradient(${color}, ${glowColor}, ${color})` }}
      />
    </div>
  );
}

export default function ComboStatsPage() {
  const { name } = useParams();
  const navigate = useNavigate();
  const { setHeader, clearHeader } = useUIStore();
  const [combo, setCombo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bladeInfo, setBladeInfo] = useState(null);

  const isAdmin = useAuthStore(s =>
    s.user?.email === 'cr.96bc@gmail.com'
    || s.user?.email === 'hcskso96@gmail.com'
    || s.profile?.is_admin
  );

  const decodedName = decodeURIComponent(name || '');

  useEffect(() => {
    setHeader('DETTAGLIO COMBO', '/combo-leaderboard');
    return () => clearHeader();
  }, [setHeader, clearHeader]);

  useEffect(() => {
    loadCombo();
  }, [decodedName]);

  async function loadCombo() {
    setLoading(true);
    const { data } = await supabase.rpc('combo_points_leaderboard', { p_min_battles: 0 });
    const found = (data || []).find(c => c.combo_name === decodedName);
    setCombo(found || null);

    if (found && found.blade_name) {
      const { data: bData } = await supabase
        .from('blades')
        .select('id, variants, active_variant_index')
        .eq('name', found.blade_name)
        .single();
      if (bData && bData.variants && Array.isArray(bData.variants) && bData.variants.length > 0) {
        setBladeInfo(bData);
      }
    }

    setLoading(false);
  }

  if (loading) return (
    <PageContainer>
      <div className="flex justify-center p-20"><div className="w-8 h-8 border-2 border-[#9b59b6] border-t-transparent rounded-full animate-spin" /></div>
    </PageContainer>
  );

  if (!combo) return (
    <PageContainer>
      <div className="text-center pt-20">
        <div className="text-white/30 text-sm font-bold uppercase">Combo non trovata</div>
        <button onClick={() => navigate('/combo-leaderboard')} className="mt-4 text-[#9b59b6] text-[10px] font-black uppercase tracking-widest">Torna alla classifica</button>
      </div>
    </PageContainer>
  );

  const typeInfo = TYPE_COLORS[combo.blade_type] || TYPE_COLORS.Attack;
  const typeColor = typeInfo.hex;
  const glowColor = typeInfo.hex + '99';

  const totalWins = combo.wins || 0;
  const totalLosses = combo.losses || 0;
  const totalDraws = combo.draws || 0;
  const totalRounds = combo.total_rounds || 1;
  const winRate = typeof combo.win_rate === 'number' ? combo.win_rate : parseFloat(combo.win_rate) || 0;

  const winBreakdown = [
    { key: 'extreme', label: 'Xtreme', count: combo.extreme_wins || 0 },
    { key: 'ko', label: 'KO', count: combo.ko_wins || 0 },
    { key: 'burst', label: 'Burst', count: combo.burst_wins || 0 },
    { key: 'spin', label: 'Spin', count: combo.spin_wins || 0 },
  ];

  const lossBreakdown = [
    { key: 'extreme', label: 'Xtreme', count: combo.extreme_losses || 0 },
    { key: 'ko', label: 'KO', count: combo.ko_losses || 0 },
    { key: 'burst', label: 'Burst', count: combo.burst_losses || 0 },
    { key: 'spin', label: 'Spin', count: combo.spin_losses || 0 },
  ];

  const maxWinCount = Math.max(...winBreakdown.map(w => w.count), 1);
  const maxLossCount = Math.max(...lossBreakdown.map(l => l.count), 1);

  const TypeIcon = typeInfo.icon;
  const variants = bladeInfo?.variants || [];
  const activeIndex = bladeInfo?.active_variant_index ?? null;

  async function setActiveVariant(index) {
    if (!bladeInfo) return;
    const { error } = await supabase
      .from('blades')
      .update({ active_variant_index: index })
      .eq('id', bladeInfo.id);
    if (!error) {
      setBladeInfo({ ...bladeInfo, active_variant_index: index });
      // Refresh combo data to get updated blade_image_url
      loadCombo();
    }
  }

  return (
    <PageContainer>
      {/* Background radial glow */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{ background: `radial-gradient(ellipse 60% 50% at 50% 20%, ${typeColor}0F, transparent 60%)` }}
      />

      <div className="px-4 mb-6 pt-2 relative z-10">
        {/* HERO SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="flex flex-col items-center pt-6 pb-10"
        >
          {/* Radial glow behind image */}
          <div className="relative">
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full animate-pulse-slow"
              style={{ background: `radial-gradient(circle, ${typeColor}33, transparent 70%)` }}
            />
            {combo.blade_image_url ? (
              <img
                src={combo.blade_image_url}
                alt={combo.combo_name}
                className="relative z-10 w-36 h-36 object-contain drop-shadow-[0_0_30px_#00000066] animate-float"
              />
            ) : (
              <div className="relative z-10 w-36 h-36 rounded-full bg-white/5 flex items-center justify-center animate-float border border-white/10">
                <TypeIcon size={56} style={{ color: typeColor, opacity: 0.5 }} />
              </div>
            )}
          </div>

          {/* Name */}
          <h1 className="text-xl font-black text-white uppercase italic font-createfuture mt-4 text-center">
            {combo.blade_name || combo.combo_name}
          </h1>

          {/* Type badge + Score pill */}
          <div className="flex items-center gap-3 mt-3">
            <span
              className="text-[9px] font-black px-3 py-1 rounded-full uppercase flex items-center gap-1"
              style={{ backgroundColor: typeColor + '20', color: typeColor, borderColor: typeColor + '40', borderWidth: 1 }}
            >
              <TypeIcon size={12} />
              {combo.blade_type || 'Unknown'}
            </span>
            <span
              className="text-[9px] font-black px-3 py-1 rounded-full uppercase"
              style={{ backgroundColor: typeColor + '15', color: typeColor, borderColor: typeColor + '30', borderWidth: 1 }}
            >
              {combo.points || 0} PUNTI
            </span>
          </div>
        </motion.div>

        {/* VARIANT SELECTOR (admin only) */}
        {isAdmin && variants.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Palette size={12} className="text-white/30" />
              <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] font-createfuture">Varianti</span>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              <button
                onClick={() => setActiveVariant(null)}
                className={`shrink-0 w-14 h-14 rounded-xl flex items-center justify-center border transition-all ${
                  activeIndex === null
                    ? 'border-' + typeColor + ' shadow-[0_0_12px_' + typeColor + '44] scale-105'
                    : 'border-white/10 opacity-50 hover:opacity-80 hover:border-white/20'
                }`}
                style={activeIndex === null ? { borderColor: typeColor, boxShadow: `0 0 12px ${typeColor}44` } : {}}
              >
                <span className="text-[7px] font-black text-white/30 uppercase">Default</span>
              </button>
              {variants.map((v, i) => (
                <button
                  key={i}
                  onClick={() => setActiveVariant(i)}
                  className={`shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-white/5 flex items-center justify-center border transition-all relative ${
                    activeIndex === i
                      ? 'scale-105'
                      : 'border-white/10 opacity-50 hover:opacity-80 hover:border-white/20'
                  }`}
                  style={activeIndex === i ? { borderColor: typeColor, boxShadow: `0 0 12px ${typeColor}44` } : {}}
                >
                  {v.image_url ? (
                    <img src={v.image_url} alt={v.release_code} className="w-full h-full object-contain p-1" />
                  ) : (
                    <span className="text-[7px] font-black text-white/20 uppercase px-1 text-center leading-tight">{v.release_code}</span>
                  )}
                  {activeIndex === i && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#22c55e] flex items-center justify-center">
                      <Check size={10} className="text-white" strokeWidth={3} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* STATS CARDS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="grid grid-cols-4 gap-2 mb-4"
        >
          <StatCard label="Punti" value={combo.points || 0} color="#9b59b6" icon={Trophy} index={0} />
          <StatCard label="Vittorie" value={totalWins} color="#22c55e" icon={Swords} index={1} />
          <StatCard label="Sconfitte" value={totalLosses} color="#ef4444" icon={Skull} index={2} />
          <StatCard label="Win Rate" value={winRate} color="#3b82f6" icon={TrendingUp} suffix="%" index={3} />
        </motion.div>

        {/* WIN RATE DONUT + SUMMARY */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Donut */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="rounded-[28px] bg-white/5 backdrop-blur-md border border-white/10 p-5 flex flex-col items-center justify-center relative"
          >
            <WinRateDonut value={winRate} color={typeColor} glowColor={glowColor} />
          </motion.div>

          {/* Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="rounded-[28px] bg-white/5 backdrop-blur-md border border-white/10 p-4"
          >
            <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-3 font-createfuture">Riepilogo</h3>
            <div className="grid grid-cols-1 gap-2">
              {[
                { label: 'Round Totali', value: totalRounds, color: '#ffffff' },
                { label: 'Pareggi', value: totalDraws, color: '#eab308' },
                { label: 'Win Rate', value: winRate, color: typeColor, suffix: '%' },
                { label: 'Punteggio', value: combo.points || 0, color: '#9b59b6', suffix: ' pts' },
              ].map((item, i) => (
                <div key={item.label} className="flex justify-between items-center p-2 bg-white/[0.03] rounded-xl border border-white/5">
                  <span className="text-[9px] font-bold text-white/40 uppercase">{item.label}</span>
                  <span className="text-[11px] font-black font-createfuture" style={{ color: item.color }}>
                    {item.suffix ? <>{item.value}{item.suffix}</> : item.value}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* VICTORY BREAKDOWN */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-[#12122A] rounded-3xl border border-white/5 p-5 mb-4"
        >
          <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4 font-createfuture">
            Analisi Vittorie ({totalWins})
          </h3>
          <div className="space-y-3">
            {winBreakdown.map((w, i) => (
              <CometBar
                key={w.key}
                label={w.label}
                count={w.count}
                max={maxWinCount}
                color={BAR_COLORS[w.key].hex}
                glowColor={BAR_COLORS[w.key].glow}
                index={i}
              />
            ))}
          </div>
        </motion.div>

        {/* LOSS BREAKDOWN */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-[#12122A] rounded-3xl border border-white/5 p-5"
        >
          <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4 font-createfuture">
            Analisi Sconfitte ({totalLosses})
          </h3>
          <div className="space-y-3">
            {lossBreakdown.map((l, i) => (
              <CometBar
                key={l.key}
                label={l.label}
                count={l.count}
                max={maxLossCount}
                color={BAR_COLORS[l.key].hex}
                glowColor={BAR_COLORS[l.key].glow}
                index={i}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </PageContainer>
  );
}
