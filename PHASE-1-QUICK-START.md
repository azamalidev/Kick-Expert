# 🚀 Phase 1 Quick Start Guide

## Step 1: Run Migration Files in Supabase

Since you've already run the queries, verify they're applied by running these checks in your Supabase SQL editor:

### Verification Queries

```sql
-- Check if columns exist in competition_questions
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'competition_questions' 
  AND column_name IN ('last_used_at', 'status');

-- Check if columns exist in questions
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'questions' 
  AND column_name IN ('last_used_at', 'status');

-- Check if question_stats table exists
SELECT * FROM information_schema.tables 
WHERE table_name = 'question_stats';

-- Check if functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_name IN ('mark_question_as_used', 'update_question_stats');
```

### If Any Are Missing, Run These In Order:

1. **`db/migrations/2025-10-14-add-last-used-status-competition-questions.sql`**
2. **`db/migrations/2025-10-14-add-last-used-status-questions.sql`**
3. **`db/migrations/2025-10-14-create-question-stats-table.sql`**
4. **`db/migrations/2025-10-14-create-update-stats-function.sql`**
5. **`db/migrations/2025-10-14-create-mark-as-used-function.sql`**

---

## Step 2: Test the Admin Panel

1. Go to your admin dashboard: `/admindashboard/question`
2. You should now see:
   - ✅ **Status column** with green "✓ Active" or red "✗ Disabled" buttons
   - ✅ **Stats column** showing usage, correct %, and avg time
   - ✅ **Last Used column** showing when questions were last served

### Test Status Toggle:
- Click on any status button
- It should toggle between Active/Disabled
- Disabled questions won't appear in competitions

---

## Step 3: Test Question Tracking

1. **Create a competition** with some questions
2. **Join and play** the competition
3. **Answer a few questions**
4. **Go back to Admin Panel** → Questions
5. You should see:
   - ✅ "Last Used" timestamp updated
   - ✅ Stats showing times used, correct %, avg response time

---

## Step 4: Verify API Integration

### Test Question Fetching:
```bash
# In browser console or API client
fetch('/api/competition-questions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ competitionId: 'your-competition-id' })
})
.then(res => res.json())
.then(data => console.log('Questions:', data));
```

**Expected:** Only questions with `status = true` should be returned.

### Test Stats Tracking:
```bash
# After answering a question
fetch('/api/track-answer-stats', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    competition_question_id: 'question-uuid',
    is_correct: true,
    was_skipped: false,
    response_time_ms: 2500
  })
})
.then(res => res.json())
.then(data => console.log('Stats updated:', data));
```

**Expected:** `{ success: true, message: 'Question stats updated successfully' }`

---

## Step 5: Check Database Stats

Run this query in Supabase to see your question statistics:

```sql
SELECT 
  qs.*,
  CASE 
    WHEN qs.question_id IS NOT NULL THEN 'Free Quiz'
    ELSE 'Competition'
  END as question_source,
  CASE 
    WHEN qs.question_id IS NOT NULL THEN q.question_text
    ELSE cq.question_text
  END as question_text
FROM question_stats qs
LEFT JOIN questions q ON qs.question_id = q.id
LEFT JOIN competition_questions cq ON qs.competition_question_id = cq.id
ORDER BY qs.times_used DESC
LIMIT 20;
```

---

## 🎯 What to Look For

### ✅ Successful Implementation Indicators:

1. **Admin Panel:**
   - Status buttons are clickable and change color
   - Stats show actual numbers (not always "No data")
   - Last Used shows timestamps after questions are used

2. **Competition Play:**
   - Only enabled questions appear in competitions
   - Questions get marked as "used" after serving
   - Stats update after answering

3. **Database:**
   - `question_stats` table has records
   - `last_used_at` timestamps are updating
   - `status` column controls question visibility

---

## 🐛 Troubleshooting

### Issue: Stats show "No data"
**Solution:** Play through a competition to generate stats data.

### Issue: Status toggle doesn't work
**Solution:** Check browser console for errors. Verify `status` column exists:
```sql
SELECT status FROM competition_questions LIMIT 1;
```

### Issue: Old questions still appearing after disabling
**Solution:** Clear cache or restart dev server. Verify API is filtering by `status = true`.

### Issue: Last Used not updating
**Solution:** Check if `mark_question_as_used()` function exists:
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'mark_question_as_used';
```

---

## 📊 Expected Results After Testing

After playing a competition with 10 questions:

- **question_stats table:** 10 new records
- **last_used_at:** All 10 questions should have timestamps
- **Admin UI:** Should display:
  - Times used: 1x (for each question)
  - Correct %: Based on your answers
  - Avg Time: Your response times

---

## 🎉 Success Criteria

Phase 1 is working correctly when:

- [x] Questions can be disabled via Admin UI
- [x] Disabled questions don't appear in competitions
- [x] Stats update automatically as users answer
- [x] Last Used timestamps show when questions were served
- [x] Admin can see usage patterns at a glance
- [x] No errors in browser console or server logs

---

## 📞 Need Help?

If something isn't working:

1. Check the **browser console** for JavaScript errors
2. Check **Supabase logs** for database errors
3. Verify **all 5 migration files** were run successfully
4. Ensure **API endpoints** are accessible (no 404s)
5. Check **table permissions** in Supabase RLS policies

---

## ✨ Next: Move to Phase 2

Once everything is working, you're ready for **Phase 2: Admin Insights & Visualization**!

This will add:
- 📊 Analytics dashboard
- 📈 Charts and graphs
- 🔄 Rotation visualization
- 📉 Performance trends
