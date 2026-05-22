import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Trophy, Crown } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { PageContainer } from "../components/PageContainer";
import { Avatar } from "../components/Avatar";
import { useUIStore } from "../store/useUIStore";
import { RankBadge, getRankFromElo } from "../components/RankBadge";

const TABS = [
  { id: "elo", label: "ELO", icon: Crown },
  { id: "wins", label: "VITTORIE", icon: Trophy },
];

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const { setHeader, clearHeader } = useUIStore();
  const [activeTab, setActiveTab] = useState("elo");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setHeader("HALL OF FAME", "/");
    return () => clearHeader();
  }, [setHeader, clearHeader]);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    setLoading(true);
    switch (activeTab) {
      case "elo": {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, avatar_id, elo, placement_done, elo_matches")
          .order("elo", { ascending: false })
          .limit(50);
        setData(
          (profiles ?? []).map((u) => ({
            label: u.username,
            sublabel: `${u.elo_matches || 0} Match disputati`,
            value: u.elo,
            avatarId: u.avatar_id,
            userId: u.id,
            elo: u.elo,
            placementDone: u.placement_done,
          })),
        );
        break;
      }
      case "wins": {
        const result = await supabase.rpc("leaderboard_top_players", {
          p_since: "2020-01-01",
        });
        setData(
          (result.data ?? []).map((u) => ({
            label: u.username,
            sublabel: `${u.wins}V / ${u.total_matches}M · ${u.win_rate}%`,
            value: u.wins,
            avatarId: u.avatar_id,
            userId: u.user_id,
            elo: u.elo,
            placementDone: u.placement_done,
          })),
        );
        break;
      }
    }
    setLoading(false);
  }

  return (
    <PageContainer>
      <div className="px-4 mb-4 pt-4">
        <div className="text-[10px] font-bold tracking-[0.15em] text-[#F5A623] mb-1 font-createfuture">
          ▲ CLASSIFICHE
        </div>
        <h1 className="text-white text-lg font-black uppercase italic tracking-tight font-createfuture">
          Hall of Fame
        </h1>
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
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-extrabold tracking-wider whitespace-nowrap border transition-colors font-createfuture ${active ? "bg-[#F5A623]/15 border-[#F5A623]/50 text-[#F5A623]" : "bg-white/5 border-white/10 text-white/50"}`}
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
            <div className="w-8 h-8 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          data.map((item, i) => {
            const rank = item.elo
              ? getRankFromElo(item.elo, item.placementDone)
              : null;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-[#12122A] border border-white/5"
              >
                <div
                  className={`w-7 text-center font-black tabular-nums font-createfuture ${i === 0 ? "text-[#F5A623] text-lg" : i === 1 ? "text-[#94A3B8] text-base" : i === 2 ? "text-[#A16207] text-base" : "text-white/30 text-sm"}`}
                >
                  {i + 1}
                </div>
                {item.avatarId ? (
                  <Avatar avatarId={item.avatarId} size={40} />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                    <Trophy size={16} className="text-white/40" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-white font-bold text-sm truncate font-createfuture uppercase italic">
                    {item.label}
                  </div>
                  <div className="text-white/40 text-[10px] truncate">
                    {item.sublabel}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-black tabular-nums font-createfuture">
                    {item.value}
                  </div>
                  {rank && (
                    <div
                      className="text-[9px] font-extrabold tracking-wider font-createfuture"
                      style={{ color: rank.tier.color }}
                    >
                      {rank.display}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
        {data.length === 0 && !loading && (
          <div className="text-center py-8 text-white/30 text-sm">
            Nessun dato disponibile
          </div>
        )}
      </div>
    </PageContainer>
  );
}
