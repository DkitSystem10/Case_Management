-- Add Test Lawyer Users with Credentials
-- Run this in your Supabase SQL Editor after running add_user_schema.sql

-- Insert test lawyers with district assignments and credentials
INSERT INTO lawyers (
    name, 
    email, 
    password, 
    phone_number, 
    district, 
    specialization, 
    experience, 
    rating,
    username,
    date_of_birth,
    aadhar_number,
    pan_number,
    address,
    city,
    state,
    responsible_branch_state,
    status
) VALUES
-- Chennai District Lawyer
(
    'Adv. Ramesh Kumar',
    'ramesh.kumar@legal.com',
    'RK90ch',  -- Password: Initials + Birth Year + District Code
    '9876543210',
    'Chennai',
    'Civil',
    '10 Years',
    5.0,
    'CHN001',
    '1990-05-15',
    '123456789012',
    'ABCDE1234F',
    '123 Legal Street, T Nagar',
    'Chennai',
    'Tamil Nadu',
    'Tamil Nadu',
    'Active'
),
-- Coimbatore District Lawyer
(
    'Adv. Priya Menon',
    'priya.menon@legal.com',
    'PM88cb',  -- Password: Initials + Birth Year + District Code
    '9876543211',
    'Coimbatore',
    'Criminal',
    '8 Years',
    4.9,
    'CBE001',
    '1988-03-20',
    '234567890123',
    'BCDEF2345G',
    '456 Court Road, RS Puram',
    'Coimbatore',
    'Tamil Nadu',
    'Tamil Nadu',
    'Active'
),
-- Madurai District Lawyer
(
    'Adv. Suresh Iyer',
    'suresh.iyer@legal.com',
    'SI92md',  -- Password: Initials + Birth Year + District Code
    '9876543212',
    'Madurai',
    'Family',
    '12 Years',
    4.8,
    'MDU001',
    '1992-07-10',
    '345678901234',
    'CDEFG3456H',
    '789 Justice Avenue, Anna Nagar',
    'Madurai',
    'Tamil Nadu',
    'Tamil Nadu',
    'Active'
),
-- Salem District Lawyer
(
    'Adv. Lakshmi Devi',
    'lakshmi.devi@legal.com',
    'LD85sl',  -- Password: Initials + Birth Year + District Code
    '9876543213',
    'Salem',
    'Property',
    '15 Years',
    5.0,
    'SLM001',
    '1985-11-25',
    '456789012345',
    'DEFGH4567I',
    '321 Law Chambers, Hasthampatti',
    'Salem',
    'Tamil Nadu',
    'Tamil Nadu',
    'Active'
),
-- Tiruchirappalli District Lawyer
(
    'Adv. Karthik Rajan',
    'karthik.rajan@legal.com',
    'KR91tp',  -- Password: Initials + Birth Year + District Code
    '9876543214',
    'Tiruchirappalli',
    'Corporate',
    '9 Years',
    4.7,
    'TPJ001',
    '1991-09-05',
    '567890123456',
    'EFGHI5678J',
    '654 Advocate Street, Cantonment',
    'Tiruchirappalli',
    'Tamil Nadu',
    'Tamil Nadu',
    'Active'
)
ON CONFLICT (username) DO NOTHING;

-- Test Credentials Summary:
-- 
-- Chennai District:
--   Username: CHN001
--   Password: RK90ch
--
-- Coimbatore District:
--   Username: CBE001
--   Password: PM88cb
--
-- Madurai District:
--   Username: MDU001
--   Password: SI92md
--
-- Salem District:
--   Username: SLM001
--   Password: LD85sl
--
-- Tiruchirappalli District:
--   Username: TPJ001
--   Password: KR91tp

