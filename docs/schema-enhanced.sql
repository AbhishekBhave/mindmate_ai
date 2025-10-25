-- MindMate AI Enhanced Database Schema
-- Run this SQL in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  display_name TEXT,
  preferences JSONB DEFAULT '{}',
  analytics_settings JSONB DEFAULT '{"share_anonymized": false, "deep_analysis_enabled": true}'
);

-- Create entries table
CREATE TABLE IF NOT EXISTS entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  content TEXT NOT NULL,
  word_count INTEGER DEFAULT 0,
  reading_time INTEGER DEFAULT 0 -- in seconds
);

-- Create enhanced sentiments table
CREATE TABLE IF NOT EXISTS sentiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  score NUMERIC NOT NULL CHECK (score >= 0 AND score <= 1),
  label TEXT NOT NULL CHECK (label IN ('positive', 'neutral', 'negative')),
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  summary TEXT,
  emotions TEXT[] DEFAULT '{}',
  model_results JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create AI insights table for deep analysis
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('weekly', 'monthly', 'deep_analysis')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user analytics table
CREATE TABLE IF NOT EXISTS user_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  entries_count INTEGER DEFAULT 0,
  avg_mood_score NUMERIC DEFAULT 0.5,
  mood_distribution JSONB DEFAULT '{"positive": 0, "neutral": 0, "negative": 0}',
  emotions_detected TEXT[] DEFAULT '{}',
  word_count_total INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create social connections table (for future social features)
CREATE TABLE IF NOT EXISTS social_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connected_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_type TEXT NOT NULL CHECK (connection_type IN ('friend', 'mentor', 'peer')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, connected_user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_entries_user_id ON entries(user_id);
CREATE INDEX IF NOT EXISTS idx_entries_created_at ON entries(created_at);
CREATE INDEX IF NOT EXISTS idx_entries_user_created ON entries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sentiments_entry_id ON sentiments(entry_id);
CREATE INDEX IF NOT EXISTS idx_sentiments_confidence ON sentiments(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_ai_insights_user_id ON ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_type_created ON ai_insights(insight_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_analytics_user_date ON user_analytics(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_social_connections_user_id ON social_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_social_connections_status ON social_connections(status);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_connections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Entries policies
CREATE POLICY "Users can view own entries" ON entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own entries" ON entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own entries" ON entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own entries" ON entries
  FOR DELETE USING (auth.uid() = user_id);

-- Sentiments policies
CREATE POLICY "Users can view sentiments for own entries" ON sentiments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM entries 
      WHERE entries.id = sentiments.entry_id 
      AND entries.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert sentiments" ON sentiments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update sentiments" ON sentiments
  FOR UPDATE WITH CHECK (true);

-- AI Insights policies
CREATE POLICY "Users can view own AI insights" ON ai_insights
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert AI insights" ON ai_insights
  FOR INSERT WITH CHECK (true);

-- User Analytics policies
CREATE POLICY "Users can view own analytics" ON user_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert analytics" ON user_analytics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update analytics" ON user_analytics
  FOR UPDATE WITH CHECK (true);

-- Social Connections policies
CREATE POLICY "Users can view own connections" ON social_connections
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = connected_user_id);

CREATE POLICY "Users can create connections" ON social_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connections" ON social_connections
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = connected_user_id);

-- Functions for analytics
CREATE OR REPLACE FUNCTION update_user_analytics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_analytics (user_id, date, entries_count, avg_mood_score, mood_distribution, emotions_detected, word_count_total)
  SELECT 
    NEW.user_id,
    CURRENT_DATE,
    1,
    COALESCE(s.score, 0.5),
    CASE 
      WHEN s.label = 'positive' THEN '{"positive": 1, "neutral": 0, "negative": 0}'::jsonb
      WHEN s.label = 'negative' THEN '{"positive": 0, "neutral": 0, "negative": 1}'::jsonb
      ELSE '{"positive": 0, "neutral": 1, "negative": 0}'::jsonb
    END,
    COALESCE(s.emotions, '{}'),
    LENGTH(NEW.content)
  FROM sentiments s
  WHERE s.entry_id = NEW.id
  ON CONFLICT (user_id, date) 
  DO UPDATE SET
    entries_count = user_analytics.entries_count + 1,
    avg_mood_score = (user_analytics.avg_mood_score * user_analytics.entries_count + COALESCE(s.score, 0.5)) / (user_analytics.entries_count + 1),
    mood_distribution = CASE 
      WHEN s.label = 'positive' THEN jsonb_set(user_analytics.mood_distribution, '{positive}', to_jsonb((user_analytics.mood_distribution->>'positive')::int + 1))
      WHEN s.label = 'negative' THEN jsonb_set(user_analytics.mood_distribution, '{negative}', to_jsonb((user_analytics.mood_distribution->>'negative')::int + 1))
      ELSE jsonb_set(user_analytics.mood_distribution, '{neutral}', to_jsonb((user_analytics.mood_distribution->>'neutral')::int + 1))
    END,
    emotions_detected = user_analytics.emotions_detected || COALESCE(s.emotions, '{}'),
    word_count_total = user_analytics.word_count_total + LENGTH(NEW.content);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update analytics when entries are created
CREATE TRIGGER trigger_update_analytics
  AFTER INSERT ON entries
  FOR EACH ROW
  EXECUTE FUNCTION update_user_analytics();

-- Function to calculate reading time
CREATE OR REPLACE FUNCTION calculate_reading_time(content TEXT)
RETURNS INTEGER AS $$
BEGIN
  -- Average reading speed: 200 words per minute
  RETURN GREATEST(1, (LENGTH(content) / 200) * 60);
END;
$$ LANGUAGE plpgsql;

-- Update entries with word count and reading time
UPDATE entries SET 
  word_count = array_length(string_to_array(content, ' '), 1),
  reading_time = calculate_reading_time(content)
WHERE word_count = 0;
