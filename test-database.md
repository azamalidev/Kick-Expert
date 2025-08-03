# Database Testing Guide

## ⚠️ IMPORTANT: Setup Required

Before testing the League quiz, you MUST run the database setup scripts in order:

### Step 1: Basic Quiz Tables
1. **Go to your Supabase Dashboard**
2. **Navigate to SQL Editor**
3. **Run:** `database/setup-quiz-tables.sql` (Creates questions and sessions tables)

### Step 2: XP & Wallet System
4. **Run:** `database/setup-xp-wallet-system.sql` (Creates wallets, xp_history, transactions)

### Step 3: Profiles (if not already done)
5. **Run:** `database/setup-profiles.sql` (Creates user profiles table)

## 🧪 Testing Steps

### 1. Check Database Tables
In Supabase SQL Editor, verify tables exist:
```sql
-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'wallets', 'xp_history', 'transactions', 'competition_sessions', 'competition_questions');
```

### 2. Test League Quiz Flow
1. **Start a League competition** - `/league`
2. **Complete all 20 questions**
3. **Check browser console** for detailed logs:
   - Look for `🚀 Starting completeQuiz()` 
   - Verify all `✅` success messages
   - Check final rewards summary

### 3. Verify Database Updates
After completing a quiz, check in Supabase:

```sql
-- Check your profile data
SELECT username, xp, total_games, total_wins, rank_label 
FROM profiles 
WHERE user_id = auth.uid();

-- Check wallet balance
SELECT balance, created_at, updated_at 
FROM wallets 
WHERE user_id = auth.uid();

-- Check XP history
SELECT xp_gained, source, description, created_at 
FROM xp_history 
WHERE user_id = auth.uid() 
ORDER BY created_at DESC;

-- Check transaction history
SELECT amount, type, description, created_at 
FROM transactions 
WHERE user_id = auth.uid() 
ORDER BY created_at DESC;
```

## 🎯 Expected Results

### Score 16-20 (Elite):
- **XP Gained:** 150
- **Money Reward:** 100 PKR
- **Performance:** Elite

### Score 13-15 (Pro):
- **XP Gained:** 100
- **Money Reward:** 50 PKR
- **Performance:** Pro

### Score 10-12 (Starter):
- **XP Gained:** 70
- **Money Reward:** 30 PKR
- **Performance:** Starter

### Score 0-9 (Practice):
- **XP Gained:** 40
- **Money Reward:** 10 PKR
- **Performance:** Practice

## 🐛 Troubleshooting

### If you see errors:
1. **Check console logs** for specific error details
2. **Verify RLS policies** are properly set
3. **Ensure user is authenticated**
4. **Check if all tables exist** in database

### Common Issues:
- **406 Error:** Usually RLS policy issues
- **Profile not found:** User profile needs to be created
- **Wallet errors:** Wallet table missing or RLS issues

## 🔧 Console Debug Commands

Add this to browser console to check current user:
```javascript
// Check current user
const user = await supabase.auth.getUser();
console.log('Current user:', user);

// Check profile exists
const profile = await supabase.from('profiles').select('*').eq('user_id', user.data.user.id);
console.log('User profile:', profile);
```
