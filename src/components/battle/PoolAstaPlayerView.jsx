import React, { useState, useEffect } from 'react';
import { Shield, Sword, Wind, X, Plus, Minus, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import './DraftCard.css';

export function PoolAstaPlayerView({ tournament, setTournament, updateTournamentDB, onAuctionComplete, onDelete, parts }) {
  const { user } = useAuthStore();
  const [selectedDeckCombo, setSelectedDeckCombo] = useState(null);
  const auction = tournament?.structure?.auction;
  
  const [timeLeft, setTimeLeft] = useState(10);

  // Realtime countdown timer calculation
  useEffect(() => {
    if (!auction?.currentAuction) return;
    
    const interval = setInterval(() => {
      const expiresAt = auction.currentAuction.timerExpiresAt;
      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);

      // Automatic resolution when timer expires or if all other eligible players have folded
      if (remaining === 0) {
        // Let the creator or highest bidder trigger conclusion to avoid spam
        const isResponsible = tournament.created_by === user.id || auction.currentAuction.highestBidder === user.id;
        if (isResponsible) {
          handleConcludeAuction();
        }
      } else {
        // Check if only 1 or 0 active bidders remain
        const activeBidders = auction.turnOrder.filter(pId => {
          if (pId === auction.currentAuction.highestBidder) return true;
          const deck = auction.playerDecks[pId] || [];
          if (deck.length >= auction.deckSize) return false;
          if (auction.currentAuction.foldedPlayers?.includes(pId)) return false;
          return true;
        });

        if (activeBidders.length <= 1) {
          const isResponsible = tournament.created_by === user.id || auction.currentAuction.highestBidder === user.id;
          if (isResponsible) {
            handleConcludeAuction();
          }
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [auction?.currentAuction, tournament, user.id]);
  
  if (!auction) return null;

  const currentTurnParticipantId = auction.turnOrder[auction.currentTurnIndex];
  const isOrganizer = tournament.created_by === user.id;
  
  const currentParticipant = tournament.participants.find(p => p.id === currentTurnParticipantId || p.user_id === currentTurnParticipantId || p.username === currentTurnParticipantId);
  const isMyNominationTurn = currentParticipant?.user_id === user.id || (!currentParticipant?.user_id && isOrganizer);
  const activeTurnParticipantId = currentParticipant?.user_id || currentTurnParticipantId;
  const activeTurnCredits = auction.playerCredits[activeTurnParticipantId] || 0;
  const activeTurnDeck = auction.playerDecks[activeTurnParticipantId] || [];
  const isActiveTurnDeckFull = activeTurnDeck.length >= auction.deckSize;

  const myCredits = auction.playerCredits[user.id] || 0;
  const myDeck = auction.playerDecks[user.id] || [];
  const isMyDeckFull = myDeck.length >= auction.deckSize;

  // 1. Iniziare l'asta di un pacchetto (Nomination)
  const handleNominatePack = async (pack) => {
    if (!isMyNominationTurn) return;
    if (pack.isOpened) return;
    if (auction.currentAuction) return; // Asta già in corso
    if (isActiveTurnDeckFull) {
      useToastStore.getState().error("Il giocatore ha già completato il suo Deck!");
      return;
    }
    if (activeTurnCredits < 1) {
      useToastStore.getState().error("Il giocatore non ha abbastanza crediti per la base d'asta!");
      return;
    }

    const currentTurnUserId = currentParticipant?.user_id || currentTurnParticipantId;

    const newAuction = {
      packId: pack.id,
      highestBidder: currentTurnUserId,
      currentBid: 1, // Offerta base automatica
      foldedPlayers: [],
      timerExpiresAt: Date.now() + 10000 // Countdown di 10 secondi
    };

    const newAuctionState = {
      ...auction,
      currentAuction: newAuction,
      lastAction: {
        type: 'nominate',
        packId: pack.id,
        participantId: currentTurnUserId,
        timestamp: Date.now()
      }
    };

    const updated = {
      ...tournament,
      structure: {
        ...tournament.structure,
        auction: newAuctionState
      }
    };

    setTournament(updated);
    await updateTournamentDB(updated);
    useToastStore.getState().success("Hai aperto l'asta per questo Beyblade con 1 credito!");
  };

  // 2. Fare un'offerta (Bid +1, +5, +10)
  const handlePlaceBid = async (amount) => {
    if (!auction.currentAuction) return;
    const { currentBid, highestBidder, foldedPlayers } = auction.currentAuction;
    
    if (highestBidder === user.id) return; // Già in testa
    if (foldedPlayers.includes(user.id)) return; // Ritirato
    if (isMyDeckFull) return;

    const newBid = currentBid + amount;
    if (myCredits < newBid) {
      useToastStore.getState().error("Non hai abbastanza crediti per questa offerta!");
      return;
    }

    const updatedCurrentAuction = {
      ...auction.currentAuction,
      highestBidder: user.id,
      currentBid: newBid,
      timerExpiresAt: Date.now() + 10000 // Reset timer a 10 secondi
    };

    const newAuctionState = {
      ...auction,
      currentAuction: updatedCurrentAuction,
      lastAction: {
        type: 'bid',
        amount: newBid,
        participantId: user.id,
        timestamp: Date.now()
      }
    };

    const updated = {
      ...tournament,
      structure: {
        ...tournament.structure,
        auction: newAuctionState
      }
    };

    setTournament(updated);
    await updateTournamentDB(updated);
  };

  // 3. Ritirarsi dall'asta (Fold)
  const handleFold = async () => {
    if (!auction.currentAuction) return;
    if (auction.currentAuction.foldedPlayers.includes(user.id)) return;

    const updatedCurrentAuction = {
      ...auction.currentAuction,
      foldedPlayers: [...auction.currentAuction.foldedPlayers, user.id]
    };

    const newAuctionState = {
      ...auction,
      currentAuction: updatedCurrentAuction
    };

    const updated = {
      ...tournament,
      structure: {
        ...tournament.structure,
        auction: newAuctionState
      }
    };

    setTournament(updated);
    await updateTournamentDB(updated);
  };

  // 4. Concludere l'asta (Aggiudicazione)
  const handleConcludeAuction = async () => {
    // Rileggi dallo state corrente per sicurezza
    if (!auction?.currentAuction) return;
    
    const { packId, highestBidder, currentBid } = auction.currentAuction;
    
    // Aggiorna pack
    const newPacks = auction.availablePacks.map(p => 
      p.id === packId ? { ...p, isOpened: true, owner: highestBidder, price: currentBid } : p
    );

    // Aggiorna crediti e deck
    const newCredits = { ...auction.playerCredits };
    newCredits[highestBidder] = Math.max(0, (newCredits[highestBidder] || 0) - currentBid);

    const newDecks = { ...auction.playerDecks };
    newDecks[highestBidder] = [...(newDecks[highestBidder] || []), auction.availablePacks.find(p => p.id === packId)?.combo_id];

    // Trova il prossimo giocatore idoneo a nominare (il cui deck non è pieno)
    let nextIndex = (auction.currentTurnIndex + 1) % auction.turnOrder.length;
    let iterations = 0;
    while (iterations < auction.turnOrder.length) {
      const candidateId = auction.turnOrder[nextIndex];
      const candidateDeck = newDecks[candidateId] || [];
      if (candidateDeck.length < auction.deckSize) {
        break;
      }
      nextIndex = (nextIndex + 1) % auction.turnOrder.length;
      iterations++;
    }

    // Controlla se l'asta generale è completata
    const allDecksFull = auction.turnOrder.every(pId => (newDecks[pId] || []).length >= auction.deckSize);
    const allPacksOpened = newPacks.every(p => p.isOpened);
    const isAuctionComplete = allDecksFull || allPacksOpened;

    const newAuctionState = {
      ...auction,
      availablePacks: newPacks,
      playerCredits: newCredits,
      playerDecks: newDecks,
      currentTurnIndex: nextIndex,
      currentAuction: null,
      lastAction: {
        type: 'conclude',
        packId,
        winnerId: highestBidder,
        price: currentBid,
        timestamp: Date.now()
      }
    };

    const updated = {
      ...tournament,
      structure: {
        ...tournament.structure,
        auction: newAuctionState
      }
    };

    if (isAuctionComplete) {
      updated.status = 'draft_complete';
    }

    setTournament(updated);
    await updateTournamentDB(updated);
  };

  const getGlowColor = (type) => {
    if (type === 'attack') return '#ef4444';
    if (type === 'defense') return '#3b82f6';
    return '#22c55e';
  };

  const getPackIcon = (type) => {
    if (type === 'attack') return <Sword size={24} />;
    if (type === 'defense') return <Shield size={24} />;
    return <Wind size={24} />;
  };

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
    ? tournament.participants.find(p => p.id === auction.currentAuction.highestBidder || p.user_id === auction.currentAuction.highestBidder || p.username === auction.currentAuction.highestBidder)
    : null;

  return (
    <div className="space-y-6 pb-20">
      {/* Intestazione e Statistiche Crediti del Giocatore */}
      <div className="bg-[#12122A] p-6 rounded-[32px] border border-[#F5A623]/30 shadow-[0_0_25px_rgba(245,166,35,0.15)] text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#F5A623]/5 rounded-full blur-2xl"></div>
        <h2 className="text-2xl font-black italic uppercase text-white mb-1">Asta a Crediti</h2>
        <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold mb-4">I tuoi fondi disponibili</p>
        
        <div className="inline-flex items-center gap-3 bg-black/40 px-6 py-3 rounded-2xl border border-white/5">
          <span className="text-2xl">🪙</span>
          <span className="text-3xl font-black text-[#F5A623] tracking-wider">{myCredits}</span>
          <span className="text-xs text-white/40 uppercase font-bold mt-1">CRD</span>
        </div>
      </div>

      {tournament.status === 'draft_complete' ? (
        <div className="bg-[#12122A] p-8 rounded-[32px] border border-green-500/30 text-center space-y-4">
          <div className="text-green-400 font-bold uppercase tracking-widest animate-pulse text-lg">
            Asta Completata!
          </div>
          <p className="text-xs text-white/50">Tutti i blader hanno completato i loro deck.</p>
          {isOrganizer && (
            <button 
              onClick={onAuctionComplete}
              className="w-full bg-green-500 text-white font-black uppercase tracking-widest py-4 rounded-2xl shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:scale-105 active:scale-95 transition-all"
            >
              Genera Tabellone
            </button>
          )}
        </div>
      ) : auction.currentAuction && activeAuctionPack ? (
        /* VISTA ASTA ATTIVA (Bidding in corso) */
        <div className="bg-gradient-to-b from-[#1A1A3A] to-[#0A0A1A] p-6 rounded-[32px] border-2 border-[#F5A623] shadow-[0_0_40px_rgba(245,166,35,0.25)] space-y-6 animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping"></span>
              <span className="text-xs font-black uppercase text-[#F5A623] tracking-widest">Asta Live</span>
            </div>
            
            {/* Timer Countdown */}
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 px-3 py-1.5 rounded-xl">
              <span className="text-xs font-black text-red-400">⏱️ {timeLeft}s</span>
            </div>
          </div>

          {/* Dettaglio del Beyblade all'Asta */}
          <div className="flex flex-col items-center justify-center py-2">
            <div className="relative w-36 h-36 md:w-44 md:h-44 mb-3">
              <div className="absolute inset-0 bg-[#F5A623]/10 blur-xl rounded-full"></div>
              {activeAuctionBlade && (
                <img src={activeAuctionBlade.image_url} alt={activeAuctionBlade.name} className="absolute inset-0 w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] animate-[float_3s_ease-in-out_infinite]" />
              )}
            </div>
            <h3 className="text-2xl md:text-3xl font-black italic uppercase text-white tracking-wide text-center">
              {activeAuctionBlade?.name || 'Combo Sconosciuta'}
            </h3>
            {activeAuctionBlade && (
              <div className="text-[10px] font-black uppercase text-purple-400 mt-1">
                {activeAuctionBlade.topRank ? `TOP ${activeAuctionBlade.topRank}` : 'TOP -'}
              </div>
            )}
            <span className="text-[10px] font-bold uppercase px-3 py-1 rounded-full border mt-2" style={{ borderColor: getGlowColor(activeAuctionPack.type), color: getGlowColor(activeAuctionPack.type) }}>
              {activeAuctionPack.type}
            </span>
          </div>

          {/* Offerta Corrente */}
          <div className="bg-black/40 p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center">
            <span className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Miglior Offerta</span>
            <div className="text-3xl font-black text-white flex items-center gap-2">
              <span className="text-[#F5A623]">{auction.currentAuction.currentBid}</span>
              <span className="text-xs text-white/40">CRD</span>
            </div>
            <span className="text-xs font-bold text-white/80 mt-1 uppercase tracking-wider text-center">
              di {highestBidderObj?.username || 'Offerta Base'}
            </span>
          </div>

          {/* Controlli di Offerta per l'Utente */}
          <div className="space-y-3 pt-2">
            {isMyDeckFull ? (
              <div className="p-3 bg-white/5 rounded-xl text-center text-xs font-bold text-white/40 uppercase">
                Hai già completato il tuo Deck
              </div>
            ) : auction.currentAuction.highestBidder === user.id ? (
              <div className="p-3 bg-[#F5A623]/20 border border-[#F5A623]/40 rounded-xl text-center text-xs font-black text-[#F5A623] uppercase tracking-wider animate-pulse">
                Sei in testa!
              </div>
            ) : auction.currentAuction.foldedPlayers?.includes(user.id) ? (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-center text-xs font-bold text-red-400 uppercase">
                Ti sei ritirato da quest'asta
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handlePlaceBid(1)}
                    disabled={myCredits < auction.currentAuction.currentBid + 1}
                    className="bg-white/10 hover:bg-white/20 active:scale-95 disabled:opacity-30 disabled:pointer-events-none py-3 rounded-xl font-black text-white text-sm uppercase transition-all flex flex-col items-center justify-center border border-white/5"
                  >
                    <span>+1</span>
                    <span className="text-[8px] text-white/40">({auction.currentAuction.currentBid + 1})</span>
                  </button>
                  <button
                    onClick={() => handlePlaceBid(5)}
                    disabled={myCredits < auction.currentAuction.currentBid + 5}
                    className="bg-[#4361EE]/30 hover:bg-[#4361EE]/50 active:scale-95 disabled:opacity-30 disabled:pointer-events-none py-3 rounded-xl font-black text-white text-sm uppercase transition-all flex flex-col items-center justify-center border border-[#4361EE]/50"
                  >
                    <span>+5</span>
                    <span className="text-[8px] text-white/40">({auction.currentAuction.currentBid + 5})</span>
                  </button>
                  <button
                    onClick={() => handlePlaceBid(10)}
                    disabled={myCredits < auction.currentAuction.currentBid + 10}
                    className="bg-[#F5A623]/30 hover:bg-[#F5A623]/50 active:scale-95 disabled:opacity-30 disabled:pointer-events-none py-3 rounded-xl font-black text-[#F5A623] text-sm uppercase transition-all flex flex-col items-center justify-center border border-[#F5A623]/50"
                  >
                    <span>+10</span>
                    <span className="text-[8px] text-[#F5A623]/60">({auction.currentAuction.currentBid + 10})</span>
                  </button>
                </div>

                <button
                  onClick={handleFold}
                  className="w-full py-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-black uppercase text-xs rounded-xl tracking-widest transition-all border border-red-500/30"
                >
                  Lascia (Fold)
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        /* VISTA NOMINA (Scelta del Bey da mettere all'asta) */
        <div className="space-y-6">
          <div className={`p-4 rounded-2xl text-center transition-all ${isMyNominationTurn ? 'bg-[#F5A623]/20 border border-[#F5A623] scale-105 shadow-[0_0_20px_rgba(245,166,35,0.2)]' : 'bg-white/5 border border-white/5'}`}>
            <div className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">Turno di Nomina</div>
            <div className="text-xl font-black text-white">
              {isMyNominationTurn ? 'Scegli il Bey da mettere all\'Asta!' : `Attendi ${currentParticipant?.username || ''}...`}
            </div>
            <p className="text-[9px] text-white/40 mt-1">L'offerta di base (1 credito) verrà piazzata automaticamente.</p>
          </div>

          {/* Griglia Pacchetti Disponibili */}
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
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
                  className={`draft-card aspect-[3/4] max-w-[190px] mx-auto w-full ${pack.isOpened ? 'is-opened opacity-40' : ''} ${!isMyNominationTurn || isActiveTurnDeckFull ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer active:scale-95 transition-transform'}`}
                  style={{ '--glow-color': glowColor }}
                  onClick={() => handleNominatePack(pack)}
                >
                  <div className="draft-card-content">
                    <div className="draft-card-back">
                      <div className="draft-card-back-content font-createfuture tracking-[0.05em] p-2">
                        {blade ? (
                          <>
                            <img src={blade.image_url} alt={blade.name} className="w-10 h-10 md:w-14 md:h-14 object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] mb-1" />
                            <div className="text-[8px] md:text-[10px] font-black uppercase text-center px-1 truncate w-full mb-0.5 text-white">{blade.name}</div>
                            <div className="text-[7px] md:text-[8px] font-bold uppercase opacity-80 mb-1 text-center px-1 border rounded-md py-0.5" style={{ color: glowColor, borderColor: `${glowColor}44` }}>{displayType}</div>
                          </>
                        ) : (
                          <>
                            <img src="/beyx.svg" alt="BeyX Logo" className="w-8 h-8 mb-2 opacity-50" />
                            <div className="mb-1 opacity-80" style={{ color: glowColor }}>{icon}</div>
                            <div className="text-[8px] font-black uppercase opacity-80 mb-1 text-center" style={{ color: glowColor }}>{displayType}</div>
                          </>
                        )}
                        <div className="text-xs font-black opacity-40">{index + 1}</div>
                        {blade && (
                          <div className="text-[9px] font-black uppercase text-purple-400 mt-1">
                            {blade.topRank ? `TOP ${blade.topRank}` : 'TOP -'}
                          </div>
                        )}
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
                          ) : (
                            <div className="text-[10px] font-black text-white text-center uppercase">Nomina</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Riepilogo Fondi e Deck dei Giocatori */}
      <div className="mt-8 pt-8 border-t border-white/5 space-y-6">
        <h3 className="text-sm font-black italic uppercase text-white/50 px-2">Stato Asta e Deck</h3>
        
        {(() => {
          const sortedParticipants = [...tournament.participants].sort((a, b) => {
            if (a.user_id === user.id) return -1;
            if (b.user_id === user.id) return 1;
            return 0;
          });

          return sortedParticipants.map(participant => {
            const pId = participant.id || participant.user_id || participant.username;
            const myDeckComboIds = auction.playerDecks?.[pId] || [];
            const remainingCredits = auction.playerCredits[pId] || 0;
            
            return (
              <div key={pId} className="bg-[#12122A]/80 p-4 rounded-3xl border border-white/5 shadow-lg">
                <div className="flex justify-between items-center mb-3 px-1">
                  <div className="text-xs font-black uppercase text-white tracking-[0.05em]">
                    {participant.user_id === user.id ? 'Il Tuo Deck' : participant.username}
                  </div>
                  <div className="text-xs font-black text-[#F5A623]">
                    🪙 {remainingCredits} CRD
                  </div>
                </div>

                <div className="flex gap-3">
                  {Array(auction.deckSize).fill(null).map((_, i) => {
                    const comboId = myDeckComboIds[i];
                    let bladeImage = null;
                    let packGlowColor = undefined;
                    let awardedPrice = undefined;

                    if (comboId && parts?.blades) {
                      const packData = auction.availablePacks.find(p => p.combo_id === comboId);
                      if (packData) {
                        packGlowColor = getGlowColor(packData.type);
                        awardedPrice = packData.price;
                      }
                      const poolCombo = tournament.structure.pool?.find(c => c.id === comboId);
                      if (poolCombo) {
                        const blade = parts.blades.find(b => b.id === poolCombo.blade_id);
                        if (blade) bladeImage = blade.image_url;
                      }
                    }

                    return (
                      <div 
                        key={i}
                        className={`flex-1 aspect-square rounded-2xl flex flex-col items-center justify-center border-2 relative overflow-hidden ${
                          comboId 
                            ? 'bg-[#151515] shadow-lg' 
                            : 'bg-black/20 border-white/5 border-dashed'
                        }`}
                        style={comboId && packGlowColor ? { borderColor: packGlowColor } : undefined}
                      >
                        {bladeImage ? (
                          <>
                            <img src={bladeImage} alt="Blade" className="w-[75%] h-[75%] object-contain drop-shadow-md z-10" />
                            {awardedPrice !== undefined && (
                              <div className="absolute bottom-1 bg-black/80 px-1.5 py-0.5 rounded text-[8px] font-black text-[#F5A623] z-20">
                                {awardedPrice} CRD
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-white/10 font-black text-xs">vuoto</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          });
        })()}
      </div>

      {isOrganizer && (
        <div className="pt-10 border-t border-white/5">
           <button 
             onClick={onDelete}
             className="w-full py-4 text-white/20 hover:text-red-500/50 text-[9px] font-black uppercase tracking-[0.2em] transition-colors flex items-center justify-center gap-2"
           >
             Elimina Torneo
           </button>
        </div>
      )}
    </div>
  );
}
