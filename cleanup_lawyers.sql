-- LexConnect Database Cleanup (Version 2)
-- This script handles foreign key constraints by re-mapping appointments before deleting duplicates.

BEGIN;

-- 1. Update appointments to point to a single "Master" ID for each lawyer
-- This ensures no appointments are lost when we delete the duplicate lawyer records.
WITH MasterLawyers AS (
    SELECT name, MIN(id) as keep_id
    FROM lawyers
    GROUP BY name
),
DuplicateMap AS (
    SELECT l.id as old_id, m.keep_id
    FROM lawyers l
    JOIN MasterLawyers m ON l.name = m.name
    WHERE l.id <> m.keep_id
)
UPDATE appointments 
SET lawyer_id = DuplicateMap.keep_id
FROM DuplicateMap
WHERE appointments.lawyer_id = DuplicateMap.old_id;

-- 2. Remove duplicate lawyers now that they are no longer referenced
DELETE FROM lawyers 
WHERE id NOT IN (
    SELECT MIN(id)
    FROM lawyers
    GROUP BY name
);

-- 3. Add unique constraint to prevent future duplicates
-- If you already have a constraint named 'unique_lawyer_name', this might error.
-- You can check/drop it first if needed: ALTER TABLE lawyers DROP CONSTRAINT IF EXISTS unique_lawyer_name;
ALTER TABLE lawyers ADD CONSTRAINT unique_lawyer_name UNIQUE (name);

COMMIT;

-- 4. Verify the data
SELECT * FROM lawyers;
