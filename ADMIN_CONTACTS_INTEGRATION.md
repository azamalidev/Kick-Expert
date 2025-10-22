# Admin Panel - Contact Messages Integration

## Overview
The Admin Panel now has a complete "Contact Messages" section where admins can view, manage, and respond to user contact submissions.

---

## What's Been Added

### 1. Admin Sidebar Menu Item
**File**: `components/Admin/AdminSidebar.tsx`

Added new menu item:
```tsx
{ label: "Contact Messages", icon: MessageSquare, href: "/admindashboard/contacts" }
```

**Location in menu**: Between "Refunds" and "Anti-Cheat"

---

### 2. Admin Contacts Page
**File**: `app/admindashboard/contacts/page.tsx`

Creates the route: `/admindashboard/contacts`

Displays the AdminContacts component with header

---

### 3. Admin Contacts Component
**File**: `components/Admin/AdminContacts.tsx`

**Features**:
- ✅ View all contact messages
- ✅ Search by name, email, or message
- ✅ Filter by status (new, open, in_progress, resolved, closed)
- ✅ Filter by priority (low, medium, high, urgent)
- ✅ Update contact status
- ✅ Update contact priority
- ✅ Send response to user
- ✅ Auto-mark as resolved when response sent
- ✅ Color-coded badges for status and priority

---

## Admin Dashboard Flow

### 1. Access Contact Messages
```
Admin Dashboard
    ↓
Sidebar → "Contact Messages"
    ↓
/admindashboard/contacts
```

### 2. View All Contacts
- Shows list of all submitted contact messages
- Displays count of total messages
- Shows count of new messages

### 3. Search and Filter
```
Search: [Search by name, email, or message]
Status: [All / new / open / in_progress / resolved / closed]
Priority: [All / low / medium / high / urgent]
[Refresh Button]
```

### 4. Select a Contact
- Click on any row in the table
- View full message details on the right panel
- See contact information (name, email)

### 5. Manage Contact
**Update Status**:
```
Status: [Dropdown]
- new
- open
- in_progress
- resolved
- closed
```

**Update Priority**:
```
Priority: [Dropdown]
- low
- medium
- high
- urgent
```

### 6. Send Response
```
[Response Textarea]
[Send Response Button]
```

When response is sent:
- Status auto-changes to "resolved"
- Response is saved to database
- Timestamp recorded

---

## Contact Status Meanings

| Status | Color | Meaning |
|--------|-------|---------|
| **new** | Blue | Newly submitted, not yet reviewed |
| **open** | Yellow | Being reviewed by admin |
| **in_progress** | Purple | Being actively worked on |
| **resolved** | Green | Issue resolved, response sent |
| **closed** | Gray | Conversation closed |

---

## Contact Priority Meanings

| Priority | Color | Meaning |
|----------|-------|---------|
| **low** | Green | General inquiry, can wait |
| **medium** | Yellow | Standard issue, normal response time |
| **high** | Orange | Important issue, needs attention |
| **urgent** | Red | Critical issue, needs immediate attention |

---

## Auto-Priority Assignment

When a contact is submitted, priority is auto-assigned based on topic:

```
Topic: "support" → Priority: "high"
Topic: "payouts" → Priority: "high"
Topic: "feedback" → Priority: "medium"
Topic: "other" → Priority: "medium"
```

Admins can override this manually.

---

## Admin Panel Layout

```
┌─────────────────────────────────────────────────────────┐
│ Contact Messages                                        │
│ Total: 15 | New: 3                                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ [Search] [Status Filter] [Priority Filter] [Refresh]  │
│                                                         │
├──────────────────────────────┬──────────────────────────┤
│                              │                          │
│  Contact List                │  Contact Details         │
│  ┌──────────────────────┐   │  ┌──────────────────────┐ │
│  │ Name | Topic | Status│   │  │ Name: John Doe       │ │
│  │ John | support| new  │   │  │ Email: john@...      │ │
│  │ Jane | payouts| open │   │  │ Status: [Dropdown]   │ │
│  │ Bob  | feedback|res. │   │  │ Priority: [Dropdown] │ │
│  │      |        |      │   │  │                      │ │
│  │      |        |      │   │  │ Message:             │ │
│  │      |        |      │   │  │ [Message text...]    │ │
│  │      |        |      │   │  │                      │ │
│  │      |        |      │   │  │ Response:            │ │
│  │      |        |      │   │  │ [Response textarea]  │ │
│  │      |        |      │   │  │ [Send Response]      │ │
│  └──────────────────────┘   │  └──────────────────────┘ │
│                              │                          │
└──────────────────────────────┴──────────────────────────┘
```

---

## Usage Example

### Scenario: Admin Reviews New Contact

**Step 1**: Admin opens Admin Dashboard
- Clicks "Contact Messages" in sidebar

**Step 2**: Admin sees list of contacts
```
Total: 15 messages
New: 3 messages
```

**Step 3**: Admin filters to see only new messages
```
Status Filter: "new"
```

**Step 4**: Admin selects first new message
```
Name: John Doe
Email: john@example.com
Topic: support
Message: "I can't access my account..."
Status: new
Priority: high
```

**Step 5**: Admin updates status
```
Status: new → in_progress
```

**Step 6**: Admin sends response
```
Response: "We've received your request and are looking into it. 
We'll get back to you within 24 hours."
[Send Response]
```

**Result**:
- Status auto-changes to "resolved"
- Response saved to database
- Timestamp recorded
- Message marked as complete

---

## Database Operations

### View All Contacts
```sql
SELECT * FROM public.contacts 
ORDER BY created_at DESC;
```

### View New Contacts
```sql
SELECT * FROM public.contacts 
WHERE status = 'new'
ORDER BY created_at DESC;
```

### View High Priority Contacts
```sql
SELECT * FROM public.contacts 
WHERE priority = 'high'
ORDER BY created_at DESC;
```

### Update Contact Status
```sql
UPDATE public.contacts
SET status = 'in_progress'
WHERE id = 'contact-id';
```

### Send Response
```sql
UPDATE public.contacts
SET response = 'Admin response text',
    responded_at = NOW(),
    status = 'resolved'
WHERE id = 'contact-id';
```

---

## Files Created/Modified

✅ `components/Admin/AdminSidebar.tsx` - Added Contacts menu item  
✅ `app/admindashboard/contacts/page.tsx` - NEW: Admin contacts page  
✅ `components/Admin/AdminContacts.tsx` - Admin contacts component (already created)  

---

## Features Summary

✅ **View all contact messages**  
✅ **Search functionality** (name, email, message)  
✅ **Filter by status** (new, open, in_progress, resolved, closed)  
✅ **Filter by priority** (low, medium, high, urgent)  
✅ **Update status** with dropdown  
✅ **Update priority** with dropdown  
✅ **Send responses** to users  
✅ **Auto-resolve** when response sent  
✅ **Color-coded badges** for quick identification  
✅ **Responsive design** (works on mobile/tablet)  
✅ **Real-time updates** (refresh button)  

---

## Testing Checklist

- [ ] Admin sidebar shows "Contact Messages" menu item
- [ ] Clicking menu item goes to /admindashboard/contacts
- [ ] Page displays all contacts
- [ ] Search functionality works
- [ ] Status filter works
- [ ] Priority filter works
- [ ] Can select a contact
- [ ] Can update status
- [ ] Can update priority
- [ ] Can send response
- [ ] Status auto-changes to resolved
- [ ] Response displays in contact details
- [ ] Refresh button works
- [ ] Color badges display correctly

---

## Summary

✅ **Admin Panel Integration Complete**  
✅ **Contact Messages accessible from sidebar**  
✅ **Full CRUD operations for contacts**  
✅ **Search and filter functionality**  
✅ **Response system for admins**  
✅ **Status and priority management**  

**Status**: ✅ COMPLETE - Admin can now manage all contact messages! 🎉
