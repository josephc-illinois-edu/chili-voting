-- Add device tracking columns to votes table
-- This enables multi-layer ballot stuffing prevention

-- Add device fingerprint column
ALTER TABLE votes ADD COLUMN IF NOT EXISTS device_fingerprint TEXT;

-- Add IP address column
ALTER TABLE votes ADD COLUMN IF NOT EXISTS ip_address INET;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_votes_fingerprint_chili ON votes(device_fingerprint, chili_id);
CREATE INDEX IF NOT EXISTS idx_votes_ip_chili ON votes(ip_address, chili_id);

-- Verify the changes
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'votes'
ORDER BY ordinal_position;
