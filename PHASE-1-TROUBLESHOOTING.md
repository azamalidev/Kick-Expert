# 🔧 PHASE 1 TROUBLESHOOTING GUIDE

## ❌ Issue: Nothing is being tracked (last_used_at and question_stats not updating)

You reported that:
- Free quiz played but `question_stats` table is empty
- `last_used_at` column is not being updated
- Competition questions also not working

---

## ✅ FIXES APPLIED

### 1. **Fixed Free Quiz Component** (`components/Quiz.tsx`)

**Changes Made:**
- ✅ Now filters questions by `status = true` (only active questions)
- ✅ Calls `mark_question_as_used()` when questions are served
- ✅ Calls `/api/track-answer-stats` when answers are submitted

### 2. **Created Status Fix Migration**

**File:** `db/migrations/2025-10-14-fix-existing-questions-status.sql`

This migration ensures all existing questions have `status = TRUE` by default.

---

## 🔍 STEP-BY-STEP TROUBLESHOOTING

### Step 1: Verify Migrations Are Applied

Run this in Supabase SQL Editor:

```sql
-- Check if status column exists and has data
SELECT 
  COUNT(*) as total_questions,
  COUNT(*) FILTER (WHERE status = TRUE) as active,
  COUNT(*) FILTER (WHERE status = FALSE) as disabled,
  COUNT(*) FILTER (WHERE status IS NULL) as null_status
FROM competition_questions;

SELECT 
  COUNT(*) as total_questions,
  COUNT(*) FILTER (WHERE status = TRUE) as active,
  COUNT(*) FILTER (WHERE status = FALSE) as disabled,
  COUNT(*) FILTER (WHERE status IS NULL) as null_status
FROM questions;
```

**Expected Result:**
- `null_status` should be **0**
- `active` should be > 0
- All questions should have status = TRUE

**If null_status > 0:** Run the fix migration:
```sql
-- Run this:
UPDATE competition_questions SET status = TRUE WHERE status IS NULL;
UPDATE questions SET status = TRUE WHERE status IS NULL;
```

---

### Step 2: Verify Functions Exist

```sql
-- Check if functions are created
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name IN ('mark_question_as_used', 'update_question_stats')
  AND routine_schema = 'public';
```

**Expected Result:** Should show 2 functions

**If missing:** Run these migration files in order:
1. `2025-10-14-create-mark-as-used-function.sql`
2. `2025-10-14-create-update-stats-function.sql`

---

### Step 3: Test Functions Manually

```sql
-- Test mark_question_as_used function
-- Get a question ID first
SELECT id FROM questions LIMIT 1;

-- Then test the function (replace 123 with actual ID)
SELECT mark_question_as_used(p_question_id := 123);

-- Check if last_used_at was updated
SELECT id, question_text, last_used_at, status 
FROM questions 
WHERE id = 123;
```

**Expected Result:** `last_used_at` should have a timestamp

---

### Step 4: Test Stats Function

```sql
-- Test update_question_stats function
SELECT update_question_stats(
  p_question_id := 123,
  p_competition_question_id := NULL,
  p_is_correct := true,
  p_was_skipped := false,
  p_response_time_ms := 2000
);

-- Check if stats were created
SELECT * FROM question_stats WHERE question_id = 123;
```

**Expected Result:** Should see a row with times_used = 1, times_correct = 1

---

### Step 5: Verify API Endpoint

Open browser console and run:

```javascript
// Test the track-answer-stats API
fetch('/api/track-answer-stats', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    question_id: 123, // Replace with actual question ID
    competition_question_id: null,
    is_correct: true,
    was_skipped: false,
    response_time_ms: 1500
  })
})
.then(res => res.json())
.then(data => console.log('API Response:', data))
.catch(err => console.error('API Error:', err));
```

**Expected Result:** `{ success: true, message: 'Question stats updated successfully' }`

**If you get an error:**
- Check if the API file exists at `app/api/track-answer-stats/route.ts`
- Check browser console for detailed error messages
- Check server logs

---

### Step 6: Clear Cache and Restart Dev Server

Sometimes changes don't take effect due to caching:

```bash
# Stop your dev server (Ctrl+C)
# Then restart it
npm run dev
# or
yarn dev
```

---

### Step 7: Play a Test Quiz

1. **Go to Free Quiz** (`/quiz`)
2. **Answer at least 3 questions**
3. **Check the database:**

```sql
-- Check if stats were created
SELECT 
  qs.*,
  q.question_text,
  q.last_used_at
FROM question_stats qs
JOIN questions q ON qs.question_id = q.id
ORDER BY qs.updated_at DESC
LIMIT 10;
```

**Expected Result:** Should see rows with your quiz answers tracked

---

### Step 8: Check Competition Questions

1. **Create/Join a competition**
2. **Answer some questions**
3. **Check database:**

```sql
-- Check competition question stats
SELECT 
  qs.*,
  cq.question_text,
  cq.last_used_at
FROM question_stats qs
JOIN competition_questions cq ON qs.competition_question_id = cq.id
ORDER BY qs.updated_at DESC
LIMIT 10;
```

---

## 🚨 Common Issues & Solutions

### Issue 1: "Function does not exist"

**Error:** `function mark_question_as_used(p_question_id => integer) does not exist`

**Solution:** 
```sql
-- Run the function creation migration again
-- File: 2025-10-14-create-mark-as-used-function.sql
```

---

### Issue 2: "Column does not exist: status"

**Error:** `column "status" of relation "questions" does not exist`

**Solution:**
```sql
-- Run the migration to add columns
-- File: 2025-10-14-add-last-used-status-questions.sql
```

---

### Issue 3: Stats Not Updating

**Possible Causes:**
1. API endpoint not being called (check browser console)
2. CORS issues (check browser console)
3. Function failing silently

**Debug:**
```sql
-- Enable error logging
SET client_min_messages TO DEBUG1;

-- Try calling the function manually
SELECT update_question_stats(
  p_question_id := YOUR_QUESTION_ID,
  p_competition_question_id := NULL,
  p_is_correct := true,
  p_was_skipped := false,
  p_response_time_ms := 1000
);
```

---

### Issue 4: last_used_at Not Updating

**Check if mark_question_as_used is being called:**

1. Open browser DevTools (F12)
2. Go to Network tab
3. Filter by "mark" or "rpc"
4. Play a quiz
5. Look for calls to `mark_question_as_used`

**If no calls are visible:**
- The code might not be updated (hard refresh: Ctrl+Shift+R)
- Check if you're on the updated version of Quiz.tsx

---

### Issue 5: "Permission denied for table question_stats"

**Error:** `permission denied for table question_stats`

**Solution:**
```sql
-- Grant permissions (run as database admin)
GRANT ALL ON question_stats TO authenticated;
GRANT ALL ON question_stats TO anon;

-- Grant sequence permissions if needed
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
```

---

## 🔬 Advanced Debugging

### Enable Detailed Logging

Add this to your API endpoint (`app/api/track-answer-stats/route.ts`):

```typescript
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('📊 Track Stats Request:', body);
    
    const { error } = await supabase.rpc('update_question_stats', {
      p_question_id: body.question_id || null,
      p_competition_question_id: body.competition_question_id || null,
      p_is_correct: body.is_correct || false,
      p_was_skipped: body.was_skipped || false,
      p_response_time_ms: body.response_time_ms || null
    });

    if (error) {
      console.error('❌ Stats Update Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('✅ Stats Updated Successfully');
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('❌ Unexpected Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

---

## ✅ Final Verification Checklist

After applying all fixes:

- [ ] Run the status fix migration
- [ ] Restart dev server
- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] Play a free quiz and answer 3+ questions
- [ ] Check `question_stats` table has data
- [ ] Check `last_used_at` is updated in `questions` table
- [ ] Play a competition
- [ ] Check `competition_questions.last_used_at` is updated
- [ ] Verify stats appear in Admin Panel

---

## 📞 Still Not Working?

If after all these steps it's still not working:

1. **Check Supabase Logs:**
   - Go to Supabase Dashboard
   - Click on "Logs" in the left sidebar
   - Look for errors related to your functions

2. **Check Browser Console:**
   - F12 → Console tab
   - Look for JavaScript errors
   - Look for failed network requests

3. **Check Server Logs:**
   - Look at your terminal where dev server is running
   - Look for error messages

4. **Verify Environment Variables:**
   - Make sure `NEXT_PUBLIC_SUPABASE_URL` is set
   - Make sure `SUPABASE_SERVICE_ROLE_KEY` is set

---

## 🎯 Quick Fix Summary

**Run these in order:**

1. **In Supabase SQL Editor:**
```sql
-- Ensure all questions have status = true
UPDATE competition_questions SET status = TRUE WHERE status IS NULL;
UPDATE questions SET status = TRUE WHERE status IS NULL;
```

2. **In Terminal:**
```bash
# Restart dev server
# Press Ctrl+C to stop, then:
npm run dev
```

3. **In Browser:**
- Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

4. **Test:**
- Play a free quiz
- Check database for stats

---

**Last Updated:** October 14, 2025  
**Status:** All fixes applied ✅
