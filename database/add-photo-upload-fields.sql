-- Migration: Add photo upload and entry code fields
-- This adds support for entrant photo uploads and unique entry codes

-- Add new columns to chili_entries table
ALTER TABLE chili_entries
ADD COLUMN IF NOT EXISTS entry_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS photo_uploaded_at TIMESTAMPTZ;

-- Create index on entry_code for fast lookups
CREATE INDEX IF NOT EXISTS idx_chili_entries_entry_code ON chili_entries(entry_code);

-- Add comment for documentation
COMMENT ON COLUMN chili_entries.entry_code IS 'Unique code for entrant access (format: CHILI-XXXX)';
COMMENT ON COLUMN chili_entries.photo_url IS 'Supabase Storage URL for chili photo';
COMMENT ON COLUMN chili_entries.photo_uploaded_at IS 'Timestamp when photo was uploaded';
