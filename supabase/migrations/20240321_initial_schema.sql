-- 1. CLEANUP: Remove old conflicting tables (in correct dependency order)
DROP TABLE IF EXISTS public.work_logs CASCADE;
DROP TABLE IF EXISTS public.jobs CASCADE;
DROP TABLE IF EXISTS public.attendance_logs CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.employees CASCADE;

-- 2. SETUP: Create the new Unified Schema
-- Employees Table (using UUID)
CREATE TABLE public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('employee', 'admin')) DEFAULT 'employee',
    hourly_rate NUMERIC(10, 2) DEFAULT 0.00,
    status TEXT NOT NULL CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Customers Table
CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Attendance Logs Table
CREATE TABLE public.attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    check_in_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    check_out_time TIMESTAMPTZ,
    check_in_lat NUMERIC(10, 7),
    check_in_lng NUMERIC(10, 7),
    check_out_lat NUMERIC(10, 7),
    check_out_lng NUMERIC(10, 7),
    total_hours NUMERIC(10, 2),
    source TEXT DEFAULT 'web' CHECK (source IN ('web', 'app', 'admin')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Jobs Table
CREATE TABLE public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'in-progress', 'completed', 'cancelled')) DEFAULT 'pending',
    scheduled_date DATE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Work Logs Table
CREATE TABLE public.work_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    check_in_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    check_out_time TIMESTAMPTZ,
    total_hours NUMERIC(10, 2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Triggers for automatic calculations
CREATE OR REPLACE FUNCTION calculate_hours()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.check_out_time IS NOT NULL AND NEW.check_in_time IS NOT NULL THEN
        NEW.total_hours := EXTRACT(EPOCH FROM (NEW.check_out_time - NEW.check_in_time)) / 3600;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calculate_attendance_hours BEFORE INSERT OR UPDATE ON public.attendance_logs FOR EACH ROW EXECUTE FUNCTION calculate_hours();
CREATE TRIGGER trg_calculate_work_hours BEFORE INSERT OR UPDATE ON public.work_logs FOR EACH ROW EXECUTE FUNCTION calculate_hours();
