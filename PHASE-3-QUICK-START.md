# Phase 3: Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Run Database Migration (2 minutes)

**Option A: Using Supabase Dashboard**
1. Go to your Supabase project
2. Click "SQL Editor" in sidebar
3. Click "New Query"
4. Copy contents of `db/migrations/2025-10-15-phase3-quality-management.sql`
5. Paste and click "Run"
6. ✅ Success message should appear

**Option B: Using psql**
```bash
psql -h your-supabase-host \ 
     -U postgres \
     -d postgres \
     -f db/migrations/2025-10-15-phase3-quality-management.sql
```

**Verify:**
```sql
SELECT * FROM question_quality_flags LIMIT 1;
-- Should return empty result (no errors)
```

---

### Step 2: Add Import Statements (30 seconds)

Open `components/Admin/Question.tsx` and add at the top with other imports:

```tsx
import QualityFlagsPanel from '@/components/Admin/QualityFlagsPanel';
import QuestionDetailModal from '@/components/Admin/QuestionDetailModal';
import { FiAlertTriangle, FiCopy } from 'react-icons/fi'; // Add these icons
```

---

### Step 3: Add State & Components (5 minutes)

**A. Add state variables:**
```tsx
// Find existing useState declarations and add these:
const [showDetailModal, setShowDetailModal] = useState(false);
const [selectedQuestionId, setSelectedQuestionId] = useState<string | number>('');
const [selectedQuestionSource, setSelectedQuestionSource] = useState<'free_quiz' | 'competition'>('free_quiz');
```

**B. Update activeTab type:**
```tsx
// Find: const [activeTab, setActiveTab] = useState<...>
// Change to include 'QualityFlags':
const [activeTab, setActiveTab] = useState<'Competition' | 'FreeQuiz' | 'Insights' | 'QualityFlags'>('Competition');
```

**C. Add handler function:**
```tsx
// Add before the return statement:
const handleOpenDetailModal = (source: string, id: string | number) => {
  setSelectedQuestionId(id);
  setSelectedQuestionSource(source as 'free_quiz' | 'competition');
  setShowDetailModal(true);
};

const handleCloneQuestion = async (question: Question) => {
  const source = activeTab === 'FreeQuiz' ? 'free_quiz' : 'competition';
  
  try {
    const toastId = toast.loading('Cloning question...');
    const response = await fetch('/api/admin/questions/clone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source,
        questionId: source === 'free_quiz' ? question.id : undefined,
        competitionQuestionId: source === 'competition' ? question.id : undefined,
      })
    });
    
    const data = await response.json();
    if (data.success) {
      toast.success('Question cloned!', { id: toastId });
      fetchQuestions();
    } else {
      toast.error('Clone failed', { id: toastId });
    }
  } catch (error) {
    toast.error('Error cloning question');
  }
};
```

**D. Add Quality Flags tab button:**

Find the tab buttons section (where you have Competition, FreeQuiz, Insights buttons) and add:

```tsx
<button 
  className={`px-6 py-3 font-medium flex items-center gap-2 ${
    activeTab === 'QualityFlags' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'
  }`}
  onClick={() => setActiveTab('QualityFlags')}
>
  <FiAlertTriangle />
  Quality Flags
</button>
```

**E. Add Quality Flags tab content:**

After the Insights tab content section, add:

```tsx
{/* Phase 3: Quality Flags */}
{activeTab === 'QualityFlags' && (
  <div className="p-6">
    <QualityFlagsPanel onQuestionClick={handleOpenDetailModal} />
  </div>
)}
```

**F. Add Detail Modal:**

Before the final closing `</div>` tags (after Toaster and Delete Modal), add:

```tsx
{/* Phase 3: Question Detail Modal */}
<QuestionDetailModal
  isOpen={showDetailModal}
  onClose={() => setShowDetailModal(false)}
  questionId={selectedQuestionId}
  source={selectedQuestionSource}
  onEdit={(question) => {
    setShowDetailModal(false);
    // Populate edit form with question data
    setEditingQuestion(question);
  }}
  onClone={async (question) => {
    setShowDetailModal(false);
    await handleCloneQuestion(question);
  }}
/>
```

**G. Make question text clickable (Optional but recommended):**

In your questions table, find the question text cell and update it:

```tsx
<td className="px-6 py-4">
  <div
    className="text-sm text-gray-900 cursor-pointer hover:text-indigo-600 hover:underline transition-colors"
    onClick={() => handleOpenDetailModal(
      activeTab === 'FreeQuiz' ? 'free_quiz' : 'competition',
      question.id
    )}
    title="Click to view details"
  >
    {question.question_text.substring(0, 100)}...
  </div>
</td>
```

**H. Add clone button to each question row (Optional):**

In the actions column of your table, add:

```tsx
<button
  onClick={() => handleCloneQuestion(question)}
  className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
  title="Clone Question"
>
  <FiCopy />
</button>
```

---

### Step 4: Test Everything (2 minutes)

1. **Restart dev server:**
   ```bash
   npm run dev
   ```

2. **Hard refresh browser:** `Ctrl+Shift+F5`

3. **Test Quality Flags:**
   - Go to Admin → Questions → **Quality Flags** tab
   - Click "Run Quality Check"
   - Should see summary cards and any flagged questions

4. **Test Detail Modal:**
   - Click any question text
   - Modal should open with full details
   - Try switching tabs (Overview, Analytics, Related)

5. **Test Clone:**
   - Click "Clone Question" in detail modal
   - Or click clone button (copy icon) on any question row
   - Success toast should appear
   - Refresh list to see cloned question

---

## ✅ You're Done!

**Phase 3 Features Now Active:**
- ✅ Automated quality detection
- ✅ Question cloning
- ✅ Detailed question view
- ✅ Performance analytics
- ✅ Quality flags management

---

## 🐛 Quick Troubleshooting

**Issue: "Table does not exist" error**
→ Solution: Run Step 1 database migration again

**Issue: Quality Flags tab shows nothing**
→ Solution: Click "Run Quality Check" button to scan questions

**Issue: Detail modal doesn't open**
→ Solution: Check browser console for errors, verify Step 3F was completed

**Issue: Clone button doesn't work**
→ Solution: Verify Step 3C handler function was added

**Issue: TypeScript errors**
→ Solution: Make sure all imports from Step 2 are added

---

## 📖 Full Documentation

For complete details, see:
- `PHASE-3-COMPLETE-GUIDE.md` - Full implementation guide
- `PHASE-3-REQUIREMENTS.md` - Requirements and architecture

---

## 🎉 Success!

Phase 3 adds powerful quality management tools to your Question Bank:

**Before Phase 3:**
- Manual quality checks
- No cloning functionality
- Limited question insights

**After Phase 3:**
- Automated quality detection (6 flag types)
- One-click question cloning
- Comprehensive detail view with analytics
- Performance trend tracking
- Related questions suggestions

**Total Setup Time:** 10 minutes  
**Lines of Code:** Just copy-paste the snippets above!

---

Need help? Check `PHASE-3-COMPLETE-GUIDE.md` for detailed explanations of each feature.
