-- Migration: importance scale 100-499 + remove points system
-- 1. Clamp existing importance values into the new range
--    - values > 499 (e.g. 500) → 499
--    - values < 100 (e.g. 0) → 100
UPDATE tasks SET importance = 499 WHERE importance > 499;
UPDATE tasks SET importance = 100 WHERE importance < 100;

-- 2. Update the column default for new tasks
ALTER TABLE tasks ALTER COLUMN importance SET DEFAULT 100;

-- 3. Remove the points system entirely
ALTER TABLE tasks DROP COLUMN IF EXISTS points;
