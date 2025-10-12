# Admin API 500 Error Fix - Complete Guide

## 🔴 Current Error

```
GET http://localhost:3000/api/admin/withdrawals
Status: 500 Internal Server Error
Response: { "error": "Internal server error" }
```

## 🎯 Root Cause

The API endpoints for admin features are failing because the **`users` table does not exist** in your Supabase database.

### Why This Table Is Needed

Your application uses a **three-table architecture** for user management:

1. **`auth.users`** (Supabase Auth) - Authentication data
2. **`public.users`** (Custom) - **Authorization/Roles** ← **MISSING**
3. **`public.profiles`** (Custom) - User profile information

The `users` table stores the `role` column that determines if a user is an `admin` or regular `user`.

### Affected API Endpoints

All these endpoints check `users.role` and will fail without the table:
- ❌ `/api/admin/withdrawals` (GET)
- ❌ `/api/admin/withdrawals/[id]/approve` (POST)
- ❌ `/api/admin/withdrawals/[id]/reject` (POST)
- ❌ `/api/admin/broadcast` (POST)
- ❌ `/api/admin/broadcasts` (GET/POST/DELETE)

## ✅ Solution: Run Database Migrations

### Step 1: Create Users Table

1. **Open Supabase Dashboard** → SQL Editor
2. **Copy and paste** the entire contents of:
   ```
   database/setup-users-table.sql
   ```
3. **Click "Run"**

This will:
- ✅ Create `public.users` table with `id`, `role`, timestamps
- ✅ Set up automatic trigger to create user records on signup
- ✅ Create indexes for performance
- ✅ Apply RLS (Row Level Security) policies
- ✅ Backfill existing users with 'user' role

### Step 2: Set Admin User

1. **In Supabase SQL Editor**
2. **Copy and paste** the entire contents of:
   ```
   database/set-admin-user.sql
   ```
3. **Click "Run"**

This will:
- ✅ Set `admin@gmail.com` as admin
- ✅ Verify the change
- ✅ Display confirmation message

### Step 3: Verify Setup

Run this query in Supabase SQL Editor:

```sql
-- Check if users table exists and has data
SELECT u.id, au.email, u.role, u.created_at 
FROM public.users u 
JOIN auth.users au ON u.id = au.id 
ORDER BY u.created_at DESC;
```

You should see:
```
✅ admin@gmail.com - role: admin
✅ Other users - role: user
```

### Step 4: Test the API

Refresh your admin dashboard page. The API should now work correctly.

## 📊 Database Schema

### Before (Missing)
```
auth.users ❌ → public.users (MISSING!)
         ↓
    profiles
```

### After (Complete)
```
auth.users
    ↓
    ├─→ public.users (roles) ✅
    └─→ public.profiles (profile data) ✅
```

### Users Table Structure
```sql
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    role TEXT NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🔄 How It Works

### 1. Signup Flow
```
User signs up
    ↓
auth.users record created
    ↓
Trigger fires: handle_new_user_role()
    ↓
public.users record created with role='user'
```

### 2. Admin Check Flow
```
API receives request
    ↓
Verify JWT token
    ↓
Query: SELECT role FROM users WHERE id = user.id
    ↓
If role = 'admin' → Allow
If role != 'admin' → Deny (403 Forbidden)
```

## 🧪 Testing Checklist

After running the migrations:

- [ ] Run `setup-users-table.sql` in Supabase
- [ ] Run `set-admin-user.sql` in Supabase
- [ ] Verify admin user: `SELECT * FROM users WHERE role = 'admin'`
- [ ] Refresh admin dashboard page
- [ ] Test withdrawals page loads without 500 error
- [ ] Test broadcast notifications work
- [ ] Verify new signups automatically get 'user' role

## 🐛 Troubleshooting

### Error: "relation 'users' does not exist"
**Solution**: Run `database/setup-users-table.sql`

### Error: "Forbidden" (403)
**Solution**: Run `database/set-admin-user.sql` to make your user an admin

### Error: Still getting 500 errors
**Checklist**:
1. Check Supabase logs for detailed error
2. Verify `users` table exists: `\dt users` or check in Table Editor
3. Verify your user has admin role: `SELECT * FROM users WHERE id = 'YOUR_USER_ID'`
4. Check browser console for error details
5. Restart dev server: `npm run dev`

### To find your user ID:
```sql
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';
```

### To make another user admin:
```sql
UPDATE public.users 
SET role = 'admin' 
WHERE id = 'USER_UUID_HERE';
```

## 🔐 Security Notes

### RLS Policies
- ✅ Users can only read their own role
- ✅ Service role can manage all users
- ✅ Automatic user creation on signup
- ✅ Default role is 'user' (not admin)

### Best Practices
- ⚠️ Admin role must be manually assigned via SQL
- ⚠️ Never expose service role key to frontend
- ⚠️ Always verify admin role in API routes
- ⚠️ Log all admin actions for audit trail

## 📝 Files Involved

### Database Migrations
- `database/setup-users-table.sql` - Creates users table
- `database/set-admin-user.sql` - Sets admin user

### API Routes (Need users table)
- `app/api/admin/withdrawals/route.ts`
- `app/api/admin/withdrawals/[id]/approve/route.ts`
- `app/api/admin/withdrawals/[id]/reject/route.ts`
- `app/api/admin/broadcast/route.ts`
- `app/api/admin/broadcasts/route.ts`

### Enhanced Error Handling
Updated `app/api/admin/withdrawals/route.ts` with:
- Better error messages
- Detection of missing users table
- Detailed logging

## 🚀 Quick Start (TL;DR)

```sql
-- 1. Run this in Supabase SQL Editor
-- (Copy from database/setup-users-table.sql)

-- 2. Run this in Supabase SQL Editor  
-- (Copy from database/set-admin-user.sql)

-- 3. Verify
SELECT u.id, au.email, u.role 
FROM users u 
JOIN auth.users au ON u.id = au.id 
WHERE u.role = 'admin';

-- 4. Refresh your app
```

## 📞 Support

If you continue to have issues:
1. Check the Supabase Dashboard → Logs
2. Check browser DevTools → Console
3. Check terminal output from `npm run dev`
4. Verify environment variables are set correctly

## ✨ After Migration

Once the migrations are complete, you'll have:
- ✅ Working admin dashboard
- ✅ Withdrawal management
- ✅ Broadcast notifications
- ✅ Proper role-based access control
- ✅ Automatic user role assignment on signup
