-- Fix pseudonyms table schema
-- Run this SQL in your Supabase SQL editor

-- First, let's see what columns exist
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'pseudonyms'
ORDER BY ordinal_position;

-- If the table exists but has wrong columns, we might need to recreate it
-- First, backup any existing data (optional)
-- CREATE TABLE pseudonyms_backup AS SELECT * FROM pseudonyms;

-- Drop the table if it exists (this will delete existing data!)
DROP TABLE IF EXISTS pseudonyms CASCADE;

-- Recreate the table with correct schema
CREATE TABLE pseudonyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  anonymous_username TEXT NOT NULL,
  color_accent TEXT NOT NULL DEFAULT '#B794F6',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index
CREATE INDEX idx_pseudonyms_user_id ON pseudonyms(user_id);

-- Enable RLS
ALTER TABLE pseudonyms ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own pseudonyms" ON pseudonyms;
DROP POLICY IF EXISTS "Users can insert own pseudonyms" ON pseudonyms;
DROP POLICY IF EXISTS "Users can update own pseudonyms" ON pseudonyms;
DROP POLICY IF EXISTS "Users can delete own pseudonyms" ON pseudonyms;

-- Create RLS policies
CREATE POLICY "Users can view own pseudonyms" ON pseudonyms
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pseudonyms" ON pseudonyms
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pseudonyms" ON pseudonyms
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pseudonyms" ON pseudonyms
  FOR DELETE
  USING (auth.uid() = user_id);

-- Verify the table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'pseudonyms'
ORDER BY ordinal_position;

-- Note: If you need to restore backed up data, use:
-- INSERT INTO pseudonyms SELECT * FROM pseudonyms_backup;

