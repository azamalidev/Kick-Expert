# Step 3: Competition Cheat Actions System

## Overview
Central logging and management system for all anti-cheat detections, suspicious activities, and admin reviews. This is the core monitoring dashboard for maintaining competition integrity.

## Database Schema

### Table: `competition_cheat_actions`

```sql
CREATE TABLE public.competition_cheat_actions (
  id BIGSERIAL PRIMARY KEY,
  competition_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('flag', 'block', 'ban')),
  reason TEXT,
  created_by UUID REFERENCES auth.users(id), -- Admin who took action
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Action Types

| Type | Description | Effect |
|------|-------------|--------|
| **flag** | Suspicious activity detected | User monitored but can still compete |
| **block** | Temporary restriction | User temporarily blocked from competitions |
| **ban** | Permanent ban | User permanently banned from all competitions |

---

## Implementation Components

### 1. Database Setup (`database/step3-cheat-actions.sql`)

**Features:**
- ✅ Table with action type constraints
- ✅ Indexes for fast queries
- ✅ Auto-updating `updated_at` timestamp
- ✅ Row Level Security (RLS) policies
- ✅ Admin view with user details
- ✅ Comments for documentation

**Run in Supabase:**
```bash
# Navigate to Supabase Dashboard > SQL Editor
# Copy and execute: database/step3-cheat-actions.sql
```

### 2. Utility Functions (`utils/fingerprint.ts`)

#### `logCheatAction()`
Central function for logging all cheat detections.

```typescript
await logCheatAction(
  competitionId: string,
  userId: string,
  actionType: 'flag' | 'block' | 'ban',
  reason: string,
  createdBy?: string // Optional: admin who took action
): Promise<boolean>
```

**Example - Speed Detection:**
```typescript
await logCheatAction(
  'comp_123',
  'user_456',
  'flag',
  'Speed anomaly: Avg latency 150ms, 8/10 responses < 300ms'
);
```

**Example - Duplicate Device:**
```typescript
await logCheatAction(
  'comp_123',
  'user_789',
  'flag',
  'Duplicate device detected: Fingerprint ABC123 already registered'
);
```

**Example - Admin Action:**
```typescript
await logCheatAction(
  'comp_123',
  'user_101',
  'ban',
  'Repeated violations after warnings',
  'admin_user_id' // Admin who performed the action
);
```

### 3. Admin Dashboard Component (`components/Admin/CheatActions.tsx`)

**Features:**
- ✅ Real-time stats (Total, Flagged, Blocked, Banned)
- ✅ Filter by action type
- ✅ View all cheat actions with user details
- ✅ Update action level (escalate/de-escalate)
- ✅ Beautiful UI with color-coded badges
- ✅ Responsive table design
- ✅ Action history tracking

**Access:**
```
/admindashboard/cheat-actions
```

---

## Integration Points

### 1. Speed Detection (Step 1)
**File:** `components/league.tsx`

**When:** After competition completes and pattern analysis runs

```typescript
if (patternAnalysis.isSuspicious) {
  await logCheatAction(
    competitionId,
    userId,
    'flag',
    `Speed anomaly: ${patternAnalysis.reasons.join(', ')}`
  );
}
```

### 2. Duplicate Device (Step 2)
**File:** `utils/fingerprint.ts`

**When:** Device fingerprint conflict detected

```typescript
if (conflict.conflict) {
  await logCheatAction(
    competitionId,
    userId,
    'flag',
    `Duplicate device: Fingerprint ${fingerprintId} already registered`
  );
}
```

### 3. Admin Manual Actions
**File:** `components/Admin/CheatActions.tsx`

**When:** Admin updates action level

```typescript
await supabase
  .from('competition_cheat_actions')
  .update({
    action_type: newType,
    created_by: currentAdminId
  })
  .eq('id', actionId);
```

---

## Admin Dashboard Features

### Stats Overview
Four key metrics displayed at the top:
- **Total Actions** - All cheat logs
- **Flagged** - Currently monitored users
- **Blocked** - Temporarily restricted users
- **Banned** - Permanently banned users

### Filter Tabs
- **All** - Show everything
- **Flag** - Only flagged users
- **Block** - Only blocked users
- **Ban** - Only banned users

### Actions Table
**Columns:**
1. **User** - Name and email
2. **Competition** - Competition ID
3. **Status** - Badge with action type
4. **Reason** - Description of violation
5. **Detected** - Timestamp and who created it
6. **Actions** - Buttons to update action level

**Action Buttons:**
- **Flag** - Downgrade to monitoring only
- **Block** - Temporary restriction
- **Ban** - Permanent ban

---

## User Flow

### Automated Detection
```
1. System detects suspicious activity
   ↓
2. logCheatAction() called automatically
   ↓
3. Record inserted with action_type='flag'
   ↓
4. Admin sees new entry in dashboard
   ↓
5. Admin reviews and updates action level if needed
```

### Admin Manual Review
```
1. Admin opens Anti-Cheat dashboard
   ↓
2. Reviews flagged users
   ↓
3. Clicks action button (Flag/Block/Ban)
   ↓
4. Action level updated with admin ID
   ↓
5. User's competition access affected accordingly
```

---

## Row Level Security (RLS)

### Policies

1. **Service Role Full Access**
   - System can insert automated detections

2. **Users Can View Own Actions**
   - Transparency: Users can see why they were flagged

3. **Admins Can View All**
   - Admin role required to see all cheat actions

4. **Admins Can Insert/Update**
   - Only admins can manually create or update actions

5. **System Can Insert**
   - Allows server-side automated logging without auth context

---

## Testing Checklist

### Database Setup
- [ ] Run `step3-cheat-actions.sql` in Supabase
- [ ] Verify table created: `competition_cheat_actions`
- [ ] Check indexes exist
- [ ] Test RLS policies work

### Speed Detection Integration
- [ ] Complete a competition with normal speed
- [ ] Complete a competition with suspicious speed (< 300ms)
- [ ] Verify cheat action logged with "flag" type
- [ ] Check reason contains speed details

### Fingerprint Detection Integration
- [ ] Login on Device A
- [ ] Login on Device B with same account
- [ ] Verify cheat action logged for duplicate device
- [ ] Check reason mentions fingerprint conflict

### Admin Dashboard
- [ ] Access `/admindashboard/cheat-actions`
- [ ] Verify stats display correctly
- [ ] Test each filter tab (All, Flag, Block, Ban)
- [ ] Update action from Flag → Block
- [ ] Update action from Block → Ban
- [ ] Update action from Ban → Flag (downgrade)
- [ ] Verify admin ID tracked in `created_by`

---

## API Examples

### Query All Flagged Users
```typescript
const { data } = await supabase
  .from('competition_cheat_actions')
  .select('*')
  .eq('action_type', 'flag')
  .order('created_at', { ascending: false });
```

### Check if User is Banned
```typescript
const { data } = await supabase
  .from('competition_cheat_actions')
  .select('*')
  .eq('user_id', userId)
  .eq('action_type', 'ban')
  .single();

const isBanned = !!data;
```

### Get User's Cheat History
```typescript
const { data } = await supabase
  .from('competition_cheat_actions')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });
```

### Admin Updates Action
```typescript
const { error } = await supabase
  .from('competition_cheat_actions')
  .update({
    action_type: 'ban',
    reason: 'Multiple violations after warnings',
    created_by: adminUserId
  })
  .eq('id', actionId);
```

---

## Future Enhancements

### 1. Honeypot Questions
Add detection for users who answer hidden/trap questions:

```typescript
if (answeredHoneypotQuestion) {
  await logCheatAction(
    competitionId,
    userId,
    'flag',
    'Honeypot question answered - possible automation detected'
  );
}
```

### 2. Enforcement Logic
Prevent banned users from joining competitions:

```typescript
// In competition registration
const { data: banCheck } = await supabase
  .from('competition_cheat_actions')
  .select('id')
  .eq('user_id', userId)
  .eq('action_type', 'ban')
  .single();

if (banCheck) {
  throw new Error('You are banned from competitions');
}
```

### 3. Appeal System
Allow users to appeal flags/blocks:

```sql
ALTER TABLE competition_cheat_actions
ADD COLUMN appeal_status TEXT CHECK (appeal_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN appeal_message TEXT,
ADD COLUMN appeal_reviewed_by UUID REFERENCES auth.users(id);
```

### 4. Automated Escalation
Auto-escalate repeat offenders:

```typescript
const flagCount = await getCheatActionCount(userId, 'flag');
if (flagCount >= 3) {
  await logCheatAction(userId, 'block', 'Automated: 3+ flags');
}
```

### 5. Notification System
Alert users when flagged/blocked:

```typescript
await sendNotification(
  userId,
  'Security Alert',
  'Suspicious activity detected in your recent competition'
);
```

---

## Troubleshooting

### Issue: "permission denied for table competition_cheat_actions"
**Solution:** Run the RLS policies from `step3-cheat-actions.sql`

### Issue: Cheat actions not appearing in admin dashboard
**Solution:** 
1. Check browser console for errors
2. Verify user has admin role in `users` table
3. Test RLS policies manually

### Issue: Action level update not working
**Solution:**
1. Ensure admin is authenticated
2. Check `created_by` is being set correctly
3. Verify admin has proper permissions

### Issue: System detections not logging
**Solution:**
1. Check `logCheatAction()` is being called
2. Verify service role policy exists
3. Look for errors in browser/server console

---

## Security Considerations

### 1. Admin-Only Access
Only users with `role='admin'` can view/manage cheat actions.

### 2. Audit Trail
Every action tracks:
- Who created it (`created_by`)
- When it was created (`created_at`)
- When it was updated (`updated_at`)

### 3. Transparency
Users can view their own cheat actions for transparency.

### 4. No Data Deletion
Actions are permanent records - only update action_type, never delete.

---

## Performance

### Indexes
Four indexes ensure fast queries:
- `competition_id` - Filter by competition
- `user_id` - Filter by user
- `action_type` - Filter by type
- `created_at DESC` - Order by recent

### Expected Query Times
- List all actions: < 50ms
- Filter by type: < 30ms
- Get user history: < 20ms
- Admin update: < 10ms

---

## Statistics Dashboard

### Sample Queries for Analytics

**Actions Per Day:**
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_actions
FROM competition_cheat_actions
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

**Most Flagged Users:**
```sql
SELECT 
  user_id,
  COUNT(*) as flag_count
FROM competition_cheat_actions
WHERE action_type = 'flag'
GROUP BY user_id
ORDER BY flag_count DESC
LIMIT 10;
```

**Actions by Type:**
```sql
SELECT 
  action_type,
  COUNT(*) as count
FROM competition_cheat_actions
GROUP BY action_type;
```

---

## Summary

✅ **Database:** Table created with proper constraints and indexes  
✅ **RLS:** Secure policies for users, admins, and system  
✅ **Utility:** Centralized `logCheatAction()` function  
✅ **Integration:** Connected to speed detection and fingerprinting  
✅ **Dashboard:** Beautiful admin UI for monitoring and management  
✅ **Navigation:** Added to admin sidebar with Shield icon  

**Next Steps:**
1. Run SQL migration in Supabase
2. Test speed detection logging
3. Test fingerprint conflict logging
4. Access admin dashboard and review actions
5. Test action level updates (Flag → Block → Ban)

---

## Files Modified/Created

### Created:
- `database/step3-cheat-actions.sql` - Database schema
- `components/Admin/CheatActions.tsx` - Admin dashboard component
- `app/admindashboard/cheat-actions/page.tsx` - Route page
- `STEP3-CHEAT-ACTIONS-GUIDE.md` - This documentation

### Modified:
- `utils/fingerprint.ts` - Added `logCheatAction()` function
- `components/league.tsx` - Updated speed detection logging
- `components/Admin/AdminSidebar.tsx` - Added Anti-Cheat menu item

---

**Version:** 1.0  
**Last Updated:** October 12, 2025  
**Status:** ✅ Complete and Ready for Testing
