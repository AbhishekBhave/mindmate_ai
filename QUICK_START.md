# Quick Start - Testing AI Entry Analysis

## 🚀 Quick Setup

### 1. Apply Database Migration

Run this SQL in your Supabase SQL Editor:

```sql
ALTER TABLE sentiments 
ADD COLUMN IF NOT EXISTS ai_feedback TEXT;
```

### 2. Start the Development Server

```bash
npm run dev
```

### 3. Test the API Health

```bash
curl http://localhost:3000/api/health/openai
```

Expected response:
```json
{
  "ok": true,
  "status": "healthy",
  "timestamp": "...",
  "test": {
    "input": "I am excited about winning a robotics competition",
    "output": {
      "sentiment": "positive",
      "confidence": 85,
      "suggestionLength": 120,
      "isPersonalized": true
    }
  }
}
```

## 🧪 Manual Testing

### Test 1: Negative Entry

1. Navigate to `http://localhost:3000`
2. Scroll to the demo section
3. Enter: `"I failed my exam and feel overwhelmed"`
4. Click "Analyze My Entry"
5. **Verify:**
   - Guidance mentions "failed" and/or "overwhelmed"
   - Provides concrete coping strategies
   - NOT the generic neutral template

### Test 2: Positive Entry

1. Enter: `"I landed an internship and feel proud"`
2. Click "Analyze My Entry"
3. **Verify:**
   - Guidance mentions "internship" and/or "proud"
   - Provides specific next steps
   - NOT the generic neutral template

### Test 3: Dashboard (if signed in)

1. Navigate to `http://localhost:3000/dashboard`
2. Create a new entry with any text
3. Wait for analysis
4. Scroll to recent entries
5. Click to expand an entry
6. **Verify:**
   - AI Insight section shows personalized feedback
   - References details from your entry
   - NOT generic text

## 🛠️ Automated Testing

```bash
# Make script executable (already done)
chmod +x test-api.sh

# Run tests
bash test-api.sh
```

## 📊 Check Logs

Watch your terminal for:
- `📥 [ANALYZE-ENTRY]` - API requests
- `✅ [ANALYZE-ENTRY]` - Successful API calls
- `❌ [ANALYZE-ENTRY]` - API errors
- `📊 [DASHBOARD]` - Dashboard operations

## 🔍 Troubleshooting

### Issue: Still seeing generic responses

1. Check OpenAI API key:
   ```bash
   echo $OPENAI_API_KEY
   ```

2. Check API health:
   ```bash
   curl http://localhost:3000/api/health/openai
   ```

3. Check database column exists:
   - Go to Supabase → Table Editor → sentiments
   - Verify `ai_feedback` column exists

4. Check browser console:
   - Open DevTools → Console
   - Look for `[ANALYZE-ENTRY]` logs
   - Look for errors

### Issue: 503 Service Unavailable

- OpenAI API key not configured
- Check `.env.local` file
- Verify key is valid: `sk-...`

### Issue: Empty response

- OpenAI quota exceeded
- Check OpenAI dashboard
- Verify billing is set up

## ✅ Success Criteria

Your implementation is working correctly if:

1. ✅ Health endpoint returns personalized response for test entry
2. ✅ Negative entries get empathy and coping strategies
3. ✅ Positive entries get celebration and next steps
4. ✅ Responses reference specific details from entries
5. ✅ Dashboard shows personalized AI feedback
6. ✅ No generic "neutral template" responses
7. ✅ Console logs show `[ANALYZE-ENTRY]` activity
8. ✅ Database `sentiments` table has `ai_feedback` populated

## 📝 Example Expected Responses

### Negative Entry
Input: "I failed my exam and feel overwhelmed"

Expected Output:
- Sentiment: negative
- Guidance includes: "overwhelmed", "failed", "exam"
- Suggestions include: "break down tasks", "self-care", "validate feelings"

### Positive Entry
Input: "I landed an internship and feel proud"

Expected Output:
- Sentiment: positive
- Guidance includes: "internship", "proud", "achievement"
- Suggestions include: "celebrate", "leverage success", "maintain momentum"

---

**Need help?** Check `docs/API_FIXES_SUMMARY.md` for detailed documentation.

