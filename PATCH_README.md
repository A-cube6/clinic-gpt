# ClinicGPT – Supabase Auth + Admin (Patch 01)

This patch adds:
- Supabase Auth (Google + email) using prebuilt Auth UI
- /login for customers
- /admin/login and /admin dashboard shell (Owner + Reception only)
- middleware to keep auth cookies in sync (SSR) and block unauthenticated admin access
- SQL to create the minimal tables + RLS policies

## 1) Install packages
From your repo root:

```bash
npm i @supabase/ssr @supabase/supabase-js @supabase/auth-ui-react @supabase/auth-ui-shared
```

## 2) Add env vars
Create `.env.local` (or update existing):

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## 3) Supabase Dashboard setup
- Create a Supabase project (Free plan is OK).
- Authentication → Providers → enable Google (optional but recommended).
- Authentication → URL Configuration → set Redirect URLs:
  - http://localhost:3000/auth/callback
  - https://YOUR_VERCEL_DOMAIN/auth/callback

## 4) Run SQL
In Supabase SQL Editor, run: `supabase/sql/001_init_mvp.sql`

## 5) Create staff users
- Create 2 users in Supabase Auth (Owner + Reception).
- In Table Editor → profiles, set their role to `owner` or `reception`.
  - Tip: profiles row is auto-created at signup; just edit role.

## 6) Verify
- Visit `/admin` → should redirect to `/admin/login`
- After login (staff), `/admin` should load dashboard.
