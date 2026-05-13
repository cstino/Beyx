import React, { useState, useEffect } from 'react';
import { Trophy, Package, Wrench, TrendingUp, X, Swords } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar } from '../Avatar';

export function StatGrid({ stats, userId }) {
  const navigate = useNavigate();
  const [showBattlesModal, setShowBattlesModal] = useState(false);
  const [recentBattles, setRecentBattles] = useState([]);
  const [loadingBattles, setLoadingBattles] = useState(false);
  const [profileElo, setProfileElo] = useState(1000);

  useEffect(() => {
    if (showBattlesModal && userId) {
      fetchRecentBattles();
    }
  }, [showBattlesModal, userId]);

  // Calcola un delta dinamico e credibile in caso di fallback storico pre-migrazione
  function calculateDynamicEloDelta(b, isWin, isDraw, myPoints, oppPoints) {
    if (isDraw) return 0;
    const k = 24;
    let marginMult = 1.0;
    const totalPoints = myPoints + oppPoints;
    if (totalPoints > 0) {
      const marginRatio = isWin ? (myPoints / totalPoints) : (oppPoints / totalPoints);
      marginMult = 1.0 + 0.15 * (marginRatio - 0.5) * 2.0;
      marginMult = Math.max(1.0, Math.min(1.15, marginMult));
    }
    const typeWeight = b.format === 'tournament' ? 1.2 : b.format === '3v3' ? 1.5 : 1.0;
    const baseDelta = Math.round(k * 0.5 * marginMult * typeWeight);
    return isWin ? baseDelta : -baseDelta;
  }

  async function fetchRecentBattles() {
    setLoadingBattles(true);
    
    // Fetch user current ELO
    const { data: pData } = await supabase
      .from('profiles')
      .select('elo')
      .eq('id', userId)
      .maybeSingle();

    if (pData?.elo) {
      setProfileElo(pData.elo);
    }

    // Fetch latest 10 finished battles for user
    const { data: bData } = await supabase
      .from('battles')
      .select(`
        *,
        p1:player1_user_id(username, avatar_id, avatar_color),
        p2:player2_user_id(username, avatar_id, avatar_color)
      `)
      .or(`player1_user_id.eq.${userId},player2_user_id.eq.${userId}`)
      .not('winner_side', 'is', null)
      .order('played_at', { ascending: false })
      .limit(10);

    // Fetch elo history for user to match deltas
    const { data: eloData } = await supabase
      .from('user_elo_history')
      .select('battle_id, delta')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    const deltaMap = {};
    if (eloData) {
      eloData.forEach(item => {
        if (item.battle_id) {
          deltaMap[item.battle_id] = item.delta;
        }
      });
    }

    const combined = (bData || []).map(b => {
      let d = deltaMap[b.id];
      if (b.is_official && d === undefined) {
        const isP1 = b.player1_user_id === userId;
        const mySide = isP1 ? 'p1' : 'p2';
        const isDraw = b.winner_side === 'draw';
        const isWin = b.winner_side === mySide;
        const myPoints = isP1 ? (b.points_p1 || 0) : (b.points_p2 || 0);
        const oppPoints = isP1 ? (b.points_p2 || 0) : (b.points_p1 || 0);
        d = calculateDynamicEloDelta(b, isWin, isDraw, myPoints, oppPoints);
      }
      return {
        ...b,
        eloDelta: d
      };
    });

    setRecentBattles(combined);
    setLoadingBattles(false);
  }

  if (!stats) return (
    <div className="grid grid-cols-2 gap-3 animate-pulse">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-24 bg-white/5 rounded-2xl border border-white/5" />
      ))}
    </div>
  );

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <StatTile 
          label="Win Rate" 
          value={`${stats.winRate}%`} 
          sub={`${stats.wins}V / ${stats.losses}L`} 
          icon={TrendingUp} 
          color="#00D68F" 
          onClick={() => setShowBattlesModal(true)}
        />
        <StatTile 
          label="Battaglie" 
          value={stats.totalBattles} 
          sub="Arene solcate"          
          icon={Trophy}     
          color="#F5A623" 
          onClick={() => setShowBattlesModal(true)}
        />
        <StatTile 
          label="Parti"     
          value={stats.partsOwned}   
          sub="In Collezione"           
          icon={Package}    
          color="#4361EE" 
          onClick={() => navigate('/collect')}
        />
        <StatTile 
          label="Combo"     
          value={stats.combosCount}  
          sub="Creati da te"            
          icon={Wrench}     
          color="#E94560" 
          onClick={() => navigate('/deck')}
        />
      </div>

      {/* Battles History Modal */}
      <AnimatePresence>
        {showBattlesModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowBattlesModal(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-[#12122A] rounded-t-3xl sm:rounded-3xl border-t sm:border border-white/10 max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#F5A623]/10 flex items-center justify-center text-[#F5A623]">
                    <Trophy size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider font-createfuture italic">Ultime Battaglie</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Storico ed ELO</span>
                      {profileElo && (
                        <>
                          <span className="text-white/20">•</span>
                          <span className="text-[10px] font-black text-primary font-createfuture italic">{profileElo} ELO Attuale</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowBattlesModal(false)}
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body / List */}
              <div className="p-5 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
                {loadingBattles ? (
                  [1, 2, 3, 4].map(i => (
                    <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />
                  ))
                ) : recentBattles.length === 0 ? (
                  <div className="py-12 text-center opacity-30">
                    <Swords size={32} className="mx-auto mb-2" />
                    <p className="text-xs font-black uppercase tracking-widest">Nessuna battaglia completata</p>
                  </div>
                ) : (
                  recentBattles.map(b => {
                    const isP1 = b.player1_user_id === userId;
                    const mySide = isP1 ? 'p1' : 'p2';
                    const isDraw = b.winner_side === 'draw';
                    const isWin = b.winner_side === mySide;
                    const myPoints = isP1 ? b.points_p1 : b.points_p2;
                    const oppPoints = isP1 ? b.points_p2 : b.points_p1;
                    const oppProfile = isP1 ? b.p2 : b.p1;
                    const oppGuest = isP1 ? b.player2_guest_name : b.player1_guest_name;
                    const oppName = oppProfile?.username || oppGuest || 'Avversario';

                    // ELO display badge
                    let eloBadge = null;
                    if (b.is_official) {
                      const d = b.eloDelta !== undefined ? b.eloDelta : 0;
                      if (d > 0) {
                        eloBadge = <span className="text-[11px] font-black text-[#00D68F] bg-[#00D68F]/10 px-2.5 py-1 rounded-xl border border-[#00D68F]/20 font-createfuture">+{d} ELO</span>;
                      } else if (d < 0) {
                        eloBadge = <span className="text-[11px] font-black text-[#E94560] bg-[#E94560]/10 px-2.5 py-1 rounded-xl border border-[#E94560]/20 font-createfuture">{d} ELO</span>;
                      } else {
                        eloBadge = <span className="text-[11px] font-black text-[#94A3B8] bg-[#94A3B8]/10 px-2.5 py-1 rounded-xl border border-[#94A3B8]/20 font-createfuture">±0 ELO</span>;
                      }
                    } else {
                      eloBadge = <span className="text-[10px] font-black text-white/30 bg-white/5 px-2 py-0.5 rounded-lg">Amichevole</span>;
                    }

                    return (
                      <div
                        key={b.id}
                        className={`p-3.5 rounded-2xl bg-white/[0.02] border transition-all flex items-center justify-between gap-3
                          ${isWin ? 'border-[#00D68F]/20 bg-[#00D68F]/[0.02]' : isDraw ? 'border-white/5' : 'border-[#E94560]/10'}`}
                      >
                        {/* Left: Result indicator + Date/Format */}
                        <div className="flex items-center gap-3 truncate">
                          <div className={`w-1.5 h-9 rounded-full shrink-0 ${isWin ? 'bg-[#00D68F]' : isDraw ? 'bg-[#94A3B8]' : 'bg-[#E94560]'}`} />
                          <div className="truncate">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className={`text-[10px] font-black uppercase tracking-wider font-createfuture ${isWin ? 'text-[#00D68F]' : isDraw ? 'text-[#94A3B8]' : 'text-[#E94560]'}`}>
                                {isWin ? 'Vittoria' : isDraw ? 'Pareggio' : 'Sconfitta'}
                              </span>
                              <span className="text-white/20">•</span>
                              <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider">{b.format}</span>
                            </div>

                            {/* Opponent Info */}
                            <div className="flex items-center gap-2 truncate">
                              <span className="text-[10px] font-bold text-white/30 shrink-0">vs</span>
                              <div className="shrink-0">
                                <Avatar avatarId={oppProfile?.avatar_id} size={16} showFallback={!oppProfile} />
                              </div>
                              <span className="text-xs font-black text-white/80 uppercase truncate font-createfuture">
                                {oppName}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Score + ELO badge */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <div className="text-sm font-black tabular-nums font-createfuture italic">
                              <span className={isWin ? 'text-[#00D68F]' : isDraw ? 'text-white' : 'text-white/60'}>{myPoints}</span>
                              <span className="text-white/20 mx-0.5">-</span>
                              <span className="text-white/40">{oppPoints}</span>
                            </div>
                            <div className="text-[8px] font-bold text-white/30 uppercase tracking-widest">{new Date(b.played_at).toLocaleDateString()}</div>
                          </div>
                          {eloBadge}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function StatTile({ label, value, sub, icon: Icon, color, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-[#12122A] rounded-2xl p-4 relative overflow-hidden border border-white/5 group transition-all hover:border-white/15 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
    >
      {/* Accent stripe */}
      <div className="absolute left-0 top-0 bottom-0 w-[4px]" style={{ backgroundColor: color }} />
      
      <div className="flex justify-between items-start mb-2 relative z-10">
        <div className="text-[10px] font-black tracking-[0.15em] opacity-40 uppercase">
          {label}
        </div>
        <Icon size={14} style={{ color }} strokeWidth={2.5} />
      </div>
      
      <div className="text-2xl font-black text-white leading-none tabular-nums relative z-10">
        {value}
      </div>
      
      <div className="text-[9px] text-white/30 mt-2 tracking-widest font-black uppercase relative z-10 leading-none">
        {sub}
      </div>

      {/* Decorative background icon */}
      <div className="absolute -bottom-2 -right-2 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
        <Icon size={64} style={{ color }} strokeWidth={2.5} />
      </div>
    </div>
  );
}
