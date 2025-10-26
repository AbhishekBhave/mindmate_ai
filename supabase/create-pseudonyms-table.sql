-- Create pseudonyms table if it doesn't exist
-- Run this SQL in your Supabase SQL editor

-- Create pseudonyms table (minimal version without category_id)
CREATE TABLE IF NOT EXISTS pseudonyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  anonymous_username TEXT NOT NULL,
  color_accent TEXT NOT NULL DEFAULT '#B794F6',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_pseudonyms_user_id ON pseudonyms(user_id);

-- Enable Row Level Security
ALTER TABLE pseudonyms ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own pseudonyms" ON pseudonyms;
DROP POLICY IF EXISTS "Users can insert own pseudonyms" ON pseudonyms;

-- Create RLS policies
CREATE POLICY "Users can view own pseudonyms" ON pseudonyms
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pseudonyms" ON pseudonyms
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Verify the table was created
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'pseudonyms'
ORDER BY ordinal_position;

