import React, { useState, useEffect } from 'react';
import { Trophy, Users, Swords, UserPlus, Trash2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

export function TournamentSetup({ onConfirm }) {
  const [name, setName] = useState('');
  const [format, setFormat] = useState('bracket'); // 'bracket' | 'round_robin'
  const [battleType, setBattleType] = useState('1v1'); // '1v1' | '3v3'
  const [participants, setParticipants] = useState([]);
  const [guestName, setGuestName] = useState('');
  const [activeUsers, setActiveUsers] = useState([]);

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

  const canStart = name && participants.length >= 2;

  return (
    <div className="space-y-8 pb-32">
      <div className="text-white/60 text-sm font-medium italic opacity-50">Configura la tua competizione</div>
      
      {/* Name Input */}
      <div className="p-5 rounded-3xl bg-[#12122A] border border-white/5">
        <div className="text-[10px] font-black text-primary tracking-[0.2em] mb-2 uppercase text-center">Nome Torneo</div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="es. Torneo d'Estate 2024"
          className="w-full bg-transparent text-white font-black text-xl text-center italic outline-none placeholder-white/10"
        />
      </div>

      {/* Format & Battle Type */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
           <label className="text-[9px] font-black text-white/30 tracking-[0.2em] uppercase px-1">Formato</label>
           <div className="flex bg-white/5 rounded-2xl p-1">
             <button 
               onClick={() => setFormat('bracket')}
               className={`flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all ${format === 'bracket' ? 'bg-primary text-white shadow-glow-primary' : 'text-white/30'}`}
             >TABELLONE</button>
             <button 
               onClick={() => setFormat('round_robin')}
               className={`flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all ${format === 'round_robin' ? 'bg-[#4361EE] text-white' : 'text-white/30'}`}
             >GIRONE</button>
           </div>
        </div>
        <div className="space-y-2">
           <label className="text-[9px] font-black text-white/30 tracking-[0.2em] uppercase px-1">Sfida</label>
           <div className="flex bg-white/5 rounded-2xl p-1">
             <button 
               onClick={() => setBattleType('1v1')}
               className={`flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all ${battleType === '1v1' ? 'bg-white/20 text-white' : 'text-white/30'}`}
             >1v1</button>
             <button 
               onClick={() => setBattleType('3v3')}
               className={`flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all ${battleType === '3v3' ? 'bg-white/20 text-white' : 'text-white/30'}`}
             >3v3</button>
           </div>
        </div>
      </div>

      {/* Participants */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-black text-white tracking-[0.2em] uppercase">Partecipanti ({participants.length})</h3>
          <div className="text-[9px] font-bold text-white/20 italic">Aggiungi almeno 2 Blader</div>
        </div>

        <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar pr-2">
          <AnimatePresence>
            {participants.map((p, i) => (
              <motion.div
                key={p.user_id || p.guest_name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-black text-xs text-white/40">{i+1}</div>
                  <span className="text-sm font-black text-white uppercase italic tracking-tight">{p.username}</span>
                </div>
                <button onClick={() => removeParticipant(i)} className="text-white/20 hover:text-primary transition-colors"><Trash2 size={16} /></button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Add inputs */}
        <div className="pt-4 space-y-3">
           <div className="flex gap-2">
              <div className="flex-1 bg-white/5 rounded-2xl p-4 flex items-center gap-3 border border-white/5 focus-within:border-white/20 transition-all">
                <UserPlus size={18} className="text-white/20" />
                <input 
                  type="text" 
                  placeholder="Aggiungi Ospite..." 
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addGuest()}
                  className="bg-transparent outline-none text-white text-sm font-bold flex-1"
                />
              </div>
              <button 
                onClick={addGuest}
                className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-white active:scale-95 transition-all"
              >
                <CheckCircle2 size={24} />
              </button>
           </div>

           <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
             {activeUsers.map(u => (
               <button 
                 key={u.id}
                 onClick={() => addParticipant(u)}
                 className="flex-shrink-0 px-4 py-2 rounded-xl bg-[#12122A] border border-white/10 text-[10px] font-black text-white/60 uppercase tracking-widest hover:border-primary/50 transition-all"
               >
                 {u.username}
               </button>
             ))}
           </div>
        </div>
      </div>

      <button
        onClick={() => onConfirm({ name, format, battleType, participants })}
        disabled={!canStart}
        className="w-full py-5 rounded-3xl font-black text-[12px] tracking-[0.3em] text-white disabled:opacity-20 shadow-xl flex items-center justify-center gap-3 uppercase"
        style={{ background: 'linear-gradient(135deg, #E94560, #C9304A)' }}
      >
        Genera {format === 'bracket' ? 'Tabellone' : 'Girone'} <Trophy size={20} strokeWidth={3} />
      </button>
    </div>
  );
}
