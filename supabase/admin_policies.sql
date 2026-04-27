
-- 🔐 BeyManager X - Admin RLS Policies
-- Questo script abilita gli amministratori a gestire i componenti (Blades, Ratchets, Bits)

-- 1. Funzione di utilità per verificare se l'utente è un admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Policy per BLADES
DROP POLICY IF EXISTS "Admins can manage blades" ON public.blades;
CREATE POLICY "Admins can manage blades" ON public.blades
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 3. Policy per RATCHETS
DROP POLICY IF EXISTS "Admins can manage ratchets" ON public.ratchets;
CREATE POLICY "Admins can manage ratchets" ON public.ratchets
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 4. Policy per BITS
DROP POLICY IF EXISTS "Admins can manage bits" ON public.bits;
CREATE POLICY "Admins can manage bits" ON public.bits
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
