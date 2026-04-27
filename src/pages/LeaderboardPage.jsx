import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Crown, Trophy, Users, Shield } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from '../store/useAuthStore';
import { RankBadge, getRankFromElo, RANK_TIERS } from '../components/RankBadge';

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const userId = user?.id;
  const [filter, setFilter] = useState('all');
  const [users, setUsers] = useState([]);
  const [myPosition, setMyPosition] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [filter, userId]);

  async function loadLeaderboard() {
    setLoading(true);
    let query = supabase
      .from('profiles')
      .select('id, username, avatar_id, title, elo, elo_peak, elo_matches, xp')
      .gte('elo_matches', 5) // Solo chi ha completato il placement
      .order('elo', { ascending: false })
      .limit(100);

    if (filter !== 'all') {
      const { RANK_RANGES } = await import('../components/RankBadge');
      const range = RANK_RANGES.find(r => r.rank === filter);
      if (range) {
        query = query.gte('elo', range.minElo);
        // Find next range for maxElo
        const idx = RANK_RANGES.indexOf(range);
        if (idx > 0) {
          query = query.lt('elo', RANK_RANGES[idx - 1].minElo);
        }
      }
    }

    const { data } = await query;
    setUsers(data ?? []);

    // Trova la posizione del current user
    if (userId) {
      const { count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('elo_matches', 5)
        .gt('elo', (data ?? []).find(u => u.id === userId)?.elo ?? 0);
      setMyPosition(count != null ? count + 1 : null);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header Area */}
      <div className="bg-slate-900/50 backdrop-blur-xl border-b border-white/5 pt-12 pb-6 px-4 mb-6 sticky top-0 z-30">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)}
            className="p-3 rounded-2xl bg-white/5 text-white/70 hover:bg-white/10 transition-all border border-white/5">
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1">
            <div className="text-[10px] font-black tracking-[0.2em] text-primary uppercase mb-1">
              Global Ranking
            </div>
            <h1 className="text-white text-3xl font-black uppercase tracking-tighter">
              Leaderboard
            </h1>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Trophy size={24} />
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-1">
          <FilterChip
            active={filter === 'all'}
            onClick={() => setFilter('all')}
            label="TUTTI"
          />
          {Object.entries(RANK_TIERS).filter(([id]) => id !== 'unranked').reverse().map(([id, tier]) => (
            <FilterChip
              key={id}
              active={filter === id}
              onClick={() => setFilter(id)}
              label={tier.name.toUpperCase()}
              color={tier.color}
            />
          ))}
        </div>
      </div>

      {/* My position banner */}
      {myPosition && filter === 'all' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-4 mb-8 p-4 rounded-[2rem] bg-primary/10 border border-primary/30 flex items-center gap-4 shadow-glow-primary/5"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-xl shadow-glow-primary">
            #{myPosition}
          </div>
          <div>
            <div className="text-xs font-black text-white uppercase tracking-wider">La tua Posizione</div>
            <div className="text-[10px] text-primary font-bold uppercase mt-0.5">Stai scalando la vetta!</div>
          </div>
        </motion.div>
      )}

      {/* Podium Section */}
      {filter === 'all' && users.length >= 3 && !loading && (
        <div className="grid grid-cols-3 gap-3 mx-4 mb-8 items-end px-2">
          <PodiumCard user={users[1]} position={2} accentColor="#94A3B8" />
          <PodiumCard user={users[0]} position={1} accentColor="#F5A623" featured />
          <PodiumCard user={users[2]} position={3} accentColor="#A16207" />
        </div>
      )}

      {/* Main List */}
      <div className="px-4 space-y-3">
        {loading ? (
          <div className="flex justify-center p-20">
             <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length > 0 ? (
          users.map((user, i) => {
            const isMe = user.id === userId;
            const { display, tier } = getRankFromElo(user.elo);

            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`p-4 rounded-[1.5rem] flex items-center gap-4 border transition-all
                  ${isMe
                    ? 'bg-primary/10 border-primary/40 ring-1 ring-primary/20'
                    : 'bg-slate-900/40 border-white/5 hover:border-white/10'}`}
              >
                {/* Position number */}
                <div className="w-8 text-center flex-shrink-0">
                  <div className={`font-black tabular-nums ${
                    i === 0 ? 'text-[#F5A623] text-xl drop-shadow-[0_0_8px_rgba(245,166,35,0.4)]' :
                    i === 1 ? 'text-[#94A3B8] text-lg' :
                    i === 2 ? 'text-[#A16207] text-lg' :
                    'text-slate-500 text-sm'
                  }`}>
                    {i + 1}
                  </div>
                </div>

                {/* Avatar */}
                <Avatar
                  avatarId={user.avatar_id}
                  size={44}
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-white font-black uppercase text-sm truncate tracking-tight">{user.username}</span>
                    <span className="bg-primary/20 text-primary text-[8px] font-black px-1.5 py-0.5 rounded-[4px] border border-primary/20">
                      LV.{Math.max(1, Math.floor(Math.sqrt((user.xp || 0) / 50)) + 1)}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase truncate tracking-widest">{user.title || 'Novizio'}</div>
                </div>

                {/* Rank + ELO */}
                <div className="text-right flex-shrink-0">
                  <div className="text-white font-black tabular-nums leading-none text-base mb-1">
                    {user.elo}
                  </div>
                  <div className={`text-[9px] font-extrabold tracking-wider uppercase`}
                    style={{ color: tier.color }}>
                    {display}
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5">
             <Shield size={32} className="mx-auto text-slate-600 mb-3 opacity-20" />
             <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Nessun Blader trovato</p>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, label, color = '#4361EE' }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-[9px] font-black tracking-[0.15em] whitespace-nowrap border transition-all
        ${active ? '' : 'bg-white/5 border-white/10 text-slate-500 hover:border-white/20'}`}
      style={active ? {
        background: `${color}20`,
        borderColor: `${color}60`,
        color: color,
        boxShadow: `0 0 15px -5px ${color}`,
      } : undefined}
    >
      {label}
    </button>
  );
}

function PodiumCard({ user, position, accentColor, featured = false }) {
  if (!user) return null;
  const { display, tier } = getRankFromElo(user.elo, true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-[2rem] p-4 text-center border relative transition-all ${featured ? 'pt-8 pb-6 scale-110 z-10' : 'pt-4 pb-4'}`}
      style={{
        background: `${accentColor}10`,
        borderColor: `${accentColor}40`,
        boxShadow: featured ? `0 0 30px -5px ${accentColor}40` : 'none',
      }}
    >
      <div className={`font-black tabular-nums mb-3 flex flex-col items-center gap-1 ${
        featured ? 'text-4xl' : 'text-2xl'
      }`} style={{ color: accentColor }}>
        {position === 1 && <Crown size={featured ? 28 : 20} className="mb-1 drop-shadow-glow" />}
        <span className="leading-none">#{position}</span>
      </div>

      <div className="flex justify-center mb-3">
         <div className={`rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 overflow-hidden ${featured ? 'w-16 h-16' : 'w-12 h-12'}`}>
            <Users size={featured ? 28 : 20} />
         </div>
      </div>

      <div className="text-white font-black uppercase text-[10px] truncate mb-1 tracking-tighter">{user.username}</div>
      <div className={`text-[9px] font-black tracking-widest uppercase`}
        style={{ color: tier.color }}>
        {display} ({user.elo})
      </div>
    </motion.div>
  );
}
