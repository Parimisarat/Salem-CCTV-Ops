-- Run this in your Supabase SQL Editor to populate the system with sample data

-- 1. Create Sample Customers
INSERT INTO public.customers (name, address, phone)
VALUES 
    ('Salem City Mall', '123 Main St, Salem', '111-222-3333'),
    ('Vape Store HQ', '456 West Ave, Salem', '444-555-6666');

-- 2. Create an Admin Employee
INSERT INTO public.employees (name, phone, role, hourly_rate, status)
VALUES ('Administrator', '999-888-7777', 'admin', 100.00, 'active');

-- 3. Create Sample Jobs and Assign them
-- This query assigns the first job to the first employee
WITH admin_emp AS (SELECT id FROM public.employees WHERE name = 'Administrator' LIMIT 1),
     customer_1 AS (SELECT id FROM public.customers WHERE name = 'Salem City Mall' LIMIT 1)
INSERT INTO public.jobs (customer_id, assigned_to, title, description, status, scheduled_date)
SELECT customer_1.id, admin_emp.id, 'CCTV Installation - West Wing', 'Install 4 new 4K cameras and DVR.', 'pending', CURRENT_DATE + INTERVAL '1 day'
FROM customer_1, admin_emp;
