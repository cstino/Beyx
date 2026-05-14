-- 🔐 BeyManager X - Referee/Admin RLS Policies per Tornei e Battaglie
-- Consente agli arbitri/amministratori di avviare e gestire le partite in corso nei tornei

-- 1. Aggiorniamo la funzione is_admin per riconoscere l'account arbitro ufficiale tramite email JWT
--    senza richiedere la presenza della riga nella tabella profiles
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    (auth.jwt() ->> 'email' = 'hcskso96@gmail.com') OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Policy sulla tabella 'battles' per consentire agli admin di inserire e aggiornare
DROP POLICY IF EXISTS "Admins can insert battles" ON public.battles;
CREATE POLICY "Admins can insert battles" ON public.battles
FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update battles" ON public.battles;
CREATE POLICY "Admins can update battles" ON public.battles
FOR UPDATE TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete battles" ON public.battles;
CREATE POLICY "Admins can delete battles" ON public.battles
FOR DELETE TO authenticated
USING (public.is_admin());

-- 3. Policy sulla tabella 'tournaments' per consentire agli admin di aggiornare la struttura
DROP POLICY IF EXISTS "Admins can update tournaments" ON public.tournaments;
CREATE POLICY "Admins can update tournaments" ON public.tournaments
FOR UPDATE TO authenticated
USING (public.is_admin());
