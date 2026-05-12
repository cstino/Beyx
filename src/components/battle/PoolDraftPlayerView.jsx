import React, { useState } from 'react';
import { Shield, Sword, Wind, X } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import './DraftCard.css';

export function PoolDraftPlayerView({ tournament, setTournament, updateTournamentDB, onDraftComplete, onDelete, parts }) {
  const { user } = useAuthStore();
  const [selectedDeckCombo, setSelectedDeckCombo] = useState(null);
  const draft = tournament?.structure?.draft;
  
  if (!draft) return null;

  const currentTurnParticipantId = draft.turnOrder[draft.currentTurnIndex];
  const isOrganizer = tournament.created_by === user.id;
  
  // Find current participant's user_id or identifier
  const currentParticipant = tournament.participants.find(p => p.id === currentTurnParticipantId || p.user_id === currentTurnParticipantId || p.username === currentTurnParticipantId);
  const isMyTurn = currentParticipant?.user_id === user.id;

  const handlePickPack = async (pack) => {
    if (!isMyTurn) return;
    if (pack.isOpened) return;

    // Update draft state
    const newPacks = draft.availablePacks.map(p => 
      p.id === pack.id ? { ...p, isOpened: true, owner: currentTurnParticipantId } : p
    );

    const newDecks = { ...draft.playerDecks };
    if (!newDecks[currentTurnParticipantId]) {
      newDecks[currentTurnParticipantId] = [];
    }
    newDecks[currentTurnParticipantId].push(pack.combo_id);

    const newIndex = draft.currentTurnIndex + 1;
    const isDraftComplete = newIndex >= draft.turnOrder.length;

    const newDraft = {
      ...draft,
      availablePacks: newPacks,
      playerDecks: newDecks,
      currentTurnIndex: newIndex,
      lastAction: {
        type: 'pick_pack',
        packId: pack.id,
        participantId: currentTurnParticipantId,
        timestamp: Date.now()
      }
    };

    const updatedStructure = {
      ...tournament.structure,
      draft: newDraft
    };
    
    const updated = {
      ...tournament,
      structure: updatedStructure
    };

    if (isDraftComplete) {
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

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-[#12122A] p-6 rounded-[32px] border border-[#4361EE]/30 shadow-[0_0_20px_rgba(67,97,238,0.1)] text-center">
        <h2 className="text-2xl font-black italic uppercase text-white mb-2">Fase di Spacchettamento</h2>
        
        {tournament.status === 'draft_complete' ? (
          <div className="mt-4 flex flex-col items-center gap-4">
            <div className="text-green-400 font-bold uppercase tracking-widest animate-pulse">
              Draft Completato!
            </div>
            {isOrganizer && (
              <button 
                onClick={onDraftComplete}
                className="bg-green-500 text-white font-black uppercase tracking-widest py-3 px-8 rounded-2xl shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:scale-105 active:scale-95 transition-all"
              >
                Genera Tabellone
              </button>
            )}
          </div>
        ) : (
          <>
            <div className={`p-4 rounded-2xl mb-4 transition-all ${isMyTurn ? 'bg-[#4361EE]/20 border border-[#4361EE] scale-105 shadow-[0_0_15px_rgba(67,97,238,0.3)]' : 'bg-white/5 border border-white/10'}`}>
              <div className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">Turno Attuale</div>
              <div className="text-xl font-black text-white">
                {isMyTurn ? 'TOCCA A TE!' : currentParticipant?.username || 'Attendi...'}
              </div>
            </div>
            <p className="text-xs text-white/40 font-medium">
              Scegli un pacchetto. Il contenuto verrà rivelato sul maxischermo!
            </p>
          </>
        )}
      </div>

      <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
        {draft.availablePacks.map((pack, index) => {
          const glowColor = getGlowColor(pack.type);
          const icon = getPackIcon(pack.type);
          let displayType = pack.type;
          if (pack.type === 'balance' || pack.type === 'stamina') displayType = 'STAMINA';

          return (
            <div
              key={pack.id}
              className={`draft-card aspect-[3/4] max-w-[190px] mx-auto w-full ${pack.isOpened ? 'is-opened' : ''} ${!isMyTurn || tournament.status === 'draft_complete' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95 transition-transform'}`}
              style={{ '--glow-color': glowColor }}
              onClick={() => { if (isMyTurn && tournament.status !== 'draft_complete') handlePickPack(pack) }}
            >
              <div className="draft-card-content">
                <div className="draft-card-back">
                  <div className="draft-card-back-content font-createfuture tracking-[0.05em]">
                    <img src="/beyx.svg" alt="BeyX Logo" className="w-8 h-8 md:w-12 md:h-12 mb-2 opacity-50 drop-shadow-md" />
                    <div className="mb-2 opacity-80" style={{ color: glowColor }}>{icon}</div>
                    <div className="text-[8px] md:text-[10px] font-black uppercase opacity-80 mb-1 text-center px-1" style={{ color: glowColor }}>{displayType}</div>
                    <div className="text-xs md:text-sm font-black opacity-40">{index + 1}</div>
                  </div>
                </div>
                <div className="draft-card-front">
                  <div className="circle" id="bottom-circle" style={{ '--glow-color': glowColor }}></div>
                  <div className="circle" id="right-circle"></div>
                  <div className="draft-card-front-content">
                    <div className="draft-card-description">
                      {pack.isOpened ? (
                        <>
                          <div className="text-xl mb-1">❌</div>
                          <div className="text-[10px] font-black text-white text-center uppercase">Aperto</div>
                        </>
                      ) : (
                        <div className="text-[10px] font-black text-white text-center uppercase">Scegli</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deck Summary */}
      <div className="mt-8 pt-8 border-t border-white/5 space-y-6">
        <h3 className="text-sm font-black italic uppercase text-white/50 px-2">Riepilogo Deck</h3>
        
        {(() => {
          const sortedParticipants = [...tournament.participants].sort((a, b) => {
            if (a.user_id === user.id) return -1;
            if (b.user_id === user.id) return 1;
            return 0;
          });

          const deckSize = tournament.battle_type === '3v3' ? 3 : 1;

          return sortedParticipants.map(participant => {
            const pId = participant.id || participant.user_id || participant.username;
            const myDeckComboIds = draft.playerDecks?.[pId] || [];
            
            return (
              <div key={pId} className="bg-[#12122A]/80 p-4 rounded-3xl border border-white/5 shadow-lg">
                <div className="text-xs font-black uppercase mb-3 text-white tracking-[0.05em] px-1">
                  {participant.user_id === user.id ? 'Il Tuo Deck' : participant.username}
                </div>
                <div className="flex gap-3">
                  {Array(deckSize).fill(null).map((_, i) => {
                    const comboId = myDeckComboIds[i];
                    let bladeImage = null;
                    let comboData = null;
                    let packData = null;
                    let packGlowColor = undefined;

                    if (comboId && parts?.blades) {
                      packData = draft.availablePacks.find(p => p.combo_id === comboId);
                      if (packData) packGlowColor = getGlowColor(packData.type);
                      const poolCombo = tournament.structure.pool.find(c => c.id === comboId);
                      if (poolCombo) {
                        comboData = poolCombo;
                        const blade = parts.blades.find(b => b.id === poolCombo.blade_id);
                        if (blade) bladeImage = blade.image_url;
                      }
                    }

                    return (
                      <div 
                        key={i}
                        className={`flex-1 aspect-square rounded-2xl flex items-center justify-center border-2 transition-all ${
                          comboId 
                            ? 'bg-[#151515] cursor-pointer hover:brightness-125 shadow-lg' 
                            : 'bg-black/20 border-white/5 border-dashed'
                        }`}
                        style={comboId && packGlowColor ? { borderColor: packGlowColor, boxShadow: `0 0 15px ${packGlowColor}33` } : undefined}
                        onClick={() => {
                          if (comboId && comboData && packData) {
                            setSelectedDeckCombo({
                              combo: comboData,
                              pack: packData,
                              blade: parts.blades.find(b => b.id === comboData.blade_id),
                              ratchet: parts.ratchets.find(r => r.id === comboData.ratchet_id),
                              bit: parts.bits.find(b => b.id === comboData.bit_id),
                            });
                          }
                        }}
                      >
                        {bladeImage ? (
                          <img src={bladeImage} alt="Blade" className="w-[85%] h-[85%] object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
                        ) : (
                          <span className="text-white/10 font-black text-xl">?</span>
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

      {/* Selected Combo Modal */}
      {selectedDeckCombo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setSelectedDeckCombo(null)}>
          {(() => {
            const { combo, pack, blade, ratchet, bit } = selectedDeckCombo;
            const glowColor = getGlowColor(pack.type);
            const Icon = pack.type === 'attack' ? Sword : pack.type === 'defense' ? Shield : Wind;
            const displayType = (pack.type === 'balance' || pack.type === 'stamina') ? 'STAMINA' : pack.type;
            const packIndex = draft.availablePacks.findIndex(p => p.id === pack.id);

            return (
              <div 
                className="relative w-full max-w-[320px] aspect-[3/4] rounded-[32px] overflow-hidden flex items-center justify-center bg-[#151515] shadow-2xl" 
                style={{ boxShadow: `0 0 50px ${glowColor}66` }}
                onClick={(e) => e.stopPropagation()}
              >
                <button 
                  onClick={() => setSelectedDeckCombo(null)}
                  className="absolute top-4 right-4 z-50 p-2 bg-black/50 rounded-full flex items-center justify-center text-white hover:text-white"
                >
                  <X size={18} />
                </button>
                
                <div className="absolute w-[150%] h-[150%] animate-[rotation_481_5000ms_infinite_linear]" style={{ background: `linear-gradient(90deg, transparent, ${glowColor}, ${glowColor}, ${glowColor}, ${glowColor}, transparent)` }}></div>
                <div className="absolute inset-[4px] bg-[#151515] rounded-[28px] flex flex-col items-center justify-center font-createfuture tracking-[0.05em] text-white p-6 text-center">
                  <div className="absolute inset-0 bg-black/20 blur-[40px] rounded-full" style={{ backgroundColor: `${glowColor}20` }}></div>
                  
                  <div className="relative w-48 h-48 mb-4">
                    <img src={blade?.image_url} alt="Blade" className="absolute inset-0 w-full h-full object-contain z-30 drop-shadow-[0_0_20px_rgba(255,255,255,0.4)] animate-[float_3s_ease-in-out_infinite]" />
                    {ratchet && <img src={ratchet?.image_url} alt="Ratchet" className="absolute inset-0 w-full h-full object-contain z-20 scale-90 opacity-80" />}
                    {bit && <img src={bit?.image_url} alt="Bit" className="absolute inset-0 w-full h-full object-contain z-10 scale-75 opacity-70" />}
                  </div>
                  
                  <h1 className="text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-white via-[#F5A623] to-white uppercase tracking-[0.05em] z-10 drop-shadow-md leading-tight">
                    {blade?.name}
                  </h1>
                  <span className="text-sm font-bold text-white/60 mt-1 z-10 uppercase tracking-widest">
                    {ratchet?.name} {bit?.name}
                  </span>

                  <div className="mt-6 flex items-center gap-2 opacity-80" style={{ color: glowColor }}>
                    <Icon size={24} />
                    <span className="text-sm font-black uppercase tracking-[0.05em]">{displayType}</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

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
