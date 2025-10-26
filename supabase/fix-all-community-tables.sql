-- Fix ALL Community Tables
-- Run this in Supabase SQL Editor to fix the entire community schema

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

-- Step 2: Drop and recreate pseudonyms table with correct schema
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

-- Step 5: Drop existing policies
DROP POLICY IF EXISTS "Users can view own pseudonyms" ON pseudonyms;
DROP POLICY IF EXISTS "Users can insert own pseudonyms" ON pseudonyms;
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
DROP POLICY IF EXISTS "Users can insert posts" ON posts;
DROP POLICY IF EXISTS "Anyone can view approved posts" ON posts;

-- Step 6: Create RLS policies

-- Pseudonyms policies
CREATE POLICY "Users can view own pseudonyms" ON pseudonyms
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pseudonyms" ON pseudonyms
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Categories policies
CREATE POLICY "Anyone can view categories" ON categories
  FOR SELECT USING (true);

-- Posts policies
CREATE POLICY "Users can insert posts" ON posts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view approved posts" ON posts
  FOR SELECT USING (moderation_status IN ('approved', 'pending') AND is_deleted = false);

-- Step 7: Verify tables were created correctly
SELECT 
  'pseudonyms' as table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'pseudonyms'
UNION ALL
SELECT 
  'posts' as table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'posts'
UNION ALL
SELECT 
  'categories' as table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'categories'
ORDER BY table_name, column_name;

-- Step 8: Verify foreign key relationships
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('posts', 'pseudonyms');

