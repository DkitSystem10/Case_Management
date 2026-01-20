# Case Management System - Project Architecture Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Database Architecture - Master Table Concept](#database-architecture---master-table-concept)
4. [Database Schema](#database-schema)
5. [Soft Delete & Timestamp Management](#soft-delete--timestamp-management)
6. [Backend Architecture](#backend-architecture)
7. [Frontend Architecture](#frontend-architecture)
8. [API & Data Flow](#api--data-flow)
9. [Master Tables Design](#master-tables-design)
10. [Application Flow](#application-flow)
11. [Recommended Improvements](#recommended-improvements)

---

## 🎯 Project Overview

This is a comprehensive **Legal Case Management System** designed to manage appointments, cases, lawyers, clients, payments, and hearing schedules. The system supports both admin and lawyer roles with district-based access control.

### Key Features
- **Appointment Management**: Client appointment booking and approval workflow
- **Case Lifecycle Management**: Inquiry → Verified → Payment → Litigation → History/Disposed
- **Lawyer Management**: Lawyer registration, authentication, and district-based assignment
- **Payment Management**: Payment tracking, collection, and reporting
- **Hearing Management**: Court hearing dates and hearing reports
- **District Management**: District-wise case distribution and filtering
- **Multi-role Access**: Admin dashboard and Lawyer portal

---

## 🛠 Technology Stack

### Frontend
- **React 19.2.0** - UI Framework
- **TypeScript 5.9.3** - Type Safety
- **React Router DOM 7.11.0** - Routing
- **Tailwind CSS 4.1.18** - Styling
- **Lucide React 0.562.0** - Icons
- **Vite 7.2.4** - Build Tool

### Backend & Database
- **Supabase** - Backend as a Service (BaaS)
  - PostgreSQL Database
  - Row Level Security (RLS) - Currently Disabled for Development
  - Storage for Document Management
- **EmailJS 4.4.1** - Email Notification Service

### Development Tools
- **ESLint** - Code Linting
- **PostCSS & Autoprefixer** - CSS Processing
- **TypeScript ESLint** - TypeScript Linting

---

## 🗄 Database Architecture - Master Table Concept

The system follows a **Master-Transaction Table** design pattern where:

1. **Master Tables** store reference data that doesn't change frequently
2. **Transaction Tables** store business transactions referencing master data
3. **Lookup Tables** provide standardized values for dropdowns and validations

### Current Database Structure

```
┌─────────────────────────────────────────────────────────┐
│                    MASTER TABLES                         │
├─────────────────────────────────────────────────────────┤
│ • lawyers (Master Lawyer Data)                          │
│ • districts (Proposed - Not yet implemented)            │
│ • case_categories (Proposed - Hardcoded in UI)          │
│ • case_stages (Proposed - Hardcoded in UI)              │
│ • payment_modes (Proposed - Hardcoded in UI)            │
└─────────────────────────────────────────────────────────┘
                          ↓ References
┌─────────────────────────────────────────────────────────┐
│                TRANSACTION TABLES                        │
├─────────────────────────────────────────────────────────┤
│ • appointments (Main case/appointment records)          │
│ • client_appointments (Public appointment requests)     │
│ • payments (Payment transaction records)                │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema

### 1. **lawyers** (Master Table)
Stores lawyer master data with authentication credentials.

```sql
CREATE TABLE lawyers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    specialization TEXT NOT NULL,
    experience TEXT NOT NULL,
    rating NUMERIC DEFAULT 5.0,
    image_url TEXT,
    
    -- Authentication & User Management
    email TEXT UNIQUE,
    password TEXT,  -- Should be hashed in production
    username TEXT UNIQUE,
    phone_number TEXT,
    
    -- Location & Assignment
    district TEXT,
    city TEXT,
    state TEXT,
    address TEXT,
    responsible_branch_state TEXT,
    
    -- Additional Details
    date_of_birth DATE,
    aadhar_number TEXT,
    pan_number TEXT,
    status TEXT CHECK (status IN ('Active', 'Inactive')) DEFAULT 'Active',
    
    -- Timestamps & Audit Trail
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMPTZ,  -- Soft delete timestamp (NULL = active, NOT NULL = deleted)
    created_by UUID REFERENCES lawyers(id),  -- User who created the record
    updated_by UUID REFERENCES lawyers(id),  -- User who last updated the record
    deleted_by UUID REFERENCES lawyers(id)   -- User who deleted the record
);
```

**Purpose**: Master table for all lawyer information, authentication, and district assignments.

**Key Fields**:
- `district`: Links lawyer to district for case assignment
- `username`: Unique login identifier (typically district code + number)
- `status`: Active/Inactive status for access control

---

### 2. **appointments** (Transaction Table)
Main transaction table storing all case/appointment information.

```sql
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Client Information
    full_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    email_id TEXT NOT NULL,
    address TEXT,
    city TEXT,  -- District name
    city_name TEXT,  -- City name (optional)
    state TEXT,
    client_id TEXT,
    client_type TEXT CHECK (client_type IN ('Individual', 'Company')),
    
    -- Appointment Details
    appointment_date DATE NOT NULL,
    time_slot TEXT NOT NULL,
    consultation_type TEXT CHECK (consultation_type IN ('In-Person', 'Online', 'Phone')) NOT NULL,
    already_come TEXT CHECK (already_come IN ('Yes', 'No')) DEFAULT 'No',
    
    -- Case Information
    case_id TEXT,
    case_title TEXT,
    case_type TEXT,
    case_category TEXT NOT NULL,
    other_category TEXT,
    description TEXT,
    case_status TEXT CHECK (case_status IN ('Open', 'Pending', 'Closed', 'Appeal')),
    case_stage TEXT DEFAULT 'Inquiry',  -- Inquiry, Verified, Payment, Litigation, History, Disposed
    case_priority TEXT CHECK (case_priority IN ('High', 'Medium', 'Low')),
    stage_of_case TEXT CHECK (stage_of_case IN ('Evidence', 'Argument', 'Judgment')),
    
    -- Court & Legal Details
    court_name TEXT,
    filing_date DATE,
    last_hearing_date DATE,
    court_hearing_date DATE,
    current_hearing_report TEXT,
    next_hearing_date DATE,
    hearing_updated_by UUID REFERENCES lawyers(id),
    hearing_updated_at TIMESTAMPTZ,
    
    -- Lawyer Assignment
    lawyer_id UUID REFERENCES lawyers(id),
    assigned_advocate TEXT,
    branch_name TEXT,
    branch_location TEXT,
    
    -- Financial Information
    consultation_fee NUMERIC DEFAULT 0,
    case_fee NUMERIC DEFAULT 0,
    total_fee NUMERIC,
    paid_amount NUMERIC,
    balance_amount NUMERIC,
    fee_type TEXT CHECK (fee_type IN ('Fixed', 'Stage-wise')),
    payment_status TEXT,
    payment_mode TEXT,
    transaction_id TEXT,
    payment_date TIMESTAMPTZ,
    
    -- Documents & Status
    document_url TEXT,
    documents_status TEXT CHECK (documents_status IN ('Uploaded', 'Pending')),
    important_notes TEXT,
    status TEXT CHECK (status IN ('Pending', 'Approved', 'Rejected')) DEFAULT 'Pending',
    rejection_reason TEXT,
    
    -- Timestamps & Audit Trail
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMPTZ,  -- Soft delete timestamp (NULL = active, NOT NULL = deleted)
    created_by UUID REFERENCES lawyers(id),  -- User who created the record
    updated_by UUID REFERENCES lawyers(id),  -- User who last updated the record
    deleted_by UUID REFERENCES lawyers(id)   -- User who deleted the record
);
```

**Purpose**: Central transaction table managing entire case lifecycle from inquiry to disposal.

**Case Stage Flow**:
```
Inquiry → Verified → Payment → Litigation → History/Disposed
```

**Relationships**:
- `lawyer_id` → `lawyers.id` (Many-to-One)
- `hearing_updated_by` → `lawyers.id` (Many-to-One)

---

### 3. **client_appointments** (Transaction Table)
Stores public appointment requests before admin approval.

```sql
CREATE TABLE client_appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Client Information
    full_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    email_id TEXT NOT NULL,
    address TEXT,
    state TEXT,
    district TEXT,
    already_come TEXT CHECK (already_come IN ('Yes', 'No')) DEFAULT 'No',
    
    -- Appointment Details
    appointment_date DATE NOT NULL,
    time_slot TEXT NOT NULL,
    consultation_type TEXT CHECK (consultation_type IN ('In-Person', 'Online (Video)', 'Phone')) NOT NULL,
    
    -- Case Information
    case_category TEXT NOT NULL,
    description TEXT,
    document_url TEXT,
    
    -- Status & Assignment
    status TEXT CHECK (status IN ('Pending', 'Approved', 'Rejected')) DEFAULT 'Pending',
    rejection_reason TEXT,
    lawyer_id UUID REFERENCES lawyers(id),
    case_id TEXT,
    
    -- Timestamps & Audit Trail
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMPTZ,  -- Soft delete timestamp (NULL = active, NOT NULL = deleted)
    created_by UUID REFERENCES lawyers(id),  -- User who created the record
    updated_by UUID REFERENCES lawyers(id),  -- User who last updated the record
    deleted_by UUID REFERENCES lawyers(id)   -- User who deleted the record
);
```

**Purpose**: Temporary storage for public appointment requests. Once approved, data should ideally be moved to `appointments` table or referenced.

**Workflow**:
```
Public Form → client_appointments → Admin Review → appointments (if approved)
```

---

### 4. **payments** (Transaction Table)
Stores all payment transaction records.

```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES appointments(id),
    case_id TEXT,
    client_name TEXT,
    
    -- Payment Details
    consultation_fee NUMERIC DEFAULT 0,
    due_fee NUMERIC DEFAULT 0,
    amount NUMERIC DEFAULT 0,  -- Total: consultation_fee + due_fee
    payment_mode TEXT NOT NULL,  -- Cash, Online, Cheque
    transaction_id TEXT,  -- For Online (txn_id) or Cheque (bank - num)
    
    -- Timestamps & Audit Trail
    payment_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMPTZ,  -- Soft delete timestamp (NULL = active, NOT NULL = deleted)
    created_by UUID REFERENCES lawyers(id),  -- User who created the record
    updated_by UUID REFERENCES lawyers(id),  -- User who last updated the record
    deleted_by UUID REFERENCES lawyers(id)   -- User who deleted the record
);
```

**Purpose**: Transactional record of all payments. One appointment can have multiple payment records for partial payments.

**Relationships**:
- `appointment_id` → `appointments.id` (Many-to-One)

---

## 🗑 Soft Delete & Timestamp Management

### Overview

The system implements **Soft Delete** pattern for all tables instead of hard deletes. This ensures:
- **Data Preservation**: Deleted records are retained for audit and recovery
- **Referential Integrity**: Foreign key relationships remain intact
- **Audit Trail**: Complete history of all operations
- **Data Recovery**: Ability to restore accidentally deleted records

### Soft Delete Pattern

#### Core Concept

Instead of physically deleting records with `DELETE`, records are marked as deleted by setting `deleted_at` timestamp:

```sql
-- Hard Delete (DON'T USE)
DELETE FROM appointments WHERE id = 'xxx';

-- Soft Delete (USE THIS)
UPDATE appointments 
SET deleted_at = NOW(), deleted_by = 'user_uuid'
WHERE id = 'xxx';
```

#### Timestamp Fields

All tables include standard timestamp and audit fields:

| Field | Type | Purpose |
|-------|------|---------|
| `created_at` | TIMESTAMPTZ | Record creation timestamp (NOT NULL) |
| `updated_at` | TIMESTAMPTZ | Last update timestamp (NOT NULL, auto-updated) |
| `deleted_at` | TIMESTAMPTZ | Soft delete timestamp (NULL = active, NOT NULL = deleted) |
| `created_by` | UUID | User who created the record (FK to lawyers) |
| `updated_by` | UUID | User who last updated the record (FK to lawyers) |
| `deleted_by` | UUID | User who deleted the record (FK to lawyers) |

### Implementation Pattern

#### 1. **Querying Active Records**

Always filter out soft-deleted records in queries:

```sql
-- ✅ CORRECT: Get only active records
SELECT * FROM appointments 
WHERE deleted_at IS NULL;

-- ❌ WRONG: Gets deleted records too
SELECT * FROM appointments;
```

#### 2. **Querying All Records (Including Deleted)**

For admin/reporting purposes, explicitly include deleted records:

```sql
-- Get all records including deleted
SELECT * FROM appointments 
WHERE deleted_at IS NULL OR deleted_at IS NOT NULL;

-- Or simply:
SELECT * FROM appointments;
-- (But always prefer explicit WHERE for clarity)
```

#### 3. **Soft Delete Operation**

```sql
-- Soft delete a record
UPDATE appointments 
SET 
    deleted_at = NOW(),
    deleted_by = 'current_user_uuid',
    updated_at = NOW(),
    updated_by = 'current_user_uuid'
WHERE id = 'record_id' 
AND deleted_at IS NULL;  -- Prevent re-deletion
```

#### 4. **Restore Deleted Record**

```sql
-- Restore a soft-deleted record
UPDATE appointments 
SET 
    deleted_at = NULL,
    deleted_by = NULL,
    updated_at = NOW(),
    updated_by = 'current_user_uuid'
WHERE id = 'record_id' 
AND deleted_at IS NOT NULL;
```

#### 5. **Hard Delete (Permanent)**

Only for GDPR compliance or legal requirements:

```sql
-- Hard delete (permanent - use with caution)
DELETE FROM appointments 
WHERE id = 'record_id' 
AND deleted_at IS NOT NULL;  -- Only delete already soft-deleted records
```

### Database Functions & Triggers

#### Auto-Update `updated_at` Trigger

All tables should have a trigger to automatically update `updated_at`:

```sql
-- Function to handle updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for appointments table
DROP TRIGGER IF EXISTS set_appointments_updated_at ON appointments;
CREATE TRIGGER set_appointments_updated_at
BEFORE UPDATE ON appointments
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();

-- Apply to all tables
CREATE TRIGGER set_lawyers_updated_at BEFORE UPDATE ON lawyers FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_client_appointments_updated_at BEFORE UPDATE ON client_appointments FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
```

#### Index for Soft Delete Queries

For performance, create indexes on `deleted_at`:

```sql
-- Index for faster active record queries
CREATE INDEX IF NOT EXISTS idx_appointments_deleted_at ON appointments(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lawyers_deleted_at ON lawyers(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_client_appointments_deleted_at ON client_appointments(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_payments_deleted_at ON payments(deleted_at) WHERE deleted_at IS NULL;
```

**Note**: Partial indexes (`WHERE deleted_at IS NULL`) are more efficient as they only index active records.

### Frontend Implementation

#### Query Functions (TypeScript)

**Location**: `src/utils/storage.ts`

```typescript
// Get active appointments (excludes soft-deleted)
export const getAppointments = async (): Promise<AppointmentRecord[]> => {
    const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .is('deleted_at', null)  // Only active records
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching appointments:', error);
        return [];
    }

    return (data || []).map(mapToCamelCase);
};

// Get all appointments including deleted (admin only)
export const getAllAppointments = async (includeDeleted: boolean = false): Promise<AppointmentRecord[]> => {
    let query = supabase
        .from('appointments')
        .select('*')
        .order('created_at', { ascending: false });

    if (!includeDeleted) {
        query = query.is('deleted_at', null);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching appointments:', error);
        return [];
    }

    return (data || []).map(mapToCamelCase);
};

// Soft delete appointment
export const softDeleteAppointment = async (id: string, deletedBy: string): Promise<void> => {
    const { error } = await supabase
        .from('appointments')
        .update({
            deleted_at: new Date().toISOString(),
            deleted_by: deletedBy,
            updated_at: new Date().toISOString(),
            updated_by: deletedBy
        })
        .eq('id', id)
        .is('deleted_at', null);  // Only update if not already deleted

    if (error) {
        console.error('Error soft deleting appointment:', error);
        throw error;
    }
};

// Restore soft-deleted appointment
export const restoreAppointment = async (id: string, restoredBy: string): Promise<void> => {
    const { error } = await supabase
        .from('appointments')
        .update({
            deleted_at: null,
            deleted_by: null,
            updated_at: new Date().toISOString(),
            updated_by: restoredBy
        })
        .eq('id', id)
        .not('deleted_at', 'is', null);  // Only restore if deleted

    if (error) {
        console.error('Error restoring appointment:', error);
        throw error;
    }
};

// Create appointment with audit fields
export const saveAppointment = async (
    appointment: Omit<AppointmentRecord, 'id' | 'status' | 'createdAt'>, 
    createdBy: string
): Promise<AppointmentRecord> => {
    const { data, error } = await supabase
        .from('appointments')
        .insert([{ 
            ...mapToSnakeCase(appointment), 
            status: 'Pending',
            created_by: createdBy,
            updated_by: createdBy
        }])
        .select();

    if (error) {
        console.error('Error saving appointment:', error);
        throw error;
    }

    return mapToCamelCase(data[0]);
};
```

### Master Table Considerations

#### Soft Delete in Master Tables

Master tables (like `lawyers`, `districts`, `case_categories`) should also use soft delete:

- **Lawyers**: When a lawyer leaves, soft delete instead of hard delete to preserve case history
- **Districts**: Districts should never be hard deleted (historical data)
- **Case Categories**: Soft delete obsolete categories, keep for historical records

#### Cascading Soft Delete Behavior

When a master record is soft-deleted:

```sql
-- Option 1: Prevent deletion if referenced
-- Check for active references before allowing delete
SELECT COUNT(*) FROM appointments 
WHERE lawyer_id = 'xxx' 
AND deleted_at IS NULL;  -- Only check active references

-- Option 2: Cascade soft delete (if business logic allows)
-- When lawyer is deleted, soft delete all their cases
UPDATE appointments 
SET deleted_at = NOW(), deleted_by = 'user_uuid'
WHERE lawyer_id = 'deleted_lawyer_id'
AND deleted_at IS NULL;

-- Option 3: Set to NULL (orphan records)
UPDATE appointments 
SET lawyer_id = NULL, updated_at = NOW()
WHERE lawyer_id = 'deleted_lawyer_id';
```

**Recommended**: Use **Option 1** (prevent deletion) for data integrity.

### Migration Script

**File**: `add_soft_delete_timestamps.sql`

```sql
-- Add soft delete and audit trail columns to all tables
-- Run this in your Supabase SQL Editor

-- 1. Add columns to lawyers table
ALTER TABLE lawyers 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES lawyers(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES lawyers(id),
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES lawyers(id);

-- 2. Add columns to appointments table
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES lawyers(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES lawyers(id),
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES lawyers(id);

-- 3. Add columns to client_appointments table
ALTER TABLE client_appointments 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES lawyers(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES lawyers(id),
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES lawyers(id);

-- 4. Add columns to payments table
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES lawyers(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES lawyers(id),
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES lawyers(id);

-- 5. Ensure created_at and updated_at are NOT NULL
ALTER TABLE lawyers ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE lawyers ALTER COLUMN updated_at SET NOT NULL;
ALTER TABLE appointments ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE appointments ALTER COLUMN updated_at SET NOT NULL;
ALTER TABLE client_appointments ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE client_appointments ALTER COLUMN updated_at SET NOT NULL;

-- 6. Create indexes for soft delete queries
CREATE INDEX IF NOT EXISTS idx_lawyers_deleted_at ON lawyers(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_deleted_at ON appointments(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_client_appointments_deleted_at ON client_appointments(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_payments_deleted_at ON payments(deleted_at) WHERE deleted_at IS NULL;

-- 7. Create updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create triggers for updated_at
DROP TRIGGER IF EXISTS set_lawyers_updated_at ON lawyers;
CREATE TRIGGER set_lawyers_updated_at
BEFORE UPDATE ON lawyers
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS set_appointments_updated_at ON appointments;
CREATE TRIGGER set_appointments_updated_at
BEFORE UPDATE ON appointments
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS set_client_appointments_updated_at ON client_appointments;
CREATE TRIGGER set_client_appointments_updated_at
BEFORE UPDATE ON client_appointments
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS set_payments_updated_at ON payments;
CREATE TRIGGER set_payments_updated_at
BEFORE UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();

-- 9. Create function to get active records count
CREATE OR REPLACE FUNCTION get_active_count(table_name TEXT)
RETURNS BIGINT AS $$
DECLARE
    result BIGINT;
BEGIN
    EXECUTE format('SELECT COUNT(*) FROM %I WHERE deleted_at IS NULL', table_name) INTO result;
    RETURN result;
END;
$$ LANGUAGE plpgsql;
```

### Best Practices

#### 1. **Always Filter Active Records**

```typescript
// ✅ GOOD
const activeLawyers = await supabase
    .from('lawyers')
    .select('*')
    .is('deleted_at', null);

// ❌ BAD
const allLawyers = await supabase
    .from('lawyers')
    .select('*');
```

#### 2. **Update Audit Fields on Changes**

```typescript
// When updating, always set updated_by
await supabase
    .from('appointments')
    .update({
        status: 'Approved',
        updated_by: currentUserId  // Always track who made the change
    })
    .eq('id', appointmentId);
```

#### 3. **Check Before Soft Delete**

```typescript
// Check for dependencies before deleting
const activeCases = await supabase
    .from('appointments')
    .select('id')
    .eq('lawyer_id', lawyerId)
    .is('deleted_at', null);

if (activeCases.data && activeCases.data.length > 0) {
    throw new Error('Cannot delete lawyer with active cases');
}
```

#### 4. **Permanent Delete Policy**

- Only admins can permanently delete records
- Only delete records older than retention period (e.g., 7 years)
- Maintain backup before permanent deletion
- Log all permanent deletions in audit table

### Retention Policy

```sql
-- Archive or permanently delete records older than retention period
-- Run as scheduled job (e.g., monthly)

-- Example: Permanently delete soft-deleted records older than 7 years
DELETE FROM appointments 
WHERE deleted_at IS NOT NULL 
AND deleted_at < NOW() - INTERVAL '7 years';

-- Or archive to separate table before deleting
INSERT INTO appointments_archive 
SELECT * FROM appointments 
WHERE deleted_at IS NOT NULL 
AND deleted_at < NOW() - INTERVAL '7 years';

DELETE FROM appointments 
WHERE deleted_at IS NOT NULL 
AND deleted_at < NOW() - INTERVAL '7 years';
```

---

## 🏗 Backend Architecture

### Supabase Configuration

**Location**: `src/utils/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder'
);
```

### Data Access Layer

**Location**: `src/utils/storage.ts`

This file contains all database interaction functions:

#### Lawyer Management
- `getLawyers()`: Fetch all active lawyers (excludes soft-deleted)
- `getAllLawyers(includeDeleted)`: Fetch all lawyers including deleted (admin only)
- `assignLawyer(appointmentId, lawyerId, userId)`: Assign lawyer to case (tracks updated_by)
- `softDeleteLawyer(id, deletedBy)`: Soft delete lawyer
- `restoreLawyer(id, restoredBy)`: Restore soft-deleted lawyer

#### Appointment Management
- `getAppointments()`: Fetch all active appointments (excludes soft-deleted)
- `getAllAppointments(includeDeleted)`: Fetch all appointments including deleted (admin only)
- `saveAppointment(appointment, createdBy)`: Create new appointment (tracks created_by)
- `updateAppointmentStatus(id, status, rejectionReason, updatedBy)`: Update appointment status (tracks updated_by)
- `updateCaseId(id, caseId, updatedBy)`: Assign case ID (tracks updated_by)
- `updateCaseStage(id, stage, updatedBy)`: Update case stage (tracks updated_by)
- `updateHearingDetails(..., updatedBy)`: Update hearing information (tracks updated_by)
- `softDeleteAppointment(id, deletedBy)`: Soft delete appointment
- `restoreAppointment(id, restoredBy)`: Restore soft-deleted appointment
- `uploadDocument(file)`: Upload documents to Supabase Storage

#### Client Appointments
- `getClientAppointments()`: Fetch active public appointment requests (excludes soft-deleted)
- `getAllClientAppointments(includeDeleted)`: Fetch all including deleted (admin only)
- `saveClientAppointment(appointment, createdBy)`: Create client appointment (tracks created_by)
- `updateClientAppointmentStatus(id, status, rejectionReason, updatedBy)`: Update status (tracks updated_by)
- `softDeleteClientAppointment(id, deletedBy)`: Soft delete client appointment

#### Payment Management
- `getPaymentHistory()`: Fetch all active payment records (excludes soft-deleted)
- `getAllPaymentHistory(includeDeleted)`: Fetch all including deleted (admin only)
- `updateAppointmentPayment(..., createdBy)`: Record payment and update appointment fees (tracks created_by)
- `softDeletePayment(id, deletedBy)`: Soft delete payment record

### Email Service

**Location**: `src/utils/emailService.ts`

- `sendApprovalEmail(email, name, appointmentDate)`: Send appointment approval emails via EmailJS

---

## 🎨 Frontend Architecture

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   ├── CallButton.tsx
│   ├── LegalLogo.tsx
│   └── ScrollToTop.tsx
├── pages/              # Page components
│   ├── Home.tsx
│   ├── Appointment.tsx
│   ├── ClientAppointment.tsx
│   ├── CaseCounselling.tsx
│   ├── CaseFinder.tsx
│   ├── Reports.tsx
│   ├── PaymentPage.tsx
│   ├── AdminLogin.tsx
│   ├── AdminDashboard.tsx
│   ├── LawyerLogin.tsx
│   └── Placeholder.tsx
├── utils/              # Utilities & API layer
│   ├── supabase.ts
│   ├── storage.ts
│   └── emailService.ts
├── assets/             # Static assets
│   ├── img.jpg
│   ├── banner.avif
│   └── hero-legal.png
├── App.tsx             # Main app component & routing
├── main.tsx            # App entry point
└── index.css           # Global styles
```

### Routing Structure

**Location**: `src/App.tsx`

```typescript
Routes:
├── /                          → Redirects to /client-appointment
├── /client-appointment        → Public appointment booking
├── /appointment               → Internal appointment form
├── /admin/login              → Admin login
├── /admin                    → Admin dashboard
├── /admin/payment/:id        → Payment collection page
├── /lawyer/login             → Lawyer login
└── /lawyer/case-finder       → Lawyer case finder
```

### Key Pages

#### 1. AdminDashboard.tsx
- **Purpose**: Central admin control panel
- **Features**:
  - Case lifecycle management (Inquiry → Disposed)
  - Lawyer assignment
  - Payment collection and reporting
  - District-wise case filtering
  - Hearing date management
  - User management
- **Case Stages**: Inquiry, Verified, Payment, Litigation, History, Disposed

#### 2. LawyerLogin.tsx
- **Purpose**: Lawyer authentication
- **Features**:
  - Username/password login
  - Credentials display with auto-fill
  - Add new credentials functionality
  - District-based access

#### 3. CaseFinder.tsx
- **Purpose**: Lawyer portal for viewing assigned cases
- **Features**:
  - View cases assigned to logged-in lawyer
  - Filter by case stage
  - View case details
  - Update hearing information

#### 4. ClientAppointment.tsx
- **Purpose**: Public-facing appointment booking form
- **Features**:
  - Client information form
  - Document upload
  - Appointment scheduling

---

## 🔄 API & Data Flow

### Authentication Flow

```
1. User accesses /lawyer/login or /admin/login
2. Enter credentials (username/password)
3. Frontend queries: SELECT * FROM lawyers WHERE username = ? AND password = ?
4. On success: Store lawyer info in session/localStorage
5. Redirect to respective dashboard
```

### Appointment Creation Flow

```
Public Form (ClientAppointment.tsx)
    ↓
saveClientAppointment()
    ↓
INSERT INTO client_appointments
    ↓
Admin Dashboard → Review Request
    ↓
If Approved:
    - saveAppointment() → INSERT INTO appointments
    - OR updateClientAppointmentStatus('Approved')
    - Send approval email
```

### Case Lifecycle Flow

```
1. Inquiry Stage
   - Appointment created/approved
   - case_stage = 'Inquiry'

2. Verified Stage
   - Admin verifies client details
   - Admin assigns lawyer
   - updateCaseStage('Verified')

3. Payment Stage
   - Admin collects consultation fee
   - updateAppointmentPayment(...)
   - INSERT INTO payments
   - updateCaseStage('Payment')

4. Litigation Stage
   - Admin assigns case ID
   - updateCaseId(id, caseId)
   - updateCaseStage('Litigation')
   - Admin/Lawyer updates hearing dates

5. History/Disposed Stage
   - Case closed or disposed
   - updateCaseStage('History' or 'Disposed')
```

### Payment Flow

```
Admin Dashboard → Payment Tab
    ↓
Select Pending Payment
    ↓
Enter Payment Details (Mode, Amount, Txn ID)
    ↓
updateAppointmentPayment()
    ├── UPDATE appointments (fees)
    └── INSERT INTO payments (transaction record)
    ↓
Payment recorded in history
```

---

## 📋 Master Tables Design

### Recommended Master Tables (Not Yet Implemented)

The system currently hardcodes many values in the UI. For better data integrity and maintainability, these should be master tables:

#### 1. **districts** (Proposed Master Table)
```sql
CREATE TABLE districts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    short_code TEXT NOT NULL UNIQUE,  -- e.g., 'CHN' for Chennai
    state TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Current State**: Districts are hardcoded in `AdminDashboard.tsx` as `tamilNaduDistricts` array.

**Benefits**:
- Centralized district management
- Easy to add/remove districts
- District-code mapping stored in DB
- Supports multiple states

#### 2. **case_categories** (Proposed Master Table)
```sql
CREATE TABLE case_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Current State**: Hardcoded in UI components.

**Benefits**:
- Dynamic category management
- Easy to add new categories without code changes
- Category descriptions and metadata

#### 3. **case_stages** (Proposed Master Table)
```sql
CREATE TABLE case_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,  -- 'INQUIRY', 'VERIFIED', etc.
    name TEXT NOT NULL,
    display_order INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    next_stages UUID[],  -- Allowed transitions
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Current State**: Hardcoded as `'Inquiry' | 'Verified' | 'Payment' | 'Litigation' | 'History' | 'Disposed'`

**Benefits**:
- Stage workflow management
- Define allowed stage transitions
- Stage descriptions and metadata

#### 4. **payment_modes** (Proposed Master Table)
```sql
CREATE TABLE payment_modes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,  -- 'CASH', 'ONLINE', 'CHEQUE'
    name TEXT NOT NULL,
    requires_transaction_id BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Current State**: Hardcoded as `'Cash' | 'Online' | 'Cheque'`

#### 5. **specializations** (Proposed Master Table)
```sql
CREATE TABLE specializations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Current State**: Hardcoded in lawyer forms.

---

## 🔄 Application Flow

### User Roles & Access

#### 1. **Public User**
```
Access: /client-appointment
Actions:
- Create appointment request
- Upload documents
- View confirmation
```

#### 2. **Admin User**
```
Access: /admin (after login)
Actions:
- View all appointments and cases
- Approve/Reject appointments
- Assign lawyers to cases
- Manage case stages
- Collect payments
- Generate reports
- Manage lawyers and districts
- Update hearing dates
```

#### 3. **Lawyer User**
```
Access: /lawyer/case-finder (after login)
Actions:
- View assigned cases
- Filter by case stage
- Update hearing information
- View case details
```

### Case Workflow

```
┌─────────────────┐
│ Public Request  │
│ (Client Form)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ client_         │
│ appointments    │
│ (Pending)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Admin Review    │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
Approved   Rejected
    │
    ▼
┌─────────────────┐
│ appointments    │
│ Stage: Inquiry  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Admin: Verify   │
│ Assign Lawyer   │
│ Stage: Verified │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Payment         │
│ Collection      │
│ Stage: Payment  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Assign Case ID  │
│ Stage:          │
│ Litigation      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Case Management │
│ - Hearings      │
│ - Updates       │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
 History   Disposed
```

---

## 🚀 Recommended Improvements

### 1. **Implement Master Tables**
- Create `districts`, `case_categories`, `case_stages`, `payment_modes`, `specializations` tables
- Migrate hardcoded values to database
- Add admin UI for managing master data

### 2. **Row Level Security (RLS)**
Currently RLS is disabled. For production:
- Enable RLS on all tables
- Create policies for:
  - Lawyers can only see their assigned cases
  - Admins can see all data
  - Public users can only create appointments

### 3. **Password Security**
- Implement password hashing (bcrypt/argon2)
- Add password reset functionality
- Enforce password complexity rules

### 4. **Audit Trail** (Enhanced with Soft Delete)
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'RESTORE')),
    old_values JSONB,
    new_values JSONB,
    user_id UUID REFERENCES lawyers(id),
    ip_address TEXT,
    user_agent TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMPTZ,  -- Soft delete for audit logs too
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for faster audit queries
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_deleted_at ON audit_logs(deleted_at) WHERE deleted_at IS NULL;
```

**Note**: Audit logs should also use soft delete pattern. Never hard delete audit logs.

### 5. **Document Management**
- Organize documents by case_id
- Version control for documents
- Document type categorization

### 6. **Notification System**
- In-app notifications
- Email notifications for status changes
- SMS notifications for appointments

### 7. **Reporting & Analytics**
- Dashboard with charts
- Export reports (PDF, Excel)
- Financial reports (income, pending payments)
- Case statistics by district/lawyer

### 8. **API Versioning**
- Separate API layer from frontend
- RESTful API endpoints
- API documentation (OpenAPI/Swagger)

### 9. **Testing**
- Unit tests for utility functions
- Integration tests for database operations
- E2E tests for critical workflows

### 10. **Performance Optimization**
- Database indexing on frequently queried columns
- Pagination for large lists
- Caching for master data
- Lazy loading for heavy components

---

## 📝 Database Migration Order

If setting up from scratch, run SQL files in this order:

1. `schema.sql` - Base tables (lawyers, appointments)
2. `setup_database.sql` - Payments table and column additions
3. `add_user_schema.sql` - Lawyer authentication fields
4. `add_comprehensive_appointment_fields.sql` - Extended case fields
5. `add_hearing_columns.sql` - Hearing management fields
6. `add_city_column.sql` - City name field
7. `create_client_appointments_table.sql` - Public appointments table
8. `add_soft_delete_timestamps.sql` - **Soft delete columns and triggers** (CRITICAL)
9. Master tables (when implemented)

---

## 🔐 Security Considerations

### Current State
- RLS disabled (development mode)
- Plain text passwords (should be hashed)
- No API rate limiting
- No input validation on backend

### Production Checklist
- [ ] Enable RLS with proper policies
- [ ] Hash all passwords
- [ ] Implement input validation
- [ ] Add API rate limiting
- [ ] SSL/TLS for all connections
- [ ] Regular security audits
- [ ] Backup strategy
- [ ] Environment variable management
- [ ] Implement soft delete pattern (all tables)
- [ ] Add audit trail columns (created_by, updated_by, deleted_by)
- [ ] Create indexes for soft delete queries
- [ ] Set up updated_at triggers on all tables
- [ ] Implement retention policy for deleted records

---

## 📚 Additional Notes

### Case ID Generation
Currently, case IDs are manually entered. Recommended format:
```
{district_code}{year}{sequential_number}
Example: CHN2024001, MDU2024002
```

### District Code Mapping
Currently hardcoded in `AdminDashboard.tsx`. Should be in `districts` master table.

### Payment Modes
- **Cash**: No transaction ID required
- **Online**: Transaction ID (UPI/Net Banking) required
- **Cheque**: Transaction ID = Bank name + Cheque number

### Status vs Stage
- **status**: Appointment approval status (`Pending`, `Approved`, `Rejected`)
- **case_stage**: Case workflow stage (`Inquiry`, `Verified`, `Payment`, `Litigation`, `History`, `Disposed`)

---

## 📞 Support & Maintenance

### Environment Variables Required
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_EMAILJS_SERVICE_ID=your_emailjs_service_id
VITE_EMAILJS_TEMPLATE_ID=your_emailjs_template_id
VITE_EMAILJS_PUBLIC_KEY=your_emailjs_public_key
```

### Database Backups
- Regular automated backups recommended
- Backup before major migrations
- Test restore procedures

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Maintained By**: Development Team

