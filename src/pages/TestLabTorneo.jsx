import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Swords, CheckSquare, Trophy, ChevronRight, Play, Flame, Zap, Target, RotateCcw } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { PageContainer } from '../components/PageContainer';
import { useUIStore } from '../store/useUIStore';
import { useAuthStore } from '../store/useAuthStore';

const FINISH_TYPES = [
  { key: 'xtreme', label: 'Xtreme', points: 3, icon: Flame, color: '#F5A623' },
  { key: 'burst', label: 'Burst', points: 2, icon: Zap, color: '#E94560' },
  { key: 'ko', label: 'KO', points: 2, icon: Target, color: '#4361EE' },
  { key: 'spin_finish', label: 'Spin', points: 1, icon: RotateCcw, color: '#00D68F' },
];

function nextPow2(n) {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

export default function TestLabTorneo() {
  const navigate = useNavigate();
  const { setHeader, clearHeader } = useUIStore();
  const userId = useAuthStore(s => s.user?.id);
  const userEmail = useAuthStore(s => s.user?.email);
  const isAdmin = useAuthStore(s =>
    s.user?.email === 'cr.96bc@gmail.com'
    || s.user?.email === 'hcskso96@gmail.com'
    || s.profile?.is_admin
  );

  const [step, setStep] = useState('setup');
  const [format, setFormat] = useState('bracket');
  const [blades, setBlades] = useState([]);
  const [selected, setSelected] = useState([]);
  const [tournament, setTournament] = useState(null);
  const [allMatches, setAllMatches] = useState([]);
  const [bracketRounds, setBracketRounds] = useState([]);
  const [matches, setMatches] = useState([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [currentMatchInRound, setCurrentMatchInRound] = useState(0);
  const [currWinner, setCurrWinner] = useState(null);
  const [currFinish, setCurrFinish] = useState(null);
  const [currRounds, setCurrRounds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [tournamentId, setTournamentId] = useState(null);
  const [activeTournament, setActiveTournament] = useState(null);
  const [checkingActive, setCheckingActive] = useState(true);

  const isBracket = format === 'bracket';

  useEffect(() => {
    setHeader('TORNEO TEST', '/test-lab');
    return () => clearHeader();
  }, [setHeader, clearHeader]);

  useEffect(() => {
    if (!isAdmin) navigate('/test-lab', { replace: true });
  }, []);

  useEffect(() => {
    if (!userId) return;
    supabase.from('combos')
      .select('blade:blade_id(name, image_url, type)')
      .eq('user_id', userId)
      .then(({ data }) => {
        if (data) {
          const uniqueBlades = [];
          const seen = new Set();
          data.forEach(c => {
            if (c.blade && !seen.has(c.blade.name)) {
              seen.add(c.blade.name);
              uniqueBlades.push(c.blade);
            }
          });
          setBlades(uniqueBlades.sort((a, b) => a.name.localeCompare(b.name)));
        }
      });

    checkForActive();
  }, [userId]);

  async function checkForActive() {
    const { data } = await supabase
      .from('test_lab_tournaments')
      .select('*')
      .eq('status', 'active')
      .eq('created_by', userEmail)
      .order('created_at', { ascending: false })
      .limit(1);
    if (data && data.length > 0) {
      setActiveTournament(data[0]);
    }
    setCheckingActive(false);
  }

  async function persistState(stateOverride) {
    if (!tournamentId) return;
    const state = stateOverride || {
      format,
      bracketRounds,
      matches,
      currentRound,
      currentMatchInRound,
      allMatches,
      tournament,
    };
    await supabase.from('test_lab_tournaments').update({ state_data: state }).eq('id', tournamentId);
  }

  function resumeTournament() {
    const t = activeTournament;
    const s = t.state_data || {};
    setFormat(s.format || t.format);
    setTournamentId(t.id);
    if (s.format === 'bracket') {
      setBracketRounds(s.bracketRounds || []);
      setCurrentRound(s.currentRound || 0);
      setCurrentMatchInRound(s.currentMatchInRound || 0);
    } else {
      setMatches(s.matches || []);
    }
    setAllMatches(s.allMatches || []);
    setTournament(s.tournament || { format: s.format, participants: t.participants || [] });
    setSelected(t.participants || []);
    setActiveTournament(null);
    setStep('playing');
  }

  function discardActive() {
    if (activeTournament?.id) {
      supabase.from('test_lab_tournaments').update({ status: 'abandoned' }).eq('id', activeTournament.id);
    }
    setActiveTournament(null);
  }

  function toggleBlade(b) {
    setSelected(prev => prev.find(s => s.name === b.name)
      ? prev.filter(s => s.name !== b.name)
      : [...prev, b]
    );
  }

  async function generateBracketTournament() {
    const shuffled = [...selected].sort(() => Math.random() - 0.5);
    const bracketSize = nextPow2(shuffled.length);
    const byeCount = bracketSize - shuffled.length;

    const firstRound = [];
    let idx = 0;

    for (let i = 0; i < bracketSize / 2; i++) {
      if (i < byeCount && idx < shuffled.length) {
        firstRound.push({ p1: shuffled[idx++], p2: null, played: true, winner: 'p1', matchRounds: [] });
      } else {
        const p1 = idx < shuffled.length ? shuffled[idx++] : null;
        const p2 = idx < shuffled.length ? shuffled[idx++] : null;
        if (p1 && p2) {
          firstRound.push({ p1, p2, played: false, winner: null, matchRounds: [] });
        } else if (p1) {
          firstRound.push({ p1, p2: null, played: true, winner: 'p1', matchRounds: [] });
        }
      }
    }

    const allRounds = [firstRound];
    setBracketRounds(allRounds);
    setAllMatches([]);
    setCurrentRound(0);
    setCurrentMatchInRound(firstRound.findIndex(m => !m.played));
    setTournament({ format: 'bracket', participants: selected });
    setStep('playing');

    // Persist
    const stateData = { format: 'bracket', bracketRounds: allRounds, currentRound: 0, currentMatchInRound: firstRound.findIndex(m => !m.played), allMatches: [], tournament: { format: 'bracket', participants: selected } };
    const { data } = await supabase.from('test_lab_tournaments').insert({
      name: `Torneo Bracket - ${new Date().toLocaleDateString()}`,
      format: 'bracket',
      participants: selected.map(s => ({ name: s.name, image_url: s.image_url, type: s.type })),
      status: 'active',
      state_data: stateData,
      created_by: userEmail,
    }).select('id').single();
    if (data) setTournamentId(data.id);
  }

  async function generateRoundRobinTournament() {
    const shuffled = [...selected].sort(() => Math.random() - 0.5);
    const generated = [];
    for (let i = 0; i < shuffled.length - 1; i++) {
      for (let j = i + 1; j < shuffled.length; j++) {
        generated.push({ p1: shuffled[i], p2: shuffled[j], played: false, winner: null, matchRounds: [] });
      }
    }
    setMatches(generated);
    setTournament({ format: 'round_robin', participants: selected });
    setStep('playing');

    const stateData = { format: 'round_robin', matches: generated, allMatches: [], tournament: { format: 'round_robin', participants: selected } };
    const { data } = await supabase.from('test_lab_tournaments').insert({
      name: `Torneo Round Robin - ${new Date().toLocaleDateString()}`,
      format: 'round_robin',
      participants: selected.map(s => ({ name: s.name, image_url: s.image_url, type: s.type })),
      status: 'active',
      state_data: stateData,
      created_by: userEmail,
    }).select('id').single();
    if (data) setTournamentId(data.id);
  }

  function generateTournament() {
    if (selected.length < 2) return;
    discardActive();
    if (isBracket) generateBracketTournament();
    else generateRoundRobinTournament();
  }

  function addMatchRound() {
    const fi = FINISH_TYPES.find(f => f.key === currFinish);
    const pts = fi.points;
    const newRounds = [...currRounds, { winner: currWinner, finish_type: currFinish, points: pts }];

    const p1Score = newRounds.filter(r => r.winner === 'p1').reduce((a, b) => a + b.points, 0);
    const p2Score = newRounds.filter(r => r.winner === 'p2').reduce((a, b) => a + b.points, 0);

    setCurrRounds(newRounds);
    setCurrWinner(null);
    setCurrFinish(null);

    if (newRounds.length >= 2 && newRounds.length % 2 === 0 && p1Score !== p2Score) {
      const winner = p1Score > p2Score ? 'p1' : 'p2';
      if (isBracket) completeBracketMatch(winner, newRounds);
      else completeRRMatch(winner, newRounds);
    }
  }

  function completeBracketMatch(winner, matchRounds) {
    const rounds = [...bracketRounds];
    const cr = currentRound;
    const cm = currentMatchInRound;

    rounds[cr][cm] = { ...rounds[cr][cm], played: true, winner, matchRounds };

    const played = []; rounds.forEach(r => r.forEach(m => { if (m.played && !m.p2) {} else if (m.played) played.push(m); }));
    setAllMatches(played);
    setBracketRounds(rounds);
    setCurrRounds([]);
    setCurrWinner(null);
    setCurrFinish(null);

    const allDoneInRound = rounds[cr].every(m => m.played);
    if (!allDoneInRound) {
      const nextMatch = rounds[cr].findIndex(m => !m.played);
      setCurrentMatchInRound(nextMatch);
      persistState({ format: 'bracket', bracketRounds: rounds, currentRound: cr, currentMatchInRound: nextMatch, allMatches: played, tournament: { format: 'bracket', participants: tournament?.participants || [] } });
      return;
    }

    if (rounds[cr].length === 1) {
      const finalWinner = rounds[cr][0].winner === 'p1' ? rounds[cr][0].p1.name : rounds[cr][0].p2.name;
      finishBracketTournament(rounds, finalWinner, played);
      return;
    }

    const winners = rounds[cr].map(m => m.winner === 'p1' ? m.p1 : m.p2);
    const nextRound = [];
    for (let i = 0; i < winners.length; i += 2) {
      if (i + 1 < winners.length) {
        nextRound.push({ p1: winners[i], p2: winners[i + 1], played: false, winner: null, matchRounds: [] });
      } else {
        nextRound.push({ p1: winners[i], p2: null, played: true, winner: 'p1', matchRounds: [] });
      }
    }

    rounds.push(nextRound);
    setBracketRounds(rounds);
    setCurrentRound(cr + 1);
    setCurrentMatchInRound(nextRound.findIndex(m => !m.played));
    persistState({ format: 'bracket', bracketRounds: rounds, currentRound: cr + 1, currentMatchInRound: nextRound.findIndex(m => !m.played), allMatches: played, tournament: { format: 'bracket', participants: tournament?.participants || [] } });
  }

  async function finishBracketTournament(rounds, winnerName, playedMatches) {
    const allParticipantNames = new Set();
    rounds.forEach(r => r.forEach(m => {
      if (m.p1) allParticipantNames.add(m.p1.name);
      if (m.p2) allParticipantNames.add(m.p2.name);
    }));

    const stats = {};
    allParticipantNames.forEach(name => { stats[name] = { name, wins: 0, losses: 0 }; });
    playedMatches.forEach(m => {
      const p1name = m.p1.name, p2name = m.p2.name;
      if (m.winner === 'p1') { stats[p1name].wins++; stats[p2name].losses++; }
      else { stats[p2name].wins++; stats[p1name].losses++; }
    });

    const standings = Object.values(stats).sort((a, b) => b.wins - a.wins || a.losses - b.losses);
    const finalTournament = { ...tournament, standings, winner: winnerName, format: 'bracket' };
    setTournament(finalTournament);
    setAllMatches(playedMatches);
    setStep('results');

    if (tournamentId) {
      await supabase.from('test_lab_tournaments').update({
        status: 'completed',
        winner_name: winnerName,
        state_data: { format: 'bracket', bracketRounds: rounds, currentRound: rounds.length - 1, currentMatchInRound: 0, allMatches: playedMatches, tournament: finalTournament },
      }).eq('id', tournamentId);
    }
  }

  function completeRRMatch(winner, matchRounds) {
    const idx = matches.findIndex(m => !m.played);
    const updated = [...matches];
    updated[idx] = { ...updated[idx], played: true, winner, matchRounds };
    setMatches(updated);
    setCurrRounds([]);
    setCurrWinner(null);
    setCurrFinish(null);

    const next = updated.findIndex(m => !m.played);
    if (next === -1) {
      finishRRTournament(updated);
    } else {
      persistState({ format: 'round_robin', matches: updated, allMatches: [], tournament: { format: 'round_robin', participants: tournament?.participants || [] } });
    }
  }

  async function finishRRTournament(matchesArr) {
    const stats = {};
    matchesArr.forEach(m => {
      const p1 = m.p1.name, p2 = m.p2.name;
      if (!stats[p1]) stats[p1] = { name: p1, wins: 0, losses: 0 };
      if (!stats[p2]) stats[p2] = { name: p2, wins: 0, losses: 0 };
      if (m.winner === 'p1') { stats[p1].wins++; stats[p2].losses++; }
      else { stats[p2].wins++; stats[p1].losses++; }
    });
    const standings = Object.values(stats).sort((a, b) => b.wins - a.wins || a.losses - b.losses);
    const finalTournament = { ...tournament, standings, winner: standings[0].name, format: 'round_robin' };
    setTournament(finalTournament);
    setAllMatches(matchesArr);
    setStep('results');

    if (tournamentId) {
      await supabase.from('test_lab_tournaments').update({
        status: 'completed',
        winner_name: standings[0].name,
        state_data: { format: 'round_robin', matches: matchesArr, allMatches: matchesArr, tournament: finalTournament },
      }).eq('id', tournamentId);
    }
  }

  async function saveTournament() {
    setSaving(true);
    const matchIds = [];
    for (const m of allMatches) {
      if (!m.p2) continue;
      const { data } = await supabase.from('test_lab_matches').insert({
        blade1_name: m.p1.name,
        blade1_image_url: m.p1.image_url,
        blade2_name: m.p2.name,
        blade2_image_url: m.p2.image_url,
        winner_side: m.winner,
        rounds: m.matchRounds,
        total_points_p1: m.matchRounds.filter(r => r.winner === 'p1').reduce((a, b) => a + b.points, 0),
        total_points_p2: m.matchRounds.filter(r => r.winner === 'p2').reduce((a, b) => a + b.points, 0),
        created_by: userEmail,
      }).select('id').single();
      if (data) matchIds.push(data.id);
    }

    if (tournamentId) {
      await supabase.from('test_lab_tournaments').update({
        match_ids: matchIds,
      }).eq('id', tournamentId);
    }

    setSaving(false);
    navigate('/test-lab');
  }

  function getActiveMatch() {
    if (isBracket) {
      if (currentRound < bracketRounds.length && currentMatchInRound < (bracketRounds[currentRound]?.length || 0)) {
        return bracketRounds[currentRound][currentMatchInRound];
      }
      return null;
    }
    const idx = matches.findIndex(m => !m.played);
    return idx >= 0 ? matches[idx] : null;
  }

  const activeMatch = getActiveMatch();
  const roundLabel = isBracket
    ? (bracketRounds.length > 1 && currentRound === bracketRounds.length - 1 ? 'Finale' : `Round ${currentRound + 1}`)
    : '';

  if (checkingActive) return (
    <PageContainer>
      <div className="flex justify-center p-20"><div className="w-8 h-8 border-2 border-[#9b59b6] border-t-transparent rounded-full animate-spin" /></div>
    </PageContainer>
  );

  return (
    <PageContainer>
      <div className="px-4 mb-6 pt-2">
        {step === 'setup' && (
          <div>
            {/* Active tournament banner */}
            {activeTournament && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-4 rounded-2xl bg-[#F5A623]/10 border border-[#F5A623]/30"
              >
                <div className="text-[9px] font-black text-[#F5A623] uppercase mb-2 font-createfuture">
                  Torneo in corso
                </div>
                <div className="text-[8px] text-white/50 font-medium mb-2">
                  {activeTournament.name} · {activeTournament.format === 'bracket' ? 'Bracket' : 'Round Robin'} · {activeTournament.participants?.length || 0} blade
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={resumeTournament}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl bg-[#F5A623] text-white text-[9px] font-black uppercase"
                  >
                    <Play size={12} /> Riprendi
                  </button>
                  <button
                    onClick={discardActive}
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/30 text-[9px] font-black uppercase"
                  >
                    Elimina
                  </button>
                </div>
              </motion.div>
            )}

            <div className="flex gap-2 mb-4">
              {['bracket', 'round_robin'].map(f => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`flex-1 py-3 rounded-xl font-black text-xs uppercase font-createfuture border transition-all ${
                    format === f
                      ? 'bg-[#9b59b6]/15 border-[#9b59b6]/50 text-[#9b59b6]'
                      : 'bg-white/5 border-white/10 text-white/40'
                  }`}
                >
                  {f === 'bracket' ? 'Bracket' : 'Round Robin'}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] font-black text-white/40 uppercase tracking-widest font-createfuture">
                {selected.length} blade selezionate
              </div>
              <button
                onClick={() => setSelected([...blades])}
                className="flex items-center gap-1 text-[9px] font-black text-[#9b59b6] uppercase hover:text-[#c084fc] transition-colors"
              >
                <CheckSquare size={12} /> Seleziona tutte
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-20">
              {blades.map(b => {
                const isSelected = selected.some(s => s.name === b.name);
                return (
                  <motion.button
                    key={b.name}
                    onClick={() => toggleBlade(b)}
                    className={`p-3 rounded-xl flex flex-col items-center gap-1 border transition-all ${
                      isSelected
                        ? 'border-[#9b59b6]/50 bg-[#9b59b6]/10 scale-95'
                        : 'border-white/5 bg-white/[0.02]'
                    }`}
                  >
                    <img src={b.image_url} alt={b.name} className="w-12 h-12 object-contain" />
                    <span className="text-[8px] font-black text-white/50 text-center leading-tight uppercase">{b.name}</span>
                    {isSelected && <Check size={12} className="text-[#9b59b6]" />}
                  </motion.button>
                );
              })}
            </div>

            <motion.div className="fixed bottom-0 left-0 right-0 z-40 px-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 84px)' }}>
              <div className="mx-auto max-w-lg">
                <button
                  onClick={generateTournament}
                  disabled={selected.length < 2}
                  className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest font-createfuture transition-all ${
                    selected.length >= 2
                      ? 'bg-[#F5A623] text-white shadow-[0_0_30px_rgba(245,166,35,0.4)] active:scale-[0.98]'
                      : 'bg-white/10 text-white/20 cursor-not-allowed'
                  }`}
                >
                  {selected.length >= 2 ? 'GENERA TORNEO' : `MINIMO 2 BLADE (${selected.length})`}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {step === 'playing' && activeMatch && (
          <div>
            <div className="flex items-center justify-between mb-4 text-[9px] text-white/30 font-black uppercase">
              <span>{roundLabel}</span>
              <span>
                {isBracket
                  ? `Match ${currentMatchInRound + 1}/${bracketRounds[currentRound]?.length || 0}`
                  : `${matches.filter(m => m.played).length + 1}/${matches.length}`
                }
              </span>
            </div>

            <div className="flex items-center gap-3 justify-center mb-4">
              <div className="text-center">
                {activeMatch.p1.image_url && <img src={activeMatch.p1.image_url} alt="" className="w-16 h-16 object-contain mx-auto" />}
                <div className="text-[10px] font-black text-white font-createfuture uppercase mt-1">{activeMatch.p1.name}</div>
              </div>
              <Swords size={24} className="text-[#F5A623]" />
              {activeMatch.p2 ? (
                <div className="text-center">
                  {activeMatch.p2.image_url && <img src={activeMatch.p2.image_url} alt="" className="w-16 h-16 object-contain mx-auto" />}
                  <div className="text-[10px] font-black text-white font-createfuture uppercase mt-1">{activeMatch.p2.name}</div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto border border-white/10">
                    <ChevronRight size={20} className="text-white/20" />
                  </div>
                  <div className="text-[8px] font-black text-white/20 uppercase mt-1 font-createfuture">BYE</div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-1 justify-center mb-4">
              {currRounds.map((r, i) => (
                <span key={i} className="text-[8px] font-black px-2 py-0.5 rounded-lg uppercase bg-white/10 text-white/60">
                  R{i + 1}: {r.winner.toUpperCase()} ({r.finish_type})
                </span>
              ))}
            </div>

            <div className="bg-[#12122A] rounded-3xl border border-white/5 p-5">
              <div className="text-[9px] font-black text-white/30 uppercase text-center mb-3 font-createfuture">
                Round {currRounds.length + 1}
              </div>
              {!currWinner ? (
                <div className="flex gap-2">
                  <button onClick={() => setCurrWinner('p1')} className="flex-1 py-3 rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] font-black text-xs uppercase font-createfuture">
                    {activeMatch.p1.name}
                  </button>
                  <button onClick={() => setCurrWinner('p2')} className="flex-1 py-3 rounded-xl bg-[#3b82f6]/10 border border-[#3b82f6]/30 text-[#3b82f6] font-black text-xs uppercase font-createfuture">
                    {activeMatch.p2?.name || 'BYE'}
                  </button>
                </div>
              ) : !currFinish ? (
                <div className="grid grid-cols-2 gap-2">
                    {FINISH_TYPES.map(f => {
                      const FI = f.icon;
                      return (
                        <button
                          key={f.key}
                          onClick={() => setCurrFinish(f.key)}
                          className="py-3 rounded-xl flex flex-col items-center gap-1 border transition-all"
                          style={{ backgroundColor: f.color + '10', borderColor: f.color + '30', color: f.color }}
                        >
                          <FI size={18} />
                          <span className="text-[9px] font-black uppercase">{f.label}</span>
                          <span className="text-[7px] opacity-50">+{f.points}pt</span>
                        </button>
                      );
                    })}
                </div>
              ) : (
                <button onClick={addMatchRound} className="w-full py-4 rounded-2xl bg-[#F43F5E] text-white font-black text-sm uppercase tracking-widest font-createfuture">
                  CONFERMA
                </button>
              )}
            </div>

            {/* Bracket view */}
            {isBracket && (
              <div className="mt-4 space-y-3">
                {bracketRounds.map((round, ri) => (
                  <div key={ri}>
                    <div className="text-[8px] font-black text-white/20 uppercase mb-1.5 font-createfuture text-center">
                      {bracketRounds.length > 1 && ri === bracketRounds.length - 1 ? 'Finale' : ri === bracketRounds.length - 2 ? 'Semifinali' : `Turno ${ri + 1}`}
                    </div>
                    <div className="space-y-1">
                      {round.map((m, mi) => {
                        const isActive = ri === currentRound && mi === currentMatchInRound;
                        return (
                          <div
                            key={mi}
                            className={`p-2 rounded-xl text-[7px] font-black uppercase text-center border flex items-center ${
                              isActive
                                ? 'border-[#F5A623]/50 bg-[#F5A623]/10 text-[#F5A623]'
                                : m.played
                                  ? 'border-[#22c55e]/20 bg-[#22c55e]/5 text-[#22c55e]'
                                  : 'border-white/10 bg-white/5 text-white/30'
                            }`}
                          >
                            <span className={`truncate flex-1 text-right ${m.played ? (m.winner === 'p1' ? 'text-[#22c55e]' : 'text-white/20') : ''}`}>
                              {m.p1?.name}
                            </span>
                            <span className="w-8 text-center text-white/20 shrink-0">vs</span>
                            <span className={`truncate flex-1 text-left ${m.played ? (m.winner === 'p2' ? 'text-[#22c55e]' : 'text-white/20') : ''}`}>
                              {m.p2?.name || 'BYE'}
                            </span>
                            {m.played && (
                              <span className="w-4 text-center shrink-0 text-[8px] text-[#22c55e]">✓</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Round robin match list */}
            {!isBracket && (
              <div className="grid grid-cols-2 gap-2 mt-4">
                {matches.map((m, i) => {
                  const idx = matches.findIndex(mm => !mm.played);
                  const isActive = i === idx;
                  return (
                    <div
                      key={i}
                      className={`p-2 rounded-xl text-[8px] font-black uppercase text-center border ${
                        isActive
                          ? 'border-[#F5A623]/50 bg-[#F5A623]/10 text-[#F5A623]'
                          : m.played
                            ? 'border-[#22c55e]/20 bg-[#22c55e]/5 text-[#22c55e]'
                            : 'border-white/10 bg-white/5 text-white/30'
                      }`}
                    >
                      {m.played ? (
                        <>
                          <span className={m.winner === 'p1' ? 'text-[#22c55e]' : 'text-white/20'}>{m.p1.name}</span>
                          <span className="text-white/10 mx-1">vs</span>
                          <span className={m.winner === 'p2' ? 'text-[#22c55e]' : 'text-white/20'}>{m.p2.name}</span>
                        </>
                      ) : (
                        <>{m.p1.name} vs {m.p2.name}</>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {step === 'results' && tournament && (
          <div className="text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
              <Trophy size={56} className="mx-auto text-[#F5A623] mb-3" />
              <div className="text-xl font-black text-[#F5A623] font-createfuture uppercase">{tournament.winner}</div>
              <div className="text-[10px] text-white/30 font-black uppercase mt-1">VINCITORE</div>
            </motion.div>

            <div className="mt-6 bg-[#12122A] rounded-3xl border border-white/5 p-4">
              <div className="text-[10px] font-black text-white/30 uppercase mb-3 font-createfuture tracking-widest">Classifica</div>
              {tournament.standings?.map((s, i) => (
                <div key={s.name} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-black ${i === 0 ? 'text-[#F5A623]' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-700' : 'text-white/30'}`}>#{i + 1}</span>
                    <span className="text-[9px] font-black text-white/60 uppercase font-createfuture">{s.name}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-green-400 mr-1">{s.wins}W</span>
                    <span className="text-[9px] font-black text-red-400">{s.losses}L</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={saveTournament}
              disabled={saving}
              className="w-full mt-4 py-4 rounded-2xl bg-[#22c55e] text-white font-black text-sm uppercase tracking-widest font-createfuture"
            >
              {saving ? 'Salvando...' : 'SALVA TORNEO'}
            </button>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
