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
