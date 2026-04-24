import React, { useState, useEffect } from 'react';
import { Swords, Users, Trophy, Plus, History } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Avatar } from '../components/Avatar';

const FORMATS = [
  {
    key: '1v1',
    icon: Swords,
    title: '1v1',
    subtitle: 'Battaglia singola',
    color: '#E94560',
    path: '/battle/new/1v1',
  },
  {
    key: '3v3',
    icon: Users,
    title: '3v3',
    subtitle: 'Deck format',
    color: '#4361EE',
    path: '/battle/new/3v3',
  },
  {
    key: 'tournament',
    icon: Trophy,
    title: 'Torneo',
    subtitle: 'Bracket / Round Robin',
    color: '#F5A623',
    path: '/battle/new/tournament',
  },
];

export default function BattlePage() {
  const navigate = useNavigate();
  const [recentBattles, setRecentBattles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentBattles();
  }, []);

  async function fetchRecentBattles() {
    const { data } = await supabase
      .from('battles')
      .select(`
        *,
        p1:player1_user_id(username, avatar_id, avatar_color),
        p2:player2_user_id(username, avatar_id, avatar_color)
      `)
      .order('played_at', { ascending: false })
      .limit(5);
    
    setRecentBattles(data || []);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#0A0A1A] pb-32 px-4 pt-6">
      {/* Title */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-[3px] h-5 bg-[#E94560]" />
          <div className="text-[11px] font-extrabold text-white tracking-[0.15em] uppercase">
            Battle Arena
          </div>
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          Inizia una sfida
        </h1>
      </div>

      {/* Format tiles */}
      <div className="grid grid-cols-1 gap-4 mb-10">
        {FORMATS.map((fmt, i) => {
          const Icon = fmt.icon;
          return (
            <motion.button
              key={fmt.key}
              onClick={() => navigate(fmt.path)}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative overflow-hidden rounded-2xl bg-[#12122A] p-5 flex items-center gap-5 border border-white/5 transition-colors hover:border-white/10"
            >
              <div
                className="absolute inset-0 pointer-events-none opacity-30"
                style={{
                  background: `linear-gradient(110deg, transparent 50%, ${fmt.color}20 80%, transparent 100%)`,
                }}
              />

              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 border"
                style={{
                  background: `${fmt.color}15`,
                  borderColor: `${fmt.color}30`,
                  boxShadow: `0 0 20px ${fmt.color}15`,
                  transform: 'rotate(-4deg)',
                }}
              >
                <Icon size={28} style={{ color: fmt.color }} strokeWidth={2.5} />
              </div>

              <div className="flex-1 text-left relative">
                <div className="text-white font-black text-xl leading-tight">
                  {fmt.title}
                </div>
                <div className="text-white/40 text-xs mt-1 font-medium tracking-wide">
                  {fmt.subtitle}
                </div>
              </div>

              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40">
                <Plus size={20} strokeWidth={3} />
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Recent battles header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-[3px] h-3.5 bg-[#4361EE]" />
          <h2 className="text-[11px] font-extrabold text-white tracking-[0.15em] uppercase">
            Recenti
          </h2>
        </div>
        <button 
          onClick={() => navigate('/battle/history')}
          className="text-[10px] font-black text-primary flex items-center gap-1 hover:opacity-80 transition-opacity"
        >
          VEDI TUTTE <History size={12} />
        </button>
      </div>

      {/* Recent battles list */}
      <div className="space-y-3">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />
          ))
        ) : recentBattles.length === 0 ? (
          <div className="py-12 border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center opacity-30">
            <Swords size={32} className="mb-2" />
            <span className="text-xs font-bold uppercase tracking-widest">Nessuna battaglia</span>
          </div>
        ) : (
          recentBattles.map((battle) => (
            <div 
              key={battle.id}
              className="bg-[#12122A] p-4 rounded-2xl border border-white/5 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="flex flex-col gap-1">
                  <Avatar avatarId={battle.p1?.avatar_id} size={32} showFallback={!battle.p1} username={battle.player1_guest_name} />
                  <Avatar avatarId={battle.p2?.avatar_id} size={32} showFallback={!battle.p2} username={battle.player2_guest_name} />
                </div>
                <div className="text-left">
                  <div className="text-white font-black text-sm uppercase tracking-tight">
                    {battle.p1?.username || battle.player1_guest_name}
                  </div>
                  <div className="text-[10px] font-bold text-white/20 my-0.5">VS</div>
                  <div className="text-white font-black text-sm uppercase tracking-tight">
                    {battle.p2?.username || battle.player2_guest_name}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`text-xs font-black px-2 py-0.5 rounded uppercase ${
                  battle.winner_side === 'draw' ? 'bg-white/10 text-white' :
                  battle.winner_side === 'p1' ? 'bg-[#E94560]/10 text-[#E94560]' : 'bg-[#4361EE]/10 text-[#4361EE]'
                }`}>
                  {battle.winner_side === 'draw' ? 'Pareggio' : 'Vittoria'}
                </div>
                <div className="text-[9px] font-bold text-white/20 mt-1 uppercase">
                  {new Date(battle.played_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
