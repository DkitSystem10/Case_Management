-- Add User/Lawyer Fields to Database
-- Run this in your Supabase SQL Editor

-- Add new columns to lawyers table for user authentication and district assignment
ALTER TABLE lawyers 
ADD COLUMN IF NOT EXISTS email TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS password TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS district TEXT,
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS aadhar_number TEXT,
ADD COLUMN IF NOT EXISTS pan_number TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS responsible_branch_state TEXT,
ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('Active', 'Inactive')) DEFAULT 'Active';

-- Note: In production, password should be hashed (bcrypt, argon2, etc.)
-- For now, storing plain text password for development purposes

