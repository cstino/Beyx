import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Trophy, Zap, Target, Flame, RotateCcw, Crown, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { PageContainer } from '../components/PageContainer';
import { Avatar } from '../components/Avatar';
import { useUIStore } from '../store/useUIStore';
import { RankBadge, getRankFromElo } from '../components/RankBadge';

const TABS = [
  { id: 'elo',          label: 'ELO',            icon: Crown },
  { id: 'wins',         label: 'VITTORIE',       icon: Trophy },
  { id: 'top_combo',    label: 'TOP COMBO',      icon: TrendingUp },
  { id: 'burst',        label: 'BURST',          icon: Zap },
  { id: 'ko',           label: 'KO',             icon: Target },
  { id: 'xtreme',       label: 'XTREME',         icon: Flame },
  { id: 'spin_finish',  label: 'SPIN',           icon: RotateCcw },
];

const PERIODS = [
  { id: 'week',  label: 'SETTIMANA', interval: '7 days' },
  { id: 'month', label: 'MESE',      interval: '30 days' },
  { id: 'all',   label: 'TOTALE',    interval: '100 years' },
];

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const { setHeader, clearHeader } = useUIStore();
  const [activeTab, setActiveTab] = useState('elo');
  const [activePeriod, setActivePeriod] = useState('week');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setHeader('CLASSIFICHE', '/battle');
    return () => clearHeader();
  }, [setHeader, clearHeader]);

  useEffect(() => {
    loadData();
  }, [activeTab, activePeriod]);

  async function loadData() {
    setLoading(true);
    const period = PERIODS.find(p => p.id === activePeriod);
    const since = new Date(Date.now() - parseDays(period.interval) * 86400000).toISOString();

    let result;

    switch (activeTab) {
      case 'elo':
        result = await supabase.from('profiles')
          .select('id, username, avatar_id, elo, elo_matches')
          .gte('elo_matches', 5)
          .order('elo', { ascending: false })
          .limit(50);
        setData((result.data ?? []).map(u => ({
          label: u.username,
          sublabel: `${u.elo} ELO`,
          value: u.elo,
          avatarId: u.avatar_id,
          userId: u.id,
          elo: u.elo,
        })));
        break;

      case 'wins':
        result = await supabase.rpc('leaderboard_top_players', { p_since: since });
        setData((result.data ?? []).map(u => ({
          label: u.username,
          sublabel: `${u.wins}V / ${u.total_matches}M · ${u.win_rate}%`,
          value: u.wins,
          avatarId: u.avatar_id,
          userId: u.user_id,
          elo: u.elo,
        })));
        break;

      case 'top_combo':
        result = await supabase.rpc('leaderboard_top_combos', { p_since: since });
        setData((result.data ?? []).map(c => ({
          label: c.combo_name ?? 'Unknown',
          sublabel: `${c.wins}V / ${c.total_rounds}R · ${c.win_rate}% win rate`,
          value: c.wins,
          isCombo: true,
        })));
        break;

      case 'burst':
      case 'ko':
      case 'xtreme':
      case 'spin_finish':
        result = await supabase.rpc('leaderboard_top_finish_combos', {
          p_finish_type: activeTab,
          p_since: since,
        });
        setData((result.data ?? []).map(c => ({
          label: c.combo_name ?? 'Unknown',
          sublabel: `${c.finish_count} ${activeTab} finish`,
          value: c.finish_count,
          isCombo: true,
        })));
        break;
    }

    setLoading(false);
  }

  return (
    <PageContainer>
      {/* Tab Context Info */}
      <div className="px-4 mb-4 pt-4">
          <div className="text-[10px] font-bold tracking-[0.15em] text-[#F5A623] mb-1">
            ▲ LEADERBOARD
          </div>
          <h1 className="text-white text-lg font-black uppercase italic tracking-tight">
            Top Players & Combo
          </h1>
      </div>

      {/* Tab selector (horizontal scroll) */}
      <div className="px-4 mb-4 overflow-x-auto scrollbar-hide">
        <div className="flex gap-1.5 pb-2">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px]
                  font-extrabold tracking-wider whitespace-nowrap border transition-colors
                  ${active
                    ? 'bg-[#F5A623]/15 border-[#F5A623]/50 text-[#F5A623]'
                    : 'bg-white/5 border-white/10 text-white/50'}`}
              >
                <Icon size={12} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Period filter (not shown for ELO which is all-time) */}
      {activeTab !== 'elo' && (
        <div className="px-4 mb-4 flex gap-2">
          {PERIODS.map(p => (
            <button
              key={p.id}
              onClick={() => setActivePeriod(p.id)}
              className={`flex-1 py-2 rounded-lg text-[10px] font-bold tracking-wider
                border transition-colors
                ${activePeriod === p.id
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'bg-white/5 border-white/5 text-white/40'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* Results list */}
      <div className="px-4 pb-24 space-y-2">
        {loading ? (
          <div className="flex justify-center p-20">
            <div className="w-8 h-8 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : data.map((item, i) => {
          const rank = item.elo ? getRankFromElo(item.elo) : null;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-[#12122A] border border-white/5"
            >
              {/* Position */}
              <div className={`w-7 text-center font-black tabular-nums ${
                i === 0 ? 'text-[#F5A623] text-lg' :
                i === 1 ? 'text-[#94A3B8] text-base' :
                i === 2 ? 'text-[#A16207] text-base' :
                'text-white/30 text-sm'
              }`}>
                {i + 1}
              </div>

              {/* Avatar (for users) or combo icon */}
              {item.avatarId ? (
                <Avatar avatarId={item.avatarId} size={40} />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                  <TrendingUp size={16} className="text-white/40" />
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-white font-bold text-sm truncate">{item.label}</div>
                <div className="text-white/40 text-[10px] truncate">{item.sublabel}</div>
              </div>

              {/* Value + rank badge */}
              <div className="text-right">
                <div className="text-white font-black tabular-nums">
                  {item.value}
                </div>
                {rank && (
                  <div className="text-[9px] font-extrabold tracking-wider"
                    style={{ color: rank.tier.color }}>
                    {rank.display}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        {data.length === 0 && !loading && (
          <div className="text-center py-8 text-white/30 text-sm">
            Nessun dato per questo periodo
          </div>
        )}
      </div>
    </PageContainer>
  );
}

function parseDays(interval) {
  const match = interval.match(/(\d+)\s*(days?|years?)/);
  if (!match) return 7;
  const [, num, unit] = match;
  return unit.startsWith('year') ? parseInt(num) * 365 : parseInt(num);
}
