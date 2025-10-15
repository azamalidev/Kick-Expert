# Phase 3: Advanced Analytics & Automation - Requirements Document

## 📅 Date: October 15, 2025

## 🎯 Phase 3 Objectives

Building on Phase 2's analytics foundation, Phase 3 focuses on:
1. **Historical Trends** - Time-series analysis of question performance
2. **Automated Quality Management** - Auto-flagging problematic questions
3. **Advanced Filtering & Search** - Smart filters and saved views
4. **Question Cloning & Templates** - Reuse successful patterns
5. **Detailed Question View** - Deep-dive analytics per question

---

## 📋 Phase 3 Feature List

### 1. Historical Trends & Time-Series Analytics ⭐
**Priority:** HIGH

#### Features:
- **Usage Trends Chart** - Line chart showing question usage over last 30 days
- **Performance Trends Chart** - Correct percentage trends over time
- **Response Time Trends** - Average response time changes
- **Weekly/Monthly Aggregation** - Toggle between time periods
- **Trend Indicators** - Up/down arrows showing improvement/decline

#### Database Requirements:
- New table: `question_performance_history`
  - Stores daily snapshots of question metrics
  - Enables time-series queries

#### API Requirements:
- `GET /api/admin/question-trends?questionId=123&period=30days`
- Returns time-series data for charts

---

### 2. Automated Quality Management ⭐
**Priority:** HIGH

#### Features:
- **Auto-Flag System** - Automatically flags questions needing attention
- **Quality Flags:**
  - 🔴 **Critical:** < 30% correct rate (50+ uses)
  - 🟡 **Warning:** < 50% correct rate (20+ uses)
  - 🟠 **Too Easy:** > 95% correct rate (50+ uses)
  - ⏱️ **Slow:** Avg response time > 60 seconds
  - ❌ **High Skip Rate:** > 40% skip rate
  - 💤 **Unused:** Never used in 30+ days (active questions)

#### Features:
- **Automated Actions Panel** - Shows flagged questions with reasons
- **Bulk Actions on Flagged** - Disable/edit flagged questions
- **Flag History** - Track when questions were flagged/resolved
- **Email Notifications** - Weekly digest of flagged questions

#### Database Requirements:
- New table: `question_quality_flags`
  - Stores current flags and history
  - Tracks resolution status

---

### 3. Advanced Filtering & Search ⭐
**Priority:** MEDIUM

#### Features:
- **Smart Filters:**
  - Performance score (1-5 stars)
  - Date added/modified ranges
  - Usage count ranges
  - Response time ranges
  - Skip rate ranges
- **Saved Filter Views** - Save commonly used filter combinations
- **Quick Filters:** 
  - "High Performers"
  - "Needs Attention"
  - "Recently Added"
  - "Rarely Used"
- **Search Enhancements:**
  - Search by question ID
  - Search in explanations
  - Search in correct answers

#### UI Requirements:
- Collapsible advanced filters panel
- Filter pills showing active filters
- One-click filter clearing

---

### 4. Question Cloning & Templates ⭐
**Priority:** MEDIUM

#### Features:
- **Clone Question** - Duplicate existing question with one click
- **Edit Clone** - Modify cloned question before saving
- **Bulk Clone** - Clone multiple questions at once
- **Question Templates:**
  - Save question structure as template
  - Apply template to create new questions
  - Template library (5-10 common formats)

#### UI Requirements:
- Clone button on each question row
- Template selector in "Add Question" modal
- Template manager in settings

---

### 5. Detailed Question View (Drill-Down) ⭐
**Priority:** HIGH

#### Features:
- **Modal/Page for Single Question:**
  - Full question text and all choices
  - Complete statistics breakdown
  - Usage history timeline
  - Performance trends chart
  - Recent answer distribution
  - Response time distribution
  - User feedback (if available)
  
- **Edit-in-Place:**
  - Edit question details in detail view
  - Preview changes before saving
  - Track edit history

- **Related Questions:**
  - Show similar questions by category
  - Show questions with similar performance
  - Link to related questions

#### UI Requirements:
- Click question text to open detail view
- Full-screen modal or side panel
- Tabs for different sections (Overview, Analytics, History, Edit)

---

### 6. Enhanced Export Features ⭐
**Priority:** LOW

#### Features:
- **Export with Filters** - Export only filtered questions
- **Custom Export Fields** - Choose which columns to include
- **Export Templates** - Save export configurations
- **PDF Reports:**
  - Include charts and graphs
  - Professional formatting
  - Custom branding
- **Scheduled Exports:**
  - Daily/weekly automated exports
  - Email delivery
  - Cloud storage integration

---

## 🗄️ Database Schema Changes

### New Tables:

#### 1. `question_performance_history`
```sql
CREATE TABLE question_performance_history (
  id SERIAL PRIMARY KEY,
  question_id INTEGER NULL,
  competition_question_id UUID NULL,
  question_source VARCHAR(20) NOT NULL, -- 'free_quiz' | 'competition'
  date DATE NOT NULL,
  times_used INTEGER DEFAULT 0,
  times_answered INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  times_skipped INTEGER DEFAULT 0,
  correct_percentage DECIMAL(5,2) DEFAULT 0,
  avg_response_time_ms INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(question_source, question_id, competition_question_id, date)
);

CREATE INDEX idx_perf_history_date ON question_performance_history(date);
CREATE INDEX idx_perf_history_source ON question_performance_history(question_source);
```

#### 2. `question_quality_flags`
```sql
CREATE TABLE question_quality_flags (
  id SERIAL PRIMARY KEY,
  question_id INTEGER NULL,
  competition_question_id UUID NULL,
  question_source VARCHAR(20) NOT NULL,
  flag_type VARCHAR(50) NOT NULL, -- 'critical', 'warning', 'too_easy', 'slow', 'high_skip', 'unused'
  flag_reason TEXT,
  flag_value DECIMAL(10,2), -- The metric value that triggered the flag
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'resolved', 'dismissed'
  flagged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  resolved_by VARCHAR(100) NULL,
  notes TEXT NULL
);

CREATE INDEX idx_flags_status ON question_quality_flags(status);
CREATE INDEX idx_flags_type ON question_quality_flags(flag_type);
CREATE INDEX idx_flags_source ON question_quality_flags(question_source);
```

#### 3. `saved_filter_views`
```sql
CREATE TABLE saved_filter_views (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  view_name VARCHAR(100) NOT NULL,
  filters JSONB NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_saved_views_user ON saved_filter_views(user_id);
```

---

## 🔌 API Endpoints

### 1. Trends API
```
GET /api/admin/question-trends
- Query params: questionId, competitionQuestionId, period (7days|30days|90days)
- Returns: Time-series data for charts

POST /api/admin/question-trends/snapshot
- Creates daily snapshot of current metrics (automated job)
```

### 2. Quality Flags API
```
GET /api/admin/quality-flags
- Query params: status (active|resolved|all), type
- Returns: All flagged questions

POST /api/admin/quality-flags/run-check
- Manually trigger quality check on all questions
- Returns: Number of new flags created

PATCH /api/admin/quality-flags/:id
- Update flag status (resolve, dismiss)
- Body: { status, notes, resolvedBy }
```

### 3. Question Clone API
```
POST /api/admin/questions/clone
- Body: { questionId?, competitionQuestionId?, modifications }
- Returns: New question with copied data

POST /api/admin/questions/bulk-clone
- Body: { questionIds[], competitionQuestionIds[] }
- Returns: Array of new questions
```

### 4. Question Detail API
```
GET /api/admin/questions/:id/detailed
- Returns: Complete question data with analytics, trends, related questions

GET /api/admin/questions/:id/history
- Returns: Edit history, usage timeline, performance changes
```

### 5. Saved Views API
```
GET /api/admin/saved-views
- Returns: User's saved filter views

POST /api/admin/saved-views
- Body: { viewName, filters, isDefault }
- Saves new filter view

DELETE /api/admin/saved-views/:id
- Deletes saved view
```

---

## 🎨 UI Components

### New Components:

1. **TrendsChart.tsx**
   - Line chart for time-series data
   - Period selector (7/30/90 days)
   - Metric selector (usage/correct%/response time)

2. **QualityFlagsPanel.tsx**
   - List of flagged questions
   - Filter by flag type
   - Bulk actions on flagged questions
   - Flag resolution interface

3. **AdvancedFilters.tsx**
   - Collapsible filter panel
   - Multiple filter inputs
   - Save view button
   - Quick filter buttons

4. **QuestionDetailModal.tsx**
   - Full-screen modal or side drawer
   - Tabbed interface
   - Edit capabilities
   - Related questions section

5. **CloneQuestionModal.tsx**
   - Shows source question
   - Allows modifications
   - Preview before clone
   - Bulk clone interface

---

## 🧪 Testing Requirements

### Unit Tests:
- [ ] Trends data aggregation logic
- [ ] Quality flag detection algorithm
- [ ] Filter combination logic
- [ ] Clone data transformation

### Integration Tests:
- [ ] Trends API endpoints
- [ ] Quality flags API endpoints
- [ ] Clone API endpoints
- [ ] Filter persistence

### E2E Tests:
- [ ] View historical trends for question
- [ ] Flag question and resolve
- [ ] Clone question and verify
- [ ] Save filter view and reload
- [ ] Open detail view and edit question

---

## 📊 Success Metrics

### Performance:
- Trends queries < 500ms
- Quality check runs < 2s for 1000 questions
- Detail view loads < 300ms
- Clone operation < 200ms

### Usability:
- Admin finds flagged questions in < 30s
- Cloning question takes < 1 minute
- Saved views used in 80% of sessions
- Detail view accessed 5+ times per session

---

## 🚀 Implementation Order

### Week 1: Foundation
1. Create database tables (migrations)
2. Build trends API endpoint
3. Build quality flags API endpoint
4. Create daily snapshot job

### Week 2: Core Features
5. Build TrendsChart component
6. Build QualityFlagsPanel component
7. Integrate trends into Insights tab
8. Add quality flags section

### Week 3: Enhancement Features
9. Build AdvancedFilters component
10. Build saved views functionality
11. Build QuestionDetailModal
12. Add clone functionality

### Week 4: Polish & Testing
13. Comprehensive testing
14. Performance optimization
15. Documentation
16. User acceptance testing

---

## 📝 Dependencies

### Required:
- ✅ Phase 2 completed (analytics foundation)
- ✅ Recharts library installed
- ✅ Supabase client configured
- ✅ React Hot Toast for notifications

### Optional:
- jsPDF for PDF exports
- node-cron for scheduled tasks
- nodemailer for email notifications

---

## 🎯 Phase 3 Deliverables

1. ✅ 3 new database tables with migrations
2. ✅ 5 new API endpoints
3. ✅ 5 new React components
4. ✅ Historical trends visualization
5. ✅ Automated quality management system
6. ✅ Advanced filtering with saved views
7. ✅ Question cloning functionality
8. ✅ Detailed question drill-down view
9. ✅ Complete documentation
10. ✅ Test suite covering all features

---

**Total Estimated Development Time:** 3-4 weeks  
**Lines of Code:** ~3,000-4,000  
**Complexity:** High  
**Impact:** Very High

**Phase 3 Status:** 🚀 **READY TO START**
