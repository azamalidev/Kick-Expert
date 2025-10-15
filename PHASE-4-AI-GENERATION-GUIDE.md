# Phase 4: AI-Powered Question Generation - Complete Guide

## 📋 Overview

Phase 4 introduces an **AI-powered question generation system** that enables admins to automatically create high-quality football trivia questions using OpenAI's GPT models. This feature dramatically speeds up question bank expansion while maintaining quality control through human review and editing capabilities.

---

## 🎯 Features

### ✨ Core Capabilities

1. **AI Question Generation**
   - Generate 1-50 questions in a single request
   - Powered by GPT-4o-mini (cost-efficient) or GPT-4 (higher quality)
   - Intelligent prompt engineering for football trivia

2. **Difficulty Distribution Control**
   - Configurable ratios: Easy / Medium / Hard
   - Visual sliders with real-time question count preview
   - Auto-adjust feature to ensure ratios sum to 100%

3. **Category & Topic Filtering**
   - 11 predefined categories (Premier League, World Cup, etc.)
   - Custom topic input (e.g., "2022 World Cup", "Cristiano Ronaldo")
   - Smart context-aware generation

4. **Human-in-the-Loop Review**
   - **Preview all generated questions before upload**
   - Edit any field: question text, choices, correct answer, explanation
   - Delete unwanted questions
   - Full quality control before database insertion

5. **Flexible Upload**
   - Choose target table: Free Quiz Questions OR Competition Questions
   - Bulk upload validated questions
   - Uses existing CSV upload infrastructure

---

## 🚀 Quick Start

### Step 1: Configure OpenAI API Key

Add your OpenAI API key to `.env.local`:

```bash
OPENAI_API_KEY=sk-proj-your-api-key-here
```

**How to get an API key:**
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign up or log in
3. Create a new API key
4. Copy and paste into `.env.local`

### Step 2: Restart Development Server

```bash
npm run dev
```

### Step 3: Access AI Generate Tab

1. Navigate to **Admin Dashboard** → **Question Bank**
2. Click the **"AI Generate"** tab (⚡ lightning icon)
3. You're ready to generate questions!

---

## 📖 Usage Guide

### Generating Questions

#### 1. Set Total Questions
- Use the **Total Questions** input field
- Range: 1-50 questions per generation
- Recommendation: Start with 10-20 for testing

#### 2. Configure Difficulty Ratio
- Adjust sliders for Easy / Medium / Hard percentages
- Must sum to **100%** (use Auto Adjust if needed)
- Example distributions:
  - **Balanced:** 40% Easy, 40% Medium, 20% Hard
  - **Beginner-Friendly:** 60% Easy, 30% Medium, 10% Hard
  - **Advanced:** 20% Easy, 30% Medium, 50% Hard

#### 3. Select Category (Optional)
Choose from:
- General
- Premier League
- La Liga
- Serie A
- Bundesliga
- Champions League
- World Cup
- European Championship
- Player Trivia
- Team History
- Records & Statistics

#### 4. Add Specific Topic (Optional)
Examples:
- "2022 World Cup"
- "Cristiano Ronaldo"
- "Manchester United history"
- "UEFA Champions League finals"

#### 5. Click "Generate Questions"
- Loading state with animated icon
- Typically takes 5-15 seconds
- Success toast shows distribution (e.g., "8 easy, 7 medium, 5 hard")

---

### Reviewing & Editing Questions

#### Preview Table
Each question card displays:
- **Difficulty badge** (color-coded: green/yellow/red)
- **Category badge**
- Question text
- All 4 choices (correct answer highlighted in green)
- Explanation

#### Edit a Question
1. Click the **Edit icon** (✏️) on any question card
2. Modify any field:
   - Question text (textarea)
   - All 4 choices
   - Correct answer (dropdown selector)
   - Explanation
   - Category and difficulty are inherited from generation
3. Click **Save Changes** or **Cancel**

#### Delete a Question
- Click the **Delete icon** (🗑️) on any question card
- Question is immediately removed from preview
- No confirmation dialog (can regenerate if needed)

#### Clear All
- Click **"Clear All"** button at top of preview
- Removes all generated questions
- Use if you want to start fresh

---

### Uploading Questions

#### 1. Select Target Table
Choose destination:
- **Free Quiz Questions** (default) - for regular free quiz mode
- **Competition Questions** - for paid competitions

#### 2. Review Question Count
Preview shows total: `Generated Questions (20)`

#### 3. Click "Upload Questions"
- Loading state with animated upload icon
- Questions are validated and inserted into database
- Success toast: "Successfully uploaded 20 questions to free_quiz_questions!"
- Preview automatically clears after successful upload

#### 4. Verify Upload
- Switch to **Competition** or **Free Quiz** tab
- Search for newly added questions
- Check category, difficulty, and content

---

## 🔧 API Reference

### Endpoint: `/api/admin/questions/generate-ai`

#### POST - Generate Questions

**Request Body:**
```json
{
  "totalQuestions": 20,
  "difficultyRatio": {
    "easy": 40,
    "medium": 40,
    "hard": 20
  },
  "category": "World Cup",
  "topic": "2022 Qatar"
}
```

**Response (Success):**
```json
{
  "success": true,
  "questions": [
    {
      "question_text": "Which country won the FIFA World Cup in 2022?",
      "choice_1": "Argentina",
      "choice_2": "France",
      "choice_3": "Brazil",
      "choice_4": "Germany",
      "correct_answer": "Argentina",
      "explanation": "Argentina won the 2022 FIFA World Cup in Qatar, defeating France 4-2 on penalties after a 3-3 draw.",
      "category": "World Cup",
      "difficulty": "easy"
    }
    // ... more questions
  ],
  "generated": 20,
  "requested": 20,
  "distribution": {
    "easy": 8,
    "medium": 8,
    "hard": 4
  },
  "model": "gpt-4o-mini",
  "tokensUsed": 2547
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "OpenAI API Error: Rate limit exceeded",
  "details": "rate_limit_error"
}
```

#### GET - Configuration Info

**Response:**
```json
{
  "success": true,
  "endpoint": "/api/admin/questions/generate-ai",
  "method": "POST",
  "description": "Generate football trivia questions using OpenAI",
  "configured": true,
  "model": "gpt-4o-mini",
  "parameters": { /* ... */ },
  "validCategories": [ /* ... */ ]
}
```

---

## 🧠 Prompt Engineering

### System Prompt
```
You are a professional football (soccer) trivia question generator.
Generate high-quality, accurate, and engaging football trivia questions.

IMPORTANT RULES:
1. Questions must be factually accurate
2. All 4 answer choices must be plausible (no obviously wrong answers)
3. Only ONE choice should be correct
4. Provide a brief explanation (1-2 sentences) for the correct answer
5. Use proper grammar and formatting
6. Questions should test real football knowledge
7. Avoid overly obscure or trick questions
8. Include a mix of topics: players, teams, tournaments, history, records, tactics, etc.
```

### User Prompt Structure
1. **Total questions** and difficulty distribution
2. **Category** and **topic** context (if provided)
3. **JSON structure specification** with example
4. **Critical reminders**: correct_answer must match a choice, difficulty counts

### Why GPT-4o-mini?
- **Cost-efficient**: ~15x cheaper than GPT-4
- **Fast**: 2-5 second response times
- **Quality**: Sufficient for structured question generation
- **Upgrade option**: Change `model: 'gpt-4o-mini'` to `model: 'gpt-4'` in route.ts

---

## ⚙️ Configuration

### Environment Variables

```bash
# .env.local
OPENAI_API_KEY=sk-proj-your-api-key-here
```

### Model Configuration

In `app/api/admin/questions/generate-ai/route.ts`:

```typescript
const completion = await openai.chat.completions.create({
  model: 'gpt-4o-mini',        // Change to 'gpt-4' for better quality
  temperature: 0.8,             // 0.0-1.0: lower = consistent, higher = creative
  max_tokens: 4000,             // Enough for 50 questions
  response_format: { type: 'json_object' }, // Force JSON response
});
```

### Quality Thresholds

Validation checks in API:
- **Question text**: 10-1000 characters
- **Choices**: All 4 must be present and non-empty
- **Correct answer**: Must exactly match one of the 4 choices
- **Difficulty**: Must be 'easy', 'medium', or 'hard'

---

## 🛡️ Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "OpenAI API key not configured" | Missing or invalid API key | Add `OPENAI_API_KEY` to `.env.local` |
| "Rate limit exceeded" | Too many API requests | Wait 60 seconds or upgrade OpenAI plan |
| "Total questions must be between 1 and 50" | Invalid input | Enter a number between 1-50 |
| "Difficulty ratios must sum to 100%" | Invalid ratio | Click "Auto Adjust" or manually fix |
| "No valid questions generated" | API returned malformed data | Try again or check API status |
| "Failed to upload questions" | Database error | Check Supabase connection |

### Validation Errors

If some generated questions fail validation:
- API returns `validationErrors` array
- Only valid questions are returned
- Common issues:
  - Correct answer doesn't match any choice
  - Missing required fields
  - Invalid difficulty value

**Example:**
```json
{
  "success": true,
  "questions": [ /* 18 valid questions */ ],
  "generated": 18,
  "requested": 20,
  "validationErrors": [
    "Question 5: correct_answer doesn't match any choice",
    "Question 12: Missing choice_4"
  ]
}
```

---

## 💰 Cost Estimation

### OpenAI Pricing (as of 2024)

**GPT-4o-mini:**
- Input: $0.15 per 1M tokens
- Output: $0.60 per 1M tokens

**GPT-4:**
- Input: $30.00 per 1M tokens
- Output: $60.00 per 1M tokens

### Example Costs

**20 questions with GPT-4o-mini:**
- Tokens used: ~2,500 (input + output)
- Cost: **$0.0015** (~0.15 cents)
- 1000 questions: **$0.075** (~7.5 cents)

**20 questions with GPT-4:**
- Cost: **$0.15** (15 cents)
- 1000 questions: **$7.50**

**Recommendation:** Use GPT-4o-mini for bulk generation, GPT-4 for premium content.

---

## 🎨 UI Components

### AIGeneratePanel.tsx

**Key Features:**
- Responsive grid layout (mobile-friendly)
- Real-time validation feedback
- Auto-adjust button for ratios
- Loading states with animations
- Edit mode toggle per question
- Bulk clear functionality

**Styling:**
- Tailwind CSS utility classes
- Gradient buttons for primary actions
- Color-coded difficulty badges
- Hover effects and transitions
- Max-height scrollable preview (600px)

---

## 🧪 Testing Checklist

### ✅ Basic Functionality
- [ ] Navigate to AI Generate tab
- [ ] Set total questions to 10
- [ ] Set difficulty: 50% easy, 30% medium, 20% hard
- [ ] Click "Generate Questions"
- [ ] Verify 10 questions appear in preview
- [ ] Check distribution matches request

### ✅ Editing & Deleting
- [ ] Click Edit on a question
- [ ] Modify question text
- [ ] Change correct answer
- [ ] Save changes
- [ ] Verify changes persist
- [ ] Delete a question
- [ ] Verify question is removed

### ✅ Upload Flow
- [ ] Select "Free Quiz Questions"
- [ ] Click "Upload Questions"
- [ ] Verify success toast
- [ ] Switch to Free Quiz tab
- [ ] Search for uploaded questions
- [ ] Verify all fields correct

### ✅ Error Handling
- [ ] Try generating with invalid ratio (not 100%)
- [ ] Try generating 51 questions (over limit)
- [ ] Remove API key temporarily
- [ ] Verify error messages display

### ✅ Category & Topic
- [ ] Generate with category "World Cup"
- [ ] Verify questions relate to World Cup
- [ ] Generate with topic "Lionel Messi"
- [ ] Verify Messi-related questions

---

## 🚀 Advanced Usage

### Custom Prompt Engineering

To modify the AI behavior, edit `route.ts`:

```typescript
const systemPrompt = `You are a professional football trivia generator.
CUSTOM RULES:
- Focus on modern football (2000-present)
- Include more tactical questions
- Prioritize European leagues
...`;
```

### Changing the AI Model

```typescript
// In route.ts, line ~119
model: 'gpt-4',              // Use GPT-4 instead
temperature: 0.7,            // Lower temperature for consistency
```

### Batch Generation Script

For generating large question sets:

```typescript
// scripts/bulk-generate.ts
async function generateBatch() {
  for (let i = 0; i < 10; i++) {
    const response = await fetch('/api/admin/questions/generate-ai', {
      method: 'POST',
      body: JSON.stringify({
        totalQuestions: 50,
        difficultyRatio: { easy: 40, medium: 40, hard: 20 },
        category: 'General',
      }),
    });
    // Process and upload...
    await delay(5000); // Rate limiting
  }
}
```

---

## 🔒 Security Considerations

### API Key Protection
- ✅ API key stored in `.env.local` (not committed to git)
- ✅ Key only accessible server-side (Next.js API routes)
- ✅ Never exposed to client-side JavaScript

### Rate Limiting
- Consider implementing request throttling
- Track usage per admin user
- Set daily generation limits

### Content Moderation
- Always review AI-generated content
- Check for inappropriate or incorrect answers
- Verify factual accuracy (especially for history/records)

---

## 📊 Performance Optimization

### Current Performance
- **Generation time**: 5-15 seconds for 20 questions
- **Token usage**: ~2,000-3,000 tokens per 20 questions
- **Database insert**: < 1 second for 50 questions

### Optimization Tips
1. **Batch uploads**: Upload 30-50 questions at once
2. **Cache categories**: Reuse category context across generations
3. **Parallel generation**: Generate multiple batches simultaneously (watch rate limits)
4. **Response streaming**: Use OpenAI streaming for real-time previews

---

## 🐛 Troubleshooting

### Issue: "OpenAI API key not configured"
**Solution:**
1. Check `.env.local` file exists in root directory
2. Verify variable name is exactly `OPENAI_API_KEY`
3. Restart Next.js dev server after adding key
4. Run: `npm run dev` again

### Issue: Questions not uploading to database
**Solution:**
1. Check Supabase connection
2. Verify CSV upload API endpoint is working
3. Check browser console for errors
4. Verify target table name matches database schema

### Issue: Generated questions have wrong difficulty
**Solution:**
1. AI doesn't always respect ratios exactly due to rounding
2. Distribution may be off by 1-2 questions
3. Review and manually adjust difficulty in database if needed

### Issue: Rate limit errors
**Solution:**
1. Wait 60 seconds between generations
2. Reduce total questions per request
3. Upgrade OpenAI API plan for higher limits
4. Use GPT-4o-mini (higher rate limits than GPT-4)

---

## 📝 Best Practices

### Content Quality
1. **Always review AI output** before uploading
2. **Edit explanations** to match your tone/style
3. **Verify factual accuracy** (dates, statistics, records)
4. **Check for bias** toward certain leagues/players
5. **Diversify topics** across categories

### Generation Strategy
1. **Start small**: Generate 10-20 questions to test
2. **Use specific topics**: Better results than generic "General"
3. **Mix difficulties**: Don't generate all easy or all hard
4. **Iterate prompts**: Modify system prompt based on results
5. **Track costs**: Monitor OpenAI usage dashboard

### Database Management
1. **Tag AI-generated questions**: Add metadata field
2. **Track performance**: Monitor AI vs. human-written question stats
3. **A/B test**: Compare AI questions to manually created ones
4. **Regular audits**: Review and remove low-performing AI questions

---

## 🔄 Integration with Existing Features

### Phase 2: Performance Insights
- AI-generated questions appear in analytics
- Track correctness rates to identify weak AI questions
- Use insights to refine generation prompts

### Phase 3: Quality Flags
- AI questions subject to same quality checks
- Flag underperforming AI questions
- Clone and improve flagged questions

### CSV Import
- AI generation reuses CSV upload infrastructure
- Both flows share validation logic
- Can export AI questions as CSV for backup

---

## 🎯 Future Enhancements

### Potential Features
- [ ] **Image generation**: Create visual question diagrams
- [ ] **Multi-language support**: Generate questions in Spanish, French, etc.
- [ ] **Difficulty auto-tuning**: AI adjusts based on user performance
- [ ] **Question templates**: Pre-defined question formats
- [ ] **Fact verification**: Integrate with football stats APIs
- [ ] **Scheduled generation**: Auto-generate N questions daily
- [ ] **Question variations**: Generate similar questions with different data

---

## 📚 Additional Resources

### Documentation
- [OpenAI API Docs](https://platform.openai.com/docs)
- [GPT-4o-mini Guide](https://platform.openai.com/docs/models/gpt-4o-mini)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

### Football Data APIs (for fact verification)
- [Football-Data.org](https://www.football-data.org/)
- [API-Football](https://www.api-football.com/)
- [TheSportsDB](https://www.thesportsdb.com/)

---

## ✅ Summary

**Phase 4 AI Generation provides:**
- 🤖 Automated question creation
- ⚙️ Full customization control
- 👁️ Human review before upload
- 📊 Quality validation
- 💰 Cost-efficient operation
- 🚀 Scalable expansion

**Result:** Admins can now generate **hundreds of high-quality questions per hour** while maintaining full quality control.

---

## 🆘 Support

If you encounter issues:
1. Check this documentation first
2. Review browser console for errors
3. Check OpenAI API status page
4. Verify Supabase connection
5. Test with smaller batches (5-10 questions)

---

**Phase 4 Complete! 🎉**

Your question bank can now scale infinitely with AI assistance while maintaining quality through human oversight.
