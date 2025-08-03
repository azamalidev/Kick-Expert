# Complete Profile Setup

This guide explains how to set up and use the Complete Profile functionality in your Kick Expert application.

## 🚀 Database Setup

1. **Run the SQL script in Supabase:**
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Copy and paste the contents of `database/setup-profiles.sql`
   - Execute the script

This will create:
- `profiles` table with proper structure
- Row Level Security policies
- `profileimages` storage bucket
- Storage policies for secure image uploads

## 📁 Storage Setup

The storage bucket `profileimages` will be created automatically, but verify:
1. Go to Supabase Dashboard → Storage
2. Confirm `profileimages` bucket exists and is public
3. Bucket should allow:
   - Public read access for profile images
   - Authenticated users can upload their own images

## 🔄 User Flow

1. **User signs up** → Email confirmation required
2. **Email confirmed** → Redirects to `/complete-profile`
3. **Complete profile form** with:
   - Username (pre-filled from signup)
   - Avatar image upload (required)
   - Nationality selection (required)
4. **Form submission** → Creates profile record + uploads image
5. **Success** → Redirects to `/dashboard`

## 🛡️ Security Features

- **RLS (Row Level Security)**: Users can only see/edit their own profiles
- **Image validation**: File type and size restrictions (max 5MB)
- **Unique constraints**: Username must be unique across all users
- **Storage security**: Users can only upload to their own folder path

## 🎨 UI Features

- **Consistent design**: Matches your existing lime green theme
- **Image preview**: Shows selected image before upload
- **Upload progress**: Real-time progress bar during image upload
- **Form validation**: Client-side validation with helpful error messages
- **Loading states**: Disabled form during submission
- **Toast notifications**: Success/error feedback using react-hot-toast

## 📱 Responsive Design

- **Desktop**: Two-column layout (image + form)
- **Mobile**: Single column layout with full-width form
- **Accessibility**: Proper labels, focus states, and keyboard navigation

## 🔧 Technical Details

### Components Used:
- `CompleteProfile.tsx` - Main component
- `/complete-profile/page.tsx` - Next.js page
- `types/user.ts` - TypeScript interfaces
- `auth/callback/page.tsx` - Handles post-signup redirect

### Dependencies:
- Supabase (auth + storage + database)
- Next.js with TypeScript
- Tailwind CSS
- React Hot Toast
- Next/Image for optimized images

### Storage Structure:
```
profileimages/
└── public/
    ├── user-id-1.jpg
    ├── user-id-2.png
    └── user-id-3.jpg
```

## 🐛 Troubleshooting

### Common Issues:

1. **"Profile already exists" error**
   - User already completed profile
   - Check if profile exists before showing form

2. **Image upload fails**
   - Check storage bucket permissions
   - Verify file size < 5MB and valid image format

3. **Username already taken**
   - Username must be unique
   - User needs to choose different username

4. **Redirect issues**
   - Verify auth callback is set up correctly
   - Check Supabase Auth settings in dashboard

## 📋 Database Schema

```sql
profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  nationality TEXT NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

## 🎯 Next Steps

After profile completion, users are redirected to `/dashboard` where they can:
- View their profile information
- Edit profile details
- Participate in competitions
- Access other app features

The profile data is now available throughout your app for personalization and user management.
