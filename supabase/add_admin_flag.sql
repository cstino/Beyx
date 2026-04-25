-- 🔐 BeyManager X - Admin Access
-- Aggiunge il flag is_admin per identificare gli amministratori
-- Esegui questo script nel SQL Editor di Supabase

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Sostituisci 'IL_TUO_USERNAME' con il tuo vero username per darti i poteri
UPDATE public.profiles 
SET is_admin = TRUE 
WHERE username = 'CSTINO'; 
