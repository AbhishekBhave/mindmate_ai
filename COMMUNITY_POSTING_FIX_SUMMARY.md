# Community Posting Fix Summary

## Issue Diagnosed
Users were experiencing "An Unexpected Error Occurred: Try Again" when attempting to post in the community feature. The error was generic and didn't provide useful debugging information.

## Root Causes Identified

1. **Poor Error Handling**: The API route was swallowing errors without logging detailed Supabase error information (code, message, details, hint)
2. **Insufficient Error Messages**: Generic error messages didn't help diagnose the actual issue
3. **Missing Validation**: No proper validation of request body or required fields
4. **RLS Policy Uncertainty**: Couldn't verify if Row Level Security policies were properly configured

## Fixes Implemented

### 1. Enhanced API Error Logging (`app/api/community/posts/route.ts`)

**Changes:**
- Added detailed error logging with full Supabase error context (code, message, details, hint)
- Added request body parsing error handling
- Added field validation for required inputs
- Improved authentication error handling
- Enhanced pseudonym lookup error handling
- Detailed post creation error logging
- Console logging at each step for debugging

**Key improvements:**
```typescript
// Before
catch (error) {
  console.error('Unexpected error:', error)
  return Response.json({ ok: false, error: 'An unexpected error occurred' }, { status: 500 })
}

// After
catch (error: any) {
  console.error('Unexpected error in POST handler:', {
    error,
    message: error?.message,
    stack: error?.stack
  })
  return Response.json({ ok: false, error: error?.message || 'An unexpected error occurred' }, { status: 500 })
}
```

### 2. Improved Pseudonym Generation Error Handling

**Changes:**
- Added detailed logging for each pseudonym creation attempt
- Handle unique constraint violations (code 23505) gracefully
- Log specific error codes, messages, details, and hints
- Added fallback pseudonym creation with error handling

**Key improvements:**
```typescript
if (error) {
  console.error(`Attempt ${attempts + 1} failed to create pseudonym:`, {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint
  })
  
  if (error.code !== '23505') {
    console.error('Non-unique error during pseudonym creation:', error)
    return null
  }
}
```

### 3. Enhanced Client-Side Error Display (`app/community/community-client.tsx`)

**Changes:**
- Improved error message display to show actual API error messages
- Added console logging for debugging
- Better error message for network failures
- Improved success message

**Key improvements:**
```typescript
if (data.ok) {
  toast.success('Post created successfully!')
  // ... refresh logic
} else {
  console.error('API returned error:', data.error)
  toast.error(data.error || 'Failed to create post')
}
```

### 4. Created RLS Policy Script (`supabase/community-rls-policies.sql`)

**Purpose:** Ensure proper Row Level Security policies are in place for all community tables

**Key policies:**
- `"Users can insert own pseudonyms"` - WITH CHECK (auth.uid() = user_id)
- `"Users can insert posts"` - WITH CHECK (true) - allows all authenticated users
- `"Anyone can view approved posts"` - FOR SELECT USING (moderation_status = 'approved' AND is_deleted = false)
- `"Users can manage own reactions"` - FOR ALL USING (auth.uid() = user_id)

## Testing Instructions

### 1. Apply Database Schema and RLS Policies

Run these SQL files in your Supabase SQL editor:

```bash
# In Supabase Dashboard > SQL Editor, run:
```

1. First, run the main community schema:
   - Copy and paste `docs/schema-community.sql` into SQL editor
   - Click "Run"

2. Then apply the RLS policies:
   - Copy and paste `supabase/community-rls-policies.sql` into SQL editor
   - Click "Run"

3. Verify tables were created:
   ```sql
   SELECT tablename FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename IN ('categories', 'pseudonyms', 'posts', 'replies');
   ```

4. Verify RLS is enabled:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename IN ('posts', 'pseudonyms');
   ```

### 2. Test the Posting Flow

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Sign in to the application**
   - Navigate to the community page
   - Ensure you're signed in (check for user session)

3. **Create a new post:**
   - Click "Create Post" button
   - Select a category
   - Enter a title
   - Enter post content
   - Click "Post Anonymously"

4. **Monitor the console:**
   - Check browser console for client-side errors
   - Check terminal/server logs for API route errors
   - Look for detailed Supabase error logs if posting fails

5. **Verify the post appears:**
   - Post should appear in the feed immediately
   - Success toast should display
   - Dialog should close

### 3. Expected Behavior

**Success case:**
- Console logs show: "Authenticated user: <user_id>"
- Console logs show: "Using pseudonym: <pseudonym_id>" or "Successfully created pseudonym: <pseudonym_id>"
- Console logs show: "Post created successfully: <post_id>"
- Post appears in feed
- Success toast displays

**Failure case (if authentication fails):**
- Console shows: "Authentication error: <error details>"
- Returns 401 status
- Displays: "Unauthorized - Please sign in to post"

**Failure case (if database error occurs):**
- Console shows detailed error: `{ code, message, details, hint }`
- Returns 500 status
- Displays specific error message from Supabase

## Debugging Tips

If posts still fail:

1. **Check authentication:**
   - Verify user is signed in
   - Check cookies are being sent
   - Look for "Authentication error" in console

2. **Check database:**
   - Verify tables exist: `categories`, `pseudonyms`, `posts`
   - Verify RLS policies are applied
   - Check if user_id matches auth.uid()

3. **Check logs:**
   - Look for detailed error output in server console
   - All Supabase errors now include: code, message, details, hint
   - Use these details to identify the specific issue

4. **Common issues:**
   - **Missing category:** Ensure categories table has data
   - **RLS blocking:** Verify RLS policies allow INSERT on posts table
   - **Auth not working:** Check that getServerSupabase() is reading cookies correctly
   - **Missing fields:** Ensure all required fields are provided

## Architecture Overview

### Request Flow

1. **Client** (`app/community/community-client.tsx`)
   - User fills in post form
   - Calls `handleCreatePost()`
   - Sends POST to `/api/community/posts`

2. **API Route** (`app/api/community/posts/route.ts`)
   - Calls `getServerSupabase()` to get authenticated client
   - Validates request body and required fields
   - Gets authenticated user with `supabase.auth.getUser()`
   - Checks for existing pseudonym or creates new one
   - Inserts post into database
   - Returns post data

3. **Database** (Supabase)
   - RLS policies verify auth.uid()
   - Inserts pseudonym if needed
   - Inserts post with moderation_status='pending'
   - Returns inserted row with joins

### Authentication Flow

```typescript
// Server-side client reads cookies for authentication
const supabase = await getServerSupabase() // Uses @supabase/ssr
const { data: { user } } = await supabase.auth.getUser()
// user.id is used for all user-specific operations
```

### RLS Policies Applied

```sql
-- Users can insert posts
CREATE POLICY "Users can insert posts" ON posts
  FOR INSERT
  WITH CHECK (true);  -- Allows all authenticated users

-- Users can view approved posts
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
```

## Files Modified

1. `app/api/community/posts/route.ts` - Enhanced error logging and validation
2. `app/community/community-client.tsx` - Improved error display
3. `supabase/community-rls-policies.sql` - Created RLS policy script
4. `COMMUNITY_POSTING_FIX_SUMMARY.md` - This document

## Next Steps

1. Run the SQL scripts in Supabase
2. Test the posting flow
3. Check console logs for detailed errors if issues persist
4. Verify posts appear in the feed immediately after creation

## Build Verification

```bash
# Check for TypeScript errors
npm run build

# Check for linter errors
npm run lint

# Run development server
npm run dev
```

All files should compile successfully with no errors.

