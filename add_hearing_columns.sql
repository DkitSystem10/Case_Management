-- Add hearing details columns to appointments table
-- Run this in your Supabase SQL Editor

ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS court_hearing_date DATE,
ADD COLUMN IF NOT EXISTS current_hearing_report TEXT,
ADD COLUMN IF NOT EXISTS next_hearing_date DATE,
ADD COLUMN IF NOT EXISTS hearing_updated_by UUID REFERENCES lawyers(id),
ADD COLUMN IF NOT EXISTS hearing_updated_at TIMESTAMPTZ;

