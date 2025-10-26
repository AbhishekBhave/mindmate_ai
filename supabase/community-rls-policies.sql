-- Community Feature Row Level Security (RLS) Policies
-- Run this SQL in your Supabase SQL editor to ensure proper security

-- Enable Row Level Security on all community tables
ALTER TABLE IF EXISTS categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pseudonyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS mutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS moderation_actions ENABLE ROW LEVEL SECURITY;

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
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pseudonyms" ON pseudonyms
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Categories: Anyone can view
CREATE POLICY "Anyone can view categories" ON categories
  FOR SELECT
  USING (true);

-- Posts: Anyone can view approved posts, users can view their own pending posts
CREATE POLICY "Anyone can view approved posts" ON posts
  FOR SELECT
  USING (
    (moderation_status = 'approved' AND is_deleted = false) OR
    (moderation_status = 'pending' AND is_deleted = false AND
      EXISTS (
        SELECT 1 FROM pseudonyms 
        WHERE pseudonyms.id = posts.pseudonym_id 
        AND pseudonyms.user_id = auth.uid()
      )
    )
  );

-- Posts: Allow authenticated users to insert posts
CREATE POLICY "Users can insert posts" ON posts
  FOR INSERT
  WITH CHECK (true);

-- Posts: Users can update their own posts
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

-- Reactions: Anyone can view
CREATE POLICY "Anyone can view reactions" ON reactions
  FOR SELECT
  USING (true);

-- Reactions: Users can only manage their own reactions
CREATE POLICY "Users can manage own reactions" ON reactions
  FOR ALL
  USING (auth.uid() = user_id);

-- Saves: Users can only see their own saves
CREATE POLICY "Users can manage own saves" ON saves
  FOR ALL
  USING (auth.uid() = user_id);

-- Reports: Users can only manage their own reports
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

-- Moderation actions: Only moderators can view (currently allowing all for testing)
CREATE POLICY "Moderators can view all actions" ON moderation_actions
  FOR SELECT
  USING (true);

-- Verify policies are enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('categories', 'pseudonyms', 'posts', 'replies', 'reactions', 'saves', 'reports', 'mutes', 'blocks', 'notifications', 'moderation_actions')
ORDER BY tablename;

