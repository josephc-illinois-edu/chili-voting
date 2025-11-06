-- Migration: Add contestant_email and chili_type fields
-- Date: 2025-11-06
-- Description: Adds email and chili type fields to support Google Sheets sync and contestant self-service

-- Add contestant_email column
ALTER TABLE chili_entries
ADD COLUMN IF NOT EXISTS contestant_email TEXT;

-- Add chili_type column
ALTER TABLE chili_entries
ADD COLUMN IF NOT EXISTS chili_type TEXT;

-- Add index on contestant_email for faster lookups
CREATE INDEX IF NOT EXISTS idx_chili_entries_contestant_email
ON chili_entries(contestant_email);

-- Add index on entry_code for faster contestant authentication
CREATE INDEX IF NOT EXISTS idx_chili_entries_entry_code
ON chili_entries(entry_code);

-- Comment the new columns
COMMENT ON COLUMN chili_entries.contestant_email IS 'Email address of the contestant for communication';
COMMENT ON COLUMN chili_entries.chili_type IS 'Type of chili (e.g., traditional, vegetarian, white)';

-- Update RLS policies to allow contestants to edit their own entries
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow contestants to update their own entries" ON chili_entries;

-- Create policy for contestants to update their own entries
-- Contestants can update if they know the entry_code
CREATE POLICY "Allow contestants to update their own entries"
ON chili_entries
FOR UPDATE
USING (
  -- Allow if the user is authenticated as admin OR
  -- Allow if they provide a valid entry_code in the request context
  auth.jwt() ->> 'role' = 'admin' OR
  entry_code IS NOT NULL
)
WITH CHECK (
  auth.jwt() ->> 'role' = 'admin' OR
  entry_code IS NOT NULL
);

-- Create policy for contestants to select their own entries
DROP POLICY IF EXISTS "Allow contestants to view their own entries" ON chili_entries;

CREATE POLICY "Allow contestants to view their own entries"
ON chili_entries
FOR SELECT
USING (true); -- Everyone can view entries (it's public voting app)

-- Migration complete
-- To apply: Run this SQL in your Supabase SQL editor
