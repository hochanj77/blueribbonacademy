# Blue Ribbon Academy Admin Enhancement Branch

## What's New

### Security Fixes
- Tightened RLS policies on catalog_requests, courses, announcements
- Added tutor access policies for enrollments, attendance, report cards
- Student self-access policies for grades, report cards, enrollments

### Admin Dashboard — 2 New Tabs
- **Grades Tab** — Import report cards from Excel (matched to the Blue Ribbon template: Student ID, First Name, Last Name, Class, Semester, Attitude, Homework, Participation, Test/Quiz, Comments)
- **Website Tab** — CMS editor for:
  - Homepage hero text and CTAs
  - Programs page hero and CTA
  - About page (all 4 sections)
  - Contact info (address, phone, email, hours) — updates Contact page + Footer
  - Social media links (Instagram, Google Business) — updates Social page + Footer
  - Course catalog URL

### Student Portal
- `/portal` — unified login (replaces `/parent-portal`)
- `/dashboard` — student dashboard showing:
  - Report cards grouped by semester
  - Resources (catalog download, SAT Platform link)
  - Published announcements
- Students linked to auth accounts via `user_id` on students table
- Header shows "My Dashboard" for logged-in students

### CMS-Powered Pages
- Homepage, Courses, About, Contact, Social, Footer all pull editable text from `site_content` table
- Hardcoded defaults as fallback — zero visual change until admin edits

## Setup Steps

### 1. Run SQL Migration
Copy the contents of `supabase/migrations/20260215120000_security_cms_grades.sql` and run in Supabase SQL Editor.

This creates:
- `site_content` table (seeded with current text)
- `student_grades` table (matches Excel template)
- `student_number` and `user_id` columns on `students` table
- All RLS policies

### 2. Install Dependencies
```bash
npm install xlsx
```

### 3. Copy Files
Replace these files in your repo at the exact paths:
```
src/App.tsx
src/contexts/AuthContext.tsx
src/hooks/useSiteContent.ts
src/components/admin/GradesTab.tsx
src/components/admin/SiteContentTab.tsx
src/components/layout/Header.tsx
src/components/layout/Footer.tsx
src/pages/Admin.tsx
src/pages/Portal.tsx
src/pages/StudentDashboard.tsx  (NEW)
src/pages/Index.tsx
src/pages/Courses.tsx
src/pages/About.tsx
src/pages/Contact.tsx
src/pages/Social.tsx
```

### 4. Assign Student IDs
In Supabase > students table, populate `student_number` for each student (to match Excel imports).

### 5. Link Student Accounts
To give a student portal access:
1. Create a Supabase auth user for them (or have them sign up)
2. Set `user_id` on their students row to match the auth user's ID

### 6. Deploy
No visible changes to the public site — CMS is seeded with current text.
Admin sees 2 new tabs. Students with linked accounts can log in at `/portal`.

