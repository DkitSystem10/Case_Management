-- Add city_name column to appointments table
-- Run this in your Supabase SQL Editor

ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS city_name TEXT;

-- Note: city_name is optional and stores the city name entered by the user
-- The existing 'city' column stores the district name

