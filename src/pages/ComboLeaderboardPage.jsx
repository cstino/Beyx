import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  Zap,
  Target,
  Flame,
  RotateCcw,
  Filter,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { PageContainer } from "../components/PageContainer";
import { useUIStore } from "../store/useUIStore";

const TABS = [
  { id: "top", label: "TOP", icon: TrendingUp },
  { id: "wins", label: "WIN", icon: TrendingUp },
  { id: "xtreme", label: "EXTREME", icon: Flame },
  { id: "burst", label: "BURST", icon: Zap },
  { id: "ko", label: "KO", icon: Target },
  { id: "spin_finish", label: "SPIN", icon: RotateCcw },
];

const BLADE_TYPES = ["Tutti", "Attack", "Defense", "Stamina", "Balance"];

export default function ComboLeaderboardPage() {
  const navigate = useNavigate();
  const { setHeader, clearHeader } = useUIStore();
  const [activeTab, setActiveTab] = useState("top");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bladeFilter, setBladeFilter] = useState("Tutti");
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    setHeader("TOP COMBO", "/");
    return () => clearHeader();
  }, [setHeader, clearHeader]);

  useEffect(() => {
    loadData();
  }, [activeTab, bladeFilter]);

  async function loadData() {
    setLoading(true);
    let combos = null;
    let error = null;

    if (activeTab === "top") {
      const filter = bladeFilter === "Tutti" ? null : bladeFilter;
      const result = await supabase.rpc("combo_points_leaderboard", {
        p_min_battles: 5,
        p_blade_type: filter,
      });
      combos = result.data;
      error = result.error;
    } else {
      const result = await supabase.rpc("all_combos_leaderboard", {
        p_min_battles: 5,
      });
      combos = result.data;
      error = result.error;
    }

    if (error) {
      console.error(error);
      setData([]);
    } else {
      if (activeTab === "top") {
        setData(combos || []);
      } else {
        const sortKey =
          activeTab === "wins"
            ? "wins"
            : activeTab === "burst"
              ? "burst_count"
              : activeTab === "ko"
                ? "ko_count"
                : activeTab === "xtreme"
                  ? "xtreme_count"
                  : "spin_finish_count";
        setData(
          [...(combos || [])].sort(
            (a, b) => (b[sortKey] || 0) - (a[sortKey] || 0),
          ),
        );
      }
    }
    setLoading(false);
  }

  const getValue = (item) => {
    if (activeTab === "top") return item.points;
    if (activeTab === "wins") return item.wins;
    if (activeTab === "burst") return item.burst_count;
    if (activeTab === "ko") return item.ko_count;
    if (activeTab === "xtreme") return item.xtreme_count;
    return item.spin_finish_count;
  };

  const getSublabel = (item) => {
    if (activeTab === "top") {
      return `${item.wins}W / ${item.losses}L / ${item.draws}D · ${item.win_rate}%`;
    }
    return `${item.wins}V / ${item.total_rounds}R · ${item.win_rate}% win rate`;
  };

  const getValueLabel = () => {
    if (activeTab === "top") return "PTS";
    if (activeTab === "wins") return "W";
    return "";
  };

  return (
    <PageContainer>
      <div className="px-4 mb-4 pt-4">
        <div className="text-[10px] font-bold tracking-[0.15em] text-[#9b59b6] mb-1 font-createfuture">
          ▲ CLASSIFICA BEYBLADE
        </div>
        <h1 className="text-white text-lg font-black uppercase italic tracking-tight font-createfuture">
          Top Combo
        </h1>
        <p className="text-[9px] text-white/30 font-medium mt-1">
          Minimo 5 battaglie · {data.length} beyblade qualificati.
        </p>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-2 overflow-x-auto scrollbar-hide">
        <div className="flex gap-1.5 pb-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-extrabold tracking-wider whitespace-nowrap border transition-colors font-createfuture ${active ? "bg-[#9b59b6]/15 border-[#9b59b6]/50 text-[#9b59b6]" : "bg-white/5 border-white/10 text-white/50"}`}
              >
                <Icon size={12} /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter for TOP tab */}
      {activeTab === "top" && (
        <div className="px-4 mb-3">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-extrabold tracking-wider border transition-colors font-createfuture bg-white/5 border-white/10 text-white/50 hover:text-white/70"
          >
            <Filter size={10} /> {bladeFilter.toUpperCase()}
          </button>
          {showFilter && (
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {BLADE_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setBladeFilter(t);
                    setShowFilter(false);
                  }}
                  className={`px-2.5 py-1 rounded-md text-[9px] font-extrabold tracking-wider border transition-colors ${bladeFilter === t ? "bg-[#9b59b6]/15 border-[#9b59b6]/50 text-[#9b59b6]" : "bg-white/5 border-white/10 text-white/40"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Legend for TOP */}
      {activeTab === "top" && (
        <div className="px-4 mb-2 text-[9px] text-white/20 flex gap-3 font-createfuture">
          <span>Win: X+3, KO/Burst/Spin +2</span>
          <span>Lose: X-3, KO/Burst/Spin -2</span>
        </div>
      )}

      {/* Results */}
      <div className="px-4 pb-24 space-y-2">
        {loading ? (
          <div className="flex justify-center p-20">
            <div className="w-8 h-8 border-2 border-[#9b59b6] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-16 px-6">
            <TrendingUp size={40} className="mx-auto text-white/10 mb-4" />
            <div className="text-white/30 text-sm font-bold uppercase tracking-widest">
              Nessuna combo qualificata
            </div>
            <p className="text-white/20 text-[10px] mt-2">
              Minimo 5 battaglie per entrare in classifica
            </p>
          </div>
        ) : (
          data.map((item, i) => (
            <motion.div
              key={item.combo_name || i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02 }}
              onClick={() =>
                navigate(`/combo-stats/${encodeURIComponent(item.combo_name)}`)
              }
              className="flex items-center gap-3 p-3 rounded-xl bg-[#12122A] border border-white/5 cursor-pointer hover:border-[#9b59b6]/30 hover:bg-[#1A1A3A]/50 transition-all"
            >
              <div
                className={`w-7 text-center font-black tabular-nums font-createfuture ${i === 0 ? "text-[#9b59b6] text-lg" : i === 1 ? "text-[#94A3B8] text-base" : i === 2 ? "text-[#A16207] text-base" : "text-white/30 text-sm"}`}
              >
                {i + 1}
              </div>
              {item.blade_image_url ? (
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center p-1.5 shrink-0">
                  <img
                    src={item.blade_image_url}
                    alt=""
                    className="w-full h-full object-contain drop-shadow-md"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                  <TrendingUp size={16} className="text-white/40" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="text-white font-bold text-sm truncate font-createfuture uppercase italic">
                    {item.blade_name || item.combo_name || "Combo"}
                  </div>
                  {item.blade_type && (
                    <span
                      className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase ${item.blade_type === "Attack" ? "bg-red-500/10 text-red-400" : item.blade_type === "Defense" ? "bg-blue-500/10 text-blue-400" : item.blade_type === "Stamina" ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"}`}
                    >
                      {item.blade_type}
                    </span>
                  )}
                </div>
                <div className="text-white/40 text-[10px] truncate">
                  {getSublabel(item)}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-white font-black tabular-nums font-createfuture text-sm">
                  {getValue(item)}
                </div>
                <div className="text-[9px] font-extrabold tracking-wider text-[#9b59b6]/70 font-createfuture">
                  {getValueLabel()}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </PageContainer>
  );
}
