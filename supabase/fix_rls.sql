-- Run this in the Supabase SQL Editor to disable strict policies for testing

ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_logs DISABLE ROW LEVEL SECURITY;

-- If you prefer keeping RLS enabled but allowing all access, uncomment below:
-- CREATE POLICY "Allow all access" ON public.employees FOR ALL USING (true);
-- CREATE POLICY "Allow all access" ON public.customers FOR ALL USING (true);
-- CREATE POLICY "Allow all access" ON public.jobs FOR ALL USING (true);
-- CREATE POLICY "Allow all access" ON public.attendance_logs FOR ALL USING (true);
-- CREATE POLICY "Allow all access" ON public.work_logs FOR ALL USING (true);
