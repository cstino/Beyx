-- Abilita RLS sulla tabella dello storico ELO (sintassi standard PostgreSQL corretta)
ALTER TABLE public.user_elo_history ENABLE ROW LEVEL SECURITY;

-- Rimuove eventuali policy precedenti con lo stesso nome per evitare conflitti
DROP POLICY IF EXISTS "Allow public read on user_elo_history" ON public.user_elo_history;

-- Crea la policy per permettere la lettura dei delta ELO da parte del client frontend
CREATE POLICY "Allow public read on user_elo_history" 
ON public.user_elo_history 
FOR SELECT USING (true);
