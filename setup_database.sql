-- Database Setup & Fix Script
-- Run this in your Supabase SQL Editor to ensure all tables and columns are correct.

-- 1. Create lawyers table if it doesn't exist
CREATE TABLE IF NOT EXISTS lawyers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    specialization TEXT NOT NULL,
    experience TEXT NOT NULL,
    rating NUMERIC DEFAULT 5.0,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_lawyer_name UNIQUE (name)
);

-- 2. Add missing columns to appointments table
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS lawyer_id UUID REFERENCES lawyers(id);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS case_id TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS case_stage TEXT DEFAULT 'Inquiry';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS document_url TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS consultation_fee NUMERIC DEFAULT 0;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS case_fee NUMERIC DEFAULT 0;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 3. Create payments table if it doesn't exist
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES appointments(id),
    case_id TEXT,
    client_name TEXT,
    consultation_fee NUMERIC DEFAULT 0,
    due_fee NUMERIC DEFAULT 0,
    amount NUMERIC DEFAULT 0,
    payment_mode TEXT NOT NULL, -- Cash, Online, Cheque
    transaction_id TEXT, -- For Online (txn_id) or Cheque (bank - num)
    payment_date TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Disable RLS for all tables to avoid permission issues during testing
ALTER TABLE lawyers DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;

-- 5. Insert initial lawyers if table is empty
INSERT INTO lawyers (name, specialization, experience, rating, image_url) VALUES
('Adv. Rajesh Kumar', 'Criminal Law', '15 Years', 4.9, 'https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&q=80&w=200'),
('Adv. Priya Sharma', 'Family & Divorce', '10 Years', 4.8, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200'),
('Adv. Vikram Singh', 'Corporate & Business', '12 Years', 4.7, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200'),
('Adv. Anjali Verma', 'Property & Real Estate', '8 Years', 4.9, 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200')
ON CONFLICT (name) DO NOTHING;
