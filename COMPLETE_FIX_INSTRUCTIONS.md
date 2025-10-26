# 🔧 Complete Fix Instructions

## Current Error
```
Could not find a relationship between 'posts' and 'pseudonyms' in the schema cache
```

## Root Cause
The `posts` table doesn't have the `pseudonym_id` foreign key column, or the tables don't exist.

## Solution: Run This ONE SQL Script

### Copy and Run in Supabase SQL Editor:

Open: **Supabase Dashboard → SQL Editor**

Then run the file: `supabase/fix-all-community-tables.sql`

Or copy and paste this entire script:

```sql
-- Fix ALL Community Tables
-- This creates categories, pseudonyms, and posts with correct foreign keys

-- Step 1: Create categories table
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
  ('Coping Skills', 'coping-skills', 'Share strategies for managing stress', 'shield', '#10B981'),
  ('School Stress', 'school-stress', 'Academic pressures and support', 'graduation-cap', '#F59E0B'),
  ('Family Challenges', 'family-challenges', 'Family relationships', 'users', '#EF4444'),
  ('Relationships', 'relationships', 'Friendships and dating', 'heart', '#EC4899'),
  ('Sleep & Rest', 'sleep-rest', 'Better sleep tips', 'moon', '#6366F1'),
  ('Daily Wins', 'daily-wins', 'Celebrate victories', 'trophy', '#10B981'),
  ('Resources & Tips', 'resources-tips', 'Helpful resources', 'book', '#8B5CF6'),
  ('Anxiety Support', 'anxiety-support', 'Anxiety community', 'brain', '#3B82F6'),
  ('Depression Support', 'depression-support', 'Depression safe space', 'lightbulb', '#6366F1')
ON CONFLICT (name) DO NOTHING;

-- Step 2: Drop and recreate pseudonyms table
DROP TABLE IF EXISTS pseudonyms CASCADE;

CREATE TABLE pseudonyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  anonymous_username TEXT NOT NULL,
  color_accent TEXT NOT NULL DEFAULT '#B794F6',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pseudonyms_user_id ON pseudonyms(user_id);

-- Step 3: Drop and recreate posts table with correct foreign keys
DROP TABLE IF EXISTS posts CASCADE;

CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  pseudonym_id UUID REFERENCES pseudonyms(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_warnings TEXT[] DEFAULT '{}',
  mood_tags TEXT[] DEFAULT '{}',
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

CREATE INDEX idx_posts_category_id ON posts(category_id);
CREATE INDEX idx_posts_pseudonym_id ON posts(pseudonym_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_moderation_status ON posts(moderation_status);

-- Step 4: Enable Row Level Security
ALTER TABLE pseudonyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies
DROP POLICY IF EXISTS "Users can view own pseudonyms" ON pseudonyms;
DROP POLICY IF EXISTS "Users can insert own pseudonyms" ON pseudonyms;
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
DROP POLICY IF EXISTS "Users can insert posts" ON posts;
DROP POLICY IF EXISTS "Anyone can view approved posts" ON posts;

CREATE POLICY "Users can view own pseudonyms" ON pseudonyms
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pseudonyms" ON pseudonyms
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view categories" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Users can insert posts" ON posts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view approved posts" ON posts
  FOR SELECT USING (moderation_status IN ('approved', 'pending') AND is_deleted = false);
```

## After Running the SQL

1. ✅ **Verify it worked**: You should see success messages and a table summary
2. ✅ **Restart dev server**: `npm run dev`
3. ✅ **Try posting**: Go to `/community` and create a post
4. ✅ **It should work!**

## Expected Result

After running this SQL:
- ✅ `categories` table exists with 9 default categories
- ✅ `pseudonyms` table exists with correct columns (`anonymous_username`, `color_accent`)
- ✅ `posts` table exists with foreign key to `pseudonyms.id`
- ✅ All RLS policies are configured
- ✅ Users can create posts

## Files Available

- `supabase/fix-all-community-tables.sql` - Complete fix (recommended)
- `COMPLETE_FIX_INSTRUCTIONS.md` - This file
- `RUN_THIS_SQL_NOW.md` - Quick reference

Run the SQL script and you're done! 🎉

