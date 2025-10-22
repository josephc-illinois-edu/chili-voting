-- Additional RLS policies for testing
-- Run this in your Supabase SQL editor to allow tests to create data

-- Allow anonymous users to insert chili entries with names starting with "Test"
CREATE POLICY "Allow test chili insertion" ON chili_entries
    FOR INSERT
    WITH CHECK (name LIKE 'Test%');

-- If you prefer to allow all anonymous inserts for testing (less secure but simpler):
-- DROP POLICY IF EXISTS "Allow test chili insertion" ON chili_entries;
-- CREATE POLICY "Allow anonymous insert on chili_entries" ON chili_entries
--     FOR INSERT WITH CHECK (true);
