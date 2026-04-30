import React, { useState, useEffect } from 'react';
import { Swords, Users, Trophy, Plus, History, Shield, Calendar, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Avatar } from '../components/Avatar';
import { LeaderboardCarousel } from '../components/LeaderboardCarousel';
import { PageContainer } from '../components/PageContainer';
import { ConfirmModal } from '../components/ConfirmModal';
import { useAuthStore } from '../store/useAuthStore';

const FORMATS = [
  {
    key: '1v1',
    icon: Swords,
    title: '1v1',
    subtitle: 'Battaglia singola',
    color: '#E94560',
    path: '/battle/new',
  },
  {
    key: '3v3',
    icon: Users,
    title: '3v3',
    subtitle: 'Deck format',
    color: '#4361EE',
    path: '/battle/new',
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
  const [liveMatches, setLiveMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openTournaments, setOpenTournaments] = useState([]);
  const [myTournaments, setMyTournaments] = useState([]);
  const [userRegistrations, setUserRegistrations] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [topBladers, setTopBladers] = useState([]);
  const [invitationFeedback, setInvitationFeedback] = useState(location.state?.invitationSent || false);
  
  // Match Detail state
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [matchRounds, setMatchRounds] = useState([]);
  const [loadingRounds, setLoadingRounds] = useState(false);
  
  // Confirm Modal state
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, tournamentId: null });

  useEffect(() => {
    fetchRecentBattles();
    fetchLiveMatches();
    fetchOpenTournaments();
    fetchLeaderboard();
    if (user) {
      fetchPendingInvitations();
      fetchMyTournaments();
    }
  }, [user]);

  async function fetchLeaderboard() {
    const { data } = await supabase.from('profiles')
      .select('id, username, avatar_id, title, elo, elo_matches')
      .gte('elo_matches', 0)
      .order('elo', { ascending: false })
      .limit(5);
    setTopBladers(data || []);
  }

  useEffect(() => {
    if (user) {
      fetchUserRegistrations();
    }
  }, [user]);

  async function fetchUserRegistrations() {
    const { data } = await supabase
      .from('tournament_registrations')
      .select('tournament_id, status')
      .eq('user_id', user.id);
    setUserRegistrations(data || []);
    setRegistrationsLoading(false);
  }

  async function fetchRecentBattles() {
    const { data } = await supabase
      .from('battles')
      .select(`
        *,
        p1:player1_user_id(username, avatar_id, avatar_color),
        p2:player2_user_id(username, avatar_id, avatar_color)
      `)
      .or('status.eq.completed,status.is.null') // Show completed or old matches
      .order('played_at', { ascending: false })
      .limit(5);
    
    setRecentBattles(data || []);
    setLoading(false);
  }

  async function fetchLiveMatches() {
    if (!user) return;
    const { data } = await supabase
      .from('battles')
      .select(`
        *,
        p1:player1_user_id(username, avatar_id, avatar_color),
        p2:player2_user_id(username, avatar_id, avatar_color)
      `)
      .or(`player1_user_id.eq.${user.id},player2_user_id.eq.${user.id}`)
      .in('status', ['active', 'deck_select'])
      .order('played_at', { ascending: false });
    
    setLiveMatches(data || []);
  }

  async function fetchOpenTournaments() {
    const { data } = await supabase
      .from('tournaments')
      .select('*')
      .eq('registration_open', true)
      .eq('status', 'setup')
      .order('created_at', { ascending: false });
    setOpenTournaments(data || []);
  }

  async function fetchMyTournaments() {
    if (!user) return;
    
    // Get tournaments where user is registered
    const { data: regs } = await supabase
      .from('tournament_registrations')
      .select('tournament_id')
      .eq('user_id', user.id);
    
    const tourneyIds = regs?.map(r => r.tournament_id) || [];
    
    // Also get tournaments created by user
    const { data: tourneys } = await supabase
      .from('tournaments')
      .select('*')
      .or(`id.in.(${tourneyIds.length > 0 ? tourneyIds.join(',') : '00000000-0000-0000-0000-000000000000'}),created_by.eq.${user.id}`)
      .neq('status', 'completed')
      .order('created_at', { ascending: false });
    
    setMyTournaments(tourneys || []);
  }

  async function fetchPendingInvitations() {
    const { data } = await supabase
      .from('battles')
      .select(`
        *,
        p1:player1_user_id(username, avatar_id, avatar_color)
      `)
      .eq('player2_user_id', user.id)
      .eq('status', 'pending');
    setPendingInvitations(data || []);
  }

  async function handleInvitation(battleId, accept) {
    if (accept) {
      navigate(`/battle/accept/${battleId}`);
    } else {
      await supabase.from('battles')
        .update({ status: 'cancelled' })
        .eq('id', battleId);
      fetchPendingInvitations();
    }
  }

  async function handleViewMatch(match) {
    setSelectedMatch(match);
    setLoadingRounds(true);
    const { data } = await supabase
      .from('rounds')
      .select('*')
      .eq('battle_id', match.id)
      .order('round_number', { ascending: true });
    setMatchRounds(data || []);
    setLoadingRounds(false);
  }

  const FINISH_TYPES = {
    burst: { label: 'Burst Finish', points: 2, color: '#E94560' },
    ko: { label: 'KO Finish', points: 2, color: '#4361EE' },
    xtreme: { label: 'Xtreme Finish', points: 3, color: '#F5A623' },
    spin_finish: { label: 'Spin Finish', points: 1, color: '#00D68F' },
    draw: { label: 'Draw', points: 0, color: '#6B7280' }
  };

  return (
    <PageContainer className="px-4 pt-6">
      {/* Live Matches Section */}
      {liveMatches.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-[3px] h-3.5 bg-red-500" />
            <h2 className="text-[11px] font-extrabold text-white tracking-[0.2em] uppercase flex items-center gap-2 font-createfuture">
              Match in corso <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            </h2>
          </div>
          <div className="space-y-3">
            {liveMatches.map(match => {
              const isAdmin = match.created_by === user?.id || match.player1_user_id === user?.id;
              return (
                <motion.div 
                  key={match.id}
                  onClick={() => navigate(`/battle/live/${match.id}`)}
                  whileTap={{ scale: 0.98 }}
                  className="p-5 rounded-[32px] bg-gradient-to-br from-[#1A1A3A] to-[#0A0A1A] border border-red-500/20 flex flex-col gap-4 relative overflow-hidden group cursor-pointer"
                >
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex flex-col items-center gap-1">
                        <Avatar avatarId={match.p1?.avatar_id} size={32} />
                        <span className="text-[8px] font-black text-white/40 uppercase truncate w-12 text-center">{match.p1?.username || match.player1_guest_name}</span>
                      </div>
                      <div className="flex items-center gap-3 font-createfuture">
                        <div className="text-xl font-black text-white italic">{match.points_p1}</div>
                        <div className="text-[10px] font-black text-white/20">VS</div>
                        <div className="text-xl font-black text-white italic">{match.points_p2}</div>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <Avatar avatarId={match.p2?.avatar_id} size={32} />
                        <span className="text-[8px] font-black text-white/40 uppercase truncate w-12 text-center">{match.p2?.username || match.player2_guest_name}</span>
                      </div>
                    </div>
                    <button className="px-5 py-2.5 rounded-xl bg-red-500 text-white text-[10px] font-black uppercase tracking-widest shadow-glow-red transition-all group-hover:scale-105">
                      {isAdmin ? 'Gestisci' : 'Entra'}
                    </button>
                  </div>
                  <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-2">
                    {match.format} · {match.battle_type || 'Amichevole'} · Primo a {match.point_target}
                  </div>
                  {/* Subtle BG effect */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-[40px] -translate-y-1/2 translate-x-1/2" />
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* Title */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-[3px] h-5 bg-[#E94560]" />
          <div className="text-[11px] font-extrabold text-white tracking-[0.15em] uppercase font-createfuture">
            Battle Arena
          </div>
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight font-createfuture uppercase">
          Inizia una sfida
        </h1>
      </div>

      {/* Invitation Feedback */}
      <AnimatePresence>
        {invitationFeedback && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="mb-6 p-4 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                <Check size={16} />
              </div>
              <div className="text-xs font-bold text-green-500 uppercase">Sfida inviata con successo!</div>
            </div>
            <button onClick={() => setInvitationFeedback(false)} className="text-green-500/50"><X size={16} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending Invitations Section */}
      {pendingInvitations.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-[3px] h-3.5 bg-primary" />
            <h2 className="text-[11px] font-extrabold text-white tracking-[0.15em] uppercase font-createfuture">Sfide in arrivo</h2>
          </div>
          <div className="space-y-3">
            {pendingInvitations.map(inv => (
              <motion.div 
                key={inv.id}
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="p-5 rounded-3xl bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <Avatar avatarId={inv.p1?.avatar_id} size={40} />
                  <div>
                    <div className="text-[8px] font-black text-primary uppercase tracking-widest mb-0.5">Ti ha sfidato</div>
                    <div className="text-sm font-black text-white uppercase italic">{inv.p1?.username}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleInvitation(inv.id, false)}
                    className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 border border-white/5"
                  >
                    <X size={18} />
                  </button>
                  <button 
                    onClick={() => handleInvitation(inv.id, true)}
                    className="px-6 py-3 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-glow-primary"
                  >
                    Accetta
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* My Tournaments (Invited or Active) */}
      {myTournaments.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-[3px] h-3.5 bg-primary" />
            <h2 className="text-[11px] font-extrabold text-white tracking-[0.2em] uppercase font-createfuture">
              I Miei Tornei
            </h2>
          </div>
          <div className="space-y-4">
            {myTournaments.map(t => {
              const isCreator = t.created_by === user?.id;
              const registration = userRegistrations.find(r => r.tournament_id === t.id);
              
              let statusLabel = t.status === 'setup' ? 'In Preparazione' : 'In Corso';
              let btnLabel = isCreator ? "Gestisci" : "Entra";
              let btnAction = () => {
                if (isCreator) {
                  navigate(`/battle/new/tournament`, { state: { tournamentId: t.id } });
                } else if (t.status === 'setup') {
                  navigate(`/battle/tournament/${t.id}/join`);
                } else {
                  // If active, we need a way for participants to view the bracket
                  // For now, let's lead them to the tournament page which should handle active state
                  navigate(`/battle/new/tournament`, { state: { tournamentId: t.id, viewOnly: true } });
                }
              };

              return (
                <motion.div 
                  key={t.id}
                  onClick={btnAction}
                  whileTap={{ scale: 0.98 }}
                  className="p-6 rounded-[32px] bg-gradient-to-br from-[#1A1A3A] to-[#0A0A1A] border border-primary/20 flex flex-col gap-4 relative overflow-hidden group cursor-pointer"
                >
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex flex-col gap-1">
                      <div className="text-[9px] font-black text-primary uppercase tracking-widest italic">{t.battle_type} · {t.format}</div>
                      <div className="text-xl font-black text-white uppercase italic tracking-tighter font-createfuture truncate max-w-[200px]">{t.name}</div>
                    </div>
                    <div className={`px-3 py-1.5 rounded-xl border text-[8px] font-black uppercase tracking-widest ${t.status === 'active' ? 'bg-green-500/10 text-green-500 border-green-500/20 animate-pulse' : 'bg-white/5 text-white/40 border-white/10'}`}>
                      {statusLabel}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
                        <Trophy size={14} className="text-primary" />
                      </div>
                      <div className="text-[10px] font-bold text-white/40 uppercase">
                        {isCreator ? 'Creato da te' : 'Partecipante'}
                      </div>
                    </div>
                    <button className="px-5 py-2.5 rounded-xl bg-primary text-white text-[9px] font-black uppercase tracking-widest shadow-glow-primary">
                      {btnLabel}
                    </button>
                  </div>
                  
                  <Trophy size={120} className="absolute right-[-20px] bottom-[-20px] text-white/[0.03] rotate-12 pointer-events-none" />
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* Open Tournaments */}
      {openTournaments.length > 0 && (
        <section className="mb-10 px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[11px] font-black text-white/40 tracking-[0.2em] uppercase font-createfuture">Iscrizioni Aperte</h2>
            <div className="px-2 py-1 bg-primary/10 rounded text-[8px] font-black text-primary animate-pulse uppercase">Live</div>
          </div>
          <div className="space-y-4">
            {openTournaments.map(t => {
              const isCreator = t.created_by === user?.id;
              const registration = userRegistrations.find(r => r.tournament_id === t.id);
              const isRegistered = !!registration;

              let btnLabel = "Unisciti";
              let btnAction = () => navigate(`/battle/tournament/${t.id}/join`);
              let btnClass = "bg-primary text-white shadow-glow-primary";

              if (isCreator) {
                btnLabel = "Gestisci";
                btnAction = () => navigate(`/battle/new/tournament`, { state: { tournamentId: t.id } });
                btnClass = "bg-[#4361EE] text-white shadow-glow-blue";
              } else if (isRegistered) {
                btnLabel = registration.status === 'pending' ? "In Attesa" : registration.status.toUpperCase();
                btnAction = () => navigate(`/battle/tournament/${t.id}/join`);
                btnClass = "bg-white/10 text-white/40";
              }

              return (
                <motion.div 
                  key={t.id} whileTap={{ scale: 0.98 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    btnAction();
                  }}
                  className="w-full p-6 rounded-[32px] bg-gradient-to-br from-[#12122A] to-[#0A0A1A] border border-white/5 relative overflow-hidden shadow-xl"
                >
                  {isCreator && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmModal({ isOpen: true, tournamentId: t.id });
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
                       <button 
                         onClick={(e) => {
                           e.stopPropagation();
                           btnAction();
                         }}
                         className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${btnClass}`}
                       >
                         {btnLabel}
                       </button>
                    </div>
                  </div>
                  <Trophy className="absolute top-1/2 right-[-20px] -translate-y-1/2 opacity-[0.03] rotate-12" size={160} />
                </motion.div>
              );
            })}
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
              onClick={() => navigate(fmt.path, { state: { format: fmt.key } })}
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
                <div className="text-white font-black text-xl leading-tight font-createfuture">
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

      <div className="mb-10">
        <LeaderboardCarousel bladers={topBladers} />
      </div>

      {/* Recent battles header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-[3px] h-3.5 bg-[#4361EE]" />
          <h2 className="text-[11px] font-extrabold text-white tracking-[0.15em] uppercase font-createfuture">
            Recenti
          </h2>
        </div>
        <button 
          onClick={() => navigate('/battle/history')}
          className="text-[10px] font-black text-primary flex items-center gap-1 hover:opacity-80 transition-opacity font-createfuture"
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
              onClick={() => handleViewMatch(battle)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.98 }}
              transition={{ delay: i * 0.1 }}
              className="relative p-5 rounded-3xl bg-[#12122A] border border-white/5 overflow-hidden group cursor-pointer hover:border-primary/20 transition-all"
            >
              {/* Barra laterale: Blu se coinvolge l'utente, Rosso se no */}
              <div className={`absolute top-0 bottom-0 left-0 w-[4px]
                ${(user && (battle.player1_user_id === user.id || battle.player2_user_id === user.id)) 
                  ? 'bg-[#4361EE]' 
                  : 'bg-[#E94560]'}`} 
              />

              <div className="flex items-center justify-between relative z-10">
                <div className={`flex flex-col gap-1.5 flex-1 ${battle.status === 'pending' ? 'opacity-40' : ''}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={10} className="text-white/20" />
                    <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">
                      {new Date(battle.played_at).toLocaleDateString()} · {battle.format}
                    </span>
                    {battle.status === 'pending' && (
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-white/10 text-white/40 border border-white/20 text-[7px] font-black uppercase">
                         IN ATTESA
                      </div>
                    )}
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
                      <div className={`text-xs font-black uppercase tracking-tight truncate font-createfuture ${battle.winner_side === 'p1' ? 'text-white' : 'text-white/30'}`}>
                        {battle.p1?.username || battle.player1_guest_name}
                      </div>
                    </div>

                    {/* Scores */}
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-2xl border border-white/5 min-w-[80px] justify-center font-createfuture">
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
                      <div className={`text-xs font-black uppercase tracking-tight truncate font-createfuture ${battle.winner_side === 'p2' ? 'text-white' : 'text-white/30'}`}>
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

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, tournamentId: null })}
        onConfirm={async () => {
          if (confirmModal.tournamentId) {
            await supabase.from('tournaments').delete().eq('id', confirmModal.tournamentId);
            fetchOpenTournaments();
          }
        }}
        title="Elimina Torneo"
        message="Sei sicuro di voler eliminare definitivamente questo torneo? Tutti i dati e le iscrizioni andranno persi."
        confirmLabel="Elimina"
      />

      {/* Match Detail Modal */}
      <AnimatePresence>
        {selectedMatch && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedMatch(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="relative w-full max-w-lg bg-[#0A0A1A] border-t sm:border border-white/10 rounded-t-[40px] sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 pb-4">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <div className="w-[3px] h-4 bg-primary" />
                    <div className="text-[10px] font-black text-white/40 tracking-[0.2em] uppercase">Dettaglio Match</div>
                  </div>
                  <button onClick={() => setSelectedMatch(null)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40"><X size={20} /></button>
                </div>

                <div className="bg-[#12122A] rounded-[32px] p-6 border border-white/5 mb-8">
                   <div className="flex items-center justify-between gap-4">
                      <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
                        <Avatar avatarId={selectedMatch.p1?.avatar_id} size={48} showFallback={!selectedMatch.p1} />
                        <div className="text-xs font-black text-white uppercase italic truncate w-full text-center">{selectedMatch.p1?.username || selectedMatch.player1_guest_name}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-3xl font-black text-primary italic">{selectedMatch.points_p1}</span>
                        <span className="text-white/10 font-black italic">VS</span>
                        <span className="text-3xl font-black text-white italic">{selectedMatch.points_p2}</span>
                      </div>
                      <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
                        <Avatar avatarId={selectedMatch.p2?.avatar_id} size={48} showFallback={!selectedMatch.p2} />
                        <div className="text-xs font-black text-white uppercase italic truncate w-full text-center">{selectedMatch.p2?.username || selectedMatch.player2_guest_name}</div>
                      </div>
                   </div>
                </div>

                <h3 className="text-[11px] font-black text-white tracking-widest uppercase mb-4 px-2">Cronologia Round</h3>
                
                <div className="overflow-y-auto no-scrollbar flex-1 space-y-3 pb-8">
                  {loadingRounds ? (
                    <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
                  ) : matchRounds.length === 0 ? (
                    <div className="py-12 text-center text-white/20 font-bold uppercase text-[10px] border-2 border-dashed border-white/5 rounded-3xl">Dettagli round non disponibili per questo match</div>
                  ) : (
                    matchRounds.map((round, idx) => (
                      <div key={idx} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center text-[10px] font-black text-white/20 border border-white/5">R{round.round_number}</div>
                          <div className="space-y-1">
                            <div className="text-[8px] font-black text-white/20 uppercase tracking-widest">{FINISH_TYPES[round.finish_type]?.label || 'Match Result'}</div>
                            <div className="flex items-center gap-2">
                               <div className={`text-xs font-black uppercase italic ${round.winner_side === 'p1' ? 'text-primary' : 'text-white/40'}`}>
                                 {round.p1_combo_label || 'Bey P1'}
                               </div>
                               <span className="text-[8px] font-black text-white/10 italic">vs</span>
                               <div className={`text-xs font-black uppercase italic ${round.winner_side === 'p2' ? 'text-primary' : 'text-white/40'}`}>
                                 {round.p2_combo_label || 'Bey P2'}
                               </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                           <div className="text-[11px] font-black text-primary italic">+{round.points_awarded} PT</div>
                           <div className="text-[8px] font-black text-white/40 uppercase tracking-tighter">{round.winner_side === 'p1' ? 'Winner P1' : round.winner_side === 'p2' ? 'Winner P2' : 'Pareggio'}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
}
