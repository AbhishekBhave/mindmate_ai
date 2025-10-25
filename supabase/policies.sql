-- MindMate AI Row Level Security (RLS) Policies
-- Run this SQL in your Supabase SQL editor to ensure proper security

-- Enable Row Level Security on all tables
ALTER TABLE IF EXISTS entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sentiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to allow idempotent updates)
DROP POLICY IF EXISTS "Users can view own entries" ON entries;
DROP POLICY IF EXISTS "Users can insert own entries" ON entries;
DROP POLICY IF EXISTS "Users can update own entries" ON entries;
DROP POLICY IF EXISTS "Users can delete own entries" ON entries;

DROP POLICY IF EXISTS "Users can view sentiments for own entries" ON sentiments;
DROP POLICY IF EXISTS "Service role can insert sentiments" ON sentiments;
DROP POLICY IF EXISTS "Service role can update sentiments" ON sentiments;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Entries policies
-- Users can only SELECT their own entries
CREATE POLICY "Users can view own entries" ON entries
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only INSERT entries for themselves
CREATE POLICY "Users can insert own entries" ON entries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only UPDATE their own entries
CREATE POLICY "Users can update own entries" ON entries
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only DELETE their own entries
CREATE POLICY "Users can delete own entries" ON entries
  FOR DELETE
  USING (auth.uid() = user_id);

-- Sentiments policies
-- Users can SELECT sentiments if they own the parent entry
CREATE POLICY "Users can view sentiments for own entries" ON sentiments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM entries 
      WHERE entries.id = sentiments.entry_id 
      AND entries.user_id = auth.uid()
    )
  );

-- Service role can INSERT sentiments (for AI analysis)
CREATE POLICY "Service role can insert sentiments" ON sentiments
  FOR INSERT
  WITH CHECK (true);

-- Service role can UPDATE sentiments (for AI analysis updates)
CREATE POLICY "Service role can update sentiments" ON sentiments
  FOR UPDATE
  USING (true);

-- Profiles policies
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Verify policies are enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('entries', 'sentiments', 'profiles')
ORDER BY tablename;

