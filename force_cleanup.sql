-- LexConnect FORCE CLEANUP
-- This script will forcefully clear and re-setup your lawyers table.

BEGIN;

-- 1. Detach all appointments from lawyers temporarily
-- This removes the reference so we can safely delete any lawyer
UPDATE appointments SET lawyer_id = NULL;

-- 2. Delete ALL lawyers to start fresh
DELETE FROM lawyers;

-- 3. Add the Unique Constraint (if not already exists)
-- This prevents future duplicates
ALTER TABLE lawyers DROP CONSTRAINT IF EXISTS unique_lawyer_name;
ALTER TABLE lawyers ADD CONSTRAINT unique_lawyer_name UNIQUE (name);

-- 4. Re-insert the fresh, clean list of lawyers
INSERT INTO lawyers (name, specialization, experience, rating, image_url) 
VALUES
('Adv. Rajesh Kumar', 'Criminal Law', '15 Years', 4.9, 'https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&q=80&w=200'),
('Adv. Priya Sharma', 'Family & Divorce', '10 Years', 4.8, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200'),
('Adv. Vikram Singh', 'Corporate & Business', '12 Years', 4.7, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200'),
('Adv. Anjali Verma', 'Property & Real Estate', '8 Years', 4.9, 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200')
ON CONFLICT (name) DO NOTHING;

COMMIT;

-- 5. Show clean results
SELECT * FROM lawyers;
