# Login Suspense Fix

Fixes:
- `useSearchParams() should be wrapped in a suspense boundary at page "/login"`

Apply:
- Overwrite/add:
  - app/login/page.tsx
  - app/login/LoginClient.tsx

Notes:
- Keeps /login dynamic to avoid Vercel prerender build failures.
- Requires env vars:
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
