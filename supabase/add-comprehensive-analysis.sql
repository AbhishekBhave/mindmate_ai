-- Migration: Add comprehensive_analysis column to sentiments table
-- Run this SQL in your Supabase SQL editor
-- This adds a JSONB column to store comprehensive AI analysis including insights, suggestions, patterns, and growthAreas

-- Add comprehensive_analysis JSONB column to store full AI analysis
ALTER TABLE sentiments 
ADD COLUMN IF NOT EXISTS comprehensive_analysis JSONB DEFAULT NULL;

-- Add an index on comprehensive_analysis for faster queries (GIN index for JSONB)
CREATE INDEX IF NOT EXISTS idx_sentiments_comprehensive_analysis ON sentiments USING gin(comprehensive_analysis);

-- Add comment for documentation
COMMENT ON COLUMN sentiments.comprehensive_analysis IS 'Comprehensive AI analysis including insights, suggestions, patterns, and growthAreas as JSONB: { "insights": [], "suggestions": [], "patterns": [], "growthAreas": [] }';

-- Note: Existing entries will have NULL comprehensive_analysis, which is fine for backward compatibility
-- The application will use fallback values when comprehensive_analysis is NULL

