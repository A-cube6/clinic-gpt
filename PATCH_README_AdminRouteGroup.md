# Admin Route Group Patch

This patch prevents /admin/login from being wrapped by the protected admin layout.

## What it changes
- app/admin/layout.tsx is now PUBLIC (no auth checks)
- Protected admin pages live under: app/admin/(protected)/...
  - app/admin/(protected)/layout.tsx (role gate)
  - app/admin/(protected)/page.tsx (dashboard)

## After applying
1) Delete (or rename) your old dashboard file if it exists:
   - app/admin/page.tsx  (optional but recommended to avoid confusion)

2) Keep your login page where it is:
   - app/admin/login/page.tsx

Expected:
- /admin/login loads without redirect loops
- /admin redirects to /admin/login if not logged in (middleware)
- /admin loads dashboard if role is owner/reception
