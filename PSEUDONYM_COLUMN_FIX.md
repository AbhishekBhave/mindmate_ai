# Pseudonym Category ID Column Fix

## Issue
The error `column pseudonyms.category_id does not exist` occurred because:
1. The database schema in Supabase is missing the `category_id` column on the `pseudonyms` table
2. The code was trying to filter and insert using a non-existent column

## Fix Applied
I've updated the code to work **without** the `category_id` column. Now the code will:
- Get any existing pseudonym for a user (not filtered by category)
- Create new pseudonyms without the `category_id` field
- Continue to work normally for posting

## Current Behavior
- Users will have **one pseudonym** across all categories (not category-specific)
- This is simpler and works immediately with your current database
- Posts will still work correctly

## Optional: Add Category ID Column (Future Enhancement)

If you want to use category-specific pseudonyms later, you can run:

```sql
-- In Supabase SQL Editor, run:
supabase/add-category-id-to-pseudonyms.sql
```

This will:
1. Add the `category_id` column to `pseudonyms` table
2. Add proper indexes
3. Add unique constraints

Then you can update the code to use category-specific pseudonyms.

## Files Modified
- `app/api/community/posts/route.ts` - Removed category_id filtering and inserts
- `PSEUDONYM_COLUMN_FIX.md` - This document

## Test Now

The posting should now work! Try creating a post:
1. Navigate to `/community`
2. Click "Create Post"
3. Fill in the form and submit
4. Post should appear in the feed

If you encounter any issues, the console will now show detailed error information.

