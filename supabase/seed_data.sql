-- BeyManager X Seed Data

-- Clear existing data (Optional, use with caution)
-- TRUNCATE public.blades, public.ratchets, public.bits CASCADE;

-- Insert Blades
INSERT INTO public.blades (name, type, weight, tier, description, image_url, stats) VALUES
('Dran Sword', 'Attack', 35.0, 'S', 'Sferra attacchi devastanti grazie alle sue tre lame affilate.', '/assets/parts/dran_sword.png', '{"attack": 85, "defense": 15, "stamina": 20}'),
('Hell Scythe', 'Balance', 33.5, 'A', 'Un equilibrio perfetto tra attacco e difesa con i suoi bordi a falce.', '/assets/parts/hell_scythe.png', '{"attack": 45, "defense": 45, "stamina": 50}'),
('Knight Shield', 'Defense', 36.2, 'A', 'Uno scudo impenetrabile progettato per assorbire ogni impatto.', '/assets/parts/knight_shield.png', '{"attack": 20, "defense": 85, "stamina": 40}'),
('Wizard Arrow', 'Stamina', 31.8, 'B', 'Ottimizzato per la rotazione prolungata con una distribuzione del peso circolare.', '/assets/parts/wizard_arrow.png', '{"attack": 30, "defense": 30, "stamina": 85}'),
('Leon Claw', 'Attack', 34.2, 'B', 'Attacchi rapidi e graffianti per destabilizzare l''avversario.', NULL, '{"attack": 70, "defense": 30, "stamina": 30}'),
('Viper Tail', 'Stamina', 32.5, 'C', 'Movimenti sinuosi che confondono l''avversario durante la rotazione.', NULL, '{"attack": 25, "defense": 25, "stamina": 75}'),
('Shark Edge', 'Attack', 35.5, 'S', 'Un profilo basso e aggressivo per attacchi dal basso verso l''alto.', NULL, '{"attack": 90, "defense": 10, "stamina": 15}');


-- Insert Ratchets
INSERT INTO public.ratchets (name, sides, height) VALUES
('3-60', 3, 60),
('4-60', 4, 60),
('5-60', 5, 60),
('3-80', 3, 80),
('4-80', 4, 80),
('5-80', 5, 80),
('9-60', 9, 60);

-- Insert Bits
INSERT INTO public.bits (name, type, tip_shape) VALUES
('Flat', 'Attack', 'Flat'),
('Taper', 'Balance', 'Tapered'),
('Needle', 'Defense', 'Sharp'),
('Ball', 'Stamina', 'Round'),
('High Flat', 'Attack', 'Tall Flat'),
('Rush', 'Attack', 'Gear-like'),
('Point', 'Balance', 'Semi-flat');
