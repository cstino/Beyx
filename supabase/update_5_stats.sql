-- 📊 BeyManager X - Stats Update
-- Aggiorna i Blade con il set completo di 5 statistiche per il Radar Chart

UPDATE public.blades
SET stats = jsonb_build_object(
  'attack', (stats->>'attack')::int,
  'defense', (stats->>'defense')::int,
  'stamina', (stats->>'stamina')::int,
  'burst', COALESCE((stats->>'burst')::int, floor(random() * 40 + 30)::int),
  'mobility', COALESCE((stats->>'mobility')::int, floor(random() * 40 + 30)::int)
)
WHERE stats IS NOT NULL;

-- Per i Blade senza stats, inseriamo un set di default bilanciato
UPDATE public.blades
SET stats = '{
  "attack": 50,
  "defense": 50,
  "stamina": 50,
  "burst": 50,
  "mobility": 50
}'::jsonb
WHERE stats IS NULL;
