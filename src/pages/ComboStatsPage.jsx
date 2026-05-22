import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import CountUp from 'react-countup';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Legend
} from 'recharts';
import {
  ChevronLeft, TrendingUp, Zap, Target, Flame, RotateCcw,
  Trophy, BarChart3, Gauge, Swords, Edit2, Shield
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { PageContainer } from '../components/PageContainer';
import { ExpertReviewModal } from '../components/ExpertReviewModal';
import { useUIStore } from '../store/useUIStore';

/* ══ Color spec: red=Attack / blue=Defense / green=Stamina / yellow=Balance ══ */
const TYPE_COLORS = {
  Attack:  { glow: 'rgba(244,63,94,0.38)', solid: '#F43F5E', light: 'rgba(244,63,94,0.12)' },
  Defense: { glow: 'rgba(59,130,246,0.38)', solid: '#4361EE', light: 'rgba(67,97,238,0.10)' },
  Stamina: { glow: 'rgba(0,214,143,0.38)',  solid: '#00D68F', light: 'rgba(0,214,143,0.08)' },
  Balance: { glow: 'rgba(155,89,182,0.38)', solid: '#9b59b6', light: 'rgba(155,89,182,0.08)' },
};

const CAT_CONFIG = {
  Extreme: { bar: '#F5A623', label: 'Xtreme', wKey: 'extreme_wins',   lKey: 'extreme_losses' },
  KO:      { bar: '#4361EE', label: 'KO',      wKey: 'ko_wins',        lKey: 'ko_losses'      },
  Burst:   { bar: '#E94560', label: 'Burst',   wKey: 'burst_wins',     lKey: 'burst_losses'   },
  Spin:    { bar: '#00D68F', label: 'Spin',    wKey: 'spin_wins',      lKey: 'spin_losses'    },
};
const CAT_ORDER = ['Extreme', 'KO', 'Burst', 'Spin'];

const fadeSlideUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
};

function InView({ children, once = true, margin = '-80px' }) {
  const ref  = useRef(null);
  const seen = useInView(ref, { once, margin });
  return <div ref={ref}>{typeof children === 'function' ? children(seen) : children}</div>;
}

/* ══ Background — colored radial gradient per type ══ */
function GenreBg({ type }) {
  const tc = TYPE_COLORS[type] || TYPE_COLORS.Balance;
  return (
    <motion.div
      className="fixed inset-0 -z-10 pointer-events-none"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}
    >
      <div className="absolute inset-0 bg-[#0A0A1A]" />
      <div className="absolute inset-0" style={{
        background: `
          radial-gradient(ellipse 75% 60% at 50% -20%, ${tc.glow}  0%, transparent 65%),
          radial-gradient(ellipse 40% 50% at 80% 100%, ${tc.light} 0%, transparent 60%),
          radial-gradient(ellipse 30% 40% at 5%  80%, ${tc.light} 0%, transparent 55%)
        `,
      }} />
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.016)_1px,transparent_1px)]" />
    </motion.div>
  );
}

/* ══ Stat Card — glassmorphism + CountUp ══ */
function StatCard({ label, value, typeColor, icon: Icon, suffix = '', delay, inView }) {
  const tc = TYPE_COLORS[typeColor] || TYPE_COLORS.Balance;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.04, y: -2 }}
      whileTap={{ scale: 0.97 }}
      className="glass-card p-4 flex flex-col items-center gap-1.5 justify-center ring-1 backdrop-blur-xl relative overflow-hidden"
      style={{ background: `linear-gradient(160deg, ${tc.light} 0%, rgba(0,0,0,0) 80%)` }}
    >
      <div className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, transparent, ${tc.solid}, transparent)`, opacity: 0.6 }}
      />
      <Icon size={20} style={{ color: tc.solid }} />
      {inView ? (
        <CountUp start={0} end={value} duration={1.6} delay={delay} suffix={suffix} separator=","
          style={{ fontWeight: 900 }} />
      ) : (
        <span className="text-2xl font-black tabular-nums" style={{ color: tc.solid }}>
          {typeof value === 'number' ? value.toLocaleString() : value}{suffix}
        </span>
      )}
      <span className="text-[9px] font-black uppercase tracking-[0.15em] text-white/35">{label}</span>
    </motion.div>
  );
}

/* ══ Radar Chart — wins (viola) + losses (rosso tratteggiato) ══ */
function ProfileRadar({ radarData }) {
  return (
    <motion.section
      initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
      variants={fadeSlideUp} className="glass-card p-6"
    >
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25 font-createfuture mb-4 flex items-center gap-2">
        <Target size={13} /> Profilo Combo
      </h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData}>
            <PolarGrid stroke="rgba(255,255,255,0.07)" strokeDasharray="3 3" />
            <PolarAngleAxis
              dataKey="categoria"
              tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 900, fontFamily: 'CreateFuture' }}
            />
            <PolarRadiusAxis angle={30} domain={[0,100]}
              tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }} />
            <Radar name="Vittorie"  dataKey="wins"   stroke="#9b59b6" fill="#9b59b6" fillOpacity={0.38} strokeWidth={2.5} />
            <Radar name="Sconfitte" dataKey="losses" stroke="rgba(239,68,68,0.65)" fill="rgba(239,68,68,0.10)" strokeWidth={1.5} strokeDasharray="5 3" />
            <Legend
              verticalAlign="bottom"
              content={({ payload }) => (
                <div className="flex justify-center gap-8 pt-1">
                  {payload?.map((p, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full"
                        style={{ background: p.dataKey === 'wins' ? '#9b59b6' : 'rgba(239,68,68,0.65)',
                          border: p.dataKey === 'losses' ? '1.5px dashed rgba(239,68,68,0.4)' : 'none' }}
                      />
                      <span className="text-[10px] font-black uppercase text-white/45 font-createfuture">{p.value}</span>
                    </div>
                  ))}
                </div>
              )}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </motion.section>
  );
}

/* ══ Donut Win Rate (SVG-based, recharts-free) ══ */
function WinRateDonut({ winRate, typeColor }) {
  const circ = 283; // 2π × r45 ≈ 283
  const progress = Math.max(0, Math.min(100, winRate || 0)) / 100;
  return (
    <motion.section
      initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
      variants={fadeSlideUp} className="glass-card p-6"
    >
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25 font-createfuture mb-4 flex items-center gap-2">
        <TrendingUp size={13} /> Win Rate
      </h3>
      <div className="flex items-center gap-5">
        <div className="h-36 w-36 shrink-0 relative">
          <svg className="-rotate-90" width="144" height="144" viewBox="0 0 100 100">
            {/* Track ring */}
            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.06)"
              strokeWidth="8" />
            {/* Progress ring */}
            <motion.circle
              cx="50" cy="50" r="45" fill="none" stroke={typeColor} strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${circ * progress} ${circ}`}
              animate={{ strokeDasharray: [`0 ${circ}`, `${circ * progress} ${circ}`] }}
              transition={{ delay: 0.3, duration: 1.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            />
          </svg>
          <motion.div className="absolute inset-0 flex items-center justify-center"
            initial={{ scale: 0.4, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5, ease: 'backOut(1.3)' }}
          >
            <CountUp end={winRate || 0} duration={1.3} delay={0.3} suffix="%"
              style={{ color: typeColor, fontWeight: 900, fontSize: '1.55rem' }} />
          </motion.div>
        </div>
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: '#9b59b6' }} />
            <span className="text-[11px] text-white/50 font-bold uppercase">Vittorie</span>
            <span className="text-[11px] font-black text-white ml-auto tabular-nums">{winRate || 0}%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: 'rgba(239,68,68,0.6)' }}/>
            <span className="text-[11px] text-white/50 font-bold uppercase">Sconfitte</span>
            <span className="text-[11px] font-black text-white ml-auto tabular-nums">{100 - (winRate || 0)}%</span>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

/* ══ Animated Win/Loss Bar per category ══ */
function CatBarRow({ cat, wins, losses, delay, barColor }) {
  const total  = wins + losses || 1;
  const winPct = Math.round((wins / total) * 100);
  const losPct = 100 - winPct;
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay }}
      className="flex flex-col gap-1.5"
    >
      <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.1em] text-white/35">
        <span>{cat}</span>
        <span><span className="font-black text-white tabular-nums">{wins}</span> / {wins + losses}</span>
      </div>
      <div className="flex h-3.5 bg-white/[0.04] rounded-full overflow-hidden ring-1 ring-white/[0.04]">
        <motion.div className="h-full rounded-l-full"
          initial={{ width: 0 }}
          whileInView={{ width: `${winPct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, delay: delay + 0.12, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ backgroundColor: barColor }}
        />
        <motion.div className="h-full rounded-r-full"
          initial={{ width: 0 }}
          whileInView={{ width: `${losPct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, delay: delay + 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ backgroundColor: 'rgba(239,68,68,0.45)' }}
        />
      </div>
    </motion.div>
  );
}

/* ══ Summary Card ══ */
function SummaryCard({ totalWins, totalLosses, totalRounds, totalDraws, winRate, typeColor }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="glass-card p-6"
    >
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25 font-createfuture mb-5">Riepilogo</h3>
      <div className="grid grid-cols-4 gap-2.5">
        {[
          { label: 'Partite',  v: totalRounds  },
          { label: 'Vittorie', v: totalWins    },
          { label: 'Sconfitte',v: totalLosses  },
          { label: 'Pareggi',  v: totalDraws   },
        ].map((item, i) => (
          <div key={item.label} className="flex flex-col items-center gap-1.5 bg-white/[0.02] rounded-2xl p-4 border border-white/[0.04]">
            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-white/25">{item.label}</span>
            <CountUp start={0} end={item.v} duration={1.5} delay={0.04 * i} separator=","
              style={{ fontWeight: 900 }}
            />
          </div>
        ))}
      </div>
      <div className="mt-5">
        <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.12em] mb-2">
          <span className="text-[#9b59b6]/60 font-createfuture">Win Rate</span>
          <CountUp end={winRate} duration={1.3} delay={0.18} suffix="%"
            style={{ color: typeColor, fontWeight: 900 }} />
        </div>
        <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden ring-1 ring-white/[0.04]">
          <motion.div className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${typeColor}70, ${typeColor})` }}
            initial={{ width: 0 }}
            whileInView={{ width: `${winRate}%` }}
            viewport={{ once: true }}
            transition={{ duration: 1.1, delay: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
          />
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════════ */
export default function ComboStatsPage() {
  const { name }   = useParams();
  const navigate   = useNavigate();
  const { setHeader, clearHeader } = useUIStore();

  const [combo,     setCombo]     = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [reviewOpen,setReviewOpen] = useState(false);

  useEffect(() => {
    setHeader('DETTAGLIO COMBO', '/combo-leaderboard');
    return () => clearHeader();
  }, [setHeader, clearHeader]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const { data } = await supabase.rpc('combo_points_leaderboard', { p_min_battles: 0 });
        const found = (data || []).find(c => c.combo_name === decodeURIComponent(name || ''));
        if (!found) { if (!cancelled) setError('Combo non trovata'); setLoading(false); return; }
        if (cancelled) return;
        setCombo(found);
      } catch (err) { if (!cancelled) setError(err.message); }
      finally      { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [name]);

  const type = combo?.blade_type || 'Balance';
  const tc   = TYPE_COLORS[type]  || TYPE_COLORS.Balance;

  const mainStats = useMemo(() => ({
    pts:     combo?.points    || 0,
    wins:    combo?.wins      || 0,
    losses:  combo?.losses    || 0,
    wr:      combo?.win_rate ? Math.round(combo.win_rate * 10) / 10 : 0,
  }), [combo]);

  const totalRounds = combo?.total_rounds || mainStats.wins + mainStats.losses + (combo?.draws || 0);
  const totalDraws  = combo?.draws      || 0;

  /* Radar data — always defined so recharts never gets null data */
  const radarData = useMemo(() => {
    if (!combo) return [];
    return CAT_ORDER.map(cat => {
      const cfg = CAT_CONFIG[cat];
      const w = Number(combo?.[cfg.wKey]) || 0;
      const l = Number(combo?.[cfg.lKey]) || 0;
      const t = w + l || 1;
      return { categoria: cfg.label, wins: Math.round(w / t * 100), losses: Math.round(l / t * 100) };
    });
  }, [combo]);

  const catBars = useMemo(() =>
    CAT_ORDER.map(cat => {
      const cfg = CAT_CONFIG[cat];
      return { cat: cfg.label, bar: cfg.bar, wins: combo?.[cfg.wKey] || 0, losses: combo?.[cfg.lKey] || 0 };
    }),
  [combo]);

  /* ── Loading ── */
  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="text-center space-y-4">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-10 h-10 border-3 rounded-full mx-auto"
              style={{ borderColor: `${tc.solid}30`, borderTopColor: tc.solid }}
            />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25">Caricamento dati…</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  /* ── Error ── */
  if (error || !combo) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center gap-5 pt-20 px-6 min-h-[80vh]">
          <BarChart3 size={40} className="text-white/15" />
          <p className="text-white/35 text-sm font-black uppercase tracking-wider">Combo non trovata</p>
          <button onClick={() => navigate('/combo-leaderboard')}
            className="px-7 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] text-white shadow-glow-primary"
            style={{ background: tc.solid }}
          >Torna alla Classifica</button>
        </div>
      </PageContainer>
    );
  }

  /* ── Render ── */
  return (
    <>
      <GenreBg type={type} />

      <PageContainer className="pb-28">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>

          {/* ══ HERO ══ */}
          <motion.section
            className="relative flex flex-col items-center pt-10 pb-2"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* Back */}
            <div className="absolute top-4 left-0 flex items-center gap-1.5">
              <button onClick={() => navigate('/combo-leaderboard')}
                className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.08em] text-white/40 hover:text-white transition-colors"
              >
                <ChevronLeft size={13} /> Classifica
              </button>
            </div>

            {/* Glow aura */}
            <motion.div
              className="absolute w-60 h-64 rounded-full blur-[90px] -z-10 pointer-events-none"
              style={{ backgroundColor: tc.glow }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.55, 0.85, 0.55] }}
              transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
            />

            {/* Image — float + glow ring */}
            <motion.div
              className="relative w-[min(22rem,80vw)] h-[15rem] flex items-center justify-center"
              animate={{ y: [-12, -22, -12] }}
              transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
            >
              <motion.div className="absolute inset-0 rounded-[28px]"
                style={{ background: `conic-gradient(from 180deg at 50% 50%, transparent 25%, ${tc.light} 50%, transparent 75%)` }}
                animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 9, ease: 'linear' }}
              />
              <motion.div className="absolute w-full h-full rounded-[28px]"
                style={{ boxShadow: `0 0 48px 0 ${tc.glow}, inset 0 0 20px ${tc.light}` }}
              />
              {combo.blade_image_url && (
                <img
                  src={combo.blade_image_url}
                  alt={combo.combo_name}
                  className="relative z-10 w-full h-full object-contain"
                  onError={e => { e.currentTarget.style.visibility = 'hidden'; }}
                />
              )}
            </motion.div>

            {/* Name */}
            <h1 className="mt-6 text-[1.65rem] font-black font-display italic uppercase tracking-tight text-white text-center
              max-w-[18rem] leading-[1.1]">
              {combo.combo_name}
            </h1>

            {/* Type badge */}
            <motion.span
              initial={{ scale: 0.82, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 320, damping: 15 }}
              className="mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-black
                uppercase tracking-[0.1em] backdrop-blur-sm border"
              style={{ background: `${tc.solid}15`, color: tc.solid, borderColor: `${tc.solid}30` }}
            >
              <motion.span
                animate={{ rotate: [0, 10, -8, 0] }}
                transition={{ repeat: Infinity, repeatType: 'loop', duration: 2.5 }}
                style={{ display: 'inline-flex', lineHeight: 1 }}
              >
                {type === 'Attack'  && <Zap       size={13} />}
                {type === 'Defense' && <Shield    size={13} />}
                {type === 'Stamina' && <RotateCcw size={13} />}
                {type === 'Balance' && <Target    size={13} />}
              </motion.span>
              {type}
            </motion.span>

            {/* Score pill */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.52 }}
              className="mt-4 inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full
                bg-white/[0.04] backdrop-blur-xl border border-white/10"
            >
              <Trophy size={14} style={{ color: tc.solid }} />
              <span className="text-[10px] font-black text-white/25 uppercase tracking-[0.1em]">Pts</span>
              <span className="font-black text-white tabular-nums">
                <CountUp start={0} end={mainStats.pts} duration={1.6} delay={0.52} separator="," />
              </span>
              {typeof combo.user_rating === 'number' && (
                <>
                  <div className="w-px h-3.5 bg-white/10" />
                  <span className="text-[10px] font-black text-white/25 uppercase tracking-[0.1em]">OVR</span>
                  <CountUp start={0} end={Number(combo.user_rating)} duration={1.5} delay={0.57} decimals={1} decimal=","
                    style={{ color: tc.solid, fontWeight: 900 }} />
                </>
              )}
            </motion.div>

            {/* Edit button */}
            <button
              onClick={() => setReviewOpen(true)}
              className="mt-5 flex items-center gap-1.5 px-4 py-2 rounded-xl
                bg-white/[0.04] border border-white/10
                text-[10px] font-black uppercase tracking-[0.1em] text-white/50
                hover:text-white/90 hover:border-white/20 transition-all active:scale-95"
            >
              <Edit2 size={12} /> Valutazione
            </button>
          </motion.section>

          {/* ══ STATS PRINCIPALI ══ */}
          <motion.section
            initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={fadeSlideUp} className="px-5 mt-6"
          >
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25 font-createfuture flex items-center gap-2 mb-3">
              <BarChart3 size={12} /> Statistiche
            </h2>
            <div className="grid grid-cols-4 gap-2.5">
              <StatCard label="Punti"     value={mainStats.pts}    typeColor="Balance" icon={Trophy}    suffix=""  delay={0}    inView={true} />
              <StatCard label="Vittorie"  value={mainStats.wins}   typeColor="Stamina" icon={TrendingUp} suffix="" delay={0.08} inView={true} />
              <StatCard label="Sconfitte" value={mainStats.losses} typeColor="Attack"  icon={Swords}    suffix="" delay={0.16} inView={true} />
              <StatCard label="Win Rate"  value={mainStats.wr}     typeColor="Balance" icon={Gauge}     suffix="%" delay={0.24} inView={true} />
            </div>
          </motion.section>

          {/* ══ GRAFICI ROW ══ */}
          <motion.div
            initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={fadeSlideUp} className="px-5 mt-5"
          >
            <div className="grid grid-cols-5 gap-2.5">
              <div className="col-span-3">
                <ProfileRadar radarData={radarData} />
              </div>
              <div className="col-span-2">
                <WinRateDonut winRate={mainStats.wr} typeColor={tc.solid} />
              </div>
            </div>
          </motion.div>

          {/* ══ ANALISI VITTORIE/SCONFITTE ══ */}
          <motion.section
            initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={fadeSlideUp}
            className="glass-card p-5 mt-4 mx-5 space-y-4"
          >
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25 font-createfuture flex items-center gap-2 mb-1">
              <Flame size={12} /> Analisi Vittorie / Sconfitte
            </h3>
            {catBars.map(({ cat, bar, wins, losses }, i) => (
              <CatBarRow key={cat} cat={cat} wins={wins} losses={losses} delay={0.09 * i} barColor={bar} />
            ))}
            <div className="flex gap-5 pt-3 mt-1 border-t border-white/[0.05]">
              {CAT_ORDER.map(cat => {
                const cfg = CAT_CONFIG[cat];
                return (
                  <div key={cat} className="flex items-center gap-1.5">
                    <div className="w-3 h-2 rounded-full" style={{ background: cfg.bar }} />
                    <span className="text-[9px] font-black uppercase text-white/30 font-createfuture">{cfg.label}</span>
                  </div>
                );
              })}
            </div>
          </motion.section>

          {/* ══ RIEPILOGO ══ */}
          <motion.section
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="mt-6 px-5"
          >
            <SummaryCard
              totalWins={mainStats.wins} totalLosses={mainStats.losses}
              totalRounds={totalRounds} totalDraws={totalDraws}
              winRate={mainStats.wr} typeColor={tc.solid}
            />
          </motion.section>

        </motion.div>
      </PageContainer>

      <ExpertReviewModal
        isOpen={reviewOpen}
        onClose={() => setReviewOpen(false)}
        combo={combo}
        onSaved={() => {/* optional refetch */ }}
      />
    </>
  );
}
