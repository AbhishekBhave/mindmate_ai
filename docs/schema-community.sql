-- Community Feature Database Schema
-- Run this SQL in your Supabase SQL editor

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy search

-- Step 1: Create base tables (no dependencies on other custom tables)
-- Categories table (referenced by pseudonyms)
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

-- Step 2: Create dependent tables (pseudonyms depends on categories)
-- Pseudonyms table for anonymous usernames
CREATE TABLE IF NOT EXISTS pseudonyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  anonymous_username TEXT NOT NULL,
  color_accent TEXT NOT NULL DEFAULT '#B794F6',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ -- Optional rotation expiry
);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  pseudonym_id UUID REFERENCES pseudonyms(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_warnings TEXT[], -- Array of content warnings
  mood_tags TEXT[], -- Array of mood tags
  tone_analysis_score NUMERIC CHECK (tone_analysis_score >= 0 AND tone_analysis_score <= 1),
  score NUMERIC DEFAULT 0, -- Hot algorithm score
  reply_count INTEGER DEFAULT 0,
  reaction_count INTEGER DEFAULT 0,
  save_count INTEGER DEFAULT 0,
  report_count INTEGER DEFAULT 0,
  is_frozen BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  moderation_status TEXT DEFAULT 'approved' CHECK (moderation_status IN ('pending', 'approved', 'flagged', 'removed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW()
);

-- Replies table with threading support
CREATE TABLE IF NOT EXISTS replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  parent_reply_id UUID REFERENCES replies(id) ON DELETE CASCADE, -- For threading
  pseudonym_id UUID REFERENCES pseudonyms(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_mark_as_helpful BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  reaction_count INTEGER DEFAULT 0,
  report_count INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  moderation_status TEXT DEFAULT 'approved' CHECK (moderation_status IN ('pending', 'approved', 'flagged', 'removed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  depth INTEGER DEFAULT 0 CHECK (depth >= 0 AND depth < 6) -- Limit nesting depth
);

-- Reactions table (positive reactions only: heart, hand, celebration)
CREATE TABLE IF NOT EXISTS reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES replies(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('heart', 'hand', 'celebration')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id, reaction_type),
  UNIQUE(user_id, reply_id, reaction_type),
  CHECK ((post_id IS NOT NULL)::int + (reply_id IS NOT NULL)::int = 1)
);

-- Saves table
CREATE TABLE IF NOT EXISTS saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  folder_name TEXT DEFAULT 'default',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES replies(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('harmful-content', 'spam', 'misinformation', 'needs-support', 'self-harm', 'other')),
  notes TEXT,
  moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'reviewing', 'action-taken', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK ((post_id IS NOT NULL)::int + (reply_id IS NOT NULL)::int = 1)
);

-- Mutes table
CREATE TABLE IF NOT EXISTS mutes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pseudonym_id UUID NOT NULL REFERENCES pseudonyms(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, pseudonym_id)
);

-- Blocks table
CREATE TABLE IF NOT EXISTS blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pseudonym_id UUID NOT NULL REFERENCES pseudonyms(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, pseudonym_id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'reply', 'mention', 'save', 'moderation', 'crisis-resources')),
  entity_type TEXT CHECK (entity_type IN ('post', 'reply')),
  entity_id UUID NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Moderation actions table
CREATE TABLE IF NOT EXISTS moderation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moderator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('post', 'reply', 'user')),
  entity_id UUID NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('approve', 'remove', 'shadow-ban', 'freeze', 'warn')),
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pseudonyms_user_id ON pseudonyms(user_id);
CREATE INDEX IF NOT EXISTS idx_pseudonyms_category_id ON pseudonyms(category_id);

-- Create unique indexes to handle NULLs properly (must be after table creation)
CREATE UNIQUE INDEX IF NOT EXISTS idx_pseudonyms_user_category ON pseudonyms(user_id, category_id) 
  WHERE category_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_pseudonyms_user_null_category ON pseudonyms(user_id) 
  WHERE category_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_posts_category_id ON posts(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_score ON posts(score DESC);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_pseudonym_id ON posts(pseudonym_id);
CREATE INDEX IF NOT EXISTS idx_posts_moderation_status ON posts(moderation_status);
CREATE INDEX IF NOT EXISTS idx_replies_post_id ON replies(post_id);
CREATE INDEX IF NOT EXISTS idx_replies_parent_id ON replies(parent_reply_id);
CREATE INDEX IF NOT EXISTS idx_replies_pseudonym_id ON replies(pseudonym_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_reactions_post_id ON reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_reactions_reply_id ON reactions(reply_id);
CREATE INDEX IF NOT EXISTS idx_saves_user_id ON saves(user_id);
CREATE INDEX IF NOT EXISTS idx_saves_post_id ON saves(post_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_moderation_status ON reports(moderation_status);
CREATE INDEX IF NOT EXISTS idx_mutes_user_id ON mutes(user_id);
CREATE INDEX IF NOT EXISTS idx_blocks_user_id ON blocks(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_moderator ON moderation_actions(moderator_id);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_posts_search ON posts USING gin(to_tsvector('english', title || ' ' || content));
CREATE INDEX IF NOT EXISTS idx_replies_search ON replies USING gin(to_tsvector('english', content));

-- Function to update last_activity_at on posts
CREATE OR REPLACE FUNCTION update_post_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts 
  SET last_activity_at = NOW()
  WHERE id = (CASE 
    WHEN TG_TABLE_NAME = 'replies' THEN NEW.post_id
    WHEN TG_TABLE_NAME = 'posts' THEN NEW.id
  END);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update activity on new replies
CREATE TRIGGER update_post_activity_on_reply
  AFTER INSERT ON replies
  FOR EACH ROW
  EXECUTE FUNCTION update_post_activity();

-- Function to calculate hot score
CREATE OR REPLACE FUNCTION calculate_hot_score(like_count INTEGER, reply_count INTEGER, hours_ago NUMERIC)
RETURNS NUMERIC AS $$
BEGIN
  -- Logarithmic scoring: log(1 + likes) + 0.5 * replies - age decay
  RETURN LN(1 + GREATEST(0, like_count))::NUMERIC + (0.5 * reply_count) - (hours_ago / 10);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update post scores periodically
CREATE OR REPLACE FUNCTION update_post_scores()
RETURNS void AS $$
BEGIN
  UPDATE posts
  SET score = calculate_hot_score(
    reaction_count,
    reply_count,
    EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600
  )
  WHERE is_deleted = false AND moderation_status = 'approved';
END;
$$ LANGUAGE plpgsql;

-- Function to increment counters
CREATE OR REPLACE FUNCTION increment_counter()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment reply_count on posts when reply is added
    IF TG_TABLE_NAME = 'replies' THEN
      UPDATE posts SET reply_count = reply_count + 1 WHERE id = NEW.post_id;
    END IF;
    -- Increment reaction_count on posts/replies
    IF TG_TABLE_NAME = 'reactions' THEN
      IF NEW.post_id IS NOT NULL THEN
        UPDATE posts SET reaction_count = reaction_count + 1 WHERE id = NEW.post_id;
      ELSIF NEW.reply_id IS NOT NULL THEN
        UPDATE replies SET reaction_count = reaction_count + 1 WHERE id = NEW.reply_id;
      END IF;
    END IF;
    -- Increment save_count on posts
    IF TG_TABLE_NAME = 'saves' THEN
      UPDATE posts SET save_count = save_count + 1 WHERE id = NEW.post_id;
    END IF;
    -- Increment helpful_count on replies
    IF TG_TABLE_NAME = 'reactions' AND NEW.reaction_type = 'hand' THEN
      UPDATE replies SET helpful_count = helpful_count + 1 WHERE id = NEW.reply_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement reply_count when reply is deleted
    IF TG_TABLE_NAME = 'replies' THEN
      UPDATE posts SET reply_count = GREATEST(0, reply_count - 1) WHERE id = OLD.post_id;
    END IF;
    -- Decrement reaction_count
    IF TG_TABLE_NAME = 'reactions' THEN
      IF OLD.post_id IS NOT NULL THEN
        UPDATE posts SET reaction_count = GREATEST(0, reaction_count - 1) WHERE id = OLD.post_id;
      ELSIF OLD.reply_id IS NOT NULL THEN
        UPDATE replies SET reaction_count = GREATEST(0, reaction_count - 1) WHERE id = OLD.reply_id;
      END IF;
    END IF;
    -- Decrement save_count
    IF TG_TABLE_NAME = 'saves' THEN
      UPDATE posts SET save_count = GREATEST(0, save_count - 1) WHERE id = OLD.post_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for counter updates
CREATE TRIGGER update_post_reply_count
  AFTER INSERT OR DELETE ON replies
  FOR EACH ROW
  EXECUTE FUNCTION increment_counter();

CREATE TRIGGER update_reaction_count
  AFTER INSERT OR DELETE ON reactions
  FOR EACH ROW
  EXECUTE FUNCTION increment_counter();

CREATE TRIGGER update_save_count
  AFTER INSERT OR DELETE ON saves
  FOR EACH ROW
  EXECUTE FUNCTION increment_counter();

-- Enable Row Level Security
ALTER TABLE pseudonyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE mutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view own pseudonyms" ON pseudonyms;
DROP POLICY IF EXISTS "Users can insert own pseudonyms" ON pseudonyms;
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
DROP POLICY IF EXISTS "Anyone can view approved posts" ON posts;
DROP POLICY IF EXISTS "Users can insert posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Anyone can view approved replies" ON replies;
DROP POLICY IF EXISTS "Users can insert replies" ON replies;
DROP POLICY IF EXISTS "Users can update own replies" ON replies;
DROP POLICY IF EXISTS "Anyone can view reactions" ON reactions;
DROP POLICY IF EXISTS "Users can manage own reactions" ON reactions;
DROP POLICY IF EXISTS "Users can manage own saves" ON saves;
DROP POLICY IF EXISTS "Users can manage own reports" ON reports;
DROP POLICY IF EXISTS "Users can manage own mutes" ON mutes;
DROP POLICY IF EXISTS "Users can manage own blocks" ON blocks;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Moderators can view all actions" ON moderation_actions;

-- RLS Policies
-- Pseudonyms: Users can only see their own pseudonyms
CREATE POLICY "Users can view own pseudonyms" ON pseudonyms
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pseudonyms" ON pseudonyms
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Categories: Anyone can view, only admins can modify
CREATE POLICY "Anyone can view categories" ON categories
  FOR SELECT
  USING (true);

-- Posts: Anyone can view approved posts, users can view their own pending posts
CREATE POLICY "Anyone can view approved posts" ON posts
  FOR SELECT
  USING (
    (
      moderation_status = 'approved' AND is_deleted = false
    ) OR
    (
      moderation_status = 'pending' AND is_deleted = false AND
      EXISTS (
        SELECT 1 FROM pseudonyms 
        WHERE pseudonyms.id = posts.pseudonym_id 
        AND pseudonyms.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert posts" ON posts
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own posts" ON posts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM pseudonyms 
      WHERE pseudonyms.id = posts.pseudonym_id 
      AND pseudonyms.user_id = auth.uid()
    )
  );

-- Replies: Anyone can view approved replies
CREATE POLICY "Anyone can view approved replies" ON replies
  FOR SELECT
  USING (moderation_status = 'approved' AND is_deleted = false);

CREATE POLICY "Users can insert replies" ON replies
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own replies" ON replies
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM pseudonyms 
      WHERE pseudonyms.id = replies.pseudonym_id 
      AND pseudonyms.user_id = auth.uid()
    )
  );

-- Reactions: Anyone can view, users can only manage own reactions
CREATE POLICY "Anyone can view reactions" ON reactions
  FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own reactions" ON reactions
  FOR ALL
  USING (auth.uid() = user_id);

-- Saves: Users can only see their own saves
CREATE POLICY "Users can manage own saves" ON saves
  FOR ALL
  USING (auth.uid() = user_id);

-- Reports: Users can only manage own reports
CREATE POLICY "Users can manage own reports" ON reports
  FOR ALL
  USING (auth.uid() = user_id);

-- Mutes: Users can only see their own mutes
CREATE POLICY "Users can manage own mutes" ON mutes
  FOR ALL
  USING (auth.uid() = user_id);

-- Blocks: Users can only see their own blocks
CREATE POLICY "Users can manage own blocks" ON blocks
  FOR ALL
  USING (auth.uid() = user_id);

-- Notifications: Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications" ON notifications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Moderation actions: Only moderators can view
CREATE POLICY "Moderators can view all actions" ON moderation_actions
  FOR SELECT
  USING (true); -- Add moderator check here

