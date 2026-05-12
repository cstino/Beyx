-- 🔐 Fix Tournaments RLS Policies
-- Permette ai partecipanti di aggiornare il torneo (necessario per il draft e per aggiornare il tabellone a fine partita)

DROP POLICY IF EXISTS tournaments_update ON public.tournaments;

CREATE POLICY tournaments_update ON public.tournaments
FOR UPDATE USING (
  auth.uid() = created_by OR 
  EXISTS (
    SELECT 1 
    FROM jsonb_array_elements(participants) AS p 
    WHERE (p->>'user_id') IS NOT NULL AND (p->>'user_id')::uuid = auth.uid()
  )
);
