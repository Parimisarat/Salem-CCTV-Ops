-- 🔴 6. ADMIN AUDIT TRACE
-- Track source of change: updated_by and updated_at

-- Add columns to attendance_logs
ALTER TABLE public.attendance_logs ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.employees(id);
ALTER TABLE public.attendance_logs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Add columns to jobs
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.employees(id);
-- (updated_at already exists in jobs)

-- Add columns to customers
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.employees(id);
-- (updated_at already exists in customers)

-- Add columns to work_logs
ALTER TABLE public.work_logs ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.employees(id);
ALTER TABLE public.work_logs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 🔴 4. FORGOT CHECKOUT AUTO FIX (Edge Case Handling)
-- A function to auto-checkout sessions that are over 14 hours old
CREATE OR REPLACE FUNCTION auto_fix_forgotten_checkouts()
RETURNS void AS $$
BEGIN
    UPDATE public.attendance_logs
    SET 
        check_out_time = check_in_time + INTERVAL '8 hours',
        total_hours = 8.00,
        notes = 'Auto-checkout due to forgotten check-out (8h assumed)'
    WHERE check_out_time IS NULL 
      AND check_in_time < NOW() - INTERVAL '14 hours';
      
    UPDATE public.work_logs
    SET 
        check_out_time = check_in_time + INTERVAL '1 hours',
        total_hours = 1.00,
        notes = 'Auto-checkout due to forgotten check-out (1h assumed)'
    WHERE check_out_time IS NULL 
      AND check_in_time < NOW() - INTERVAL '14 hours';
END;
$$ LANGUAGE plpgsql;
