-- Drop the old singular `position` column from staff.
-- The `positions` (array) column added in 20260122091808 is the replacement.
-- The staff_data view already references `positions`, so no view changes needed.

ALTER TABLE staff DROP COLUMN IF EXISTS position;
