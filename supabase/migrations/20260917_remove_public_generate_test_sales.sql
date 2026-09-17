-- Remove the legacy public test-data generator and its executable surface.
drop function if exists public.generate_test_sales(integer);
