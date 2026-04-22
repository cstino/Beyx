-- 📋 BeyManager X - Gamification & XP System
-- Basato sulle raccomandazioni di Claude

-- 1. Tabella Battaglie (se non esiste)
CREATE TABLE IF NOT EXISTS public.battles (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  player1_id uuid REFERENCES public.profiles(id) NOT NULL,
  player2_id uuid REFERENCES public.profiles(id) NOT NULL,
  winner_id uuid REFERENCES public.profiles(id) NOT NULL,
  victory_type text, -- Burst, KO, Spin, Xtreme
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.battles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view battles they participated in" ON public.battles 
  FOR SELECT USING (auth.uid() = player1_id OR auth.uid() = player2_id);
CREATE POLICY "Users can insert their own battles" ON public.battles 
  FOR INSERT WITH CHECK (auth.uid() = player1_id OR auth.uid() = player2_id);

-- 2. Funzione per il calcolo del livello (Dinamica)
-- Formula: Level N = sqrt(XP / 50) + 1
CREATE OR REPLACE FUNCTION public.xp_to_level(xp_amount INT)
RETURNS INT AS $$
BEGIN
  RETURN GREATEST(1, FLOOR(SQRT(xp_amount::FLOAT / 50))::INT + 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Trigger per XP delle Battaglie
CREATE OR REPLACE FUNCTION public.award_battle_xp()
RETURNS TRIGGER AS $$
DECLARE
  loser_id UUID;
BEGIN
  -- Identifica il perdente
  loser_id := CASE 
    WHEN NEW.player1_id = NEW.winner_id THEN NEW.player2_id 
    ELSE NEW.player1_id 
  END;

  -- Winner: 30 XP, Loser: 20 XP
  UPDATE public.profiles SET xp = xp + 30 WHERE id = NEW.winner_id;
  UPDATE public.profiles SET xp = xp + 20 WHERE id = loser_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_battle_xp ON public.battles;
CREATE TRIGGER trg_battle_xp 
  AFTER INSERT ON public.battles 
  FOR EACH ROW EXECUTE FUNCTION public.award_battle_xp();

-- 4. Trigger per XP della Collezione
CREATE OR REPLACE FUNCTION public.award_collection_xp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles SET xp = xp + 10 WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_collection_xp ON public.user_collections;
CREATE TRIGGER trg_collection_xp 
  AFTER INSERT ON public.user_collections 
  FOR EACH ROW EXECUTE FUNCTION public.award_collection_xp();

-- 5. Vista Leaderboard
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT 
  p.id,
  p.username,
  p.avatar_url,
  p.xp,
  public.xp_to_level(p.xp) AS level,
  COUNT(b.id) FILTER (WHERE b.winner_id = p.id) AS wins,
  COUNT(b.id) AS total_battles
FROM public.profiles p
LEFT JOIN public.battles b ON (b.player1_id = p.id OR b.player2_id = p.id)
GROUP BY p.id
ORDER BY p.xp DESC;

-- 6. RLS Avanzata per i Profili
-- Impedisce l'aggiornamento manuale della colonna XP da parte dell'utente
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile fields" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND 
    (CASE WHEN xp IS DISTINCT FROM profiles.xp THEN false ELSE true END)
    -- Aggiungi qui altre colonne protette se necessario
  );
