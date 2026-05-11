-- Add win_condition to tournaments and battles
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS win_condition TEXT NOT NULL DEFAULT 'point_target'
  CHECK (win_condition IN ('point_target', 'total_battle'));

ALTER TABLE battles ADD COLUMN IF NOT EXISTS win_condition TEXT NOT NULL DEFAULT 'point_target'
  CHECK (win_condition IN ('point_target', 'total_battle'));
