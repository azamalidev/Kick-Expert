# Anti-Cheat System Architecture

## Complete System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        KICK EXPERT ANTI-CHEAT SYSTEM                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────────┐
│  STEP 1: SPEED DETECTION                                                       │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  File: components/league.tsx                                                   │
│  Table: competition_speed_detection                                            │
│                                                                                │
│  ┌────────────────────┐    ┌─────────────────────┐    ┌─────────────────┐   │
│  │ Question Displayed │ -> │ Track Response Time │ -> │ Analyze Pattern │   │
│  └────────────────────┘    └─────────────────────┘    └─────────────────┘   │
│                                                                  │              │
│                                                                  ▼              │
│  Detection Algorithms:                              ┌────────────────────────┐│
│  • < 300ms responses (bot-like)                     │ if (isSuspicious)      ││
│  • Too many perfect fast responses                  │   logCheatAction()     ││
│  • Consistent timing patterns                       │   ↓                    ││
│  • Statistical anomalies                            │ STEP 3                 ││
│                                                      └────────────────────────┘│
└───────────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────────┐
│  STEP 2: DEVICE FINGERPRINTING                                                 │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  File: utils/fingerprint.ts                                                    │
│  Tables: competition_browser_fingerprints, user_active_sessions                │
│                                                                                │
│  ┌─────────────┐    ┌──────────────────┐    ┌─────────────────────┐         │
│  │ User Login  │ -> │ Generate FP Hash │ -> │ Check for Conflicts │         │
│  └─────────────┘    └──────────────────┘    └─────────────────────┘         │
│                                                         │                      │
│                         ┌───────────────────────────────┴──────────┐          │
│                         ▼                                            ▼          │
│              ┌────────────────────┐                    ┌──────────────────┐  │
│              │ Duplicate Device?  │                    │ Already Logged   │  │
│              │ logCheatAction()   │                    │ In Elsewhere?    │  │
│              │ ↓                  │                    │ Show Modal       │  │
│              │ STEP 3             │                    │ "Login Anyway"   │  │
│              └────────────────────┘                    └──────────────────┘  │
│                                                                                │
│  Device Info Tracked:                                                          │
│  • Browser & Version                                                           │
│  • Operating System                                                            │
│  • Screen Resolution                                                           │
│  • Timezone & Language                                                         │
│  • Unique Fingerprint Hash                                                     │
└───────────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────────┐
│  STEP 3: CHEAT ACTIONS LOGGING (CENTRAL HUB)                                   │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  File: utils/fingerprint.ts (logCheatAction)                                   │
│  Table: competition_cheat_actions                                              │
│                                                                                │
│            ┌──────────────────────────────────────────────┐                   │
│            │         logCheatAction()                     │                   │
│            │  (Centralized Logging Function)              │                   │
│            └──────────────┬───────────────────────────────┘                   │
│                           │                                                    │
│         ┌─────────────────┼─────────────────┐                                 │
│         ▼                 ▼                  ▼                                 │
│  ┌────────────┐   ┌──────────────┐   ┌─────────────┐                         │
│  │ Speed      │   │ Duplicate    │   │ Admin       │                         │
│  │ Detection  │   │ Device       │   │ Manual      │                         │
│  │ (Step 1)   │   │ (Step 2)     │   │ Action      │                         │
│  └────────────┘   └──────────────┘   └─────────────┘                         │
│         │                 │                  │                                 │
│         └─────────────────┴──────────────────┘                                 │
│                           ▼                                                    │
│            ┌──────────────────────────────────┐                               │
│            │  competition_cheat_actions       │                               │
│            │  ┌──────────────────────────┐    │                               │
│            │  │ id                       │    │                               │
│            │  │ competition_id           │    │                               │
│            │  │ user_id                  │    │                               │
│            │  │ action_type (flag/block/ban) │                               │
│            │  │ reason                   │    │                               │
│            │  │ created_by (admin)       │    │                               │
│            │  │ created_at               │    │                               │
│            │  └──────────────────────────┘    │                               │
│            └──────────────────────────────────┘                               │
│                           │                                                    │
│                           ▼                                                    │
│            ┌──────────────────────────────────┐                               │
│            │     ADMIN DASHBOARD              │                               │
│            │  /admindashboard/cheat-actions   │                               │
│            └──────────────────────────────────┘                               │
└───────────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────────┐
│  ADMIN DASHBOARD (CheatActions.tsx)                                            │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │  🛡️ Anti-Cheat System                              [🔄 Refresh]     │     │
│  │  Monitor and manage suspicious activities                            │     │
│  ├─────────────────────────────────────────────────────────────────────┤     │
│  │                                                                       │     │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐          │     │
│  │  │ Total: 127│ │ Flag: 24  │ │ Block: 8  │ │ Ban: 3    │          │     │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘          │     │
│  │                                                                       │     │
│  │  [All] [Flag (24)] [Block (8)] [Ban (3)]                            │     │
│  │  ────────────────────────────────────────────────────────────        │     │
│  │                                                                       │     │
│  │  User          Competition  Status    Reason          Actions        │     │
│  │  ───────────────────────────────────────────────────────────         │     │
│  │  John Doe      comp_123    🏁 Flag   Speed anomaly   [Flag] [Block]  │     │
│  │  john@...                             Avg: 150ms     [Ban]           │     │
│  │                                                                       │     │
│  │  Jane Smith    comp_456    ⚠️ Block  Duplicate dev  [Flag] [Block]  │     │
│  │  jane@...                             FP: ABC123     [Ban]           │     │
│  │                                                                       │     │
│  └─────────────────────────────────────────────────────────────────────┘     │
│                                                                                │
│  Admin Actions:                                                                │
│  • Click [Block] -> Update action_type to 'block'                             │
│  • Click [Ban] -> Update action_type to 'ban'                                 │
│  • Click [Flag] -> Downgrade to 'flag'                                        │
│  • created_by field updated with admin's user_id                              │
└───────────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────────┐
│  DATA FLOW DIAGRAM                                                             │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  ┌──────────────┐                                                             │
│  │ User Action  │                                                             │
│  │ (Competition)│                                                             │
│  └──────┬───────┘                                                             │
│         │                                                                      │
│         ├────────────────┬────────────────┬─────────────────┐                 │
│         ▼                ▼                ▼                 ▼                 │
│  ┌────────────┐   ┌────────────┐   ┌────────────┐   ┌────────────┐          │
│  │ Speed      │   │ Fingerprint│   │ Session    │   │ Answer     │          │
│  │ Tracking   │   │ Check      │   │ Validation │   │ Verification│          │
│  └─────┬──────┘   └─────┬──────┘   └─────┬──────┘   └─────┬──────┘          │
│        │                 │                 │                 │                 │
│        └─────────────────┴─────────────────┴─────────────────┘                 │
│                                   │                                            │
│                       ┌───────────▼──────────┐                                │
│                       │  Suspicious Pattern? │                                │
│                       └───────────┬──────────┘                                │
│                                   │                                            │
│                         [YES] ────┼──── [NO]                                  │
│                           │                │                                   │
│                           ▼                ▼                                   │
│                  ┌──────────────────┐  Continue                               │
│                  │ logCheatAction() │  Normal Flow                            │
│                  └────────┬─────────┘                                         │
│                           │                                                    │
│                           ▼                                                    │
│              ┌────────────────────────┐                                       │
│              │ competition_cheat_     │                                       │
│              │ actions (INSERT)       │                                       │
│              └────────────┬───────────┘                                       │
│                           │                                                    │
│                           ▼                                                    │
│              ┌────────────────────────┐                                       │
│              │ Admin Dashboard        │                                       │
│              │ (Real-time Update)     │                                       │
│              └────────────┬───────────┘                                       │
│                           │                                                    │
│                           ▼                                                    │
│              ┌────────────────────────┐                                       │
│              │ Admin Reviews & Takes  │                                       │
│              │ Action (Flag/Block/Ban)│                                       │
│              └────────────────────────┘                                       │
└───────────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────────┐
│  ACTION LEVEL HIERARCHY                                                        │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  ┌────────────────────────────────────────────────────────────────┐          │
│  │                           🏁 FLAG                              │          │
│  │  ┌──────────────────────────────────────────────────────────┐ │          │
│  │  │ • User under monitoring                                  │ │          │
│  │  │ • Can still participate                                  │ │          │
│  │  │ • Actions tracked more closely                           │ │          │
│  │  │ • Yellow badge in dashboard                              │ │          │
│  │  └──────────────────────────────────────────────────────────┘ │          │
│  └────────────────────────────────────────────────────────────────┘          │
│                              ⬇️ Escalate                                      │
│  ┌────────────────────────────────────────────────────────────────┐          │
│  │                          ⚠️ BLOCK                              │          │
│  │  ┌──────────────────────────────────────────────────────────┐ │          │
│  │  │ • Temporary restriction                                  │ │          │
│  │  │ • Cannot join new competitions                           │ │          │
│  │  │ • Can be reviewed and reversed                           │ │          │
│  │  │ • Orange badge in dashboard                              │ │          │
│  │  └──────────────────────────────────────────────────────────┘ │          │
│  └────────────────────────────────────────────────────────────────┘          │
│                              ⬇️ Escalate                                      │
│  ┌────────────────────────────────────────────────────────────────┐          │
│  │                           🚫 BAN                               │          │
│  │  ┌──────────────────────────────────────────────────────────┐ │          │
│  │  │ • Permanent ban                                          │ │          │
│  │  │ • Cannot participate in any competitions                 │ │          │
│  │  │ • Requires admin review to reverse                       │ │          │
│  │  │ • Red badge in dashboard                                 │ │          │
│  │  └──────────────────────────────────────────────────────────┘ │          │
│  └────────────────────────────────────────────────────────────────┘          │
│                                                                                │
│  Note: Admins can escalate OR de-escalate at any time                         │
└───────────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────────┐
│  DATABASE RELATIONSHIPS                                                        │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  ┌──────────────────────┐                                                     │
│  │   auth.users         │                                                     │
│  │  ─────────────────   │                                                     │
│  │  id (UUID)           │                                                     │
│  │  email               │                                                     │
│  └─────┬───────┬────────┘                                                     │
│        │       │                                                               │
│        │       │ (Foreign Key)                                                │
│        │       │                                                               │
│        │       └────────────────┐                                             │
│        │                        │                                             │
│        ▼                        ▼                                             │
│  ┌──────────────────┐   ┌──────────────────────────────┐                     │
│  │ users            │   │ competition_cheat_actions     │                     │
│  │ ──────────────   │   │ ───────────────────────────   │                     │
│  │ id               │   │ id (BIGSERIAL)                │                     │
│  │ email            │   │ competition_id (TEXT)         │                     │
│  │ full_name        │   │ user_id (UUID FK)    ────────┼────┐                │
│  │ role             │   │ action_type (flag/block/ban)  │    │                │
│  └──────────────────┘   │ reason (TEXT)                 │    │                │
│                         │ created_by (UUID FK) ─────────┼────┘                │
│                         │ created_at (TIMESTAMPTZ)      │                     │
│                         │ updated_at (TIMESTAMPTZ)      │                     │
│                         └───────────────────────────────┘                     │
│                                                                                │
│  Related Tables:                                                               │
│  • competition_speed_detection (Step 1)                                        │
│  • competition_browser_fingerprints (Step 2)                                   │
│  • user_active_sessions (Device Management)                                    │
└───────────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────────┐
│  SECURITY: ROW LEVEL SECURITY (RLS) POLICIES                                   │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  ┌────────────────────────────────────────────────────────────┐              │
│  │ Policy 1: Service Role Full Access                        │              │
│  │ → System can auto-insert detection logs                   │              │
│  └────────────────────────────────────────────────────────────┘              │
│                                                                                │
│  ┌────────────────────────────────────────────────────────────┐              │
│  │ Policy 2: Users Can View Own Actions                      │              │
│  │ → Transparency: Users see why they're flagged             │              │
│  └────────────────────────────────────────────────────────────┘              │
│                                                                                │
│  ┌────────────────────────────────────────────────────────────┐              │
│  │ Policy 3: Admins Can View All                             │              │
│  │ → WHERE users.role = 'admin'                              │              │
│  └────────────────────────────────────────────────────────────┘              │
│                                                                                │
│  ┌────────────────────────────────────────────────────────────┐              │
│  │ Policy 4: Admins Can Insert/Update                        │              │
│  │ → Manual escalation by admin users                        │              │
│  └────────────────────────────────────────────────────────────┘              │
│                                                                                │
│  ┌────────────────────────────────────────────────────────────┐              │
│  │ Policy 5: System Can Insert                               │              │
│  │ → Allows server-side automated logging                    │              │
│  └────────────────────────────────────────────────────────────┘              │
└───────────────────────────────────────────────────────────────────────────────┘
```

## Integration Summary

### Files Involved
1. **league.tsx** - Speed detection integration
2. **fingerprint.ts** - Device detection + logCheatAction()
3. **CheatActions.tsx** - Admin dashboard component
4. **AdminSidebar.tsx** - Navigation menu
5. **step3-cheat-actions.sql** - Database schema

### Key Functions
- `logCheatAction()` - Universal logging function
- `analyzeResponsePatterns()` - Speed analysis (Step 1)
- `handleFingerprintCheck()` - Device checking (Step 2)
- `updateActionType()` - Admin escalation/de-escalation

### Database Tables
- `competition_cheat_actions` - Central log (Step 3)
- `competition_speed_detection` - Speed data (Step 1)
- `competition_browser_fingerprints` - Device data (Step 2)
- `user_active_sessions` - Session tracking

### Admin Routes
- `/admindashboard/cheat-actions` - Main dashboard
- Accessible from admin sidebar with Shield icon

---

**All three anti-cheat steps are now integrated into one cohesive system!**
