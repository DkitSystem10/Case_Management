-- Create Client Appointments Table
-- This table stores simple appointment requests from clients
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS client_appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    email_id TEXT NOT NULL,
    address TEXT NOT NULL,
    state TEXT NOT NULL,
    district TEXT NOT NULL,
    already_come TEXT CHECK (already_come IN ('Yes', 'No')) DEFAULT 'No',
    appointment_date DATE NOT NULL,
    time_slot TEXT NOT NULL,
    consultation_type TEXT CHECK (consultation_type IN ('In-Person', 'Online (Video)', 'Phone')) NOT NULL,
    case_category TEXT NOT NULL,
    document_url TEXT,
    description TEXT,
    status TEXT CHECK (status IN ('Pending', 'Approved', 'Rejected')) DEFAULT 'Pending',
    rejection_reason TEXT,
    lawyer_id UUID REFERENCES lawyers(id),
    case_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS for development
ALTER TABLE client_appointments DISABLE ROW LEVEL SECURITY;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_client_appointments_status ON client_appointments(status);
CREATE INDEX IF NOT EXISTS idx_client_appointments_date ON client_appointments(appointment_date);

