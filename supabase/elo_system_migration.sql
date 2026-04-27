-- ────────────────────────────────────────────────────
-- BEYMANAGER X - ELO SYSTEM MIGRATION
-- April 2026
-- ────────────────────────────────────────────────────

-- 1. EXTEND PROFILES TABLE
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS elo INT NOT NULL DEFAULT 1000;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS elo_peak INT NOT NULL DEFAULT 1000;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS elo_matches INT NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS placement_done BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_elo ON profiles(elo DESC) WHERE elo_matches >= 5;

-- 2. EXTEND BATTLES & TOURNAMENTS
ALTER TABLE battles ADD COLUMN IF NOT EXISTS is_official BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS is_official BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_battles_official ON battles(is_official) WHERE is_official = true;
CREATE INDEX IF NOT EXISTS idx_tournaments_official ON tournaments(is_official) WHERE is_official = true;

-- 3. ELO HISTORY TABLE
CREATE TABLE IF NOT EXISTS user_elo_history (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  elo_before   INT NOT NULL,
  elo_after    INT NOT NULL,
  delta        INT NOT NULL,
  reason       TEXT NOT NULL CHECK (reason IN ('1v1', '3v3', 'tournament', 'placement', 'decay', 'admin')),
  battle_id    UUID REFERENCES battles(id) ON DELETE SET NULL,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE SET NULL,
  opponent_id  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  opponent_elo INT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_elo_history_user ON user_elo_history(user_id, created_at DESC);

-- 4. ELO CALCULATION FUNCTIONS
CREATE OR REPLACE FUNCTION get_k_factor(p_elo INT, p_matches INT)
RETURNS INT AS $$
BEGIN
  IF p_matches < 5 THEN
    RETURN 40;  -- Placement
  ELSIF p_elo >= 1700 THEN
    RETURN 12;  -- Diamond+
  ELSIF p_matches >= 30 THEN
    RETURN 16;  -- Veteran
  ELSE
    RETURN 24;  -- Normal
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Restituisce rank + divisione come JSON
CREATE OR REPLACE FUNCTION get_rank_from_elo(p_elo INT, p_placement_done BOOLEAN DEFAULT true)
RETURNS JSON AS $$
BEGIN
  -- Unranked durante placement
  IF p_placement_done IS NOT TRUE THEN
    RETURN json_build_object('rank', 'unranked', 'division', null, 'display', 'Unranked');
  END IF;

  RETURN CASE
    -- Grandmaster (no divisioni)
    WHEN p_elo >= 2200 THEN json_build_object('rank', 'grandmaster', 'division', null, 'display', 'Grandmaster')

    -- Champion
    WHEN p_elo >= 2133 THEN json_build_object('rank', 'champion', 'division', 1, 'display', 'Champion I')
    WHEN p_elo >= 2066 THEN json_build_object('rank', 'champion', 'division', 2, 'display', 'Champion II')
    WHEN p_elo >= 2000 THEN json_build_object('rank', 'champion', 'division', 3, 'display', 'Champion III')

    -- Diamond
    WHEN p_elo >= 1933 THEN json_build_object('rank', 'diamond', 'division', 1, 'display', 'Diamond I')
    WHEN p_elo >= 1866 THEN json_build_object('rank', 'diamond', 'division', 2, 'display', 'Diamond II')
    WHEN p_elo >= 1800 THEN json_build_object('rank', 'diamond', 'division', 3, 'display', 'Diamond III')

    -- Platinum
    WHEN p_elo >= 1733 THEN json_build_object('rank', 'platinum', 'division', 1, 'display', 'Platinum I')
    WHEN p_elo >= 1666 THEN json_build_object('rank', 'platinum', 'division', 2, 'display', 'Platinum II')
    WHEN p_elo >= 1600 THEN json_build_object('rank', 'platinum', 'division', 3, 'display', 'Platinum III')

    -- Gold
    WHEN p_elo >= 1533 THEN json_build_object('rank', 'gold', 'division', 1, 'display', 'Gold I')
    WHEN p_elo >= 1466 THEN json_build_object('rank', 'gold', 'division', 2, 'display', 'Gold II')
    WHEN p_elo >= 1400 THEN json_build_object('rank', 'gold', 'division', 3, 'display', 'Gold III')

    -- Silver
    WHEN p_elo >= 1333 THEN json_build_object('rank', 'silver', 'division', 1, 'display', 'Silver I')
    WHEN p_elo >= 1266 THEN json_build_object('rank', 'silver', 'division', 2, 'display', 'Silver II')
    WHEN p_elo >= 1200 THEN json_build_object('rank', 'silver', 'division', 3, 'display', 'Silver III')

    -- Bronze
    WHEN p_elo >= 1133 THEN json_build_object('rank', 'bronze', 'division', 1, 'display', 'Bronze I')
    WHEN p_elo >= 1066 THEN json_build_object('rank', 'bronze', 'division', 2, 'display', 'Bronze II')
    WHEN p_elo >= 1000 THEN json_build_object('rank', 'bronze', 'division', 3, 'display', 'Bronze III')

    -- Iron
    WHEN p_elo >= 666  THEN json_build_object('rank', 'iron', 'division', 1, 'display', 'Iron I')
    WHEN p_elo >= 333  THEN json_build_object('rank', 'iron', 'division', 2, 'display', 'Iron II')
    ELSE                    json_build_object('rank', 'iron', 'division', 3, 'display', 'Iron III')
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION calculate_elo_change(
  p_winner_elo INT,
  p_loser_elo  INT,
  p_winner_matches INT,
  p_loser_matches  INT,
  p_winner_score INT,
  p_loser_score  INT,
  p_battle_type TEXT
)
RETURNS TABLE(winner_delta INT, loser_delta INT) AS $$
DECLARE
  expected_winner FLOAT;
  expected_loser  FLOAT;
  k_winner        INT;
  k_loser         INT;
  margin_ratio    FLOAT;
  margin_mult     FLOAT;
  type_weight     FLOAT;
  raw_delta_w     FLOAT;
  raw_delta_l     FLOAT;
BEGIN
  expected_winner := 1.0 / (1.0 + power(10.0, (p_loser_elo - p_winner_elo) / 400.0));
  expected_loser  := 1.0 - expected_winner;

  k_winner := get_k_factor(p_winner_elo, p_winner_matches);
  k_loser  := get_k_factor(p_loser_elo, p_loser_matches);

  IF (p_winner_score + p_loser_score) > 0 THEN
    margin_ratio := p_winner_score::FLOAT / (p_winner_score + p_loser_score);
    margin_mult  := 1.0 + 0.15 * (margin_ratio - 0.5) * 2.0;
    margin_mult  := GREATEST(1.0, LEAST(1.15, margin_mult));
  ELSE
    margin_mult := 1.0;
  END IF;

  type_weight := CASE p_battle_type
    WHEN '1v1'        THEN 1.0
    WHEN '3v3'        THEN 1.5
    WHEN 'tournament' THEN 1.2
    ELSE 1.0
  END;

  raw_delta_w := k_winner * (1.0 - expected_winner) * margin_mult * type_weight;
  raw_delta_l := k_loser  * (0.0 - expected_loser)  * margin_mult * type_weight;

  RETURN QUERY SELECT
    ROUND(raw_delta_w)::INT AS winner_delta,
    ROUND(raw_delta_l)::INT AS loser_delta;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 5. ACHIEVEMENT CHECKER
CREATE OR REPLACE FUNCTION check_elo_achievements(p_user_id UUID, p_new_elo INT)
RETURNS VOID AS $$
BEGIN
  IF p_new_elo >= 1200 THEN
    INSERT INTO user_achievements (user_id, achievement_id) VALUES (p_user_id, 'elo_silver') ON CONFLICT DO NOTHING;
  END IF;
  IF p_new_elo >= 1400 THEN
    INSERT INTO user_achievements (user_id, achievement_id) VALUES (p_user_id, 'elo_gold') ON CONFLICT DO NOTHING;
  END IF;
  IF p_new_elo >= 1600 THEN
    INSERT INTO user_achievements (user_id, achievement_id) VALUES (p_user_id, 'elo_platinum') ON CONFLICT DO NOTHING;
  END IF;
  IF p_new_elo >= 1800 THEN
    INSERT INTO user_achievements (user_id, achievement_id) VALUES (p_user_id, 'elo_diamond') ON CONFLICT DO NOTHING;
  END IF;
  IF p_new_elo >= 2000 THEN
    INSERT INTO user_achievements (user_id, achievement_id) VALUES (p_user_id, 'elo_champion') ON CONFLICT DO NOTHING;
  END IF;
  IF p_new_elo >= 2200 THEN
    INSERT INTO user_achievements (user_id, achievement_id) VALUES (p_user_id, 'elo_grandmaster') ON CONFLICT DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. TRIGGER FUNCTIONS
CREATE OR REPLACE FUNCTION update_elo_on_battle()
RETURNS TRIGGER AS $$
DECLARE
  v_winner_id  UUID;
  v_loser_id   UUID;
  v_winner_elo INT;
  v_loser_elo  INT;
  v_winner_matches INT;
  v_loser_matches  INT;
  v_winner_score INT;
  v_loser_score  INT;
  v_delta_w INT;
  v_delta_l INT;
BEGIN
  IF NEW.is_official IS NOT TRUE THEN RETURN NEW; END IF;
  IF NEW.player1_user_id IS NULL OR NEW.player2_user_id IS NULL THEN RETURN NEW; END IF;
  IF NEW.winner_side IS NULL OR NEW.winner_side = 'draw' THEN RETURN NEW; END IF;

  IF NEW.winner_side = 'p1' THEN
    v_winner_id := NEW.player1_user_id;
    v_loser_id  := NEW.player2_user_id;
    v_winner_score := COALESCE(NEW.points_p1, 0);
    v_loser_score  := COALESCE(NEW.points_p2, 0);
  ELSE
    v_winner_id := NEW.player2_user_id;
    v_loser_id  := NEW.player1_user_id;
    v_winner_score := COALESCE(NEW.points_p2, 0);
    v_loser_score  := COALESCE(NEW.points_p1, 0);
  END IF;

  SELECT elo, elo_matches INTO v_winner_elo, v_winner_matches FROM profiles WHERE id = v_winner_id;
  SELECT elo, elo_matches INTO v_loser_elo, v_loser_matches FROM profiles WHERE id = v_loser_id;

  SELECT * INTO v_delta_w, v_delta_l FROM calculate_elo_change(v_winner_elo, v_loser_elo, v_winner_matches, v_loser_matches, v_winner_score, v_loser_score, NEW.format);

  UPDATE profiles SET elo = elo + v_delta_w, elo_peak = GREATEST(elo_peak, elo + v_delta_w), elo_matches = elo_matches + 1, placement_done = (elo_matches + 1 >= 5) WHERE id = v_winner_id;
  UPDATE profiles SET elo = GREATEST(0, elo + v_delta_l), elo_matches = elo_matches + 1, placement_done = (elo_matches + 1 >= 5) WHERE id = v_loser_id;

  INSERT INTO user_elo_history (user_id, elo_before, elo_after, delta, reason, battle_id, opponent_id, opponent_elo)
    VALUES (v_winner_id, v_winner_elo, v_winner_elo + v_delta_w, v_delta_w, CASE NEW.format WHEN 'tournament' THEN 'tournament' ELSE NEW.format END, NEW.id, v_loser_id, v_loser_elo);

  INSERT INTO user_elo_history (user_id, elo_before, elo_after, delta, reason, battle_id, opponent_id, opponent_elo)
    VALUES (v_loser_id, v_loser_elo, GREATEST(0, v_loser_elo + v_delta_l), v_delta_l, CASE NEW.format WHEN 'tournament' THEN 'tournament' ELSE NEW.format END, NEW.id, v_winner_id, v_winner_elo);

  PERFORM check_elo_achievements(v_winner_id, v_winner_elo + v_delta_w);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. APPLY TRIGGERS
DROP TRIGGER IF EXISTS trg_elo_on_battle ON battles;
CREATE TRIGGER trg_elo_on_battle AFTER INSERT ON battles FOR EACH ROW EXECUTE FUNCTION update_elo_on_battle();

-- 8. ACHIEVEMENTS SEED
INSERT INTO achievements (id, name, description, icon, color, category, threshold, sort_order) VALUES
  ('elo_first_win',   'Primo Sangue Ufficiale', 'Vinci la prima partita ufficiale',          'Swords',     '#E94560', 'battle', 1,    180),
  ('elo_silver',      'Promosso',                'Raggiungi rank Silver',                     'Award',      '#94A3B8', 'battle', 1200, 181),
  ('elo_gold',        'Mira d''Oro',             'Raggiungi rank Gold',                       'Award',      '#F59E0B', 'battle', 1400, 182),
  ('elo_platinum',    'Elite',                   'Raggiungi rank Platinum',                   'Star',       '#06B6D4', 'battle', 1600, 183),
  ('elo_diamond',     'Diamante',                'Raggiungi rank Diamond',                    'Gem',        '#3B82F6', 'battle', 1800, 184),
  ('elo_champion',    'Campione',                'Raggiungi rank Champion',                   'Trophy',     '#A855F7', 'battle', 2000, 185),
  ('elo_grandmaster', 'Gran Maestro',            'Raggiungi rank Grandmaster',                'Crown',      '#E94560', 'battle', 2200, 186),
  ('elo_streak_5',    'Imbattibile',             'Vinci 5 partite ufficiali consecutive',     'Flame',      '#F5A623', 'battle', 5,    187)
ON CONFLICT (id) DO NOTHING;

-- 9. ACADEMY LESSON UPDATE
UPDATE academy_lessons
SET content = '[
  {"type":"paragraph","text":"BeyManager X usa un sistema di ranking **ELO** ispirato agli scacchi per misurare le tue performance competitive. Capire come funziona ti aiuta a fare scelte strategiche."},
  {"type":"heading","level":2,"text":"Iniziare: Unranked + Placement"},
  {"type":"paragraph","text":"Quando inizi, sei **Unranked** — il tuo rank non è ancora stato determinato. Devi completare **5 placement match** ufficiali per sbloccare il tuo primo rank. Durante il placement, le variazioni ELO sono più ampie (K-factor 40) per stabilizzare il tuo livello rapidamente."},
  {"type":"heading","level":2,"text":"Le basi"},
  {"type":"list","items":[
    "**ELO iniziale**: 1000",
    "**Placement**: 5 match ufficiali per sbloccare il rank",
    "**Vittoria**: ELO sale, di più se l''avversario aveva ELO più alto",
    "**Sconfitta**: ELO scende, di meno se l''avversario aveva ELO più alto"
  ]},
  {"type":"heading","level":2,"text":"I Rank e le Divisioni"},
  {"type":"paragraph","text":"Ogni rank ha **3 divisioni**: III (il più basso) → II → I (il più alto). Si sale da III a I, poi si passa al rank successivo. Stile League of Legends."},
  {"type":"list","items":[
    "**Iron III → I**: < 1000 ELO",
    "**Bronze III → I**: 1000-1199",
    "**Silver III → I**: 1200-1399",
    "**Gold III → I**: 1400-1599",
    "**Platinum III → I**: 1600-1799",
    "**Diamond III → I**: 1800-1999",
    "**Champion III → I**: 2000-2199",
    "**Grandmaster**: 2200+ (senza divisioni)"
  ]},
  {"type":"heading","level":2,"text":"Ufficiale vs Amichevole"},
  {"type":"paragraph","text":"Quando crei una battaglia, scegli se è **ufficiale** (conta per ELO) o **amichevole** (solo statistiche). Le partite con ospiti non registrati sono sempre amichevoli."},
  {"type":"heading","level":2,"text":"Cosa influenza il guadagno ELO"},
  {"type":"list","items":[
    "**Differenza ELO con l''avversario**: battere uno più forte vale di più",
    "**Margine di punteggio**: 4-0 vale fino al 15% in più di 4-3",
    "**Tipo di battaglia**: 3v3 vale 1.5x rispetto a 1v1",
    "**Tornei**: ogni partita conta 1.2x, più bonus per piazzamento finale (1° = +50, 2° = +30, 3°-4° = +15)"
  ]},
  {"type":"tip","variant":"info","text":"L''ELO peak (massimo storico raggiunto) è permanente. Anche se scendi di rank, manterrai sempre la traccia del tuo punto più alto."}
]'
WHERE id = 'elo-system';
