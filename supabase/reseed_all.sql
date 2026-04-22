-- 🚨 BeyManager X - EMERGENCY RESEED
-- Pulisce tutto e inserisce la lista completa in blocchi separati

DELETE FROM public.blades;
DELETE FROM public.ratchets;
DELETE FROM public.bits;

-- BLADES (Serie BX + Especiali)
INSERT INTO public.blades (name, type, weight, tier, release_code, stats) VALUES
('Dran Sword', 'Attack', 35.0, 'S', 'BX-01', '{"attack": 85, "defense": 15, "stamina": 20, "burst": 40, "mobility": 80}'),
('Hells Scythe', 'Balance', 33.5, 'A', 'BX-02', '{"attack": 45, "defense": 45, "stamina": 50, "burst": 60, "mobility": 50}'),
('Wizard Arrow', 'Stamina', 31.8, 'B', 'BX-03', '{"attack": 30, "defense": 30, "stamina": 85, "burst": 30, "mobility": 40}'),
('Knight Shield', 'Defense', 36.2, 'A', 'BX-04', '{"attack": 20, "defense": 85, "stamina": 40, "burst": 60, "mobility": 30}'),
('Knight Lance', 'Defense', 35.5, 'B', 'BX-13', '{"attack": 30, "defense": 70, "stamina": 50, "burst": 55, "mobility": 45}'),
('Shark Edge', 'Attack', 35.2, 'S', 'BX-14', '{"attack": 95, "defense": 10, "stamina": 15, "burst": 30, "mobility": 85}'),
('Leon Claw', 'Attack', 34.1, 'B', 'BX-15', '{"attack": 70, "defense": 30, "stamina": 30, "burst": 50, "mobility": 60}'),
('Viper Tail', 'Stamina', 32.8, 'C', 'BX-16', '{"attack": 25, "defense": 25, "stamina": 75, "burst": 45, "mobility": 50}'),
('Rhino Horn', 'Defense', 33.5, 'C', 'BX-19', '{"attack": 15, "defense": 75, "stamina": 25, "burst": 70, "mobility": 20}'),
('Dran Dagger', 'Attack', 34.8, 'A', 'BX-20', '{"attack": 80, "defense": 20, "stamina": 30, "burst": 45, "mobility": 75}'),
('Hells Chain', 'Balance', 34.5, 'A', 'BX-21', '{"attack": 55, "defense": 55, "stamina": 55, "burst": 55, "mobility": 55}'),
('Phoenix Wing', 'Attack', 38.0, 'S', 'BX-23', '{"attack": 100, "defense": 20, "stamina": 30, "burst": 50, "mobility": 80}'),
('Wyvern Gale', 'Stamina', 32.2, 'B', 'BX-24', '{"attack": 20, "defense": 40, "stamina": 80, "burst": 40, "mobility": 60}'),
('Unicorn Sting', 'Balance', 34.5, 'A', 'BX-26', '{"attack": 65, "defense": 65, "stamina": 65, "burst": 50, "mobility": 60}'),
('Sphinx Cowl', 'Defense', 35.8, 'B', 'BX-27', '{"attack": 25, "defense": 85, "stamina": 30, "burst": 65, "mobility": 25}'),
('Tyranno Beat', 'Attack', 36.1, 'S', 'BX-31', '{"attack": 90, "defense": 25, "stamina": 25, "burst": 45, "mobility": 70}'),
('Weiss Tiger', 'Attack', 35.0, 'B', 'BX-33', '{"attack": 85, "defense": 20, "stamina": 35, "burst": 50, "mobility": 75}'),
('Cobalt Dragoon', 'Attack', 37.8, 'S', 'BX-34', '{"attack": 95, "defense": 10, "stamina": 20, "burst": 30, "mobility": 90}'),
('Black Shell', 'Defense', 36.5, 'B', 'BX-35', '{"attack": 20, "defense": 95, "stamina": 35, "burst": 70, "mobility": 25}'),
('Whale Wave', 'Attack', 35.8, 'A', 'BX-36', '{"attack": 92, "defense": 15, "stamina": 25, "burst": 40, "mobility": 80}'),
('Bear Scratch', 'Attack', 34.2, 'C', 'BX-37', '{"attack": 88, "defense": 20, "stamina": 20, "burst": 40, "mobility": 70}');

-- BLADES (Serie UX + nuove CX)
INSERT INTO public.blades (name, type, weight, tier, release_code, stats) VALUES
('Dran Buster', 'Attack', 36.5, 'S', 'UX-01', '{"attack": 105, "defense": 5, "stamina": 5, "burst": 30, "mobility": 95}'),
('Hells Hammer', 'Balance', 34.8, 'S', 'UX-02', '{"attack": 80, "defense": 35, "stamina": 50, "burst": 50, "mobility": 65}'),
('Wizard Rod', 'Stamina', 35.2, 'S', 'UX-03', '{"attack": 15, "defense": 60, "stamina": 105, "burst": 40, "mobility": 45}'),
('Shinobi Shadow', 'Defense', 33.1, 'C', 'UX-05', '{"attack": 10, "defense": 90, "stamina": 40, "burst": 80, "mobility": 30}'),
('Leon Crest', 'Defense', 38.5, 'S', 'UX-06', '{"attack": 20, "defense": 100, "stamina": 30, "burst": 85, "mobility": 20}'),
('Phoenix Rudder', 'Stamina', 35.2, 'A', 'UX-07', '{"attack": 25, "defense": 45, "stamina": 95, "burst": 50, "mobility": 55}'),
('Silver Wolf', 'Stamina', 35.0, 'S', 'UX-08', '{"attack": 30, "defense": 30, "stamina": 100, "burst": 45, "mobility": 65}'),
('Samurai Saber', 'Attack', 35.5, 'A', 'UX-09', '{"attack": 90, "defense": 20, "stamina": 30, "burst": 50, "mobility": 70}'),
('Knight Mail', 'Defense', 36.2, 'A', 'UX-10', '{"attack": 25, "defense": 95, "stamina": 30, "burst": 75, "mobility": 25}'),
('Dran Brave', 'Attack', 35.8, 'S', 'CX-01', '{"attack": 95, "defense": 20, "stamina": 20, "burst": 45, "mobility": 85}'),
('Wizard Arc', 'Stamina', 34.2, 'A', 'CX-02', '{"attack": 20, "defense": 50, "stamina": 95, "burst": 45, "mobility": 50}'),
('Perseus Dark', 'Balance', 36.5, 'S', 'CX-03', '{"attack": 65, "defense": 65, "stamina": 65, "burst": 60, "mobility": 65}'),
('Hells Reaper', 'Balance', 35.0, 'A', 'CX-05', '{"attack": 80, "defense": 45, "stamina": 45, "burst": 55, "mobility": 60}'),
('Fox Brush', 'Stamina', 33.8, 'B', 'CX-06', '{"attack": 30, "defense": 30, "stamina": 90, "burst": 50, "mobility": 70}'),
('Pegasus Blast', 'Attack', 35.5, 'S', 'CX-07', '{"attack": 98, "defense": 15, "stamina": 20, "burst": 40, "mobility": 90}'),
('Cobalt Drake', 'Attack', 38.1, 'S', 'BX-00', '{"attack": 95, "defense": 30, "stamina": 30, "burst": 60, "mobility": 60}'),
('Aero Pegasus', 'Attack', 37.5, 'S', 'BX-00', '{"attack": 90, "defense": 40, "stamina": 40, "burst": 65, "mobility": 60}'),
('L-Drago (Upper)', 'Attack', 33.5, 'A', 'BX-00', '{"attack": 100, "defense": 10, "stamina": 20, "burst": 30, "mobility": 95}'),
('L-Drago (Barrage)', 'Attack', 33.2, 'A', 'BX-00', '{"attack": 85, "defense": 20, "stamina": 40, "burst": 40, "mobility": 85}');

-- RATCHETS & BITS (Esegui pure insieme)
INSERT INTO public.ratchets (name, sides, height, release_code) VALUES
('3-60', 3, 60, 'BX-01'), ('4-60', 4, 60, 'BX-02'), ('4-80', 4, 80, 'BX-03'), ('3-80', 3, 80, 'BX-04'), ('5-60', 5, 60, 'BX-15'), ('5-80', 5, 80, 'BX-16'), ('9-60', 9, 60, 'BX-23'), ('9-80', 9, 80, 'BX-27'), ('1-60', 1, 60, 'UX-01'), ('3-70', 3, 70, 'UX-02'), ('5-70', 5, 70, 'UX-03'), ('1-80', 1, 80, 'UX-05'), ('7-60', 7, 60, 'UX-06'), ('9-70', 9, 70, 'UX-07'), ('2-70', 2, 70, 'UX-09'), ('2-60', 2, 60, 'BX-34'), ('4-70', 4, 70, 'BX-31'), ('S6-60', 6, 60, 'CX-01'), ('R4-55', 4, 55, 'CX-02'), ('B6-80', 6, 80, 'CX-03'), ('T4-70', 4, 70, 'CX-05'), ('J9-70', 9, 70, 'CX-06'), ('W5-80', 5, 80, 'CX-08'), ('D5-70', 5, 70, 'CX-09'), ('F0-60', 0, 60, 'CX-10');

INSERT INTO public.bits (name, type, tip_shape, release_code) VALUES
('Flat', 'Attack', 'Flat', 'BX-01'), ('Taper', 'Balance', 'Tapered', 'BX-02'), ('Ball', 'Stamina', 'Round', 'BX-03'), ('Needle', 'Defense', 'Sharp', 'BX-04'), ('High Needle', 'Defense', 'Tall Sharp', 'BX-13'), ('Low Flat', 'Attack', 'Low Flat', 'BX-14'), ('Point', 'Balance', 'Semi-flat', 'BX-15'), ('Orb', 'Stamina', 'Big Ball', 'BX-16'), ('Spike', 'Defense', 'Pointy', 'BX-19'), ('Rush', 'Attack', 'Gears', 'BX-20'), ('High Taper', 'Balance', 'Tall Taper', 'BX-21'), ('Gear Flat', 'Attack', 'Metal Gears', 'BX-23'), ('Gear Ball', 'Stamina', 'Metal Round', 'BX-24'), ('Gear Point', 'Balance', 'Metal Semi', 'BX-26'), ('Gear Needle', 'Defense', 'Metal Sharp', 'BX-27'), ('Quake', 'Attack', 'Irregular', 'BX-31'), ('Unite', 'Balance', 'Rubber/Plastic', 'BX-33'), ('Cyclone', 'Attack', 'Spiral', 'BX-34'), ('Dot', 'Defense', 'Tiny Circle', 'BX-35'), ('Elevate', 'Attack', 'Tall', 'BX-36'), ('Accel', 'Attack', 'Ultra Fast', 'UX-01'), ('Hexa', 'Defense', 'Hexagonal', 'UX-02'), ('Disc Ball', 'Stamina', 'Wide Round', 'UX-03'), ('Metal Needle', 'Defense', 'Metal', 'UX-05'), ('Glide', 'Stamina', 'Smooth', 'UX-07'), ('Free Ball', 'Stamina', 'Rotating', 'UX-08'), ('Level', 'Balance', 'Flat Ball', 'UX-09'), ('Low Rush', 'Attack', 'Lower Gears', 'UX-11'), ('Variable', 'Attack', 'Rubber', 'CX-01'), ('Low Orb', 'Stamina', 'Low Big Ball', 'CX-02');
