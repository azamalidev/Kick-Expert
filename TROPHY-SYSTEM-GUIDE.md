# Trophy System Implementation Guide

## Overview
A complete trophy/achievement system that automatically awards trophies based on XP milestones when users complete competitions. The system prevents duplicate trophies and provides a notification modal when new trophies are earned.

## Database Setup

### 1. Run the SQL Setup
Execute the `database/setup-trophy-system.sql` file in your Supabase SQL editor to create:
- **trophies table**: Stores all user trophies with unique constraints
- **Functions**: Automated trophy checking and retrieval functions
- **RLS Policies**: Row-level security for data protection

### 2. Trophy Milestones
The system automatically awards trophies at these XP thresholds:
- **1000 XP** → Bronze Trophy: "Rising Star"
- **3000 XP** → Silver Trophy: "Skilled Player" 
- **6000 XP** → Gold Trophy: "Expert Champion"

## Implementation Details

### Database Schema
```sql
CREATE TABLE trophies (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    trophy_type TEXT CHECK (trophy_type IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_id UUID REFERENCES competition_sessions(id),
    UNIQUE(user_id, title) -- Prevents duplicate trophies
);
```

### Key Functions
1. **check_and_award_xp_trophies(user_id, session_id)**
   - Checks user's current XP against milestones
   - Awards new trophies automatically
   - Returns list of newly awarded trophies
   - Prevents duplicates with unique constraint handling

2. **get_user_trophies(user_id)**
   - Returns all trophies for a user
   - Ordered by earned_at date

3. **get_user_trophy_stats(user_id)**
   - Returns trophy counts by type
   - Provides summary statistics

### Frontend Integration

#### TrophyService Class
Located in `utils/trophyService.ts`, provides:
- Trophy checking and awarding
- User trophy retrieval
- UI helper methods (icons, colors, formatting)
- Trophy statistics and leaderboards

#### League Component Integration
The trophy system is integrated into the league competition flow:

1. **After XP Update**: Trophy checking occurs after user profile XP is updated
2. **Trophy Modal**: Displays notification when new trophies are earned
3. **State Management**: Tracks new trophies and modal visibility

#### Key Code Integration Points
```typescript
// In completeQuiz function after XP update:
const trophies = await TrophyService.checkAndAwardXPTrophies(user.id, sessionId);
if (trophies.length > 0) {
  setNewTrophies(trophies);
  setShowTrophyModal(true);
}
```

## Usage Flow

1. **User completes competition** → XP is calculated and added to profile
2. **Trophy check triggered** → `check_and_award_xp_trophies()` function runs
3. **Database comparison** → User's total XP checked against milestones
4. **Trophy award** → New trophies inserted (if thresholds crossed)
5. **UI notification** → Trophy modal displays newly earned trophies
6. **User acknowledgment** → User clicks "Awesome!" to dismiss modal

## Error Handling

- **Duplicate Prevention**: Unique constraint on (user_id, title) prevents duplicates
- **Graceful Failures**: Trophy checking errors don't break competition flow
- **Transaction Safety**: Trophy operations are isolated from main competition logic

## Future Enhancements

### Win Streak Trophies (Not Yet Implemented)
```sql
-- Example for future win streak trophies:
-- 5 wins in a row → "Hot Streak" Bronze
-- 10 wins in a row → "Unstoppable" Silver  
-- 20 wins in a row → "Legendary Streak" Gold
```

### Additional Trophy Types
- Difficulty-based trophies (e.g., "Hard Mode Expert")
- Speed-based trophies (e.g., "Lightning Fast")
- Category-specific trophies (e.g., "History Master")

## Testing

### Manual Testing Steps
1. **Fresh User**: Create new user account
2. **Earn 1000 XP**: Complete competitions to reach 1000 XP
3. **Verify Bronze**: Check that Bronze trophy appears in modal
4. **Continue to 3000 XP**: Complete more competitions
5. **Verify Silver**: Check that Silver trophy appears
6. **No Duplicates**: Complete more competitions, ensure no duplicate trophies

### Database Verification
```sql
-- Check user's trophies
SELECT * FROM trophies WHERE user_id = 'your-user-id' ORDER BY earned_at;

-- Check user's XP
SELECT xp FROM profiles WHERE user_id = 'your-user-id';

-- Test trophy function
SELECT * FROM check_and_award_xp_trophies('your-user-id', 'session-id');
```

## Files Created/Modified

### New Files
- `database/setup-trophy-system.sql` - Complete database setup
- `types/trophy.ts` - TypeScript interfaces
- `utils/trophyService.ts` - Service class for trophy operations

### Modified Files  
- `components/league.tsx` - Integrated trophy checking and modal

## Security Notes

- **RLS Enabled**: Users can only view/insert their own trophies
- **Server-Side Validation**: Trophy awarding logic runs in database functions
- **No Client Manipulation**: Trophy insertion requires proper XP verification

The trophy system is now fully implemented and ready for production use!
