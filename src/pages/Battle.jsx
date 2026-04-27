import React, { useState, useEffect } from 'react';
import { Swords, Users, Trophy, Plus, History, Shield, Calendar, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Avatar } from '../components/Avatar';
import { PageContainer } from '../components/PageContainer';
import { useAuthStore } from '../store/useAuthStore';

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
  const { user } = useAuthStore();
  const [recentBattles, setRecentBattles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openTournaments, setOpenTournaments] = useState([]);

  useEffect(() => {
    fetchRecentBattles();
    fetchOpenTournaments();
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

  async function fetchOpenTournaments() {
    const { data } = await supabase
      .from('tournaments')
      .select('*')
      .eq('registration_open', true)
      .eq('status', 'setup');
    setOpenTournaments(data || []);
  }

  return (
    <PageContainer className="px-4 pt-6">
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

      {/* Open Tournaments */}
      {openTournaments.length > 0 && (
        <section className="mb-10 px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[11px] font-black text-white/40 tracking-[0.2em] uppercase">Iscrizioni Aperte</h2>
            <div className="px-2 py-1 bg-primary/10 rounded text-[8px] font-black text-primary animate-pulse uppercase">Live</div>
          </div>
          <div className="space-y-4">
            {openTournaments.map(t => (
              <motion.div 
                key={t.id} whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/battle/tournament/${t.id}/join`)}
                className="w-full p-6 rounded-[32px] bg-gradient-to-br from-[#12122A] to-[#0A0A1A] border border-white/5 relative overflow-hidden shadow-xl"
              >
                {t.created_by === user?.id && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm("Vuoi eliminare definitivamente questo torneo?")) {
                        supabase.from('tournaments').delete().eq('id', t.id).then(() => fetchOpenTournaments());
                      }
                    }}
                    className="absolute top-5 right-5 z-20 w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20 backdrop-blur-md"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                <div className="relative z-10">
                  <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-1 italic">{t.battle_type} · {t.format}</div>
                  <div className="text-2xl font-black text-white uppercase italic tracking-tighter truncate pr-12">{t.name}</div>
                  <div className="mt-6 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center">
                           <Trophy size={20} className="text-primary" />
                        </div>
                        <div className="flex -space-x-2 ml-1">
                          {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full bg-white/5 border border-[#0A0A1A]" />)}
                        </div>
                     </div>
                     <button className="px-6 py-3 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-glow-primary">Unisciti</button>
                  </div>
                </div>
                <Trophy className="absolute top-1/2 right-[-20px] -translate-y-1/2 opacity-[0.03] rotate-12" size={160} />
              </motion.div>
            ))}
          </div>
        </section>
      )}

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
          recentBattles.map((battle, i) => (
            <motion.div 
              key={battle.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative p-5 rounded-3xl bg-[#12122A] border border-white/5 overflow-hidden group"
            >
              {/* Barra laterale: Blu se coinvolge l'utente, Rosso se no */}
              <div className={`absolute top-0 bottom-0 left-0 w-[4px]
                ${(user && (battle.player1_user_id === user.id || battle.player2_user_id === user.id)) 
                  ? 'bg-[#4361EE]' 
                  : 'bg-[#E94560]'}`} 
              />

              <div className="flex items-center justify-between relative z-10">
                <div className="flex flex-col gap-1.5 flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={10} className="text-white/20" />
                    <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">
                      {new Date(battle.played_at).toLocaleDateString()} · {battle.format}
                    </span>
                    {battle.is_official && (
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-[#E94560]/10 text-[#E94560] border border-[#E94560]/20 text-[7px] font-black uppercase">
                        <Shield size={7} strokeWidth={3} /> OFFICIAL
                      </div>
                    )}
                    {battle.tournament_id && (
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-[#F5A623]/10 text-[#F5A623] border border-[#F5A623]/20 text-[7px] font-black uppercase">
                        <Trophy size={7} strokeWidth={3} /> TORNEO
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    {/* Player 1 */}
                    <div className="flex items-center gap-3 flex-1">
                      <Avatar avatarId={battle.p1?.avatar_id} size={28} showFallback={!battle.p1} username={battle.player1_guest_name} />
                      <div className={`text-xs font-black uppercase tracking-tight truncate ${battle.winner_side === 'p1' ? 'text-white' : 'text-white/30'}`}>
                        {battle.p1?.username || battle.player1_guest_name}
                      </div>
                    </div>

                    {/* Scores */}
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-2xl border border-white/5 min-w-[80px] justify-center">
                      <span className={`text-lg font-black italic ${battle.winner_side === 'p1' ? 'text-[#E94560]' : 'text-white/40'}`}>
                        {battle.points_p1}
                      </span>
                      <span className="text-[10px] font-black text-white/10">-</span>
                      <span className={`text-lg font-black italic ${battle.winner_side === 'p2' ? 'text-[#E94560]' : 'text-white/40'}`}>
                        {battle.points_p2}
                      </span>
                    </div>

                    {/* Player 2 */}
                    <div className="flex items-center gap-3 flex-1 flex-row-reverse text-right">
                      <Avatar avatarId={battle.p2?.avatar_id} size={28} showFallback={!battle.p2} username={battle.player2_guest_name} />
                      <div className={`text-xs font-black uppercase tracking-tight truncate ${battle.winner_side === 'p2' ? 'text-white' : 'text-white/30'}`}>
                        {battle.p2?.username || battle.player2_guest_name}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </PageContainer>
  );
}
