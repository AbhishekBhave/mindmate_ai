-- Migration: Add category_id column to pseudonyms table
-- Run this SQL in your Supabase SQL editor if you want to use category-specific pseudonyms

-- Check if column exists before adding
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pseudonyms' 
    AND column_name = 'category_id'
  ) THEN
    -- Add the category_id column
    ALTER TABLE pseudonyms 
    ADD COLUMN category_id UUID REFERENCES categories(id) ON DELETE SET NULL;
    
    -- Add index for better query performance
    CREATE INDEX IF NOT EXISTS idx_pseudonyms_category_id ON pseudonyms(category_id);
    
    -- Add unique constraint for user + category combinations
    CREATE UNIQUE INDEX IF NOT EXISTS idx_pseudonyms_user_category 
    ON pseudonyms(user_id, category_id) 
    WHERE category_id IS NOT NULL;
    
    -- Add unique constraint for user with null category
    CREATE UNIQUE INDEX IF NOT EXISTS idx_pseudonyms_user_null_category 
    ON pseudonyms(user_id) 
    WHERE category_id IS NULL;
    
    RAISE NOTICE 'Successfully added category_id column to pseudonyms table';
  ELSE
    RAISE NOTICE 'Column category_id already exists in pseudonyms table';
  END IF;
END $$;

-- Verify the change
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'pseudonyms'
ORDER BY ordinal_position;

