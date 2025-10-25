# Testing Dashboard Fixes - Correct Methods

## Why `curl` Shows "Unauthorized"

The health endpoint requires authentication (session cookies). `curl` without cookies can't authenticate, so "Unauthorized" is expected.

## Correct Testing Methods

### Method 1: Browser Testing (Recommended)

1. **Open your browser** and go to `http://localhost:3000`
2. **Sign in** to your account
3. **Open DevTools** (F12) → Network tab
4. **Visit dashboard**: `http://localhost:3000/dashboard`
5. **Look for these logs** in the console:
   ```
   [DASHBOARD] Fetching data for user: 144ebd49-...
   [DASHBOARD] Found entries: 25
   [DASHBOARD] Processed entries with sentiments: 25
   📊 [DASHBOARD] Mood graph points: X
   ```
6. **Check Recent Entries** - should show entries with sentiment badges
7. **Check Mood Graph** - should show data points
8. **Check Progress Insights** - should show real counts

### Method 2: Test in Browser Console

While signed in on the dashboard:

1. Open DevTools Console (F12)
2. Run:
   ```javascript
   fetch('/api/health/dashboard')
     .then(r => r.json())
     .then(console.log)
   ```
3. Should return:
   ```json
   {
     "ok": true,
     "userId": "144ebd49-...",
     "count": 25,
     "sampleEntryId": "uuid",
     "timestamp": "2024-..."
   }
   ```

### Method 3: Submit Test Entries

1. **Clear the textarea**
2. **Enter a positive entry**:
   ```
   I'm feeling fantastic! Just got a promotion at work and I couldn't be happier. This is amazing news!
   ```
3. **Click "Save & Analyze Entry"**
4. **Look for**:
   - Toast: "Entry saved successfully! 🎉"
   - Entry appears in Recent Entries with green badge
   - Mood graph updates with new point
5. **Submit a negative entry**:
   ```
   I'm really struggling with stress today. Work has been overwhelming and I feel exhausted. I don't know how to cope.
   ```
6. **Look for**:
   - Toast: "Entry saved successfully! 🎉"
   - Entry appears with red badge
   - Mood graph shows another point
   - Progress Insights updates

## What You Should See

### Successful Dashboard Load

**Server console:**
```
[DASHBOARD] Fetching data for user: 144ebd49-b008-4c6c-83b7-c198c28bf447
[DASHBOARD] Found entries: 25
[DASHBOARD] Processed entries with sentiments: 25
📊 [DASHBOARD] Mood graph points: 5
```

**Browser:**
- ✅ Mood graph has colored data points
- ✅ Progress Insights show non-zero counts
- ✅ Recent Entries list shows entries with sentiment badges
- ✅ AI Guidance section shows personalized text

### When Submitting New Entry

**Server console:**
```
[API/ENTRIES] Starting AI analysis for entry: uuid
[API/ENTRIES] AI analysis complete: { label: 'positive', score: 0.8, confidence: 0.85 }
```

**Browser:**
- ✅ Entry appears in Recent Entries immediately
- ✅ Correct sentiment badge (green/red/amber)
- ✅ AI Guidance shows personalized message
- ✅ Mood graph updates with new point

## Common Issues

### Issue: "Processed entries with sentiments: 0"

**Problem:** Sentiments not being fetched properly

**Check:**
1. Are sentiments being created when entries are submitted?
2. Run this in browser console while signed in:
   ```javascript
   fetch('/api/entries?userId=YOUR_USER_ID')
     .then(r => r.json())
     .then(d => console.log('Entries:', d.data))
   ```

### Issue: "Mood graph points: 0"

**Problem:** Sentiments not stitching to entries

**Solution:** Already fixed by removing `created_at` from sentiment query

### Issue: Sentiment badges show "neutral" for everything

**Problem:** AI analysis not running or failing

**Check:**
1. Is OpenAI API key set in `.env.local`?
2. Check server logs for OpenAI errors
3. Look for: `[API/ENTRIES] AI analysis complete`

## Verification Checklist

- [ ] Typecheck passes: `npx tsc --noEmit`
- [ ] Build succeeds: `npm run build`
- [ ] Dashboard loads without "column does not exist" errors
- [ ] Recent Entries show sentiment badges
- [ ] Mood graph displays data points
- [ ] Progress Insights show real numbers
- [ ] New entries save successfully
- [ ] AI guidance displays personalized text
- [ ] Health endpoint returns data when authenticated

## Success Criteria

✅ Dashboard loads without errors  
✅ Sentiments stitch to entries correctly  
✅ Mood graph shows data  
✅ Progress Insights compute correctly  
✅ New entries save and display AI guidance  
✅ No "column does not exist" errors  
✅ No authentication warnings

