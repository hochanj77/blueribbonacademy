

# Additional Security Fixes

Three items to add to the existing plan.

---

## 1. Generic errors in activate-account

In `supabase/functions/activate-account/index.ts`, merge the two distinct error branches (lines 53-68) into one generic message. Both the "no pending student found" (404) and "already activated" (409) cases will return the same response:

> `"Unable to activate. Please check your information or contact PrepHaus administration."`

Both return status 400. This prevents attackers from probing which Student IDs exist or are already activated.

## 2. Remove student_id from verify-student response

In `supabase/functions/verify-student/index.ts` line 52, change:
```
{ found: true, student_id: student.id }
```
to:
```
{ found: true }
```

The new `parent-signup` edge function (from the existing plan) handles the lookup server-side, so the client never needs the UUID.

## 3. Rate limiting on login-with-student-id

In `supabase/functions/login-with-student-id/index.ts`, add in-memory rate limiting at the top of the function:

- A `Map<string, { count: number, resetAt: number }>` keyed by client IP (from `req.headers.get("x-forwarded-for")` or `"unknown"`)
- Allow 5 attempts per 60-second window per IP
- On exceeding the limit, return 429 with `"Too many login attempts. Please try again later."`
- Clean up expired entries on each request to prevent memory leaks

This is basic but effective for edge function deployments. It resets on cold starts, which is acceptable — it still prevents sustained brute-force attacks.

---

## Files Modified

| File | Change |
|------|--------|
| `supabase/functions/activate-account/index.ts` | Merge error messages to generic |
| `supabase/functions/verify-student/index.ts` | Remove `student_id` from response |
| `supabase/functions/login-with-student-id/index.ts` | Add IP-based rate limiting |

