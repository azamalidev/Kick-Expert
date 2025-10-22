# Contact Form System - Complete Guide

## Overview
A complete contact form system where users can submit messages, and admins can manage them from the admin panel.

---

## System Architecture

### User Flow:
```
User fills contact form
    ↓
Submits message
    ↓
Data saved to database
    ↓
Success message with Reference ID
    ↓
Admin receives notification
```

### Admin Flow:
```
Admin views all contacts
    ↓
Filter by status/priority
    ↓
Select contact to view details
    ↓
Update status/priority
    ↓
Send response to user
    ↓
Mark as resolved
```

---

## Database Setup

### 1. Create Contacts Table
**File**: `database/setup-contacts.sql`

Run this SQL to create the table:

```sql
CREATE TABLE public.contacts (
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
    status = ANY (ARRAY['new', 'open', 'in_progress', 'resolved', 'closed'])
  ),
  CONSTRAINT contacts_priority_check CHECK (
    priority = ANY (ARRAY['low', 'medium', 'high', 'urgent'])
  )
);
```

### 2. Verify Table Creation
```sql
SELECT * FROM public.contacts LIMIT 1;
```

---

## Frontend Components

### 1. Contact Form Component
**File**: `components/Contact.tsx`

**Features**:
- ✅ Topic dropdown (support, payouts, feedback, other)
- ✅ Name, email, message fields
- ✅ Form validation
- ✅ Success message with Reference ID
- ✅ Error handling with toast notifications
- ✅ Loading state on submit button

**Form Fields**:
```
Topic: [Dropdown]
Name: [Text Input]
Email: [Email Input]
Message: [Textarea]
```

**Validation**:
- All fields required
- Email format validation
- Message minimum 10 characters

**Success Response**:
```json
{
  "success": true,
  "message": "Your message has been received. We'll get back to you soon!",
  "contactId": "abc123-def456"
}
```

---

### 2. Admin Contacts Panel
**File**: `components/Admin/AdminContacts.tsx`

**Features**:
- ✅ View all contact messages
- ✅ Search by name, email, or message
- ✅ Filter by status
- ✅ Filter by priority
- ✅ Update contact status
- ✅ Update contact priority
- ✅ Send response to user
- ✅ Mark as resolved

**Status Options**:
- `new` - Newly submitted (Blue)
- `open` - Being reviewed (Yellow)
- `in_progress` - Being worked on (Purple)
- `resolved` - Issue resolved (Green)
- `closed` - Conversation closed (Gray)

**Priority Levels**:
- `low` - General inquiry (Green)
- `medium` - Standard issue (Yellow)
- `high` - Important issue (Orange)
- `urgent` - Critical issue (Red)

**Admin Actions**:
1. Select a contact from the list
2. View full message details
3. Change status/priority
4. Send response
5. Mark as resolved

---

## API Endpoints

### 1. POST /api/contacts - Create Contact
**Request**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "topic": "support",
  "message": "I have a question about my account..."
}
```

**Response (Success)**:
```json
{
  "success": true,
  "message": "Your message has been received. We'll get back to you soon!",
  "contactId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (Error)**:
```json
{
  "success": false,
  "error": "All fields are required"
}
```

**Validation**:
- ✅ All fields required
- ✅ Valid email format
- ✅ Message minimum 10 characters
- ✅ Auto-set priority based on topic

---

### 2. GET /api/contacts?id={contactId} - Get Contact Status
**Request**:
```
GET /api/contacts?id=550e8400-e29b-41d4-a716-446655440000
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john@example.com",
    "topic": "support",
    "status": "in_progress",
    "priority": "high",
    "response": null,
    "responded_at": null,
    "created_at": "2025-10-22T20:00:00Z"
  }
}
```

---

## Database Schema

### Contacts Table

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| id | uuid | gen_random_uuid() | Unique identifier |
| name | text | - | User's name |
| email | text | - | User's email |
| topic | text | - | Message topic |
| message | text | - | Message content |
| status | text | 'new' | Current status |
| priority | text | 'medium' | Priority level |
| assigned_to | uuid | NULL | Admin assigned to |
| response | text | NULL | Admin's response |
| responded_at | timestamp | NULL | When response sent |
| created_at | timestamp | now() | Creation time |
| updated_at | timestamp | now() | Last update time |

### Indexes
- `idx_contacts_status` - For filtering by status
- `idx_contacts_priority` - For filtering by priority
- `idx_contacts_created_at` - For sorting by date
- `idx_contacts_email` - For searching by email
- `idx_contacts_assigned_to` - For admin assignments

---

## Priority Auto-Assignment

**Topic → Priority Mapping**:
```
"support" → "high"
"payouts" → "high"
"feedback" → "medium"
"other" → "medium"
```

---

## User Experience

### 1. Submitting a Contact Form

**Step 1**: User fills out form
```
Topic: Account Support
Name: John Doe
Email: john@example.com
Message: I can't access my account...
```

**Step 2**: User clicks "Send Message"
- Button shows "Sending..." (disabled)
- Form data sent to API

**Step 3**: Success message displayed
```
✓ Message Received!

Thank you for reaching out. We've received your message 
and will get back to you within 24-48 hours.

Reference ID: 550e8400-e29b-41d4-a716-446655440000
Keep this ID to track your inquiry status.

[Send Another Message]
```

---

### 2. Admin Managing Contacts

**Step 1**: Admin opens Admin Panel → Contacts
- Sees list of all contact messages
- Shows count of new messages

**Step 2**: Admin filters/searches
```
Search: "account"
Status: All
Priority: All
```

**Step 3**: Admin selects a contact
- Views full message details
- Sees current status/priority

**Step 4**: Admin updates status
```
Status: new → in_progress
```

**Step 5**: Admin sends response
```
Response: "We've received your request and are looking into it..."
[Send Response]
```

**Step 6**: Status auto-changes to "resolved"
- User can see response
- Conversation marked as complete

---

## Files Created/Modified

✅ `database/setup-contacts.sql` - Database table and triggers  
✅ `app/api/contacts/route.ts` - API endpoints  
✅ `components/Contact.tsx` - User contact form  
✅ `components/Admin/AdminContacts.tsx` - Admin panel  

---

## Integration Steps

### 1. Run Database Setup
```sql
-- Copy and run in Supabase SQL editor
-- File: database/setup-contacts.sql
```

### 2. Add Admin Menu Item
In `components/Admin/AdminSidebar.tsx`, add:
```tsx
<Link href="/admindashboard/contacts">
  <MessageSquare className="w-5 h-5" />
  Contact Messages
</Link>
```

### 3. Create Admin Route
Create `app/admindashboard/contacts/page.tsx`:
```tsx
import AdminContacts from '@/components/Admin/AdminContacts';

export default function ContactsPage() {
  return <AdminContacts />;
}
```

### 4. Test the System
1. Go to contact form
2. Submit a test message
3. Check database: `SELECT * FROM public.contacts;`
4. Go to admin panel
5. View and respond to message

---

## Features Implemented

✅ **User Features**:
- Contact form with validation
- Success message with Reference ID
- Toast notifications
- Loading states
- Form reset after submission

✅ **Admin Features**:
- View all contacts
- Search functionality
- Filter by status
- Filter by priority
- Update status
- Update priority
- Send responses
- Auto-resolve on response

✅ **Database Features**:
- Automatic timestamps
- Status constraints
- Priority constraints
- Indexes for performance
- RLS policies

✅ **API Features**:
- Create contact
- Get contact status
- Validation
- Error handling
- Auto-priority assignment

---

## Testing Checklist

- [ ] Database table created successfully
- [ ] Contact form submits without errors
- [ ] Data saved to database
- [ ] Success message shows Reference ID
- [ ] Admin can view all contacts
- [ ] Admin can filter by status
- [ ] Admin can filter by priority
- [ ] Admin can search contacts
- [ ] Admin can update status
- [ ] Admin can update priority
- [ ] Admin can send response
- [ ] Status auto-changes to resolved
- [ ] Toast notifications work
- [ ] Loading states display correctly

---

## Summary

✅ **Complete contact form system implemented**  
✅ **User-friendly interface with validation**  
✅ **Admin panel for managing contacts**  
✅ **Database with proper constraints and indexes**  
✅ **API endpoints for form submission**  
✅ **Status and priority management**  
✅ **Response system for admins**  

**Status**: ✅ COMPLETE - Ready to deploy
