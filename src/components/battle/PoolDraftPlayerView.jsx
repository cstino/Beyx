import React from 'react';
import { Shield, Sword, Wind } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';

export function PoolDraftPlayerView({ tournament, setTournament, updateTournamentDB, onDraftComplete, onDelete }) {
  const { user } = useAuthStore();
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

  const getPackColor = (type) => {
    if (type === 'attack') return 'from-red-500/20 to-red-600/10 border-red-500/30 text-red-500 hover:border-red-500';
    if (type === 'defense') return 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-500 hover:border-blue-500';
    return 'from-green-500/20 to-green-600/10 border-green-500/30 text-green-500 hover:border-green-500';
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
          const colorClasses = getPackColor(pack.type);
          const icon = getPackIcon(pack.type);

          if (pack.isOpened) {
            return (
              <div key={pack.id} className="aspect-[3/4] rounded-xl border border-white/5 bg-[#0A0A1A] flex flex-col items-center justify-center opacity-30">
                <div className="text-[10px] text-white/30 font-bold mb-2">#{index + 1}</div>
                <div className="text-white/20">Aperto</div>
              </div>
            );
          }

          return (
            <button
              key={pack.id}
              onClick={() => handlePickPack(pack)}
              disabled={!isMyTurn || tournament.status === 'draft_complete'}
              className={`aspect-[3/4] rounded-xl border bg-gradient-to-b flex flex-col items-center justify-center transition-all ${colorClasses} ${isMyTurn ? 'hover:scale-105 hover:brightness-125 cursor-pointer shadow-lg' : 'opacity-50 cursor-not-allowed'}`}
            >
              <div className="text-[10px] font-bold opacity-50 mb-2">PACK #{index + 1}</div>
              <div className="mb-2 opacity-80">{icon}</div>
              <div className="text-[8px] font-black uppercase tracking-widest opacity-80">{pack.type}</div>
            </button>
          );
        })}
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
