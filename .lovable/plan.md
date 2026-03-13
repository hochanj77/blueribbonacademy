

# Security and Code Quality Fixes Plan

This plan covers all 16 fixes from the audit document, organized by priority. None of these changes affect the visible UI or website performance — they are backend hardening, dead code removal, and minor accessibility improvements.

---

## PHASE 1: Critical Security (4 fixes)

### 1.1 CORS Restriction on All Edge Functions
Restrict `Access-Control-Allow-Origin` from `*` to the production domain in all 4 edge functions. Requires setting an `ALLOWED_ORIGIN` secret. Falls back to `https://prephaus.academy`.

**Files:** `activate-account`, `admin-users`, `login-with-student-id`, `verify-student`

**Major change note:** After deployment, requests from domains other than `prephaus.academy` (including the Lovable preview URL) will be blocked. You will need the `ALLOWED_ORIGIN` secret set before this works. I will prompt you to add it.

### 1.2 Email Substitution Fix in Account Activation
Use the email already on file in the students table (if one exists) instead of blindly trusting the client-provided email.

**File:** `activate-account/index.ts` — one line change

### 1.3 Contact Form — Actually Save Submissions
Create a `contact_submissions` table with RLS (anyone can insert, only admins can read). Update `Contact.tsx` to insert into the table instead of faking a delay.

**Files:** New DB migration + `src/pages/Contact.tsx`

### 1.4 Rate Limiting on Admin Password Verification
Add in-memory rate limiting (5 attempts/60s per user) to the `verify_password` action in `admin-users`.

**File:** `admin-users/index.ts`

---

## PHASE 2: High Security (3 fixes)

### 2.1 Student Record Enumeration Prevention
Change `verify-student` to always return a generic message instead of `found: true/false`. The client-side activation flow does not depend on this distinction (it calls `activate-account` directly).

**File:** `verify-student/index.ts`

### 2.2 Student-Number Rate Limiting on Login
Add a second rate limit dimension keyed by student number (in addition to IP) in `login-with-student-id`.

**File:** `login-with-student-id/index.ts`

### 2.3 Use SDK for Storage URLs
Replace manually constructed storage URLs with `supabase.storage.from(...).getPublicUrl(...)` in `ResourcesTab.tsx` and `StudentDashboard.tsx`.

**Files:** `ResourcesTab.tsx`, `StudentDashboard.tsx`

---

## PHASE 3: Medium Fixes (8 fixes)

### 3.1 Remove Unused `signUp` from AuthContext
Remove the `signUp` function from the context — no component uses it.

**File:** `AuthContext.tsx`

### 3.2 Remove Unused Imports in Index.tsx
Remove `useNavigate` and `useAuth` imports and their hook calls (unused variables).

**File:** `Index.tsx`

### 3.3 Dynamic Term Options in ReportCardsTab
Replace hardcoded term list with a generated function (previous year through next year).

**File:** `ReportCardsTab.tsx`

### 3.4 Dynamic Year Start in GradesTab
Change `startYear = 2024` to `now.getFullYear() - 2`.

**File:** `GradesTab.tsx`

### 3.5 Email Validation on Student Import
Add email format validation in the `StudentsTab` import parser.

**File:** `StudentsTab.tsx`

### 3.6 Stronger Password Policy
Enforce uppercase + lowercase + number + special character (min 8 chars) in both the edge function and the client-side Portal form.

**Files:** `activate-account/index.ts`, `Portal.tsx`

### 3.7 Generic Error Messages in admin-users
Replace the catch block to not leak internal error details.

**File:** `admin-users/index.ts`

### 3.8 Add `aria-expanded` to Mobile Menu Button
One attribute addition for accessibility.

**File:** `Header.tsx`

---

## PHASE 4: Dead Code Cleanup (3 fixes)

### 4.1 Delete 24 Unused UI Components
Remove files from `src/components/ui/` that are not imported anywhere.

### 4.2 Clean Up App.css
Remove Vite starter template CSS, keeping only the `#root` rule.

### 4.3 Remove Duplicate Toast Hook
Delete `src/components/ui/use-toast.ts` (re-export of `src/hooks/use-toast.ts`).

---

## Implementation Order

1. Set the `ALLOWED_ORIGIN` secret (required before CORS fix deploys)
2. Create `contact_submissions` table via migration
3. Apply all edge function changes (CORS, rate limiting, email fix, generic errors, password policy, enumeration)
4. Apply all frontend changes (Contact form, Portal password policy, storage URLs, unused code, accessibility)
5. Delete unused files

**Zero UI/visual changes.** The only user-facing difference is that the contact form will actually save data, and password requirements become stricter on the activation form (placeholder text updates).

