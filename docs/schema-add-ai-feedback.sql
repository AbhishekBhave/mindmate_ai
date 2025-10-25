-- Migration: Add ai_feedback column to sentiments table
-- Run this SQL in your Supabase SQL editor

-- Add ai_feedback column to store personalized AI guidance
ALTER TABLE sentiments 
ADD COLUMN IF NOT EXISTS ai_feedback TEXT;

-- Add an index on ai_feedback for faster queries (if needed in future)
-- CREATE INDEX IF NOT EXISTS idx_sentiments_ai_feedback ON sentiments USING gin(to_tsvector('english', ai_feedback));

-- Update RLS policy if needed (already handled by service role policies)
-- Service role can insert/update sentiments with ai_feedback

COMMENT ON COLUMN sentiments.ai_feedback IS 'Personalized AI guidance and suggestions for the journal entry';

