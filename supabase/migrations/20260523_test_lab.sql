-- Test Lab: sistema scontro test isolato per admin
-- Tabelle separate da battles per non contaminare le leaderboard pubbliche

-- 1. Tabella test_lab_matches
DROP TABLE IF EXISTS public.test_lab_matches CASCADE;
CREATE TABLE public.test_lab_matches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  blade1_name TEXT NOT NULL,
  blade1_image_url TEXT,
  blade2_name TEXT NOT NULL,
  blade2_image_url TEXT,
  winner_side TEXT, -- 'p1', 'p2', null = not completed
  rounds JSONB DEFAULT '[]'::JSONB,
  -- rounds: [{ winner_side: 'p1'|'p2', finish_type: 'burst'|'ko'|'spin_finish'|'xtreme', points_p1: int, points_p2: int }, ...]
  total_points_p1 INTEGER DEFAULT 0,
  total_points_p2 INTEGER DEFAULT 0,
  created_by TEXT
);

-- 2. Tabella test_lab_tournaments
DROP TABLE IF EXISTS public.test_lab_tournaments CASCADE;
CREATE TABLE public.test_lab_tournaments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  format TEXT NOT NULL, -- 'bracket' or 'round_robin'
  participants JSONB NOT NULL, -- [{ name, image_url, type }, ...]
  match_ids UUID[] DEFAULT '{}',
  status TEXT DEFAULT 'pending', -- 'pending', 'active', 'completed'
  winner_name TEXT,
  created_by TEXT,
  state_data JSONB DEFAULT '{}'::JSONB
);

-- 3. RLS: solo admin può scrivere, tutti possono leggere (per lo storico)
ALTER TABLE public.test_lab_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_lab_tournaments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can insert test matches" ON public.test_lab_matches;
CREATE POLICY "Admin can insert test matches" ON public.test_lab_matches
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin can update test matches" ON public.test_lab_matches;
CREATE POLICY "Admin can update test matches" ON public.test_lab_matches
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Anyone can read test matches" ON public.test_lab_matches;
CREATE POLICY "Anyone can read test matches" ON public.test_lab_matches
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin can insert test tournaments" ON public.test_lab_tournaments;
CREATE POLICY "Admin can insert test tournaments" ON public.test_lab_tournaments
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin can update test tournaments" ON public.test_lab_tournaments;
CREATE POLICY "Admin can update test tournaments" ON public.test_lab_tournaments
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Anyone can read test tournaments" ON public.test_lab_tournaments;
CREATE POLICY "Anyone can read test tournaments" ON public.test_lab_tournaments
  FOR SELECT USING (true);

-- 4. RPC: test_lab_leaderboard (specchio combo_points_leaderboard ma su test_lab_matches)
-- Punteggio: Xtreme = 2, KO/Burst/Spin = 1
CREATE OR REPLACE FUNCTION test_lab_leaderboard(p_min_battles INT DEFAULT 0)
RETURNS TABLE(
  combo_name TEXT,
  blade_image_url TEXT,
  blade_name TEXT,
  blade_type TEXT,
  wins BIGINT,
  losses BIGINT,
  draws BIGINT,
  total_rounds BIGINT,
  win_rate NUMERIC,
  points BIGINT,
  extreme_wins BIGINT,
  ko_wins BIGINT,
  burst_wins BIGINT,
  spin_wins BIGINT,
  extreme_losses BIGINT,
  ko_losses BIGINT,
  burst_losses BIGINT,
  spin_losses BIGINT
) AS $$
  WITH rounds_data AS (
    SELECT
      m.id AS match_id,
      m.blade1_name,
      m.blade1_image_url,
      m.blade2_name,
      m.blade2_image_url,
      r->>'winner_side' AS winner_side,
      r->>'finish_type' AS finish_type
    FROM test_lab_matches m
    CROSS JOIN jsonb_array_elements(m.rounds) AS r
    WHERE m.winner_side IS NOT NULL
  ),
  all_entries AS (
    SELECT
      blade1_name AS blade_name,
      blade1_image_url AS blade_image_url,
      CASE WHEN winner_side = 'p1' THEN 'win' WHEN winner_side = 'p2' THEN 'loss' END AS result,
      finish_type
    FROM rounds_data
    UNION ALL
    SELECT
      blade2_name AS blade_name,
      blade2_image_url AS blade_image_url,
      CASE WHEN winner_side = 'p2' THEN 'win' WHEN winner_side = 'p1' THEN 'loss' END AS result,
      finish_type
    FROM rounds_data
  ),
  stats AS (
    SELECT
      blade_name,
      MIN(blade_image_url) AS blade_image_url,
      COUNT(*) AS total_rounds,
      COUNT(*) FILTER (WHERE result = 'win') AS wins,
      COUNT(*) FILTER (WHERE result = 'loss') AS losses,
      0::BIGINT AS draws,
      COUNT(*) FILTER (WHERE result = 'win' AND finish_type = 'xtreme') AS extreme_wins,
      COUNT(*) FILTER (WHERE result = 'win' AND finish_type = 'ko') AS ko_wins,
      COUNT(*) FILTER (WHERE result = 'win' AND finish_type = 'burst') AS burst_wins,
      COUNT(*) FILTER (WHERE result = 'win' AND finish_type = 'spin_finish') AS spin_wins,
      COUNT(*) FILTER (WHERE result = 'loss' AND finish_type = 'xtreme') AS extreme_losses,
      COUNT(*) FILTER (WHERE result = 'loss' AND finish_type = 'ko') AS ko_losses,
      COUNT(*) FILTER (WHERE result = 'loss' AND finish_type = 'burst') AS burst_losses,
      COUNT(*) FILTER (WHERE result = 'loss' AND finish_type = 'spin_finish') AS spin_losses
    FROM all_entries
    WHERE result IS NOT NULL
    GROUP BY blade_name
  )
  SELECT
    s.blade_name AS combo_name,
    s.blade_image_url,
    bl.name AS blade_name,
    bl.type AS blade_type,
    s.wins, s.losses, s.draws, s.total_rounds,
    ROUND(s.wins * 100.0 / NULLIF(s.total_rounds, 0), 1) AS win_rate,
    (s.extreme_wins * 3 + s.ko_wins * 2 + s.burst_wins * 2 + s.spin_wins * 1
     - s.extreme_losses * 3 - s.ko_losses * 2 - s.burst_losses * 2 - s.spin_losses * 1) AS points,
    s.extreme_wins, s.ko_wins, s.burst_wins, s.spin_wins,
    s.extreme_losses, s.ko_losses, s.burst_losses, s.spin_losses
  FROM stats s
  LEFT JOIN blades bl ON bl.name = s.blade_name
  WHERE s.total_rounds >= p_min_battles
  ORDER BY points DESC;
$$ LANGUAGE SQL STABLE;

-- 5. RPC: test_lab_all_leaderboard (specchio all_combos_leaderboard)
CREATE OR REPLACE FUNCTION test_lab_all_leaderboard(p_min_battles INT DEFAULT 0)
RETURNS TABLE(
  combo_name TEXT,
  blade_image_url TEXT,
  blade_name TEXT,
  wins BIGINT,
  total_rounds BIGINT,
  win_rate NUMERIC,
  burst_count BIGINT,
  ko_count BIGINT,
  xtreme_count BIGINT,
  spin_finish_count BIGINT
) AS $$
  WITH rounds_data AS (
    SELECT
      m.id AS match_id,
      m.blade1_name,
      m.blade1_image_url,
      m.blade2_name,
      m.blade2_image_url,
      r->>'winner_side' AS winner_side,
      r->>'finish_type' AS finish_type
    FROM test_lab_matches m
    CROSS JOIN jsonb_array_elements(m.rounds) AS r
    WHERE m.winner_side IS NOT NULL
  ),
  entries_p1 AS (
    SELECT blade1_name AS blade_name, blade1_image_url AS blade_image_url,
           winner_side, finish_type,
           CASE WHEN winner_side = 'p1' THEN 'win' WHEN winner_side = 'p2' THEN 'loss' END AS result
    FROM rounds_data
    WHERE winner_side IN ('p1', 'p2')
  ),
  entries_p2 AS (
    SELECT blade2_name AS blade_name, blade2_image_url AS blade_image_url,
           winner_side, finish_type,
           CASE WHEN winner_side = 'p2' THEN 'win' WHEN winner_side = 'p1' THEN 'loss' END AS result
    FROM rounds_data
    WHERE winner_side IN ('p1', 'p2')
  ),
  all_entries AS (
    SELECT * FROM entries_p1 UNION ALL SELECT * FROM entries_p2
  ),
  stats AS (
    SELECT
      blade_name,
      MIN(blade_image_url) AS blade_image_url,
      COUNT(*) AS total_rounds,
      COUNT(*) FILTER (WHERE result = 'win') AS wins,
      COUNT(*) FILTER (WHERE finish_type = 'burst') AS burst_count,
      COUNT(*) FILTER (WHERE finish_type = 'ko') AS ko_count,
      COUNT(*) FILTER (WHERE finish_type = 'xtreme') AS xtreme_count,
      COUNT(*) FILTER (WHERE finish_type = 'spin_finish') AS spin_finish_count
    FROM all_entries
    GROUP BY blade_name
  )
  SELECT
    s.blade_name AS combo_name,
    COALESCE(s.blade_image_url, bl.image_url) AS blade_image_url,
    bl.name AS blade_name,
    COALESCE(s.wins, 0) AS wins,
    s.total_rounds,
    ROUND(COALESCE(s.wins, 0) * 100.0 / NULLIF(s.total_rounds, 0), 1) AS win_rate,
    COALESCE(s.burst_count, 0) AS burst_count,
    COALESCE(s.ko_count, 0) AS ko_count,
    COALESCE(s.xtreme_count, 0) AS xtreme_count,
    COALESCE(s.spin_finish_count, 0) AS spin_finish_count
  FROM stats s
  LEFT JOIN blades bl ON bl.name = s.blade_name
  WHERE s.total_rounds >= p_min_battles
  ORDER BY s.total_rounds DESC;
$$ LANGUAGE SQL STABLE;

-- 6. Aggiungi colonna active_variant_index anche a test_lab, se non esiste gia
-- (non necessario, gestito dal frontend che salva blade_image_url denormalizzato)
