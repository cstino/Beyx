-- Add stats column to blades table
ALTER TABLE public.blades ADD COLUMN IF NOT EXISTS stats JSONB DEFAULT '{"attack": 50, "defense": 50, "stamina": 50}'::JSONB;

-- Update existing blades with specific stats (examples)
UPDATE public.blades SET stats = '{"attack": 80, "defense": 20, "stamina": 30}' WHERE name = 'Dran Sword';
UPDATE public.blades SET stats = '{"attack": 45, "defense": 45, "stamina": 50}' WHERE name = 'Hell Scythe';
UPDATE public.blades SET stats = '{"attack": 20, "defense": 85, "stamina": 40}' WHERE name = 'Knight Shield';
UPDATE public.blades SET stats = '{"attack": 30, "defense": 30, "stamina": 85}' WHERE name = 'Wizard Arrow';
