-- RUN THIS TO UPDATE YOUR EXISTING DATABASE
-- Just copy and paste into Supabase SQL Editor

-- 1. Create lawyers table
CREATE TABLE IF NOT EXISTS lawyers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    specialization TEXT NOT NULL,
    experience TEXT NOT NULL,
    rating NUMERIC DEFAULT 5.0,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add lawyer_id column to appointments table
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS lawyer_id UUID REFERENCES lawyers(id);

-- 3. DISABLE RLS for the new table
ALTER TABLE lawyers DISABLE ROW LEVEL SECURITY;

-- 4. Insert Dummy Lawyers
INSERT INTO lawyers (name, specialization, experience, rating, image_url) VALUES
('Adv. Rajesh Kumar', 'Criminal Law', '15 Years', 4.9, 'https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&q=80&w=200'),
('Adv. Priya Sharma', 'Family & Divorce', '10 Years', 4.8, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200'),
('Adv. Vikram Singh', 'Corporate & Business', '12 Years', 4.7, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200'),
('Adv. Anjali Verma', 'Property & Real Estate', '8 Years', 4.9, 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200')
ON CONFLICT DO NOTHING;

-- 5. Add Case and Stage columns to appointments table
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS case_id TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS case_stage TEXT DEFAULT 'Stage 1';

-- 6. CREATE DEDICATED PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES appointments(id),
    case_id TEXT,
    client_name TEXT,
    consultation_fee NUMERIC DEFAULT 0,
    due_fee NUMERIC DEFAULT 0,
    amount NUMERIC, -- Kept for total
    payment_mode TEXT NOT NULL, -- Cash, Online, Cheque
    transaction_id TEXT, -- For Online (txn_id) or Cheque (bank - num)
    payment_date TIMESTAMPTZ DEFAULT NOW()
);

-- 7. DISABLE RLS FOR PAYMENTS
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
