-- Run this script in your Supabase SQL Editor to populate the database with realistic sample data

DO $$
DECLARE
    emp_id UUID;
    cust1_id UUID;
    cust2_id UUID;
    cust3_id UUID;
    job_id1 UUID;
    job_id2 UUID;
BEGIN
    -- 1. Create a dummy employee for testing if none exists
    SELECT id INTO emp_id FROM public.employees WHERE role = 'employee' LIMIT 1;
    
    IF emp_id IS NULL THEN
        INSERT INTO public.employees (name, email, role, hourly_rate) 
        VALUES ('John Employee', 'john.employee@example.com', 'employee', 25.00) 
        RETURNING id INTO emp_id;
    END IF;

    -- 2. Create sample Customers
    INSERT INTO public.customers (name, phone, address)
    VALUES 
      ('TechCorp Solutions', '555-0101', '100 Silicon Ave, Suite A'),
      ('Downtown Cafe', '555-0202', '55 Main Street'),
      ('Warehouse Storage 5', '555-0303', 'Industrial Park Blvd');

    SELECT id INTO cust1_id FROM public.customers WHERE name = 'TechCorp Solutions' LIMIT 1;

    SELECT id INTO cust2_id FROM public.customers WHERE name = 'Downtown Cafe' LIMIT 1;
    SELECT id INTO cust3_id FROM public.customers WHERE name = 'Warehouse Storage 5' LIMIT 1;

    -- 3. Create sample Jobs assigned to the employee
    INSERT INTO public.jobs (customer_id, assigned_to, title, description, status, scheduled_date) 
    VALUES 
      (cust1_id, emp_id, 'Install NVR and 4 Cameras', 'Lobby area and main entrance setup', 'completed', CURRENT_DATE - INTERVAL '2 days')
    RETURNING id INTO job_id1;

    INSERT INTO public.jobs (customer_id, assigned_to, title, description, status, scheduled_date) 
    VALUES 
      (cust2_id, emp_id, 'Routine Maintenance', 'Clean lenses and test DVR backups', 'in-progress', CURRENT_DATE)
    RETURNING id INTO job_id2;

    INSERT INTO public.jobs (customer_id, assigned_to, title, description, status, scheduled_date) 
    VALUES 
      (cust3_id, NULL, 'Site Survey for Upgrade', 'Quote for adding 5 more cameras to the eastern fence.', 'pending', CURRENT_DATE + INTERVAL '2 days');

    -- 4. Create sample Attendance Logs (Last few days)
    INSERT INTO public.attendance_logs (employee_id, check_in_time, check_out_time, check_in_lat, check_in_lng, check_out_lat, check_out_lng, total_hours, source)
    VALUES 
      (emp_id, NOW() - INTERVAL '2 days' - INTERVAL '8 hours', NOW() - INTERVAL '2 days', 42.3601, -71.0589, 42.3601, -71.0589, 8.00, 'web'),
      (emp_id, NOW() - INTERVAL '1 day' - INTERVAL '7.5 hours', NOW() - INTERVAL '1 day', 42.3611, -71.0570, 42.3611, -71.0570, 7.50, 'web');

    -- 5. Create sample Work Logs (Time spent on Jobs)
    INSERT INTO public.work_logs (employee_id, job_id, check_in_time, check_out_time, total_hours)
    VALUES 
      (emp_id, job_id1, NOW() - INTERVAL '2 days' - INTERVAL '6 hours', NOW() - INTERVAL '2 days' - INTERVAL '2 hours', 4.00),
      (emp_id, job_id2, NOW() - INTERVAL '1 day' - INTERVAL '4 hours', NOW() - INTERVAL '1 day' - INTERVAL '2 hours', 2.00);

END $$;
