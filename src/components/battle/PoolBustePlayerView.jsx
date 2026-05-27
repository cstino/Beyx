import React, { useState, useEffect, useCallback } from "react";
import {
  Shield,
  Sword,
  Wind,
  X,
  Plus,
  Minus,
  Send,
  EyeOff,
  Eye,
  Gem,
  Clock,
  Check,
} from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { useToastStore } from "../../store/useToastStore";
import "./DraftCard.css";

export function PoolBustePlayerView({
  tournament,
  setTournament,
  updateTournamentDB,
  onAuctionComplete,
  onDelete,
  parts,
}) {
  const { user } = useAuthStore();
  const sealedBid = tournament?.structure?.sealed_bid;

  const [timeLeft, setTimeLeft] = useState(60);
  const [bidAmount, setBidAmount] = useState("1");
  const [revealStep, setRevealStep] = useState(0);
  const [revealDelay, setRevealDelay] = useState(false);

  const getGlowColor = (type) => {
    if (type === "attack") return "#ef4444";
    if (type === "defense") return "#3b82f6";
    return "#22c55e";
  };

  const getPackIcon = (type) => {
    if (type === "attack") return <Sword size={24} />;
    if (type === "defense") return <Shield size={24} />;
    return <Wind size={24} />;
  };

  const determineWinner = useCallback(() => {
    if (!sealedBid?.currentAuction?.bids) return null;
    const { bids } = sealedBid.currentAuction;
    const entries = Object.entries(bids).filter(([_, b]) => b.amount > 0);
    if (entries.length === 0) return null;
    entries.sort((a, b) => {
      if (b[1].amount !== a[1].amount) return b[1].amount - a[1].amount;
      return a[1].timestamp - b[1].timestamp;
    });
    return entries[0][0];
  }, [sealedBid?.currentAuction]);

  const handleRevealBids = useCallback(async () => {
    if (
      !sealedBid?.currentAuction ||
      sealedBid.currentAuction.status !== "bidding"
    )
      return;

    const { packId, bids } = sealedBid.currentAuction;
    const winnerId = determineWinner();

    // Segna il pack come opened
    const newPacks = sealedBid.availablePacks.map((p) =>
      p.id === packId
        ? {
            ...p,
            isOpened: true,
            owner: winnerId,
            price: winnerId ? bids[winnerId]?.amount || 0 : 0,
          }
        : p,
    );

    const pendingCredits = { ...sealedBid.playerCredits };
    const pendingDecks = { ...sealedBid.playerDecks };
    if (winnerId) {
      pendingCredits[winnerId] = Math.max(
        0,
        (pendingCredits[winnerId] || 0) - bids[winnerId].amount,
      );
      pendingDecks[winnerId] = [
        ...(pendingDecks[winnerId] || []),
        sealedBid.availablePacks.find((p) => p.id === packId)?.combo_id,
      ];
    }

    // Trova prossimo giocatore
    let nextIndex =
      (sealedBid.currentTurnIndex + 1) % sealedBid.turnOrder.length;
    let iterations = 0;
    while (iterations < sealedBid.turnOrder.length) {
      const candidateId = sealedBid.turnOrder[nextIndex];
      if ((pendingDecks[candidateId] || []).length < sealedBid.deckSize) break;
      nextIndex = (nextIndex + 1) % sealedBid.turnOrder.length;
      iterations++;
    }

    const allDecksFull = sealedBid.turnOrder.every(
      (pId) => (pendingDecks[pId] || []).length >= sealedBid.deckSize,
    );
    const allPacksOpened = newPacks.every((p) => p.isOpened);
    const isComplete = allDecksFull || allPacksOpened;

    const newAuction = {
      ...sealedBid.currentAuction,
      status: "revealed",
      winnerId,
      displayRevealedAt: null,
      pendingDecks,
      pendingCredits,
    };

    const newSealedBidState = {
      ...sealedBid,
      availablePacks: newPacks,
      currentTurnIndex: nextIndex,
      currentAuction: newAuction,
      lastAction: {
        type: "conclude",
        packId,
        winnerId,
        price: winnerId ? bids[winnerId]?.amount : 0,
        timestamp: Date.now(),
      },
    };

    const updated = {
      ...tournament,
      structure: {
        ...tournament.structure,
        sealed_bid: newSealedBidState,
      },
    };
    if (isComplete) updated.status = "draft_complete";

    setTournament(updated);
    await updateTournamentDB(updated);
    setRevealStep(0);
  }, [
    sealedBid,
    tournament,
    setTournament,
    updateTournamentDB,
    determineWinner,
  ]);

  const handleContinueAfterReveal = async () => {
    if (!sealedBid?.currentAuction) return;
    
    const pendingDecks = sealedBid.currentAuction.pendingDecks || sealedBid.playerDecks;
    const pendingCredits = sealedBid.currentAuction.pendingCredits || sealedBid.playerCredits;
    
    const newSealedBidState = {
      ...sealedBid,
      playerDecks: pendingDecks,
      playerCredits: pendingCredits,
      currentAuction: null,
    };
    
    const updated = {
      ...tournament,
      structure: { ...tournament.structure, sealed_bid: newSealedBidState },
    };

    // Check if tournament draft is actually complete (all decks full or all packs opened)
    const allDecksFull = sealedBid.turnOrder.every(
      (pId) => (pendingDecks[pId] || []).length >= sealedBid.deckSize,
    );
    const allPacksOpened = newSealedBidState.availablePacks.every((p) => p.isOpened);
    const isComplete = allDecksFull || allPacksOpened;
    
    if (isComplete) {
      updated.status = "draft_complete";
    }

    setTournament(updated);
    await updateTournamentDB(updated);
    setRevealStep(0);
  };

  // Realtime countdown timer
  useEffect(() => {
    if (!sealedBid?.currentAuction) {
      setRevealStep(0);
      setBidAmount("1");
      return;
    }
    if (sealedBid.currentAuction.status === "revealed") return;
    if (sealedBid.currentAuction.status !== "bidding") {
      setBidAmount("1");
      return;
    }

    const interval = setInterval(() => {
      const expiresAt = sealedBid.currentAuction.timerExpiresAt;
      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);

      const allSubmitted = sealedBid.turnOrder.every((pId) => {
        if ((sealedBid.playerDecks[pId] || []).length >= sealedBid.deckSize)
          return true;
        if (sealedBid.currentAuction.passedPlayers?.includes(pId)) return true;
        if (sealedBid.currentAuction.bids?.[pId]) return true;
        return false;
      });

      if (remaining === 0 || allSubmitted) {
        const isResponsible =
          tournament.created_by === user.id ||
          sealedBid.currentAuction.nominatorId === user.id;
        if (isResponsible) handleRevealBids();
      }
    }, 500);
    return () => clearInterval(interval);
  }, [sealedBid?.currentAuction, tournament, user.id, handleRevealBids]);

  // Delay reveal per dare tempo al display di mostrare risultati
  useEffect(() => {
    if (sealedBid?.currentAuction?.status === "revealed") {
      if (sealedBid.currentAuction.displayRevealedAt != null) {
        setRevealDelay(false);
        return;
      }
      setRevealDelay(true);
      const timer = setTimeout(() => setRevealDelay(false), 2500);
      return () => clearTimeout(timer);
    } else {
      setRevealDelay(false);
    }
  }, [
    sealedBid?.currentAuction?.status,
    sealedBid?.currentAuction?.displayRevealedAt,
  ]);

  if (!sealedBid) return null;

  const currentTurnParticipantId =
    sealedBid.turnOrder[sealedBid.currentTurnIndex];
  const isOrganizer = tournament.created_by === user.id;
  const currentParticipant = tournament.participants.find(
    (p) =>
      p.id === currentTurnParticipantId ||
      p.user_id === currentTurnParticipantId ||
      p.username === currentTurnParticipantId,
  );
  const isMyNominationTurn = currentParticipant?.user_id === user.id || (!currentParticipant?.user_id && isOrganizer);
  const activeTurnParticipantId = currentParticipant?.user_id || currentTurnParticipantId;
  const activeTurnCredits = sealedBid.playerCredits[activeTurnParticipantId] || 0;
  const activeTurnDeck = sealedBid.playerDecks[activeTurnParticipantId] || [];
  const isActiveTurnDeckFull = activeTurnDeck.length >= sealedBid.deckSize;

  const myCredits = sealedBid.playerCredits[user.id] || 0;
  const myDeck = sealedBid.playerDecks[user.id] || [];
  const isMyDeckFull = myDeck.length >= sealedBid.deckSize;

  const handleNominatePack = async (pack) => {
    if (
      !isMyNominationTurn ||
      pack.isOpened ||
      sealedBid.currentAuction ||
      isActiveTurnDeckFull
    )
      return;
    const ctuid = currentParticipant?.user_id || currentTurnParticipantId;
    const newAuction = {
      packId: pack.id,
      nominatorId: ctuid,
      bids: {},
      passedPlayers: [],
      timerExpiresAt: Date.now() + 60000,
      status: "bidding",
    };
    const nsbs = {
      ...sealedBid,
      currentAuction: newAuction,
      lastAction: {
        type: "nominate",
        packId: pack.id,
        participantId: ctuid,
        timestamp: Date.now(),
      },
    };
    const up = {
      ...tournament,
      structure: { ...tournament.structure, sealed_bid: nsbs },
    };
    setTournament(up);
    await updateTournamentDB(up);
    setBidAmount("1");
    useToastStore
      .getState()
      .success(
        "Hai messo all'asta a buste chiuse questo Beyblade! 60 secondi per offrire.",
      );
  };

  const handleSubmitBid = async () => {
    const ca = sealedBid.currentAuction;
    if (
      !ca ||
      ca.status !== "bidding" ||
      ca.bids?.[user.id] ||
      ca.passedPlayers?.includes(user.id) ||
      isMyDeckFull
    )
      return;
    const amount = Math.max(0, Math.floor(parseInt(bidAmount) || 0));
    if (amount > myCredits) {
      useToastStore.getState().error("Crediti insufficienti!");
      return;
    }
    const uca = {
      ...ca,
      bids: {
        ...(ca.bids || {}),
        [user.id]: { amount, timestamp: Date.now() },
      },
    };
    const nsbs = {
      ...sealedBid,
      currentAuction: uca,
      lastAction: {
        type: "bid",
        participantId: user.id,
        amount,
        timestamp: Date.now(),
      },
    };
    const up = {
      ...tournament,
      structure: { ...tournament.structure, sealed_bid: nsbs },
    };
    setTournament(up);
    await updateTournamentDB(up);
    useToastStore
      .getState()
      .success(
        amount > 0
          ? "Offerta inviata in busta chiusa!"
          : "Offerta di 0 crediti inviata.",
      );
  };

  const handlePass = async () => {
    const ca = sealedBid.currentAuction;
    if (
      !ca ||
      ca.status !== "bidding" ||
      ca.bids?.[user.id] ||
      ca.passedPlayers?.includes(user.id) ||
      isMyDeckFull
    )
      return;
    const uca = {
      ...ca,
      passedPlayers: [...(ca.passedPlayers || []), user.id],
    };
    const nsbs = { ...sealedBid, currentAuction: uca };
    const up = {
      ...tournament,
      structure: { ...tournament.structure, sealed_bid: nsbs },
    };
    setTournament(up);
    await updateTournamentDB(up);
    useToastStore.getState().success("Hai passato il turno.");
  };

  const activePack = sealedBid.currentAuction
    ? sealedBid.availablePacks.find(
        (p) => p.id === sealedBid.currentAuction.packId,
      )
    : null;
  const activeCombo = activePack
    ? tournament.structure?.pool?.find((c) => c.id === activePack.combo_id)
    : null;
  const activeBlade = activeCombo
    ? parts?.blades?.find((b) => b.id === activeCombo.blade_id)
    : null;
  const isBidding = sealedBid.currentAuction?.status === "bidding";
  const isRevealed = sealedBid.currentAuction?.status === "revealed";
  const winnerId = isRevealed ? sealedBid.currentAuction.winnerId : null;
  const winnerObj = winnerId
    ? tournament.participants.find(
        (p) =>
          p.id === winnerId ||
          p.user_id === winnerId ||
          p.username === winnerId,
      )
    : null;
  const hasSubmitted = sealedBid.currentAuction?.bids?.[user.id];
  const hasPassed = sealedBid.currentAuction?.passedPlayers?.includes(user.id);
  const myBidAmount = hasSubmitted
    ? sealedBid.currentAuction.bids[user.id].amount
    : 0;

  return (
    <div className="space-y-6 pb-20">
      {/* Intestazione Crediti */}
      <div className="bg-[#12122A] p-6 rounded-[32px] border border-[#9b59b6]/30 shadow-[0_0_25px_rgba(155,89,182,0.15)] text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#9b59b6]/5 rounded-full blur-2xl"></div>
        <h2 className="text-2xl font-black italic uppercase text-white mb-1">
          Asta a Buste Chiuse
        </h2>
        <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold mb-4">
          I tuoi fondi disponibili
        </p>
        <div className="inline-flex items-center gap-3 bg-black/40 px-6 py-3 rounded-2xl border border-white/5">
          <div className="text-2xl">
            <Gem size={28} className="text-[#9b59b6]" />
          </div>
          <span className="text-3xl font-black text-[#9b59b6] tracking-wider">
            {myCredits}
          </span>
          <span className="text-xs text-white/40 uppercase font-bold mt-1">
            CRD
          </span>
        </div>
      </div>

      {tournament.status === "draft_complete" ? (
        <div className="bg-[#12122A] p-8 rounded-[32px] border border-green-500/30 text-center space-y-4">
          <div className="text-green-400 font-bold uppercase tracking-widest animate-pulse text-lg">
            Asta Completata!
          </div>
          <p className="text-xs text-white/50">
            Tutti i blader hanno completato i loro deck.
          </p>
          {isOrganizer && (
            <button
              onClick={onAuctionComplete}
              className="w-full bg-green-500 text-white font-black uppercase tracking-widest py-4 rounded-2xl shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:scale-105 active:scale-95 transition-all"
            >
              Genera Tabellone
            </button>
          )}
        </div>
      ) : isRevealed && sealedBid.currentAuction && revealDelay ? (
        /* VISTA IN ATTESA DEL DISPLAY */
        <div className="bg-gradient-to-b from-[#1A1A3A] to-[#0A0A1A] p-6 rounded-[32px] border-2 border-[#9b59b6] shadow-[0_0_40px_rgba(155,89,182,0.25)] space-y-6 animate-fade-in text-center">
          <div className="py-8 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#9b59b6]/20 border-2 border-[#9b59b6] flex items-center justify-center">
              <EyeOff size={32} className="text-[#9b59b6]" />
            </div>
            <div>
              <p className="text-sm font-black text-[#9b59b6] uppercase tracking-widest animate-pulse">
                Risultati in arrivo...
              </p>
              <p className="text-[10px] text-white/40 mt-2">
                Il vincitore verrà annunciato a breve sul display
              </p>
            </div>
          </div>
        </div>
      ) : isRevealed && sealedBid.currentAuction ? (
        /* VISTA REVEAL */
        <div className="bg-gradient-to-b from-[#1A1A3A] to-[#0A0A1A] p-6 rounded-[32px] border-2 border-[#9b59b6] shadow-[0_0_40px_rgba(155,89,182,0.25)] space-y-6 animate-fade-in">
          <div className="text-center">
            <span className="text-[10px] font-black text-[#9b59b6] uppercase tracking-[0.2em]">
              Risultato Asta
            </span>
            <h3 className="text-2xl font-black italic uppercase text-white mt-2">
              {activeBlade?.name || "Combo"}
            </h3>
            {activeBlade && (
              <div className="text-[10px] font-black uppercase text-purple-400 mt-1">
                {activeBlade.topRank ? `TOP ${activeBlade.topRank}` : 'TOP -'}
              </div>
            )}
          </div>
          <div className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-3">
            {sealedBid.currentAuction.bids &&
              Object.entries(sealedBid.currentAuction.bids)
                .sort((a, b) => b[1].amount - a[1].amount)
                .map(([pId, bid], i) => {
                  const p = tournament.participants.find(
                    (pp) =>
                      pp.id === pId ||
                      pp.user_id === pId ||
                      pp.username === pId,
                  );
                  const isWinner = pId === winnerId;
                  return (
                    <div
                      key={pId}
                      className={`flex items-center justify-between p-3 rounded-xl transition-all ${isWinner ? "bg-[#9b59b6]/20 border border-[#9b59b6]/50 scale-105 shadow-[0_0_15px_rgba(155,89,182,0.3)]" : "bg-white/5"}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          {p?.username || pId}
                        </span>
                        {isWinner && (
                          <span className="text-[8px] bg-[#9b59b6] text-white font-black px-2 py-0.5 rounded-full uppercase">
                            Vince
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-lg font-black flex items-center gap-1 ${isWinner ? "text-[#9b59b6]" : "text-white/60"}`}
                      >
                        <Gem size={14} /> {bid.amount} CRD
                      </span>
                    </div>
                  );
                })}
            {sealedBid.currentAuction.passedPlayers?.map((pId) => {
              const p = tournament.participants.find(
                (pp) =>
                  pp.id === pId || pp.user_id === pId || pp.username === pId,
              );
              return (
                <div
                  key={pId}
                  className="flex items-center justify-between p-2 rounded-xl bg-white/5 opacity-40"
                >
                  <span className="text-sm font-bold text-white/40 line-through">
                    {p?.username || pId}
                  </span>
                  <span className="text-xs text-white/20">Passa</span>
                </div>
              );
            })}
          </div>
          {!winnerId && (
            <div className="text-center text-white/40 text-xs font-bold uppercase">
              Nessun vincitore: nessuno ha offerto.
            </div>
          )}
          <button
            onClick={handleContinueAfterReveal}
            className="w-full py-4 bg-[#9b59b6] text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-[0_0_20px_rgba(155,89,182,0.4)] hover:scale-105 active:scale-95 transition-all"
          >
            Continua
          </button>
        </div>
      ) : isBidding && sealedBid.currentAuction ? (
        /* VISTA BIDDING (Offerte Segrete) */
        <div className="bg-gradient-to-b from-[#1A1A3A] to-[#0A0A1A] p-6 rounded-[32px] border-2 border-[#9b59b6] shadow-[0_0_40px_rgba(155,89,182,0.25)] space-y-6 animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#9b59b6] animate-ping"></span>
              <span className="text-xs font-black uppercase text-[#9b59b6] tracking-widest">
                Offerte Segrete
              </span>
            </div>
            <div className="flex items-center gap-2 bg-[#9b59b6]/10 border border-[#9b59b6]/30 px-3 py-1.5 rounded-xl">
              <EyeOff size={14} className="text-[#9b59b6]" />
              <span className="text-xs font-black text-[#9b59b6] flex items-center gap-1">
                <Clock size={14} /> {timeLeft}s
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center py-2">
            <div className="relative w-36 h-36 md:w-44 md:h-44 mb-3">
              <div className="absolute inset-0 bg-[#9b59b6]/10 blur-xl rounded-full"></div>
              {activeBlade && (
                <img
                  src={activeBlade.image_url}
                  alt={activeBlade.name}
                  className="absolute inset-0 w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] animate-[float_3s_ease-in-out_infinite]"
                />
              )}
            </div>
            <h3 className="text-xl md:text-2xl font-black italic uppercase text-white tracking-wide text-center">
              {activeBlade?.name || "Combo Sconosciuta"}
            </h3>
            {activeBlade && (
              <div className="text-[10px] font-black uppercase text-purple-400 mt-1 text-center">
                {activeBlade.topRank ? `TOP ${activeBlade.topRank}` : 'TOP -'}
              </div>
            )}
            <span
              className="text-[10px] font-bold uppercase px-3 py-1 rounded-full border mt-2"
              style={{
                borderColor: getGlowColor(activePack?.type),
                color: getGlowColor(activePack?.type),
              }}
            >
              {activePack?.type}
            </span>
          </div>

          {/* Stato giocatori */}
          <div className="bg-black/20 rounded-2xl p-4 space-y-2">
            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest text-center mb-3">
              Stato Offerte
            </p>
            {sealedBid.turnOrder.map((pId) => {
              const p = tournament.participants.find(
                (pp) =>
                  pp.id === pId || pp.user_id === pId || pp.username === pId,
              );
              const deckFull =
                (sealedBid.playerDecks[pId] || []).length >= sealedBid.deckSize;
              const hasBid = sealedBid.currentAuction?.bids?.[pId];
              const hasPassedThis =
                sealedBid.currentAuction?.passedPlayers?.includes(pId);
              let statusEl = <Clock size={14} className="text-white/20" />;
              let statusColor = "text-white/20";
              if (deckFull) {
                statusEl = <Check size={14} className="text-green-400" />;
                statusColor = "text-green-400";
              } else if (hasBid) {
                statusEl = <EyeOff size={14} className="text-[#9b59b6]" />;
                statusColor = "text-[#9b59b6]";
              } else if (hasPassedThis) {
                statusEl = <X size={14} className="text-red-400/50" />;
                statusColor = "text-red-400/50";
              }
              return (
                <div key={pId} className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white/70">
                    {p?.username || pId}
                  </span>
                  <span className={`text-xs font-black ${statusColor}`}>
                    {statusEl}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Controlli Offerta */}
          {isMyDeckFull ? (
            <div className="p-3 bg-white/5 rounded-xl text-center text-xs font-bold text-white/40 uppercase">
              Hai già completato il tuo Deck
            </div>
          ) : hasSubmitted ? (
            <div className="p-4 bg-[#9b59b6]/20 border border-[#9b59b6]/40 rounded-2xl text-center space-y-1">
              <EyeOff size={20} className="mx-auto text-[#9b59b6]" />
              <p className="text-sm font-black text-[#9b59b6] uppercase">
                Offerta Inviata
              </p>
              <p className="text-[10px] text-white/40">
                In attesa degli altri giocatori...
              </p>
            </div>
          ) : hasPassed ? (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-center text-xs font-bold text-red-400 uppercase">
              Hai passato questo turno
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                <div className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-3 text-center">
                  La tua Offerta Segreta
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <button
                    onClick={() =>
                      setBidAmount(
                        String(Math.max(1, (parseInt(bidAmount) || 1) - 1)),
                      )
                    }
                    className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/60 hover:text-white active:scale-95"
                  >
                    <Minus size={18} />
                  </button>
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    onBlur={() =>
                      setBidAmount((prev) => (prev === "" ? "1" : prev))
                    }
                    min={0}
                    max={myCredits}
                    className="flex-1 bg-transparent text-center text-2xl font-black text-[#9b59b6] outline-none"
                  />
                  <button
                    onClick={() =>
                      setBidAmount(
                        String(
                          Math.min(myCredits, (parseInt(bidAmount) || 0) + 1),
                        ),
                      )
                    }
                    className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/60 hover:text-white active:scale-95"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-1.5 mb-3">
                  {[5, 10, 25, 50].map((v) => (
                    <button
                      key={v}
                      onClick={() =>
                        setBidAmount(String(Math.min(myCredits, v)))
                      }
                      disabled={v > myCredits}
                      className="py-1.5 rounded-lg bg-white/5 text-[9px] font-bold text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-20 transition-all"
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleSubmitBid}
                  className="w-full py-3 bg-[#9b59b6] text-white font-black uppercase text-xs tracking-[0.15em] rounded-xl shadow-[0_0_15px_rgba(155,89,182,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Send size={14} /> Invia Offerta
                </button>
              </div>
              <button
                onClick={handlePass}
                className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-300 font-black uppercase text-xs rounded-xl tracking-widest transition-all border border-red-500/20"
              >
                Passa (non offrire)
              </button>
            </div>
          )}
        </div>
      ) : (
        /* VISTA NOMINA */
        <div className="space-y-6">
          <div
            className={`p-4 rounded-2xl text-center transition-all ${isMyNominationTurn ? "bg-[#9b59b6]/20 border border-[#9b59b6] scale-105 shadow-[0_0_20px_rgba(155,89,182,0.2)]" : "bg-white/5 border border-white/5"}`}
          >
            <div className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">
              Turno di Nomina
            </div>
            <div className="text-xl font-black text-white">
              {isMyNominationTurn
                ? "Scegli il Bey da mettere all'Asta a Buste!"
                : `Attendi ${currentParticipant?.username || ""}...`}
            </div>
            <p className="text-[9px] text-white/40 mt-1">
              I giocatori avranno 60 secondi per inviare la loro offerta
              segreta.
            </p>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {sealedBid.availablePacks.map((pack, index) => {
              const glowColor = getGlowColor(pack.type);
              const icon = getPackIcon(pack.type);
              let displayType = pack.type;
              if (pack.type === "balance" || pack.type === "stamina")
                displayType = "STAMINA";
              const poolCombo = tournament.structure?.pool?.find(
                (c) => c.id === pack.combo_id,
              );
              const blade = poolCombo
                ? parts?.blades?.find((b) => b.id === poolCombo.blade_id)
                : null;
              const owner = pack.isOpened
                ? tournament.participants?.find(
                    (p) =>
                      p.id === pack.owner ||
                      p.user_id === pack.owner ||
                      p.username === pack.owner,
                  )
                : null;

              return (
                <div
                  key={pack.id}
                  className={`draft-card aspect-[3/4] max-w-[190px] mx-auto w-full ${pack.isOpened ? "is-opened opacity-40" : ""} ${!isMyNominationTurn || isActiveTurnDeckFull ? "opacity-60 cursor-not-allowed" : "cursor-pointer active:scale-95 transition-transform"}`}
                  style={{ "--glow-color": glowColor }}
                  onClick={() => handleNominatePack(pack)}
                >
                  <div className="draft-card-content">
                    <div className="draft-card-back">
                      <div className="draft-card-back-content font-createfuture tracking-[0.05em] p-2">
                        {blade ? (
                          <>
                            <img
                              src={blade.image_url}
                              alt={blade.name}
                              className="w-10 h-10 md:w-14 md:h-14 object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] mb-1"
                            />
                            <div className="text-[8px] md:text-[10px] font-black uppercase text-center px-1 truncate w-full mb-0.5 text-white">
                              {blade.name}
                            </div>
                            <div
                              className="text-[7px] md:text-[8px] font-bold uppercase opacity-80 mb-1 text-center px-1 border rounded-md py-0.5"
                              style={{
                                color: glowColor,
                                borderColor: `${glowColor}44`,
                              }}
                            >
                              {displayType}
                            </div>
                          </>
                        ) : (
                          <>
                            <img
                              src="/beyx.svg"
                              alt="BeyX Logo"
                              className="w-8 h-8 mb-2 opacity-50"
                            />
                            <div
                              className="mb-1 opacity-80"
                              style={{ color: glowColor }}
                            >
                              {icon}
                            </div>
                            <div
                              className="text-[8px] font-black uppercase opacity-80 mb-1 text-center"
                              style={{ color: glowColor }}
                            >
                              {displayType}
                            </div>
                          </>
                        )}
                        <div className="text-xs font-black opacity-40">
                          {index + 1}
                        </div>
                        {blade && (
                          <div className="text-[9px] font-black uppercase text-purple-400 mt-1">
                            {blade.topRank ? `TOP ${blade.topRank}` : 'TOP -'}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="draft-card-front">
                      <div
                        className="circle"
                        id="bottom-circle"
                        style={{ "--glow-color": glowColor }}
                      ></div>
                      <div className="circle" id="right-circle"></div>
                      <div className="draft-card-front-content">
                        <div className="draft-card-description font-createfuture tracking-[0.05em]">
                          {pack.isOpened ? (
                            <>
                              <div className="text-xl mb-1">X</div>
                              <div className="flex flex-col items-center justify-center w-full">
                                <span className="text-[8px] font-black text-white text-center uppercase tracking-[0.05em]">
                                  AGGIUDICATO
                                </span>
                                <span className="text-[7px] text-white/70 text-center uppercase mt-0.5 truncate max-w-[90%]">
                                  {owner?.username}
                                </span>
                                <span className="text-[6px] font-black text-[#9b59b6] mt-0.5">
                                  {pack.price} CRD
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="text-[10px] font-black text-white text-center uppercase">
                              Nomina
                            </div>
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

      {/* Riepilogo Fondi e Deck */}
      <div className="mt-8 pt-8 border-t border-white/5 space-y-6">
        <h3 className="text-sm font-black italic uppercase text-white/50 px-2">
          Stato Asta e Deck
        </h3>
        {(() => {
          const sortedParticipants = [...tournament.participants].sort(
            (a, b) =>
              a.user_id === user.id ? -1 : b.user_id === user.id ? 1 : 0,
          );
          return sortedParticipants.map((participant) => {
            const pId =
              participant.id || participant.user_id || participant.username;
            const isRevealedToPlayers =
              sealedBid.currentAuction?.displayRevealedAt != null;
            const deckSource = isRevealedToPlayers
              ? sealedBid.currentAuction?.pendingDecks || sealedBid.playerDecks
              : sealedBid.playerDecks;
            const creditSource = isRevealedToPlayers
              ? sealedBid.currentAuction?.pendingCredits ||
                sealedBid.playerCredits
              : sealedBid.playerCredits;
            const myDeckComboIds = deckSource?.[pId] || [];
            const remainingCredits = creditSource[pId] || 0;
            return (
              <div
                key={pId}
                className="bg-[#12122A]/80 p-4 rounded-3xl border border-white/5 shadow-lg"
              >
                <div className="flex justify-between items-center mb-3 px-1">
                  <div className="text-xs font-black uppercase text-white tracking-[0.05em]">
                    {participant.user_id === user.id
                      ? "Il Tuo Deck"
                      : participant.username}
                  </div>
                  <div className="text-xs font-black text-[#9b59b6] flex items-center gap-1">
                    <Gem size={12} /> {remainingCredits} CRD
                  </div>
                </div>
                <div className="flex gap-3">
                  {Array(sealedBid.deckSize)
                    .fill(null)
                    .map((_, i) => {
                      const comboId = myDeckComboIds[i];
                      let bladeImage = null,
                        packGlowColor,
                        awardedPrice;
                      if (comboId && parts?.blades) {
                        const packData = sealedBid.availablePacks.find(
                          (p) => p.combo_id === comboId,
                        );
                        if (packData) {
                          packGlowColor = getGlowColor(packData.type);
                          awardedPrice = packData.price;
                        }
                        const poolCombo = tournament.structure.pool?.find(
                          (c) => c.id === comboId,
                        );
                        if (poolCombo) {
                          const b = parts.blades.find(
                            (bl) => bl.id === poolCombo.blade_id,
                          );
                          if (b) bladeImage = b.image_url;
                        }
                      }
                      return (
                        <div
                          key={i}
                          className={`flex-1 aspect-square rounded-2xl flex flex-col items-center justify-center border-2 relative overflow-hidden ${comboId ? "bg-[#151515] shadow-lg" : "bg-black/20 border-white/5 border-dashed"}`}
                          style={
                            comboId && packGlowColor
                              ? { borderColor: packGlowColor }
                              : undefined
                          }
                        >
                          {bladeImage ? (
                            <>
                              <img
                                src={bladeImage}
                                alt="Blade"
                                className="w-[75%] h-[75%] object-contain drop-shadow-md z-10"
                              />
                              {awardedPrice !== undefined && (
                                <div className="absolute bottom-1 bg-black/80 px-1.5 py-0.5 rounded text-[8px] font-black text-[#9b59b6] z-20">
                                  {awardedPrice} CRD
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="text-white/10 font-black text-xs">
                              vuoto
                            </span>
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
