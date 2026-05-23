-- 🔐 BeyManager X - Auth Trigger
-- Crea automaticamente un profilo per ogni nuovo utente registrato

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Crea il profilo in-game per l'account Admin/Arbitro su iPad con flag di amministrazione attivo
  IF NEW.email IN ('hcskso96@gmail.com', 'cr.96bc@gmail.com') THEN
    INSERT INTO public.profiles (id, username, avatar_id, xp, level, title, onboarding_done, is_admin)
    VALUES (NEW.id, 'Arbitro iPad', 'avatar-1', 0, 99, 'Arbitro Ufficiale', true, true);
    RETURN NEW;
  END IF;

  INSERT INTO public.profiles (id, username, avatar_id, xp, level, title, onboarding_done)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_id', 'avatar-1'),
    0,
    1,
    'Blader Novizio',
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger dopo l'INSERT in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
