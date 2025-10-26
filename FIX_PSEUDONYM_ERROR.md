# Fix: "Failed to create pseudonym" Error

## Root Cause
The `pseudonyms` table likely doesn't exist in your Supabase database, or RLS policies are blocking inserts.

## Quick Fix

### Step 1: Run This SQL in Supabase

Open your Supabase Dashboard → SQL Editor and run:

```sql
-- Create pseudonyms table if it doesn't exist
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
```

### Step 2: Verify the Table Was Created

Run this query to verify:

```sql
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'pseudonyms'
ORDER BY ordinal_position;
```

You should see 5 columns:
- id
- user_id
- anonymous_username
- color_accent
- created_at

### Step 3: Also Create Posts and Categories Tables (if needed)

If posts also fail, run this:

```sql
-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_name TEXT,
  color TEXT DEFAULT '#B794F6',
  is_sticky BOOLEAN DEFAULT false,
  requires_approval BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default categories
INSERT INTO categories (name, slug, description, icon_name, color) VALUES
  ('Coping Skills', 'coping-skills', 'Share strategies for managing stress and difficult emotions', 'shield', '#10B981'),
  ('School Stress', 'school-stress', 'Discuss academic pressures and find support', 'graduation-cap', '#F59E0B'),
  ('Family Challenges', 'family-challenges', 'Navigate family relationships and conflicts', 'users', '#EF4444'),
  ('Relationships', 'relationships', 'Talk about friendships, dating, and social connections', 'heart', '#EC4899'),
  ('Sleep & Rest', 'sleep-rest', 'Share tips for better sleep and rest', 'moon', '#6366F1'),
  ('Daily Wins', 'daily-wins', 'Celebrate small victories and positive moments', 'trophy', '#10B981'),
  ('Resources & Tips', 'resources-tips', 'Share helpful resources and advice', 'book', '#8B5CF6'),
  ('Anxiety Support', 'anxiety-support', 'Connect with others experiencing anxiety', 'brain', '#3B82F6'),
  ('Depression Support', 'depression-support', 'A safe space to discuss depression', 'lightbulb', '#6366F1')
ON CONFLICT (name) DO NOTHING;

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  pseudonym_id UUID REFERENCES pseudonyms(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_warnings TEXT[],
  mood_tags TEXT[],
  score NUMERIC DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  reaction_count INTEGER DEFAULT 0,
  save_count INTEGER DEFAULT 0,
  report_count INTEGER DEFAULT 0,
  is_frozen BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'flagged', 'removed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_posts_category_id ON posts(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_pseudonym_id ON posts(pseudonym_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert posts" ON posts;
DROP POLICY IF EXISTS "Anyone can view approved posts" ON posts;

-- Create RLS policies
CREATE POLICY "Users can insert posts" ON posts
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view approved posts" ON posts
  FOR SELECT
  USING (moderation_status IN ('approved', 'pending') AND is_deleted = false);
```

### Step 4: Test the Fix

1. Restart your dev server:
   ```bash
   npm run dev
   ```

2. Navigate to `/community`

3. Try to create a post

4. Check your browser console and terminal for detailed error logs

## What Changed

The code now:
- ✅ Detects if the `pseudonyms` table doesn't exist (error code 42P01)
- ✅ Provides clear error messages about missing tables
- ✅ Handles RLS policy violations (error code 42501)
- ✅ Logs detailed error information for debugging
- ✅ Works without the `category_id` column

## Debugging

If you still see errors:

1. **Check your server console logs** - They now show detailed Supabase error information:
   - Error code (e.g., 42P01 = table missing, 42501 = RLS violation)
   - Error message from Supabase
   - Details and hints

2. **Check RLS policies in Supabase:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'pseudonyms';
   ```

3. **Verify authentication:**
   - Make sure you're signed in
   - Check that cookies are being sent

## Files Available

- `supabase/create-pseudonyms-table.sql` - Creates the table
- `FIX_PSEUDONYM_ERROR.md` - This file
- `COMMUNITY_POSTING_FIX_SUMMARY.md` - Overall fixes summary

Run the SQL scripts in Supabase and try again!

