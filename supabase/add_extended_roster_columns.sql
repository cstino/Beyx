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
