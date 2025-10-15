# Phase 2: Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Run Database Migration

```sql
-- In Supabase SQL Editor, run:
```

Copy and paste the entire content from:
`db/migrations/2025-10-15-create-analytics-view.sql`

**Verify it worked:**
```sql
SELECT COUNT(*) FROM question_analytics_view;
-- Should return total number of questions
```

### Step 2: Restart Server

```powershell
# Stop server (Ctrl+C in terminal)
npm run dev

# Then hard refresh browser
# Press Ctrl+Shift+F5
```

### Step 3: Explore Features

1. **Go to Admin Panel** → Questions
2. **Click "Performance Insights" tab** 📊
3. **See your data visualized!**

---

## 🎯 Quick Feature Overview

### Performance Insights Tab

**What you'll see:**
- 📊 Total questions and active count
- 📈 Total usage across all questions
- 🎯 Average correct percentage
- ⏱️ Average response time
- 📉 3 charts (difficulty, category, performance)
- 🏆 Top 10 performers
- ⚠️ Questions needing improvement
- 📈 Most/least used questions

**When to use:** Weekly review to identify which questions are performing well and which need updates.

### Bulk Operations

**Select multiple questions:**
1. Click checkboxes next to questions
2. Use bulk buttons:
   - **Enable Selected** - Activate multiple at once
   - **Disable Selected** - Deactivate multiple at once
   - **Delete Selected** - Remove multiple (with confirmation)

**When to use:** 
- Quickly enable/disable seasonal questions
- Mass cleanup of old questions
- Batch status changes

### Export Data

**Two formats available:**
- **CSV** - For Excel/Google Sheets analysis
- **JSON** - For backup or programmatic use

**When to use:**
- Monthly reporting to stakeholders
- Backing up question bank
- External analysis in other tools

---

## 💡 Pro Tips

### Tip 1: Regular Review
Check the **Insights tab weekly** to:
- Find questions with low correct % → Consider rewording
- Identify never-used questions → Activate them
- See most-used questions → Add variety

### Tip 2: Bulk Seasonal Updates
For seasonal content (e.g., World Cup questions):
1. Search for category: "World Cup"
2. Select all
3. Click "Enable Selected" during event
4. Click "Disable Selected" after event

### Tip 3: Export Before Major Changes
Before bulk deletions:
1. Click "Export JSON" to backup
2. Save file with date: `questions_backup_2025-10-15.json`
3. Now you can safely delete and restore if needed

### Tip 4: Use Charts for Balance
Check the **Difficulty Distribution** pie chart:
- Aim for: 40% Easy, 40% Medium, 20% Hard
- Adjust by adding/removing questions as needed

### Tip 5: Monitor Top Performers
Questions in **Top Performers** with 90%+ correct:
- Consider making them slightly harder
- Or use as confidence boosters in quiz flow

---

## ⚡ Quick Actions

### Find Problematic Questions
1. Go to **Insights** tab
2. Scroll to **"Needs Improvement"**
3. Click question IDs to review
4. Edit or disable poor performers

### Activate Unused Questions
1. Go to **Insights** tab
2. Scroll to **"Never Used"**
3. Note the categories
4. Switch to Competition/FreeQuiz tab
5. Enable those questions

### Monthly Export Routine
```
1. Click "Export CSV"
2. Save as: questions_YYYY-MM.csv
3. Upload to Google Drive/SharePoint
4. Create monthly report
```

---

## 🔥 Common Workflows

### Workflow 1: New Question Category Launch
```
Day 1: Add 50 new "Space" questions
Day 7: Check Insights → Space category usage
Week 2: Review Space questions performance
Month 1: Export Space stats, analyze
```

### Workflow 2: Quarterly Cleanup
```
1. Insights → "Never Used" list
2. Select all never-used questions
3. Bulk Disable (not delete, keep backup)
4. Monitor for 30 days
5. If still unused, Bulk Delete
```

### Workflow 3: Performance Audit
```
1. Export JSON (full backup)
2. Insights → "Worst Performers"
3. Review each question text
4. Edit to clarify wording
5. Monitor improvement next week
```

---

## 📊 Understanding the Charts

### Difficulty Distribution (Pie Chart)
- **Green** = Easy questions
- **Yellow** = Medium questions  
- **Red** = Hard questions

**Goal:** Balanced distribution matching your quiz difficulty targets.

### Category Distribution (Bar Chart)
Shows question count per category.

**Goal:** Even distribution unless some categories are more important.

### Performance Distribution (Pie Chart)
- **Red** = Poor (0-20% correct)
- **Yellow** = Fair (20-40% correct)
- **Green** = Good (40-60% correct)
- **Blue** = Excellent (60-80%+ correct)

**Goal:** Most questions in Good/Excellent, few in Poor.

---

## 🆘 Quick Troubleshooting

**Insights tab empty?**
```sql
-- Check if view exists
SELECT * FROM question_analytics_view LIMIT 1;

-- If error, rerun migration
\i db/migrations/2025-10-15-create-analytics-view.sql
```

**Bulk operations not working?**
- Check browser console (F12) for errors
- Verify Supabase connection
- Try refreshing page

**Export not downloading?**
- Check browser download permissions
- Disable popup blocker
- Try different browser

**Charts not showing?**
- Hard refresh: Ctrl+Shift+F5
- Check if Recharts installed: `npm list recharts`
- Restart dev server

---

## 📈 Success Metrics

After Phase 2, you can track:

✅ **Question Quality**
- Average correct percentage trend
- Response time improvements
- Skip rate reductions

✅ **Content Balance**
- Even category distribution
- Balanced difficulty spread
- Regular question rotation

✅ **Efficiency Gains**
- Time saved with bulk operations
- Faster data exports
- Quick performance reviews

---

## 🎓 Next Steps

Once comfortable with Phase 2:

1. **Set up weekly review routine**
   - Check Insights every Monday
   - Export monthly reports
   - Update poor performers

2. **Document your process**
   - Create internal guidelines
   - Train other admins
   - Share best practices

3. **Optimize question bank**
   - Aim for target distributions
   - Retire unused questions
   - Add variety to popular categories

---

## 📞 Support

**Having issues?**
1. Check `PHASE-2-COMPLETE-GUIDE.md` for detailed docs
2. Review `PHASE-2-TROUBLESHOOTING.md` (if created)
3. Check browser console for errors

**Need help with:**
- Database migrations → See SQL error messages
- API issues → Check Network tab in DevTools
- UI problems → Check React error messages

---

## ✅ Quick Checklist

Before considering Phase 2 complete:

- [ ] Migration run successfully
- [ ] Insights tab shows data
- [ ] Charts render correctly
- [ ] Bulk enable works
- [ ] Bulk disable works
- [ ] Bulk delete works (with confirmation)
- [ ] CSV export downloads
- [ ] JSON export downloads
- [ ] Stats refresh button works
- [ ] All 3 tabs accessible

**All checked?** You're ready to use Phase 2! 🎉

---

**Updated:** October 15, 2025  
**Version:** 2.0.0-quickstart  
**Est. Read Time:** 5 minutes  
**Est. Setup Time:** 10 minutes
