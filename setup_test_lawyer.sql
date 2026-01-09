-- Test Lawyer Account Setup for Case Finder
-- Run this in your Supabase SQL Editor

-- 1. Ensure lawyers table has required columns
ALTER TABLE lawyers 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS password TEXT,
ADD COLUMN IF NOT EXISTS district TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';

-- 2. Insert a test lawyer account
-- Update an existing lawyer or insert a new one
INSERT INTO lawyers (name, specialization, experience, username, password, district, status)
VALUES (
    'Test Lawyer',
    'Criminal Law',
    '10 Years',
    'CHN001',  -- Username: District Code + Number
    'test123', -- Password
    'Chennai', -- District (should match city field in appointments)
    'Active'
)
ON CONFLICT (username) 
DO UPDATE SET 
    password = EXCLUDED.password,
    district = EXCLUDED.district,
    status = 'Active';

-- Or update an existing lawyer
UPDATE lawyers 
SET 
    username = 'CHN001',
    password = 'test123',
    district = 'Chennai',
    status = 'Active'
WHERE name = 'Adv. Rajesh Kumar'
LIMIT 1;

-- Verify the lawyer was created/updated
SELECT id, name, username, password, district, status 
FROM lawyers 
WHERE username = 'CHN001' AND status = 'Active';

