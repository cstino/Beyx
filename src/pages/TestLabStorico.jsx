import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, Zap, Target, Flame, RotateCcw } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { PageContainer } from '../components/PageContainer';
import { useUIStore } from '../store/useUIStore';

const TABS = [
  { id: 'top', label: 'TOP', icon: TrendingUp },
  { id: 'wins', label: 'WIN', icon: TrendingUp },
  { id: 'xtreme', label: 'EXTREME', icon: Flame },
  { id: 'burst', label: 'BURST', icon: Zap },
  { id: 'ko', label: 'KO', icon: Target },
  { id: 'spin_finish', label: 'SPIN', icon: RotateCcw },
];

export default function TestLabStorico() {
  const navigate = useNavigate();
  const { setHeader, clearHeader } = useUIStore();
  const [activeTab, setActiveTab] = useState('top');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setHeader('STORICO LAB', '/test-lab');
    return () => clearHeader();
  }, [setHeader, clearHeader]);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    setLoading(true);
    let result;

    if (activeTab === 'top') {
      result = await supabase.rpc('test_lab_leaderboard', { p_min_battles: 0 });
    } else {
      result = await supabase.rpc('test_lab_all_leaderboard', { p_min_battles: 0 });
    }

    let combos = result.data || [];
    if (result.error) {
      console.error(result.error);
      combos = [];
    }

    if (activeTab !== 'top') {
      const sortKey =
        activeTab === 'wins' ? 'wins'
          : activeTab === 'burst' ? 'burst_count'
          : activeTab === 'ko' ? 'ko_count'
          : activeTab === 'xtreme' ? 'xtreme_count'
          : 'spin_finish_count';
      combos = [...combos].sort((a, b) => (b[sortKey] || 0) - (a[sortKey] || 0));
    }

    setData(combos);
    setLoading(false);
  }

  const getValue = (item) => {
    if (activeTab === 'top') return item.points;
    if (activeTab === 'wins') return item.wins;
    if (activeTab === 'burst') return item.burst_count;
    if (activeTab === 'ko') return item.ko_count;
    if (activeTab === 'xtreme') return item.xtreme_count;
    return item.spin_finish_count;
  };

  const getSublabel = (item) => {
    if (activeTab === 'top') {
      return `${item.wins}W / ${item.losses}L · ${item.win_rate}%`;
    }
    return `${item.wins}V / ${item.total_rounds}R · ${item.win_rate}% WR`;
  };

  const getValueLabel = () => {
    if (activeTab === 'top') return 'PTS';
    if (activeTab === 'wins') return 'W';
    return '';
  };

  const typeColor = (type) =>
    type === 'Attack' ? '#ef4444' : type === 'Defense' ? '#3b82f6' : type === 'Stamina' ? '#22c55e' : '#eab308';

  return (
    <PageContainer>
      <div className="px-4 mb-4 pt-4">
        <div className="text-[10px] font-bold tracking-[0.15em] text-[#9b59b6] mb-1 font-createfuture">
          ▲ TEST LAB
        </div>
        <h1 className="text-white text-lg font-black uppercase italic tracking-tight font-createfuture">
          Storico Test
        </h1>
        <p className="text-[9px] text-white/30 font-medium mt-1">
          Statistiche aggregate di tutti i match test · {data.length} blade.
        </p>
      </div>

      <div className="px-4 mb-2 overflow-x-auto scrollbar-hide">
        <div className="flex gap-1.5 pb-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-extrabold tracking-wider whitespace-nowrap border transition-colors font-createfuture ${active ? 'bg-[#9b59b6]/15 border-[#9b59b6]/50 text-[#9b59b6]' : 'bg-white/5 border-white/10 text-white/50'}`}
              >
                <Icon size={12} /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === 'top' && (
        <div className="px-4 mb-2 text-[9px] text-white/20 flex gap-3 font-createfuture">
          <span>Xtreme +2, KO/Burst/Spin +1</span>
          <span>Lose: X-2, KO/Burst/Spin -1</span>
        </div>
      )}

      <div className="px-4 pb-24 space-y-2">
        {loading ? (
          <div className="flex justify-center p-20">
            <div className="w-8 h-8 border-2 border-[#9b59b6] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-16 px-6">
            <TrendingUp size={40} className="mx-auto text-white/10 mb-4" />
            <div className="text-white/30 text-sm font-bold uppercase tracking-widest">Nessun dato test</div>
            <p className="text-white/20 text-[10px] mt-2">Svolgi alcuni scontri nel Test Lab</p>
          </div>
        ) : (
          data.map((item, i) => (
            <motion.div
              key={item.combo_name || i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-[#12122A] border border-white/5"
            >
              <div className={`w-7 text-center font-black tabular-nums font-createfuture ${i === 0 ? 'text-[#9b59b6] text-lg' : i === 1 ? 'text-[#94A3B8] text-base' : i === 2 ? 'text-[#A16207] text-base' : 'text-white/30 text-sm'}`}>
                {i + 1}
              </div>
              {item.blade_image_url ? (
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center p-1.5 shrink-0">
                  <img src={item.blade_image_url} alt="" className="w-full h-full object-contain drop-shadow-md" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                  <TrendingUp size={16} className="text-white/40" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="text-white font-bold text-sm truncate font-createfuture uppercase italic">
                    {item.blade_name || item.combo_name || '???'}
                  </div>
                  {item.blade_type && (
                    <span
                      className="text-[7px] font-black px-1.5 py-0.5 rounded uppercase"
                      style={{ backgroundColor: typeColor(item.blade_type) + '10', color: typeColor(item.blade_type) }}
                    >
                      {item.blade_type}
                    </span>
                  )}
                </div>
                <div className="text-white/40 text-[10px] truncate">{getSublabel(item)}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-white font-black tabular-nums font-createfuture text-sm">{getValue(item)}</div>
                <div className="text-[9px] font-extrabold tracking-wider text-[#9b59b6]/70 font-createfuture">{getValueLabel()}</div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </PageContainer>
  );
}
