# 🔧 QUICK FIX: Run This SQL NOW

## Error
`Could not find the 'anonymous_username' column of 'pseudonyms' in the schema cache`

## Solution

### Copy and paste this into Supabase SQL Editor:

```sql
-- Drop and recreate pseudonyms table with correct schema
DROP TABLE IF EXISTS pseudonyms CASCADE;

CREATE TABLE pseudonyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  anonymous_username TEXT NOT NULL,
  color_accent TEXT NOT NULL DEFAULT '#B794F6',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pseudonyms_user_id ON pseudonyms(user_id);

ALTER TABLE pseudonyms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pseudonyms" ON pseudonyms
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pseudonyms" ON pseudonyms
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### Steps:
1. Open Supabase Dashboard → SQL Editor
2. Paste the SQL above
3. Click "Run"
4. Go back to your app and try posting again
5. ✅ It should work!

### Alternative (Keep existing data):
If you have data in the pseudonyms table you want to keep, use: `supabase/add-missing-column.sql` instead

### Verify it worked:
```sql
SELECT * FROM pseudonyms LIMIT 5;
```

Then restart your dev server and try posting!

