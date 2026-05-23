import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flame, Zap, Wind, Target, Trophy, RotateCcw } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { PageContainer } from '../components/PageContainer';
import { useUIStore } from '../store/useUIStore';
import { useAuthStore } from '../store/useAuthStore';

const FINISH_TYPES = [
  { key: 'xtreme', label: 'Xtreme', points: 3, icon: Flame, color: '#F5A623' },
  { key: 'burst', label: 'Burst', points: 2, icon: Zap, color: '#E94560' },
  { key: 'ko', label: 'KO', points: 2, icon: Target, color: '#4361EE' },
  { key: 'spin_finish', label: 'Spin Finish', points: 1, icon: RotateCcw, color: '#00D68F' },
];

export default function TestLabScontroMatch() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { setHeader, clearHeader } = useUIStore();
  const userEmail = useAuthStore(s => s.user?.email);
  const isAdmin = useAuthStore(s =>
    s.user?.email === 'cr.96bc@gmail.com'
    || s.user?.email === 'hcskso96@gmail.com'
    || s.profile?.is_admin
  );

  const blade1 = state?.blade1 || { name: '???', image_url: null };
  const blade2 = state?.blade2 || { name: '???', image_url: null };

  const [rounds, setRounds] = useState([]);
  const [currWinner, setCurrWinner] = useState(null);
  const [currFinish, setCurrFinish] = useState(null);
  const [saving, setSaving] = useState(false);
  const [matchComplete, setMatchComplete] = useState(false);

  const totalP1 = rounds.reduce((s, r) => s + (r.winner_side === 'p1' ? r.points : 0), 0);
  const totalP2 = rounds.reduce((s, r) => s + (r.winner_side === 'p2' ? r.points : 0), 0);
  const roundCount = rounds.length;
  const isPairComplete = roundCount % 2 === 0;
  const winner = matchComplete ? (totalP1 > totalP2 ? 'p1' : 'p2') : null;

  useEffect(() => {
    setHeader(`${blade1.name} vs ${blade2.name}`, '/test-lab/scontro');
    return () => clearHeader();
  }, [setHeader, clearHeader]);

  useEffect(() => {
    if (!isAdmin || !state) navigate('/test-lab/scontro', { replace: true });
  }, []);

  function canConfirm() {
    if (roundCount === 0) return true; // first pick
    if (isPairComplete) {
      return totalP1 !== totalP2; // must not be tied after pair
    }
    return true; // middle of pair, can always add
  }

  function addRound() {
    const fi = FINISH_TYPES.find(f => f.key === currFinish);
    const pts_p1 = currWinner === 'p1' ? fi.points : 0;
    const pts_p2 = currWinner === 'p2' ? fi.points : 0;
    const newRounds = [...rounds, {
      winner_side: currWinner,
      finish_type: currFinish,
      points: fi.points,
      points_p1: (rounds.filter(r => r.winner_side === 'p1').reduce((a, b) => a + b.points, 0) + pts_p1),
      points_p2: (rounds.filter(r => r.winner_side === 'p2').reduce((a, b) => a + b.points, 0) + pts_p2),
    }];
    setRounds(newRounds);

    const newP1 = totalP1 + pts_p1;
    const newP2 = totalP2 + pts_p2;

    if (newRounds.length >= 2 && newRounds.length % 2 === 0 && newP1 !== newP2) {
      setMatchComplete(true);
    } else {
      setCurrWinner(null);
      setCurrFinish(null);
    }
  }

  async function saveMatch() {
    setSaving(true);
    const winnerSide = totalP1 > totalP2 ? 'p1' : 'p2';
    const { error } = await supabase.from('test_lab_matches').insert({
      blade1_name: blade1.name,
      blade1_image_url: blade1.image_url,
      blade2_name: blade2.name,
      blade2_image_url: blade2.image_url,
      winner_side: winnerSide,
      rounds,
      total_points_p1: totalP1,
      total_points_p2: totalP2,
      created_by: userEmail,
    });
    setSaving(false);
    if (!error) navigate('/test-lab');
    // if error, stay on page
  }

  if (!state) return null;

  return (
    <PageContainer>
      <div className="px-4 mb-6 pt-2">
        {/* SCOREBOARD */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {blade1.image_url && <img src={blade1.image_url} alt="" className="w-12 h-12 object-contain drop-shadow-lg" />}
            <div>
              <div className="text-[9px] font-black text-white/20 uppercase font-createfuture">P1</div>
              <div className="text-white text-sm font-black italic font-createfuture uppercase truncate max-w-[100px]">{blade1.name}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-white font-createfuture tabular-nums">{Math.max(totalP1, totalP2)}</span>
          </div>
          <div className="flex items-center gap-3 flex-row-reverse">
            {blade2.image_url && <img src={blade2.image_url} alt="" className="w-12 h-12 object-contain drop-shadow-lg" />}
            <div className="text-right">
              <div className="text-[9px] font-black text-white/20 uppercase font-createfuture">P2</div>
              <div className="text-white text-sm font-black italic font-createfuture uppercase truncate max-w-[100px]">{blade2.name}</div>
            </div>
          </div>
        </div>

        {/* ROUNDS HISTORY */}
        <div className="flex flex-wrap gap-1.5 justify-center mb-4">
          {rounds.map((r, i) => (
            <div
              key={i}
              className="text-[9px] font-black px-2 py-1 rounded-lg uppercase flex items-center gap-1"
              style={{
                backgroundColor: r.winner_side === 'p1' ? '#ef444410' : '#3b82f610',
                color: r.winner_side === 'p1' ? '#ef4444' : '#3b82f6',
                border: `1px solid ${r.winner_side === 'p1' ? '#ef444433' : '#3b82f633'}`,
              }}
            >
              R{i + 1}: {r.winner_side.toUpperCase()} ({r.finish_type})
            </div>
          ))}
        </div>

        {/* WINNER ANNOUNCEMENT */}
        {matchComplete && winner && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center mb-4"
          >
            <Trophy size={48} className="mx-auto text-[#F5A623] mb-2" />
            <div className="text-lg font-black text-[#F5A623] font-createfuture uppercase">
              {winner === 'p1' ? blade1.name : blade2.name} VINCE!
            </div>
            <div className="text-[9px] text-white/40 font-black uppercase mt-1">
              {totalP1} - {totalP2} ({rounds.length} round)
            </div>
          </motion.div>
        )}

        {/* PICKER (if not complete) */}
        {!matchComplete && (
          <div className="bg-[#12122A] rounded-3xl border border-white/5 p-5">
            <div className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4 font-createfuture text-center">
              Round {roundCount + 1}
            </div>

            {/* Winner picker */}
            {!currWinner ? (
              <div>
                <div className="text-[9px] text-white/30 uppercase text-center mb-3 font-black">Chi ha vinto?</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrWinner('p1')}
                    className="flex-1 py-3 rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] font-black text-sm uppercase font-createfuture hover:bg-[#ef4444]/20"
                  >
                    {blade1.name}
                  </button>
                  <button
                    onClick={() => setCurrWinner('p2')}
                    className="flex-1 py-3 rounded-xl bg-[#3b82f6]/10 border border-[#3b82f6]/30 text-[#3b82f6] font-black text-sm uppercase font-createfuture hover:bg-[#3b82f6]/20"
                  >
                    {blade2.name}
                  </button>
                </div>
              </div>
            ) : !currFinish ? (
              <div>
                <div className="text-[9px] text-white/30 uppercase text-center mb-3 font-black">Tipo di finish</div>
                <div className="grid grid-cols-2 gap-2">
                  {FINISH_TYPES.map(f => (
                    <button
                      key={f.key}
                      onClick={() => setCurrFinish(f.key)}
                      className="py-3 rounded-xl flex flex-col items-center gap-1 border transition-all"
                      style={{
                        backgroundColor: f.color + '10',
                        borderColor: f.color + '30',
                        color: f.color,
                      }}
                    >
                      <f.icon size={16} />
                      <span className="text-[9px] font-black uppercase">{f.label}</span>
                      <span className="text-[7px] opacity-50">+{f.points}pt</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={addRound}
                disabled={saving}
                className="w-full py-4 rounded-2xl bg-[#F43F5E] text-white font-black text-sm uppercase tracking-widest font-createfuture"
              >
                CONFERMA RISULTATO
              </motion.button>
            )}
          </div>
        )}

        {/* SAVE MATCH */}
        {matchComplete && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={saveMatch}
            disabled={saving}
            className="w-full mt-4 py-4 rounded-2xl bg-[#22c55e] text-white font-black text-sm uppercase tracking-widest font-createfuture"
          >
            {saving ? 'Salvando...' : 'SALVA MATCH'}
          </motion.button>
        )}
      </div>
    </PageContainer>
  );
}
