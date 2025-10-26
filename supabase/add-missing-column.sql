-- Alternative: Add missing columns without dropping table
-- Use this if you have existing data you want to keep

-- Add anonymous_username column if it doesn't exist
ALTER TABLE IF EXISTS pseudonyms 
ADD COLUMN IF NOT EXISTS anonymous_username TEXT;

-- Make it NOT NULL after adding data or set a default
-- First, populate existing rows with anonymous names if needed
UPDATE pseudonyms 
SET anonymous_username = 'Anonymous' || id::text 
WHERE anonymous_username IS NULL;

-- Now make it NOT NULL
ALTER TABLE IF EXISTS pseudonyms
ALTER COLUMN anonymous_username SET NOT NULL;

-- Add color_accent if missing
ALTER TABLE IF EXISTS pseudonyms 
ADD COLUMN IF NOT EXISTS color_accent TEXT NOT NULL DEFAULT '#B794F6';

-- Add created_at if missing
ALTER TABLE IF EXISTS pseudonyms 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Verify columns
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'pseudonyms'
ORDER BY ordinal_position;

