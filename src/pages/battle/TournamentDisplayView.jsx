import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Sword, Shield, Wind } from 'lucide-react';
import '../../components/battle/DraftCard.css';

export default function TournamentDisplayView() {
  const { id } = useParams();
  const [tournament, setTournament] = useState(null);
  const [revealingPack, setRevealingPack] = useState(null);
  const [revealedCombo, setRevealedCombo] = useState(null);
  const [parts, setParts] = useState({ blades: [], ratchets: [], bits: [] });

  useEffect(() => {
    let currentTournament = null;

    const fetchTournament = async () => {
      const [tourneyRes, bladesRes, ratchetsRes, bitsRes] = await Promise.all([
        supabase.from('tournaments').select('*').eq('id', id).single(),
        supabase.from('blades').select('*'),
        supabase.from('ratchets').select('*'),
        supabase.from('bits').select('*')
      ]);
      
      currentTournament = tourneyRes.data;
      setTournament(tourneyRes.data);
      setParts({
        blades: bladesRes.data || [],
        ratchets: ratchetsRes.data || [],
        bits: bitsRes.data || []
      });
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
          const { data: newTourney } = await supabase.from('tournaments').select('*').eq('id', id).single();
          if (!newTourney) return;
          
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

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

  if (!tournament) {
    return <div className="min-h-screen bg-[#0A0A1A] flex items-center justify-center text-white font-black italic text-3xl">Caricamento Display...</div>;
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
      <div className="min-h-screen bg-[#0A0A1A] p-8 flex flex-col">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black italic uppercase text-white tracking-[0.05em] mb-4">
            {tournament.name} - Fase di Draft
          </h1>
          {currentParticipant ? (
            <div className="inline-block bg-[#4361EE]/20 border-2 border-[#4361EE] px-8 py-4 rounded-full shadow-[0_0_30px_rgba(67,97,238,0.3)]">
              <span className="text-xl text-white/70 font-bold uppercase mr-4 tracking-[0.05em]">Turno di:</span>
              <span className="text-4xl text-white font-black italic uppercase tracking-[0.05em]">{currentParticipant.username}</span>
            </div>
          ) : (
            <div className="text-2xl text-green-400 font-black italic uppercase animate-pulse">
              Draft Completato! In attesa della generazione del tabellone...
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-wrap justify-center items-center gap-6 max-w-7xl mx-auto w-full">
          {draft.availablePacks.map((pack, index) => {
            const isOpened = pack.isOpened;
            const owner = isOpened ? tournament.participants.find(p => p.id === pack.owner || p.user_id === pack.owner || p.username === pack.owner) : null;
            
            let glowColor = '#22c55e';
            let Icon = Wind;
            if (pack.type === 'attack') { glowColor = '#ef4444'; Icon = Sword; }
            if (pack.type === 'defense') { glowColor = '#3b82f6'; Icon = Shield; }
            
            let displayType = pack.type;
            if (pack.type === 'balance' || pack.type === 'stamina') displayType = 'STAMINA';

            return (
              <div 
                key={pack.id} 
                className={`draft-card is-display w-[190px] h-[254px] shrink-0 ${isOpened ? 'is-opened' : ''} transition-all duration-500`}
                style={{ '--glow-color': glowColor }}
              >
                <div className="draft-card-content">
                  <div className="draft-card-back">
                    <div className="draft-card-back-content font-createfuture tracking-[0.05em]">
                      <img src="/beyx.svg" alt="BeyX Logo" className="w-14 h-14 mb-4 opacity-50 drop-shadow-md" />
                      <div className="mb-4 opacity-80" style={{ color: glowColor }}><Icon size={48} /></div>
                      <div className="text-sm font-black uppercase opacity-80 mb-2 text-center" style={{ color: glowColor }}>{displayType}</div>
                      <div className="text-xl font-black opacity-40">{index + 1}</div>
                    </div>
                  </div>
                  <div className="draft-card-front">
                    <div className="circle" id="bottom-circle" style={{ '--glow-color': glowColor }}></div>
                    <div className="circle" id="right-circle"></div>
                    <div className="draft-card-front-content">
                      <div className="draft-card-description">
                         {isOpened ? (
                           <>
                             <div className="text-3xl mb-2">❌</div>
                             <div className="text-sm font-black text-white text-center px-2 uppercase">
                               Scelto da<br/>{owner?.username}
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

  // Fallback for other states
  return (
    <div className="min-h-screen bg-[#0A0A1A] flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-6xl font-black italic uppercase text-white mb-6">
        {tournament.name}
      </h1>
      <p className="text-2xl text-white/50">
        {tournament.status === 'setup' ? "In attesa dell'inizio..." : "Guarda i risultati sul tuo dispositivo!"}
      </p>
    </div>
  );
}
