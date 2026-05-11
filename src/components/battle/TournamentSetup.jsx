import React, { useState, useEffect } from 'react';
import { Trophy, Users, Swords, UserPlus, Trash2, CheckCircle2, Minus, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

export function TournamentSetup({ onConfirm }) {
  const [name, setName] = useState('');
  const [format, setFormat] = useState('bracket'); 
  const [battleType, setBattleType] = useState('1v1');
  const [participants, setParticipants] = useState([]);
  const [guestName, setGuestName] = useState('');
  const [activeUsers, setActiveUsers] = useState([]);
  
  const [entryMode, setEntryMode] = useState('invitation'); // 'invitation' | 'open'
  const [maxParticipants, setMaxParticipants] = useState(8);
  const [rrCycles, setRrCycles] = useState(1);
  const [rrWinnerMode, setRrWinnerMode] = useState('points'); // 'points' | 'playoff'
  const [playoffType, setPlayoffType] = useState('final'); // 'final' | 'semi' | 'play_in'
  const [description, setDescription] = useState('');

  useEffect(() => {
    supabase.from('profiles').select('id, username, avatar_id, avatar_color')
      .then(({ data }) => setActiveUsers(data || []));
  }, []);

  function addParticipant(user) {
    if (participants.find(p => p.user_id === user.id)) return;
    setParticipants([...participants, { user_id: user.id, username: user.username, seed: participants.length + 1 }]);
  }

  function addGuest() {
    if (!guestName) return;
    setParticipants([...participants, { guest_name: guestName, username: guestName, seed: participants.length + 1 }]);
    setGuestName('');
  }

  function removeParticipant(index) {
    setParticipants(participants.filter((_, i) => i !== index));
  }

  const canStart = entryMode === 'open' ? (maxParticipants >= 2) : (participants.length >= 2);

  return (
    <div className="space-y-8 pb-32">
      <div className="text-white/60 text-sm font-medium italic opacity-50">Configura la tua competizione</div>
      
      {/* Name Input */}
      <div className="p-5 rounded-3xl bg-[#12122A] border border-white/5 focus-within:border-primary/20 transition-all">
        <div className="text-[10px] font-black text-primary tracking-[0.2em] mb-2 uppercase text-center">NOME TORNEO</div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={entryMode === 'open' ? "Nome del Torneo Pubblico..." : "es. Torneo d'Estate 2024"}
          className="w-full bg-transparent text-white font-createfuture text-xl text-center italic outline-none placeholder-white/10"
        />
      </div>
      
      {/* Format & Battle Type */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
           <label className="text-[9px] font-black text-white/30 tracking-[0.2em] uppercase px-1">Formato</label>
           <div className="flex bg-white/5 rounded-2xl p-1 border border-white/5 shadow-inner">
             <button onClick={() => setFormat('bracket')} className={`flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all ${format === 'bracket' ? 'bg-primary text-white shadow-glow-primary' : 'text-white/30'}`}>TABELLONE</button>
             <button onClick={() => setFormat('round_robin')} className={`flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all ${format === 'round_robin' ? 'bg-[#4361EE] text-white shadow-lg shadow-[#4361EE]/20' : 'text-white/30'}`}>GIRONE</button>
           </div>
        </div>
        <div className="space-y-2">
           <label className="text-[9px] font-black text-white/30 tracking-[0.2em] uppercase px-1">Sfida</label>
           <div className="flex bg-white/5 rounded-2xl p-1 border border-white/5 shadow-inner">
             <button onClick={() => setBattleType('1v1')} className={`flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all ${battleType === '1v1' ? 'bg-[#4361EE] text-white shadow-lg shadow-[#4361EE]/20' : 'text-white/30'}`}>1v1</button>
             <button onClick={() => setBattleType('3v3')} className={`flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all ${battleType === '3v3' ? 'bg-[#4361EE] text-white shadow-lg shadow-[#4361EE]/20' : 'text-white/30'}`}>3v3</button>
           </div>
        </div>
      </div>
      
      {/* Round Robin Customization */}
      {format === 'round_robin' && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="space-y-6 p-6 bg-white/5 rounded-[32px] border border-white/5"
        >
          <div className="space-y-3">
             <label className="text-[9px] font-black text-primary tracking-[0.2em] uppercase px-1">Giri del Girone (A/R)</label>
             <div className="flex items-center gap-4 bg-[#0A0A1A] rounded-2xl p-2 border border-white/5">
                <button onClick={() => setRrCycles(Math.max(1, rrCycles - 1))} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white"><Minus size={16} /></button>
                <div className="flex-1 text-center font-black text-xl text-white italic">{rrCycles} {rrCycles === 1 ? 'Giro' : 'Giri'}</div>
                <button onClick={() => setRrCycles(rrCycles + 1)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white"><Plus size={16} /></button>
             </div>
             <p className="text-[8px] text-white/20 font-bold uppercase tracking-widest text-center">
               {rrCycles === 1 ? "Ogni blader sfida gli altri una volta." : `Ogni blader sfida gli altri ${rrCycles} volte.`}
             </p>
          </div>

          <div className="space-y-3">
             <label className="text-[9px] font-black text-primary tracking-[0.2em] uppercase px-1">Modalità Vincitore</label>
             <div className="flex bg-[#0A0A1A] rounded-2xl p-1 border border-white/5">
               <button onClick={() => setRrWinnerMode('points')} className={`flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all ${rrWinnerMode === 'points' ? 'bg-[#4361EE] text-white' : 'text-white/30'}`}>PUNTI</button>
               <button onClick={() => setRrWinnerMode('playoff')} className={`flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all ${rrWinnerMode === 'playoff' ? 'bg-[#4361EE] text-white' : 'text-white/30'}`}>PLAYOFF</button>
             </div>
          </div>

          {rrWinnerMode === 'playoff' && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
               <label className="text-[9px] font-black text-[#4361EE] tracking-[0.2em] uppercase px-1">Tipo di Playoff</label>
               <div className="grid grid-cols-1 gap-2">
                 {[
                   { id: 'final', label: 'FINALE (TOP 2)', desc: 'Il primo e il secondo si sfidano in finale.' },
                   { id: 'semi', label: 'SEMIFINALI (TOP 4)', desc: '1° vs 4° e 2° vs 3°. I vincenti vanno in finale.' },
                   { id: 'play_in', label: 'PLAY-IN (TOP 6)', desc: '1° e 2° aspettano. 3°vs6° e 4°vs5° per le semi.' }
                 ].map(t => (
                   <button 
                    key={t.id} 
                    onClick={() => setPlayoffType(t.id)}
                    className={`p-3 rounded-2xl border text-left transition-all ${playoffType === t.id ? 'bg-[#4361EE]/10 border-[#4361EE]/40' : 'bg-[#0A0A1A] border-white/5'}`}
                   >
                     <div className={`text-[10px] font-black uppercase italic ${playoffType === t.id ? 'text-[#4361EE]' : 'text-white/40'}`}>{t.label}</div>
                     <div className="text-[8px] font-bold text-white/20 uppercase mt-0.5">{t.desc}</div>
                   </button>
                 ))}
               </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Entry Mode Toggle */}
      <div className="space-y-3">
         <label className="text-[9px] font-black text-white/30 tracking-[0.2em] uppercase px-1">Modalità Iscrizione</label>
         <div className="bg-[#12122A] p-2 rounded-[28px] border border-white/5 flex gap-2">
            <button 
              onClick={() => setEntryMode('invitation')}
              className={`flex-1 py-4 px-4 rounded-[22px] flex items-center justify-center gap-3 transition-all ${entryMode === 'invitation' ? 'bg-[#4361EE]/10 text-[#4361EE] border border-[#4361EE]/20' : 'text-white/20 hover:text-white/40'}`}
            >
              <Users size={16} /> <span className="text-[10px] font-black uppercase tracking-widest">Ad Invito</span>
            </button>
            <button 
              onClick={() => setEntryMode('open')}
              className={`flex-1 py-4 px-4 rounded-[22px] flex items-center justify-center gap-3 transition-all ${entryMode === 'open' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-white/20 hover:text-white/40'}`}
            >
              <Swords size={16} /> <span className="text-[10px] font-black uppercase tracking-widest">Aperte</span>
            </button>
         </div>
         <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest text-center px-4">
           {entryMode === 'invitation' 
             ? "Solo i Blader selezionati potranno confermare e inserire il loro deck."
             : "Chiunque potrà iscriversi e partecipare al torneo."}
         </p>
      </div>

      <AnimatePresence mode="wait">
        {entryMode === 'invitation' ? (
          <motion.div 
            key="invitation" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-black text-white tracking-[0.2em] uppercase pl-1">Invitati ({participants.length})</h3>
              {participants.length < 2 && <div className="text-[9px] font-bold text-white/20 italic animate-pulse">Invita almeno 2 Blader</div>}
            </div>
            <div className="space-y-2 max-h-[200px] overflow-y-auto no-scrollbar pr-2">
              {participants.map((p, i) => (
                <div key={p.user_id || p.guest_name} className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/5 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-black text-[10px] text-white/40">{i+1}</div>
                    <span className="text-sm font-black text-white uppercase italic tracking-tight">{p.username}</span>
                  </div>
                  <button onClick={() => removeParticipant(i)} className="p-2 text-white/10 hover:text-primary"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
            <div className="pt-2 space-y-4">
              <div className="flex gap-2">
                  <div className="flex-1 bg-white/5 rounded-2xl p-4 flex items-center gap-3 border border-white/5 focus-within:border-white/20 shadow-inner">
                    <UserPlus size={18} className="text-white/20" />
                    <input type="text" placeholder="Nome Ospite..." value={guestName} onChange={(e) => setGuestName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addGuest()} className="bg-transparent outline-none text-white text-sm font-bold flex-1" />
                  </div>
                  <button onClick={addGuest} className="w-14 h-14 rounded-2xl bg-[#4361EE] flex items-center justify-center text-white active:scale-95 shadow-lg shadow-[#4361EE]/20"><CheckCircle2 size={24} /></button>
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mask-linear-right">
                {activeUsers.map(u => (
                  <button key={u.id} onClick={() => addParticipant(u)} className="flex-shrink-0 px-5 py-2.5 rounded-xl bg-white/5 border border-white/5 text-[9px] font-black text-white/60 uppercase tracking-widest hover:border-[#4361EE]/50 hover:bg-[#4361EE]/5 transition-all">
                    {u.username}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="open" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-2 gap-4">
               <div className="p-5 rounded-3xl bg-[#12122A] border border-white/5">
                 <div className="text-[9px] font-black text-white/30 tracking-widest uppercase mb-2">Max Blader</div>
                 <input 
                   type="number" value={maxParticipants} 
                   onChange={(e) => setMaxParticipants(parseInt(e.target.value) || 2)} 
                   className="bg-transparent text-white font-black text-2xl outline-none"
                 />
               </div>
               <div className="p-5 rounded-3xl bg-[#12122A] border border-white/5 flex flex-col justify-center">
                 <div className="text-[9px] font-black text-white/30 tracking-widest uppercase mb-1">Visibilità</div>
                 <div className="text-sm font-black text-primary uppercase italic">Public Arena</div>
               </div>
            </div>
            <div className="p-5 rounded-3xl bg-[#12122A] border border-white/5">
               <div className="text-[9px] font-black text-white/30 tracking-widest uppercase mb-2">Descrizione Torneo</div>
               <textarea 
                 value={description} onChange={(e) => setDescription(e.target.value)}
                 placeholder="Regole, premi, location..."
                 className="w-full bg-transparent text-white text-sm font-bold min-h-[80px] outline-none placeholder-white/5"
               />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => onConfirm({ 
          name, format, battleType, participants, 
          registrationOpen: true, // Always true now, but filtered by mode
          registrationMode: entryMode, 
          maxParticipants: entryMode === 'invitation' ? participants.length : maxParticipants,
          description,
          rrCycles: format === 'round_robin' ? rrCycles : 1,
          rrWinnerMode: format === 'round_robin' ? rrWinnerMode : 'points',
          playoffType: (format === 'round_robin' && rrWinnerMode === 'playoff') ? playoffType : null
        })}
        disabled={!canStart}
        whileTap={{ scale: 0.96 }}
        className="w-full py-5 rounded-[22px] font-black text-[11px] tracking-[0.3em] text-white disabled:opacity-20 shadow-glow-primary flex items-center justify-center gap-3 uppercase transition-all overflow-hidden relative"
        style={{ 
           background: canStart ? 'linear-gradient(135deg, #E94560, #C9304A)' : 'rgba(255,255,255,0.05)',
           boxShadow: canStart ? '0 10px 40px -10px rgba(233,69,96,0.5)' : 'none'
        }}
      >
        <div className="relative z-10 flex items-center gap-3">
           {entryMode === 'open' ? 'APRI ISCRIZIONI' : 'CREA E INVITA'} <Trophy size={18} strokeWidth={3} />
        </div>
      </motion.button>
    </div>
  );
}
