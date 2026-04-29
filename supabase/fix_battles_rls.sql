
-- 🔐 Fix Battles RLS Policies
-- Allow involved players and admins to update the battle

DROP POLICY IF EXISTS "battles_update" ON public.battles;

CREATE POLICY "battles_update" ON public.battles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = created_by OR 
  auth.uid() = player1_user_id OR 
  auth.uid() = player2_user_id OR 
  auth.uid() = admin_user_id
)
WITH CHECK (
  auth.uid() = created_by OR 
  auth.uid() = player1_user_id OR 
  auth.uid() = player2_user_id OR 
  auth.uid() = admin_user_id
);

-- Also ensure DELETE policy exists for cleanup (e.g. in Dashboard)
DROP POLICY IF EXISTS "battles_delete" ON public.battles;
CREATE POLICY "battles_delete" ON public.battles
FOR DELETE
TO authenticated
USING (
  auth.uid() = created_by OR 
  auth.uid() = admin_user_id
);
