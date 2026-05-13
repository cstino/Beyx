-- ────────────────────────────────────────────────────
-- BEYMANAGER X - FIX PAREGGI E BACKFILL TORNEI/MATCH PRE-CREATI
-- Maggio 2026
-- ────────────────────────────────────────────────────

-- 1. AGGIORNAMENTO FUNZIONE TRIGGER PER INSERT E UPDATE
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
  v_p1_elo INT;
  v_p2_elo INT;
BEGIN
  IF NEW.is_official IS NOT TRUE THEN RETURN NEW; END IF;
  IF NEW.player1_user_id IS NULL OR NEW.player2_user_id IS NULL THEN RETURN NEW; END IF;
  IF NEW.winner_side IS NULL THEN RETURN NEW; END IF;

  -- Evita ricalcoli doppi se un match già concluso viene modificato (es. note)
  IF TG_OP = 'UPDATE' THEN
    IF OLD.winner_side IS NOT NULL THEN
      RETURN NEW;
    END IF;
  END IF;

  -- GESTIONE PAREGGIO (DRAW)
  IF NEW.winner_side = 'draw' THEN
    UPDATE profiles 
    SET elo_matches = elo_matches + 1, 
        placement_done = (elo_matches + 1 >= 5) 
    WHERE id IN (NEW.player1_user_id, NEW.player2_user_id);

    SELECT elo INTO v_p1_elo FROM profiles WHERE id = NEW.player1_user_id;
    SELECT elo INTO v_p2_elo FROM profiles WHERE id = NEW.player2_user_id;

    INSERT INTO user_elo_history (user_id, elo_before, elo_after, delta, reason, battle_id, opponent_id, opponent_elo)
    VALUES 
      (NEW.player1_user_id, v_p1_elo, v_p1_elo, 0, CASE NEW.format WHEN 'tournament' THEN 'tournament' ELSE NEW.format END, NEW.id, NEW.player2_user_id, v_p2_elo),
      (NEW.player2_user_id, v_p2_elo, v_p2_elo, 0, CASE NEW.format WHEN 'tournament' THEN 'tournament' ELSE NEW.format END, NEW.id, NEW.player1_user_id, v_p1_elo);

    RETURN NEW;
  END IF;

  -- GESTIONE VITTORIA / SCONFITTA NORMALE
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

-- 2. APPLICAZIONE TRIGGER ANCHE SU UPDATE
DROP TRIGGER IF EXISTS trg_elo_on_battle ON battles;
CREATE TRIGGER trg_elo_on_battle 
AFTER INSERT OR UPDATE ON battles 
FOR EACH ROW EXECUTE FUNCTION update_elo_on_battle();

-- 3. RICALCOLO RETROATTIVO DEI MATCH DISPUTATI PER TUTTI I PROFILI
UPDATE profiles p
SET elo_matches = (
  SELECT count(*)
  FROM battles b
  WHERE b.is_official = true
    AND (b.player1_user_id = p.id OR b.player2_user_id = p.id)
    AND b.winner_side IS NOT NULL
),
placement_done = (
  SELECT count(*)
  FROM battles b
  WHERE b.is_official = true
    AND (b.player1_user_id = p.id OR b.player2_user_id = p.id)
    AND b.winner_side IS NOT NULL
) >= 5;

-- 4. BACKFILL STORICO DEI MATCH ELO MANCANTI
-- Genera i delta e la history per i match di tornei o pre-creati passati che non avevano attivato il trigger.
DO $$
DECLARE
  b RECORD;
  v_winner_elo INT;
  v_loser_elo INT;
  v_winner_matches INT;
  v_loser_matches INT;
  v_winner_score INT;
  v_loser_score INT;
  v_delta_w INT;
  v_delta_l INT;
  v_p1_elo INT;
  v_p2_elo INT;
BEGIN
  FOR b IN 
    SELECT * FROM battles 
    WHERE is_official = true 
      AND winner_side IS NOT NULL 
      AND id NOT IN (SELECT DISTINCT battle_id FROM user_elo_history WHERE battle_id IS NOT NULL)
    ORDER BY played_at ASC
  LOOP
    IF b.player1_user_id IS NOT NULL AND b.player2_user_id IS NOT NULL THEN
      SELECT elo, elo_matches INTO v_p1_elo, v_winner_matches FROM profiles WHERE id = b.player1_user_id;
      SELECT elo, elo_matches INTO v_p2_elo, v_loser_matches FROM profiles WHERE id = b.player2_user_id;

      IF b.winner_side = 'draw' THEN
        INSERT INTO user_elo_history (user_id, elo_before, elo_after, delta, reason, battle_id, opponent_id, opponent_elo, created_at)
        VALUES 
          (b.player1_user_id, v_p1_elo, v_p1_elo, 0, CASE b.format WHEN 'tournament' THEN 'tournament' ELSE b.format END, b.id, b.player2_user_id, v_p2_elo, b.played_at),
          (b.player2_user_id, v_p2_elo, v_p2_elo, 0, CASE b.format WHEN 'tournament' THEN 'tournament' ELSE b.format END, b.id, b.player1_user_id, v_p1_elo, b.played_at);
      ELSE
        IF b.winner_side = 'p1' THEN
          v_winner_score := COALESCE(b.points_p1, 0);
          v_loser_score  := COALESCE(b.points_p2, 0);
          SELECT winner_delta, loser_delta INTO v_delta_w, v_delta_l FROM calculate_elo_change(v_p1_elo, v_p2_elo, v_winner_matches, v_loser_matches, v_winner_score, v_loser_score, b.format);
          
          INSERT INTO user_elo_history (user_id, elo_before, elo_after, delta, reason, battle_id, opponent_id, opponent_elo, created_at)
          VALUES 
            (b.player1_user_id, v_p1_elo, v_p1_elo + v_delta_w, v_delta_w, CASE b.format WHEN 'tournament' THEN 'tournament' ELSE b.format END, b.id, b.player2_user_id, v_p2_elo, b.played_at),
            (b.player2_user_id, v_p2_elo, GREATEST(0, v_p2_elo + v_delta_l), v_delta_l, CASE b.format WHEN 'tournament' THEN 'tournament' ELSE b.format END, b.id, b.player1_user_id, v_p1_elo, b.played_at);

          UPDATE profiles SET elo = elo + v_delta_w, elo_peak = GREATEST(elo_peak, elo + v_delta_w) WHERE id = b.player1_user_id;
          UPDATE profiles SET elo = GREATEST(0, elo + v_delta_l) WHERE id = b.player2_user_id;
        ELSE
          v_winner_score := COALESCE(b.points_p2, 0);
          v_loser_score  := COALESCE(b.points_p1, 0);
          SELECT winner_delta, loser_delta INTO v_delta_w, v_delta_l FROM calculate_elo_change(v_p2_elo, v_p1_elo, v_loser_matches, v_winner_matches, v_winner_score, v_loser_score, b.format);
          
          INSERT INTO user_elo_history (user_id, elo_before, elo_after, delta, reason, battle_id, opponent_id, opponent_elo, created_at)
          VALUES 
            (b.player2_user_id, v_p2_elo, v_p2_elo + v_delta_w, v_delta_w, CASE b.format WHEN 'tournament' THEN 'tournament' ELSE b.format END, b.id, b.player1_user_id, v_p1_elo, b.played_at),
            (b.player1_user_id, v_p1_elo, GREATEST(0, v_p1_elo + v_delta_l), v_delta_l, CASE b.format WHEN 'tournament' THEN 'tournament' ELSE b.format END, b.id, b.player2_user_id, v_p2_elo, b.played_at);

          UPDATE profiles SET elo = elo + v_delta_w, elo_peak = GREATEST(elo_peak, elo + v_delta_w) WHERE id = b.player2_user_id;
          UPDATE profiles SET elo = GREATEST(0, elo + v_delta_l) WHERE id = b.player1_user_id;
        END IF;
      END IF;
    END IF;
  END LOOP;
END;
$$;
