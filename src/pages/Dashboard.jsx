import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useHomeData } from '../hooks/useHomeData';
import { PageContainer } from '../components/PageContainer';

// Modular Components
import { BladerHeroCard } from '../components/BladerHeroCard';
import { StatCard } from '../components/StatCard';
import { AcademyBanner } from '../components/AcademyBanner';
import { SectionHeader } from '../components/SectionHeader';
import { LeaderboardRow } from '../components/LeaderboardRow';
import { Trophy, ChevronRight, CheckCircle2, Trash2, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar } from '../components/Avatar';

export default function Dashboard() {
  const [userId, setUserId] = useState(null);
  const [openTournaments, setOpenTournaments] = useState([]);
  const navigate = useNavigate();

  const [pendingInvitations, setPendingInvitations] = useState([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        fetchPendingInvitations(user.id);
      }
    });
    fetchOpenTournaments();
  }, []);

  async function fetchPendingInvitations(uid) {
    const { data } = await supabase
      .from('battles')
      .select(`
        *,
        p1:player1_user_id(username, avatar_id, avatar_color)
      `)
      .eq('player2_user_id', uid)
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
      fetchPendingInvitations(userId);
    }
  }

  async function fetchOpenTournaments() {
    const { data } = await supabase
      .from('tournaments')
      .select('*')
      .eq('registration_open', true)
      .eq('status', 'setup');
    setOpenTournaments(data || []);
  }

  const { blader, parts, combos, topBladers, loading } = useHomeData(userId);

  if (loading) return (
    <div className="min-h-screen bg-[#0A0A1A] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#E94560] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <PageContainer>
      {/* 1. Brand Identity & Hero Card */}
      <div className="pt-8 pb-4">
        {/* Logo Container */}
        <div className="flex justify-center mb-8 px-8">
          <img 
            src="/beyx.svg" 
            alt="BeyManager X Logo" 
            className="h-16 w-auto opacity-100 drop-shadow-[0_0_20px_rgba(67,97,238,0.3)]"
          />
        </div>
        
        {/* Hero Card Container */}
        <div className="w-full">
          <BladerHeroCard blader={blader} />
        </div>
      </div>

      {/* NEW: Pending Invitations Section */}
      <AnimatePresence>
        {pendingInvitations.length > 0 && (
          <div className="mx-4 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-[3px] h-3.5 bg-primary" />
              <h2 className="text-[11px] font-extrabold text-white tracking-[0.15em] uppercase">Sfide in arrivo</h2>
            </div>
            <div className="space-y-3">
              {pendingInvitations.map(inv => (
                <motion.div 
                  key={inv.id}
                  initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                  className="p-5 rounded-3xl bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 flex items-center justify-between shadow-xl"
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
          </div>
        )}
      </AnimatePresence>

      {/* 2. Stats Row */}
      <div className="grid grid-cols-2 gap-3 mx-4 mt-5 mb-5">
        <StatCard
          label="Parti" 
          value={parts.owned} 
          total={parts.total}
          subtitle="In collezione" 
          accentColor="#4361EE"
          onClick={() => navigate('/collection')}
        />
        <StatCard
          label="Combo" 
          value={combos.count}
          subtitle="Creati da te" 
          accentColor="#E94560"
          onClick={() => navigate('/builder?view=saved')}
        />
      </div>

      {/* 3. Academy Banner */}
      <div className="mx-4 mb-4">
        <AcademyBanner onClick={() => navigate('/academy')} />
      </div>

      {/* NEW: Open Tournaments Discovery */}
      {openTournaments.length > 0 && (
        <div className="mx-4 mb-8">
           <SectionHeader title="Iscrizioni Aperte" accentColor="#E94560" />
           <div className="space-y-4 mt-4">
              {openTournaments.map(t => (
                <motion.div 
                  key={t.id} whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(`/battle/tournament/${t.id}/join`)}
                  className="w-full p-6 rounded-[32px] bg-gradient-to-br from-[#12122A] to-[#0A0A1A] border border-white/5 relative overflow-hidden flex flex-col justify-between h-44 shadow-xl"
                >
                  {t.created_by === (userId || blader?.id) && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm("Vuoi eliminare definitivamente questo torneo?")) {
                          supabase.from('tournaments').delete().eq('id', t.id).then(() => fetchOpenTournaments());
                        }
                      }}
                      className="absolute top-4 right-4 z-20 w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20 backdrop-blur-md"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] italic">{t.battle_type}</span>
                       <div className="flex items-center gap-2">
                          <div className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[7px] font-black text-primary uppercase tracking-widest">Registrazioni Live</div>
                          <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_#E94560]" />
                       </div>
                    </div>
                    <div className="text-2xl font-black text-white uppercase italic tracking-tighter leading-tight mt-1 truncate pr-12">{t.name}</div>
                    <p className="text-[10px] text-white/30 font-medium mt-1 line-clamp-1">{t.description || 'Nessuna restrizione, unisciti alla battaglia.'}</p>
                  </div>
                  
                  <div className="flex items-end justify-between relative z-10 mt-4">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center">
                           <Trophy size={20} className="text-primary" />
                        </div>
                        <div>
                           <div className="text-[8px] font-black text-white/20 uppercase tracking-widest">Formato</div>
                           <div className="text-[10px] font-black text-white uppercase tracking-wider">{t.format}</div>
                        </div>
                     </div>
                     <button className="px-8 py-3.5 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-glow-primary">PARTECIPA ORA</button>
                  </div>
                  
                  {/* Decorative background trophy */}
                  <Trophy className="absolute top-1/2 right-[-20px] -translate-y-1/2 opacity-[0.04] rotate-12" size={180} />
                </motion.div>
              ))}
           </div>
        </div>
      )}

      {/* 4. Top Bladers Section */}
      <div className="mx-4 mb-8">
        <SectionHeader
          title="Top Bladers" 
          accentColor="#F5A623"
          onSeeAll={() => navigate('/leaderboard')}
        />
        <div className="space-y-3 mt-4">
          {topBladers.map((b, i) => (
            <LeaderboardRow key={b.id} rank={i + 1} blader={b} />
          ))}
        </div>
      </div>

    </PageContainer>
  );
}
