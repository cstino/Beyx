-- Variante cromatica attiva per le blade
-- Aggiunge active_variant_index alla tabella blades e aggiorna gli RPC per usare l'immagine variante

-- 1. Aggiungi la colonna active_variant_index
ALTER TABLE public.blades ADD COLUMN IF NOT EXISTS active_variant_index INTEGER DEFAULT NULL;

-- 2. Aggiorna is_admin() per includere entrambi gli account admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    (auth.jwt() ->> 'email' IN ('hcskso96@gmail.com', 'cr.96bc@gmail.com')) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Aggiorna auth_trigger per gestire l'account admin cr.96bc@gmail.com
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IN ('hcskso96@gmail.com', 'cr.96bc@gmail.com') THEN
    INSERT INTO public.profiles (id, username, avatar_id, xp, level, title, onboarding_done, is_admin)
    VALUES (NEW.id, 'Arbitro Official', 'avatar-1', 0, 99, 'Arbitro Ufficiale', true, true);
    RETURN NEW;
  END IF;

  INSERT INTO public.profiles (id, username, avatar_id, xp, level, title, onboarding_done)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_id', 'avatar-1'),
    0,
    1,
    'Blader Novizio',
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Aggiorna combo_points_leaderboard per usare la variante attiva
DROP FUNCTION IF EXISTS combo_points_leaderboard(integer, text);
CREATE OR REPLACE FUNCTION combo_points_leaderboard(
  p_min_battles INT DEFAULT 5,
  p_blade_type TEXT DEFAULT NULL
)
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
  WITH all_rounds AS (
    SELECT
      r.p1_combo_label, r.p2_combo_label,
      r.p1_blade_id, r.p2_blade_id,
      r.winner_side,
      r.finish_type
    FROM rounds r
    JOIN battles b ON b.id = r.battle_id
    WHERE r.winner_side IS NOT NULL
  ),
  all_entries AS (
    SELECT p1_combo_label AS combo_label, p1_blade_id AS blade_id,
           CASE WHEN winner_side = 'p1' THEN 'win' WHEN winner_side = 'p2' THEN 'loss' WHEN winner_side = 'draw' THEN 'draw' END AS result,
           finish_type
    FROM all_rounds WHERE p1_combo_label IS NOT NULL
    UNION ALL
    SELECT p2_combo_label AS combo_label, p2_blade_id AS blade_id,
           CASE WHEN winner_side = 'p2' THEN 'win' WHEN winner_side = 'p1' THEN 'loss' WHEN winner_side = 'draw' THEN 'draw' END AS result,
           finish_type
    FROM all_rounds WHERE p2_combo_label IS NOT NULL
  ),
  stats AS (
    SELECT
      combo_label, blade_id,
      COUNT(*) AS total_rounds,
      COUNT(*) FILTER (WHERE result = 'win') AS wins,
      COUNT(*) FILTER (WHERE result = 'loss') AS losses,
      COUNT(*) FILTER (WHERE result = 'draw') AS draws,
      COUNT(*) FILTER (WHERE result = 'win' AND finish_type = 'xtreme') AS extreme_wins,
      COUNT(*) FILTER (WHERE result = 'win' AND finish_type = 'ko') AS ko_wins,
      COUNT(*) FILTER (WHERE result = 'win' AND finish_type = 'burst') AS burst_wins,
      COUNT(*) FILTER (WHERE result = 'win' AND finish_type IN ('spin_finish', 'spin')) AS spin_wins,
      COUNT(*) FILTER (WHERE result = 'loss' AND finish_type = 'xtreme') AS extreme_losses,
      COUNT(*) FILTER (WHERE result = 'loss' AND finish_type = 'ko') AS ko_losses,
      COUNT(*) FILTER (WHERE result = 'loss' AND finish_type = 'burst') AS burst_losses,
      COUNT(*) FILTER (WHERE result = 'loss' AND finish_type IN ('spin_finish', 'spin')) AS spin_losses
    FROM all_entries
    WHERE result IS NOT NULL
    GROUP BY combo_label, blade_id
  )
  SELECT
    s.combo_label AS combo_name,
    COALESCE(
      CASE
        WHEN bl.active_variant_index IS NOT NULL
             AND bl.variants IS NOT NULL
             AND jsonb_array_length(bl.variants) > bl.active_variant_index
        THEN bl.variants -> bl.active_variant_index ->> 'image_url'
      END,
      bl.image_url
    ) AS blade_image_url,
    bl.name AS blade_name,
    bl.type AS blade_type,
    s.wins, s.losses, s.draws, s.total_rounds,
    ROUND(s.wins * 100.0 / NULLIF(s.total_rounds, 0), 1) AS win_rate,
    (s.extreme_wins * 3 + s.ko_wins * 2 + s.burst_wins * 2 + s.spin_wins * 1
     - s.extreme_losses * 3 - s.ko_losses * 2 - s.burst_losses * 2 - s.spin_losses * 1) AS points,
    s.extreme_wins, s.ko_wins, s.burst_wins, s.spin_wins,
    s.extreme_losses, s.ko_losses, s.burst_losses, s.spin_losses
  FROM stats s
  LEFT JOIN blades bl ON bl.id = s.blade_id
  WHERE s.total_rounds >= p_min_battles
    AND (p_blade_type IS NULL OR LOWER(bl.type) = LOWER(p_blade_type))
  ORDER BY points DESC;
$$ LANGUAGE SQL STABLE;

-- 5. Aggiorna all_combos_leaderboard per usare la variante attiva
DROP FUNCTION IF EXISTS all_combos_leaderboard(integer);
CREATE OR REPLACE FUNCTION all_combos_leaderboard(
  p_min_battles INT DEFAULT 5
)
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
  WITH all_rounds AS (
    SELECT
      r.p1_combo_label, r.p2_combo_label,
      r.p1_blade_id, r.p2_blade_id,
      r.winner_side,
      r.finish_type
    FROM rounds r
    JOIN battles b ON b.id = r.battle_id
    WHERE r.winner_side IS NOT NULL
  ),
  combo_entries AS (
    SELECT
      CASE WHEN winner_side = 'p1' THEN p1_combo_label ELSE p2_combo_label END AS combo_label,
      CASE WHEN winner_side = 'p1' THEN p1_blade_id ELSE p2_blade_id END AS blade_id,
      finish_type,
      winner_side
    FROM all_rounds
    WHERE winner_side IN ('p1', 'p2')
  ),
  all_combo_entries AS (
    SELECT p1_combo_label AS combo_label, p1_blade_id AS blade_id FROM all_rounds WHERE p1_combo_label IS NOT NULL
    UNION ALL
    SELECT p2_combo_label AS combo_label, p2_blade_id AS blade_id FROM all_rounds WHERE p2_combo_label IS NOT NULL
  ),
  combo_totals AS (
    SELECT combo_label, blade_id, COUNT(*) AS total_rounds
    FROM all_combo_entries
    GROUP BY combo_label, blade_id
  ),
  combo_wins AS (
    SELECT combo_label, blade_id, COUNT(*) AS wins
    FROM combo_entries
    GROUP BY combo_label, blade_id
  ),
  combo_finishes AS (
    SELECT combo_label, blade_id,
      COUNT(*) FILTER (WHERE finish_type = 'burst') AS burst_count,
      COUNT(*) FILTER (WHERE finish_type = 'ko') AS ko_count,
      COUNT(*) FILTER (WHERE finish_type = 'xtreme') AS xtreme_count,
      COUNT(*) FILTER (WHERE finish_type IN ('spin_finish', 'spin')) AS spin_finish_count
    FROM combo_entries
    GROUP BY combo_label, blade_id
  )
  SELECT
    t.combo_label AS combo_name,
    COALESCE(
      CASE
        WHEN bl.active_variant_index IS NOT NULL
             AND bl.variants IS NOT NULL
             AND jsonb_array_length(bl.variants) > bl.active_variant_index
        THEN bl.variants -> bl.active_variant_index ->> 'image_url'
      END,
      bl.image_url
    ) AS blade_image_url,
    bl.name AS blade_name,
    COALESCE(w.wins, 0) AS wins,
    t.total_rounds,
    ROUND(COALESCE(w.wins, 0) * 100.0 / NULLIF(t.total_rounds, 0), 1) AS win_rate,
    COALESCE(f.burst_count, 0) AS burst_count,
    COALESCE(f.ko_count, 0) AS ko_count,
    COALESCE(f.xtreme_count, 0) AS xtreme_count,
    COALESCE(f.spin_finish_count, 0) AS spin_finish_count
  FROM combo_totals t
  LEFT JOIN combo_wins w ON w.combo_label = t.combo_label AND COALESCE(w.blade_id, '00000000-0000-0000-0000-000000000000') = COALESCE(t.blade_id, '00000000-0000-0000-0000-000000000000')
  LEFT JOIN combo_finishes f ON f.combo_label = t.combo_label AND COALESCE(f.blade_id, '00000000-0000-0000-0000-000000000000') = COALESCE(t.blade_id, '00000000-0000-0000-0000-000000000000')
  LEFT JOIN blades bl ON bl.id = t.blade_id
  WHERE t.total_rounds >= p_min_battles
  ORDER BY t.total_rounds DESC;
$$ LANGUAGE SQL STABLE;
