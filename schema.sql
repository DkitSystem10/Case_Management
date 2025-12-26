-- LexConnect Supreme Database Setup
-- Run this in your Supabase SQL Editor

-- 1. CLEANUP (Optional - Uncomment if you want to start fresh)
-- DROP TABLE IF EXISTS appointments;
-- DROP TABLE IF EXISTS lawyers;

-- 2. CREATE LAWYERS TABLE
CREATE TABLE IF NOT EXISTS lawyers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    specialization TEXT NOT NULL,
    experience TEXT NOT NULL,
    rating NUMERIC DEFAULT 5.0,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CREATE APPOINTMENTS TABLE
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    email_id TEXT NOT NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    already_come TEXT CHECK (already_come IN ('Yes', 'No')) DEFAULT 'No',
    appointment_date DATE NOT NULL,
    time_slot TEXT NOT NULL,
    consultation_type TEXT CHECK (consultation_type IN ('In-Person', 'Online', 'Phone')) NOT NULL,
    case_category TEXT NOT NULL,
    other_category TEXT,
    description TEXT,
    -- Fee columns (kept for structural integrity, though UI handles demo)
    consultation_fee NUMERIC DEFAULT 0,
    case_fee NUMERIC DEFAULT 0,
    -- Lawyer Assignment mapping
    lawyer_id UUID REFERENCES lawyers(id),
    status TEXT CHECK (status IN ('Pending', 'Approved', 'Rejected')) DEFAULT 'Pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. DISABLE SECURITY (For Development Demo)
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE lawyers DISABLE ROW LEVEL SECURITY;

-- 5. INSERT DUMMY LAWYERS DATA
INSERT INTO lawyers (name, specialization, experience, rating, image_url) 
VALUES
('Adv. Rajesh Kumar', 'Criminal Law', '15 Years', 4.9, 'https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&q=80&w=200'),
('Adv. Priya Sharma', 'Family & Divorce', '10 Years', 4.8, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200'),
('Adv. Vikram Singh', 'Corporate & Business', '12 Years', 4.7, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200'),
('Adv. Anjali Verma', 'Property & Real Estate', '8 Years', 4.9, 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200')
ON CONFLICT DO NOTHING;

-- 6. SETUP UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON appointments;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON appointments
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();
