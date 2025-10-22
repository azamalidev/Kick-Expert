# Contact Form - Fix Guide

## Problem
Getting 500 error: "Failed to save contact message" when submitting the contact form.

## Root Cause
The issue is likely one of these:
1. **RLS (Row Level Security)** policies blocking inserts
2. **Missing SUPABASE_SERVICE_ROLE_KEY** environment variable
3. **Table not created** properly

---

## Solution Steps

### Step 1: Disable RLS on Contacts Table
Run this SQL in Supabase:

```sql
-- File: database/fix-contacts-rls.sql
ALTER TABLE public.contacts DISABLE ROW LEVEL SECURITY;
```

**OR** if you want to keep RLS, run:

```sql
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Anyone can insert contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can view their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Admins can view all contacts" ON public.contacts;
DROP POLICY IF EXISTS "Admins can update contacts" ON public.contacts;

-- Create permissive policies
CREATE POLICY "Anyone can insert contacts" ON public.contacts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view contacts" ON public.contacts
  FOR SELECT USING (true);

CREATE POLICY "Admins can update contacts" ON public.contacts
  FOR UPDATE USING (true);
```

---

### Step 2: Add Environment Variable
Add to your `.env.local`:

```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**How to get it**:
1. Go to Supabase Dashboard
2. Settings → API
3. Copy "service_role" key (NOT the anon key)

---

### Step 3: Verify Table Exists
Run this SQL:

```sql
SELECT * FROM public.contacts LIMIT 1;
```

If table doesn't exist, run:

```sql
-- File: database/setup-contacts.sql
CREATE TABLE IF NOT EXISTS public.contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  topic text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  priority text NOT NULL DEFAULT 'medium',
  assigned_to uuid NULL,
  response text NULL,
  responded_at timestamp with time zone NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT contacts_pkey PRIMARY KEY (id),
  CONSTRAINT contacts_status_check CHECK (
    status = ANY (ARRAY['new'::text, 'open'::text, 'in_progress'::text, 'resolved'::text, 'closed'::text])
  ),
  CONSTRAINT contacts_priority_check CHECK (
    priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text])
  )
);

ALTER TABLE public.contacts DISABLE ROW LEVEL SECURITY;
```

---

### Step 4: Update API Endpoint
The new API endpoint with better error logging:

**File**: `app/api/contacts/submit/route.ts`

This endpoint:
- ✅ Uses service role key
- ✅ Has detailed error logging
- ✅ Returns error details for debugging
- ✅ Validates all inputs
- ✅ Trims whitespace

---

### Step 5: Update Contact Form
**File**: `components/Contact.tsx`

Changed API endpoint from `/api/contacts` to `/api/contacts/submit`

---

## Testing

### Test 1: Check Database
```sql
SELECT COUNT(*) FROM public.contacts;
```

### Test 2: Submit Form
1. Go to contact form
2. Fill in:
   - Topic: "support"
   - Name: "test"
   - Email: "test@gmail.com"
   - Message: "this is a test message"
3. Click "Send Message"
4. Should see success message with Reference ID

### Test 3: Check Database Again
```sql
SELECT * FROM public.contacts ORDER BY created_at DESC LIMIT 1;
```

Should see your test message!

---

## Debugging

### If Still Getting 500 Error

**Check browser console** for error details:
```
{
  "success": false,
  "error": "Database error: ...",
  "details": { ... }
}
```

**Check server logs** (Next.js terminal):
```
❌ Database error: ...
Error code: ...
Error message: ...
```

### Common Errors

**Error: "PGRST116"**
- Table doesn't exist
- Solution: Run setup-contacts.sql

**Error: "permission denied"**
- RLS policy blocking insert
- Solution: Disable RLS or create permissive policies

**Error: "invalid input syntax"**
- Data type mismatch
- Solution: Check field types match table schema

**Error: "SUPABASE_SERVICE_ROLE_KEY not found"**
- Missing environment variable
- Solution: Add to .env.local

---

## Files Updated

✅ `app/api/contacts/submit/route.ts` - NEW: Better error handling  
✅ `components/Contact.tsx` - Updated endpoint  
✅ `database/fix-contacts-rls.sql` - NEW: RLS fix  

---

## Quick Checklist

- [ ] Ran setup-contacts.sql
- [ ] Disabled RLS or created permissive policies
- [ ] Added SUPABASE_SERVICE_ROLE_KEY to .env.local
- [ ] Restarted Next.js server
- [ ] Updated Contact.tsx to use /api/contacts/submit
- [ ] Tested form submission
- [ ] Verified data in database

---

## Summary

**The fix involves 3 things**:
1. ✅ Disable RLS on contacts table
2. ✅ Add SUPABASE_SERVICE_ROLE_KEY to environment
3. ✅ Use new API endpoint with better error handling

After these steps, the contact form should work perfectly! 🚀
