import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  LayoutGrid,
  X,
  Trash2,
  Zap,
  Target,
  Flame,
  RotateCcw,
  Minus,
  Plus,
  Check,
  Users,
  Sparkles,
  Swords,
} from "lucide-react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { TournamentSetup } from "../../components/battle/TournamentSetup";
import { BracketView } from "../../components/battle/BracketView";
import { OutcomePicker } from "../../components/battle/OutcomePicker";
import { PoolSetup } from "../../components/battle/PoolSetup";
import { PoolDraftPlayerView } from "../../components/battle/PoolDraftPlayerView";
import { PoolAstaPlayerView } from "../../components/battle/PoolAstaPlayerView";
import { PoolBustePlayerView } from "../../components/battle/PoolBustePlayerView";
import { determineComboType } from "../../utils/comboUtils";
import { supabase } from "../../lib/supabaseClient";
import { useAuthStore } from "../../store/useAuthStore";
import { useUIStore } from "../../store/useUIStore";
import { Avatar } from "../../components/Avatar";
import { ConfirmModal } from "../../components/ConfirmModal";
import { useToastStore } from "../../store/useToastStore";

export default function NewTournamentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tournamentId } = useParams();
  const { user, profile } = useAuthStore();
  const setHeader = useUIStore((s) => s.setHeader);
  const clearHeader = useUIStore((s) => s.clearHeader);

  const [isReadOnly, setIsReadOnly] = useState(false);
  const [stage, setStage] = useState("setup"); // 'setup' | 'active'
  const [tournament, setTournament] = useState(null);
  const [loadingTournament, setLoadingTournament] = useState(true);
  const [battles, setBattles] = useState([]);
  const [allRounds, setAllRounds] = useState([]);
  const [allCombos, setAllCombos] = useState([]);
  const [parts, setParts] = useState({ blades: [], ratchets: [], bits: [] });
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [blades, setBlades] = useState([]);
  const [ratchets, setRatchets] = useState([]);
  const [bits, setBits] = useState([]);

  useEffect(() => {
    fetchParts();
  }, []);

  async function fetchParts() {
    const [b, r, t, leaderboard] = await Promise.all([
      supabase.from("blades").select("*"),
      supabase.from("ratchets").select("*"),
      supabase.from("bits").select("*"),
      supabase.rpc("combo_points_leaderboard", { p_min_battles: 5 })
    ]);
    const ranks = {};
    if (leaderboard.data) {
      leaderboard.data.forEach((item, index) => {
        ranks[item.blade_name] = index + 1;
      });
    }
    const resolvedBlades = (b.data || []).map(blade => {
      let resolved = blade;
      if (blade.active_variant_index != null && Array.isArray(blade.variants) && blade.variants[blade.active_variant_index]?.image_url) {
        resolved = { ...blade, image_url: blade.variants[blade.active_variant_index].image_url };
      }
      return { ...resolved, topRank: ranks[blade.name] || null };
    });
    setBlades(resolvedBlades);
    setRatchets(r.data || []);
    setBits(t.data || []);
  }

  const getPartName = (type, id) => {
    if (!id) return "";
    if (type === "blade")
      return blades.find((p) => p.id === id)?.name || "Unknown Blade";
    if (type === "ratchet")
      return ratchets.find((p) => p.id === id)?.name || "Unknown Ratchet";
    if (type === "bit")
      return bits.find((p) => p.id === id)?.name || "Unknown Bit";
    return "";
  };

  // Resume unfinished tournament if exists
  useEffect(() => {
    async function checkActiveTournament() {
      if (!user) {
        setLoadingTournament(false);
        return;
      }

      const targetId = tournamentId || location.state?.tournamentId;
      let query = supabase.from("tournaments").select("*");

      if (targetId) {
        query = query.eq("id", targetId);
      } else {
        // Se non c'è un ID specifico, cerchiamo l'ultimo creato dall'utente non concluso
        query = query
          .eq("created_by", user.id)
          .neq("status", "completed")
          .order("created_at", { ascending: false })
          .limit(1);
      }

      const { data, error } = await query.maybeSingle();

      if (data) {
        const isAdminUser =
          user?.email === "hcskso96@gmail.com" || profile?.is_admin;
        setIsReadOnly(!(isAdminUser || data.created_by === user.id));
        const structure =
          typeof data.structure === "string"
            ? JSON.parse(data.structure)
            : data.structure;
        data.structure = structure || {};
        data.assignment_mode =
          data.assignment_mode || data.structure?.assignment_mode;
        data.beyblade_mode =
          data.beyblade_mode || data.structure?.beyblade_mode;

        const rounds = data.structure.rounds || [];
        const finalRound = rounds[rounds.length - 1];
        const finalMatch = finalRound?.matches[0];

        const isPlayoffFinal =
          finalRound?.isPlayoff && finalRound?.matches.length === 1;
        const isBracketFinal = data.format === "bracket" && finalMatch?.winner;
        const isRRFinal =
          data.format === "round_robin" && isPlayoffFinal && finalMatch?.winner;

        if (
          (isBracketFinal || isRRFinal) &&
          data.status === "active" &&
          data.created_by === user.id
        ) {
          const winner =
            finalMatch.winner === "p1" ? finalMatch.p1 : finalMatch.p2;
          const repaired = {
            ...data,
            structure,
            status: "completed",
            winner_user_id: winner.user_id,
            winner_guest_name: winner.guest_name,
          };
          setTournament(repaired);
          setStage("active");
          updateTournamentDB(repaired);
        } else if (
          data.format === "round_robin" &&
          structure.settings?.rrWinnerMode === "points" &&
          data.status === "active"
        ) {
          // Check if all rounds are complete for points-based RR
          const allComplete = structure.rounds.every((r) =>
            r.matches.every((m) => m.winner),
          );
          if (allComplete) {
            const standings = calculateStandings({ ...data, structure });
            const winner = standings[0];
            const repaired = {
              ...data,
              structure,
              status: "completed",
              winner_user_id: winner.user_id,
              winner_guest_name: winner.guest_name || winner.username,
            };
            setTournament(repaired);
            setStage("active");
            updateTournamentDB(repaired);
          } else {
            setTournament({ ...data, structure });
            if (targetId || (data.status === "setup" && data.registration_open))
              setStage("active");
          }
        } else {
          setTournament({ ...data, structure });

          // Determine stage based on status
          if (data.status === "drafting") {
            setStage(
              data.assignment_mode === "asta"
                ? "auctioning"
                : data.assignment_mode === "a_buste"
                  ? "sealed_bidding"
                  : "drafting",
            );
          } else if (data.status === "auctioning") {
            setStage("auctioning");
          } else if (data.status === "draft_complete") {
            setStage(
              data.assignment_mode === "asta"
                ? "auctioning"
                : data.assignment_mode === "a_buste"
                  ? "sealed_bidding"
                  : "drafting",
            );
          } else if (data.status === "setup") {
            if (
              data.beyblade_mode === "pool" &&
              (!structure.pool || structure.pool.length === 0) &&
              data.created_by === user.id
            ) {
              setStage("pool_setup");
            } else {
              setStage("active"); // active stage in status 'setup' shows registrations
            }
          } else {
            setStage("active");
          }
        }

        // FETCH ADDITIONAL DATA FOR DETAILS
        const tid = data.id;
        const [bladesRes, ratchetsRes, bitsRes, battlesRes, leaderboard] = await Promise.all(
          [
            supabase.from("blades").select("*"),
            supabase.from("ratchets").select("*"),
            supabase.from("bits").select("*"),
            supabase.from("battles").select("*").eq("tournament_id", tid),
            supabase.rpc("combo_points_leaderboard", { p_min_battles: 5 })
          ],
        );

        const ranks = {};
        if (leaderboard.data) {
          leaderboard.data.forEach((item, index) => {
            ranks[item.blade_name] = index + 1;
          });
        }

        const resolvedBladesDetail = (bladesRes.data || []).map(blade => {
          let resolved = blade;
          if (blade.active_variant_index != null && Array.isArray(blade.variants) && blade.variants[blade.active_variant_index]?.image_url) {
            resolved = { ...blade, image_url: blade.variants[blade.active_variant_index].image_url };
          }
          return { ...resolved, topRank: ranks[blade.name] || null };
        });

        setParts({
          blades: resolvedBladesDetail,
          ratchets: ratchetsRes.data || [],
          bits: bitsRes.data || [],
        });
        setBattles(battlesRes.data || []);

        if (battlesRes.data?.length > 0) {
          const battleIds = battlesRes.data.map((b) => b.id);
          const { data: roundsData } = await supabase
            .from("rounds")
            .select("*")
            .in("battle_id", battleIds);
          setAllRounds(roundsData || []);

          const comboIds = [
            ...new Set([
              ...battlesRes.data.map((b) => b.player1_combo_id),
              ...battlesRes.data.map((b) => b.player2_combo_id),
              ...(roundsData || []).map((r) => r.p1_combo_id),
              ...(roundsData || []).map((r) => r.p2_combo_id),
            ]),
          ].filter(Boolean);

          if (comboIds.length > 0) {
            const { data: combosData } = await supabase
              .from("combos")
              .select("*")
              .in("id", comboIds);
            setAllCombos(combosData || []);
          }
        }
      } else {
        setTournament(null);
        setStage("setup");
      }
      setLoadingTournament(false);
    }
    checkActiveTournament();

    // Add Realtime subscription for tournament updates
    const tid = tournamentId || location.state?.tournamentId;
    if (tid) {
      const channel = supabase
        .channel(`tournament-${tid}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "tournaments",
            filter: `id=eq.${tid}`,
          },
          (payload) => {
            const updated = payload.new;
            const structure =
              typeof updated.structure === "string"
                ? JSON.parse(updated.structure)
                : updated.structure;
            updated.structure = structure || {};
            updated.assignment_mode =
              updated.assignment_mode || updated.structure?.assignment_mode;
            updated.beyblade_mode =
              updated.beyblade_mode || updated.structure?.beyblade_mode;

            // Only update state if the status or structure actually changed to avoid race conditions
            setTournament((prev) => {
              if (!prev) return updated;
              const prevStr = JSON.stringify(prev.structure);
              const nextStr = JSON.stringify(updated.structure);
              if (prevStr === nextStr && prev.status === updated.status)
                return prev;
              return updated;
            });
          },
        )
        .subscribe();

      return () => supabase.removeChannel(channel);
    }
  }, [user, profile, tournamentId, location.state?.tournamentId]);

  // Sincronizzazione automatica dello stage del torneo per i client in tempo reale
  useEffect(() => {
    if (!tournament) return;
    
    if (tournament.status === "drafting") {
      const targetStage = tournament.assignment_mode === "asta"
        ? "auctioning"
        : tournament.assignment_mode === "a_buste"
          ? "sealed_bidding"
          : "drafting";
      if (stage !== targetStage) {
        setStage(targetStage);
      }
    } else if (tournament.status === "auctioning") {
      if (stage !== "auctioning") setStage("auctioning");
    } else if (tournament.status === "draft_complete") {
      const targetStage = tournament.assignment_mode === "asta"
        ? "auctioning"
        : tournament.assignment_mode === "a_buste"
          ? "sealed_bidding"
          : "drafting";
      if (stage !== targetStage) {
        setStage(targetStage);
      }
    } else if (tournament.status === "setup") {
      if (
        tournament.beyblade_mode === "pool" &&
        (!tournament.structure?.pool || tournament.structure.pool.length === 0) &&
        tournament.created_by === user?.id
      ) {
        if (stage !== "pool_setup") setStage("pool_setup");
      } else {
        if (stage !== "active") setStage("active");
      }
    } else {
      if (stage !== "active") setStage("active");
    }
  }, [tournament?.status, tournament?.assignment_mode, tournament?.beyblade_mode, tournament?.structure?.pool]);

  function calculateStandings(t) {
    const participants = t.participants || [];
    const rounds = t.structure.rounds || [];

    const stats = participants
      .filter((p) => !p.isBye)
      .map((p) => ({
        ...p,
        played: 0,
        won: 0,
        lost: 0,
        draws: 0,
        koPoints: 0,
        points: 0,
      }));

    rounds.forEach((r) => {
      if (r.isPlayoff) return;

      // A round is completed if all non-bye matches in it are completed
      const isRoundCompleted =
        r.matches?.every((m) => m.p1?.isBye || m.p2?.isBye || m.winner) ??
        false;

      r.matches.forEach((m) => {
        if (m.winner) {
          const isByeMatch = m.p1?.isBye || m.p2?.isBye;
          // If it's a BYE match, only count it if the round is completed
          if (isByeMatch && !isRoundCompleted) return;

          const p1Id = m.p1.user_id || m.p1.username;
          const p2Id = m.p2.user_id || m.p2.username;

          const s1 = stats.find((s) => (s.user_id || s.username) === p1Id);
          const s2 = stats.find((s) => (s.user_id || s.username) === p2Id);

          if (!isByeMatch) {
            if (s1) {
              s1.played++;
              s1.koPoints += m.score?.p1 || 0;
            }
            if (s2) {
              s2.played++;
              s2.koPoints += m.score?.p2 || 0;
            }
          }

          if (m.winner === "draw") {
            if (s1) {
              s1.draws++;
              s1.points += 1;
            }
            if (s2) {
              s2.draws++;
              s2.points += 1;
            }
          } else if (m.winner === "p1") {
            if (s1) {
              s1.won++;
              s1.points += 3;
            }
            if (s2 && !isByeMatch) {
              s2.lost++;
            }
          } else {
            if (s2) {
              s2.won++;
              s2.points += 3;
            }
            if (s1 && !isByeMatch) {
              s1.lost++;
            }
          }
        }
      });
    });

    return stats.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.koPoints !== a.koPoints) return b.koPoints - a.koPoints;
      return b.won - a.won;
    });
  }

  async function startPlayoffs() {
    const standings = calculateStandings(tournament);
    const type = tournament.structure.settings?.playoffType;
    const newRounds = [...tournament.structure.rounds];

    if (type === "final") {
      newRounds.push({
        isPlayoff: true,
        title: "Finale",
        matches: [{ p1: standings[0], p2: standings[1], winner: null }],
      });
    } else if (type === "semi") {
      newRounds.push(
        {
          isPlayoff: true,
          title: "Semifinali",
          matches: [
            { p1: standings[0], p2: standings[3], winner: null },
            { p1: standings[1], p2: standings[2], winner: null },
          ],
        },
        {
          isPlayoff: true,
          title: "Finale",
          matches: [{ p1: null, p2: null, winner: null }],
        },
      );
    } else if (type === "play_in") {
      newRounds.push(
        {
          isPlayoff: true,
          title: "Play-In",
          matches: [
            { p1: standings[2], p2: standings[5], winner: null },
            { p1: standings[3], p2: standings[4], winner: null },
          ],
        },
        {
          isPlayoff: true,
          title: "Semifinali",
          matches: [
            { p1: standings[0], p2: null, winner: null },
            { p1: standings[1], p2: null, winner: null },
          ],
        },
        {
          isPlayoff: true,
          title: "Finale",
          matches: [{ p1: null, p2: null, winner: null }],
        },
      );
    }

    const updated = {
      ...tournament,
      structure: { ...tournament.structure, rounds: newRounds },
    };
    setTournament(updated);
    await updateTournamentDB(updated);
    useToastStore.getState().success("Playoff generati!");
  }

  // Manage Global Header
  useEffect(() => {
    if (loadingTournament) return;
    setHeader(
      stage === "setup" && !tournament
        ? "Crea Torneo"
        : tournament?.name || "Torneo",
      "/battle",
    );
    return () => clearHeader();
  }, [stage, tournament, setHeader, clearHeader, loadingTournament]);

  function generateRoundRobinOrBracket(participants) {
    const sourceState =
      tournament.structure.draft ||
      tournament.structure.auction ||
      tournament.structure.sealed_bid;
    const pool = tournament.structure.pool || [];

    // Create final participants list with assigned beys from draft
    const finalParticipants = participants.map((p) => {
      const pId = p.id || p.user_id || p.username;
      const assignedComboIds = sourceState?.playerDecks?.[pId] || [];

      // Map combo IDs to full combo objects from pool
      const assignedDecks = assignedComboIds.map((cid) => {
        const combo = pool.find((c) => c.id === cid);
        return {
          blade_id: combo.blade_id,
          is_stock: combo.is_stock,
          ratchet_id: combo.ratchet_id,
          bit_id: combo.bit_id,
          user_stats: combo.user_stats,
          combo_type: combo.combo_type,
        };
      });

      return {
        ...p,
        deck: assignedDecks,
      };
    });

    const structure =
      tournament.format === "bracket"
        ? generateBracket(finalParticipants)
        : generateRoundRobin(
            finalParticipants,
            tournament.structure.settings?.rrCycles || 1,
          );

    // Preserve settings
    structure.settings = tournament.structure.settings;
    structure.pool = tournament.structure.pool;
    structure.draft = tournament.structure.draft; // Keep draft history
    structure.auction = tournament.structure.auction; // Keep auction history
    structure.sealed_bid = tournament.structure.sealed_bid; // Keep sealed bid history
    structure.assignment_mode = tournament.structure.assignment_mode;
    structure.beyblade_mode = tournament.structure.beyblade_mode;

    const updated = {
      ...tournament,
      participants: finalParticipants,
      structure,
      status: "active",
    };

    setTournament(updated);
    updateTournamentDB(updated);
    setStage("active");
    useToastStore.getState().success("Torneo Avviato con le combo assegnate!");
  }

  function generateBracket(participants) {
    const roundCount = Math.ceil(Math.log2(participants.length));
    const bracketSize = Math.pow(2, roundCount);

    // 1. Initial round with potential BYEs
    const firstRoundMatches = [];
    for (let i = 0; i < bracketSize / 2; i++) {
      const p1 = participants[i * 2] || { username: "BYE", isBye: true };
      const p2 = participants[i * 2 + 1] || { username: "BYE", isBye: true };

      let winner = null;
      if (p1.isBye) winner = "p2";
      else if (p2.isBye) winner = "p1";

      firstRoundMatches.push({ p1, p2, winner });
    }

    const rounds = [{ matches: firstRoundMatches }];
    let currentMatchCount = firstRoundMatches.length;
    let rIdx = 0;

    // 2. Generate subsequent rounds and handle BYE advancement
    while (currentMatchCount > 1) {
      currentMatchCount /= 2;
      const nextMatches = Array(currentMatchCount)
        .fill(null)
        .map(() => ({ p1: null, p2: null, winner: null }));

      // Advance winners from current round to next matches
      const currentMatches = rounds[rIdx].matches;
      currentMatches.forEach((m, mIdx) => {
        if (m.winner) {
          const nextMIdx = Math.floor(mIdx / 2);
          const winnerObj = m.winner === "p1" ? m.p1 : m.p2;
          if (mIdx % 2 === 0) nextMatches[nextMIdx].p1 = winnerObj;
          else nextMatches[nextMIdx].p2 = winnerObj;
        }
      });

      // Check for new BYE-induced winners in the next matches
      nextMatches.forEach((m) => {
        if (m.p1 && m.p2 && (m.p1.isBye || m.p2.isBye)) {
          m.winner = m.p1.isBye ? "p2" : "p1";
        }
      });

      rounds.push({ matches: nextMatches });
      rIdx++;
    }

    return { rounds };
  }

  function generateRoundRobin(participants, cycles = 1) {
    const list = [...participants];
    if (list.length % 2 !== 0)
      list.push({ username: "FREE ROUND", isBye: true });

    const roundsCount = list.length - 1;
    const matchesPerRound = list.length / 2;
    const allRounds = [];

    for (let c = 0; c < cycles; c++) {
      const cycleList = [...list];
      for (let j = 0; j < roundsCount; j++) {
        const matches = [];
        for (let i = 0; i < matchesPerRound; i++) {
          const p1 = cycleList[i];
          const p2 = cycleList[cycleList.length - 1 - i];

          let winner = null;
          if (p1.isBye) winner = "p2";
          else if (p2.isBye) winner = "p1";

          if (c % 2 === 1) {
            matches.push({
              p1: p2,
              p2: p1,
              winner: winner === "p1" ? "p2" : winner === "p2" ? "p1" : null,
            });
          } else {
            matches.push({ p1, p2, winner });
          }
        }
        allRounds.push({ matches, cycle: c + 1, roundInCycle: j + 1 });
        cycleList.splice(1, 0, cycleList.pop());
      }
    }

    return { rounds: allRounds };
  }

  async function deleteTournament() {
    if (!tournament) return;
    setShowConfirmDelete(true);
  }

  async function handleConfirmedDelete() {
    const { error } = await supabase
      .from("tournaments")
      .delete()
      .eq("id", tournament.id);

    if (error) {
      useToastStore.getState().error("Errore eliminazione: " + error.message);
    } else {
      setTournament(null);
      setStage("setup");
      navigate("/battle");
    }
  }

  async function handleCreate(config) {
    const name = config.name || `Torneo ${new Date().toLocaleDateString()}`;

    // All tournaments now start with registration_open: true
    // to allow deck selection, even if by invitation.
    const { data, error } = await supabase
      .from("tournaments")
      .insert({
        name: name,
        format: config.format,
        battle_type: config.starterBeysCount >= 3 ? "3v3" : "1v1",
        starter_beys_count: config.starterBeysCount || 1,
        reserve_beys_count: config.reserveBeysCount || 0,
        participants: config.participants || [],
        point_target: config.pointTarget || 4,
        win_condition: config.winCondition || "point_target",
        structure: {
          rounds: [],
          assignment_mode: config.assignmentMode,
          beyblade_mode: config.beybladeMode || "personali",
          settings: {
            rrCycles: config.rrCycles || 1,
            rrWinnerMode: config.rrWinnerMode || "points",
            playoffType: config.playoffType || null,
            winCondition: config.winCondition || "point_target",
          },
        },
        registration_open: true,
        registration_mode:
          config.registrationMode === "invitation" ? "manual" : "open",
        max_participants: config.maxParticipants,
        description: config.description,
        beyblade_mode: config.beybladeMode || "personali",
        assignment_mode: config.assignmentMode,
        created_by: user.id,
        status: "setup",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating tournament:", error);
      useToastStore.getState().error("Errore creazione: " + error.message);
      return;
    }

    // Reconstruct fields that might be missing if columns are not present in DB schema
    if (data) {
      const structure =
        typeof data.structure === "string"
          ? JSON.parse(data.structure)
          : data.structure;
      data.structure = structure || {};
      data.assignment_mode =
        data.assignment_mode || data.structure?.assignment_mode;
      data.beyblade_mode = data.beyblade_mode || data.structure?.beyblade_mode;
    }

    // If invitation mode, pre-register the invited users (not guests) as pending
    if (
      config.registrationMode === "invitation" &&
      config.participants?.length > 0
    ) {
      const userInvites = config.participants
        .filter((p) => p.user_id)
        .map((p) => ({
          tournament_id: data.id,
          user_id: p.user_id,
          status: "pending",
        }));

      if (userInvites.length > 0) {
        const { error: regError } = await supabase
          .from("tournament_registrations")
          .insert(userInvites);
        if (regError) {
          console.warn(
            "Pre-registrazione inviti fallita (RLS policy necessita aggiornamento):",
            regError.message,
          );
        }
      }
    }

    setTournament(data);
    setStage(data.beyblade_mode === "pool" ? "pool_setup" : "active");
    useToastStore.getState().success("Torneo creato con successo!");
  }

  async function handlePoolSetupComplete(poolCombos) {
    const updatedStructure = { ...tournament.structure, pool: poolCombos };
    const updatedTournament = { ...tournament, structure: updatedStructure };

    setTournament(updatedTournament);
    await updateTournamentDB(updatedTournament);
    setStage("active");
    useToastStore.getState().success("Pool confermata! Apertura iscrizioni.");
  }

  async function handleSelectMatch(rIndex, mIndex) {
    const match = tournament.structure.rounds[rIndex].matches[mIndex];
    if (!match.p1 || !match.p2 || match.winner) return;

    // Check if we already have a battle_id for this match
    let battleId = match.battle_id;

    if (!battleId) {
      // Create a new active battle for this tournament match
      const { data: battleData, error: battleError } = await supabase
        .from("battles")
        .insert({
          format: "tournament",
          is_official: true,
          tournament_id: tournament.id,
          player1_user_id: match.p1.user_id || null,
          player1_guest_name: match.p1.user_id ? null : match.p1.username,
          player2_user_id: match.p2.user_id || null,
          player2_guest_name: match.p2.user_id ? null : match.p2.username,
          p1_deck_config: match.p1.deck || [],
          p2_deck_config: match.p2.deck || [],
          battle_type: tournament.battle_type || "1v1",
          starter_beys_count: tournament.starter_beys_count || 1,
          reserve_beys_count: tournament.reserve_beys_count || 0,
          status: "active",
          point_target: tournament.point_target || 4,
          win_condition:
            tournament.win_condition ||
            tournament.structure?.settings?.winCondition ||
            "point_target",
          created_by: user.id,
        })
        .select()
        .single();

      if (battleError) {
        console.error("Battle creation error:", battleError);
        useToastStore
          .getState()
          .error("Errore creazione match: " + battleError.message);
        return;
      }

      battleId = battleData.id;

      // Update tournament structure with this battle_id
      const newStructure = JSON.parse(JSON.stringify(tournament.structure));
      newStructure.rounds[rIndex].matches[mIndex].battle_id = battleId;

      const updatedTournament = { ...tournament, structure: newStructure };
      setTournament(updatedTournament);
      await updateTournamentDB(updatedTournament);
    }

    // Navigate to the live match page
    navigate(`/battle/live/${battleId}`);
  }

  // Handle Advancement and Completion
  useEffect(() => {
    if (tournament?.status === "active" && tournament.structure?.rounds) {
      const structure = tournament.structure;
      const rounds = structure.rounds;
      let changed = false;
      const newRounds = JSON.parse(JSON.stringify(rounds));

      // 1. Bracket Advancement (applies to pure 'bracket' format OR 'round_robin' playoff rounds)
      for (let i = 0; i < newRounds.length - 1; i++) {
        const currentRound = newRounds[i];
        // If it's round_robin format, only advance matches within playoff rounds
        if (tournament.format === "round_robin" && !currentRound.isPlayoff)
          continue;

        const nextRound = newRounds[i + 1];
        if (
          tournament.format === "round_robin" &&
          (!nextRound || !nextRound.isPlayoff)
        )
          continue;
        if (!nextRound) continue;

        currentRound.matches.forEach((m, mIdx) => {
          if (m.winner && m.winner !== "draw") {
            const winnerObj = m.winner === "p1" ? m.p1 : m.p2;

            if (currentRound.title === "Play-In") {
              // In Play-In, Match 0 winner goes to Semi 0 P2, Match 1 winner goes to Semi 1 P2
              if (
                nextRound.matches[mIdx] &&
                (!nextRound.matches[mIdx].p2 ||
                  nextRound.matches[mIdx].p2.username !== winnerObj.username)
              ) {
                nextRound.matches[mIdx].p2 = winnerObj;
                changed = true;
              }
            } else {
              // Standard bracket advancement
              const nextMIdx = Math.floor(mIdx / 2);
              const isP1 = mIdx % 2 === 0;

              if (nextRound.matches[nextMIdx]) {
                if (
                  isP1 &&
                  (!nextRound.matches[nextMIdx].p1 ||
                    nextRound.matches[nextMIdx].p1.username !==
                      winnerObj.username)
                ) {
                  nextRound.matches[nextMIdx].p1 = winnerObj;
                  changed = true;
                } else if (
                  !isP1 &&
                  (!nextRound.matches[nextMIdx].p2 ||
                    nextRound.matches[nextMIdx].p2.username !==
                      winnerObj.username)
                ) {
                  nextRound.matches[nextMIdx].p2 = winnerObj;
                  changed = true;
                }
              }
            }
          }
        });
      }

      if (changed) {
        const updated = {
          ...tournament,
          structure: { ...structure, rounds: newRounds },
        };
        setTournament(updated);
        updateTournamentDB(updated);
      }

      // 2. Check for Tournament Completion
      const finalRound = newRounds[newRounds.length - 1];
      const isBracketOrPlayoffFinal =
        (tournament.format === "bracket" || finalRound?.isPlayoff) &&
        finalRound?.matches?.[0]?.winner;

      if (isBracketOrPlayoffFinal) {
        const winner =
          finalRound.matches[0].winner === "p1"
            ? finalRound.matches[0].p1
            : finalRound.matches[0].p2;
        const completed = {
          ...tournament,
          status: "completed",
          winner_user_id: winner.user_id,
          winner_guest_name: winner.guest_name || winner.username,
        };
        setTournament(completed);
        updateTournamentDB(completed);
      } else if (tournament.format === "round_robin") {
        const hasPlayoffs = newRounds.some((r) => r.isPlayoff);
        const allMatchesComplete = newRounds.every((r) =>
          r.matches.every((m) => m.winner || m.p1?.isBye || m.p2?.isBye),
        );

        // If it's a pure round robin (no playoffs) and all matches are done, OR if it's a round robin with playoffs and the final is done
        const isActuallyFinished =
          (!hasPlayoffs && allMatchesComplete) ||
          (hasPlayoffs && isBracketOrPlayoffFinal);

        if (isActuallyFinished && !isBracketOrPlayoffFinal) {
          const standings = calculateStandings({
            ...tournament,
            structure: { ...structure, rounds: newRounds },
          });
          const winner = standings[0];
          if (winner) {
            const completed = {
              ...tournament,
              status: "completed",
              winner_user_id: winner.user_id,
              winner_guest_name: winner.guest_name || winner.username,
            };
            setTournament(completed);
            updateTournamentDB(completed);
          }
        }
      }
    }
  }, [tournament?.structure?.rounds]);

  async function updateTournamentDB(t) {
    const { error } = await supabase
      .from("tournaments")
      .update({
        structure: t.structure,
        status: t.status,
        assignment_mode: t.assignment_mode || t.structure?.assignment_mode,
        beyblade_mode: t.beyblade_mode || t.structure?.beyblade_mode,
        winner_user_id: t.winner_user_id,
        winner_guest_name: t.winner_guest_name,
        completed_at:
          t.status === "completed" ? new Date().toISOString() : null,
      })
      .eq("id", t.id);

    if (error) {
      console.error("Error updating tournament:", error);
      useToastStore.getState().error("Errore salvataggio: " + error.message);
    }
  }

  const [registrations, setRegistrations] = useState([]);

  useEffect(() => {
    if (tournament?.registration_open && tournament?.status === "setup") {
      fetchRegistrations();
      const sub = supabase
        .channel("registrations")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "tournament_registrations",
            filter: `tournament_id=eq.${tournament.id}`,
          },
          fetchRegistrations,
        )
        .subscribe();
      return () => supabase.removeChannel(sub);
    }
  }, [tournament]);

  // Sync tournament data if it updates via realtime
  useEffect(() => {
    if (tournament) {
      // Nothing specific to sync now as matches are handled externally
    }
  }, [tournament]);

  async function fetchRegistrations() {
    const { data } = await supabase
      .from("tournament_registrations")
      .select("*, profiles(id, username, avatar_id, avatar_color, elo)")
      .eq("tournament_id", tournament.id);

    if (data) {
      setRegistrations(data);
      // Se il torneo è attivo, proviamo a riparare i nomi "Sconosciuto" nella struttura
      if (tournament.status === "active") {
        const profileMap = {};
        data.forEach((r) => {
          if (r.profiles) profileMap[r.user_id] = r.profiles.username;
        });
        cleanTournamentStructure(profileMap);
      }
    }
  }

  function cleanTournamentStructure(profileMap) {
    let changed = false;
    const newStructure = JSON.parse(JSON.stringify(tournament.structure));

    newStructure.rounds.forEach((r) => {
      r.matches.forEach((m) => {
        if (
          m.p1?.user_id &&
          (m.p1.username === "Sconosciuto" || !m.p1.username)
        ) {
          const realName = profileMap[m.p1.user_id];
          if (realName && realName !== "Sconosciuto") {
            m.p1.username = realName;
            changed = true;
          }
        }
        if (
          m.p2?.user_id &&
          (m.p2.username === "Sconosciuto" || !m.p2.username)
        ) {
          const realName = profileMap[m.p2.user_id];
          if (realName && realName !== "Sconosciuto") {
            m.p2.username = realName;
            changed = true;
          }
        }
      });
    });

    if (changed) {
      const updated = { ...tournament, structure: newStructure };
      setTournament(updated);
      updateTournamentDB(updated);
    }
  }

  useEffect(() => {
    if (tournament && tournament.status === "active") {
      // Fetch registrations even if active to sync names
      fetchRegistrations();
    }
  }, [tournament?.id, tournament?.status]);

  async function handleRegistrationStatus(regId, newStatus) {
    await supabase
      .from("tournament_registrations")
      .update({ status: newStatus })
      .eq("id", regId);
    fetchRegistrations();
  }

  async function startFromRegistrations() {
    // Collect approved users from registrations
    const approved = registrations
      .filter((r) => r.status === "approved")
      .map((r) => ({
        user_id: r.user_id,
        username: r.profiles?.username || "Sconosciuto",
        avatar_id: r.profiles?.avatar_id || null,
        elo: r.profiles?.elo !== undefined ? r.profiles.elo : 1000,
        seed: 0,
        deck: r.deck_config,
      }));

    // Add guests from the original participants list (they don't have registrations)
    const guests = (tournament.participants || [])
      .filter((p) => !p.user_id)
      .map((p) => ({
        ...p,
        elo: p.elo !== undefined ? p.elo : 1000,
        seed: 0,
        deck: null, // Creator will handle guest beys during match
      }));

    const finalParticipants = [...approved, ...guests];

    if (finalParticipants.length < 2) {
      useToastStore
        .getState()
        .error("Servono almeno 2 partecipanti confermati");
      return;
    }

    const beybladeMode =
      tournament.beyblade_mode || tournament.structure?.beyblade_mode;
    const assignmentMode =
      tournament.assignment_mode || tournament.structure?.assignment_mode;

    if (beybladeMode === "pool") {
      if (assignmentMode === "random" || assignmentMode === "draft") {
        const deckSize =
          (tournament.starter_beys_count ||
            (tournament.battle_type === "3v3" ? 3 : 1)) +
          (tournament.reserve_beys_count || 0);

        const order = [];
        if (assignmentMode === "draft") {
          // Ordinamento ELO crescente per il Draft a scelta esplicita
          // A parità di ELO, ordinamento casuale
          const sortedParticipants = [...finalParticipants]
            .map((p) => ({ ...p, _rand: Math.random() }))
            .sort((a, b) => {
              if (a.elo !== b.elo) return a.elo - b.elo;
              return a._rand - b._rand;
            });

          const forwardRound = sortedParticipants.map(
            (p) => p.id || p.user_id || p.username,
          );
          const reverseRound = [...forwardRound].reverse();

          for (let i = 0; i < deckSize; i++) {
            if (i % 2 === 0) {
              order.push(...forwardRound);
            } else {
              order.push(...reverseRound);
            }
          }
        } else {
          // Shuffle participants per assegnazione Random
          const shuffledParticipants = [...finalParticipants].sort(
            () => 0.5 - Math.random(),
          );
          for (let i = 0; i < deckSize; i++) {
            if (i % 2 === 0) {
              order.push(
                ...shuffledParticipants.map(
                  (p) => p.id || p.user_id || p.username,
                ),
              );
            } else {
              order.push(
                ...[...shuffledParticipants]
                  .reverse()
                  .map((p) => p.id || p.user_id || p.username),
              );
            }
          }
        }

        // Shuffle pool combos
        const shuffledCombos = [...(tournament.structure?.pool || [])].sort(
          () => 0.5 - Math.random(),
        );

        const availablePacks = shuffledCombos.map((combo, index) => ({
          id: `pack_${index}`,
          combo_id: combo.id,
          type: determineComboType(combo.user_stats, combo.combo_type),
          isOpened: false,
          owner: null,
        }));

        availablePacks.sort(() => 0.5 - Math.random());

        const updatedStructure = {
          ...tournament.structure,
          beyblade_mode: "pool",
          assignment_mode: assignmentMode,
          draft: {
            turnOrder: order,
            currentTurnIndex: 0,
            availablePacks,
            playerDecks: {},
            lastAction: null,
          },
        };

        const updated = {
          ...tournament,
          beyblade_mode: "pool",
          assignment_mode: assignmentMode,
          participants: finalParticipants,
          registration_open: false,
          status: "drafting",
          structure: updatedStructure,
        };

        setTournament(updated);
        await updateTournamentDB(updated);
        setStage("drafting");
        useToastStore.getState().success("Inizia il Draft!");
        return;
      } else if (assignmentMode === "asta") {
        const deckSize =
          (tournament.starter_beys_count ||
            (tournament.battle_type === "3v3" ? 3 : 1)) +
          (tournament.reserve_beys_count || 0);

        // Ordine di nomina: partendo da quello con meno ELO, crescente. A parità, random.
        const sortedParticipants = [...finalParticipants]
          .map((p) => ({ ...p, _rand: Math.random() }))
          .sort((a, b) => {
            if (a.elo !== b.elo) return a.elo - b.elo;
            return a._rand - b._rand;
          });

        const nominationOrder = sortedParticipants.map(
          (p) => p.id || p.user_id || p.username,
        );

        // Crediti: 50 per ogni bey da acquistare
        const initialCredits = deckSize * 50;
        const playerCredits = {};
        const playerDecks = {};
        finalParticipants.forEach((p) => {
          const pId = p.id || p.user_id || p.username;
          playerCredits[pId] = initialCredits;
          playerDecks[pId] = [];
        });

        // Shuffle pool combos per creare i pack
        const shuffledCombos = [...(tournament.structure?.pool || [])].sort(
          () => 0.5 - Math.random(),
        );
        const availablePacks = shuffledCombos.map((combo, index) => ({
          id: `pack_${index}`,
          combo_id: combo.id,
          type: determineComboType(combo.user_stats, combo.combo_type),
          isOpened: false,
          owner: null,
          price: 0,
        }));
        availablePacks.sort(() => 0.5 - Math.random());

        const updatedStructure = {
          ...tournament.structure,
          beyblade_mode: "pool",
          assignment_mode: "asta",
          auction: {
            turnOrder: nominationOrder,
            currentTurnIndex: 0,
            availablePacks,
            playerCredits,
            playerDecks,
            currentAuction: null,
            deckSize,
          },
        };

        const updated = {
          ...tournament,
          beyblade_mode: "pool",
          assignment_mode: "asta",
          participants: finalParticipants,
          registration_open: false,
          status: "drafting",
          structure: updatedStructure,
        };

        setTournament(updated);
        await updateTournamentDB(updated);
        setStage("auctioning");
        useToastStore.getState().success("Inizia l'Asta!");
        return;
      } else if (assignmentMode === "a_buste") {
        const deckSize =
          (tournament.starter_beys_count ||
            (tournament.battle_type === "3v3" ? 3 : 1)) +
          (tournament.reserve_beys_count || 0);

        const sortedParticipants = [...finalParticipants]
          .map((p) => ({ ...p, _rand: Math.random() }))
          .sort((a, b) => {
            if (a.elo !== b.elo) return a.elo - b.elo;
            return a._rand - b._rand;
          });

        const nominationOrder = sortedParticipants.map(
          (p) => p.id || p.user_id || p.username,
        );

        const initialCredits = deckSize * 50;
        const playerCredits = {};
        const playerDecks = {};
        finalParticipants.forEach((p) => {
          const pId = p.id || p.user_id || p.username;
          playerCredits[pId] = initialCredits;
          playerDecks[pId] = [];
        });

        const shuffledCombos = [...(tournament.structure?.pool || [])].sort(
          () => 0.5 - Math.random(),
        );
        const availablePacks = shuffledCombos.map((combo, index) => ({
          id: `pack_${index}`,
          combo_id: combo.id,
          type: determineComboType(combo.user_stats, combo.combo_type),
          isOpened: false,
          owner: null,
          price: 0,
        }));
        availablePacks.sort(() => 0.5 - Math.random());

        const updatedStructure = {
          ...tournament.structure,
          beyblade_mode: "pool",
          assignment_mode: "a_buste",
          sealed_bid: {
            turnOrder: nominationOrder,
            currentTurnIndex: 0,
            availablePacks,
            playerCredits,
            playerDecks,
            currentAuction: null,
            deckSize,
          },
        };

        const updated = {
          ...tournament,
          beyblade_mode: "pool",
          assignment_mode: "a_buste",
          participants: finalParticipants,
          registration_open: false,
          status: "drafting",
          structure: updatedStructure,
        };

        setTournament(updated);
        await updateTournamentDB(updated);
        setStage("sealed_bidding");
        useToastStore.getState().success("Inizia l'Asta a Buste Chiuse!");
        return;
      }
    }

    const structure =
      tournament.format === "bracket"
        ? generateBracket(finalParticipants)
        : generateRoundRobin(
            finalParticipants,
            tournament.structure.settings?.rrCycles || 1,
          );

    // Preserve settings in structure
    structure.settings = tournament.structure.settings;

    const updated = {
      ...tournament,
      participants: finalParticipants,
      structure,
      registration_open: false,
      status: "active",
    };

    setTournament(updated);
    updateTournamentDB(updated);
    useToastStore.getState().success("Torneo avviato!");
  }

  if (loadingTournament) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A1A]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  async function archiveCurrentAndNew() {
    // Rimuoviamo l'update a 'completed' per consentire tornei paralleli
    setTournament(null);
    setStage("setup");
  }

  return (
    <div className="min-h-screen pb-32 flex flex-col pt-6">
      {!isReadOnly && tournament && (
        <div className="px-6 flex items-center justify-between mb-4 shrink-0">
          <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">
            Torneo ID: <span className="text-white/40">{tournament.id}</span>
          </div>
          <button
            onClick={() => {
              const baseUrl =
                window.location.hostname.includes("localhost") ||
                window.location.hostname.includes("127.0.0.1")
                  ? "https://beyxapp.com"
                  : window.location.origin;
              const displayUrl = `${baseUrl}/battle/tournament/${tournament.id}/display`;
              if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(displayUrl);
              } else {
                // Fallback per test su rete locale (IP non-HTTPS)
                const textArea = document.createElement("textarea");
                textArea.value = displayUrl;
                textArea.style.position = "absolute";
                textArea.style.left = "-999999px";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                try {
                  document.execCommand("copy");
                } catch (err) {
                  console.error("Fallback copy failed", err);
                }
                document.body.removeChild(textArea);
              }
              useToastStore.getState().success("Link Display Copiato!");
            }}
            className="text-[9px] font-black text-primary uppercase tracking-widest hover:text-white transition-colors"
          >
            Copia Link Display
          </button>
        </div>
      )}
      <div className="px-6 flex-1">
        {stage === "setup" ? (
          <>
            {tournament && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-6 bg-primary/10 border border-primary/20 rounded-[32px] flex flex-col gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                    <Trophy size={20} />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-primary uppercase tracking-widest">
                      Torneo in corso
                    </div>
                    <div className="text-sm font-black text-white uppercase italic">
                      {tournament.name}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setStage("active")}
                    className="flex-1 py-3 bg-primary text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-glow-primary"
                  >
                    Riprendi
                  </button>
                  <button
                    onClick={archiveCurrentAndNew}
                    className="flex-1 py-3 bg-white/5 border border-white/10 text-white/60 font-black uppercase text-[10px] tracking-widest rounded-xl"
                  >
                    Nuovo
                  </button>
                </div>
              </motion.div>
            )}
            <TournamentSetup onConfirm={handleCreate} />
          </>
        ) : stage === "pool_setup" ? (
          <PoolSetup
            tournament={tournament}
            onComplete={handlePoolSetupComplete}
          />
        ) : stage === "drafting" ? (
          <PoolDraftPlayerView
            tournament={tournament}
            setTournament={setTournament}
            updateTournamentDB={updateTournamentDB}
            onDraftComplete={() =>
              generateRoundRobinOrBracket(tournament.participants)
            }
            onDelete={deleteTournament}
            parts={{ blades, ratchets, bits }}
          />
        ) : stage === "auctioning" ? (
          <PoolAstaPlayerView
            tournament={tournament}
            setTournament={setTournament}
            updateTournamentDB={updateTournamentDB}
            onAuctionComplete={() =>
              generateRoundRobinOrBracket(tournament.participants)
            }
            onDelete={deleteTournament}
            parts={{ blades, ratchets, bits }}
          />
        ) : stage === "sealed_bidding" ? (
          <PoolBustePlayerView
            tournament={tournament}
            setTournament={setTournament}
            updateTournamentDB={updateTournamentDB}
            onAuctionComplete={() =>
              generateRoundRobinOrBracket(tournament.participants)
            }
            onDelete={deleteTournament}
            parts={{ blades, ratchets, bits }}
          />
        ) : tournament?.status === "setup" && tournament?.registration_open ? (
          <div className="space-y-8">
            <div>
              <div className="text-[10px] font-black text-primary tracking-[0.2em] mb-2 uppercase">
                Iscrizioni Aperte
              </div>
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                {tournament.name}
              </h2>
              <p className="text-white/40 text-xs mt-2 font-medium">
                {tournament.description || "Nessuna descrizione."}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">
                  Blader
                </div>
                <div className="text-xl font-black text-white">
                  {registrations.filter((r) => r.status === "approved").length +
                    (tournament.participants?.filter((p) => !p.user_id)
                      .length || 0)}{" "}
                  / {tournament.max_participants}
                </div>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">
                  In Attesa
                </div>
                <div className="text-xl font-black text-primary">
                  {registrations.filter((r) => r.status === "pending").length}
                </div>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">
                  Target
                </div>
                <div className="text-xl font-black text-[#4361EE] uppercase">
                  {tournament.win_condition === "total_battle"
                    ? "TOTAL"
                    : tournament.point_target || 4}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[11px] font-black text-white tracking-widest uppercase">
                Partecipanti
              </h3>
              <div className="space-y-3">
                {/* Show Guests First as they are already confirmed */}
                {tournament.participants
                  ?.filter((p) => !p.user_id)
                  .map((guest, gi) => (
                    <div
                      key={`guest-${gi}`}
                      className="p-5 bg-[#12122A] rounded-3xl border border-white/5 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-white/20">
                          <Users size={16} />
                        </div>
                        <div className="text-sm font-black text-white uppercase italic">
                          {guest.username}{" "}
                          <span className="text-[8px] text-white/20 not-italic ml-1">
                            (OSPITE)
                          </span>
                        </div>
                      </div>
                      <div className="px-2 py-1 rounded bg-green-500/10 text-green-500 text-[8px] font-black uppercase">
                        Confermato
                      </div>
                    </div>
                  ))}
                {registrations.map((reg) => (
                  <div
                    key={reg.id}
                    className="p-5 bg-[#12122A] rounded-3xl border border-white/5 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar
                          avatarId={reg.profiles?.avatar_id || "avatar-1"}
                          avatarColor={reg.profiles?.avatar_color}
                          size={36}
                        />
                        <div className="text-sm font-black text-white uppercase italic">
                          {reg.profiles?.username ||
                            (reg.user_id ? "Caricamento..." : "Sconosciuto")}
                        </div>
                      </div>
                      <div
                        className={`px-2 py-1 rounded text-[8px] font-black uppercase ${reg.status === "approved" ? "bg-green-500/10 text-green-500" : reg.status === "rejected" ? "bg-red-500/10 text-red-500" : "bg-white/10 text-white/40"}`}
                      >
                        {reg.status}
                      </div>
                    </div>

                    {/* Deck Preview */}
                    <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                      <div className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-2">
                        Match Deck ({reg.deck_config?.beys?.length} Bey)
                      </div>
                      <div className="flex gap-2">
                        {reg.deck_config?.beys?.map((b, bi) => (
                          <div
                            key={bi}
                            className="flex-1 min-w-0 h-[76px] py-2 px-3 rounded-2xl bg-[#0A0A1A] border border-white/5 flex flex-col justify-center"
                          >
                            <div className="mb-1">
                              <div className="text-[7px] font-black text-primary uppercase mb-0.5">
                                Bey {bi + 1}
                              </div>
                              <div className="marquee-container">
                                <div className="text-[10px] font-black text-white uppercase italic animate-marquee">
                                  {b.blade_id
                                    ? getPartName("blade", b.blade_id)
                                    : "Vuoto"}
                                </div>
                              </div>
                            </div>
                            <div className="text-[8px] font-bold text-white/30 uppercase leading-tight line-clamp-1">
                              {b.blade_id
                                ? (() => {
                                    const blade = blades.find(
                                      (p) => p.id === b.blade_id,
                                    );
                                    if (b.is_stock)
                                      return `${blade?.stock_ratchet || ""} ${blade?.stock_bit || ""}`;
                                    return `${getPartName("ratchet", b.ratchet_id)} ${getPartName("bit", b.bit_id)}`;
                                  })()
                                : "-"}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {reg.status === "pending" && !isReadOnly && (
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleRegistrationStatus(reg.id, "approved")
                          }
                          className="flex-1 py-3 bg-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest"
                        >
                          Approva
                        </button>
                        <button
                          onClick={() =>
                            handleRegistrationStatus(reg.id, "rejected")
                          }
                          className="flex-1 py-3 bg-white/5 rounded-xl text-[10px] font-black text-white/40 uppercase tracking-widest"
                        >
                          Rifiuta
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {registrations.length === 0 &&
                  (tournament.participants?.filter((p) => !p.user_id).length ||
                    0) === 0 && (
                    <div className="py-12 text-center text-white/10 text-[10px] font-black uppercase tracking-widest border-2 border-dashed border-white/5 rounded-3xl">
                      Nessuna richiesta per ora
                    </div>
                  )}
              </div>
            </div>

            {!isReadOnly && (
              <>
                <button
                  onClick={startFromRegistrations}
                  disabled={
                    registrations.filter((r) => r.status === "approved")
                      .length +
                      (tournament.participants?.filter((p) => !p.user_id)
                        .length || 0) <
                    2
                  }
                  className="w-full py-5 bg-primary rounded-[22px] text-white font-black uppercase text-[11px] tracking-widest shadow-glow-primary disabled:opacity-20"
                >
                  Genera Tabellone e Inizia
                </button>

                <button
                  onClick={deleteTournament}
                  className="w-full py-4 text-white/20 hover:text-red-500/50 text-[9px] font-black uppercase tracking-[0.2em] transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 size={14} /> Elimina Torneo
                </button>
              </>
            )}
          </div>
        ) : tournament?.status === "completed" ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center px-4"
          >
            <div className="flex flex-col items-center justify-center pt-10 text-center mb-12">
              <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-6 shadow-glow-primary border-2 border-primary/40">
                <Trophy size={40} className="text-primary animate-pulse" />
              </div>
              <h1 className="text-4xl font-black text-white mb-2 font-createfuture tracking-tighter uppercase italic">
                Torneo Terminato
              </h1>
              <p className="text-white/40 text-xs font-createfuture tracking-[0.2em] uppercase">
                Classifica Finale e Podio
              </p>
            </div>

            {/* NICE PODIUM (Matches Projector Level of Detail) */}
            {(() => {
              const standings = calculateStandings(tournament);
              return (
                <div className="w-full max-w-2xl mb-16">
                  <div className="flex items-end justify-center gap-2 sm:gap-6 relative pb-2 min-h-[220px]">
                    {/* Glowing Background Sparkles */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                      <Sparkles
                        size={200}
                        className="text-[#F5A623] animate-pulse"
                      />
                    </div>

                    {/* 2nd Place */}
                    {standings[1] ? (
                      <div
                        className="flex flex-col items-center w-24 sm:w-32 animate-fade-in shrink-0"
                        style={{ animationDelay: "0.2s" }}
                      >
                        <Avatar
                          avatarId={standings[1].avatar_id || "avatar-2"}
                          username={standings[1].username}
                          size={48}
                        />
                        <span className="font-createfuture text-[10px] sm:text-xs font-black text-white italic uppercase tracking-[0.05em] mt-2 block truncate max-w-full px-2">
                          {standings[1].username}
                        </span>
                        <div className="w-full h-20 sm:h-28 bg-gradient-to-t from-white/5 to-[#94a3b8]/20 border-t-2 border-[#94a3b8] rounded-t-xl mt-2 flex flex-col items-center justify-start pt-2 relative shadow-[0_0_15px_rgba(148,163,184,0.2)]">
                          <span className="font-createfuture text-[10px] font-black text-[#94a3b8]">
                            2°
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-24 sm:w-32" />
                    )}

                    {/* 1st Place */}
                    {standings[0] ? (
                      <div className="flex flex-col items-center w-28 sm:w-40 animate-fade-in z-10 shrink-0">
                        <div className="text-[#F5A623] animate-bounce mb-1 text-xl">
                          👑
                        </div>
                        <Avatar
                          avatarId={standings[0].avatar_id || "avatar-1"}
                          username={standings[0].username}
                          size={64}
                        />
                        <span className="font-createfuture text-xs sm:text-sm font-black text-[#F5A623] italic uppercase tracking-[0.05em] mt-2 block truncate max-w-full px-2 drop-shadow-glow">
                          {standings[0].username}
                        </span>
                        <div className="w-full h-28 sm:h-40 bg-gradient-to-t from-white/5 to-[#F5A623]/25 border-t-2 border-[#F5A623] rounded-t-xl mt-2 flex flex-col items-center justify-start pt-2 relative shadow-[0_0_30px_rgba(245,166,35,0.3)]">
                          <span className="font-createfuture text-[10px] font-black text-[#F5A623]">
                            1° CAMPIONE
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-28 sm:w-40" />
                    )}

                    {/* 3rd Place */}
                    {standings[2] ? (
                      <div
                        className="flex flex-col items-center w-24 sm:w-32 animate-fade-in shrink-0"
                        style={{ animationDelay: "0.4s" }}
                      >
                        <Avatar
                          avatarId={standings[2].avatar_id || "avatar-3"}
                          username={standings[2].username}
                          size={48}
                        />
                        <span className="font-createfuture text-[10px] sm:text-xs font-black text-white italic uppercase tracking-[0.05em] mt-2 block truncate max-w-full px-2">
                          {standings[2].username}
                        </span>
                        <div className="w-full h-14 sm:h-20 bg-gradient-to-t from-white/5 to-[#d97706]/20 border-t-2 border-[#d97706] rounded-t-xl mt-2 flex flex-col items-center justify-start pt-2 relative shadow-[0_0_15px_rgba(217,119,6,0.1)]">
                          <span className="font-createfuture text-[10px] font-black text-[#d97706]">
                            3°
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-24 sm:w-32" />
                    )}
                  </div>
                </div>
              );
            })()}

            {/* DETAILED MATCH HISTORY (Matches Projector Level of Detail) */}
            <div className="w-full max-w-2xl bg-[#12122A]/60 border border-white/5 rounded-3xl p-6 mb-12">
              <div className="flex items-center gap-2 mb-6">
                <Swords size={16} className="text-primary" />
                <h2 className="text-xs font-black text-white uppercase tracking-widest font-createfuture">
                  Cronologia Match Dettagliata
                </h2>
              </div>

              <div className="space-y-4">
                {battles
                  .filter((b) => b.status === "completed")
                  .sort(
                    (a, b) =>
                      new Date(b.completed_at) - new Date(a.completed_at),
                  )
                  .map((battle) => {
                    const battleRounds = allRounds
                      .filter((r) => r.battle_id === battle.id)
                      .sort((a, b) => a.round_number - b.round_number);

                    const resolveBeyName = (round, player) => {
                      const prefix = player === 1 ? "p1" : "p2";
                      const comboId = round[`${prefix}_combo_id`];
                      const bladeId = round[`${prefix}_blade_id`];
                      const label = round[`${prefix}_combo_label`];

                      if (comboId) {
                        const combo = allCombos.find((c) => c.id === comboId);
                        if (combo) return combo.name;
                      }

                      if (bladeId) {
                        const blade = parts.blades.find(
                          (b) => b.id === bladeId,
                        );
                        if (blade) return blade.name;
                      }

                      if (label && label !== "BEY") return label;

                      if (tournament?.structure?.pool) {
                        const poolItem = tournament.structure.pool.find(
                          (item) =>
                            item.id === comboId || item.blade_id === bladeId,
                        );
                        if (poolItem)
                          return poolItem.name || poolItem.blade_name;
                      }

                      return null;
                    };

                    return (
                      <div
                        key={battle.id}
                        className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden"
                      >
                        <div className="px-4 py-3 bg-white/[0.02] flex items-center justify-between border-b border-white/5">
                          <span className="text-[10px] font-black text-white/60 uppercase font-createfuture">
                            {battle.player1_guest_name || "Player 1"} vs{" "}
                            {battle.player2_guest_name || "Player 2"}
                          </span>
                          <span className="text-[10px] font-black text-primary uppercase font-createfuture">
                            {battle.p1_score} - {battle.p2_score}
                          </span>
                        </div>
                        <div className="p-3 space-y-1">
                          {battleRounds
                            .map((r, idx) => {
                              const p1Bey = resolveBeyName(r, 1);
                              const p2Bey = resolveBeyName(r, 2);
                              const FINISH_TYPES = {
                                ko: "KO",
                                over: "Over Finish",
                                burst: "Burst Finish",
                                spin: "Spin Finish",
                                extreme: "Xtreme Finish",
                              };

                              if (!p1Bey && !p2Bey) return null;

                              return (
                                <div
                                  key={r.id}
                                  className="flex items-center justify-between text-[9px] font-medium uppercase tracking-tight py-1 border-b border-white/5 last:border-0"
                                >
                                  <div className="flex-1 text-left truncate pr-2">
                                    <span
                                      className={
                                        r.winner_id ===
                                          battle.player1_user_id ||
                                        (r.winner_id === null &&
                                          r.points_p1 > 0)
                                          ? "text-white font-black"
                                          : "text-white/30"
                                      }
                                    >
                                      {p1Bey || "BEY"}
                                    </span>
                                  </div>
                                  <div className="flex flex-col items-center gap-0.5 shrink-0 px-2 min-w-[80px]">
                                    <span className="text-primary font-black text-[8px] leading-none">
                                      {FINISH_TYPES[r.finish_type] || "Esito"}
                                    </span>
                                    <span className="text-white/20 text-[7px] font-bold">
                                      Round {idx + 1}
                                    </span>
                                  </div>
                                  <div className="flex-1 text-right truncate pl-2">
                                    <span
                                      className={
                                        r.winner_id ===
                                          battle.player2_user_id ||
                                        (r.winner_id === null &&
                                          r.points_p2 > 0)
                                          ? "text-white font-black"
                                          : "text-white/30"
                                      }
                                    >
                                      {p2Bey || "BEY"}
                                    </span>
                                  </div>
                                </div>
                              );
                            })
                            .filter(Boolean)}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="flex gap-4 mb-20 w-full max-w-2xl">
              <button
                onClick={() => navigate("/battle")}
                className="flex-1 py-5 bg-white/5 border border-white/10 rounded-2xl text-white font-black uppercase text-[11px] tracking-widest hover:bg-white/10 transition-all font-createfuture"
              >
                Torna ai Match
              </button>
              <button
                onClick={archiveCurrentAndNew}
                className="flex-1 py-5 bg-primary rounded-2xl text-white font-black uppercase text-[11px] tracking-widest hover:bg-primary-hover transition-all font-createfuture shadow-glow-primary"
              >
                Nuovo Torneo
              </button>
            </div>
          </motion.div>
        ) : (
          <>
            <div className="px-3 py-6 pb-32 overflow-y-auto no-scrollbar">
              <BracketView
                tournament={tournament}
                onSelectMatch={(rIndex, mIndex) => {
                  const match =
                    tournament.structure.rounds[rIndex].matches[mIndex];
                  if (isReadOnly && !match.battle_id) {
                    useToastStore
                      .getState()
                      .error("In attesa che l'organizzatore avvii il match!");
                    return;
                  }
                  handleSelectMatch(rIndex, mIndex);
                }}
              />
              {tournament.format === "round_robin" &&
                tournament.structure.settings?.rrWinnerMode === "playoff" &&
                !tournament.structure.rounds.some((r) => r.isPlayoff) &&
                tournament.structure.rounds.every((r) =>
                  r.matches.every(
                    (m) => m.winner || m.p1?.isBye || m.p2?.isBye,
                  ),
                ) && (
                  <div className="mt-8 px-6">
                    <button
                      onClick={startPlayoffs}
                      className="w-full py-5 bg-primary rounded-[22px] text-white font-black uppercase text-[11px] tracking-widest shadow-glow-primary"
                    >
                      Inizia Playoff
                    </button>
                  </div>
                )}
            </div>
            {/* Bottone Elimina Torneo (Anche se attivo) */}
            {!isReadOnly && (
              <div className="px-6 mt-12 mb-8">
                <button
                  onClick={deleteTournament}
                  className="w-full py-4 text-white/10 hover:text-red-500/30 text-[9px] font-black uppercase tracking-[0.2em] transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 size={14} /> Annulla ed Elimina Torneo
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={handleConfirmedDelete}
        title="Elimina Torneo"
        message="Questa azione eliminerà definitivamente il torneo e tutte le relative iscrizioni. Sei sicuro?"
        confirmLabel="Elimina"
      />
    </div>
  );
}
