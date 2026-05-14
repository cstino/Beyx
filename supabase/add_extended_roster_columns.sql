-- Aggiunta delle colonne per il Roster Esteso (Titolari + Riserve) alle tabelle battles e tournaments

-- Tabella: battles
ALTER TABLE public.battles 
ADD COLUMN IF NOT EXISTS starter_beys_count integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS reserve_beys_count integer DEFAULT 0;

-- Tabella: tournaments
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS starter_beys_count integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS reserve_beys_count integer DEFAULT 0;

-- Commenti descrittivi per schema documentation
COMMENT ON COLUMN public.battles.starter_beys_count IS 'Numero di Beyblade titolari che determinano la durata della Total Battle';
COMMENT ON COLUMN public.battles.reserve_beys_count IS 'Numero di Beyblade di riserva portati nel Roster Esteso';

COMMENT ON COLUMN public.tournaments.starter_beys_count IS 'Numero di Beyblade titolari previsti per i match del torneo';
COMMENT ON COLUMN public.tournaments.reserve_beys_count IS 'Numero di Beyblade di riserva ammessi nel Roster di ciascun partecipante';

-- Rimozione sicura dei vecchi vincoli CHECK sul formato stringente per consentire diciture dinamiche (es. 2v2, Total Battle con riserve)
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Rimuove i check constraint sulla colonna format di battles
  FOR r IN 
    SELECT conname 
    FROM pg_constraint 
    WHERE conrelid = 'public.battles'::regclass 
      AND contype = 'c' 
      AND conname LIKE '%format%'
  LOOP
    EXECUTE 'ALTER TABLE public.battles DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
  END LOOP;

  -- Rimuove i check constraint sulla colonna battle_type di tournaments
  FOR r IN 
    SELECT conname 
    FROM pg_constraint 
    WHERE conrelid = 'public.tournaments'::regclass 
      AND contype = 'c' 
      AND conname LIKE '%battle_type%'
  LOOP
    EXECUTE 'ALTER TABLE public.tournaments DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
  END LOOP;
END;
$$;
