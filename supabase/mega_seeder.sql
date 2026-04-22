-- 🚀 BeyManager X - Mega Seeder (Completa Collection with Release Codes)
-- Inserisce la lista completa delle prime release Takara Tomy

-- Utility: Puliamo i dati vecchi per evitare duplicati
TRUNCATE public.blades, public.ratchets, public.bits CASCADE;

-- BLADES
INSERT INTO public.blades (name, type, weight, tier, release_code, stats) VALUES
('Dran Sword', 'Attack', 35.0, 'S', 'BX-01', '{"attack": 85, "defense": 15, "stamina": 20, "burst": 40, "mobility": 80}'),
('Hell Scythe', 'Balance', 33.5, 'A', 'BX-02', '{"attack": 45, "defense": 45, "stamina": 50, "burst": 60, "mobility": 50}'),
('Wizard Arrow', 'Stamina', 31.8, 'B', 'BX-03', '{"attack": 30, "defense": 30, "stamina": 85, "burst": 30, "mobility": 40}'),
('Knight Shield', 'Defense', 36.2, 'A', 'BX-04', '{"attack": 20, "defense": 85, "stamina": 40, "burst": 60, "mobility": 30}'),
('Knight Lance', 'Defense', 35.5, 'B', 'BX-13', '{"attack": 30, "defense": 70, "stamina": 50, "burst": 55, "mobility": 45}'),
('Shark Edge', 'Attack', 35.2, 'S', 'BX-14', '{"attack": 95, "defense": 10, "stamina": 15, "burst": 30, "mobility": 85}'),
('Leon Claw', 'Attack', 34.1, 'B', 'BX-15', '{"attack": 70, "defense": 30, "stamina": 30, "burst": 50, "mobility": 60}'),
('Viper Tail', 'Stamina', 32.8, 'C', 'BX-16', '{"attack": 25, "defense": 25, "stamina": 75, "burst": 45, "mobility": 50}'),
('Rhino Horn', 'Defense', 33.5, 'C', 'BX-19', '{"attack": 15, "defense": 75, "stamina": 25, "burst": 70, "mobility": 20}'),
('Phoenix Wing', 'Attack', 38.0, 'S', 'BX-23', '{"attack": 98, "defense": 20, "stamina": 30, "burst": 50, "mobility": 75}'),
('Wyvern Gale', 'Stamina', 32.2, 'B', 'BX-24', '{"attack": 20, "defense": 40, "stamina": 80, "burst": 40, "mobility": 60}'),
('Unicorn Sting', 'Balance', 34.5, 'A', 'BX-26', '{"attack": 60, "defense": 60, "stamina": 60, "burst": 50, "mobility": 60}'),
('Sphinx Cowl', 'Defense', 35.8, 'B', 'BX-27', '{"attack": 20, "defense": 80, "stamina": 30, "burst": 65, "mobility": 25}'),
('Dran Buster', 'Attack', 36.5, 'S', 'UX-01', '{"attack": 100, "defense": 5, "stamina": 10, "burst": 35, "mobility": 90}'),
('Hells Hammer', 'Balance', 34.8, 'S', 'UX-02', '{"attack": 75, "defense": 30, "stamina": 45, "burst": 50, "mobility": 70}'),
('Wizard Rod', 'Stamina', 35.2, 'S', 'UX-03', '{"attack": 15, "defense": 50, "stamina": 100, "burst": 40, "mobility": 55}'),
('Weiss Tiger', 'Attack', 35.0, 'B', 'UX-10', '{"attack": 80, "defense": 20, "stamina": 30, "burst": 45, "mobility": 70}');

-- RATCHETS
INSERT INTO public.ratchets (name, sides, height, release_code) VALUES
('3-60', 3, 60, 'BX-01'),
('4-60', 4, 60, 'BX-02'),
('4-80', 4, 80, 'BX-03'),
('3-80', 3, 80, 'BX-04'),
('5-80', 5, 80, 'BX-16'),
('5-60', 5, 60, 'BX-15'),
('9-60', 9, 60, 'BX-23'),
('1-60', 1, 60, 'UX-01'),
('1-80', 1, 80, 'UX-01'),
('2-60', 2, 60, 'UX-10'),
('3-70', 3, 70, NULL),
('7-60', 7, 60, 'BX-31');

-- BITS
INSERT INTO public.bits (name, type, tip_shape, release_code) VALUES
('Flat', 'Attack', 'Flat', 'BX-01'),
('Taper', 'Balance', 'Tapered', 'BX-02'),
('Ball', 'Stamina', 'Round', 'BX-03'),
('Needle', 'Defense', 'Sharp', 'BX-04'),
('Low Flat', 'Attack', 'Low Flat', 'BX-14'),
('Point', 'Balance', 'Semi-flat', 'BX-15'),
('Orb', 'Stamina', 'Big Ball', 'BX-16'),
('Gear Flat', 'Attack', 'Gears', 'BX-23'),
('High Flat', 'Attack', 'Tall Flat', 'BX-08'),
('High Needle', 'Defense', 'Tall Sharp', 'BX-13'),
('Accel', 'Attack', 'Speed', 'UX-01'),
('Hexa', 'Defense', 'Hexagonal', 'UX-02'),
('Disc Ball', 'Stamina', 'Wide Ball', 'UX-03');
