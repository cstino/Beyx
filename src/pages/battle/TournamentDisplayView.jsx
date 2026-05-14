import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Sword, Shield, Wind, Trophy, Zap, Sparkles, Clock, CheckCircle2, Swords, User, Tv } from 'lucide-react';
import { Avatar } from '../../components/Avatar';
import { useAuthStore } from '../../store/useAuthStore';
import '../../components/battle/DraftCard.css';

export default function TournamentDisplayView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const userEmail = useAuthStore(s => s.user?.email);
  const isAdmin = useAuthStore(s => s.profile?.is_admin) || userEmail === 'hcskso96@gmail.com';
  const [tournament, setTournament] = useState(null);
  const [revealingPack, setRevealingPack] = useState(null);
  const [revealedCombo, setRevealedCombo] = useState(null);
  const [parts, setParts] = useState({ blades: [], ratchets: [], bits: [] });
  const [battles, setBattles] = useState([]);
  const [liveRounds, setLiveRounds] = useState([]);
  const [standingsPage, setStandingsPage] = useState(0);
  const [pastMatchLoopIndex, setPastMatchLoopIndex] = useState(0);

  useEffect(() => {
    let currentTournament = null;

    const enrichParticipants = async (tourneyData) => {
      if (!tourneyData) return tourneyData;
      const structure = typeof tourneyData.structure === 'string' ? JSON.parse(tourneyData.structure) : tourneyData.structure;
      tourneyData.structure = structure || {};
      tourneyData.assignment_mode = tourneyData.assignment_mode || tourneyData.structure?.assignment_mode;
      tourneyData.beyblade_mode = tourneyData.beyblade_mode || tourneyData.structure?.beyblade_mode;

      if (!tourneyData.participants) return tourneyData;
      const userIds = tourneyData.participants.map(p => p.user_id).filter(Boolean);
      if (userIds.length > 0) {
        const { data: profs } = await supabase.from('profiles').select('id, username, avatar_id').in('id', userIds);
        if (profs) {
          tourneyData.participants.forEach(p => {
            if (p.user_id) {
              const matched = profs.find(pr => pr.id === p.user_id);
              if (matched) {
                p.avatar_id = matched.avatar_id;
                p.username = matched.username;
              }
            }
          });
        }
      }
      return tourneyData;
    };

    const fetchTournament = async () => {
      const [tourneyRes, bladesRes, ratchetsRes, bitsRes, battlesRes] = await Promise.all([
        supabase.from('tournaments').select('*').eq('id', id).single(),
        supabase.from('blades').select('*'),
        supabase.from('ratchets').select('*'),
        supabase.from('bits').select('*'),
        supabase.from('battles').select('*').eq('tournament_id', id)
      ]);
      
      const enrichedTourney = await enrichParticipants(tourneyRes.data);
      currentTournament = enrichedTourney;
      setTournament(enrichedTourney);
      setParts({
        blades: bladesRes.data || [],
        ratchets: ratchetsRes.data || [],
        bits: bitsRes.data || []
      });
      setBattles(battlesRes.data || []);
    };

    fetchTournament();

    const channel = supabase
      .channel(`display_${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tournaments', filter: `id=eq.${id}` },
        async (payload) => {
          console.log('Realtime UPDATE received:', payload);
          
          // Re-fetch to guarantee complete and properly parsed JSONB columns
          const { data: newTourneyRaw } = await supabase.from('tournaments').select('*').eq('id', id).single();
          if (!newTourneyRaw) return;
          
          const newTourney = await enrichParticipants(newTourneyRaw);

          // Check if a new pack was picked using the latest known tournament state
          const oldLastAction = currentTournament?.structure?.draft?.lastAction;
          const newLastAction = newTourney.structure?.draft?.lastAction;

          console.log('Old Action:', oldLastAction, 'New Action:', newLastAction);

          if (newLastAction && newLastAction.type === 'pick_pack') {
            if (!oldLastAction || oldLastAction.timestamp !== newLastAction.timestamp) {
              console.log('Triggering reveal for pack:', newLastAction.packId);
              triggerRevealAnimation(newTourney, newLastAction);
            }
          }

          currentTournament = newTourney;
          setTournament(newTourney);
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    const channelBattles = supabase
      .channel(`display_battles_${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'battles', filter: `tournament_id=eq.${id}` }, async () => {
         const { data: b } = await supabase.from('battles').select('*').eq('tournament_id', id);
         if (b) setBattles(b);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(channelBattles);
    };
  }, [id]);

  const activeBattle = React.useMemo(() => battles.find(b => b.status === 'active'), [battles]);

  const nextScheduledMatch = React.useMemo(() => {
    if (!tournament?.structure?.rounds) return null;
    for (const r of tournament.structure.rounds) {
      if (r.matches) {
        for (const m of r.matches) {
          if (m.p1 && m.p2 && !m.p1.isBye && !m.p2.isBye && !m.winner) {
            return { ...m, roundTitle: r.title || `Turno ${tournament.structure.rounds.indexOf(r) + 1}` };
          }
        }
      }
    }
    return null;
  }, [tournament?.structure]);

  const displayedActiveBattle = React.useMemo(() => {
    if (activeBattle) {
      let roundTitle = null;
      if (tournament?.structure?.rounds) {
        for (const r of tournament.structure.rounds) {
          if (r.matches) {
            const match = r.matches.find(m => m.battle_id === activeBattle.id);
            if (match) {
              roundTitle = r.title || `Turno ${tournament.structure.rounds.indexOf(r) + 1}`;
              break;
            }
          }
        }
      }
      return {
        ...activeBattle,
        roundTitle: roundTitle || 'Match'
      };
    }
    if (nextScheduledMatch) {
      return {
        isPreview: true,
        player1_user_id: nextScheduledMatch.p1?.user_id,
        player1_guest_name: nextScheduledMatch.p1?.user_id ? null : nextScheduledMatch.p1?.username,
        player2_user_id: nextScheduledMatch.p2?.user_id,
        player2_guest_name: nextScheduledMatch.p2?.user_id ? null : nextScheduledMatch.p2?.username,
        p1: nextScheduledMatch.p1,
        p2: nextScheduledMatch.p2,
        roundTitle: nextScheduledMatch.roundTitle
      };
    }
    return null;
  }, [activeBattle, nextScheduledMatch, tournament?.structure]);

  useEffect(() => {
    if (!activeBattle?.id) {
      setLiveRounds([]);
      return;
    }
    const fetchRounds = async () => {
      const { data } = await supabase.from('rounds').select('*').eq('battle_id', activeBattle.id).order('round_number');
      if (data) setLiveRounds(data);
    };
    fetchRounds();

    const rChannel = supabase.channel(`display_live_rounds_${activeBattle.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rounds', filter: `battle_id=eq.${activeBattle.id}` }, fetchRounds)
      .subscribe();
    return () => supabase.removeChannel(rChannel);
  }, [activeBattle?.id]);

  useEffect(() => {
    const timer = setInterval(() => {
      setStandingsPage(prev => prev + 1);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setPastMatchLoopIndex(prev => prev + 1);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const triggerRevealAnimation = (tourney, action) => {
    const draft = tourney.structure.draft;
    const pack = draft.availablePacks.find(p => p.id === action.packId);
    if (!pack) return;

    const participant = tourney.participants.find(p => p.id === action.participantId || p.user_id === action.participantId || p.username === action.participantId);
    
    // Find combo details from the pool
    const combo = tourney.structure.pool.find(c => c.id === pack.combo_id);
    
    setRevealingPack({ pack, participant });
    
    // We will use CSS for the flip. The state transition triggers it.
    setTimeout(() => {
      setRevealedCombo({ combo, participant });
      
      // Keep reveal on screen for 5 seconds, then return to grid
      setTimeout(() => {
        setRevealingPack(null);
        setRevealedCombo(null);
      }, 5000);

    }, 500); // reduced from 2000 to just wait 0.5s before flipping
  };

  // Infographic logic moved safely to the top level to strictly satisfy React Rules of Hooks
  const standings = React.useMemo(() => {
    if (!tournament?.participants || !tournament?.structure?.rounds) return [];
    const stats = tournament.participants.filter(p => !p.isBye).map(p => ({
      ...p,
      played: 0, won: 0, lost: 0, draws: 0, points: 0, koPoints: 0
    }));

    tournament.structure.rounds.forEach(r => {
      if (r.isPlayoff) return;
      r.matches?.forEach(m => {
        if (m.winner) {
          const p1Id = m.p1?.user_id || m.p1?.username;
          const p2Id = m.p2?.user_id || m.p2?.username;
          const s1 = stats.find(s => (s.user_id || s.username) === p1Id);
          const s2 = stats.find(s => (s.user_id || s.username) === p2Id);
          
          if (s1) s1.played++;
          if (s2) s2.played++;
          if (m.score) {
            if (s1) s1.koPoints += (m.score.p1 || 0);
            if (s2) s2.koPoints += (m.score.p2 || 0);
          }
          if (m.winner === 'p1') {
            if (s1) { s1.won++; s1.points += 3; }
            if (s2) { s2.lost++; }
          } else if (m.winner === 'p2') {
            if (s2) { s2.won++; s2.points += 3; }
            if (s1) { s1.lost++; }
          } else if (m.winner === 'draw') {
            if (s1) { s1.draws++; s1.points += 1; }
            if (s2) { s2.draws++; s2.points += 1; }
          }
        }
      });
    });
    return stats.sort((a, b) => b.points - a.points || b.koPoints - a.koPoints || b.won - a.won);
  }, [tournament?.structure, tournament?.participants]);

  const upcomingMatches = React.useMemo(() => {
    if (!tournament?.structure?.rounds) return [];
    const list = [];
    const activeId = activeBattle?.id;
    let foundFirstUnplayed = false;
    
    tournament.structure.rounds.forEach(r => {
      r.matches?.forEach(m => {
        if (m.p1 && m.p2 && !m.p1.isBye && !m.p2.isBye && !m.winner) {
          if (activeId && m.battle_id === activeId) return;
          if (!activeId && !foundFirstUnplayed) {
            foundFirstUnplayed = true;
            return;
          }
          list.push({ ...m, roundTitle: r.title || `Turno ${tournament.structure.rounds.indexOf(r) + 1}` });
        }
      });
    });
    return list.slice(0, 3);
  }, [tournament?.structure, activeBattle?.id]);

  const pastMatches = React.useMemo(() => {
    if (!tournament?.structure?.rounds) return [];
    const list = [];
    tournament.structure.rounds.forEach(r => {
      r.matches?.forEach(m => {
        if (m.winner && m.p1 && m.p2 && !m.p1.isBye && !m.p2.isBye) {
          list.push({ ...m, roundTitle: r.title || `Turno ${tournament.structure.rounds.indexOf(r) + 1}` });
        }
      });
    });
    return list.reverse();
  }, [tournament?.structure]);

  if (!tournament) {
    return <div className="min-h-screen bg-[#0A0A1A] flex items-center justify-center text-white font-black italic text-3xl">Caricamento Display...</div>;
  }

  const isAuctionTourney = tournament.assignment_mode === 'asta' || tournament.structure?.assignment_mode === 'asta' || tournament.structure?.auction;

  // Garantiamo l'innesco dell'Asta se configurata per l'asta ed è nelle fasi di attesa/svolgimento, oppure se l'oggetto auction esiste e il tabellone/girone finale non è ancora stato generato con i match giocabili
  const isAuctionPhase = isAuctionTourney && (
    ['setup', 'drafting', 'draft_complete', 'auctioning'].includes(tournament.status) || 
    (tournament.structure?.auction && !tournament.structure?.rounds?.length)
  );

  if (isAuctionPhase) {
    return <AuctionDisplaySubView tournament={tournament} parts={parts} />;
  }

  const draft = tournament.structure?.draft;
  
  if (['drafting', 'draft_complete'].includes(tournament.status) && draft) {
    // REVEAL ANIMATION OVERLAY
    if (revealingPack) {
      const isRevealed = !!revealedCombo;
      const combo = isRevealed ? revealedCombo.combo : null;
      
      const pack = revealingPack.pack;
      const packIndex = draft.availablePacks.findIndex(p => p.id === pack.id);
      let glowColor = '#22c55e';
      let Icon = Wind;
      if (pack.type === 'attack') { glowColor = '#ef4444'; Icon = Sword; }
      if (pack.type === 'defense') { glowColor = '#3b82f6'; Icon = Shield; }
      
      let displayType = pack.type;
      if (pack.type === 'balance' || pack.type === 'stamina') displayType = 'STAMINA';
      
      let blade, ratchet, bit;
      if (combo) {
        blade = parts.blades.find(b => b.id === combo.blade_id);
        if (combo.is_stock) {
          ratchet = parts.ratchets.find(r => r.name === blade?.stock_ratchet);
          bit = parts.bits.find(b => b.name === blade?.stock_bit);
        } else {
          ratchet = parts.ratchets.find(r => r.id === combo.ratchet_id);
          bit = parts.bits.find(b => b.id === combo.bit_id);
        }
      }
      return (
        <div className="min-h-screen bg-[#0A0A1A] flex flex-col items-center justify-center p-8 relative overflow-hidden perspective-1000">
          <div className="absolute inset-0 bg-gradient-to-b from-[#4361EE]/10 to-transparent"></div>
          
          <h2 className="text-4xl md:text-6xl font-black italic text-white uppercase tracking-[0.05em] mb-12 drop-shadow-[0_0_15px_rgba(67,97,238,0.8)] animate-pulse z-10">
            {revealingPack.participant.username} ha scelto!
          </h2>

          {/* Flip Container */}
          <div 
            className="relative w-80 h-[28rem] md:w-96 md:h-[34rem] transition-transform duration-1000 transform-style-3d z-10"
            style={{ transform: isRevealed ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
          >
            
            {/* Front of Card (The Pack) */}
            <div className="absolute inset-0 backface-hidden rounded-3xl overflow-hidden flex items-center justify-center bg-[#151515]" style={{ boxShadow: `0 0 50px ${glowColor}66` }}>
              <div className="absolute w-[150%] h-[150%] animate-[rotation_481_5000ms_infinite_linear]" style={{ background: `linear-gradient(90deg, transparent, ${glowColor}, ${glowColor}, ${glowColor}, ${glowColor}, transparent)` }}></div>
              <div className="absolute w-[calc(100%-8px)] h-[calc(100%-8px)] bg-[#151515] rounded-[20px] flex flex-col items-center justify-center font-createfuture tracking-[0.05em] text-white">
                <img src="/beyx.svg" alt="BeyX Logo" className="w-24 h-24 mb-8 opacity-50 drop-shadow-md" />
                <div className="mb-8 opacity-80" style={{ color: glowColor }}><Icon size={96} /></div>
                <div className="text-3xl font-black uppercase opacity-80 mb-4 text-center" style={{ color: glowColor }}>{displayType}</div>
                <div className="text-5xl font-black opacity-40">{packIndex + 1}</div>
              </div>
            </div>

            {/* Back of Card (The Revealed Beyblade) */}
            <div 
              className="absolute inset-0 backface-hidden rounded-3xl border-4 border-[#F5A623] bg-gradient-to-b from-[#1A1A3A] to-[#0A0A1A] flex flex-col items-center justify-center shadow-[0_0_80px_rgba(245,166,35,0.4)] overflow-hidden"
              style={{ transform: 'rotateY(180deg)' }}
            >
              {isRevealed && blade && (
                <div className="flex flex-col items-center w-full h-full justify-center p-6">
                  {/* Glowing background inside card */}
                  <div className="absolute inset-0 bg-[#F5A623]/20 blur-[80px] rounded-full"></div>
                  
                  <div className="relative w-56 h-56 md:w-64 md:h-64 mb-6">
                    <img 
                      src={blade.image_url} 
                      alt="Blade" 
                      className="absolute inset-0 w-full h-full object-contain z-30 drop-shadow-[0_0_20px_rgba(255,255,255,0.4)] animate-[float_3s_ease-in-out_infinite]"
                    />
                    {ratchet && (
                      <img 
                        src={ratchet.image_url} 
                        alt="Ratchet" 
                        className="absolute inset-0 w-full h-full object-contain z-20 scale-90 opacity-80"
                      />
                    )}
                    {bit && (
                      <img 
                        src={bit.image_url} 
                        alt="Bit" 
                        className="absolute inset-0 w-full h-full object-contain z-10 scale-75 opacity-70"
                      />
                    )}
                  </div>
                  
                  <h1 className="text-4xl md:text-5xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-white via-[#F5A623] to-white uppercase tracking-[0.05em] text-center z-10 drop-shadow-md leading-tight">
                    {blade.name}
                  </h1>
                  <span className="text-lg md:text-xl font-bold text-white/60 mt-2 z-10 uppercase tracking-widest text-center">
                    {ratchet?.name} {bit?.name}
                  </span>
                </div>
              )}
            </div>
          </div>

          <style>{`
            .perspective-1000 {
              perspective: 1000px;
            }
            .transform-style-3d {
              transform-style: preserve-3d;
            }
            .backface-hidden {
              backface-visibility: hidden;
              -webkit-backface-visibility: hidden;
            }
            @keyframes float {
              0%, 100% { transform: translateY(0px) scale(1); }
              50% { transform: translateY(-10px) scale(1.05); }
            }
          `}</style>
        </div>
      );
    }

    // GRID VIEW
    const isDraftComplete = tournament.status === 'draft_complete' || draft.availablePacks.every(p => p.isOpened);
    const currentParticipantId = isDraftComplete ? null : draft.turnOrder[draft.currentTurnIndex];
    const currentParticipant = currentParticipantId ? tournament.participants.find(p => p.id === currentParticipantId || p.user_id === currentParticipantId || p.username === currentParticipantId) : null;

    return (
      <div className="min-h-screen bg-[#0A0A1A] p-4 md:p-8 flex flex-col justify-between overflow-y-auto">
        <div className="text-center mb-6 md:mb-8 shrink-0">
          <h1 className="text-3xl md:text-5xl font-black italic uppercase text-white tracking-[0.05em] mb-3">
            {tournament.name} - Fase di Draft
          </h1>
          {currentParticipant ? (
            <div className="inline-block bg-[#4361EE]/20 border-2 border-[#4361EE] px-6 py-2.5 md:px-8 md:py-4 rounded-full shadow-[0_0_30px_rgba(67,97,238,0.3)]">
              <span className="text-base md:text-xl text-white/70 font-bold uppercase mr-3 tracking-[0.05em]">Turno di:</span>
              <span className="text-2xl md:text-4xl text-white font-black italic uppercase tracking-[0.05em]">{currentParticipant.username}</span>
            </div>
          ) : (
            <div className="text-xl md:text-2xl text-green-400 font-black italic uppercase animate-pulse">
              Draft Completato! In attesa della generazione del tabellone...
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-wrap justify-center items-center max-w-7xl mx-auto w-full content-center my-auto" style={{ gap: draft.availablePacks.length > 24 ? '10px' : draft.availablePacks.length > 16 ? '12px' : draft.availablePacks.length > 12 ? '16px' : '24px' }}>
          {draft.availablePacks.map((pack, index) => {
            const isOpened = pack.isOpened;
            const owner = isOpened ? tournament.participants.find(p => p.id === pack.owner || p.user_id === pack.owner || p.username === pack.owner) : null;
            
            let glowColor = '#22c55e';
            let Icon = Wind;
            if (pack.type === 'attack') { glowColor = '#ef4444'; Icon = Sword; }
            if (pack.type === 'defense') { glowColor = '#3b82f6'; Icon = Shield; }
            
            let displayType = pack.type;
            if (pack.type === 'balance' || pack.type === 'stamina') displayType = 'STAMINA';

            // Dynamic size mapping based on pack count
            const totalPacks = draft.availablePacks.length;
            let cardDims = {
              width: "190px",
              height: "254px",
              logoSize: "w-20 h-20", // The user requested a bigger logo!
              iconSize: 48,
              typeSize: "text-sm",
              numSize: "text-xl"
            };

            if (totalPacks > 24) {
              cardDims = {
                width: "105px",
                height: "140px",
                logoSize: "w-10 h-10",
                iconSize: 22,
                typeSize: "text-[8px]",
                numSize: "text-xs"
              };
            } else if (totalPacks > 16) {
              cardDims = {
                width: "125px",
                height: "167px",
                logoSize: "w-12 h-12",
                iconSize: 28,
                typeSize: "text-[9px]",
                numSize: "text-xs"
              };
            } else if (totalPacks > 12) {
              cardDims = {
                width: "150px",
                height: "200px",
                logoSize: "w-16 h-16",
                iconSize: 36,
                typeSize: "text-xs",
                numSize: "text-sm"
              };
            }

            return (
              <div 
                key={pack.id} 
                className={`draft-card is-display shrink-0 ${isOpened ? 'is-opened' : ''} transition-all duration-500`}
                style={{ 
                  '--glow-color': glowColor,
                  width: cardDims.width,
                  height: cardDims.height
                }}
              >
                <div className="draft-card-content">
                  <div className="draft-card-back">
                    <div className="draft-card-back-content font-createfuture tracking-[0.05em]">
                      <img src="/beyx.svg" alt="BeyX Logo" className={`${cardDims.logoSize} mb-2 opacity-60 drop-shadow-md transition-all`} />
                      <div className="mb-2 opacity-80" style={{ color: glowColor }}><Icon size={cardDims.iconSize} /></div>
                      <div className={`${cardDims.typeSize} font-black uppercase opacity-80 mb-1 text-center`} style={{ color: glowColor }}>{displayType}</div>
                      <div className={`${cardDims.numSize} font-black opacity-40 leading-none`}>{index + 1}</div>
                    </div>
                  </div>
                  <div className="draft-card-front">
                    <div className="circle" id="bottom-circle" style={{ '--glow-color': glowColor }}></div>
                    <div className="circle" id="right-circle"></div>
                    <div className="draft-card-front-content">
                      <div className="draft-card-description font-createfuture tracking-[0.05em]">
                         {isOpened ? (
                           <>
                             <div className={`${totalPacks > 16 ? 'text-lg mb-0.5' : 'text-3xl mb-2'}`}>❌</div>
                             <div className="flex flex-col items-center justify-center w-full">
                               <span className={`${totalPacks > 16 ? 'text-[8px]' : 'text-[10px]'} font-black text-white text-center uppercase tracking-[0.05em]`}>SELEZIONATO</span>
                               <span className={`${totalPacks > 16 ? 'text-[7px]' : 'text-[8px]'} text-white/70 text-center uppercase mt-0.5 tracking-[0.05em] truncate max-w-[90%]`}>{owner?.username}</span>
                             </div>
                           </>
                         ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Derived non-hook infographic slicing logic
  const itemsPerPage = 8;
  const totalPages = Math.ceil(standings.length / itemsPerPage) || 1;
  const currentStandingsPage = standingsPage % totalPages;
  const displayedStandings = standings.slice(currentStandingsPage * itemsPerPage, (currentStandingsPage + 1) * itemsPerPage);

  const pastMatchesPerPage = 4;
  const totalPastPages = Math.ceil(pastMatches.length / pastMatchesPerPage) || 1;
  const currentPastLoopIndex = pastMatches.length > 0 ? pastMatchLoopIndex % pastMatches.length : 0;
  const currentPastPage = Math.floor(currentPastLoopIndex / pastMatchesPerPage);
  const displayedPastMatches = pastMatches.slice(currentPastPage * pastMatchesPerPage, (currentPastPage + 1) * pastMatchesPerPage);

  const p1LiveScore = liveRounds.reduce((s, r) => s + (r.winner_side === 'p1' && r.status !== 'contested' ? r.points_awarded : 0), 0);
  const p2LiveScore = liveRounds.reduce((s, r) => s + (r.winner_side === 'p2' && r.status !== 'contested' ? r.points_awarded : 0), 0);

  // If status is setup, show setup fallback
  if (tournament.status === 'setup') {
    return (
      <div className="min-h-screen bg-[#0A0A1A] flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-6xl font-black italic uppercase text-white mb-6 font-createfuture tracking-[0.05em]">
          {tournament.name}
        </h1>
        <p className="text-2xl text-white/50 font-createfuture tracking-widest uppercase">
          In attesa dell'inizio...
        </p>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-[#0A0A1A] text-white overflow-hidden flex flex-col p-6 relative select-none">
      {/* Background Cyberpunk Accents */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f20350a_1px,transparent_1px),linear-gradient(to_bottom,#1f20350a_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#E94560]/10 blur-[120px] pointer-events-none" />

      {/* Top Header Bar */}
      <header className="h-20 shrink-0 bg-[#12122A]/80 border-b-2 border-primary/40 rounded-2xl px-8 flex items-center justify-between shadow-glow-primary-sm backdrop-blur-md z-10 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-glow-primary-sm">
            <Trophy size={24} />
          </div>
          <div>
            <div className="text-[9px] font-black text-primary uppercase tracking-[0.3em] leading-none mb-1">Display Hub Ufficiale</div>
            <h1 className="text-2xl font-black text-white italic uppercase tracking-[0.05em] font-createfuture leading-none">
              {tournament.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
             <Clock size={16} className="text-white/40" />
             <span className="text-xs font-black uppercase tracking-widest text-white/60 font-createfuture">
               {tournament.format === 'round_robin' ? 'Girone' : 'Eliminatoria'}
             </span>
          </div>
          
          <div className="flex items-center gap-2.5 bg-green-500/10 border border-green-500/30 px-4 py-2 rounded-xl shadow-[0_0_15px_rgba(34,197,94,0.2)]">
             <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
             <span className="text-xs font-black text-green-400 uppercase tracking-widest font-createfuture">
               {tournament.status === 'completed' ? 'Terminato' : 'Live Infographic'}
             </span>
          </div>
        </div>
      </header>

      {/* Main Dashboard Layout */}
      <div className="flex-1 grid grid-cols-[1.35fr_1fr_0.95fr] gap-6 min-h-0 z-10">
        
        {/* COL 1: Live Match Arena */}
        <div className="h-full flex flex-col bg-[#12122A]/60 border-2 border-[#4361EE]/40 rounded-3xl p-6 relative overflow-hidden shadow-[0_0_30px_rgba(67,97,238,0.1)] backdrop-blur-md">
          <div className="absolute top-0 right-0 bg-[#4361EE] text-white text-[8px] font-black px-4 py-1 rounded-bl-xl uppercase tracking-widest font-createfuture">
            {tournament.status === 'completed' ? 'PODIO UFFICIALE' : 'ARENA PRINCIPALE'}
          </div>
          
          <div className="flex items-center gap-2 mb-6 shrink-0">
            <Tv size={18} className="text-[#4361EE]" />
            <h2 className="text-sm font-black text-white uppercase tracking-[0.2em] font-createfuture">
              {tournament.status === 'completed' ? 'Podio Finale' : 'Match Live'}
            </h2>
          </div>

          {tournament.status === 'completed' ? (
            <div className="flex-1 flex items-end justify-center gap-3 relative pb-2 min-h-0">
              {/* Glowing Background Sparkles */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
                <Sparkles size={240} className="text-[#F5A623] animate-pulse" />
              </div>

              {/* 2nd Place */}
              {standings[1] ? (
                <div className="flex flex-col items-center w-28 animate-fade-in shrink-0" style={{ animationDelay: '0.2s' }}>
                  <Avatar avatarId={standings[1].avatar_id || 'avatar-2'} username={standings[1].username} size={54} />
                  <span className="font-createfuture text-xs font-black text-white italic uppercase tracking-[0.05em] mt-2 block overflow-visible whitespace-nowrap text-center max-w-full pl-1 pr-2">
                    {standings[1].username}
                  </span>
                  <div className="w-full h-24 bg-gradient-to-t from-white/5 to-[#94a3b8]/20 border-t-2 border-[#94a3b8] rounded-t-xl mt-2 flex flex-col items-center justify-start pt-2 relative shadow-glow-primary-sm">
                    <span className="font-createfuture text-[10px] font-black text-[#94a3b8]">2°</span>
                  </div>
                </div>
              ) : <div className="w-28" />}

              {/* 1st Place */}
              {standings[0] ? (
                <div className="flex flex-col items-center w-32 animate-fade-in z-10 shrink-0">
                  <div className="text-[#F5A623] animate-bounce mb-1 text-base text-center">👑</div>
                  <Avatar avatarId={standings[0].avatar_id || 'avatar-1'} username={standings[0].username} size={68} />
                  <span className="font-createfuture text-sm font-black text-[#F5A623] italic uppercase tracking-[0.05em] mt-2 block overflow-visible whitespace-nowrap text-center max-w-full pl-1 pr-2 drop-shadow-glow">
                    {standings[0].username}
                  </span>
                  <div className="w-full h-32 bg-gradient-to-t from-white/5 to-[#F5A623]/25 border-t-2 border-[#F5A623] rounded-t-xl mt-2 flex flex-col items-center justify-start pt-2 relative shadow-[0_0_25px_rgba(245,166,35,0.3)]">
                    <span className="font-createfuture text-[10px] font-black text-[#F5A623]">1° CAMPIONE</span>
                  </div>
                </div>
              ) : <div className="w-32" />}

              {/* 3rd Place */}
              {standings[2] ? (
                <div className="flex flex-col items-center w-28 animate-fade-in shrink-0" style={{ animationDelay: '0.4s' }}>
                  <Avatar avatarId={standings[2].avatar_id || 'avatar-3'} username={standings[2].username} size={54} />
                  <span className="font-createfuture text-xs font-black text-white italic uppercase tracking-[0.05em] mt-2 block overflow-visible whitespace-nowrap text-center max-w-full pl-1 pr-2">
                    {standings[2].username}
                  </span>
                  <div className="w-full h-16 bg-gradient-to-t from-white/5 to-[#d97706]/20 border-t-2 border-[#d97706] rounded-t-xl mt-2 flex flex-col items-center justify-start pt-2 relative">
                    <span className="font-createfuture text-[10px] font-black text-[#d97706]">3°</span>
                  </div>
                </div>
              ) : <div className="w-28" />}
            </div>
          ) : displayedActiveBattle ? (() => {
            const p1Participant = tournament?.participants?.find(p => (p.user_id || p.id || p.username) === (displayedActiveBattle.player1_user_id || displayedActiveBattle.player1_guest_name));
            const p2Participant = tournament?.participants?.find(p => (p.user_id || p.id || p.username) === (displayedActiveBattle.player2_user_id || displayedActiveBattle.player2_guest_name));

            const p1DispName = displayedActiveBattle.player1_guest_name || p1Participant?.username || displayedActiveBattle.p1?.username || 'Player 1';
            const p2DispName = displayedActiveBattle.player2_guest_name || p2Participant?.username || displayedActiveBattle.p2?.username || 'Player 2';

            const p1AvatarId = p1Participant?.avatar_id || displayedActiveBattle.p1?.avatar_id || 'avatar-1';
            const p2AvatarId = p2Participant?.avatar_id || displayedActiveBattle.p2?.avatar_id || 'avatar-2';

            return (
              <div 
                className={`flex-1 flex flex-col relative min-h-0 ${isAdmin && displayedActiveBattle.id ? 'cursor-pointer group' : ''}`}
                onClick={() => {
                  if (isAdmin && displayedActiveBattle.id) {
                    navigate(`/battle/live/${displayedActiveBattle.id}`);
                  }
                }}
              >
                {/* Round status indicator moved to bottom-left */}
                <div className="absolute bottom-0 left-0 z-20 flex items-center gap-2">
                   <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.25em] bg-[#0A0A1A]/90 px-3.5 py-1.5 rounded-lg border border-white/10 backdrop-blur-md shadow-md">
                     {displayedActiveBattle.isPreview ? `${displayedActiveBattle.roundTitle?.toUpperCase() || 'MATCH'} - IN ATTESA DI AVVIO` : `${displayedActiveBattle.roundTitle?.toUpperCase() || 'MATCH'} - ROUND ${liveRounds.length + 1} IN CORSO`}
                   </span>
                   {isAdmin && displayedActiveBattle.id && (
                     <span className="text-[9px] font-black text-primary uppercase tracking-widest bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/30 animate-pulse group-hover:scale-105 transition-transform">
                       ⚙️ Gestisci Match
                     </span>
                   )}
                </div>

                {/* Pulsating Arena Background Accent */}
                <div className="absolute top-10 inset-x-0 flex items-center justify-center pointer-events-none z-0">
                   <div className="w-48 h-48 rounded-full border border-[#4361EE]/10 animate-ping opacity-20" />
                   <div className="absolute w-36 h-36 rounded-full border border-[#E94560]/10 animate-pulse" />
                </div>

                {/* Top Section: Redesigned Match Live Header - Punteggi Giganti Centrali */}
                <div className="flex items-center justify-between w-full z-10 pb-6 shrink-0 px-2 border-b border-white/5">
                   {/* P1 Info */}
                   <div className="flex flex-col items-center gap-1.5 w-1/3 min-w-0">
                     <Avatar avatarId={p1AvatarId} username={p1DispName} size={54} />
                     <div className="text-center w-full px-1">
                       <div className="text-[10px] font-black text-white italic uppercase tracking-wider font-createfuture truncate max-w-full">
                         {p1DispName}
                       </div>
                       <div className="text-[8px] font-bold text-[#E94560] tracking-widest font-createfuture">
                         (P1)
                       </div>
                     </div>
                   </div>

                   {/* Center Giant Scores */}
                   <div className="flex items-center justify-center gap-4 shrink-0 px-2">
                     <div className="text-5xl md:text-7xl font-black text-[#E94560] font-createfuture tracking-tight drop-shadow-[0_0_30px_rgba(233,69,96,0.5)]">
                       {p1LiveScore}
                     </div>
                     <div className="flex flex-col items-center justify-center">
                       <div className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 backdrop-blur-md text-white/40 font-createfuture text-[8px] uppercase tracking-widest">
                         VS
                       </div>
                     </div>
                     <div className="text-5xl md:text-7xl font-black text-[#4361EE] font-createfuture tracking-tight drop-shadow-[0_0_30px_rgba(67,97,238,0.5)]">
                       {p2LiveScore}
                     </div>
                   </div>

                   {/* P2 Info */}
                   <div className="flex flex-col items-center gap-1.5 w-1/3 min-w-0">
                     <Avatar avatarId={p2AvatarId} username={p2DispName} size={54} />
                     <div className="text-center w-full px-1">
                       <div className="text-[10px] font-black text-white italic uppercase tracking-wider font-createfuture truncate max-w-full">
                         {p2DispName}
                       </div>
                       <div className="text-[8px] font-bold text-[#4361EE] tracking-widest font-createfuture">
                         (P2)
                       </div>
                     </div>
                   </div>
                </div>

                {/* Bottom Section: Rounds History List - Higher cards, bigger combos, larger score numbers */}
                <div className="w-full flex-1 min-h-0 overflow-y-auto no-scrollbar space-y-2.5 mt-2 pt-2 z-10 pb-8">
                  {liveRounds.length > 0 ? liveRounds.map((r, rIdx) => {
                    const ftMap = {
                      burst: { name: 'Burst Finish', color: '#E94560' },
                      ko: { name: 'KO Finish', color: '#4361EE' },
                      xtreme: { name: 'Xtreme Finish', color: '#F5A623' },
                      spin_finish: { name: 'Spin Finish', color: '#00D68F' },
                      draw: { name: 'Draw', color: '#6B7280' }
                    };
                    const ft = ftMap[r.finish_type] || { name: r.finish_type || 'Risultato', color: '#888' };
                    const p1Blade = parts.blades?.find(b => b.id === r.p1_blade_id);
                    const p2Blade = parts.blades?.find(b => b.id === r.p2_blade_id);
                    const isP1Win = r.winner_side === 'p1';
                    const isP2Win = r.winner_side === 'p2';
                    const isDraw = r.winner_side === 'draw';

                    return (
                      <div key={r.id || rIdx} className="flex items-center justify-between bg-white/[0.015] hover:bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 transition-all gap-3 shrink-0 shadow-sm">
                        {/* Left side: P1 Bey */}
                        <div className="flex items-center gap-3 flex-1 min-w-0 pr-1">
                          {p1Blade?.image_url ? (
                            <img src={p1Blade.image_url} alt="" className="w-10 h-10 object-contain shrink-0 drop-shadow-md" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[8px] text-white/20 shrink-0 font-createfuture">BEY</div>
                          )}
                          <span className={`font-createfuture text-[10px] truncate tracking-normal ${isP1Win ? 'text-[#E94560] font-black drop-shadow-glow' : 'text-white/50 font-bold'}`}>
                            {r.p1_combo_label || p1Blade?.name || 'Bey P1'}
                          </span>
                        </div>

                        {/* Center: Result / Finish Type badge */}
                        <div className="flex flex-col items-center justify-center px-1 shrink-0">
                          <div className="text-[8px] font-black uppercase tracking-[0.12em] px-2 py-1 rounded-md border backdrop-blur-sm shadow-sm whitespace-nowrap" style={{ color: isDraw ? '#9ca3af' : ft.color, borderColor: isDraw ? '#374151' : `${ft.color}40`, backgroundColor: isDraw ? 'rgba(255,255,255,0.03)' : `${ft.color}15` }}>
                            {isDraw ? 'DRAW' : ft.name}
                          </div>
                        </div>

                        {/* Right side: P2 Bey */}
                        <div className="flex items-center gap-3 flex-1 min-w-0 pl-1 justify-end text-right">
                          <span className={`font-createfuture text-[10px] truncate tracking-normal ${isP2Win ? 'text-[#4361EE] font-black drop-shadow-glow' : 'text-white/50 font-bold'}`}>
                            {r.p2_combo_label || p2Blade?.name || 'Bey P2'}
                          </span>
                          {p2Blade?.image_url ? (
                            <img src={p2Blade.image_url} alt="" className="w-10 h-10 object-contain shrink-0 drop-shadow-md" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[8px] text-white/20 shrink-0 font-createfuture">BEY</div>
                          )}
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="text-center py-6 text-[10px] font-createfuture text-white/20 uppercase tracking-widest">
                      Nessun round completato
                    </div>
                  )}
                </div>
              </div>
            );
          })() : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4 min-h-0">
               <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/20 mb-4 animate-pulse shrink-0">
                 <Swords size={36} />
               </div>
               <div className="text-white font-black italic uppercase text-lg font-createfuture tracking-wider mb-1">
                 Nessun match in corso
               </div>
               <div className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] max-w-xs">
                 L'arena è libera. I blader si stanno preparando per il prossimo scontro.
               </div>
            </div>
          )}
        </div>

        {/* COL 2: Standings Standings */}
        <div className="h-full flex flex-col bg-[#12122A]/60 border-2 border-[#F5A623]/40 rounded-3xl p-5 relative overflow-hidden shadow-[0_0_30px_rgba(245,166,35,0.1)] backdrop-blur-md">
          <div className="absolute top-0 right-0 bg-[#F5A623] text-[#0A0A1A] text-[8px] font-black px-4 py-1 rounded-bl-xl uppercase tracking-widest font-createfuture">
            CLASSIFICA LIVE
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <User size={18} className="text-[#F5A623]" />
              <h2 className="text-sm font-black text-white uppercase tracking-[0.2em] font-createfuture">Standings</h2>
            </div>
            {totalPages > 1 && (
              <div className="text-[9px] font-black text-[#F5A623] uppercase tracking-widest">
                Pag. {currentStandingsPage + 1} / {totalPages}
              </div>
            )}
          </div>

          {/* Standings Table */}
          <div className="flex-1 flex flex-col min-h-0 bg-white/[0.02] rounded-2xl border border-white/5 overflow-hidden">
            <div className="grid grid-cols-[30px_1fr_20px_20px_20px_26px_36px] gap-1 px-3 py-2 bg-white/5 border-b border-white/5 text-[8px] font-black text-white/30 uppercase tracking-widest shrink-0 font-createfuture">
               <div className="text-center">POS</div>
               <div className="text-left">BLADER</div>
               <div className="text-center">W</div>
               <div className="text-center">L</div>
               <div className="text-center">D</div>
               <div className="text-center text-[#E94560]/60">KO</div>
               <div className="text-right text-[#F5A623]">PTS</div>
            </div>

            <div className="flex-1 flex flex-col justify-start gap-2 min-h-0 px-2 py-2 overflow-y-auto">
              {displayedStandings.map((s, idx) => {
                const globalRank = currentStandingsPage * itemsPerPage + idx + 1;
                return (
                  <div key={s.user_id || s.username} className="grid grid-cols-[30px_1fr_20px_20px_20px_26px_36px] gap-1 items-center px-2 py-1.5 rounded-xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-colors shrink-0 overflow-visible">
                     <div className="text-center font-createfuture text-[11px] font-black text-white/30 shrink-0">
                       {globalRank}
                     </div>
                     <div className="flex items-center gap-2 min-w-0 pr-1 overflow-visible">
                       <Avatar avatarId={s.avatar_id || `avatar-${(globalRank % 12) + 1}`} username={s.username} size={28} />
                       <span className="font-createfuture text-[11px] font-bold text-white/90 italic uppercase tracking-[0.05em] block overflow-visible whitespace-nowrap">
                         {s.username}
                       </span>
                     </div>
                     <div className="text-center font-createfuture text-[11px] text-white/70 shrink-0">{s.won}</div>
                     <div className="text-center font-createfuture text-[11px] text-white/30 shrink-0">{s.lost}</div>
                     <div className="text-center font-createfuture text-[11px] text-white/40 shrink-0">{s.draws || 0}</div>
                     <div className="text-center font-createfuture text-[11px] text-[#E94560]/80 font-bold shrink-0">{s.koPoints || 0}</div>
                     <div className="text-right font-createfuture text-xs font-black text-[#F5A623] shrink-0">
                       {s.points}
                     </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* COL 3: Schedule & History Stack */}
        <div className="h-full flex flex-col gap-6 min-h-0">
          
          {/* Upcoming Block */}
          <div className="flex-1 flex flex-col bg-[#12122A]/60 border-2 border-white/10 rounded-3xl p-5 relative overflow-hidden backdrop-blur-md min-h-0">
            <div className="flex items-center gap-2 mb-3 shrink-0">
              <Clock size={16} className="text-white/40" />
              <h2 className="text-xs font-black text-white uppercase tracking-[0.2em] font-createfuture">Prossimi Match</h2>
            </div>

            <div className="flex-1 flex flex-col justify-around min-h-0 gap-2">
              {upcomingMatches.length > 0 ? upcomingMatches.map((m, idx) => (
                <div key={idx} className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 min-h-0">
                  <div className="text-[10px] font-black text-white/30 uppercase tracking-widest font-createfuture shrink-0 w-16">
                    {m.roundTitle}
                  </div>
                  <div className="flex-1 flex items-center justify-center gap-2 min-w-0">
                    <span className="font-createfuture text-[11px] font-black text-white uppercase truncate text-right flex-1">
                      {m.p1?.username}
                    </span>
                    <span className="text-[8px] font-black text-white/20 uppercase shrink-0">VS</span>
                    <span className="font-createfuture text-[11px] font-black text-white uppercase truncate text-left flex-1">
                      {m.p2?.username}
                    </span>
                  </div>
                </div>
              )) : (
                <div className="flex-1 flex items-center justify-center text-center text-white/30 text-xs font-createfuture uppercase tracking-widest">
                  Nessun match in attesa
                </div>
              )}
            </div>
          </div>

          {/* Past Matches Block */}
          <div className="flex-1 flex flex-col bg-[#12122A]/60 border-2 border-[#E94560]/40 rounded-3xl p-5 relative overflow-hidden shadow-[0_0_30px_rgba(233,69,96,0.1)] backdrop-blur-md min-h-0">
            <div className="absolute top-0 right-0 bg-[#E94560] text-white text-[8px] font-black px-4 py-1 rounded-bl-xl uppercase tracking-widest font-createfuture">
              STORICO LOOP
            </div>

            <div className="flex items-center justify-between mb-3 shrink-0">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#E94560]" />
                <h2 className="text-xs font-black text-white uppercase tracking-[0.2em] font-createfuture">Match Passati</h2>
              </div>
              {totalPastPages > 1 && (
                <div className="text-[8px] font-black text-[#E94560] uppercase tracking-widest">
                  Pag. {currentPastPage + 1} / {totalPastPages}
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col justify-around min-h-0 gap-2">
              {displayedPastMatches.length > 0 ? displayedPastMatches.map((m, idx) => {
                const globalPastIndex = currentPastPage * pastMatchesPerPage + idx;
                const isHighlighted = globalPastIndex === currentPastLoopIndex;
                
                return (
                  <div 
                    key={idx} 
                    className={`flex flex-col justify-center px-4 py-2 rounded-xl transition-all duration-500 overflow-hidden min-h-0
                      ${isHighlighted ? 'bg-[#E94560]/10 border-2 border-[#E94560] shadow-glow-primary-sm scale-[1.02]' : 'bg-white/[0.02] border border-white/5'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-[9px] font-black text-white/40 uppercase tracking-widest font-createfuture shrink-0">
                        {m.roundTitle}
                      </div>
                      
                      <div className="flex-1 flex items-center justify-center gap-3 min-w-0 px-2">
                        <span className={`font-createfuture text-[11px] font-black uppercase truncate text-right flex-1 ${m.winner === 'p1' ? 'text-primary' : 'text-white/60'}`}>
                          {m.p1?.username}
                        </span>
                        
                        <div className="px-2 py-0.5 rounded bg-white/5 border border-white/10 font-createfuture text-[10px] font-black text-white shrink-0">
                          {m.score?.p1 ?? 0} - {m.score?.p2 ?? 0}
                        </div>

                        <span className={`font-createfuture text-[11px] font-black uppercase truncate text-left flex-1 ${m.winner === 'p2' ? 'text-primary' : 'text-white/60'}`}>
                          {m.p2?.username}
                        </span>
                      </div>
                    </div>

                    {/* Expand Details on loop */}
                    {isHighlighted && (
                      <div className="mt-1.5 pt-1.5 border-t border-[#E94560]/20 flex items-center justify-between text-[9px] font-black animate-fade-in">
                        <span className="text-white/40 uppercase tracking-widest">Esito Scontro:</span>
                        <span className="text-[#E94560] uppercase tracking-widest font-createfuture">
                          {m.winner === 'draw' ? 'PAREGGIO' : `VITTORIA ${(m.winner === 'p1' ? m.p1?.username : m.p2?.username)}`}
                        </span>
                      </div>
                    )}
                  </div>
                );
              }) : (
                <div className="flex-1 flex items-center justify-center text-center text-white/30 text-xs font-createfuture uppercase tracking-widest">
                  Nessun match completato
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}

function AuctionDisplaySubView({ tournament, parts }) {
  const auction = tournament.structure?.auction;
  const [timeLeft, setTimeLeft] = React.useState(10);

  React.useEffect(() => {
    if (!auction?.currentAuction) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((auction.currentAuction.timerExpiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);
    }, 200);
    return () => clearInterval(interval);
  }, [auction?.currentAuction]);

  if (!auction) {
    return (
      <div className="min-h-screen bg-[#0A0A1A] p-8 flex flex-col items-center justify-center text-center select-none font-createfuture">
        <div className="w-24 h-24 bg-gradient-to-br from-[#F5A623] to-[#FF7E5F] rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(245,166,35,0.4)] animate-pulse">
          <span className="text-5xl">🪙</span>
        </div>
        <div className="text-xs font-black text-[#F5A623] tracking-[0.3em] uppercase mb-3">Modalità Asta</div>
        <h1 className="text-4xl md:text-6xl font-black italic uppercase text-white tracking-wide mb-4">
          {tournament.name}
        </h1>
        <p className="text-white/40 text-sm font-bold uppercase tracking-widest max-w-lg mb-12">
          Iscrizioni in corso... L'organizzatore avvierà l'asta a breve. Preparate i vostri crediti!
        </p>
        <div className="flex gap-4">
          <div className="bg-[#12122A] border border-white/5 px-8 py-4 rounded-3xl">
            <div className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Blader Iscritti</div>
            <div className="text-3xl font-black text-white">{tournament.participants?.length || 0}</div>
          </div>
          <div className="bg-[#12122A] border border-white/5 px-8 py-4 rounded-3xl">
            <div className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Modalità</div>
            <div className="text-3xl font-black text-[#F5A623]">ASTA</div>
          </div>
        </div>
      </div>
    );
  }

  const getGlowColor = (type) => {
    if (type === 'attack') return '#ef4444';
    if (type === 'defense') return '#3b82f6';
    return '#22c55e';
  };

  const getPackIcon = (type) => {
    // Return simple strings or reuse imported Lucide icons if available, let's use rich HTML strings/emojis as robust proiettore fallbacks
    if (type === 'attack') return '⚔️';
    if (type === 'defense') return '🛡️';
    return '💨';
  };

  const isAuctionComplete = tournament.status === 'draft_complete';
  const currentParticipantId = isAuctionComplete ? null : auction.turnOrder[auction.currentTurnIndex];
  const currentParticipant = currentParticipantId ? tournament.participants?.find(p => p.id === currentParticipantId || p.user_id === currentParticipantId || p.username === currentParticipantId) : null;

  const activeAuctionPack = auction.currentAuction 
    ? auction.availablePacks.find(p => p.id === auction.currentAuction.packId) 
    : null;
    
  const activeAuctionCombo = activeAuctionPack 
    ? tournament.structure?.pool?.find(c => c.id === activeAuctionPack.combo_id)
    : null;
    
  const activeAuctionBlade = activeAuctionCombo 
    ? parts?.blades?.find(b => b.id === activeAuctionCombo.blade_id) 
    : null;

  const highestBidderObj = auction.currentAuction 
    ? tournament.participants?.find(p => p.id === auction.currentAuction.highestBidder || p.user_id === auction.currentAuction.highestBidder || p.username === auction.currentAuction.highestBidder)
    : null;

  return (
    <div className="min-h-screen bg-[#0A0A1A] p-4 md:p-8 flex flex-col justify-between overflow-y-auto select-none font-sans">
      {/* Intestazione */}
      <div className="text-center mb-6 shrink-0">
        <h1 className="text-3xl md:text-5xl font-black italic uppercase text-white tracking-[0.05em] mb-3">
          {tournament.name} - Modalità Asta
        </h1>
        {isAuctionComplete ? (
          <div className="text-xl md:text-2xl text-green-400 font-black italic uppercase animate-pulse">
            Asta Completata! In attesa della generazione del tabellone...
          </div>
        ) : auction.currentAuction && activeAuctionPack ? (
          <div className="inline-flex items-center gap-6 bg-[#F5A623]/20 border-2 border-[#F5A623] px-8 py-3 rounded-full shadow-[0_0_40px_rgba(245,166,35,0.3)] animate-pulse">
            <span className="text-xl text-[#F5A623] font-black uppercase tracking-widest">ASTA IN CORSO</span>
            <span className="text-3xl font-black text-white">⏱️ {timeLeft}s</span>
          </div>
        ) : currentParticipant ? (
          <div className="inline-block bg-[#4361EE]/20 border-2 border-[#4361EE] px-8 py-3 rounded-full shadow-[0_0_30px_rgba(67,97,238,0.3)]">
            <span className="text-xl text-white/70 font-bold uppercase mr-3 tracking-[0.05em]">Turno di Nomina:</span>
            <span className="text-3xl text-white font-black italic uppercase tracking-[0.05em]">{currentParticipant.username}</span>
          </div>
        ) : null}
      </div>

      {/* Area Principale: Bidding Feature o Griglia Pacchetti */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-7xl mx-auto my-auto py-4">
        {auction.currentAuction && activeAuctionPack ? (
          <div className="flex flex-col md:flex-row items-center justify-center gap-12 bg-gradient-to-b from-[#151525] to-[#0D0D1A] border-2 border-[#F5A623] rounded-[48px] p-8 md:p-12 w-full max-w-5xl shadow-[0_0_80px_rgba(245,166,35,0.2)]">
            {/* Immagine Gigante del Beyblade */}
            <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center shrink-0">
              <div className="absolute inset-0 bg-[#F5A623]/20 blur-[60px] rounded-full"></div>
              {activeAuctionBlade ? (
                <img src={activeAuctionBlade.image_url} alt={activeAuctionBlade.name} className="absolute inset-0 w-full h-full object-contain drop-shadow-[0_0_30px_rgba(255,255,255,0.4)] animate-[float_3s_ease-in-out_infinite]" />
              ) : (
                <span className="text-white/20 font-black text-6xl">?</span>
              )}
            </div>

            {/* Dettagli dell'Offerta Corrente */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-6 flex-1">
              <div>
                <span className="text-xs font-black uppercase px-4 py-1 rounded-full border tracking-widest" style={{ borderColor: getGlowColor(activeAuctionPack.type), color: getGlowColor(activeAuctionPack.type) }}>
                  {activeAuctionPack.type}
                </span>
                <h2 className="text-4xl md:text-6xl font-black italic uppercase text-white tracking-wide mt-3 leading-tight font-createfuture">
                  {activeAuctionBlade?.name || 'Combo Sconosciuta'}
                </h2>
              </div>

              <div className="bg-black/50 border border-white/10 rounded-3xl p-6 w-full flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-white/40 uppercase tracking-widest mb-1">Miglior Offerente</div>
                  <div className="text-2xl md:text-3xl font-black text-white italic uppercase font-createfuture">
                    {highestBidderObj?.username || 'Offerta Base'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-white/40 uppercase tracking-widest mb-1">Offerta</div>
                  <div className="text-4xl md:text-5xl font-black text-[#F5A623] font-createfuture">
                    🪙 {auction.currentAuction.currentBid}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Griglia di tutti i pack disponibili */
          <div className="flex flex-wrap justify-center items-center gap-4 w-full content-center">
            {auction.availablePacks.map((pack, index) => {
              const glowColor = getGlowColor(pack.type);
              const icon = getPackIcon(pack.type);
              let displayType = pack.type;
              if (pack.type === 'balance' || pack.type === 'stamina') displayType = 'STAMINA';

              const poolCombo = tournament.structure?.pool?.find(c => c.id === pack.combo_id);
              const blade = poolCombo ? parts?.blades?.find(b => b.id === poolCombo.blade_id) : null;
              const owner = pack.isOpened ? tournament.participants?.find(p => p.id === pack.owner || p.user_id === pack.owner || p.username === pack.owner) : null;

              return (
                <div 
                  key={pack.id} 
                  className={`draft-card is-display shrink-0 ${pack.isOpened ? 'is-opened opacity-50' : ''} transition-all duration-500`}
                  style={{ 
                    '--glow-color': glowColor,
                    width: '130px',
                    height: '180px'
                  }}
                >
                  <div className="draft-card-content">
                    <div className="draft-card-back">
                      <div className="draft-card-back-content font-createfuture tracking-[0.05em] p-2 flex flex-col items-center justify-between h-full">
                        {blade ? (
                          <>
                            <img src={blade.image_url} alt={blade.name} className="w-12 h-12 object-contain drop-shadow-md mb-1" />
                            <div className="text-[10px] font-black uppercase text-center truncate w-full text-white">{blade.name}</div>
                            <div className="text-[8px] font-bold uppercase opacity-80" style={{ color: glowColor }}>{displayType}</div>
                          </>
                        ) : (
                          <>
                            <img src="/beyx.svg" alt="BeyX Logo" className="w-10 h-10 mb-1 opacity-50 drop-shadow-md" />
                            <div className="opacity-80 text-xl" style={{ color: glowColor }}>{icon}</div>
                            <div className="text-[8px] font-black uppercase opacity-80 text-center" style={{ color: glowColor }}>{displayType}</div>
                          </>
                        )}
                        <div className="text-xs font-black opacity-40 leading-none">{index + 1}</div>
                      </div>
                    </div>
                    <div className="draft-card-front">
                      <div className="circle" id="bottom-circle" style={{ '--glow-color': glowColor }}></div>
                      <div className="circle" id="right-circle"></div>
                      <div className="draft-card-front-content">
                        <div className="draft-card-description font-createfuture tracking-[0.05em]">
                           {pack.isOpened ? (
                             <>
                               <div className="text-xl mb-1">❌</div>
                               <div className="flex flex-col items-center justify-center w-full">
                                 <span className="text-[8px] font-black text-white text-center uppercase tracking-[0.05em]">AGGIUDICATO</span>
                                 <span className="text-[7px] text-white/70 text-center uppercase mt-0.5 tracking-[0.05em] truncate max-w-[90%]">{owner?.username}</span>
                                 <span className="text-[6px] font-black text-[#F5A623] mt-0.5">{pack.price} CRD</span>
                               </div>
                             </>
                           ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Griglia Inferiore: Fondi Rimasti e Status Deck */}
      <div className="mt-6 pt-6 border-t border-white/10 w-full shrink-0 font-createfuture">
        <div className="flex flex-wrap justify-center gap-4 max-w-7xl mx-auto">
          {tournament.participants?.map(participant => {
            const pId = participant.id || participant.user_id || participant.username;
            const remainingCredits = auction.playerCredits[pId] || 0;
            const acquiredDeck = auction.playerDecks[pId] || [];
            const isFull = acquiredDeck.length >= auction.deckSize;

            return (
              <div key={pId} className={`flex-1 min-w-[180px] p-4 rounded-3xl border transition-all ${isFull ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/5'}`}>
                <div className="text-xs font-black uppercase text-white/60 tracking-wider truncate mb-2 text-center">
                  {participant.username}
                </div>
                <div className="flex justify-between items-center px-2">
                  <div className="text-lg font-black text-[#F5A623]">
                    🪙 {remainingCredits}
                  </div>
                  <div className={`text-xs font-black px-2 py-0.5 rounded ${isFull ? 'bg-green-500 text-white' : 'bg-white/10 text-white/60'}`}>
                    {acquiredDeck.length} / {auction.deckSize}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
