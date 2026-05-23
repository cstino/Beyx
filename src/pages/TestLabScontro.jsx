import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Swords, ArrowRight, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { PageContainer } from '../components/PageContainer';
import { useUIStore } from '../store/useUIStore';
import { useAuthStore } from '../store/useAuthStore';

export default function TestLabScontro() {
  const navigate = useNavigate();
  const { setHeader, clearHeader } = useUIStore();
  const userId = useAuthStore(s => s.user?.id);
  const [blades, setBlades] = useState([]);
  const [p1, setP1] = useState(null);
  const [p2, setP2] = useState(null);
  const [pickingFor, setPickingFor] = useState('p1');

  useEffect(() => {
    setHeader('SCONTRO SINGOLO', '/test-lab');
    return () => clearHeader();
  }, [setHeader, clearHeader]);

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
  }, [userId]);

  useEffect(() => {
    if (p1 && !p2) setPickingFor('p2');
  }, [p1, p2]);

  function selectBlade(blade) {
    if (pickingFor === 'p1') setP1(blade);
    else setP2(blade);
  }

  function startMatch() {
    if (!p1 || !p2) return;
    navigate('/test-lab/scontro/match', {
      state: {
        blade1: { name: p1.name, image_url: p1.image_url },
        blade2: { name: p2.name, image_url: p2.image_url },
      },
    });
  }

  const typeColor = (type) =>
    type === 'Attack' ? '#ef4444' : type === 'Defense' ? '#3b82f6' : type === 'Stamina' ? '#22c55e' : '#eab308';

  return (
    <PageContainer>
      <div className="px-4 mb-6 pt-2">
        {/* ARENA */}
        <div className="flex items-stretch gap-2 mb-6">
          <motion.div
            className="flex-1 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 p-4 flex flex-col items-center justify-center min-h-[180px]"
            animate={{ borderColor: pickingFor === 'p1' ? '#ef444466' : 'transparent' }}
          >
            {p1 ? (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center"
              >
                <div className="relative">
                  <div
                    className="absolute inset-0 rounded-full blur-xl opacity-20"
                    style={{ background: typeColor(p1.type) }}
                  />
                  <img src={p1.image_url} alt={p1.name} className="relative z-10 w-24 h-24 object-contain drop-shadow-[0_0_20px_#00000066]" />
                </div>
                <div
                  className="text-[8px] font-black px-2 py-0.5 rounded-full uppercase mt-2"
                  style={{ backgroundColor: typeColor(p1.type) + '20', color: typeColor(p1.type) }}
                >
                  {p1.type}
                </div>
                <div className="text-[10px] font-black text-white/60 uppercase mt-1 text-center font-createfuture">{p1.name}</div>
                {pickingFor === 'p1' && (
                  <button onClick={() => { setP1(null); setPickingFor('p1'); }} className="mt-2 text-[8px] text-white/30 hover:text-white/60 uppercase font-black">
                    Cambia
                  </button>
                )}
              </motion.div>
            ) : (
              <span className="text-[11px] font-black text-white/20 uppercase font-createfuture">SELEZIONA P1</span>
            )}
          </motion.div>

          <div className="flex items-center">
            <Swords size={24} className="text-[#F5A623] rotate-90" />
          </div>

          <motion.div
            className="flex-1 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 p-4 flex flex-col items-center justify-center min-h-[180px]"
            animate={{ borderColor: pickingFor === 'p2' ? '#3b82f666' : 'transparent' }}
          >
            {p2 ? (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center"
              >
                <div className="relative">
                  <div
                    className="absolute inset-0 rounded-full blur-xl opacity-20"
                    style={{ background: typeColor(p2.type) }}
                  />
                  <img src={p2.image_url} alt={p2.name} className="relative z-10 w-24 h-24 object-contain drop-shadow-[0_0_20px_#00000066]" />
                </div>
                <div
                  className="text-[8px] font-black px-2 py-0.5 rounded-full uppercase mt-2"
                  style={{ backgroundColor: typeColor(p2.type) + '20', color: typeColor(p2.type) }}
                >
                  {p2.type}
                </div>
                <div className="text-[10px] font-black text-white/60 uppercase mt-1 text-center font-createfuture">{p2.name}</div>
                {pickingFor === 'p2' && (
                  <button onClick={() => { setP2(null); setPickingFor('p2'); }} className="mt-2 text-[8px] text-white/30 hover:text-white/60 uppercase font-black">
                    Cambia
                  </button>
                )}
              </motion.div>
            ) : (
              <span className="text-[11px] font-black text-white/20 uppercase font-createfuture">SELEZIONA P2</span>
            )}
          </motion.div>
        </div>

        {/* SELECTION INDICATOR */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className={`text-[10px] font-black uppercase tracking-widest cursor-pointer ${pickingFor === 'p1' ? 'text-white' : 'text-white/20'}`}
            onClick={() => setPickingFor('p1')}
          >
            ◄ P1
          </span>
          <div className="flex-1 h-0.5 bg-white/10 rounded-full" />
          <span
            className={`text-[10px] font-black uppercase tracking-widest cursor-pointer ${pickingFor === 'p2' ? 'text-white' : 'text-white/20'}`}
            onClick={() => setPickingFor('p2')}
          >
            P2 ►
          </span>
        </div>

        {/* BLADE GRID */}
        <div className="grid grid-cols-3 gap-2 mb-20">
          {blades.map((b, i) => {
            const selected = (p1?.name === b.name) || (p2?.name === b.name);
            return (
              <motion.button
                key={b.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.01 }}
                onClick={() => selectBlade(b)}
                disabled={selected}
                className={`p-3 rounded-xl flex flex-col items-center gap-1 border transition-all ${
                  selected
                    ? 'border-white/10 bg-white/5 opacity-30'
                    : 'border-white/5 bg-white/[0.02] hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <img src={b.image_url} alt={b.name} className="w-12 h-12 object-contain" />
                <span className="text-[8px] font-black text-white/50 text-center leading-tight uppercase">{b.name}</span>
                <span className="text-[7px] font-black px-1.5 py-0.5 rounded uppercase" style={{ backgroundColor: typeColor(b.type) + '20', color: typeColor(b.type) }}>
                  {b.type}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* START BUTTON */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-6 pt-2"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}
      >
        <div className="mx-auto max-w-lg">
          <button
            onClick={startMatch}
            disabled={!p1 || !p2}
            className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest font-createfuture transition-all ${
              p1 && p2
                ? 'bg-[#F43F5E] text-white shadow-[0_0_30px_rgba(244,63,94,0.4)] active:scale-[0.98]'
                : 'bg-white/10 text-white/20 cursor-not-allowed'
            }`}
          >
            {p1 && p2 ? `VS - ${p1.name} ⚔️ ${p2.name}` : 'SELEZIONA ENTRAMBE LE BLADE'}
          </button>
        </div>
      </motion.div>
    </PageContainer>
  );
}
