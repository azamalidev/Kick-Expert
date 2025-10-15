# Quality Flags Troubleshooting Guide

## Issue: No flags appearing after playing quiz

### Root Cause
Quality flags are **NOT automatically created** when users answer questions. They must be **manually triggered** by an admin through the UI or API.

---

## How Quality Flags Work

### The Process Flow

```
1. User plays quiz
   ↓
2. Answer data saved to question_stats table
   ↓
3. Admin manually clicks "Run Quality Check"
   ↓
4. API scans question_stats for issues
   ↓
5. Flags created in question_quality_flags table
   ↓
6. Flags displayed in Quality Flags tab
```

**Key Point:** Step 3 is MANUAL - it doesn't happen automatically!

---

## ✅ Solution: Run Quality Check

### Method 1: Use the UI (Recommended)

1. **Navigate:** Admin Dashboard → Question Bank
2. **Click:** "Quality Flags" tab (4th tab with ⚠️ icon)
3. **Click:** "Run Quality Check" button (top of the page)
4. **Wait:** Scan takes 2-5 seconds for 100 questions
5. **View:** Flags will appear in the list below

### Method 2: Use the API Directly

Open browser console (F12) and run:

```javascript
fetch('/api/admin/quality-flags', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ operation: 'run-check' })
})
.then(r => r.json())
.then(data => {
  console.log('Quality Check Results:', data);
  console.log(`Created ${data.newFlagsCreated} new flags`);
  console.log('Flag counts by type:', data.flagCountsByType);
});
```

### Method 3: Run SQL Query Manually

If you want to check the underlying data:

```sql
-- Check if your quiz answers are being recorded
SELECT 
  question_id,
  question_type,
  times_used,
  times_answered,
  times_correct,
  correct_percentage,
  avg_response_time_ms
FROM question_stats
WHERE times_used > 0
ORDER BY times_used DESC
LIMIT 10;

-- Manually check for quality issues
SELECT 
  q.id,
  q.question_text,
  qs.times_used,
  qs.correct_percentage,
  qs.avg_response_time_ms,
  CASE 
    WHEN qs.correct_percentage < 30 AND qs.times_used >= 50 THEN 'CRITICAL'
    WHEN qs.correct_percentage < 50 AND qs.times_used >= 20 THEN 'WARNING'
    WHEN qs.correct_percentage > 95 AND qs.times_used >= 50 THEN 'TOO EASY'
    WHEN qs.avg_response_time_ms > 60000 THEN 'SLOW'
  END as potential_flag
FROM questions q
LEFT JOIN question_stats qs ON q.id = qs.question_id AND qs.question_type = 'free_quiz'
WHERE qs.times_used > 0
  AND (
    (qs.correct_percentage < 30 AND qs.times_used >= 50) OR
    (qs.correct_percentage < 50 AND qs.times_used >= 20) OR
    (qs.correct_percentage > 95 AND qs.times_used >= 50) OR
    (qs.avg_response_time_ms > 60000)
  );
```

---

## 🔍 Verify Your Data

### Step 1: Check if quiz answers are recorded

Run this in Supabase SQL Editor:

```sql
-- Should return rows with times_used > 0
SELECT COUNT(*) as questions_with_usage
FROM question_stats
WHERE times_used > 0;
```

**Expected Result:** At least 1 row if you played a quiz

### Step 2: Check specific question stats

```sql
-- See stats for all questions you answered
SELECT 
  question_id,
  competition_question_id,
  question_type,
  times_used,
  times_answered,
  times_correct,
  correct_percentage,
  avg_response_time_ms,
  created_at
FROM question_stats
WHERE times_used > 0
ORDER BY updated_at DESC
LIMIT 20;
```

### Step 3: Check if any flags exist

```sql
-- Check existing flags
SELECT COUNT(*) as total_flags
FROM question_quality_flags;
```

**Expected Result:** 0 if you haven't run quality check yet

---

## ⚙️ Quality Detection Thresholds

### Why Your Questions Might NOT Be Flagged

Flags require **minimum usage counts** to avoid false positives:

| Flag Type | Threshold | Minimum Uses | Reason |
|-----------|-----------|--------------|--------|
| **Critical** | < 30% correct | **50+ uses** | Very low success |
| **Warning** | < 50% correct | **20+ uses** | Below average |
| **Too Easy** | > 95% correct | **50+ uses** | Too obvious |
| **Slow** | > 60 seconds | **10+ uses** | Takes too long |
| **High Skip** | > 40% skip rate | **20+ uses** | Often skipped |
| **Unused** | 0 uses | 30+ days old | Never used |

**Example:**
- You answered 1 question with 25% correct → **NO FLAG** (only 1 use, needs 50+)
- Question answered 25 times with 25% correct → **NO FLAG** (needs 50+ for critical)
- Question answered 55 times with 25% correct → **✅ FLAG CREATED** (critical)

---

## 🚀 Quick Test (If No Flags Appear)

### Test with Lower Thresholds (Development Only)

Temporarily modify the API to use lower thresholds for testing:

**File:** `app/api/admin/quality-flags/route.ts`

```typescript
// Change line ~15
const QUALITY_THRESHOLDS = {
  CRITICAL_CORRECT_PERCENTAGE: 30,
  CRITICAL_MIN_USES: 1,  // Change from 50 to 1 for testing
  WARNING_CORRECT_PERCENTAGE: 50,
  WARNING_MIN_USES: 1,   // Change from 20 to 1 for testing
  TOO_EASY_PERCENTAGE: 95,
  TOO_EASY_MIN_USES: 1,  // Change from 50 to 1 for testing
  SLOW_RESPONSE_TIME_MS: 60000,
  HIGH_SKIP_RATE: 40,
  UNUSED_DAYS: 30
};
```

**Then:**
1. Restart your dev server
2. Run quality check again
3. Should now create flags even with 1 use

**Remember:** Change these back to production values before deploying!

---

## 🔄 Automating Quality Checks

### Option 1: Schedule with Cron Job

Create a cron job to run quality checks daily:

**File:** `app/api/cron/quality-check/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Trigger quality check
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/quality-flags`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operation: 'run-check' })
  });

  const result = await response.json();
  
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    result
  });
}
```

**Set up Vercel Cron:**

```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/quality-check",
    "schedule": "0 2 * * *"  // Run at 2 AM daily
  }]
}
```

### Option 2: Trigger After Quiz Completion

Add quality check to quiz completion handler (checks only that question):

```typescript
// In your quiz completion API
async function onQuizComplete(questionId: number, source: string) {
  // ... save answer ...
  
  // Check if this question needs flagging
  const response = await fetch('/api/admin/quality-flags', {
    method: 'POST',
    body: JSON.stringify({ 
      operation: 'run-check',
      questionIds: [questionId],
      source 
    })
  });
}
```

---

## 📊 Sample API Response

When you run quality check successfully, you should see:

```json
{
  "success": true,
  "newFlagsCreated": 5,
  "flagCountsByType": {
    "critical": 2,
    "warning": 3,
    "too_easy": 0,
    "slow": 0,
    "high_skip": 0,
    "unused": 0
  },
  "totalActiveFlags": 5,
  "message": "Created 5 new quality flags"
}
```

If no flags created:

```json
{
  "success": true,
  "newFlagsCreated": 0,
  "flagCountsByType": {},
  "totalActiveFlags": 0,
  "message": "No new quality issues detected"
}
```

---

## ❓ FAQ

### Q: I played quiz but no flags appear, even after running check
**A:** Your questions likely don't meet the minimum usage thresholds. Check question_stats table to see actual usage counts.

### Q: How often should I run quality checks?
**A:** 
- **Development:** Manually as needed
- **Production:** Daily via cron job
- **High Traffic:** Multiple times per day

### Q: Can flags be created automatically?
**A:** Yes, but you need to implement one of the automation methods above (cron job or post-quiz trigger).

### Q: Why do we need minimum usage counts?
**A:** To avoid false positives. A question answered once with 0% correct isn't necessarily bad - it needs more data.

### Q: Can I lower the thresholds?
**A:** Yes, but only for testing. Production thresholds are set based on statistical significance.

---

## 🐛 Common Issues

### Issue 1: "No data to analyze"
**Cause:** question_stats table is empty  
**Solution:** Play some quizzes first, then run quality check

### Issue 2: "0 flags created" but questions clearly have issues
**Cause:** Questions don't meet minimum usage thresholds  
**Solution:** 
- Wait for more usage data, OR
- Temporarily lower thresholds for testing, OR
- Check if stats are being recorded correctly

### Issue 3: API returns 500 error
**Cause:** Database connection or query error  
**Solution:** Check server logs, verify migration ran successfully

### Issue 4: Flags appear but wrong data
**Cause:** Stats calculation might be incorrect  
**Solution:** Check question_stats table directly, verify calculations

---

## 🎯 Quick Checklist

- [ ] Database migration ran successfully
- [ ] Question_stats table has data (times_used > 0)
- [ ] Played at least 20-50 quizzes for meaningful data
- [ ] Clicked "Run Quality Check" button
- [ ] Checked browser console for API errors
- [ ] Verified question_quality_flags table for results

---

## 📞 Still Not Working?

If flags still don't appear after running quality check:

1. **Check browser console** for errors (F12)
2. **Check server logs** for API errors
3. **Run SQL queries** above to verify data exists
4. **Test API directly** using browser console
5. **Verify thresholds** - your questions might not meet minimum usage

---

**Last Updated:** October 15, 2025  
**Related Docs:** PHASE-3-COMPLETE-GUIDE.md, PHASE-3-QUICK-START.md
