-- Fix for chili entry insertion issue
-- This adds the missing RLS policy to allow INSERT on chili_entries table

-- Add policy to allow anyone to insert chili entries
-- In production, you should restrict this to admin users only
CREATE POLICY "Allow insert on chili_entries" ON chili_entries
    FOR INSERT WITH CHECK (true);

-- Optional: If you want to allow updates/deletes too (for admin panel)
CREATE POLICY "Allow update on chili_entries" ON chili_entries
    FOR UPDATE USING (true);

CREATE POLICY "Allow delete on chili_entries" ON chili_entries
    FOR DELETE USING (true);
