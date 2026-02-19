# Admin Login Suspense Fix

Fixes:
- `useSearchParams() should be wrapped in a suspense boundary at page "/admin/login"`

Apply:
- Overwrite/add:
  - app/admin/login/page.tsx
  - app/admin/login/AdminLoginClient.tsx

Notes:
- This keeps /admin/login dynamic and avoids Vercel prerender build failures.
- Ensure Vercel env vars exist:
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
