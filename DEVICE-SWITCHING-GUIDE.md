# Device Switching & Session Management Guide

## Overview
This system implements device switching detection and management, ensuring users can only have one active session at a time. When a user tries to log in on a new device while already logged in elsewhere, they are shown a modal with device information and given the option to force logout from the previous device.

## Features
✅ **Active Session Detection** - Checks if user already has an active session  
✅ **Device Information Display** - Shows details of the currently active device  
✅ **Force Logout** - "Login Anyway" button to logout from previous device  
✅ **Session Deactivation** - Automatically deactivates old sessions  
✅ **Real-time Tracking** - Tracks login time and last active timestamp  
✅ **Security First** - One active session per user enforced at database level

---

## Database Schema

### Table: `user_active_sessions`
Tracks all active user sessions across devices.

```sql
CREATE TABLE public.user_active_sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fingerprint_id TEXT NOT NULL,
  device_info JSONB,
  login_time TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  competition_id TEXT DEFAULT 'global_login',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_active_session_per_user UNIQUE(user_id, is_active)
);
```

**Key Fields:**
- `session_id`: Unique identifier for each session
- `user_id`: Reference to the authenticated user
- `fingerprint_id`: Browser fingerprint from FingerprintJS
- `device_info`: JSON object with browser, OS, screen resolution, etc.
- `login_time`: When the session was created
- `last_active`: Auto-updated timestamp of last activity
- `is_active`: Boolean flag - only one active session per user allowed
- `competition_id`: Default 'global_login' for app-wide tracking

**Constraint:**
- `UNIQUE(user_id, is_active)`: Ensures only ONE active session per user

**Trigger:**
- `update_session_last_active`: Automatically updates `last_active` on UPDATE

---

## Implementation Files

### 1. SQL Schema
**File:** `database/create-active-sessions.sql`

Run this file in Supabase SQL Editor to create the table, indexes, triggers, and RLS policies.

```bash
# Execute in Supabase Dashboard > SQL Editor
```

### 2. Utility Functions
**File:** `utils/fingerprint.ts`

**New Functions Added:**

#### `checkActiveSession(userId)`
```typescript
// Checks if user has an active session
const { hasActiveSession, sessionData } = await checkActiveSession(userId);
```
**Returns:**
- `hasActiveSession`: Boolean
- `sessionData`: Object with device_info, login_time, last_active, etc.

#### `createActiveSession(userId, fingerprintId, deviceInfo, competitionId)`
```typescript
// Creates a new active session
const { success, sessionId } = await createActiveSession(
  userId, 
  fingerprintId, 
  deviceInfo, 
  'global_login'
);
```

#### `deactivateOldSessions(userId)`
```typescript
// Deactivates all active sessions for a user
const success = await deactivateOldSessions(userId);
```

#### `handleForceLogin(userId, fingerprintId, deviceInfo, competitionId)`
```typescript
// Force login - deactivates old sessions and creates new one
const { success, sessionId } = await handleForceLogin(
  userId,
  fingerprintId,
  deviceInfo,
  'global_login'
);
```

### 3. Modal Component
**File:** `components/DeviceSwitchModal.tsx`

A beautiful, responsive modal that displays:
- Warning icon and header
- Current session device information (browser, OS, device type, last active)
- Security warning message
- Two action buttons: "Cancel" and "Login Anyway"
- Loading state during device switch

**Props:**
```typescript
interface DeviceSwitchModalProps {
  isOpen: boolean;
  deviceInfo: {
    browser?: string;
    os?: string;
    deviceType?: string;
    loginTime?: string;
    lastActive?: string;
  };
  onCancel: () => void;
  onLoginAnyway: () => void;
  isLoading?: boolean;
}
```

### 4. Login Integration
**File:** `components/Login.tsx`

**New State Variables:**
```typescript
const [showDeviceModal, setShowDeviceModal] = useState(false);
const [existingSessionData, setExistingSessionData] = useState<any>(null);
const [pendingUserData, setPendingUserData] = useState<any>(null);
const [deviceSwitchLoading, setDeviceSwitchLoading] = useState(false);
```

**Updated Login Flow:**
1. User enters credentials and submits
2. Authentication validates credentials
3. **NEW:** Check for existing active session
4. **IF ACTIVE SESSION EXISTS:**
   - Store pending login data
   - Show DeviceSwitchModal with device info
   - Wait for user decision
5. **IF NO ACTIVE SESSION:**
   - Proceed with normal login flow
   - Save fingerprint and create session

**New Functions:**

#### `completeLoginFlow(user, userData, role, toastId?)`
- Saves browser fingerprint
- Shows success toast
- Redirects to appropriate dashboard

#### `handleLoginAnyway()`
- Called when user clicks "Login Anyway"
- Gets new device fingerprint
- Calls `handleForceLogin()` to deactivate old sessions
- Creates new active session
- Completes login flow

#### `handleCancelDeviceSwitch()`
- Called when user clicks "Cancel"
- Signs out current login attempt
- Keeps existing session active
- Shows cancellation message

---

## User Flow Diagram

```
┌─────────────────────────────┐
│  User enters credentials    │
│  and submits login form     │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  Authenticate with Supabase │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  Check for active session   │
│  checkActiveSession(userId) │
└──────────────┬──────────────┘
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
┌─────────────┐  ┌─────────────┐
│ NO SESSION  │  │   SESSION   │
│   FOUND     │  │   EXISTS    │
└──────┬──────┘  └──────┬──────┘
       │                │
       │                ▼
       │         ┌─────────────────────────┐
       │         │  Show DeviceSwitchModal │
       │         │  with device info       │
       │         └──────────┬──────────────┘
       │                    │
       │            ┌───────┴────────┐
       │            │                │
       │            ▼                ▼
       │    ┌──────────────┐ ┌──────────────┐
       │    │   CANCEL     │ │ LOGIN ANYWAY │
       │    └──────┬───────┘ └──────┬───────┘
       │           │                │
       │           ▼                ▼
       │    ┌──────────────┐ ┌──────────────────┐
       │    │  Sign out    │ │ Force logout old │
       │    │  Show toast  │ │ Create new       │
       │    └──────────────┘ │ session          │
       │                     └──────┬───────────┘
       │                            │
       └────────────┬───────────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │  Save fingerprint    │
         │  Create session      │
         │  Redirect to dash    │
         └──────────────────────┘
```

---

## Security Features

### 1. Database-Level Enforcement
The `UNIQUE(user_id, is_active)` constraint ensures only one active session per user at the database level. This prevents race conditions.

### 2. Row Level Security (RLS)
Users can only:
- Read their own sessions
- Insert their own sessions
- Update their own sessions
- Delete their own sessions

### 3. Browser Fingerprinting
Uses FingerprintJS to generate unique device identifiers, making it harder to spoof devices.

### 4. Device Information Tracking
Stores comprehensive device info:
- Browser type and version
- Operating system
- Device type (Desktop/Mobile/Tablet)
- Screen resolution
- Timezone
- Language

---

## Testing Checklist

### Scenario 1: Normal Login (No Active Session)
1. ✅ User logs in from Device A
2. ✅ Fingerprint saved
3. ✅ Session created in `user_active_sessions`
4. ✅ Redirected to dashboard

### Scenario 2: Login from New Device (Active Session Exists)
1. ✅ User logged in on Device A
2. ✅ User tries to log in from Device B
3. ✅ Modal appears showing Device A info
4. ✅ Device info displayed correctly (browser, OS, last active)
5. ✅ "Cancel" button works - stays logged in on Device A
6. ✅ "Login Anyway" button works:
   - Device A session deactivated
   - Device B session created
   - User logged in on Device B

### Scenario 3: Security Warning
1. ✅ User sees warning message about forced logout
2. ✅ Device info helps user identify if it's their device
3. ✅ Security notice about changing password if suspicious

---

## Configuration

### Environment Variables
Ensure these are set in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### FingerprintJS
Already installed via:
```bash
npm install @fingerprintjs/fingerprintjs
```

---

## Database Setup Instructions

### Step 1: Run SQL Schema
1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Copy contents from `database/create-active-sessions.sql`
4. Execute the SQL

### Step 2: Verify Table Creation
```sql
SELECT * FROM user_active_sessions LIMIT 5;
```

### Step 3: Test Policies
Try querying as authenticated user to ensure RLS works correctly.

---

## Troubleshooting

### Issue: "unique_active_session_per_user constraint violation"
**Cause:** Multiple active sessions for same user  
**Solution:** Run cleanup query:
```sql
UPDATE user_active_sessions 
SET is_active = false 
WHERE user_id = 'USER_ID_HERE';
```

### Issue: Modal not showing
**Cause:** Session check might be failing silently  
**Solution:** Check browser console for errors, verify RLS policies

### Issue: Device info not displaying
**Cause:** `device_info` field might be null  
**Solution:** Ensure `getDeviceInfo()` is being called and saved

---

## Future Enhancements

### 1. Real-time Session Termination
Add Supabase realtime listener to detect when session is deactivated on Device A and show "You've been logged out" message.

```typescript
// On Device A
supabase
  .channel('session_changes')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'user_active_sessions',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    if (!payload.new.is_active) {
      // Show logout modal
      handleForceLogout();
    }
  })
  .subscribe();
```

### 2. Session History
Keep a log of all login sessions (including inactive ones) for security audit trail.

### 3. Multiple Active Sessions
Modify to allow X number of active sessions per user (e.g., phone + tablet + desktop).

### 4. Session Management Page
Add a profile section where users can:
- View all active sessions
- Manually log out from specific devices
- See login history

---

## API Reference

### Session Management Functions

#### checkActiveSession
```typescript
checkActiveSession(userId: string): Promise<{
  hasActiveSession: boolean;
  sessionData?: any;
}>
```

#### createActiveSession
```typescript
createActiveSession(
  userId: string,
  fingerprintId: string,
  deviceInfo: any,
  competitionId?: string
): Promise<{
  success: boolean;
  sessionId?: string;
}>
```

#### deactivateOldSessions
```typescript
deactivateOldSessions(userId: string): Promise<boolean>
```

#### handleForceLogin
```typescript
handleForceLogin(
  userId: string,
  fingerprintId: string,
  deviceInfo: any,
  competitionId?: string
): Promise<{
  success: boolean;
  sessionId?: string;
}>
```

---

## Credits
- **Browser Fingerprinting:** [FingerprintJS](https://github.com/fingerprintjs/fingerprintjs)
- **UI Framework:** React + Next.js + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth)

---

## Version History
- **v1.0** (Current) - Initial implementation with device switching modal
- **v1.1** (Planned) - Real-time session termination on other devices
- **v1.2** (Planned) - Session management dashboard

---

## Support
For issues or questions, check:
1. Browser console for fingerprint errors
2. Supabase logs for database errors
3. RLS policies for permission issues
4. This guide's troubleshooting section
