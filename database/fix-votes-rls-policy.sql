-- Fix for votes insertion issue
-- This adds the RLS policies needed for anonymous voting

-- First, check what policies exist
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'votes';

-- Add policy to allow anonymous INSERT on votes
-- Note: This might already exist from the original SQL, but we're ensuring it's there
DROP POLICY IF EXISTS "Allow anonymous insert on votes" ON votes;
CREATE POLICY "Allow anonymous insert on votes" ON votes
    FOR INSERT WITH CHECK (true);

-- Add policy to allow anonymous SELECT on votes (for vote counting)
DROP POLICY IF EXISTS "Allow anonymous read on votes" ON votes;
CREATE POLICY "Allow anonymous read on votes" ON votes
    FOR SELECT USING (true);

-- Verify policies were created
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'votes';
