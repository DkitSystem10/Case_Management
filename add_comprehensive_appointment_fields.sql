-- Add comprehensive appointment fields to appointments table
-- Run this in your Supabase SQL Editor

ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS client_id TEXT,
ADD COLUMN IF NOT EXISTS client_type TEXT CHECK (client_type IN ('Individual', 'Company')),
ADD COLUMN IF NOT EXISTS case_title TEXT,
ADD COLUMN IF NOT EXISTS case_type TEXT,
ADD COLUMN IF NOT EXISTS court_name TEXT,
ADD COLUMN IF NOT EXISTS case_status TEXT CHECK (case_status IN ('Open', 'Pending', 'Closed', 'Appeal')),
ADD COLUMN IF NOT EXISTS branch_name TEXT,
ADD COLUMN IF NOT EXISTS branch_location TEXT,
ADD COLUMN IF NOT EXISTS assigned_advocate TEXT,
ADD COLUMN IF NOT EXISTS filing_date DATE,
ADD COLUMN IF NOT EXISTS last_hearing_date DATE,
ADD COLUMN IF NOT EXISTS stage_of_case TEXT CHECK (stage_of_case IN ('Evidence', 'Argument', 'Judgment')),
ADD COLUMN IF NOT EXISTS fee_type TEXT CHECK (fee_type IN ('Fixed', 'Stage-wise')),
ADD COLUMN IF NOT EXISTS total_fee NUMERIC,
ADD COLUMN IF NOT EXISTS paid_amount NUMERIC,
ADD COLUMN IF NOT EXISTS balance_amount NUMERIC,
ADD COLUMN IF NOT EXISTS payment_status TEXT,
ADD COLUMN IF NOT EXISTS documents_status TEXT CHECK (documents_status IN ('Uploaded', 'Pending')),
ADD COLUMN IF NOT EXISTS important_notes TEXT,
ADD COLUMN IF NOT EXISTS case_priority TEXT CHECK (case_priority IN ('High', 'Medium', 'Low'));

