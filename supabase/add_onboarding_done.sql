
-- 🚀 BeyManager X - Onboarding Support
-- Aggiunge il flag per tracciare il completamento del Welcome Tour

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_done BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.onboarding_done IS 'TRUE se l''utente ha completato il tour di benvenuto, FALSE altrimenti';
