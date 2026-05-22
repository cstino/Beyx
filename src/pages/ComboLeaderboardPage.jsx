import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  Zap,
  Target,
  Flame,
  RotateCcw,
  ChevronLeft,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { PageContainer } from "../components/PageContainer";
import { useUIStore } from "../store/useUIStore";

const TABS = [
  { id: "top_combo", label: "TOP", icon: TrendingUp, sortKey: "wins" },
  { id: "burst", label: "BURST", icon: Zap, sortKey: "burst_count" },
  { id: "ko", label: "KO", icon: Target, sortKey: "ko_count" },
  { id: "xtreme", label: "XTREME", icon: Flame, sortKey: "xtreme_count" },
  {
    id: "spin_finish",
    label: "SPIN",
    icon: RotateCcw,
    sortKey: "spin_finish_count",
  },
];

export default function ComboLeaderboardPage() {
  const navigate = useNavigate();
  const { setHeader, clearHeader } = useUIStore();
  const [activeTab, setActiveTab] = useState("top_combo");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setHeader("TOP COMBO", "/");
    return () => clearHeader();
  }, [setHeader, clearHeader]);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    setLoading(true);
    const { data: combos, error } = await supabase.rpc(
      "all_combos_leaderboard",
      { p_min_battles: 5 },
    );
    if (error) {
      console.error("Error loading combos:", error);
      setData([]);
    } else {
      console.log("Combos loaded:", combos?.length || 0);
      const tab = TABS.find((t) => t.id === activeTab);
      setData(
        [...(combos || [])].sort(
          (a, b) => (b[tab.sortKey] || 0) - (a[tab.sortKey] || 0),
        ),
      );
    }
    setLoading(false);
  }

  const getSublabel = (item) => {
    const m = {
      top_combo: `${item.wins}V / ${item.total_rounds}R · ${item.win_rate}% win rate`,
      burst: `${item.burst_count} Burst · ${item.total_rounds}R`,
      ko: `${item.ko_count} KO · ${item.total_rounds}R`,
      xtreme: `${item.xtreme_count} Xtreme · ${item.total_rounds}R`,
      spin_finish: `${item.spin_finish_count} Spin · ${item.total_rounds}R`,
    };
    return m[activeTab] || `${item.total_rounds} round totali`;
  };

  return (
    <PageContainer>
      <div className="px-4 mb-4 pt-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1 text-[10px] font-black text-white/40 uppercase tracking-widest mb-3 hover:text-white/70 transition-colors"
        >
          <ChevronLeft size={14} /> Home
        </button>
        <div className="text-[10px] font-bold tracking-[0.15em] text-[#9b59b6] mb-1 font-createfuture">
          ▲ CLASSIFICA BEYBLADE
        </div>
        <h1 className="text-white text-lg font-black uppercase italic tracking-tight font-createfuture">
          Top Combo
        </h1>
        <p className="text-[9px] text-white/30 font-medium mt-1">
          Minimo 5 battaglie per entrare in classifica. {data.length} beyblade
          qualificati.
        </p>
      </div>
      <div className="px-4 mb-4 overflow-x-auto scrollbar-hide">
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
              Le combo devono aver partecipato ad almeno 5 scontri
            </p>
          </div>
        ) : (
          data.map((item, i) => (
            <motion.div
              key={item.combo_id || i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-[#12122A] border border-white/5"
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
                <div className="text-white font-bold text-sm truncate font-createfuture uppercase italic">
                  {item.combo_name || "Combo"}
                </div>
                <div className="text-white/40 text-[10px] truncate">
                  {getSublabel(item)}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-white font-black tabular-nums font-createfuture text-sm">
                  {item[
                    activeTab === "top_combo"
                      ? "wins"
                      : activeTab === "burst"
                        ? "burst_count"
                        : activeTab === "ko"
                          ? "ko_count"
                          : activeTab === "xtreme"
                            ? "xtreme_count"
                            : "spin_finish_count"
                  ] || 0}
                </div>
                {activeTab === "top_combo" && (
                  <div className="text-[9px] font-extrabold tracking-wider text-[#9b59b6]/70 font-createfuture">
                    {item.win_rate}%
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </PageContainer>
  );
}
